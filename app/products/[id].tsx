import {
    IconArrowLeft,
    IconHeart,
    IconMinus,
    IconPlus,
    IconShare,
    IconShoppingCart,
} from '@tabler/icons-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolation,
    FadeInDown,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { productAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45;

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

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();

  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productAPI.getById(id);

      if (response.success && response.data?.product) {
        setProduct(response.data.product);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const quantity = product ? getItemQuantity(product._id) : 0;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, IMG_HEIGHT - 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-IMG_HEIGHT, 0, IMG_HEIGHT],
      [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
    );
    const scale = interpolate(
      scrollY.value,
      [-IMG_HEIGHT, 0, IMG_HEIGHT],
      [2, 1, 1]
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity onPress={loadProduct} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const handleIncreaseQuantity = () => {
    if (quantity === 0) {
      addItem(product);
    } else {
      updateQuantity(product._id, quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      updateQuantity(product._id, quantity - 1);
    } else {
      updateQuantity(product._id, 0);
    }
  };

  const handleAddToCart = () => {
    addItem(product);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerBackground, { height: insets.top + 50 }, headerStyle]} />

      {/* Floating Header Buttons */}
      <View style={[styles.headerButtons, { top: insets.top }]}>
        <TouchableOpacity 
          style={styles.roundButton} 
          onPress={() => router.back()}
        >
          <IconArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.roundButton}>
            <IconShare size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, { marginLeft: 10 }]}>
            <IconHeart size={22} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
            {product.images && product.images.length > 0 ? (
              <Image source={{ uri: product.images[0] }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Content Sheet */}
        <View style={styles.contentSheet}>
          <View style={styles.dragHandle} />
          
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{product.category?.name || 'Fresh'}</Text>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.unit}>{product.unit}</Text>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>₹{discountedPrice.toFixed(0)}</Text>
                {product.discount && (
                  <Text style={styles.originalPrice}>₹{product.price.toFixed(0)}</Text>
                )}
              </View>
            </View>

            {product.discount && (
              <View style={styles.discountTag}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || `Fresh ${product.name} sourced directly from local farmers. High quality and organic.`}
            </Text>

            <View style={styles.divider} />

            <View style={styles.quantityRow}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, quantity === 0 && styles.qtyBtnDisabled]} 
                  onPress={handleDecreaseQuantity}
                  disabled={quantity === 0}
                >
                  <IconMinus size={20} color={quantity === 0 ? '#ccc' : '#1a1a1a'} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={handleIncreaseQuantity}>
                  <IconPlus size={20} color="#1a1a1a" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <BlurView intensity={80} tint="light" style={[styles.bottomBar, { paddingBottom: insets.bottom || 20 }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>₹{(discountedPrice * (quantity || 1)).toFixed(0)}</Text>
          </View>
          
          {quantity > 0 ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/cart')}>
              <IconShoppingCart size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Cart</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleAddToCart}>
              <IconShoppingCart size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  backButtonError: {
    marginTop: 16,
  },
  backButtonText: {
    color: '#666',
    textDecorationLine: 'underline',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButtons: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: IMG_HEIGHT,
    width: width,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 34,
  },
  unit: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  discountTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  discountText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyBtnDisabled: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 40,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
