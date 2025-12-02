import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Header from '../../components/Header';
import { useCartStore } from '../../store/cartStore';
import { useLocationStore } from '../../store/locationStore';

export default function CartTab() {
  const router = useRouter();
  const { items, updateQuantity, getTotalPrice } = useCartStore();
  const addresses = useLocationStore((state) => state.addresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;
  const total = getTotalPrice();

  const getDiscountedPrice = (item: any) => {
    return item.discount
      ? item.price - (item.price * item.discount) / 100
      : item.price;
  };

  const deliveryFee = 50;
  const finalTotal = total + deliveryFee;

  return (
    <View style={styles.container}>
      <Header title='My Cart' />
      {items.length > 0 && selectedAddress && (
        <TouchableOpacity
          style={styles.addressContainer}
          onPress={() => router.push('/profile/address')}
          activeOpacity={0.7}
        >
          <Ionicons name='location' size={18} color='#4CAF50' />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
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
          <View>
            {items.map((item) => {
              const discountedPrice = getDiscountedPrice(item);
              const itemTotal = discountedPrice * item.quantity;
              return (
                <View key={item.id} style={styles.cartItem}>
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
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.itemPrice}>
                        ₹{Math.round(discountedPrice)}
                      </Text>
                      {item.discount && (
                        <Text style={styles.originalPrice}>
                          ₹{Math.round(item.price)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Quantity Controls */}
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name='remove' size={18} color='#4CAF50' />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name='add' size={18} color='#4CAF50' />
                    </TouchableOpacity>
                  </View>

                  {/* Total Price */}
                  <Text style={styles.itemTotal}>₹{Math.round(itemTotal)}</Text>
                </View>
              );
            })}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>
                  ₹{deliveryFee.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {items.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/cart/checkout')}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#F7FFD8',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8B0',
    gap: 8,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 4,
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F6F4',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  quantity: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 10,
    minWidth: 24,
    textAlign: 'center',
    color: '#4CAF50',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    minWidth: 70,
    textAlign: 'right',
  },
  summary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
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
});
