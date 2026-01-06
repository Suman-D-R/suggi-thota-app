import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Header from '../../components/Header';
import LoginModal from '../../components/LoginModal';
import { useUserStore } from '../../store/userStore';
import { getProductById } from '../../data/dummyData';

// Dummy orders data - only delivered orders for reordering
const reorderableOrders = [
  {
    id: 'ORD001',
    date: '2024-01-15',
    items: [
      { productId: '1', quantity: 2, price: 50, discount: 10 },
      { productId: '2', quantity: 1, price: 40 },
      { productId: '7', quantity: 2, price: 60, discount: 10 },
    ],
    total: 455,
  },
  {
    id: 'ORD002',
    date: '2024-01-10',
    items: [
      { productId: '3', quantity: 2, price: 35, discount: 15 },
      { productId: '8', quantity: 1, price: 120 },
    ],
    total: 359.5,
  },
];

export default function ReorderTab() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleReorder = (orderId: string) => {
    // Navigate to order details or directly add to cart
    router.push(`/profile/orders/${orderId}`);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loginContainer}>
          <View style={styles.loginContent}>
            <Ionicons name="refresh-outline" size={80} color="#4CAF50" />
            <Text style={styles.loginTitle}>Reorder Your Favorites</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to quickly reorder your previous purchases
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
        <LoginModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title='Login Required'
          message='Please login to access your reorder history'
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {reorderableOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="refresh-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders to reorder</Text>
            <Text style={styles.emptySubtext}>
              Your previous orders will appear here for quick reordering
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>Quick Reorder</Text>
              <Text style={styles.headerSubtitle}>
                Reorder your previous purchases with one tap
              </Text>
            </View>

            {reorderableOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4CAF50"
                    />
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>Order #{order.id}</Text>
                      <Text style={styles.orderDate}>{order.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>₹{order.total.toFixed(2)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsPreview}>
                  {order.items.slice(0, 3).map((item, index) => {
                    const product = getProductById(item.productId);
                    if (!product) return null;

                    return (
                      <View key={index} style={styles.itemPreview}>
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
                        <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                      </View>
                    );
                  })}
                  {order.items.length > 3 && (
                    <View style={styles.moreItems}>
                      <Text style={styles.moreItemsText}>
                        +{order.items.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => handleReorder(order.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.reorderButtonText}>Reorder</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
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
    paddingBottom: 90,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
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
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F6F4',
    marginVertical: 12,
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  itemPreview: {
    position: 'relative',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F6F4',
  },
  itemPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderText: {
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  itemQuantity: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  moreItems: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F6F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginContent: {
    alignItems: 'center',
    width: '100%',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

