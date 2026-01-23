import { Ionicons } from '@expo/vector-icons';
import { IconChevronDown } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCartStore } from '../store/cartStore';
import { useUserStore } from '../store/userStore';
import { useWishlistStore } from '../store/wishlistStore';
import AddToCartButton from './AddToCartButton';
import Drawer from './Drawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- MODERN CONSTANTS ---
const PADDING = Platform.OS === 'android' ? 8 : 16;
const GAP = Platform.OS === 'android' ? 6 : 8;
// Optimized for 3 columns but with better breathing room
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * 2) / 3;

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
  maximumOrderLimit?: number;
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

// ... Helper functions kept exactly same ...
const convertToBaseUnit = (size: number, unit: string): number => {
  const normalizedUnit = unit.toLowerCase().trim();
  if (normalizedUnit === 'kg' || normalizedUnit === 'kgs') return size;
  if (
    normalizedUnit === 'g' ||
    normalizedUnit === 'gm' ||
    normalizedUnit === 'grams'
  )
    return size / 1000;
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
  return size;
};

const getBaseUnit = (variants: ProductVariant[]): string => {
  const units = variants.map((v) => v.unit.toLowerCase().trim());
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
    if (units.some((u) => u === 'kg' || u === 'kgs')) return 'kg';
    return 'g';
  }
  if (units.some((u) => volumeUnits.includes(u))) {
    if (units.some((u) => u === 'l' || u === 'litre' || u === 'liters'))
      return 'l';
    return 'ml';
  }
  return variants[0]?.unit || 'kg';
};

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
  const formatNumber = (num: number): string => {
    if (num % 1 === 0) return num.toString();
    return num.toFixed(1);
  };
  if (baseUnit === 'kg' || baseUnit === 'kgs') {
    if (totalBaseSize >= 1) return `${formatNumber(totalBaseSize)}kg`;
    else return `${(totalBaseSize * 1000).toFixed(0)}g`;
  } else if (
    baseUnit === 'l' ||
    baseUnit === 'litre' ||
    baseUnit === 'liters'
  ) {
    if (totalBaseSize >= 1) return `${formatNumber(totalBaseSize)}l`;
    else return `${(totalBaseSize * 1000).toFixed(0)}ml`;
  }
  const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
  return totalQuantity > 0 ? `${totalQuantity}` : '';
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  // Subscribe to items array to trigger re-render when cart changes
  const items = useCartStore((state) => state.items);
  const { addItem, updateQuantity, getVariantKey } = useCartStore();
  // Subscribe to wishlist items array to trigger re-render when wishlist changes
  const wishlistItems = useWishlistStore((state) => state.items);
  const { addItem: addToWishlist, removeItem: removeFromWishlist } =
    useWishlistStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [showVariantDrawer, setShowVariantDrawer] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [selectedVariantForDetail, setSelectedVariantForDetail] = useState<ProductVariant | null>(null);

  // Check if product is in wishlist from subscribed items array (reactive)
  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  // Helper function to get quantity from items array (reactive)
  const getItemQuantityFromItems = (
    productId: string,
    variant?: ProductVariant
  ): number => {
    const variantKey = getVariantKey(productId, variant);
    const item = items.find(
      (item) => getVariantKey(item._id, item.selectedVariant) === variantKey
    );
    return item ? item.quantity : 0;
  };

  // --- LOGIC SAME START ---
  const availableVariants =
    product.variants && product.variants.length > 0
      ? product.variants.filter((v) => {
        const hasStock = (v.stock || 0) > 0;
        const hasPricing = (v.sellingPrice || 0) > 0;
        const isAvailable = v.isAvailable !== false;
        return (hasStock || hasPricing) && isAvailable;
      })
      : [];

  const hasVariants = availableVariants.length > 0;
  const hasMultipleVariants = availableVariants.length > 1;
  const defaultVariant = hasVariants
    ? availableVariants[0]
    : { size: product.size, unit: product.unit };
  const quantity = getItemQuantityFromItems(
    product._id,
    hasVariants ? defaultVariant : undefined
  );
  const variantQuantities = hasVariants
    ? availableVariants.map((variant) =>
      getItemQuantityFromItems(product._id, variant)
    )
    : [getItemQuantityFromItems(product._id, undefined)];

  const totalQuantity = variantQuantities.reduce((sum, qty) => sum + qty, 0);
  const totalSizeDisplay = formatTotalSize(
    availableVariants,
    variantQuantities
  );
  const shouldShowQuantityOverlay = hasMultipleVariants
    ? quantity > 0
    : totalQuantity > 0;

  const getVariantPrice = (variant: ProductVariant) => {
    if (variant.sellingPrice && variant.sellingPrice > 0) {
      return {
        sellingPrice: variant.sellingPrice,
        originalPrice: variant.originalPrice || 0,
        discount: variant.discount || 0,
      };
    }
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

  const defaultVariantStock = defaultVariant.stock || 0;
  const isOutOfStock = defaultVariant.isOutOfStock || defaultVariantStock === 0;
  const maximumOrderLimit = defaultVariant.maximumOrderLimit;
  const isMaxLimitReached =
    maximumOrderLimit !== undefined &&
    maximumOrderLimit !== null &&
    maximumOrderLimit > 0 &&
    quantity >= maximumOrderLimit;
  const isStockLimitReached =
    defaultVariantStock > 0 && quantity >= defaultVariantStock;
  const shouldShowWarning =
    isOutOfStock || isMaxLimitReached || isStockLimitReached;

  const warningText = isOutOfStock
    ? 'Sold Out'
    : isMaxLimitReached
      ? 'Max Limit'
      : isStockLimitReached
        ? 'No Stock'
        : '';

  const openVariantDrawer = () => {
    setShowVariantDrawer(true);
  };

  const closeVariantDrawer = () => {
    setShowVariantDrawer(false);
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || isMaxLimitReached) return;
    if (hasMultipleVariants) {
      openVariantDrawer();
    } else {
      const variantToAdd = hasVariants ? defaultVariant : undefined;
      try {
        await addItem(product, variantToAdd);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddVariantToCart = async (variant: ProductVariant) => {
    const variantStock = variant.stock || 0;
    const variantIsOutOfStock = variant.isOutOfStock || variantStock === 0;
    if (variantIsOutOfStock) return;
    const variantMaximumOrderLimit = variant.maximumOrderLimit;
    const variantQuantity = getItemQuantityFromItems(product._id, variant);
    if (
      variantMaximumOrderLimit !== undefined &&
      variantMaximumOrderLimit > 0 &&
      variantQuantity + 1 > variantMaximumOrderLimit
    )
      return;
    try {
      await addItem(product, variant);
    } catch (error) {
      console.error(error);
    }
  };

  const handleIncrease = async () => {
    if (hasMultipleVariants) {
      openVariantDrawer();
    } else {
      const variantToUpdate = hasVariants ? defaultVariant : undefined;
      if (
        maximumOrderLimit !== undefined &&
        maximumOrderLimit > 0 &&
        quantity + 1 > maximumOrderLimit
      )
        return;
      if (isOutOfStock || isStockLimitReached) return;
      if (defaultVariantStock > 0 && quantity + 1 > defaultVariantStock) return;
      try {
        await updateQuantity(product._id, quantity + 1, variantToUpdate);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDecrease = () => {
    if (hasMultipleVariants) {
      openVariantDrawer();
    } else {
      const variantToUpdate = hasVariants ? defaultVariant : undefined;
      if (quantity > 1) {
        updateQuantity(product._id, quantity - 1, variantToUpdate);
      } else {
        updateQuantity(product._id, 0, variantToUpdate);
      }
    }
  };

  const handleToggleWishlist = () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/account');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };
  // --- LOGIC SAME END ---

  // Initialize selected variant for detail modal
  const initializeDetailVariant = () => {
    if (hasVariants && availableVariants.length > 0) {
      setSelectedVariantForDetail(availableVariants[0]);
    } else {
      setSelectedVariantForDetail({ size: product.size, unit: product.unit });
    }
  };

  const openProductDetailModal = () => {
    initializeDetailVariant();
    setShowProductDetailModal(true);
  };

  const closeProductDetailModal = () => {
    setShowProductDetailModal(false);
  };

  // Get pricing for selected variant in detail modal
  const getDetailVariantPrice = (variant: ProductVariant | null) => {
    if (variant && variant.sellingPrice && variant.sellingPrice > 0) {
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

  const detailVariantPricing = getDetailVariantPrice(selectedVariantForDetail);
  const detailQuantity = selectedVariantForDetail
    ? getItemQuantityFromItems(product._id, selectedVariantForDetail)
    : 0;
  const detailVariantStock = selectedVariantForDetail?.stock || 0;
  const detailIsOutOfStock = selectedVariantForDetail?.isOutOfStock || detailVariantStock === 0;
  const detailMaximumOrderLimit = selectedVariantForDetail?.maximumOrderLimit;
  const detailIsMaxLimitReached =
    detailMaximumOrderLimit !== undefined &&
    detailMaximumOrderLimit > 0 &&
    detailQuantity >= detailMaximumOrderLimit;

  return (
    <View style={styles.cardContainer}>
      <Pressable
        onPress={openProductDetailModal}
        style={styles.cardInner}
      >
        {/* --- IMAGE SECTION --- */}
        <View style={styles.imageSection}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: product.images[0] }}
              style={[
                styles.productImage,
                shouldShowWarning && styles.grayscale,
              ]}
              resizeMode='contain'
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {product.name.charAt(0)}
              </Text>
            </View>
          )}

          {/* Badges (Left Side) */}
          <View style={styles.badgeRow}>
            {discount > 0 && !isOutOfStock && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round(discount)}% OFF
                </Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={styles.oosBadge}>
                <Text style={styles.oosText}>Sold Out</Text>
              </View>
            )}
          </View>

          {/* Wishlist Heart (Filled style for both) */}
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={handleToggleWishlist}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name='heart'
              size={20}
              color={isWishlisted ? COLORS.danger : '#E2EBEF'}
            />
          </TouchableOpacity>
        </View>

        {/* --- DETAILS SECTION --- */}
        <View style={styles.detailsSection}>
          {/* Unit & Variant Selector */}
          <TouchableOpacity
            disabled={!hasMultipleVariants}
            onPress={hasMultipleVariants ? openVariantDrawer : undefined}
            style={styles.variantSelector}
          >
            <Text style={styles.unitText}>
              {defaultVariant.size} {defaultVariant.unit}
            </Text>
            {hasMultipleVariants && (
              <IconChevronDown size={12} color={COLORS.textGray} />
            )}
          </TouchableOpacity>

          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Price & Action Row */}
          <View style={styles.footerRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.sellingPrice}>
                ₹{Math.round(sellingPrice)}
              </Text>
              {discount > 0 && originalPrice > 0 && (
                <Text style={styles.originalPrice}>
                  ₹{Math.round(originalPrice)}
                </Text>
              )}
            </View>

            {/* Action Button (Now in footer, not over image) */}
            <View style={styles.actionContainer}>
              <AddToCartButton
                quantity={shouldShowQuantityOverlay ? totalQuantity : 0}
                onAdd={handleAddToCart}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                isOutOfStock={isOutOfStock}
                isMaxLimitReached={isMaxLimitReached}
                isStockLimitReached={isStockLimitReached}
                containerStyle={styles.actionButtonContainer}
                size="small"
              />
            </View>
          </View>
        </View>
      </Pressable>

      {/* --- VARIANT DRAWER --- */}
      <Drawer
        visible={showVariantDrawer}
        onClose={closeVariantDrawer}
        title='Select Variant'
        subtitle={product.name}
      >
        <View style={styles.variantsList}>
          {availableVariants.map((variant, index) => {
            const variantQuantity = getItemQuantityFromItems(
              product._id,
              variant
            );
            const variantPricing = getVariantPrice(variant);
            const variantStock = variant.stock || 0;
            const isVariantOOS = variant.isOutOfStock || variantStock === 0;
            const isLimit = Boolean(
              variant.maximumOrderLimit &&
              variantQuantity >= variant.maximumOrderLimit
            );

            return (
              <View
                key={index}
                style={[styles.variantCard, isVariantOOS && styles.disabledOp]}
              >
                {/* Info Side */}
                <View style={styles.variantInfo}>
                  <Text style={styles.variantSize}>
                    {variant.size} {variant.unit}
                  </Text>
                  <View style={styles.variantPriceRow}>
                    <Text style={styles.variantSelling}>
                      ₹{Math.round(variantPricing.sellingPrice)}
                    </Text>
                    {variantPricing.discount > 0 && (
                      <Text style={styles.variantOriginal}>
                        ₹{Math.round(variantPricing.originalPrice)}
                      </Text>
                    )}
                  </View>
                  {isVariantOOS && (
                    <Text style={styles.variantOosText}>Out of Stock</Text>
                  )}
                </View>

                {/* Action Side */}
                <View style={styles.variantActionContainer}>
                  <AddToCartButton
                    quantity={variantQuantity}
                    onAdd={() => handleAddVariantToCart(variant)}
                    onIncrease={() =>
                      updateQuantity(product._id, variantQuantity + 1, variant)
                    }
                    onDecrease={() =>
                      updateQuantity(product._id, variantQuantity - 1, variant)
                    }
                    isOutOfStock={isVariantOOS}
                    isMaxLimitReached={isLimit}
                    isStockLimitReached={false}
                    containerStyle={styles.actionButtonContainer}
                    size="small"
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Drawer>

      {/* --- PRODUCT DETAIL MODAL --- */}
      <Modal
        visible={showProductDetailModal}
        transparent={true}
        animationType='fade'
        onRequestClose={closeProductDetailModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeProductDetailModal} />
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Product Image */}
              <View style={styles.modalImageContainer}>
                {product.images && product.images.length > 0 ? (
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.modalProductImage}
                    resizeMode='contain'
                  />
                ) : (
                  <View style={styles.modalPlaceholder}>
                    <Text style={styles.modalPlaceholderText}>
                      {product.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.modalInfoSection}>
                {/* Category */}
                {product.category && (
                  <Text style={styles.modalCategory}>
                    {product.category.name}
                  </Text>
                )}

                {/* Product Name */}
                <Text style={styles.modalProductName}>{product.name}</Text>

                {/* Variant Selection - Show first if multiple variants */}
                {hasMultipleVariants && (
                  <>
                    <Text style={styles.modalSectionTitle}>Select Size</Text>
                    <View style={styles.modalVariantContainer}>
                      {availableVariants.map((variant, index) => {
                        const variantPricing = getVariantPrice(variant);
                        const isSelected =
                          selectedVariantForDetail?.size === variant.size &&
                          selectedVariantForDetail?.unit === variant.unit;
                        const variantStock = variant.stock || 0;
                        const variantIsOOS = variant.isOutOfStock || variantStock === 0;
                        const variantQuantity = getItemQuantityFromItems(product._id, variant);

                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.modalVariantCard,
                              isSelected && styles.modalVariantCardSelected,
                              variantIsOOS && styles.modalVariantCardDisabled,
                            ]}
                            onPress={() => setSelectedVariantForDetail(variant)}
                            disabled={variantIsOOS}
                          >
                            <View style={styles.modalVariantCardContent}>
                              <View style={styles.modalVariantCardLeft}>
                                <View style={styles.modalVariantCardHeader}>
                                  <Text
                                    style={[
                                      styles.modalVariantCardSize,
                                      isSelected && styles.modalVariantCardSizeSelected,
                                      variantIsOOS && styles.modalVariantCardSizeDisabled,
                                    ]}
                                  >
                                    {variant.size} {variant.unit}
                                  </Text>
                                  {variantPricing.discount > 0 && !variantIsOOS && (
                                    <View style={styles.modalVariantCardDiscountBadge}>
                                      <Text style={styles.modalVariantCardDiscountText}>
                                        {Math.round(variantPricing.discount)}% OFF
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                {variantIsOOS ? (
                                  <Text style={styles.modalVariantCardOosText}>Out of Stock</Text>
                                ) : (
                                  <View style={styles.modalVariantCardPriceRow}>
                                    <Text
                                      style={[
                                        styles.modalVariantCardPrice,
                                        isSelected && styles.modalVariantCardPriceSelected,
                                      ]}
                                    >
                                      ₹{Math.round(variantPricing.sellingPrice)}
                                    </Text>
                                    {variantPricing.discount > 0 && variantPricing.originalPrice > 0 && (
                                      <Text style={styles.modalVariantCardOriginalPrice}>
                                        ₹{Math.round(variantPricing.originalPrice)}
                                      </Text>
                                    )}
                                  </View>
                                )}
                              </View>
                              {!variantIsOOS && (
                                <View style={styles.modalVariantCardRight}>
                                  {variantQuantity > 0 ? (
                                    <View style={styles.modalVariantCardQtyBadge}>
                                      <Svg
                                        width={26}
                                        height={26}
                                        viewBox="0 0 512 512"
                                        fill="none"
                                        style={styles.modalVariantCardQtyIcon}
                                      >
                                        <Path
                                          d="M283 40l3.012.809c24.91 7.483 46.443 24.498 59.138 47.253 9.385 17.854 13.054 35.829 12.85 55.938l3.146-.063c3.895-.074 7.79-.119 11.685-.157 1.678-.02 3.356-.047 5.034-.082 14.361-.291 24.815 1.348 35.76 11.552 6.529 6.731 9.384 15.352 10.092 24.587l.161 2.025c.177 2.246.342 4.491.508 6.737l.379 4.911c.349 4.531.687 9.063 1.021 13.595a18585.907 18585.907 0 014.042 55.305l.264 3.667c.823 11.45 1.646 22.899 2.465 34.349 1.038 14.514 2.082 29.028 3.135 43.541.746 10.292 1.486 20.584 2.219 30.876.437 6.117.876 12.234 1.323 18.35.419 5.728.828 11.457 1.231 17.186.149 2.093.301 4.186.456 6.279 2.456 33.16 2.456 33.16-8.046 45.592-7.703 8.058-16.354 12.746-27.547 13.007a785.42 785.42 0 01-6.865.01l-3.83.014c-3.498.012-6.995.012-10.493.01-3.776-.001-7.553.01-11.329.02-7.395.016-14.79.022-22.185.023-6.013.001-12.026.005-18.038.011-17.058.018-34.115.027-51.173.026h-2.785l-2.789-.001c-14.91 0-29.821.019-44.731.047-15.32.029-30.64.042-45.96.041-8.597-.001-17.193.004-25.79.026-7.321.018-14.641.023-21.961.009-3.732-.007-7.464-.007-11.196.011-4.053.018-8.105.006-12.159-.01l-3.543.032c-12.308-.104-21.54-3.907-30.407-12.339-8.454-8.883-10.19-18.976-10.065-30.933.128-2.746.312-5.481.52-8.221l.216-3.136c.239-3.432.49-6.863.742-10.294a8595.208 8595.208 0 011.81-25.431c.507-7.002 1.004-14.004 1.501-21.007.888-12.502 1.785-25.003 2.687-37.504.874-12.107 1.74-24.214 2.599-36.322a52758.64 52758.64 0 012.825-39.633l.151-2.12.303-4.216c.349-4.871.696-9.742 1.041-14.613.467-6.567.94-13.134 1.416-19.7.174-2.404.346-4.808.515-7.212.233-3.293.473-6.585.714-9.878l.197-2.852c1.095-14.611 3.253-28.032 14.515-38.428 7.724-5.874 14.947-7.849 24.485-7.785l2.404.005c2.527.005 5.053.018 7.58.03 1.716.006 3.432.01 5.148.014 4.201.011 8.401.028 12.602.049l-.04-3.634-.03-4.827-.029-2.383c-.115-24.794 9.918-47.71 27.197-65.289.965-.958 1.932-1.914 2.902-2.867l2.309-2.305C211.175 39.243 250.454 30.91 283 40zm-80 54c-11.957 15.008-16 30.992-16 50h138c0-21.261-5.667-39.267-20.438-54.875-14.775-13.693-33.033-20.134-53.007-19.465C232.505 70.794 215.48 79.644 203 94z"
                                          fill={COLORS.primary}
                                        />
                                      </Svg>
                                      <Text style={styles.modalVariantCardQtyText}>{variantQuantity}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Price and Discount - Show only for single variant (not multiple) */}
                {!hasMultipleVariants && (
                  <View style={styles.modalPriceHeader}>
                    <View style={styles.modalPriceContainer}>
                      <Text style={styles.modalSellingPrice}>
                        ₹{Math.round(detailVariantPricing.sellingPrice)}
                      </Text>
                      {detailVariantPricing.discount > 0 && detailVariantPricing.originalPrice > 0 && (
                        <Text style={styles.modalOriginalPrice}>
                          ₹{Math.round(detailVariantPricing.originalPrice)}
                        </Text>
                      )}
                    </View>
                    {detailVariantPricing.discount > 0 && (
                      <View style={styles.modalDiscountBadge}>
                        <Text style={styles.modalDiscountText}>
                          {Math.round(detailVariantPricing.discount)}% OFF
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Selected Variant Info - Only show if single variant */}
                {!hasMultipleVariants && selectedVariantForDetail && (
                  <Text style={styles.modalUnit}>
                    {selectedVariantForDetail.size} {selectedVariantForDetail.unit}
                  </Text>
                )}

                {/* Description */}
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescription}>
                  {product.description ||
                    `Fresh ${product.name} sourced directly from local farmers. High quality and organic.`}
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Action Section */}
            <View style={styles.modalBottomSection}>
              {/* Quantity Controls - Show only if quantity > 0 */}
              <View style={styles.modalQuantityControls}>
                <View style={styles.modalActionButtonContainer}>
                  <AddToCartButton
                    quantity={detailQuantity}
                    onAdd={() => {
                      if (selectedVariantForDetail) {
                        handleAddVariantToCart(selectedVariantForDetail);
                      }
                    }}
                    onIncrease={() => {
                      if (selectedVariantForDetail && !detailIsOutOfStock && !detailIsMaxLimitReached) {
                        updateQuantity(product._id, detailQuantity + 1, selectedVariantForDetail);
                      }
                    }}
                    onDecrease={() => {
                      if (selectedVariantForDetail) {
                        if (detailQuantity > 1) {
                          updateQuantity(product._id, detailQuantity - 1, selectedVariantForDetail);
                        } else {
                          updateQuantity(product._id, 0, selectedVariantForDetail);
                        }
                      }
                    }}
                    isOutOfStock={detailIsOutOfStock}
                    isMaxLimitReached={detailIsMaxLimitReached}
                    isStockLimitReached={false}
                    containerStyle={styles.modalActionButtonInner}
                    size="large"
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={closeProductDetailModal}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- CARD LAYOUT ---
  cardContainer: {
    width: CARD_WIDTH,
  },
  cardInner: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // --- IMAGE SECTION ---
  imageSection: {
    width: '100%',
    aspectRatio: 1.1, // Slightly taller/squarer
    backgroundColor: '#F8FAFC', // Very subtle gray bg
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
    top: 6, // Moved closer to edge
    left: 6,
    flexDirection: 'column',
    gap: 4,
    zIndex: 10,
  },
  discountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8, // More horizontal breathing room
    paddingVertical: 4,
    borderRadius: 10, // Fully rounded (Pill shape)
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-start', // Ensures it wraps text tightly
  },
  discountText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.2, // Tiny spacing for readability
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
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 20,
  },

  // --- DETAILS SECTION ---
  detailsSection: {
    padding: 10,
    paddingTop: 8,
  },
  variantSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textGray,
    fontWeight: '500',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 18,
    height: Platform.OS === 'android' ? 38 : 44, // Fixed height for 2 lines to ensure consistent card height
  },
  footerRow: {
    flexDirection: 'column', // Stacked on mobile grid
    gap: 8,
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
  actionContainer: {
    width: '100%',
    height: 30, // Fixed height for alignment
  },
  actionButtonContainer: {
    width: '100%',
    height: '100%',
  },

  // --- VARIANT DRAWER STYLES ---
  variantsList: {
    padding: 24,
  },
  variantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  variantInfo: {
    flex: 1,
  },
  variantSize: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  variantSelling: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  variantOriginal: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  variantOosText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  variantActionContainer: {
    width: 100,
    height: 30,
  },
  disabledOp: {
    opacity: 0.5,
  },

  // --- PRODUCT DETAIL MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    height: '80%',
    maxHeight: 700,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalImageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
  },
  modalPlaceholderText: {
    fontSize: 64,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalInfoSection: {
    padding: 16,
    backgroundColor: '#fff',
    display: 'flex',
    height: '100%',
  },
  modalCategory: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
    lineHeight: 24,
  },
  modalPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  modalSellingPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  modalOriginalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  modalDiscountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalDiscountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  modalUnit: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: '500',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 4,
    marginBottom: 8,
  },
  modalVariantContainer: {
    gap: 8,
    marginBottom: 8,
  },
  modalVariantCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  modalVariantCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
  },
  modalVariantCardDisabled: {
    opacity: 0.5,
  },
  modalVariantCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  modalVariantCardLeft: {
    flex: 1,
  },
  modalVariantCardRight: {
    marginLeft: 10,
  },
  modalVariantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalVariantCardSize: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  modalVariantCardDiscountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalVariantCardDiscountText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.danger,
    letterSpacing: 0.2,
  },
  modalVariantCardSizeSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalVariantCardSizeDisabled: {
    color: COLORS.textLight,
  },
  modalVariantCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  modalVariantCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  modalVariantCardPriceSelected: {
    color: COLORS.primary,
  },
  modalVariantCardOriginalPrice: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  modalVariantCardOosText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
    marginTop: 2,
  },
  modalVariantCardQtyBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalVariantCardQtyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    position: 'absolute',
    top: 8,
    left: 1,
    right: 0,
    lineHeight: 12,
    includeFontPadding: false,
  },
  modalVariantCardQtyIcon: {
    width: 24,
    height: 24,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  modalVariantCardCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  modalVariantCardCheckSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  modalVariantCardCheckText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textGray,
  },
  modalVariantCardCheckTextSelected: {
    color: '#FFF',
  },
  modalDescription: {
    fontSize: 12,
    color: COLORS.textGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  modalBottomSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingHorizontal: 20,
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalAddToCartButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 0,
  },
  modalAddToCartButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalAddToCartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalAddToCartButtonTextDisabled: {
    color: COLORS.textLight,
  },
  modalCancelButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FECACA60',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalActionButtonContainer: {
    flex: 1,
    height: 44,
    flexShrink: 0,
  },
  modalActionButtonInner: {
    width: '100%',
    height: 44,
  },
});
