import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { categoryAPI } from '../../lib/api';
import { useLocationStore } from '../../store/locationStore';

// --- MODERN THEME CONSTANTS ---
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

// --- Types ---
interface Product {
  _id: string;
  name: string;
  images?: string[];
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  size: number;
  unit: string;
  stock: number;
  isOutOfStock: boolean;
}

interface CategoryWithProducts {
  _id: string;
  name: string;
  products: Product[];
}

// --- Layout Constants ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const GAP = 8; // Match ProductCard gap
// Match ProductCard 3-column layout
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * 2) / 3;

export default function CategoriesTab() {
  const router = useRouter();
  const { selectedStore } = useLocationStore();
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStore?._id) {
      loadCategories();
    } else {
      setError('Please select a store');
      setLoading(false);
    }
  }, [selectedStore?._id]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryAPI.getWithProducts(
        selectedStore?._id || ''
      );
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories || []);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const getFirstName = (name: string) => name.split('|')[0].trim();

  const handleProductPress = (productName: string) => {
    router.push({
      pathname: '/search',
      params: { q: getFirstName(productName) },
    });
  };

  const renderProductCard = (product: Product) => {
    const hasDiscount = product.discount > 0;
    const isOutOfStock = product.isOutOfStock || product.stock <= 0;

    return (
      <TouchableOpacity
        key={product._id}
        style={styles.card}
        onPress={() => handleProductPress(product.name)}
        activeOpacity={0.7}
      >
        {/* Image Container */}
        <View style={styles.imageSection}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              style={[styles.productImage, isOutOfStock && styles.grayscale]}
              resizeMode='contain'
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {getFirstName(product.name).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Badges (Left Side - match ProductCard) */}
          <View style={styles.badgeRow}>
            {hasDiscount && !isOutOfStock && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round(product.discount)}% OFF
                </Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={styles.oosBadge}>
                <Text style={styles.oosText}>Sold Out</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          {/* Unit Text */}
          <Text style={styles.unitText}>
            {product.size} {product.unit}
          </Text>

          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {getFirstName(product.name)}
          </Text>

          {/* Price Row */}
          <View style={styles.priceContainer}>
            <Text style={styles.sellingPrice}>
              ₹{Math.round(product.sellingPrice)}
            </Text>
            {hasDiscount && product.originalPrice > 0 && (
              <Text style={styles.originalPrice}>
                ₹{Math.round(product.originalPrice)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading)
    return (
      <View style={styles.container}>
        <Header title='Explore' />
        <View style={styles.centerContainer}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );

  if (error && !loading && categories.length === 0) {
    return (
      <View style={styles.container}>
        <Header title='Explore' />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadCategories}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title='Categories' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {categories.length === 0 && !loading ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No categories available at this store
            </Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category._id} style={styles.categorySection}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{category.name}</Text>
                {category.products.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleProductPress(category.name)}
                    style={styles.seeAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Product Grid */}
              {category.products.length > 0 ? (
                <View style={styles.productGrid}>
                  {category.products.map(renderProductCard)}
                </View>
              ) : (
                <View style={styles.emptyCategoryContainer}>
                  <Text style={styles.emptyCategoryText}>
                    No products in this category
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
        {/* Bottom padding for navigation bars */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- LAYOUT & BASICS ---
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // --- CATEGORY SECTION ---
  categorySection: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: PADDING,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    gap: GAP,
    justifyContent: 'flex-start',
  },
  emptyCategoryContainer: {
    paddingVertical: 16,
    paddingHorizontal: PADDING,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  emptyStateContainer: {
    paddingVertical: 64,
    paddingHorizontal: PADDING,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    fontWeight: '500',
  },

  // --- CARD STYLES (Match ProductCard) ---
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // --- IMAGE SECTION ---
  imageSection: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  grayscale: {
    opacity: 0.4,
    tintColor: COLORS.textLight,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'column',
    gap: 4,
    zIndex: 10,
  },
  discountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.2,
  },
  oosBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  oosText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },

  // --- DETAILS SECTION ---
  detailsSection: {
    padding: 10,
    paddingTop: 8,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 18,
    height: 22,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
});
