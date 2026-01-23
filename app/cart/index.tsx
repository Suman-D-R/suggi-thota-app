import { Ionicons } from '@expo/vector-icons';
import { IconScooter } from '@tabler/icons-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AddToCartButton from '../../components/AddToCartButton';
import Header from '../../components/Header';
import { orderAPI } from '../../lib/api';
import { calculateDistance } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';
import { useUserStore } from '../../store/userStore';

// --- THEME CONSTANTS (Matching ProductCard) ---
const COLORS = {
  primary: '#059669', // Modern Emerald
  primarySoft: '#ECFDF5',
  textDark: '#111827',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  danger: '#EF4444',
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#F3F4F6',
};

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    issues,
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

  const hasAddresses = !isLoadingAddresses && addresses.length > 0;
  const isAddressComplete =
    selectedAddress &&
    selectedAddress.contactName &&
    selectedAddress.contactPhone &&
    (selectedAddress.apartment || selectedAddress.street);
  const isAddressIncomplete = selectedAddress && !isAddressComplete;

  useEffect(() => {
    if (isLoggedIn) loadAddresses();
  }, [isLoggedIn, loadAddresses]);

  const loadCart = useCartStore((state) => state.loadCart);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        loadAddresses();
        loadCart();
      }
    }, [isLoggedIn, loadAddresses, loadCart])
  );

  let distance: number | null = null;
  if (selectedStore?.location?.coordinates && selectedAddress?.coordinates) {
    const [storeLng, storeLat] = selectedStore.location.coordinates;
    const { latitude: deliveryLat, longitude: deliveryLng } =
      selectedAddress.coordinates;
    distance = calculateDistance(storeLat, storeLng, deliveryLat, deliveryLng);
  }

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'cash' | 'upi' | 'card' | null
  >(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const getValidatedPrice = (price: any): number => {
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  };

  const validateCoupon = async (
    code: string
  ): Promise<{
    valid: boolean;
    discount?: number;
    type?: 'percentage' | 'fixed';
    message?: string;
  }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const validCoupons: Record<
      string,
      { discount: number; type: 'percentage' | 'fixed' }
    > = {
      SAVE10: { discount: 10, type: 'percentage' },
      SAVE20: { discount: 20, type: 'percentage' },
      FLAT50: { discount: 50, type: 'fixed' },
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (coupon) {
      return {
        valid: true,
        discount: coupon.discount,
        type: coupon.type,
        message: 'Coupon applied!',
      };
    }
    return { valid: false, message: 'Invalid coupon code' };
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    if (appliedCoupon) {
      Alert.alert('Info', 'A coupon is already applied.');
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
        Alert.alert('Success', result.message || 'Applied!');
      } else {
        Alert.alert('Error', result.message || 'Invalid code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/cart');
      return;
    }
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);

    try {
      try {
        await syncLocalCartToBackend();
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (syncError) {
        console.warn('Sync failed, continuing:', syncError);
      }

      const paymentMethodMap: Record<string, 'cod' | 'online' | 'wallet'> = {
        cash: 'cod',
        upi: 'online',
        card: 'online',
      };

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(selectedAddress.id);

      if (!selectedStore?._id) {
        Alert.alert('Error', 'Store not selected.');
        setIsPlacingOrder(false);
        return;
      }

      const orderData: any = {
        storeId: selectedStore._id,
        paymentMethod: paymentMethodMap[selectedPaymentMethod] || 'cod',
        couponCode: appliedCoupon?.code,
        deliveryFee: deliveryFee,
        tax: 0,
        discount: discountAmount,
      };

      if (isValidObjectId) {
        orderData.deliveryAddressId = selectedAddress.id;
      } else {
        orderData.addressDetails = {
          address: selectedAddress.address,
          label: selectedAddress.label,
          isDefault: selectedAddress.isDefault || false,
        };
      }

      const response = await orderAPI.createOrder(orderData);

      if (response.success && response.data?.order) {
        const cartStore = useCartStore.getState();
        cartStore.items = [];
        cartStore.clearCart().catch(() => { });
        setOrderNumber(response.data.order.orderNumber);
        setShowOrderSuccess(true);

        setTimeout(() => {
          setShowOrderSuccess(false);
          router.replace('/(tabs)/home');
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to place order.';
      let stockErrors: string[] = [];

      if (error.data) {
        if (error.data.stockErrors && Array.isArray(error.data.stockErrors)) {
          stockErrors = error.data.stockErrors;
        }
        if (error.data.message) {
          errorMessage = error.data.message;
        }
      }

      if (stockErrors.length > 0) {
        const displayMessage = stockErrors.join('\n');
        Alert.alert(
          'Stock Unavailable',
          `${displayMessage}\n\nCart updated to reflect availability.`,
          [{ text: 'OK', onPress: () => useCartStore.getState().loadCart() }]
        );
      } else {
        Alert.alert('Order Failed', errorMessage);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const deliveryFee = 50;
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
      {/* Success Modal */}
      <Modal visible={showOrderSuccess} transparent={true} animationType='fade'>
        <View style={styles.successModalContainer}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconOuter}>
              <Ionicons name='checkmark' size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>Order Placed!</Text>
            {orderNumber && (
              <Text style={styles.successOrderNumber}>
                ID: #{orderNumber.slice(-6).toUpperCase()}
              </Text>
            )}
            <Text style={styles.successMessage}>
              Your fresh order has been received.
            </Text>
          </View>
        </View>
      </Modal>

      <Header
        showBack={true}
        title='Shopping Cart'
        backgroundColor={COLORS.bg}
      />

      {/* Address Card */}
      {items.length > 0 && selectedAddress && (
        <View style={styles.addressWrapper}>
          <TouchableOpacity
            style={[
              styles.addressCard,
              isLoggedIn && isAddressIncomplete && styles.addressCardError,
            ]}
            onPress={() => {
              if (isLoggedIn && isAddressIncomplete) {
                const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(
                  selectedAddress.id
                );
                router.push(
                  isValidObjectId
                    ? `/profile/address?edit=${selectedAddress.id}`
                    : '/profile/add-address'
                );
              } else {
                router.push('/profile/address');
              }
            }}
            activeOpacity={0.9}
          >
            <View style={styles.addressIconBox}>
              <Ionicons
                name={isLoggedIn && isAddressIncomplete ? 'alert' : 'location'}
                size={20}
                color={isLoggedIn && isAddressIncomplete ? COLORS.danger : COLORS.primary}
              />
            </View>
            <View style={styles.addressContent}>
              <View style={styles.addressHeaderRow}>
                <Text style={styles.addressLabel}>Delivery to</Text>
                <Text style={styles.addressTag}>{selectedAddress.label}</Text>
              </View>
              <Text style={styles.addressText} numberOfLines={1}>
                {selectedAddress.address}
              </Text>
              {isLoggedIn && isAddressIncomplete && (
                <Text style={styles.addressErrorText}>
                  Tap to complete missing info
                </Text>
              )}
            </View>
            <Ionicons
              name='chevron-forward'
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name='basket' size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Fresh vegetables are just a click away!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.section}>
              {items.map((item, index) => {
                const sellingPrice = getValidatedPrice(item.sellingPrice);
                const originalPrice = getValidatedPrice(item.originalPrice);
                const variantDisplay = item.selectedVariant
                  ? `${item.selectedVariant.size} ${item.selectedVariant.unit}`
                  : `${item.size} ${item.unit}`;

                return (
                  <View
                    key={getVariantKey(item._id, item.selectedVariant)}
                    style={styles.cartCard}
                  >
                    {/* Image Area */}
                    <View style={styles.cartImageContainer}>
                      {item.images?.[0] ? (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.cartImage}
                        />
                      ) : (
                        <Text style={styles.placeholderText}>
                          {item.name.charAt(0)}
                        </Text>
                      )}
                    </View>

                    {/* Details Area */}
                    <View style={styles.cartDetails}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartVariant}>{variantDisplay}</Text>

                      <View style={styles.cartPriceRow}>
                        <Text style={styles.cartPrice}>
                          ₹{Math.round(sellingPrice)}
                        </Text>
                        {originalPrice > sellingPrice && (
                          <Text style={styles.cartOriginalPrice}>
                            ₹{Math.round(originalPrice)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Quantity Control */}
                    <View style={styles.qtyContainer}>
                      <AddToCartButton
                        quantity={item.quantity}
                        onAdd={() => { }}
                        onIncrease={() =>
                          updateQuantity(
                            item._id,
                            item.quantity + 1,
                            item.selectedVariant
                          )
                        }
                        onDecrease={() =>
                          updateQuantity(
                            item._id,
                            item.quantity - 1,
                            item.selectedVariant
                          )
                        }
                        containerStyle={styles.qtyButtonStyle}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Issues / Alerts */}
            {issues && issues.length > 0 && (
              <View style={styles.alertSection}>
                <View style={styles.alertHeader}>
                  <Ionicons name='alert-circle' size={20} color='#F59E0B' />
                  <Text style={styles.alertTitle}>Stock Updates</Text>
                </View>
                {issues.map((issue, index) => (
                  <View key={index} style={styles.alertItem}>
                    <Text style={styles.alertText}>
                      <Text style={{ fontWeight: '700' }}>
                        {issue.productName || 'Item'}
                      </Text>
                      :{' '}
                      {issue.reason === 'OUT_OF_STOCK'
                        ? 'Sold Out'
                        : `Only ${issue.availableQuantity} left`}
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const item = items.find(
                          (i) => i._id === issue.productId
                        );
                        if (item)
                          await updateQuantity(
                            issue.productId,
                            0,
                            item.selectedVariant
                          );
                        loadCart();
                      }}
                    >
                      <Text style={styles.alertAction}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Coupons Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offers</Text>
              {appliedCoupon ? (
                <View style={styles.appliedCoupon}>
                  <View style={styles.couponIconBox}>
                    <Ionicons name='ticket' size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
                    <Text style={styles.appliedSub}>Discount applied</Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon}>
                    <Ionicons
                      name='close-circle'
                      size={20}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputWrapper}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder='Enter coupon code'
                    value={couponCode}
                    onChangeText={setCouponCode}
                    placeholderTextColor={COLORS.textLight}
                    autoCapitalize='characters'
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyBtn,
                      (!couponCode || isApplyingCoupon) &&
                      styles.applyBtnDisabled,
                    ]}
                    onPress={handleApplyCoupon}
                    disabled={!couponCode || isApplyingCoupon}
                  >
                    <Text style={styles.applyBtnText}>APPLY</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bill Details - Receipt Style */}
            <View style={styles.billCard}>
              <Text style={styles.sectionTitle}>Bill Details</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{total.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  {distance !== null && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{distance}km</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
              </View>

              {total < 100 && (
                <View style={styles.infoRow}>
                  <IconScooter size={14} color={COLORS.primary} />
                  <Text style={styles.infoText}>
                    Free delivery on orders above ₹100
                  </Text>
                </View>
              )}

              {appliedCoupon && discountAmount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: COLORS.primary }]}>
                    Discount ({appliedCoupon.code})
                  </Text>
                  <Text style={[styles.billValue, { color: COLORS.primary }]}>
                    -₹{discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Dotted Line */}
              <View style={styles.divider}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <View key={i} style={styles.dot} />
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            {isLoggedIn && hasAddresses && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
                >
                  {[
                    { key: 'cash', label: 'Cash', icon: 'cash-outline' },
                    { key: 'upi', label: 'UPI', icon: 'qr-code-outline' },
                    { key: 'card', label: 'Card', icon: 'card-outline' },
                  ].map((method) => (
                    <TouchableOpacity
                      key={method.key}
                      style={[
                        styles.paymentCard,
                        selectedPaymentMethod === method.key &&
                        styles.paymentCardSelected,
                      ]}
                      onPress={() =>
                        setSelectedPaymentMethod(method.key as any)
                      }
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={
                          selectedPaymentMethod === method.key
                            ? COLORS.primary
                            : COLORS.textGray
                        }
                      />
                      <Text
                        style={[
                          styles.paymentLabel,
                          selectedPaymentMethod === method.key &&
                          styles.paymentLabelSelected,
                        ]}
                      >
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer Action */}
      {items.length > 0 && (
        <SafeAreaView style={styles.footer}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerTotalLabel}>Total</Text>
              <Text style={styles.footerTotalValue}>
                ₹{finalTotal.toFixed(0)}
              </Text>
            </View>

            {!isLoggedIn ? (
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={() => router.push('/login?redirect=/cart')}
              >
                <Text style={styles.checkoutBtnText}>Login to Pay</Text>
              </TouchableOpacity>
            ) : isLoadingAddresses ? (
              <TouchableOpacity
                style={[styles.checkoutBtn, styles.btnDisabled]}
                disabled
              >
                <Text style={styles.checkoutBtnText}>Loading...</Text>
              </TouchableOpacity>
            ) : !hasAddresses ? (
              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={() => router.push('/profile/add-address')}
              >
                <Text style={styles.checkoutBtnText}>Add Address</Text>
              </TouchableOpacity>
            ) : isAddressIncomplete ? (
              <TouchableOpacity
                style={[styles.checkoutBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(
                    selectedAddress.id
                  );
                  router.push(
                    isValidObjectId
                      ? `/profile/address?edit=${selectedAddress.id}`
                      : '/profile/add-address'
                  );
                }}
              >
                <Text style={styles.checkoutBtnText}>Complete Address</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  (!selectedPaymentMethod || isPlacingOrder) &&
                  styles.btnDisabled,
                ]}
                onPress={handlePlaceOrder}
                disabled={!selectedPaymentMethod || isPlacingOrder}
              >
                <Text style={styles.checkoutBtnText}>
                  {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </Text>
                {!isPlacingOrder && (
                  <Ionicons name='arrow-forward' size={20} color='#FFF' />
                )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // --- ADDRESS ---
  addressWrapper: {},

  addressCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  addressCardError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContent: {
    flex: 1,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  addressTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  addressErrorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 2,
  },

  // --- CART LIST ---
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  cartImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cartImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cartDetails: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cartVariant: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cartPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cartOriginalPrice: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  qtyContainer: {
    width: 100,
    height: 30,
  },
  qtyButtonStyle: {
    width: '100%',
    height: '100%',
  },

  // --- ALERTS ---
  alertSection: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#B45309',
  },
  alertAction: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },

  // --- COUPONS ---
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  couponInputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: COLORS.textDark,
    fontSize: 14,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  applyBtnDisabled: {
    backgroundColor: COLORS.textLight,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  couponIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appliedSub: {
    fontSize: 11,
    color: COLORS.textGray,
  },

  // --- BILL RECEIPT ---
  billCard: {
    backgroundColor: COLORS.cardBg,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.primary,
  },
  distanceBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    overflow: 'hidden',
  },
  dot: {
    width: 4,
    height: 1,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },

  // --- PAYMENTS ---
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  paymentLabelSelected: {
    color: COLORS.primary,
  },

  // --- FOOTER ---
  footer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 20,
  },
  footerContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  footerTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.6,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // --- EMPTY STATE ---
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    padding: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 8,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  browseButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },

  // --- SUCCESS MODAL ---
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: COLORS.cardBg,
    width: '80%',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  successOrderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginVertical: 12,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  successMessage: {
    textAlign: 'center',
    color: COLORS.textGray,
    lineHeight: 20,
    fontSize: 14,
  },
});
