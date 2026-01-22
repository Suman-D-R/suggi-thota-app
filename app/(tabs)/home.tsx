import { IconUser } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Header from '../../components/Header';
import HeroCarousel from '../../components/HeroCarousel';
import LocationHeader from '../../components/LocationHeader';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import UnifiedFAB from '../../components/UnifiedFAB';
import { categoryAPI, productAPI, storeAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const loadCart = useCartStore((state) => state.loadCart);
  const selectedAddress = useLocationStore((state) =>
    state.getSelectedAddress()
  );
  const setSelectedStore = useLocationStore((state) => state.setSelectedStore);

  const selectedStore = useLocationStore((state) => state.selectedStore);

  useEffect(() => {
    loadData();
  }, [selectedAddress?.id]);

  // Load cart when store is selected or changes
  useEffect(() => {
    if (selectedStore?._id) {
      loadCart();
    }
  }, [selectedStore?._id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if location is selected
      const address = selectedAddress;
      if (!address || !address.coordinates) {
        setError('Please select a delivery location to view products');
        setHasStore(false);
        setProducts([]);
        setLoading(false);
        return;
      }

      const { latitude, longitude } = address.coordinates;

      // Check if store is available at this location
      try {
        const storesResponse = await storeAPI.findNearby(
          latitude,
          longitude,
          10
        );
        if (
          storesResponse.success &&
          storesResponse.data?.stores &&
          storesResponse.data.stores.length > 0
        ) {
          setHasStore(true);
          const selectedStore = storesResponse.data.stores[0];
          setStoreName(selectedStore.name);
          setSelectedStore(selectedStore);

          // Load cart after store is selected
          loadCart();

          // Load products for this location
          const productsResponse = await productAPI.getByLocation({
            lat: latitude,
            lng: longitude,
            limit: 6,
            isFeatured: true,
            maxDistance: 10,
          });

          if (productsResponse.success) {
            // Handle both old format (data) and new format (data.products)
            const productsData =
              productsResponse.data?.products || productsResponse.data || [];
            console.log(
              'Featured products loaded:',
              productsData.length,
              productsData
            );
            setProducts(Array.isArray(productsData) ? productsData : []);
          } else {
            console.error('Failed to load products:', productsResponse);
            const errorMessage =
              productsResponse?.message ||
              'Failed to load products. Please try again.';
            setError(errorMessage);
            setProducts([]);
          }
        } else {
          setHasStore(false);
          setProducts([]);
          setSelectedStore(null);
          setError(
            'No store available at this location. Please select a different location.'
          );
        }
      } catch (storeErr: any) {
        console.error('Error checking store availability:', storeErr);
        setHasStore(false);
        setProducts([]);
        setError('Unable to check store availability. Please try again.');
      }

      // Load categories (always load, regardless of store availability)
      const categoriesResponse = await categoryAPI.getMain();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data?.categories || []);
      }
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        err?.response?.data?.message ||
        'Failed to load data. Please try again.';
      setError(errorMessage);
      console.error('Error loading data:', err);
      setHasStore(false);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Check if location is selected
      const address = selectedAddress;
      if (!address || !address.coordinates) {
        setError('Please select a delivery location to view products');
        setHasStore(false);
        setProducts([]);
        setRefreshing(false);
        return;
      }

      const { latitude, longitude } = address.coordinates;

      // Check if store is available at this location
      try {
        const storesResponse = await storeAPI.findNearby(
          latitude,
          longitude,
          10
        );
        if (
          storesResponse.success &&
          storesResponse.data?.stores &&
          storesResponse.data.stores.length > 0
        ) {
          setHasStore(true);
          const selectedStore = storesResponse.data.stores[0];
          setStoreName(selectedStore.name);
          setSelectedStore(selectedStore);

          // Load cart after store is selected
          loadCart();

          // Load products for this location
          const productsResponse = await productAPI.getByLocation({
            lat: latitude,
            lng: longitude,
            limit: 6,
            isFeatured: true,
            maxDistance: 10,
          });

          if (productsResponse.success) {
            const productsData =
              productsResponse.data?.products || productsResponse.data || [];
            setProducts(productsData);
          }
        } else {
          setHasStore(false);
          setProducts([]);
          setSelectedStore(null);
          setError(
            'No store available at this location. Please select a different location.'
          );
        }
      } catch (storeErr: any) {
        console.error('Error checking store availability:', storeErr);
        setHasStore(false);
        setProducts([]);
        const errorMessage =
          storeErr?.message ||
          storeErr?.response?.data?.message ||
          'Unable to check store availability. Please try again.';
        setError(errorMessage);
      }

      // Load categories
      const categoriesResponse = await categoryAPI.getMain();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data?.categories || []);
      }

      // Reload cart on refresh
      loadCart();
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      const errorMessage =
        err?.message ||
        err?.response?.data?.message ||
        'Failed to refresh data. Please try again.';
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const featuredProducts = products.slice(0, 6);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <LocationHeader />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Show error screen for any error (not just when hasStore === false)
  if (error && !loading) {
    const isNoStoreError =
      error.includes('No store available') ||
      error.includes("don't currently deliver");
    const isLocationError = error.includes('select a delivery location');

    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.appName}>Vitura</Text>
            <LocationHeader />
          </View>
          <TouchableOpacity
            style={styles.userIconContainer}
            onPress={() => router.push('/account')}
            activeOpacity={0.7}
          >
            <IconUser strokeWidth={1.8} size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.stickySearchContainer,
            isScrolled && styles.scrolledBorder,
          ]}
        >
          <SearchBar />
        </View>
        <View
          style={[
            styles.container,
            styles.centerContent,
            styles.errorContainer,
          ]}
        >
          <View style={styles.errorContent}>
            {isNoStoreError ? (
              <Svg
                width={80}
                height={80}
                viewBox='0 0 48 48'
                style={styles.errorIcon}
              >
                <Circle cx='24' cy='24' r='23' fill='#ffce52' />
                <Path
                  d='M37 35.667A3.179 3.179 0 0 1 34 39a3.179 3.179 0 0 1-3-3.333C31 33.826 33.25 29 34 29s3 4.826 3 6.667z'
                  fill='#3bc5f6'
                />
                <Path
                  d='M10 17v-2c3.722 0 6-1.295 6-2h2c0 2.626-4.024 4-8 4z'
                  fill='#273941'
                />
                <Path
                  d='M38 17c-3.976 0-8-1.374-8-4h2c0 .705 2.278 2 6 2z'
                  fill='#273941'
                />
                <Path
                  d='M24 35a10.343 10.343 0 0 0-4 1 4 4 0 0 1 8 0 10.343 10.343 0 0 0-4-1z'
                  fill='#273941'
                />
                <Circle cx='34' cy='22' r='5' fill='#273941' />
                <Circle cx='14' cy='22' r='5' fill='#273941' />
                <Circle cx='34' cy='22' r='4' fill='#141e21' />
                <Circle cx='14' cy='22' r='4' fill='#141e21' />
                <Circle cx='35.5' cy='20.5' r='1.5' fill='#f6fafd' />
                <Circle cx='32.5' cy='23.5' r='1.5' fill='#f6fafd' />
                <Circle cx='35.5' cy='23.5' r='.5' fill='#f6fafd' />
                <Circle cx='12.5' cy='20.5' r='1.5' fill='#f6fafd' />
                <Circle cx='15.5' cy='23.5' r='1.5' fill='#f6fafd' />
                <Circle cx='12.5' cy='23.5' r='.5' fill='#f6fafd' />
                <Path
                  d='M24 4c12.15 0 22 8.507 22 19h.975a23 23 0 0 0-45.95 0H2C2 12.507 11.85 4 24 4z'
                  fill='#ffe369'
                />
                <Path
                  d='M46 23c0 10.493-9.85 19-22 19S2 33.493 2 23h-.975c-.014.332-.025.665-.025 1a23 23 0 0 0 46 0c0-.335-.011-.668-.025-1z'
                  fill='#ffb32b'
                />
                <Ellipse
                  cx='37'
                  cy='9'
                  rx='.825'
                  ry='1.148'
                  transform='rotate(-45.02 37 9)'
                  fill='#f6fafd'
                />
                <Ellipse
                  cx='30.746'
                  cy='4.5'
                  rx='.413'
                  ry='.574'
                  transform='rotate(-45.02 30.745 4.5)'
                  fill='#f6fafd'
                />
                <Ellipse
                  cx='34'
                  cy='7'
                  rx='1.65'
                  ry='2.297'
                  transform='rotate(-45.02 34 7)'
                  fill='#f6fafd'
                />
                <Path
                  d='M34.135 29.047c.723.439 2.365 3.908 2.365 5.286a2.505 2.505 0 1 1-5 0c0-1.378 1.642-4.847 2.365-5.286-.852.469-2.865 4.877-2.865 6.62A3.179 3.179 0 0 0 34 39a3.179 3.179 0 0 0 3-3.333c0-1.743-2.013-6.151-2.865-6.62z'
                  fill='#00a3e1'
                />
                <Ellipse
                  cx='35'
                  cy='35'
                  rx='.825'
                  ry='1.148'
                  transform='rotate(-45.02 35 35)'
                  fill='#f6fafd'
                />
                <Ellipse
                  cx='35.746'
                  cy='33.5'
                  rx='.413'
                  ry='.574'
                  transform='rotate(-45.02 35.746 33.5)'
                  fill='#f6fafd'
                />
                <Path
                  d='M34 39a3.048 3.048 0 0 1-2.853-2.354A4.808 4.808 0 0 0 31 37.667 3.179 3.179 0 0 0 34 41a3.179 3.179 0 0 0 3-3.333 4.808 4.808 0 0 0-.147-1.021A3.048 3.048 0 0 1 34 39z'
                  fill='#ffb32b'
                />
              </Svg>
            ) : (
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorEmoji}>⚠️</Text>
              </View>
            )}
            <Text style={styles.errorTitle}>
              {isNoStoreError ? "We're Sorry" : 'Oops! Something went wrong'}
            </Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  loadData();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              {(isNoStoreError || isLocationError) && (
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => router.push('/profile/add-address')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeLocationButtonText}>
                    Change Location
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>Vitura</Text>
          <LocationHeader />
        </View>
        <TouchableOpacity
          style={styles.userIconContainer}
          onPress={() => router.push('/account')}
          activeOpacity={0.7}
        >
          <IconUser strokeWidth={1.8} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.stickySearchWrapper}>
        <View
          style={[
            styles.stickySearchContainer,
            isScrolled && styles.scrolledBorder,
          ]}
        >
          <SearchBar />
        </View>
        {isScrolled && Platform.OS === 'android' && (
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0)']}
            locations={[0, 0.5, 1]}
            style={styles.androidBottomShadow}
          />
        )}
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setIsScrolled(scrollY > 10); // Lower threshold for earlier detection
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
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
                    <View style={styles.categoryPlaceholder}>
                      <Text style={styles.categoryPlaceholderText}>
                        {category.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {hasStore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            {featuredProducts.length > 0 ? (
              <View style={styles.productGrid}>
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  No featured products available
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <UnifiedFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 16,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  stickySearchWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  stickySearchContainer: {
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
    overflow: 'visible', // Ensure shadow is not clipped
  },
  scrolledBorder: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EFEFEF',
      },
      android: {
        elevation: 0, // Remove elevation to avoid all-side shadow
      },
    }),
  },
  androidBottomShadow: {
    position: 'absolute',
    bottom: -3,
    left: 0,
    right: 0,
    height: 3,
  },
  scrollView: {
    flex: 1,
    zIndex: 1, // Lower zIndex so sticky container appears above
  },
  scrollContent: {
    paddingBottom: 90,
  },
  section: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 2,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  categoryPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Platform.OS === 'android' ? 8 : 16,
    gap: Platform.OS === 'android' ? 6 : 8,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '400',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  changeLocationButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bg,
  },
  changeLocationButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptyStateContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    fontWeight: '500',
  },
});
