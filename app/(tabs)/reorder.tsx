import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import LoginPrompt from '../../components/LoginPrompt';
import { orderAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useUserStore } from '../../store/userStore';

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

// --- Types ---
interface OrderItem {
  product:
  | string
  | {
    _id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
  total: number;
  size?: number;
  unit?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const { width } = Dimensions.get('window');

export default function ReorderTab() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const loadCart = useCartStore((state) => state.loadCart);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // --- Logic ---
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
        setError(null);

        const response = await orderAPI.getUserOrders(1, 20); // Fetch latest 20
        if (response.success && response.data?.orders) {
          const delivered = response.data.orders.filter(
            (o: Order) => o.status === 'delivered'
          );
          setOrders(delivered);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [isLoggedIn]
  );

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleReorder = async (orderId: string) => {
    if (reorderingOrderId) return;
    try {
      setReorderingOrderId(orderId);
      const response = await orderAPI.reorder(orderId);

      if (response.success) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await loadCart();

        const addedCount = response.data?.summary?.addedItems || 0;
        Alert.alert(
          'Cart Updated',
          `Added ${addedCount} items from your past order.`,
          [
            { text: 'Go to Cart', onPress: () => router.push('/cart') },
            { text: 'Keep Shopping', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Reorder Failed', response.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reorder items.');
    } finally {
      setReorderingOrderId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // --- Helper to get images for preview ---
  const getPreviewImages = (items: OrderItem[]) => {
    // Return max 4 items for preview
    return items.slice(0, 5).map((item) => {
      if (typeof item.product === 'object' && item.product.images?.length) {
        return item.product.images[0];
      }
      return null;
    });
  };

  // --- UI Components ---
  if (!isLoggedIn) {
    return (
      <LoginPrompt
        icon='receipt-outline'
        title='Login to Reorder'
        subtitle='View your history and reorder your favorites in one tap.'
        buttonText='Sign In / Sign Up'
        modalTitle='Login Required'
        modalMessage='Please login to access history'
        showArrowIcon={true}
      />
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title='Past Orders' showBack={true} />
        <View style={styles.centerContent}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title='Past Orders' />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.centerContent}>
            <View style={[styles.iconCircle, styles.emptyIconCircle]}>
              <Ionicons
                name='basket-outline'
                size={40}
                color={COLORS.textLight}
              />
            </View>
            <Text style={styles.titleText}>No past orders</Text>
            <Text style={styles.subText}>
              Once you place an order, it will show up here for easy reordering.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const isReordering = reorderingOrderId === order._id;
            const previewImages = getPreviewImages(order.items);
            const remainingCount = Math.max(0, order.items.length - 4);

            return (
              <View key={order._id} style={styles.card}>
                {/* 1. Header: Date & Status */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.dateText}>
                      {formatDate(order.createdAt)}
                    </Text>
                    <Text style={styles.orderIdText}>
                      ID:{' '}
                      {order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Delivered</Text>
                    <Ionicons
                      name='checkmark-circle'
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                </View>

                {/* 2. Divider */}
                <View style={styles.divider} />

                {/* 3. Visual Item Preview (Horizontal Scroll) */}
                <View style={styles.previewContainer}>
                  <Text style={styles.itemsLabel}>
                    {order.items.length} items included
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageList}
                  >
                    {previewImages.map((imgUri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        {imgUri ? (
                          <Image
                            source={{ uri: imgUri }}
                            style={styles.itemImage}
                          />
                        ) : (
                          <View style={styles.placeholderImage}>
                            <Ionicons
                              name='image-outline'
                              size={16}
                              color={COLORS.textLight}
                            />
                          </View>
                        )}
                      </View>
                    ))}
                    {remainingCount > 0 && (
                      <View style={styles.moreCountWrapper}>
                        <Text style={styles.moreCountText}>
                          +{remainingCount}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* 4. Footer: Total & Action Button */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalPrice}>
                      ₹{order.total.toFixed(0)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.reorderBtn,
                      isReordering && styles.reorderBtnDisabled,
                    ]}
                    onPress={() => handleReorder(order._id)}
                    disabled={isReordering}
                    activeOpacity={0.8}
                  >
                    {isReordering ? (
                      <ActivityIndicator color='#FFF' size='small' />
                    ) : (
                      <>
                        <Ionicons name='refresh' size={18} color='#FFF' />
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  /* --- Loading / Empty States --- */
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconCircle: {
    backgroundColor: COLORS.border,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  /* --- Order Card Styles --- */
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* Header */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },

  /* Item Preview */
  previewContainer: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  imageList: {
    alignItems: 'center',
    gap: 8,
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    backgroundColor: COLORS.bg,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  moreCountWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textGray,
  },

  /* Footer */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    marginHorizontal: -16,
    marginBottom: -16,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  reorderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
  },
  reorderBtnDisabled: {
    backgroundColor: COLORS.textLight,
  },
  reorderBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
