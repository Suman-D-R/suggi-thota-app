import { IconUser } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import CartFAB from '../../components/CartFAB';
import Header from '../../components/Header';
import HeroCarousel from '../../components/HeroCarousel';
import LocationHeader from '../../components/LocationHeader';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { categoryAPI, productAPI, storeAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
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
            setError('Failed to load products');
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
    } catch (err) {
      setError('Failed to load data');
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
        setError('Unable to check store availability. Please try again.');
      }

      // Load categories
      const categoriesResponse = await categoryAPI.getMain();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data?.categories || []);
      }

      // Reload cart on refresh
      loadCart();
    } catch (err) {
      console.error('Error refreshing data:', err);
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
          <ActivityIndicator size='large' color='#16a34a' />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error && hasStore === false) {
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
            <IconUser strokeWidth={1.8} size={24} color='#568627' />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.stickySearchContainer,
            isScrolled && {
              borderBottomWidth: 1,
              borderBottomColor: '#E8E8E8',
            },
          ]}
        >
          <SearchBar />
        </View>
        <View
          style={[
            styles.container,
            styles.centerContent,
            styles.noStoreContainer,
          ]}
        >
          <View style={styles.noStoreContent}>
            <Svg
              width={80}
              height={80}
              viewBox='0 0 48 48'
              style={styles.noStoreEmoji}
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
            <Text style={styles.noStoreTitle}>We're Sorry</Text>
            <Text style={styles.noStoreMessage}>
              We don't currently deliver to your selected location. We're
              working hard to expand our service area and would love to serve
              you soon!
            </Text>
            <TouchableOpacity
              style={styles.changeLocationButton}
              onPress={() => router.push('/profile/add-address')}
              activeOpacity={0.7}
            >
              <Text style={styles.changeLocationButtonText}>
                Change Location
              </Text>
            </TouchableOpacity>
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
          <IconUser strokeWidth={1.8} size={24} color='#568627' />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.stickySearchContainer,
          isScrolled && {
            borderBottomWidth: 1,
            borderBottomColor: '#E8E8E8',
          },
        ]}
      >
        <SearchBar />
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setIsScrolled(scrollY > 20);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#568627']}
            tintColor='#568627'
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
                    <View
                      style={[
                        styles.categoryPlaceholder,
                        {
                          backgroundColor:
                            category._id === 'vegetables'
                              ? '#E8F5E9'
                              : '#FFF3E0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPlaceholderText,
                          {
                            color:
                              category._id === 'vegetables'
                                ? '#2E7D32'
                                : '#EF6C00',
                          },
                        ]}
                      >
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
              <View style={styles.centerContent}>
                <Text style={styles.errorText}>
                  No featured products available
                </Text>
              </View>
            )}
          </View>
        )}
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
  appName: {
    fontSize: 14,
    fontWeight: '800',
    color: 'green',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 10,
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
    backgroundColor: '#F8F9FA',
    padding: 3, // Border effect
    borderWidth: 0.3,
    borderColor: '#E6ECF1',
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
    paddingHorizontal: 14,
    gap: 10,
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
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#56862750',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStoreContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  noStoreContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  noStoreEmoji: {
    marginBottom: 16,
  },
  noStoreTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noStoreMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  changeLocationButton: {},
  changeLocationButtonText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
