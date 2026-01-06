import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
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

export default function FruitsScreen() {
  const router = useRouter();
  const [fruits, setFruits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const selectedAddress = useLocationStore((state) => state.getSelectedAddress());

  useEffect(() => {
    loadFruits();
  }, [selectedAddress?.id]);

  const loadFruits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if location is selected
      const address = selectedAddress;
      if (!address || !address.coordinates) {
        setError('Please select a delivery location to view products');
        setHasStore(false);
        setFruits([]);
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
            // Filter products that belong to fruits category
            const fruitProducts = productsData.filter((product: Product) =>
              product.category?.name?.toLowerCase().includes('fruit') ||
              product.category?.name?.toLowerCase().includes('fruits')
            );
            setFruits(fruitProducts);
          } else {
            setError('Failed to load fruits');
            setFruits([]);
          }
        } else {
          setHasStore(false);
          setFruits([]);
          setError('No store available at this location. Please select a different location.');
        }
      } catch (storeErr: any) {
        console.error('Error checking store availability:', storeErr);
        setHasStore(false);
        setFruits([]);
        setError('Unable to check store availability. Please try again.');
      }
    } catch (err) {
      setError('Failed to load fruits');
      console.error('Error loading fruits:', err);
      setHasStore(false);
      setFruits([]);
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
          <Text style={styles.loadingText}>Loading fruits...</Text>
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
          <Text style={styles.retryText} onPress={loadFruits}>Tap to retry</Text>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fruits</Text>
          {fruits.length === 0 ? (
            <Text style={styles.emptyText}>No fruits available</Text>
          ) : (
            <View style={styles.productGrid}>
              {fruits.map((product) => (
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

