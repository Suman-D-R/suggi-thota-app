import { Ionicons } from '@expo/vector-icons';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../components/ProductCard';
import { Product, products } from '../data/dummyData';

type SortOption =
  | 'default'
  | 'latest'
  | 'top-rated'
  | 'price-low'
  | 'price-high';
type FilterOption = 'all' | 'vegetables' | 'fruits';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSortOption, setTempSortOption] = useState<SortOption>('default');
  const [tempFilterOption, setTempFilterOption] = useState<FilterOption>('all');
  const sortSlideAnim = useRef(new Animated.Value(0)).current;
  const filterSlideAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Popular products for suggestions
  const popularSuggestions = products.slice(0, 8);

  // Map dummy data to compatible format
  const compatibleProducts = products.map((p) => ({
    ...p,
    _id: p.id,
    category: { _id: p.category, name: p.category },
    images: p.image ? [p.image] : [],
    isActive: true,
    isFeatured: false,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      setSimilarProducts([]);
      setHasSearched(false);
    } else {
      let filtered = compatibleProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filterOption !== 'all') {
        filtered = filtered.filter(
          (product) => product.category?.name === filterOption
        );
      }

      const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'latest':
            return parseInt(b._id) - parseInt(a._id);
          case 'top-rated':
            return (b.discount || 0) - (a.discount || 0);
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          default:
            return 0;
        }
      });

      setFilteredProducts(sorted);
      setHasSearched(true);

      if (sorted.length > 0) {
        const firstProduct = sorted[0];
        const similar = compatibleProducts
          .filter(
            (p) =>
              p._id !== firstProduct._id &&
              (p.category?.name === firstProduct.category?.name ||
                p.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase().split(' ')[0]))
          )
          .slice(0, 6);
        setSimilarProducts(similar);
      } else {
        setSimilarProducts([]);
      }
    }
  }, [searchQuery, sortOption, filterOption]);

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setHasSearched(true);
  };

  // ... (keep modal handlers)

  const openSortModal = () => {
    setTempSortOption(sortOption);
    sortSlideAnim.setValue(0);
    setShowSortModal(true);
    Animated.spring(sortSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSortModal = () => {
    Animated.spring(sortSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setShowSortModal(false);
    });
  };

  const applySort = () => {
    setSortOption(tempSortOption);
    closeSortModal();
  };

  const openFilterModal = () => {
    setTempFilterOption(filterOption);
    filterSlideAnim.setValue(0);
    setShowFilterModal(true);
    Animated.spring(filterSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.spring(filterSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setShowFilterModal(false);
    });
  };

  const applyFilter = () => {
    setFilterOption(tempFilterOption);
    closeFilterModal();
  };

  // ... (keep options arrays)

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'latest', label: 'Latest' },
    { value: 'top-rated', label: 'Top Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  const filterOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
  ];

  const sortTranslateY = sortSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const filterTranslateY = filterSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconArrowLeft size={24} strokeWidth={1.5} color='#333' />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons
            name='search'
            size={20}
            color='#16a34a'
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder='Search for products...'
            placeholderTextColor='#999'
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name='close-circle' size={20} color='#999' />
            </TouchableOpacity>
          ) : (
            <View style={styles.micIcon}>
              <Ionicons name='mic' size={20} color='#666' />
            </View>
          )}
        </View>
      </View>

      {/* Filter Bar */}
      {hasSearched && filteredProducts.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                sortOption !== 'default' && styles.filterChipSelected,
              ]}
              onPress={openSortModal}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortOption !== 'default' && styles.filterChipTextSelected,
                ]}
              >
                Sort
              </Text>
              <Ionicons
                name='chevron-down'
                size={16}
                color={sortOption !== 'default' ? '#16a34a' : '#333'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterOption !== 'all' && styles.filterChipSelected,
              ]}
              onPress={openFilterModal}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterOption !== 'all' && styles.filterChipTextSelected,
                ]}
              >
                Filter
              </Text>
              <Ionicons
                name='options-outline'
                size={16}
                color={filterOption !== 'all' ? '#16a34a' : '#333'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                sortOption === 'latest' && styles.filterChipActive,
              ]}
              onPress={() =>
                setSortOption(sortOption === 'latest' ? 'default' : 'latest')
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name='flash-outline'
                size={16}
                color={sortOption === 'latest' ? '#fff' : '#333'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  sortOption === 'latest' && styles.filterChipTextActive,
                ]}
              >
                Latest
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {!hasSearched ? (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Popular Products</Text>
            <View style={styles.suggestionsGrid}>
              {popularSuggestions.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionClick(product.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name='trending-up' size={14} color='#666' />
                  <Text style={styles.suggestionText}>{product.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name='search' size={48} color='#16a34a' />
            </View>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {filteredProducts.length} results
              </Text>
            </View>
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>

            {similarProducts.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>You might also like</Text>
                <View style={styles.productGrid}>
                  {similarProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType='none'
        onRequestClose={closeSortModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeSortModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: sortTranslateY }],
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity
                onPress={closeSortModal}
                style={styles.closeButton}
              >
                <Ionicons name='close' size={20} color='#666' />
              </TouchableOpacity>
            </View>
            <View style={styles.optionsContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    tempSortOption === option.value && styles.optionItemActive,
                  ]}
                  onPress={() => setTempSortOption(option.value as SortOption)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempSortOption === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {tempSortOption === option.value && (
                    <Ionicons
                      name='checkmark-circle'
                      size={22}
                      color='#16a34a'
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyButton} onPress={applySort}>
                <Text style={styles.applyButtonText}>Apply Sort</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType='none'
        onRequestClose={closeFilterModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeFilterModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: filterTranslateY }],
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter By</Text>
              <TouchableOpacity
                onPress={closeFilterModal}
                style={styles.closeButton}
              >
                <Ionicons name='close' size={20} color='#666' />
              </TouchableOpacity>
            </View>
            <View style={styles.optionsContainer}>
              <Text style={styles.sectionLabel}>Category</Text>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    tempFilterOption === option.value &&
                      styles.optionItemActive,
                  ]}
                  onPress={() =>
                    setTempFilterOption(option.value as FilterOption)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempFilterOption === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {tempFilterOption === option.value && (
                    <Ionicons
                      name='checkmark-circle'
                      size={22}
                      color='#16a34a'
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilter}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    borderWidth: 0.5,
    width: '10%',
    height: '100%',
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  micIcon: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
    paddingLeft: 12,
  },

  filterContainer: {
    paddingBottom: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  filterChipTextSelected: {
    color: '#16a34a',
  },

  scrollView: {
    flex: 1,
  },

  suggestionsContainer: {
    padding: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },

  resultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },

  similarSection: {
    marginTop: 32,
    paddingBottom: 32,
    borderTopWidth: 8,
    borderTopColor: '#f9f9f9',
    paddingTop: 24,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 24,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  optionItemActive: {
    backgroundColor: '#F0FDF4',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
