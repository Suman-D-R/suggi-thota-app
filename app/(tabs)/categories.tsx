import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import CategoryCard from '../../components/CategoryCard';
import Header from '../../components/Header';
import { categoryAPI } from '../../lib/api';

interface Category {
  _id: string;
  name: string;
  image?: string;
  slug?: string;
}

export default function CategoriesTab() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoryAPI.getAll(false);

      if (response.success && response.data?.categories) {
        setCategories(response.data.categories || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title='Categories' />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size='large' color='#16a34a' />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title='Categories' />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={loadCategories}>
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  // Calculate dynamic width based on number of categories
  const getCategoryItemStyle = (index: number) => {
    const count = categories.length;
    if (count === 1) {
      return { width: '100%' };
    } else if (count === 2) {
      return { width: '48%' }; // Each takes almost half width
    } else {
      // 3+ categories: use 2-column grid
      return { width: '48%' };
    }
  };

  return (
    <View style={styles.container}>
      <Header title='Categories' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {categories.map((category, index) => (
            <View key={category._id} style={[styles.categoryItem, getCategoryItemStyle(index)]}>
              <CategoryCard
                id={category._id}
                name={category.name}
                image={category.image}
                onPress={() => {
                  router.push(`/products/${category._id}`);
                }}
              />
            </View>
          ))}
        </View>
        {categories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories found</Text>
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
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: 'flex-start',
  },
  categoryItem: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
