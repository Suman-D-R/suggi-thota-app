import { Ionicons } from '@expo/vector-icons';
import { IconArrowBadgeRightFilled } from '@tabler/icons-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orderAPI } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';

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

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  estimatedDeliveryTime?: string;
}

const ORDER_STATUSES = [
  {
    key: 'pending',
    label: 'Order Placed',
    icon: 'time-outline',
    color: '#FB923C', // Bright Orange for dark bg
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: 'checkmark-circle-outline',
    color: '#34D399', // Bright Emerald for dark bg
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: 'restaurant-outline',
    color: '#FB923C',
  },
  {
    key: 'ready',
    label: 'Ready',
    icon: 'checkmark-done-outline',
    color: '#34D399',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'bicycle-outline',
    color: '#34D399',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: 'checkmark-circle',
    color: '#34D399',
  },
];

export default function UnifiedFAB() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { items, getVariantKey } = useCartStore();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isOrderDismissed, setIsOrderDismissed] = useState(false);

  // Tab bar height is typically around 50-55px
  const gap = 16;
  const bottomPosition = Platform.OS === 'ios' ? gap : insets.bottom + gap;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  // Fetch latest active order and count pending orders
  const fetchLatestOrder = useCallback(async () => {
    if (!isLoggedIn) {
      setLatestOrder(null);
      setPendingOrdersCount(0);
      setIsOrderDismissed(false);
      return;
    }

    try {
      // Fetch more orders to count pending ones
      const response = await orderAPI.getUserOrders(1, 50);

      if (
        response.success &&
        response.data?.orders &&
        response.data.orders.length > 0
      ) {
        // Filter pending orders (not delivered, cancelled, or refunded)
        const pendingOrders = response.data.orders.filter(
          (order: Order) =>
            order.status !== 'delivered' &&
            order.status !== 'cancelled' &&
            order.status !== 'refunded'
        );

        if (pendingOrders.length > 0) {
          // Get the latest pending order
          const latestPendingOrder = pendingOrders[0];

          // Reset dismissed state if it's a different order
          setLatestOrder((prevOrder) => {
            if (prevOrder?._id !== latestPendingOrder._id) {
              setIsOrderDismissed(false);
            }
            return latestPendingOrder;
          });

          // Set pending orders count
          setPendingOrdersCount(pendingOrders.length);
        } else {
          setLatestOrder(null);
          setPendingOrdersCount(0);
          setIsOrderDismissed(false);
        }
      } else {
        setLatestOrder(null);
        setPendingOrdersCount(0);
        setIsOrderDismissed(false);
      }
    } catch (error) {
      console.error('Failed to fetch latest order:', error);
      setLatestOrder(null);
      setPendingOrdersCount(0);
      setIsOrderDismissed(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchLatestOrder();

    // Poll for order updates every 10 seconds
    const interval = setInterval(fetchLatestOrder, 10000);

    return () => clearInterval(interval);
  }, [fetchLatestOrder]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLatestOrder();
    }, [fetchLatestOrder])
  );

  // Update progress animation when order status changes
  useEffect(() => {
    if (latestOrder && !isOrderDismissed) {
      const currentStatusIndex = ORDER_STATUSES.findIndex(
        (s) => s.key === latestOrder.status
      );
      const activeStatusIndex =
        currentStatusIndex >= 0 ? currentStatusIndex : 0;
      const progress = ((activeStatusIndex + 1) / 5) * 100;
      progressWidth.value = withTiming(progress, { duration: 500 });
    }
  }, [latestOrder?.status, isOrderDismissed]);

  // Determine what to show
  const hasActiveOrder = latestOrder && !isOrderDismissed;
  const hasCartItems = items.length > 0;
  const showOrder = hasActiveOrder;
  const showCart = hasCartItems;

  // Don't show if nothing to display
  if (!showOrder && !showCart) {
    return null;
  }

  const handleCloseOrder = (e: any) => {
    e.stopPropagation();
    setIsOrderDismissed(true);
  };

  const handleOrderPress = () => {
    if (pendingOrdersCount > 1) {
      // Multiple orders - redirect to orders list
      router.push('/profile/orders');
    } else if (latestOrder) {
      // Single order - redirect to order details
      router.push(`/profile/orders/${latestOrder._id}`);
    }
  };

  const handleCartPress = () => {
    router.push('/cart');
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const formatEstimatedTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMs < 0) return null;

      if (diffMinutes < 60) {
        return `in ${diffMinutes} mins`;
      }
      const diffHours = Math.floor(diffMinutes / 60);
      return `in ${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'}`;
    } catch {
      return null;
    }
  };

  const currentStatusIndex = latestOrder
    ? ORDER_STATUSES.findIndex((s) => s.key === latestOrder.status)
    : -1;
  const activeStatusIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;
  const currentStatusObj = ORDER_STATUSES[activeStatusIndex];

  const estimatedTime = latestOrder
    ? formatEstimatedTime(latestOrder.estimatedDeliveryTime)
    : null;

  // Dynamic color for icons based on status
  const accentColor = currentStatusObj?.color || COLORS.primary;

  // Get last 3 items from cart
  const lastThreeItems = items.slice(-3).reverse();

  return (
    <View
      style={[
        styles.fabContainer,
        {
          bottom: bottomPosition,
          justifyContent: showCart && !showOrder ? 'space-evenly' : 'flex-end',
        },
      ]}
    >
      {/* Order Status Section - Left Side */}
      {showOrder && (
        <Pressable
          onPress={handleOrderPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.orderSection}
        >
          <Animated.View
            style={[
              styles.orderFab,
              animatedStyle,
              // Dark Background Styles applied here
              {
                backgroundColor: '#1F2937', // Dark Charcoal / Gunmetal
                borderColor: '#374151', // Slightly lighter border
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          >
            {/* Top Row: Icon + Text + Close */}
            <View style={styles.orderContent}>
              <View style={styles.orderRow}>
                {/* Status Icon Circle */}
                <View
                  style={[
                    styles.statusIconContainer,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle glass effect
                    },
                  ]}
                >
                  <Ionicons
                    name={currentStatusObj?.icon as any}
                    size={18}
                    color='#FFFFFF' // Color pops against dark bg
                  />
                </View>

                {/* Text Info */}
                <View style={styles.orderInfo}>
                  <Text style={styles.currentStatusText}>
                    {currentStatusObj?.label || 'Processing'}
                  </Text>

                  {pendingOrdersCount > 1 ? (
                    <Text style={styles.estimatedTime}>
                      {pendingOrdersCount} active orders
                    </Text>
                  ) : (
                    estimatedTime && (
                      <Text style={styles.estimatedTime}>
                        Arriving {estimatedTime}
                      </Text>
                    )
                  )}
                </View>

                {/* Close Button */}
                <Pressable
                  onPress={handleCloseOrder}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name='close'
                    size={14}
                    color='#9CA3AF' // Light gray
                  />
                </Pressable>
              </View>

              {/* Progress Bar Section */}
              <View style={styles.progressBarContainer}>
                {/* Darker track for the progress bar */}
                <View
                  style={[
                    styles.progressBarBackground,
                    { backgroundColor: 'rgba(255,255,255,0.1)' },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.progressBarActive,
                    progressAnimatedStyle,
                    {
                      backgroundColor: accentColor, // Bright orange or green fill
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </Pressable>
      )}

      {/* Cart Section - Right Side */}
      {showCart && (
        <Pressable
          onPress={handleCartPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.cartSection, showOrder && styles.cartSectionWithOrder]}
        >
          <Animated.View style={[styles.cartFab, animatedStyle]}>
            {/* Product Images */}
            <View style={styles.imagesContainer}>
              {lastThreeItems.map((item, index) => (
                <View
                  key={getVariantKey(item._id, item.selectedVariant)}
                  style={[
                    styles.imageWrapper,
                    {
                      zIndex: lastThreeItems.length - index,
                      marginLeft: index === 0 ? 0 : -32,
                    },
                  ]}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Title */}
            <View style={styles.rowContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Cart</Text>
                <Text style={styles.titleCount}>
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </Text>
              </View>
              <View style={styles.arrowContainer}>
                <IconArrowBadgeRightFilled size={40} color='#015E41' />
              </View>
            </View>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 1000,
  },

  // --- ORDER SECTION STYLES (High Contrast Dark Theme) ---
  orderSection: {
    flex: 1,
    minWidth: 180,
  },
  orderFab: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 64,
  },
  orderContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currentStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF', // White text
    marginBottom: 2,
  },
  estimatedTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D1D5DB', // Light Gray (gray-300)
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass effect circle
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  progressBarContainer: {
    position: 'relative',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  progressBarActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    height: 4,
  },

  // --- CART SECTION STYLES (Unchanged) ---
  cartSection: {
    alignSelf: 'center',
  },
  cartSectionWithOrder: {
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  cartFab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#015E4180',
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 32,
    gap: 8,
    backgroundColor: COLORS.primary,
    elevation: 2,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 2,
  },
  imageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    lineHeight: 16,
  },
  titleCount: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  arrowContainer: {
    marginLeft: 2,
  },
});
