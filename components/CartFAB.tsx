import { IconArrowBadgeRightFilled } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../store/cartStore';

export default function CartFAB() {
  const router = useRouter();
  const { items, getVariantKey } = useCartStore();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  // Tab bar height is typically around 50-55px
  const gap = 10;
  // On iOS, Expo Router positions tab bar above safe area, so we add safe area + tab bar + gap
  // On Android, safe area is typically 0, so we just add tab bar + gap
  const bottomPosition =
    Platform.OS === 'ios' ? insets.bottom - 20 : insets.bottom + gap;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Show FAB only if there are items in cart
  if (items.length === 0) {
    return null;
  }

  // Get last 3 items from cart
  const lastThreeItems = items.slice(-3).reverse();

  const handlePress = () => {
    router.push('/cart');
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <View style={[styles.fabContainer, { bottom: bottomPosition }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.fab, animatedStyle]}>
          {/* Product Images */}
          <View style={styles.imagesContainer}>
            {lastThreeItems.map((item, index) => (
              <View
                key={getVariantKey(item._id, item.selectedVariant)}
                style={[
                  styles.imageWrapper,
                  {
                    zIndex: lastThreeItems.length - index,
                    marginLeft: index === 0 ? 0 : -32,
                  },
                ]}
              >
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Title */}
          <View style={styles.rowContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>View Cart</Text>
              <Text style={styles.titleCount}>Total Items: {items.length}</Text>
            </View>
            <IconArrowBadgeRightFilled size={36} color='#2F500E' />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9BBB7C',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 28,
    gap: 3,
    backgroundColor: '#568627',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    borderRadius: 20,
  },
  titleContainer: {},
  titleCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff95',
  },
  imageWrapper: {
    width: 42,
    height: 42,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: '#E0E0E050',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1F3E190',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
