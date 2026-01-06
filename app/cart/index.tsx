import { Ionicons } from '@expo/vector-icons';
import { IconScooter } from '@tabler/icons-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { orderAPI } from '../../lib/api';
import { calculateDistance } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { useUserStore } from '../../store/userStore';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    getTotalPrice,
    getVariantKey,
    syncLocalCartToBackend,
  } = useCartStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const addresses = useLocationStore((state) => state.addresses);
  const isLoadingAddresses = useLocationStore((state) => state.isLoading);
  const loadAddresses = useLocationStore((state) => state.loadAddresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectedStore = useLocationStore((state) => state.selectedStore);
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;
  const total = getTotalPrice();

  // Determine if user has addresses (only after loading is complete)
  const hasAddresses = !isLoadingAddresses && addresses.length > 0;

  // Check if selected address has all required fields for order placement
  const isAddressComplete =
    selectedAddress &&
    selectedAddress.contactName &&
    selectedAddress.contactPhone &&
    (selectedAddress.apartment || selectedAddress.street);

  // Check if selected address is incomplete (has location but missing details)
  const isAddressIncomplete = selectedAddress && !isAddressComplete;

  // Load addresses when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadAddresses();
    }
  }, [isLoggedIn, loadAddresses]);

  const loadCart = useCartStore((state) => state.loadCart);

  // Reload addresses and cart when screen comes into focus (e.g., after adding address)
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        loadAddresses();
        // Load cart when cart screen comes into focus
        loadCart();
      }
    }, [isLoggedIn, loadAddresses, loadCart])
  );

  // Calculate distance from store to delivery address
  let distance: number | null = null;
  if (selectedStore?.location?.coordinates && selectedAddress?.coordinates) {
    const [storeLng, storeLat] = selectedStore.location.coordinates;
    const { latitude: deliveryLat, longitude: deliveryLng } =
      selectedAddress.coordinates;
    distance = calculateDistance(storeLat, storeLng, deliveryLat, deliveryLng);
  }

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash' | 'upi' | 'card' | null
  >(null);

  // Order placement state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Ensure prices are valid numbers
  const getValidatedPrice = (price: any): number => {
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  };

  // Mock coupon validation - replace with actual API call
  const validateCoupon = async (
    code: string
  ): Promise<{
    valid: boolean;
    discount?: number;
    type?: 'percentage' | 'fixed';
    message?: string;
  }> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock coupon codes - replace with actual API integration
    const validCoupons: Record<
      string,
      { discount: number; type: 'percentage' | 'fixed' }
    > = {
      SAVE10: { discount: 10, type: 'percentage' },
      SAVE20: { discount: 20, type: 'percentage' },
      FLAT50: { discount: 50, type: 'fixed' },
      FLAT100: { discount: 100, type: 'fixed' },
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (coupon) {
      return {
        valid: true,
        discount: coupon.discount,
        type: coupon.type,
        message: 'Coupon applied successfully!',
      };
    }
    return {
      valid: false,
      message: 'Invalid coupon code',
    };
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    if (appliedCoupon) {
      Alert.alert(
        'Info',
        'A coupon is already applied. Remove it first to apply a new one.'
      );
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await validateCoupon(couponCode);
      if (result.valid && result.discount && result.type) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount: result.discount,
          type: result.type,
        });
        setCouponCode('');
        Alert.alert(
          'Success',
          result.message || 'Coupon applied successfully!'
        );
      } else {
        Alert.alert('Error', result.message || 'Invalid coupon code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate coupon. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePlaceOrder = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      router.push('/login?redirect=/cart');
      return;
    }

    // Validation
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Select Address',
          onPress: () => router.push('/profile/address'),
        },
      ]);
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Sync local cart to backend before placing order
      // This ensures all local cart items are saved to the backend
      try {
        await syncLocalCartToBackend();
        // Wait a bit for sync to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (syncError) {
        console.warn(
          'Failed to sync cart before order, continuing anyway:',
          syncError
        );
        // Continue with order placement even if sync fails
      }

      // Map payment method to backend format
      const paymentMethodMap: Record<string, 'cod' | 'online' | 'wallet'> = {
        cash: 'cod',
        upi: 'online',
        card: 'online',
      };

      // Check if address ID is a valid MongoDB ObjectId
      // If not, send address details instead
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(selectedAddress.id);

      // Get storeId from selected store
      if (!selectedStore?._id) {
        Alert.alert(
          'Error',
          'Store not selected. Please select a delivery location.'
        );
        setIsPlacingOrder(false);
        return;
      }

      const orderData: any = {
        storeId: selectedStore._id,
        paymentMethod: paymentMethodMap[selectedPaymentMethod] || 'cod',
        couponCode: appliedCoupon?.code,
        deliveryFee: deliveryFee,
        tax: 0, // Tax can be calculated on backend if needed
        discount: discountAmount,
      };

      if (isValidObjectId) {
        // Valid ObjectId - use it directly
        orderData.deliveryAddressId = selectedAddress.id;
      } else {
        // Not a valid ObjectId - send address details
        orderData.addressDetails = {
          address: selectedAddress.address,
          label: selectedAddress.label,
          isDefault: selectedAddress.isDefault || false,
        };
      }

      const response = await orderAPI.createOrder(orderData);

      if (response.success && response.data?.order) {
        // Clear cart after successful order
        await useCartStore.getState().clearCart();

        // Show success message
        Alert.alert(
          'Order Placed Successfully!',
          `Your order #${response.data.order.orderNumber} has been placed.`,
          [
            {
              text: 'View Orders',
              onPress: () => {
                // Navigate to orders page
                router.push('/profile/orders');
              },
            },
            {
              text: 'Continue Shopping',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Order placement error:', error);

      // Try to extract error message and stock errors
      let errorMessage =
        error.message || 'Failed to place order. Please try again.';
      let stockErrors: string[] = [];

      // Check if error response contains stockErrors
      if (error.data) {
        // Error data is already parsed from the API response
        if (error.data.stockErrors && Array.isArray(error.data.stockErrors)) {
          stockErrors = error.data.stockErrors;
        }
        if (error.data.message) {
          errorMessage = error.data.message;
        }
      }

      // Show appropriate error message
      if (stockErrors.length > 0) {
        const displayMessage = stockErrors.join('\n');
        Alert.alert('Stock Unavailable', displayMessage, [
          {
            text: 'OK',
            onPress: () => {
              // Reload cart to reflect current stock
              useCartStore.getState().loadCart();
            },
          },
        ]);
      } else if (
        errorMessage.toLowerCase().includes('stock') ||
        errorMessage.toLowerCase().includes('insufficient')
      ) {
        Alert.alert('Stock Unavailable', errorMessage, [
          {
            text: 'OK',
            onPress: () => {
              // Reload cart to reflect current stock
              useCartStore.getState().loadCart();
            },
          },
        ]);
      } else {
        Alert.alert('Order Failed', errorMessage);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const deliveryFee = 50;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = (total * appliedCoupon.discount) / 100;
    } else {
      discountAmount = Math.min(appliedCoupon.discount, total);
    }
  }

  const finalTotal = Math.max(0, total + deliveryFee - discountAmount);

  return (
    <View style={styles.container}>
      <Header showBack={true} title='My Cart' />
      {items.length > 0 && selectedAddress && (
        <TouchableOpacity
          style={styles.addressContainer}
          onPress={() => {
            // If address is incomplete, navigate to add/edit address
            if (isAddressIncomplete) {
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(
                selectedAddress.id
              );
              if (isValidObjectId) {
                router.push(`/profile/address?edit=${selectedAddress.id}`);
              } else {
                router.push('/profile/add-address');
              }
            } else {
              router.push('/profile/address');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.addressInfo}>
            <View style={styles.addressInfoContainer}>
              <Ionicons name='location' size={18} color='#4CAF50' />
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              {isAddressIncomplete && (
                <View style={styles.incompleteBadge}>
                  <Text style={styles.incompleteBadgeText}>Incomplete</Text>
                </View>
              )}
              {distance !== null && !isAddressIncomplete && (
                <View style={styles.distanceBadge}>
                  <Ionicons name='navigate' size={12} color='#009ECA' />
                  <Text style={styles.distanceText}>{distance} km</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress.address}
            </Text>
            {isAddressIncomplete && (
              <Text style={styles.incompleteText}>
                Tap to add name, phone & house number
              </Text>
            )}
          </View>
          <Ionicons name='chevron-forward' size={18} color='#666' />
        </TouchableOpacity>
      )}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='cart-outline' size={64} color='#ccc' />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          <View style={styles.cartItemsContainer}>
            {items.map((item) => {
              const sellingPrice = getValidatedPrice(item.sellingPrice);
              const originalPrice = getValidatedPrice(item.originalPrice);
              const discount = getValidatedPrice(item.discount);
              const itemTotal = sellingPrice * item.quantity;
              // Display variant size/unit - each variant appears as a separate cart item
              const variantDisplay = item.selectedVariant
                ? `${item.selectedVariant.size} ${item.selectedVariant.unit}`
                : `${item.size} ${item.unit}`;
              return (
                <View
                  key={getVariantKey(item._id, item.selectedVariant)}
                  style={styles.cartItem}
                >
                  {/* Product Image */}
                  <View style={styles.imageContainer}>
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>
                          {item.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Product Details */}
                  <View style={styles.productDetailsContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {/* Variant badge - makes it clear this is a specific size/unit */}
                    <View style={styles.priceRow}>
                      <View style={styles.variantBadge}>
                        <Text style={styles.variantBadgeText}>
                          {variantDisplay}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ₹{Math.round(sellingPrice)}
                      </Text>
                      {discount > 0 && originalPrice > 0 && (
                        <Text style={styles.originalPrice}>
                          ₹{Math.round(originalPrice)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.quantityDetailsContainer}>
                    {/* Total Price */}
                    <Text style={styles.itemTotal}>
                      ₹{Math.round(itemTotal)}
                    </Text>
                    {/* Quantity Controls */}
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(
                            item._id,
                            item.quantity - 1,
                            item.selectedVariant
                          )
                        }
                      >
                        <Ionicons name='remove' size={18} color='#568627' />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(
                            item._id,
                            item.quantity + 1,
                            item.selectedVariant
                          )
                        }
                      >
                        <Ionicons name='add' size={18} color='#568627' />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.summary}>
          {/* Coupon Code Section */}
          {items.length > 0 && (
            <>
              {appliedCoupon ? (
                <View style={styles.appliedCouponContainer}>
                  <View style={styles.appliedCouponInfo}>
                    <Ionicons
                      name='checkmark-circle'
                      size={20}
                      color='#4CAF50'
                    />
                    <Text style={styles.appliedCouponText}>
                      {appliedCoupon.code} -{' '}
                      {appliedCoupon.type === 'percentage'
                        ? `${appliedCoupon.discount}% OFF`
                        : `₹${appliedCoupon.discount} OFF`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleRemoveCoupon}
                    style={styles.removeCouponButton}
                  >
                    <Ionicons name='close-circle' size={20} color='#666' />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputContainer}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder='Enter coupon code'
                    placeholderTextColor='#999'
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize='characters'
                    editable={!isApplyingCoupon}
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyCouponButton,
                      isApplyingCoupon && styles.applyCouponButtonDisabled,
                    ]}
                    onPress={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                  >
                    <Text style={styles.applyCouponButtonText}>
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.summaryDivider} />
            </>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
          </View>
          {appliedCoupon && discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.discountRow}>
                <Ionicons name='pricetag' size={14} color='#4CAF50' />
                <Text style={styles.discountLabel}>
                  Discount ({appliedCoupon.code})
                </Text>
              </View>
              <Text style={styles.discountValue}>
                -₹{discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <View style={styles.deliveryLabelContainer}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              {distance !== null && (
                <Text style={styles.distanceLabel}>({distance} km away)</Text>
              )}
            </View>
            <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.deliveryInfoContainer}>
            <IconScooter size={14} color='#009ECA' />
            <Text style={styles.deliveryInfoText}>
              Delivery free on order above ₹100 within 4km
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>
        {/* Payment Method Selection */}
        {items.length > 0 && isLoggedIn && hasAddresses && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentSectionTitle}>
              Select Payment Method
            </Text>
            <View style={styles.paymentOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'cash' &&
                    styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('cash')}
                activeOpacity={0.7}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionLeft}>
                    <Ionicons
                      name='cash-outline'
                      size={22}
                      color={
                        selectedPaymentMethod === 'cash' ? '#4CAF50' : '#666'
                      }
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        selectedPaymentMethod === 'cash' &&
                          styles.paymentOptionTextSelected,
                      ]}
                    >
                      Cash on Delivery
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'upi' &&
                    styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('upi')}
                activeOpacity={0.7}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionLeft}>
                    <Ionicons
                      name='phone-portrait-outline'
                      size={22}
                      color={
                        selectedPaymentMethod === 'upi' ? '#4CAF50' : '#666'
                      }
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        selectedPaymentMethod === 'upi' &&
                          styles.paymentOptionTextSelected,
                      ]}
                    >
                      UPI
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'card' &&
                    styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('card')}
                activeOpacity={0.7}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionLeft}>
                    <Ionicons
                      name='card-outline'
                      size={22}
                      color={
                        selectedPaymentMethod === 'card' ? '#4CAF50' : '#666'
                      }
                    />
                    <Text
                      style={[
                        styles.paymentOptionText,
                        selectedPaymentMethod === 'card' &&
                          styles.paymentOptionTextSelected,
                      ]}
                    >
                      Debit/Credit Card
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      {items.length > 0 && (
        <SafeAreaView style={styles.checkoutSafeArea}>
          <View style={styles.checkoutContainer}>
            {!isLoggedIn ? (
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => router.push('/login?redirect=/cart')}
              >
                <Text style={styles.checkoutButtonText}>Login to Continue</Text>
              </TouchableOpacity>
            ) : isLoadingAddresses ? (
              <TouchableOpacity
                style={[styles.checkoutButton, styles.checkoutButtonDisabled]}
                disabled={true}
              >
                <Text style={styles.checkoutButtonText}>Loading...</Text>
              </TouchableOpacity>
            ) : !hasAddresses ? (
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => router.push('/profile/add-address')}
              >
                <Text style={styles.checkoutButtonText}>Add Address</Text>
              </TouchableOpacity>
            ) : isAddressIncomplete ? (
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => {
                  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(
                    selectedAddress.id
                  );
                  if (isValidObjectId) {
                    router.push(`/profile/address?edit=${selectedAddress.id}`);
                  } else {
                    router.push('/profile/add-address');
                  }
                }}
              >
                <Text style={styles.checkoutButtonText}>Complete Address</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  (!selectedPaymentMethod || isPlacingOrder) &&
                    styles.checkoutButtonDisabled,
                ]}
                onPress={handlePlaceOrder}
                disabled={!selectedPaymentMethod || isPlacingOrder}
              >
                <Text style={styles.checkoutButtonText}>
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 4,
    gap: 4,
  },
  addressInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#009ECA',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  cartItemsContainer: {
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 0.2,
    borderColor: '#E0E0E0',
    marginHorizontal: 14,
    marginTop: 10,
    padding: 12,
    gap: 8,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  productDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  variantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4EFB950',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variantBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2F500E',
  },
  itemUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantityDetailsContainer: {
    gap: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#568627',
    borderRadius: 10,
    backgroundColor: '#C5FF8D20',
  },
  quantityButton: {
    minWidth: 30,
    minHeight: 30,
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  quantity: {
    fontSize: 12,
    color: '#568627',
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 70,
    textAlign: 'center',
  },
  summary: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 0.2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#262626',
  },
  deliveryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceLabel: {
    fontSize: 10,
    color: '#009ECA',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    color: '#262626',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkoutSafeArea: {
    backgroundColor: '#fff',
  },
  checkoutContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F6F4',
    marginVertical: 12,
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  applyCouponButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyCouponButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  applyCouponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appliedCouponText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  removeCouponButton: {
    padding: 4,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // marginTop: -8,
    marginBottom: 8,
    // paddingHorizontal: 2,
  },
  deliveryInfoText: {
    fontSize: 10,
    color: '#009ECA',
    fontWeight: '500',
    flex: 1,
  },
  paymentSection: {
    marginHorizontal: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 0.2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  paymentSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  paymentOption: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  paymentOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
    borderWidth: 1,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  paymentOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  incompleteBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  incompleteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  incompleteText: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
