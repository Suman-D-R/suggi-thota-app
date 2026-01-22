import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/Header';
import { orderAPI } from '../../../lib/api';
import { useUserStore } from '../../../store/userStore';

// --- MODERN CONSTANTS (Matching ProductCard.tsx theme) ---
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

// --- Interfaces (Kept same as original) ---
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
  cancelReason?: string;
  cancelledAt?: string;
  deliveryInstructions?: string;
  orderNotes?: string;
}

// --- Modern Utility Components ---

const StatusTimeline = ({ status }: { status: string }) => {
  // All status steps in order
  const steps = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
  ];

  // Map current status to step index
  const getStepIndex = (s: string) => {
    const lower = s.toLowerCase();
    const index = steps.findIndex((step) => step === lower);
    return index !== -1 ? index : 0;
  };

  const currentStep = getStepIndex(status);
  const isCancelled = status.toLowerCase() === 'cancelled';
  const isRefunded = status.toLowerCase() === 'refunded';

  if (isCancelled) {
    return (
      <View style={styles.cancelledBanner}>
        <Ionicons name='alert-circle' size={20} color={COLORS.danger} />
        <Text style={styles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  if (isRefunded) {
    return (
      <View style={styles.refundedBanner}>
        <Ionicons name='refresh-circle' size={20} color={COLORS.primary} />
        <Text style={styles.refundedText}>Order Refunded</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isLast = index === steps.length - 1;
        return (
          <View key={step} style={styles.timelineStep}>
            <View style={styles.timelineStepContent}>
              {/* Dot */}
              <View style={styles.timelineDotContainer}>
                <View
                  style={[
                    styles.timelineDot,
                    isActive ? styles.timelineDotActive : {},
                  ]}
                >
                  {isActive && (
                    <Ionicons name='checkmark' size={10} color='#fff' />
                  )}
                </View>
                {/* Vertical Line connector - always show between checkpoints */}
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      isActive && index < currentStep
                        ? styles.timelineLineActive
                        : {},
                    ]}
                  />
                )}
              </View>
              {/* Label */}
              <Text
                style={[
                  styles.timelineLabel,
                  isActive ? styles.timelineLabelActive : {},
                ]}
              >
                {step.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const DashedLine = () => (
  <View style={styles.dashedLineContainer}>
    {Array.from({ length: 20 }).map((_, i) => (
      <View key={i} style={styles.dashItem} />
    ))}
  </View>
);

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Logic (Kept same as original) ---
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

  // --- Helpers ---
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAddressString = (address: OrderAddress | string): string => {
    if (typeof address === 'string') return address;
    if (!address) return '';
    const parts = [
      address.apartment,
      address.street,
      address.city,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  };

  const getProductName = (item: OrderItem) =>
    typeof item.product === 'object' ? item.product?.name : 'Product';
  const getProductImage = (item: OrderItem) =>
    typeof item.product === 'object' && item.product?.images?.[0]
      ? item.product.images[0]
      : null;

  // --- Render States ---

  if (!isLoggedIn || error || !order) {
    return (
      <View style={styles.container}>
        <Header
          showBack={true}
          title='Order Details'
          backgroundColor={COLORS.bg}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name={!isLoggedIn ? 'log-in-outline' : 'alert-circle-outline'}
            size={64}
            color={COLORS.textLight}
          />
          <Text style={styles.errorText}>
            {!isLoggedIn
              ? 'Please login to view order details'
              : error || 'Order not found'}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header
          showBack={true}
          title='Order Details'
          backgroundColor={COLORS.bg}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        showBack={true}
        title={`Order #${order.orderNumber || order._id.slice(-6)}`}
        backgroundColor={COLORS.bg}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Status Section */}
        <View style={styles.sectionCard}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
          </View>
          <StatusTimeline status={order.status} />

          {order.estimatedDeliveryTime &&
            order.status !== 'delivered' &&
            order.status !== 'cancelled' && (
              <View style={styles.etaContainer}>
                <Ionicons
                  name='time-outline'
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.etaText}>
                  ETA:{' '}
                  {new Date(order.estimatedDeliveryTime).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </Text>
              </View>
            )}
        </View>

        {/* 2. Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>Items</Text>
          <View style={styles.itemsWrapper}>
            {order.items.map((item, index) => {
              const imageUrl = getProductImage(item);
              return (
                <View
                  key={index}
                  style={[
                    styles.itemRow,
                    index !== order.items.length - 1 && styles.itemBorder,
                  ]}
                >
                  <View style={styles.imageWrapper}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>
                          {getProductName(item).charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>{item.quantity}x</Text>
                    </View>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {getProductName(item)}
                    </Text>
                    {item.unit && (
                      <Text style={styles.itemVariant}>
                        {item.size} {item.unit}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.itemPrice}>₹{item.total.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. Delivery & Payment Grid */}
        <Text style={styles.sectionHeaderLabel}>Details</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <View style={styles.iconCircle}>
              <Ionicons name='location' size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.gridLabel}>Delivery to</Text>
            <Text style={styles.gridValue} numberOfLines={3}>
              {getAddressString(order.deliveryAddress)}
            </Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.iconCircle}>
              <Ionicons name='card' size={18} color={COLORS.textDark} />
            </View>
            <Text style={styles.gridLabel}>Payment</Text>
            <Text style={styles.gridValue}>
              {order.paymentMethod === 'cod' ? 'Cash' : 'Online'}
              {'\n'}
              <Text
                style={{
                  color:
                    order.paymentStatus === 'paid'
                      ? COLORS.primary
                      : COLORS.danger,
                }}
              >
                {order.paymentStatus.toUpperCase()}
              </Text>
            </Text>
          </View>
        </View>

        {/* 4. Receipt Summary */}
        <View style={styles.receiptContainer}>
          <Text style={styles.receiptTitle}>Order Summary</Text>
          <DashedLine />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{order.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              ₹{order.deliveryFee.toFixed(2)}
            </Text>
          </View>

          {order.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billValue, styles.discountText]}>
                -₹{order.discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes</Text>
            <Text style={styles.billValue}>₹{order.tax.toFixed(2)}</Text>
          </View>

          <DashedLine />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <SafeAreaView edges={['bottom']}>
          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>

      {/* Floating Action Icons */}
      {order.status === 'delivered' && (
        <View style={styles.floatingActions}>
          <TouchableOpacity style={styles.floatingButton}>
            <Ionicons name='refresh' size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- CONTAINER ---
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginTop: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },

  // --- SECTION HEADERS ---
  section: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
  sectionHeaderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  // --- CARDS ---
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '500',
  },

  // --- TIMELINE ---
  timelineContainer: {
    flexDirection: 'column',
    gap: 0,
    paddingVertical: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  timelineStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primarySoft,
  },
  timelineLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    zIndex: 1,
  },
  timelineLineActive: {
    backgroundColor: COLORS.primary,
  },
  timelineLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'capitalize',
    textAlign: 'left',
    flex: 1,
    lineHeight: 20,
    paddingTop: 2,
  },
  timelineLabelActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  cancelledBanner: {
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  refundedBanner: {
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  refundedText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  etaContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  etaText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // --- ITEMS ---
  itemsWrapper: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  placeholderImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: COLORS.textDark,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  quantityText: {
    color: COLORS.bg,
    fontSize: 10,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // --- GRID DETAILS ---
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 4,
    fontWeight: '500',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 18,
  },

  // --- RECEIPT ---
  receiptContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  dashedLineContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    height: 1,
    marginVertical: 16,
  },
  dashItem: {
    width: 6,
    height: 1,
    backgroundColor: COLORS.border,
    marginRight: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  billValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  discountText: {
    color: COLORS.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // --- FLOATING ACTIONS ---
  floatingActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
