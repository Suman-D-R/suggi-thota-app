// import { Ionicons } from '@expo/vector-icons';
// import { useFocusEffect, useRouter } from 'expo-router';
// import { useCallback, useEffect, useState } from 'react';
// import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from 'react-native-reanimated';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { orderAPI } from '../lib/api';
// import { useCartStore } from '../store/cartStore';
// import { useUserStore } from '../store/userStore';

// interface Order {
//   _id: string;
//   orderNumber: string;
//   status: string;
//   total: number;
//   estimatedDeliveryTime?: string;
// }

// const ORDER_STATUSES = [
//   { key: 'pending', label: 'Order Placed', icon: 'time-outline' },
//   { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
//   { key: 'preparing', label: 'Preparing', icon: 'restaurant-outline' },
//   { key: 'ready', label: 'Ready', icon: 'checkmark-done-outline' },
//   { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'car-outline' },
//   { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle' },
// ];

// export default function OrderStatusFAB() {
//   const router = useRouter();
//   const isLoggedIn = useUserStore((state) => state.isLoggedIn);
//   const cartItems = useCartStore((state) => state.items);
//   const insets = useSafeAreaInsets();
//   const scale = useSharedValue(1);
//   const progressWidth = useSharedValue(0);
//   const [latestOrder, setLatestOrder] = useState<Order | null>(null);
//   const [isDismissed, setIsDismissed] = useState(false);

//   // Check if CartFAB is visible
//   const hasCartItems = cartItems.length > 0;

//   // Position - same as CartFAB when both are visible, or slightly higher when alone
//   // Tab bar height is typically around 50-55px
//   const gap = 10;
//   const bottomPosition =
//     Platform.OS === 'ios' ? insets.bottom - 20 : insets.bottom + gap;

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: scale.value }],
//     };
//   });

//   const progressAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       width: `${progressWidth.value}%`,
//     };
//   });

//   // Fetch latest active order
//   const fetchLatestOrder = useCallback(async () => {
//     if (!isLoggedIn) {
//       setLatestOrder(null);
//       setIsDismissed(false);
//       return;
//     }

//     try {
//       const response = await orderAPI.getUserOrders(1, 1);

//       if (
//         response.success &&
//         response.data?.orders &&
//         response.data.orders.length > 0
//       ) {
//         const order = response.data.orders[0];
//         // Only show if order is not delivered, cancelled, or refunded
//         if (
//           order.status !== 'delivered' &&
//           order.status !== 'cancelled' &&
//           order.status !== 'refunded'
//         ) {
//           // Reset dismissed state if it's a different order
//           setLatestOrder((prevOrder) => {
//             if (prevOrder?._id !== order._id) {
//               setIsDismissed(false);
//             }
//             return order;
//           });
//         } else {
//           setLatestOrder(null);
//           setIsDismissed(false);
//         }
//       } else {
//         setLatestOrder(null);
//         setIsDismissed(false);
//       }
//     } catch (error) {
//       console.error('Failed to fetch latest order:', error);
//       setLatestOrder(null);
//       setIsDismissed(false);
//     }
//   }, [isLoggedIn]);

//   useEffect(() => {
//     fetchLatestOrder();

//     // Poll for order updates every 10 seconds
//     const interval = setInterval(fetchLatestOrder, 10000);

//     return () => clearInterval(interval);
//   }, [fetchLatestOrder]);

//   // Refresh when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchLatestOrder();
//     }, [fetchLatestOrder])
//   );

//   // Update progress animation when order status changes
//   useEffect(() => {
//     if (latestOrder) {
//       const currentStatusIndex = ORDER_STATUSES.findIndex(
//         (s) => s.key === latestOrder.status
//       );
//       const activeStatusIndex =
//         currentStatusIndex >= 0 ? currentStatusIndex : 0;
//       const progress = ((activeStatusIndex + 1) / 5) * 100;
//       progressWidth.value = withTiming(progress, { duration: 500 });
//     }
//   }, [latestOrder?.status]);

//   // Don't show if no active order or if dismissed
//   if (!isLoggedIn || !latestOrder || isDismissed) {
//     return null;
//   }

//   const handleClose = (e: any) => {
//     e.stopPropagation();
//     setIsDismissed(true);
//   };

//   const currentStatusIndex = ORDER_STATUSES.findIndex(
//     (s) => s.key === latestOrder.status
//   );
//   const activeStatusIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

//   const handlePress = () => {
//     router.push(`/profile/orders/${latestOrder._id}`);
//   };

//   const handlePressIn = () => {
//     scale.value = withSpring(0.97);
//   };

//   const handlePressOut = () => {
//     scale.value = withSpring(1);
//   };

//   const formatEstimatedTime = (dateString?: string) => {
//     if (!dateString) return null;
//     try {
//       const date = new Date(dateString);
//       const now = new Date();
//       const diffMs = date.getTime() - now.getTime();
//       const diffMinutes = Math.floor(diffMs / (1000 * 60));

//       if (diffMs < 0) return null;

//       if (diffMinutes < 60) {
//         return `in ${diffMinutes} min`;
//       }
//       const diffHours = Math.floor(diffMinutes / 60);
//       return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
//     } catch {
//       return null;
//     }
//   };

//   const estimatedTime = formatEstimatedTime(latestOrder.estimatedDeliveryTime);

//   return (
//     <View
//       style={[
//         styles.fabContainer,
//         {
//           bottom: bottomPosition,
//           left: 16,
//           right: hasCartItems ? 'auto' : 16,
//           flex: hasCartItems ? 1 : undefined,
//           marginRight: hasCartItems ? 8 : 0,
//         },
//       ]}
//     >
//       <Pressable
//         onPress={handlePress}
//         onPressIn={handlePressIn}
//         onPressOut={handlePressOut}
//         style={{ flex: 1 }}
//       >
//         <Animated.View style={[styles.fab, animatedStyle]}>
//           {/* Close Button */}
//           <Pressable
//             onPress={handleClose}
//             style={styles.closeButton}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Ionicons name='close' size={18} color='#999' />
//           </Pressable>

//           {/* Main Content */}
//           <View style={styles.content}>
//             {/* Header Section */}
//             <View style={styles.headerSection}>
//               <View style={styles.headerLeft}>
//                 <View style={styles.statusBadge}>
//                   <Ionicons
//                     name={ORDER_STATUSES[activeStatusIndex]?.icon as any}
//                     size={16}
//                     color='#4CAF50'
//                   />
//                 </View>
//                 <View style={styles.headerText}>
//                   <Text style={styles.orderHeading}>Order Placed</Text>
//                   {estimatedTime && (
//                     <Text style={styles.estimatedTime}>{estimatedTime}</Text>
//                   )}
//                 </View>
//               </View>
//               <View style={styles.amountContainer}>
//                 <Text style={styles.orderTotal}>
//                   ₹{latestOrder.total.toFixed(2)}
//                 </Text>
//               </View>
//             </View>

//             {/* Progress Bar Section */}
//             <View style={styles.progressSection}>
//               <View style={styles.progressBarContainer}>
//                 <View style={styles.progressBarBackground} />
//                 <Animated.View
//                   style={[styles.progressBarActive, progressAnimatedStyle]}
//                 />
//               </View>
//               <Text style={styles.currentStatusText}>
//                 {ORDER_STATUSES[activeStatusIndex]?.label || 'Processing'}
//               </Text>
//             </View>

//             {/* View Details Hint */}
//             <View style={styles.footerHint}>
//               <Text style={styles.footerText}>Tap to view details</Text>
//               <Ionicons name='chevron-forward' size={14} color='#4CAF50' />
//             </View>
//           </View>
//         </Animated.View>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   fabContainer: {
//     position: 'absolute',
//     alignItems: 'stretch',
//     pointerEvents: 'box-none',
//     zIndex: 1000,
//   },
//   fab: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     padding: 0,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.12,
//     shadowRadius: 20,
//     elevation: 10,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//     overflow: 'hidden',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: '#F8F8F8',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   content: {
//     padding: 18,
//     paddingTop: 20,
//   },
//   headerSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 12,
//   },
//   statusBadge: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#E8F5E9',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   headerText: {
//     flex: 1,
//   },
//   orderHeading: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#1A1A1A',
//     marginBottom: 2,
//     letterSpacing: -0.3,
//   },
//   estimatedTime: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#666',
//     marginTop: 2,
//   },
//   amountContainer: {
//     alignItems: 'flex-end',
//   },
//   orderTotal: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#4CAF50',
//     letterSpacing: -0.3,
//   },
//   progressSection: {
//     marginBottom: 12,
//   },
//   progressBarContainer: {
//     position: 'relative',
//     height: 6,
//     marginBottom: 10,
//     borderRadius: 3,
//     overflow: 'hidden',
//     backgroundColor: '#F5F5F5',
//   },
//   progressBarBackground: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     backgroundColor: '#E8E8E8',
//     borderRadius: 3,
//   },
//   progressBarActive: {
//     position: 'absolute',
//     left: 0,
//     top: 0,
//     bottom: 0,
//     backgroundColor: '#4CAF50',
//     borderRadius: 3,
//     height: 6,
//   },
//   currentStatusText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#4CAF50',
//     textAlign: 'left',
//   },
//   footerHint: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     marginTop: 4,
//     gap: 4,
//   },
//   footerText: {
//     fontSize: 11,
//     fontWeight: '500',
//     color: '#999',
//   },
// });
