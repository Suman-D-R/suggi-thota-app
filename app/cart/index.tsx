import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, getTotalPrice, getVariantKey } =
    useCartStore();
  const addresses = useLocationStore((state) => state.addresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;
  const total = getTotalPrice();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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
          onPress={() => router.push('/profile/address')}
          activeOpacity={0.7}
        >
          <View style={styles.addressInfo}>
            <View style={styles.addressInfoContainer}>
              <Ionicons name='location' size={18} color='#4CAF50' />
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              {selectedAddress.address}
            </Text>
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
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
      {items.length > 0 && (
        <SafeAreaView style={styles.checkoutSafeArea}>
          <View style={styles.checkoutContainer}>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => {}}>
              <Text style={styles.checkoutButtonText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
    paddingTop: 6,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
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
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 16,
    marginTop: 12,
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
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    borderWidth: 1,
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
});
