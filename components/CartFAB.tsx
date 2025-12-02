import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCartStore } from '../store/cartStore';

export default function CartFAB() {
  const router = useRouter();
  const { items } = useCartStore();

  // Show FAB only if there are items in cart
  if (items.length === 0) {
    return null;
  }

  // Get last 3 items from cart
  const lastThreeItems = items.slice(-3).reverse();

  const handlePress = () => {
    router.push('/(tabs)/cart');
  };

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Product Images */}
        <View style={styles.imagesContainer}>
          {lastThreeItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.imageWrapper,
                {
                  zIndex: lastThreeItems.length - index,
                  marginLeft: index === 0 ? 0 : -16,
                },
              ]}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
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
        <Text style={styles.title}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'orange',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  imageWrapper: {
    width: 36,
    height: 36,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'orange',
    overflow: 'hidden',
    backgroundColor: '#4C4C4C',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1F3E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  title: {
    color: 'orange',
    fontSize: 14,
    fontWeight: '600',
  },
});
