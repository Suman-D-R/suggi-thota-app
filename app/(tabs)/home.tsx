import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import CartFAB from '../../components/CartFAB';
import Header from '../../components/Header';
import HeroCarousel from '../../components/HeroCarousel';
import LocationHeader from '../../components/LocationHeader';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { categoryAPI, productAPI } from '../../lib/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface Category {
  _id: string;
  name: string;
  image?: string;
}

export default function HomeTab() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load featured products
      const productsResponse = await productAPI.getAll({
        limit: 6,
        isActive: true,
        isFeatured: true,
      });

      // Load categories
      const categoriesResponse = await categoryAPI.getMain();

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      } else {
        setError('Failed to load products');
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data?.categories || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = products.slice(0, 6);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <AppHeader />
        <LocationHeader />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size='large' color='#16a34a' />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <AppHeader />
        <LocationHeader />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadData}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <AppHeader />
      <LocationHeader />
      <View style={styles.stickySearchContainer}>
        <SearchBar />
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroCarousel />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryItem}
                onPress={() => router.push(`/products/${category._id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryImageContainer}>
                  {category.image ? (
                    <Image
                      source={{ uri: category.image }}
                      style={styles.categoryImage}
                      resizeMode='cover'
                    />
                  ) : (
                    <View style={[styles.categoryPlaceholder, { backgroundColor: category._id === 'vegetables' ? '#E8F5E9' : '#FFF3E0' }]}>
                      <Text style={[styles.categoryPlaceholderText, { color: category._id === 'vegetables' ? '#2E7D32' : '#EF6C00' }]}>
                        {category.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <View style={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </View>
        </View>
      </ScrollView>
      <CartFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: '#16a34a',
    textDecorationLine: 'underline',
  },
  stickySearchContainer: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
    padding: 3, // Border effect
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  categoryPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
});
