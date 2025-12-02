import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';

type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const addresses = useLocationStore((state) => state.addresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const subtotal = getTotalPrice();
  const deliveryFee = 50;
  const finalTotal = subtotal + deliveryFee - couponDiscount;

  const getDiscountedPrice = (item: any) => {
    return item.discount
      ? item.price - (item.price * item.discount) / 100
      : item.price;
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      if (code === 'SAVE10' || code === 'DISCOUNT10') {
        setAppliedCoupon(code);
        setCouponDiscount(subtotal * 0.1);
      } else if (code === 'SAVE20' || code === 'DISCOUNT20') {
        setAppliedCoupon(code);
        setCouponDiscount(subtotal * 0.2);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        Alert.alert(
          'Invalid Coupon',
          'The coupon code you entered is invalid.'
        );
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert(
        'Address Required',
        'Please select a delivery address to continue.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Address',
            onPress: () => router.push('/profile/add-address'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Total Amount: ₹${finalTotal.toFixed(
        2
      )}\n\nDo you want to place this order?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Place Order',
          onPress: () => {
            // Clear cart and navigate to orders
            clearCart();
            Alert.alert(
              'Order Placed!',
              'Your order has been placed successfully.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.push('/(tabs)/home');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const paymentMethods = [
    {
      id: 'cod' as PaymentMethod,
      name: 'Cash on Delivery',
      icon: 'cash-outline',
    },
    { id: 'upi' as PaymentMethod, name: 'UPI', icon: 'phone-portrait-outline' },
    {
      id: 'card' as PaymentMethod,
      name: 'Credit/Debit Card',
      icon: 'card-outline',
    },
    { id: 'wallet' as PaymentMethod, name: 'Wallet', icon: 'wallet-outline' },
  ];

  return (
    <View style={styles.container}>
      <Header showBack={true} title='Checkout' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/address')}
              style={styles.changeButton}
            >
              <Text style={styles.changeButtonText}>
                {selectedAddress ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Ionicons name='location' size={20} color='#4CAF50' />
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              </View>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressCard}
              onPress={() => router.push('/profile/add-address')}
            >
              <Ionicons name='add-circle-outline' size={24} color='#4CAF50' />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsContainer}>
            {items.map((item) => {
              const discountedPrice = getDiscountedPrice(item);
              const itemTotal = discountedPrice * item.quantity;
              return (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.itemImageContainer}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.itemPlaceholder}>
                        <Text style={styles.itemPlaceholderText}>
                          {item.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>
                        ₹{Math.round(discountedPrice)} × {item.quantity}
                      </Text>
                      {item.discount && (
                        <Text style={styles.itemOriginalPrice}>
                          ₹{Math.round(item.price)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>₹{Math.round(itemTotal)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponInfo}>
                <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
                <Text style={styles.appliedCouponText}>
                  {appliedCoupon} applied
                </Text>
                <Text style={styles.couponDiscountText}>
                  -₹{couponDiscount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleRemoveCoupon}
                style={styles.removeCouponButton}
              >
                <Ionicons name='close-circle' size={20} color='#999' />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <View style={styles.couponInputWrapper}>
                <Ionicons name='ticket-outline' size={20} color='#666' />
                <TextInput
                  style={styles.couponInput}
                  placeholder='Enter coupon code'
                  placeholderTextColor='#999'
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize='characters'
                />
              </View>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyCoupon}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method.id &&
                    styles.selectedPaymentMethodCard,
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={
                    selectedPaymentMethod === method.id ? '#4CAF50' : '#666'
                  }
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method.id &&
                      styles.selectedPaymentMethodText,
                  ]}
                >
                  {method.name}
                </Text>
                {selectedPaymentMethod === method.id && (
                  <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon Discount</Text>
                <Text style={styles.discountValue}>
                  -₹{couponDiscount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
        <View style={styles.footer}>
          <View style={styles.totalFooter}>
            <Text style={styles.totalFooterLabel}>Total Amount</Text>
            <Text style={styles.totalFooterValue}>
              ₹{finalTotal.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              !selectedAddress && styles.placeOrderButtonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={!selectedAddress}
          >
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addAddressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addAddressText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  itemsContainer: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
    alignItems: 'center',
    gap: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F6F4',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderText: {
    fontSize: 24,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F6F4',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  couponInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
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
    color: '#333',
    flex: 1,
  },
  couponDiscountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  removeCouponButton: {
    marginLeft: 8,
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
    gap: 12,
  },
  selectedPaymentMethodCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedPaymentMethodText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
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
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
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
  footerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
  },
  footer: {
    padding: 16,
  },
  totalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalFooterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalFooterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
