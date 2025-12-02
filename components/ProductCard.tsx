import { IconMinus, IconPlus } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useCartStore } from '../store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 32;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING - GAP) / 2;

interface Product {
  _id: string;
  name: string;
  price: number;
  unit: string;
  weight?: number;
  category?: { _id: string; name: string };
  images?: string[];
  discount?: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
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
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product._id);

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount) / 100
    : product.price;

  const handleAddToCart = () => addItem(product);
  const handleIncrease = () => updateQuantity(product._id, quantity + 1);
  const handleDecrease = () =>
    quantity > 1
      ? updateQuantity(product._id, quantity - 1)
      : updateQuantity(product._id, 0);

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
        </View>

        {/* ADD BUTTON / QUANTITY OVERLAY */}
        <View style={styles.actionOverlay}>
          {quantity > 0 ? (
            <Animated.View
              entering={ZoomIn}
              exiting={ZoomOut}
              style={styles.qtyContainer}
            >
              <AnimatedPressable
                onPress={handleDecrease}
                style={styles.qtyBtnOverlay}
              >
                <IconMinus size={22} strokeWidth={2.5} color='#4CAF50' />
              </AnimatedPressable>
              <Text style={styles.qtyTextOverlay}>{quantity}</Text>
              <AnimatedPressable
                onPress={handleIncrease}
                style={styles.qtyBtnOverlay}
              >
                <IconPlus size={22} strokeWidth={2.5} color='#4CAF50' />
              </AnimatedPressable>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn} exiting={ZoomOut}>
              <AnimatedPressable
                onPress={handleAddToCart}
                style={styles.addButtonInner}
              >
                <Text style={styles.addButtonTextOverlay}>ADD</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </View>

      {/* PRODUCT INFO */}
      <View style={styles.info}>
        {/* Weight Label */}
        <View style={styles.weightLabel}>
          <Text style={styles.weightText}>
            {product.weight ? `${product.weight} ${product.unit}` : product.unit}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/products/${product._id}`)}
          activeOpacity={0.7}
        >
          {/* Product Name */}
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Discount Badge */}
          {product.discount && (
            <Text style={styles.discountBadge}>{product.discount}% OFF</Text>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{Math.round(discountedPrice)}</Text>
            {product.discount && (
              <Text style={styles.originalPrice}>
                ₹{Math.round(product.price)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 18,
    elevation: 4,
    // shadowColor: '#000',
    // shadowOpacity: 0.15,
    // shadowOffset: { width: 0, height: 0.5 },
    // shadowRadius: 5,
    // overflow: 'hidden', //  shadow to will not work
    // borderWidth: 1,
    // borderColor: '#F3F6F4',
  },

  imageButtonContainer: {
    position: 'relative',
    height: 150,
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#F3F6F4',
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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

  actionOverlay: {
    position: 'absolute',
    bottom: 0,
    right: '10%',
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    transform: [{ translateY: 20 }],
    // gap: 4, // Moved to qtyContainer for better layout control with animations
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonInner: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: 38, // Ensure touch target
  },
  addButtonTextOverlay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  qtyBtnOverlay: {
    minWidth: 36,
    minHeight: 36,
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  qtyTextOverlay: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  info: {
    padding: 12,
    paddingTop: 8,
  },

  weightLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },

  unit: {
    color: '#666',
    fontSize: 12,
    marginBottom: 6,
  },

  discountBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
});
