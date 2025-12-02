import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

// Dummy orders data
const orders = [
  {
    id: 'ORD001',
    date: '2024-01-15',
    status: 'Delivered',
    items: 5,
    total: 450,
  },
  {
    id: 'ORD002',
    date: '2024-01-10',
    status: 'Delivered',
    items: 3,
    total: 320,
  },
  {
    id: 'ORD003',
    date: '2024-01-05',
    status: 'Cancelled',
    items: 2,
    total: 180,
  },
];

export default function OrdersScreen() {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#4CAF50';
      case 'Cancelled':
        return '#FF5722';
      case 'Processing':
        return '#FF9800';
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
      default:
        return 'ellipse';
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Your order history will appear here
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Ionicons
                    name={getStatusIcon(order.status) as any}
                    size={24}
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

              <View style={styles.divider} />

              <View style={styles.orderDetails}>
                <View style={styles.orderRow}>
                  <View style={styles.orderRowLeft}>
                    <Ionicons name="cube-outline" size={18} color="#666" />
                    <Text style={styles.orderLabel}>Items</Text>
                  </View>
                  <Text style={styles.orderValue}>{order.items}</Text>
                </View>
                <View style={styles.orderRow}>
                  <View style={styles.orderRowLeft}>
                    <Ionicons name="cash-outline" size={18} color="#666" />
                    <Text style={styles.orderLabel}>Total</Text>
                  </View>
                  <Text style={styles.orderTotal}>₹{order.total.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => router.push(`/profile/orders/${order.id}`)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F6F4',
  },
  orderHeader: {
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F6F4',
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  viewButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

