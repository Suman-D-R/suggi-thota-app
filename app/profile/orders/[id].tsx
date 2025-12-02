import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/Header';
import { Product, getProductById } from '../../../data/dummyData';

// Extended order interface with full details
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
}

interface OrderDetails {
  id: string;
  date: string;
  status: 'Delivered' | 'Cancelled' | 'Processing' | 'Shipped';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  address: {
    label: string;
    address: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
}

// Dummy detailed orders data
const getOrderDetails = (id: string): OrderDetails | null => {
  const orders: Record<string, OrderDetails> = {
    ORD001: {
      id: 'ORD001',
      date: '2024-01-15',
      status: 'Delivered',
      items: [
        { productId: '1', quantity: 2, price: 50, discount: 10 },
        { productId: '2', quantity: 1, price: 40 },
        { productId: '7', quantity: 2, price: 60, discount: 10 },
      ],
      subtotal: 450,
      deliveryFee: 50,
      discount: 45,
      total: 455,
      address: {
        label: 'Home',
        address: '123 Main Street, City, State 12345',
      },
      paymentMethod: 'Cash on Delivery',
      trackingNumber: 'TRK123456789',
    },
    ORD002: {
      id: 'ORD002',
      date: '2024-01-10',
      status: 'Delivered',
      items: [
        { productId: '3', quantity: 2, price: 35, discount: 15 },
        { productId: '8', quantity: 1, price: 120 },
      ],
      subtotal: 320,
      deliveryFee: 50,
      discount: 10.5,
      total: 359.5,
      address: {
        label: 'Office',
        address: '456 Business Ave, City, State 12345',
      },
      paymentMethod: 'UPI',
      trackingNumber: 'TRK987654321',
    },
    ORD003: {
      id: 'ORD003',
      date: '2024-01-05',
      status: 'Cancelled',
      items: [
        { productId: '4', quantity: 1, price: 60 },
        { productId: '9', quantity: 1, price: 80, discount: 15 },
      ],
      subtotal: 180,
      deliveryFee: 50,
      discount: 12,
      total: 218,
      address: {
        label: 'Home',
        address: '123 Main Street, City, State 12345',
      },
      paymentMethod: 'Credit Card',
    },
  };

  return orders[id] || null;
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = id ? getOrderDetails(id) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#4CAF50';
      case 'Cancelled':
        return '#FF5722';
      case 'Processing':
        return '#FF9800';
      case 'Shipped':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'checkmark-circle';
      case 'Cancelled':
        return 'close-circle';
      case 'Processing':
        return 'time';
      case 'Shipped':
        return 'car';
      default:
        return 'ellipse';
    }
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name='receipt-outline' size={64} color='#ccc' />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Header */}
        <View style={styles.orderHeaderCard}>
          <View style={styles.orderHeaderTop}>
            <View style={styles.orderHeaderLeft}>
              <Ionicons
                name={getStatusIcon(order.status) as any}
                size={28}
                color={getStatusColor(order.status)}
              />
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(order.status) + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>
          {order.trackingNumber && (
            <View style={styles.trackingContainer}>
              <Ionicons name='cube-outline' size={18} color='#666' />
              <Text style={styles.trackingLabel}>Tracking Number:</Text>
              <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => {
              const product = getProductById(item.productId);
              if (!product) return null;

              const discountedPrice = item.discount
                ? item.price - (item.price * item.discount) / 100
                : item.price;
              const itemTotal = discountedPrice * item.quantity;

              return (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemImageContainer}>
                    {product.image ? (
                      <Image
                        source={{ uri: product.image }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.itemPlaceholder}>
                        <Text style={styles.itemPlaceholderText}>
                          {product.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemUnit}>{product.unit}</Text>
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
                  <Text style={styles.itemTotal}>
                    ₹{Math.round(itemTotal)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name='location' size={20} color='#4CAF50' />
              <Text style={styles.addressLabel}>{order.address.label}</Text>
            </View>
            <Text style={styles.addressText}>{order.address.address}</Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Ionicons name='card-outline' size={20} color='#666' />
              <Text style={styles.paymentLabel}>Payment Method</Text>
            </View>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{order.subtotal.toFixed(2)}</Text>
            </View>
            {order.discount && order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.discountValue}>
                  -₹{order.discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                ₹{order.deliveryFee.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {order.status === 'Delivered' && (
        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.reorderButton}>
              <Ionicons name='refresh' size={20} color='#4CAF50' />
              <Text style={styles.reorderButtonText}>Reorder</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  orderHeaderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderInfo: {
    marginLeft: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
    gap: 8,
  },
  trackingLabel: {
    fontSize: 14,
    color: '#666',
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  paymentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
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
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 8,
  },
  reorderButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

