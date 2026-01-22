import { Ionicons } from '@expo/vector-icons';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Drawer from '../components/Drawer';
import ProductCard from '../components/ProductCard';
import { useLocationStore } from '../store/locationStore';

// Modern theme constants
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

type SortOption =
  | 'default'
  | 'latest'
  | 'top-rated'
  | 'price-low'
  | 'price-high';
type FilterOption = 'all' | string;

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { getSelectedAddress } = useLocationStore();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState(params.q || '');

  // Data States
  const [originalSearchProducts, setOriginalSearchProducts] = useState<any[]>(
    []
  );
  const [originalRelatedProducts, setOriginalRelatedProducts] = useState<any[]>(
    []
  );
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  // Status States
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort States
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');

  // Sort Drawer State
  const [showSortDrawer, setShowSortDrawer] = useState(false);
  const [tempSortOption, setTempSortOption] = useState<SortOption>('default');

  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (params.q) {
      setSearchQuery(params.q);
    }
  }, [params.q]);

  // Search API Call
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      setSimilarProducts([]);
      setHasSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch();
    }, 800);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [searchQuery]);

  // Apply Sort & Filter whenever dependencies change
  useEffect(() => {
    if (hasSearched && originalSearchProducts.length > 0) {
      applySortAndFilter();
    }
  }, [sortOption, filterOption, originalSearchProducts]);

  const performSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    const selectedAddress = getSelectedAddress();
    if (!selectedAddress || !selectedAddress.coordinates) {
      setError('Please select a delivery location to search products');
      setFilteredProducts([]);
      setSimilarProducts([]);
      setHasSearched(true);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { latitude, longitude } = selectedAddress.coordinates;
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      queryParams.append('lat', latitude.toString());
      queryParams.append('lng', longitude.toString());
      queryParams.append('limit', '50');
      queryParams.append('maxDistance', '10');

      const API_BASE_URL =
        process.env.EXPO_PUBLIC_API_URL || require('../expo-env').API_URL;
      const response = await fetch(
        `${API_BASE_URL}/products/search?${queryParams}`,
        {
          signal: abortController.signal,
        }
      );

      if (abortController.signal.aborted) return;

      const data = await response.json();
      if (abortController.signal.aborted) return;

      if (data.success && data.data) {
        const searchProducts = data.data.searchProducts || [];
        const relatedProducts = data.data.relatedProducts || [];
        setOriginalSearchProducts(searchProducts);
        setOriginalRelatedProducts(relatedProducts);
        // Initial application is handled by the useEffect on [originalSearchProducts]
      } else {
        setError(data.message || 'No products found');
        setOriginalSearchProducts([]);
        setOriginalRelatedProducts([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortController.signal.aborted) return;
      console.error('Search error:', err);
      setError(err.message || 'Failed to search products. Please try again.');
      setOriginalSearchProducts([]);
      setOriginalRelatedProducts([]);
    } finally {
      if (!abortController.signal.aborted) setLoading(false);
      if (abortControllerRef.current === abortController)
        abortControllerRef.current = null;
    }
  };

  const applySortAndFilter = () => {
    let filtered = [...originalSearchProducts];

    // 1. Filter
    if (filterOption !== 'all') {
      filtered = filtered.filter((product) => {
        const categoryName =
          typeof product.category === 'object'
            ? product.category?.name
            : product.category;
        return (
          categoryName &&
          categoryName.toLowerCase() === filterOption.toLowerCase()
        );
      });
    }

    // 2. Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          return (
            (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
            (a.createdAt ? new Date(a.createdAt).getTime() : 0)
          );
        case 'top-rated':
          return (b.discount || 0) - (a.discount || 0);
        case 'price-low':
          return (a.sellingPrice || 0) - (b.sellingPrice || 0);
        case 'price-high':
          return (b.sellingPrice || 0) - (a.sellingPrice || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setSimilarProducts(originalRelatedProducts);
  };

  // --- Sort Drawer Logic ---
  const openSortDrawer = () => {
    setTempSortOption(sortOption);
    setShowSortDrawer(true);
  };

  const closeSortDrawer = () => {
    setShowSortDrawer(false);
  };

  const applySort = () => {
    setSortOption(tempSortOption);
    closeSortDrawer();
  };

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'latest', label: 'Latest' },
    { value: 'top-rated', label: 'Top Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  // --- Dynamic Categories for Filter ---
  const getFilterOptions = () => {
    const categories = new Map<string, string>();
    [...originalSearchProducts, ...originalRelatedProducts].forEach(
      (product) => {
        const categoryName =
          typeof product.category === 'object'
            ? product.category?.name
            : product.category;
        if (categoryName)
          categories.set(categoryName.toLowerCase(), categoryName);
      }
    );

    const options = [{ value: 'all' as FilterOption, label: 'All' }];
    Array.from(categories.values())
      .sort()
      .forEach((cat) => {
        options.push({ value: cat.toLowerCase() as FilterOption, label: cat });
      });
    return options;
  };

  const filterOptions = getFilterOptions();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Input Area */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <IconArrowLeft size={24} strokeWidth={1.5} color='#333' />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons
            name='search'
            size={20}
            color={COLORS.primary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder='Search for products...'
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name='close-circle'
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter & Sort Bar (Only shows when results exist) */}
      {hasSearched && filteredProducts.length > 0 && (
        <View style={styles.filterBarContainer}>
          {/* Sort Button */}
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortOption !== 'default' && styles.sortButtonActive,
            ]}
            onPress={openSortDrawer}
            activeOpacity={0.7}
          >
            <Ionicons
              name='swap-vertical'
              size={18}
              color={
                sortOption !== 'default' ? COLORS.primary : COLORS.textGray
              }
            />
            {sortOption !== 'default' && <View style={styles.sortBadge} />}
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          {/* Horizontal Category Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {filterOptions.map((option) => {
              const isActive = filterOption === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                  ]}
                  onPress={() => setFilterOption(option.value as FilterOption)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Results List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size='large' color={COLORS.primary} />
            <Text style={styles.emptySubtext}>Searching...</Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name='search' size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Search Products</Text>
            <Text style={styles.emptySubtext}>
              Enter a product name, keyword, or category to search
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name='alert-circle' size={48} color={COLORS.danger} />
            </View>
            <Text style={styles.emptyTitle}>{error}</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name='search-outline'
                size={48}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            <TouchableOpacity
              onPress={() => setFilterOption('all')}
              style={styles.resetButton}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'result' : 'results'}
                {filterOption !== 'all' && (
                  <Text style={styles.resultsSubtitle}> in {filterOption}</Text>
                )}
              </Text>
            </View>
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                />
              ))}
            </View>

            {similarProducts.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>You might also like</Text>
                <View style={styles.productGrid}>
                  {similarProducts.map((product) => (
                    <ProductCard
                      key={product._id || product.id}
                      product={product}
                    />
                  ))}
                </View>
              </View>
            )}
            {/* Bottom padding for navigation bars */}
            <View style={{ height: 90 }} />
          </View>
        )}
      </ScrollView>

      {/* Sort Drawer */}
      <Drawer
        visible={showSortDrawer}
        onClose={closeSortDrawer}
        title='Sort By'
        maxHeight='55%'
      >
        <View style={styles.drawerContainer}>
          {sortOptions.map((option) => {
            const isActive = tempSortOption === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionRow, isActive && styles.optionRowActive]}
                onPress={() => setTempSortOption(option.value as SortOption)}
                activeOpacity={0.7}
              >
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isActive && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>

                {/* Radio Button UI */}
                <Ionicons
                  name={isActive ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isActive ? COLORS.primary : COLORS.textLight}
                />
              </TouchableOpacity>
            );
          })}

          {/* Footer Area */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeSortDrawer}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={applySort}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
    gap: 4,
  },
  iconButton: {
    padding: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    padding: 0,
    height: 24,
  },
  clearButton: {
    // padding: 4,
    marginLeft: 8,
  },

  // --- FILTER BAR STYLES ---
  filterBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sortButtonActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  sortBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  categoryScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textGray,
  },
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // --- GENERAL STYLES ---
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.border,
    borderRadius: 24,
  },
  resetButtonText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 15,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  resultsSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textGray,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'flex-start',
  },
  similarSection: {
    marginTop: 32,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 24,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  // --- DRAWER STYLES ---
  drawerContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  drawerListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  optionRowActive: {
    backgroundColor: COLORS.primarySoft,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  drawerFooter: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.bg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
