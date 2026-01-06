import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import Header from '../../../components/Header';
import { orderAPI } from '../../../lib/api';
import { useUserStore } from '../../../store/userStore';

interface OrderItem {
  product: string | {
    _id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
  total: number;
  size?: number;
  unit?: string;
  variantSku?: string;
}

interface OrderAddress {
  _id?: string;
  label?: string;
  type?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactName?: string;
  contactPhone?: string;
}

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  deliveryAddress: OrderAddress | string;
  paymentMethod: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryInstructions?: string;
  orderNotes?: string;
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id || !isLoggedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await orderAPI.getOrderById(id);
      
      if (response.success && response.data?.order) {
        setOrder(response.data.order);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('Failed to load order:', err);
      setError(err.message || 'Failed to load order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      loadOrder();
    }, [loadOrder])
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#FF5722';
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'ready':
        return '#FF9800';
      case 'out_for_delivery':
        return '#2196F3';
      case 'refunded':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'pending':
      case 'confirmed':
      case 'preparing':
      case 'ready':
        return 'time';
      case 'out_for_delivery':
        return 'car';
      case 'refunded':
        return 'refresh-circle';
      default:
        return 'ellipse';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod':
        return 'Cash on Delivery';
      case 'online':
        return 'Online Payment';
      case 'wallet':
        return 'Wallet';
      default:
        return method;
    }
  };

  const getAddressString = (address: OrderAddress | string): string => {
    if (typeof address === 'string') {
      return address;
    }
    if (!address) return '';
    
    const parts = [];
    if (address.apartment) parts.push(address.apartment);
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    
    return parts.join(', ') || 'Address not available';
  };

  const getProductName = (item: OrderItem): string => {
    if (typeof item.product === 'object' && item.product?.name) {
      return item.product.name;
    }
    return 'Product';
  };

  const getProductImage = (item: OrderItem): string | null => {
    if (typeof item.product === 'object' && item.product?.images && item.product.images.length > 0) {
      return item.product.images[0];
    }
    return null;
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name='log-in-outline' size={64} color='#ccc' />
          <Text style={styles.errorText}>Please login to view order details</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.errorContainer}>
          <Ionicons name='receipt-outline' size={64} color='#ccc' />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
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
                <Text style={styles.orderId}>Order #{order.orderNumber || order._id.slice(-6)}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
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
                {formatStatus(order.status)}
              </Text>
            </View>
          </View>
          {order.estimatedDeliveryTime && (
            <View style={styles.trackingContainer}>
              <Ionicons name='time-outline' size={18} color='#666' />
              <Text style={styles.trackingLabel}>Estimated Delivery:</Text>
              <Text style={styles.trackingNumber}>{formatDate(order.estimatedDeliveryTime)}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => {
              const productName = getProductName(item);
              const productImage = getProductImage(item);
              const unit = item.unit ? `${item.size || ''} ${item.unit}`.trim() : '';

              return (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemImageContainer}>
                    {productImage ? (
                      <Image
                        source={{ uri: productImage }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.itemPlaceholder}>
                        <Text style={styles.itemPlaceholderText}>
                          {productName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{productName}</Text>
                    {unit && <Text style={styles.itemUnit}>{unit}</Text>}
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>
                    ₹{item.total.toFixed(2)}
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
              <Text style={styles.addressLabel}>
                {typeof order.deliveryAddress === 'object' 
                  ? (order.deliveryAddress.label || order.deliveryAddress.type || 'Address')
                  : 'Address'}
              </Text>
            </View>
            <Text style={styles.addressText}>{getAddressString(order.deliveryAddress)}</Text>
            {typeof order.deliveryAddress === 'object' && order.deliveryAddress.contactName && (
              <Text style={styles.addressContact}>
                {order.deliveryAddress.contactName}
                {order.deliveryAddress.contactPhone && ` • ${order.deliveryAddress.contactPhone}`}
              </Text>
            )}
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
            <Text style={styles.paymentValue}>{formatPaymentMethod(order.paymentMethod)}</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
            </View>
            <Text style={[styles.paymentValue, { color: getStatusColor(order.paymentStatus) }]}>
              {formatStatus(order.paymentStatus)}
            </Text>
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
            {order.tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>
                  ₹{order.tax.toFixed(2)}
                </Text>
              </View>
            )}
            {order.discount > 0 && (
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
      {order.status.toLowerCase() === 'delivered' && (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  addressContact: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
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

