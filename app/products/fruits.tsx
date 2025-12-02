import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { productAPI } from '../../lib/api';

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

export default function FruitsScreen() {
  const [fruits, setFruits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFruits();
  }, []);

  const loadFruits = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll load all products and filter by category name
      // In the future, we can pass the category ID to the API
      const response = await productAPI.getAll({
        isActive: true,
        limit: 100 // Load more products for category pages
      });

      if (response.success) {
        // Filter products that belong to fruits category
        const fruitProducts = response.data?.filter((product: Product) =>
          product.category?.name?.toLowerCase().includes('fruit') ||
          product.category?.name?.toLowerCase().includes('fruits')
        ) || [];
        setFruits(fruitProducts);
      } else {
        setError('Failed to load fruits');
      }
    } catch (err) {
      setError('Failed to load fruits');
      console.error('Error loading fruits:', err);
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

  if (error) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadFruits}>Tap to retry</Text>
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

