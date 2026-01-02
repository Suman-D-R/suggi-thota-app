import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useWishlistStore } from '../../store/wishlistStore';

export default function WishlistTab() {
  const router = useRouter();
  const { items, removeItem } = useWishlistStore();

  const handleRemoveFromWishlist = (productId: string) => {
    removeItem(productId);
  };

  return (
    <View style={styles.container}>
      <Header title='My Wishlist' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name='heart-outline' size={64} color='#ccc' />
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtext}>
              Start adding products you love!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <View style={styles.productGrid}>
              {items.map((product) => (
                <View key={product._id} style={styles.productWrapper}>
                  <ProductCard product={product} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromWishlist(product._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name='heart' size={20} color='#e74c3c' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
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
  browseButton: {
    marginTop: 24,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsContainer: {
    padding: 10,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  productWrapper: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
});

