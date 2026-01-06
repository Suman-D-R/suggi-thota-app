import {
  IconChevronDown,
  IconHeart,
  IconHeartFilled,
  IconMinus,
  IconPlus,
  IconX,
} from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedReanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';
import { useWishlistStore } from '../store/wishlistStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20; // 16px padding on each side
const GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING - 2 * GAP) / 3;

interface ProductVariant {
  sku?: string;
  size: number;
  unit: string;
  originalPrice?: number;
  sellingPrice?: number;
  discount?: number;
  stock?: number;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
}

interface Product {
  _id: string;
  name: string;
  originalPrice: number;
  sellingPrice: number;
  unit: string;
  size: number;
  variants?: ProductVariant[];
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

interface ProductCardProps {
  product: Product;
}

const AnimatedPressable = ({ onPress, style, children, ...props }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      {...props}
    >
      <AnimatedReanimated.View style={animatedStyle}>
        {children}
      </AnimatedReanimated.View>
    </Pressable>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to convert size to a common unit (kg for weight, l for volume)
const convertToBaseUnit = (size: number, unit: string): number => {
  const normalizedUnit = unit.toLowerCase().trim();
  // Weight conversions
  if (normalizedUnit === 'kg' || normalizedUnit === 'kgs') return size;
  if (
    normalizedUnit === 'g' ||
    normalizedUnit === 'gm' ||
    normalizedUnit === 'grams'
  )
    return size / 1000;
  // Volume conversions
  if (
    normalizedUnit === 'l' ||
    normalizedUnit === 'litre' ||
    normalizedUnit === 'liters'
  )
    return size;
  if (
    normalizedUnit === 'ml' ||
    normalizedUnit === 'milliliter' ||
    normalizedUnit === 'milliliters'
  )
    return size / 1000;
  // Default: assume same unit
  return size;
};

// Helper function to get the base unit from variants
const getBaseUnit = (variants: ProductVariant[]): string => {
  const units = variants.map((v) => v.unit.toLowerCase().trim());
  // Check if all units are weight units
  const weightUnits = ['kg', 'kgs', 'g', 'gm', 'grams'];
  const volumeUnits = [
    'l',
    'litre',
    'liters',
    'ml',
    'milliliter',
    'milliliters',
  ];

  if (units.some((u) => weightUnits.includes(u))) {
    // Find the largest weight unit
    if (units.some((u) => u === 'kg' || u === 'kgs')) return 'kg';
    return 'g';
  }
  if (units.some((u) => volumeUnits.includes(u))) {
    // Find the largest volume unit
    if (units.some((u) => u === 'l' || u === 'litre' || u === 'liters'))
      return 'l';
    return 'ml';
  }
  // Default to first variant's unit
  return variants[0]?.unit || 'kg';
};

// Helper function to format the total size display
const formatTotalSize = (
  variants: ProductVariant[],
  quantities: number[]
): string => {
  const baseUnit = getBaseUnit(variants);
  let totalBaseSize = 0;

  variants.forEach((variant, index) => {
    const quantity = quantities[index] || 0;
    const sizeInBaseUnit = convertToBaseUnit(variant.size, variant.unit);
    totalBaseSize += sizeInBaseUnit * quantity;
  });

  // Helper to format number without trailing .0
  const formatNumber = (num: number): string => {
    if (num % 1 === 0) {
      return num.toString();
    }
    return num.toFixed(1);
  };

  // Format the display
  if (baseUnit === 'kg' || baseUnit === 'kgs') {
    if (totalBaseSize >= 1) {
      return `${formatNumber(totalBaseSize)}kg`;
    } else {
      return `${(totalBaseSize * 1000).toFixed(0)}g`;
    }
  } else if (
    baseUnit === 'l' ||
    baseUnit === 'litre' ||
    baseUnit === 'liters'
  ) {
    if (totalBaseSize >= 1) {
      return `${formatNumber(totalBaseSize)}l`;
    } else {
      return `${(totalBaseSize * 1000).toFixed(0)}ml`;
    }
  }

  // Fallback: show total quantity if units don't match
  const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
  return totalQuantity > 0 ? `${totalQuantity}` : '';
};

// Common Button Style Bases
const addButtonBase = {
  paddingHorizontal: 10,
  paddingVertical: 0,
  minWidth: 60,
  minHeight: Platform.OS === 'android' ? 26 : 30,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: 9,
  backgroundColor: '#C5FF8D20',
};

const addButtonTextBase = {
  fontSize: 12,
  fontWeight: '700' as const,
  color: '#568627',
};

const qtyButtonBase = {
  width: 30,
  height: Platform.OS === 'android' ? 26 : 30,
  borderRadius: 6,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  padding: 4,
};

const qtyTextBase = {
  fontSize: 12,
  color: '#568627',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  paddingHorizontal: Platform.OS === 'android' ? 2 : 6,
};

const qtyContainerBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#C5FF8D20',
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  // Subscribe to items array to trigger re-render when cart changes
  const { items, addItem, updateQuantity, getItemQuantity, getVariantKey } =
    useCartStore();
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [showVariantDrawer, setShowVariantDrawer] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isWishlisted = isInWishlist(product._id);

  // Get available variants - only show variants that have stock or pricing
  const availableVariants =
    product.variants && product.variants.length > 0
      ? product.variants.filter((v) => {
          // Show variant if it has stock OR has pricing (even if out of stock)
          const hasStock = (v.stock || 0) > 0;
          const hasPricing = (v.sellingPrice || 0) > 0;
          const isAvailable = v.isAvailable !== false; // Default to true if not specified
          return (hasStock || hasPricing) && isAvailable;
        })
      : [];

  // If no variants, use product-level pricing as fallback
  const hasVariants = availableVariants.length > 0;
  const hasMultipleVariants = availableVariants.length > 1;

  // Use first variant as default, or fallback to product size/unit
  // Create a consistent variant object for matching
  const defaultVariant = hasVariants
    ? availableVariants[0]
    : { size: product.size, unit: product.unit };

  // Get quantity for default variant (pass undefined if no variants for product-level matching)
  const quantity = getItemQuantity(
    product._id,
    hasVariants ? defaultVariant : undefined
  );

  // Calculate total quantity and size across all variants
  // If no variants, check for cart items using undefined (product-level)
  const variantQuantities = hasVariants
    ? availableVariants.map((variant) => getItemQuantity(product._id, variant))
    : [getItemQuantity(product._id, undefined)];

  const totalQuantity = variantQuantities.reduce((sum, qty) => sum + qty, 0);
  const totalSizeDisplay = formatTotalSize(
    availableVariants,
    variantQuantities
  );

  // For single variant products, use the specific variant quantity
  // For multiple variants, only show quantity overlay if the default variant has quantity
  const shouldShowQuantityOverlay = hasMultipleVariants
    ? quantity > 0 // Only show if default variant has quantity
    : totalQuantity > 0; // Show if any quantity exists

  // Get pricing from selected variant, or fallback to product-level pricing
  const getVariantPrice = (variant: ProductVariant) => {
    if (variant.sellingPrice && variant.sellingPrice > 0) {
      return {
        sellingPrice: variant.sellingPrice,
        originalPrice: variant.originalPrice || 0,
        discount: variant.discount || 0,
      };
    }
    // Fallback to product-level pricing
    return {
      sellingPrice:
        typeof product.sellingPrice === 'number' && !isNaN(product.sellingPrice)
          ? product.sellingPrice
          : 0,
      originalPrice:
        typeof product.originalPrice === 'number' &&
        !isNaN(product.originalPrice)
          ? product.originalPrice
          : 0,
      discount:
        typeof product.discount === 'number' && !isNaN(product.discount)
          ? product.discount
          : 0,
    };
  };

  const defaultPricing = getVariantPrice(defaultVariant);
  const originalPrice = defaultPricing.originalPrice;
  const sellingPrice = defaultPricing.sellingPrice;
  const discount = defaultPricing.discount;

  const openVariantDrawer = () => {
    setShowVariantDrawer(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeVariantDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowVariantDrawer(false);
    });
  };

  const handleAddToCart = () => {
    if (hasMultipleVariants) {
      openVariantDrawer();
    } else {
      // If there are variants, pass the variant; otherwise pass undefined for product-level
      const variantToAdd = hasVariants ? defaultVariant : undefined;
      addItem(product, variantToAdd);
    }
  };

  const handleAddVariantToCart = (variant: ProductVariant) => {
    addItem(product, variant);
    // Keep drawer open for multiple variants so user can add different sizes
  };

  const handleIncrease = () => {
    if (hasMultipleVariants) {
      openVariantDrawer();
    } else {
      const variantToUpdate = hasVariants ? defaultVariant : undefined;
      updateQuantity(product._id, quantity + 1, variantToUpdate);
    }
  };

  const handleDecrease = () => {
    if (hasMultipleVariants) {
      // For multiple variants, open drawer to let user select which variant to decrease
      openVariantDrawer();
    } else {
      // For single variant or no variants, decrease the specific variant
      const variantToUpdate = hasVariants ? defaultVariant : undefined;
      if (quantity > 1) {
        updateQuantity(product._id, quantity - 1, variantToUpdate);
      } else {
        // Remove the item when quantity reaches 0
        updateQuantity(product._id, 0, variantToUpdate);
      }
    }
  };

  const handleToggleWishlist = () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <View style={styles.card}>
      {/* IMAGE AND BUTTON CONTAINER */}
      <View style={styles.imageButtonContainer}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          {product.images && product.images.length > 0 ? (
            <Image source={{ uri: product.images[0] }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {product.name.charAt(0)}
              </Text>
            </View>
          )}

          {/* WISHLIST ICON */}
          <Pressable
            onPress={handleToggleWishlist}
            style={styles.wishlistButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isWishlisted ? (
              <IconHeartFilled size={20} color='#FF5722' />
            ) : (
              <IconHeart size={20} color='#D1D5D7' />
            )}
          </Pressable>
        </View>

        {/* ADD BUTTON / QUANTITY OVERLAY */}
        <View style={styles.actionOverlay}>
          {shouldShowQuantityOverlay ? (
            <View style={styles.qtyContainer}>
              <Pressable onPress={handleDecrease} style={styles.qtyBtnOverlay}>
                <IconMinus size={18} strokeWidth={2.5} color='#568627' />
              </Pressable>
              <Text style={styles.qtyTextOverlay}>
                {/* {hasMultipleVariants && totalSizeDisplay
                  ? totalSizeDisplay
                  : totalQuantity} */}
                {totalQuantity}
              </Text>
              <Pressable onPress={handleIncrease} style={styles.qtyBtnOverlay}>
                <IconPlus size={18} strokeWidth={2.5} color='#568627' />
              </Pressable>
            </View>
          ) : (
            <View>
              <Pressable
                onPress={handleAddToCart}
                style={styles.addButtonInner}
              >
                <Text style={styles.addButtonTextOverlay}>ADD</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* PRODUCT INFO */}
      <View style={styles.info}>
        {/* Variants Label */}
        <TouchableOpacity
          style={styles.weightLabel}
          onPress={hasMultipleVariants ? openVariantDrawer : undefined}
          disabled={!hasMultipleVariants}
          activeOpacity={hasMultipleVariants ? 0.7 : 1}
        >
          <Text style={styles.weightText}>
            {defaultVariant.size} {defaultVariant.unit}
          </Text>
          {hasMultipleVariants && (
            <IconChevronDown
              size={Platform.OS === 'android' ? 14 : 16}
              color='#114E99'
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/products/${product._id}`)}
          activeOpacity={0.7}
        >
          {/* Product Name */}
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Discount Badge */}
          {discount > 0 && (
            <Text style={styles.discountBadge}>{discount}% OFF</Text>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{Math.round(sellingPrice)}</Text>
            {discount > 0 && originalPrice > 0 && (
              <Text style={styles.originalPrice}>
                ₹{Math.round(originalPrice)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Variant Selection Drawer */}
      <Modal
        visible={showVariantDrawer}
        transparent={true}
        animationType='none'
        onRequestClose={closeVariantDrawer}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity
              style={styles.backdropTouch}
              activeOpacity={1}
              onPress={closeVariantDrawer}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={closeVariantDrawer}
              style={styles.closeButton}
            >
              <IconX size={24} color='#FFFFFF' />
            </TouchableOpacity>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleContainer}>
                <Text style={styles.drawerTitle}>{product.name}</Text>
              </View>
              {hasMultipleVariants && totalQuantity > 0 && (
                <Text style={styles.drawerTotal}>
                  Total: {totalSizeDisplay || `${totalQuantity} items`}
                </Text>
              )}
            </View>

            <View style={styles.variantsList}>
              {availableVariants.map((variant, index) => {
                const variantQuantity = getItemQuantity(product._id, variant);
                const variantPricing = getVariantPrice(variant);
                const variantStock = variant.stock || 0;
                const isVariantOutOfStock =
                  variant.isOutOfStock || variantStock === 0;

                return (
                  <View
                    key={index}
                    style={[
                      styles.variantItem,
                      isVariantOutOfStock && styles.variantItemOutOfStock,
                    ]}
                  >
                    <View style={styles.variantImageContainer}>
                      {product.images && product.images.length > 0 ? (
                        <Image
                          source={{ uri: product.images[0] }}
                          style={styles.variantImage}
                        />
                      ) : (
                        <View style={styles.variantPlaceholder}>
                          <Text style={styles.variantPlaceholderText}>
                            {product.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.variantInfo}>
                      <View style={styles.variantPriceRow}>
                        <View style={styles.variantSizeContainer}>
                          <Text style={styles.variantSize}>
                            {variant.size} {variant.unit}
                          </Text>
                          {isVariantOutOfStock && (
                            <Text style={styles.outOfStockLabel}>
                              Out of Stock
                            </Text>
                          )}
                          {!isVariantOutOfStock && variantStock > 0 && (
                            <Text style={styles.stockLabel}>
                              {variantStock} available
                            </Text>
                          )}
                        </View>
                        {variantPricing.sellingPrice > 0 ? (
                          <View style={styles.variantPriceContainer}>
                            <Text style={styles.variantPrice}>
                              ₹{Math.round(variantPricing.sellingPrice)}
                            </Text>
                            {variantPricing.discount > 0 &&
                              variantPricing.originalPrice > 0 && (
                                <>
                                  <Text style={styles.variantOriginalPrice}>
                                    ₹{Math.round(variantPricing.originalPrice)}
                                  </Text>
                                  {variantPricing.discount > 0 && (
                                    <Text style={styles.variantDiscount}>
                                      {Math.round(variantPricing.discount)}% OFF
                                    </Text>
                                  )}
                                </>
                              )}
                          </View>
                        ) : (
                          <Text style={styles.noPriceLabel}>No price set</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.variantAction}>
                      {variantQuantity > 0 ? (
                        <View style={styles.variantQtyContainer}>
                          <Pressable
                            onPress={() =>
                              updateQuantity(
                                product._id,
                                variantQuantity - 1,
                                variant
                              )
                            }
                            style={styles.variantQtyBtn}
                          >
                            <IconMinus
                              size={16}
                              strokeWidth={2.5}
                              color='#4CAF50'
                            />
                          </Pressable>
                          <Text style={styles.variantQtyText}>
                            {variantQuantity}
                          </Text>
                          <Pressable
                            onPress={() =>
                              updateQuantity(
                                product._id,
                                variantQuantity + 1,
                                variant
                              )
                            }
                            style={styles.variantQtyBtn}
                          >
                            <IconPlus
                              size={16}
                              strokeWidth={2.5}
                              color='#4CAF50'
                            />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => handleAddVariantToCart(variant)}
                          style={styles.variantAddButton}
                        >
                          <Text style={styles.variantAddButtonText}>ADD</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
  },
  imageButtonContainer: {
    position: 'relative',
  },
  imageContainer: {
    height: 'auto',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    // overflow: 'hidden',
    borderWidth: 0.3,
    borderColor: '#E6ECF1',
    aspectRatio: 4 / 4.5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionOverlay: {
    position: 'absolute',
    bottom: 10,
    right: '-6%',
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#568627',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
    transform: [{ translateY: 20 }],
    // gap: 4, // Moved to qtyContainer for better layout control with animations
  },
  // Overlay-specific styles (using common base)
  qtyContainer: {
    ...qtyContainerBase,
  },
  addButtonInner: {
    ...addButtonBase,
    height: '100%',
  },
  addButtonTextOverlay: {
    ...addButtonTextBase,
  },
  qtyBtnOverlay: {
    ...qtyButtonBase,
  },
  qtyTextOverlay: {
    ...qtyTextBase,
  },
  info: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  weightLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#F3F8FF',
    borderRadius: 6,
    gap: 4,
    height: Platform.OS === 'android' ? 20 : 22,
  },
  weightText: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    fontWeight: '500',
    color: '#114E99',
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  unit: {
    color: '#666',
    fontSize: 12,
    marginBottom: 6,
  },

  discountBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00811E',
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  // Variant Drawer Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropTouch: {
    flex: 1,
  },
  drawer: {
    backgroundColor: '#FBFBFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 20,
    position: 'relative',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 4,
  },
  drawerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    position: 'absolute',
    right: '50%',
    transform: [{ translateX: '50%' }],
    top: '-20%',
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5B5B5B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  drawerTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  variantsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 0.2,
    borderColor: '#E0E0E0',
    height: 100,
  },
  variantImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  variantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  variantPlaceholder: {
    flex: 1,
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantPlaceholderText: {
    fontSize: 24,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  variantInfo: {
    marginRight: 12,
  },
  variantSize: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: '100%',
  },
  variantPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  variantOriginalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  variantAction: {
    alignItems: 'flex-end',
  },
  variantAddButton: {
    ...addButtonBase,
    borderWidth: 1,
    borderColor: '#568627',
  },
  variantAddButtonText: {
    ...addButtonTextBase,
  },
  variantQtyContainer: {
    ...qtyContainerBase,
    borderWidth: 1,
    borderColor: '#568627',
    borderRadius: 10,
  },
  variantQtyBtn: {
    ...qtyButtonBase,
  },
  variantQtyText: {
    ...qtyTextBase,
    paddingHorizontal: 6,
  },
  variantItemOutOfStock: {
    opacity: 0.6,
  },
  variantSizeContainer: {
    flex: 1,
  },
  outOfStockLabel: {
    fontSize: 11,
    color: '#FF5722',
    fontWeight: '600',
    marginTop: 2,
  },
  stockLabel: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  variantPriceContainer: {
    alignItems: 'flex-end',
  },
  variantDiscount: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    marginTop: 2,
  },
  noPriceLabel: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
