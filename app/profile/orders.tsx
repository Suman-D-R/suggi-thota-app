import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { orderAPI } from '../../lib/api';
import { useUserStore } from '../../store/userStore';

// --- Types ---
interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    productId?: string | { _id: string; name: string };
    product?: string | { _id: string; name: string };
    quantity: number;
    price: number;
    total: number;
  }>;
  // ... other fields
}

// --- MODERN THEME CONSTANTS ---
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

export default function OrdersScreen() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ... (Keep existing loadOrders logic unchanged) ...
  const loadOrders = useCallback(
    async (showRefreshing = false) => {
      if (!isLoggedIn) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const response = await orderAPI.getUserOrders(1, 50);
        if (response.success && response.data?.orders) {
          setOrders(response.data.orders);
        } else if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [isLoggedIn]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );
  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  // --- Helpers ---
  const formatCurrency = (amount: number) => `₹${amount.toFixed(0)}`; // Clean integer price

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Oct 12"
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return COLORS.primary;
    if (s === 'cancelled') return COLORS.danger;
    if (s === 'out_for_delivery') return COLORS.primary;
    return '#F59E0B'; // Orange for pending
  };

  const formatStatus = (status: string) => {
    return status.split('_').join(' ').toLowerCase(); // "out for delivery"
  };

  const getItemTitle = (items: Order['items']) => {
    if (!items?.length) return 'Order Details';

    const firstItem = items[0];
    // Handle both productId and product fields
    const product = firstItem.product || firstItem.productId;

    // Get product name
    let productName = 'Product';
    if (typeof product === 'object' && product?.name) {
      productName = product.name.split('|')[0];
    } else if (typeof product === 'string' && product) {
      // If it's a string, we can't get the name, so use a default
      productName = 'Product';
    }

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalItems = items.length;

    // Format: "Product Name, 5 items" or "Product Name, 5 items & 2 more"
    if (totalItems === 1) {
      return `${productName}, ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'
        }`;
    }
    return `${productName}, ${totalQuantity} items & ${totalItems - 1} more`;
  };

  // --- Render ---
  if (!isLoggedIn) return null; // Or your login placeholder

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={COLORS.bg} />
      <Header showBack={true} title='My Orders' />

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);

            return (
              <TouchableOpacity
                key={order._id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/profile/orders/${order._id}`)}
              >
                {/* Top Row: Icon + Main Title */}
                <View style={styles.topRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name='basket-outline'
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.mainInfo}>
                    <Text style={styles.itemsTitle} numberOfLines={1}>
                      {getItemTitle(order.items)}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.dateText}>
                        {formatDate(order.createdAt)}
                      </Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {formatStatus(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      {formatCurrency(order.total)}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Footer (ID + Action) */}
                <View style={styles.footer}>
                  <Text style={styles.orderId}>
                    ID: {order.orderNumber || order._id.slice(-6)}
                  </Text>

                  <View style={styles.actionRow}>
                    <Text style={styles.detailsText}>View Details</Text>
                    <Ionicons
                      name='chevron-forward'
                      size={14}
                      color={COLORS.textLight}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {orders.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textGray,
    fontWeight: '400',
  },
  dot: {
    marginHorizontal: 6,
    color: COLORS.textLight,
    fontSize: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priceContainer: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  orderId: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '400',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 13,
    color: COLORS.textGray,
    marginRight: 4,
    fontWeight: '500',
  },
});
