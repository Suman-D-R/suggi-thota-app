import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { productAPI, storeAPI } from '../../lib/api';
import { useLocationStore } from '../../store/locationStore';

interface Product {
  _id: string;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  unit: string;
  size: number;
  variants?: Array<{
    sku?: string;
    size: number;
    unit: string;
    originalPrice?: number;
    sellingPrice?: number;
    discount?: number;
    stock?: number;
    isAvailable?: boolean;
    isOutOfStock?: boolean;
  }>;
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  stock?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
}

export default function VegetablesScreen() {
  const router = useRouter();
  const [vegetables, setVegetables] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const selectedAddress = useLocationStore((state) => state.getSelectedAddress());

  useEffect(() => {
    loadVegetables();
  }, [selectedAddress?.id]);

  const loadVegetables = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if location is selected
      const address = selectedAddress;
      if (!address || !address.coordinates) {
        setError('Please select a delivery location to view products');
        setHasStore(false);
        setVegetables([]);
        setLoading(false);
        return;
      }

      const { latitude, longitude } = address.coordinates;

      // Check if store is available at this location
      try {
        const storesResponse = await storeAPI.findNearby(latitude, longitude, 10);
        if (storesResponse.success && storesResponse.data?.stores && storesResponse.data.stores.length > 0) {
          setHasStore(true);
          
          // Load products for this location with category filter
          const productsResponse = await productAPI.getByLocation({
            lat: latitude,
            lng: longitude,
            limit: 100,
            maxDistance: 10,
          });

          if (productsResponse.success) {
            const productsData = productsResponse.data?.products || productsResponse.data || [];
            // Filter products that belong to vegetables category
            const vegetableProducts = productsData.filter((product: Product) =>
              product.category?.name?.toLowerCase().includes('vegetable') ||
              product.category?.name?.toLowerCase().includes('vegetables')
            );
            setVegetables(vegetableProducts);
          } else {
            setError('Failed to load vegetables');
            setVegetables([]);
          }
        } else {
          setHasStore(false);
          setVegetables([]);
          setError('No store available at this location. Please select a different location.');
        }
      } catch (storeErr: any) {
        console.error('Error checking store availability:', storeErr);
        setHasStore(false);
        setVegetables([]);
        setError('Unable to check store availability. Please try again.');
      }
    } catch (err) {
      setError('Failed to load vegetables');
      console.error('Error loading vegetables:', err);
      setHasStore(false);
      setVegetables([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading vegetables...</Text>
        </View>
      </View>
    );
  }

  if (error && hasStore === false) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadVegetables}>Tap to retry</Text>
          <Text style={[styles.retryText, { marginTop: 16 }]} onPress={() => router.push('/profile/add-address')}>
            Change Location
          </Text>
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
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vegetables</Text>
          {vegetables.length === 0 ? (
            <Text style={styles.emptyText}>No vegetables available</Text>
          ) : (
            <View style={styles.productGrid}>
              {vegetables.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  scrollView: {
    flex: 1,
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
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
});
