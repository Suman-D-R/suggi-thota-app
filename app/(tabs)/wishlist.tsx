import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import LoginPrompt from '../../components/LoginPrompt';
import ProductCard from '../../components/ProductCard';
import { useUserStore } from '../../store/userStore';
import { useWishlistStore } from '../../store/wishlistStore';

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

// --- Layout Constants ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const GAP = 8; // Match ProductCard gap
// Match ProductCard 3-column layout
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * 2) / 3;

export default function WishlistTab() {
  const router = useRouter();
  const { items, removeItem } = useWishlistStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  // --- 1. Modern Empty/Login State Component ---
  const renderPlaceholder = ({
    icon,
    title,
    subtitle,
    buttonText,
    onPress,
    secondaryAction,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    buttonText: string;
    onPress: () => void;
    secondaryAction?: boolean;
  }) => (
    <View style={styles.centerContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>{subtitle}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>{buttonText}</Text>
        <Ionicons name='arrow-forward' size={18} color='#FFF' />
      </TouchableOpacity>
    </View>
  );

  // --- 2. Main Render Logic ---

  // Scenario: Not Logged In
  if (!isLoggedIn) {
    return (
      <LoginPrompt
        icon='cloud-upload-outline'
        title='Login to Access Wishlist'
        subtitle='Sign in to save your favorite items and access them from any device.'
        buttonText='Sign In / Sign Up'
        modalTitle='Unlock Your Wishlist'
        modalMessage='Login to save items for later!'
        showArrowIcon={true}
      />
    );
  }

  // Scenario: Logged In but Empty
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title='My Wishlist' />
        {renderPlaceholder({
          icon: 'heart-circle-outline',
          title: 'Make a Wish',
          subtitle:
            'Your wishlist is currently empty. Explore our collection and save items you love!',
          buttonText: 'Start Shopping',
          onPress: () => router.push('/(tabs)/home'), // Adjust route as needed
        })}
      </View>
    );
  }

  // Scenario: Wishlist with Items
  return (
    <View style={styles.container}>
      <Header title='My Wishlist' />

      {/* Summary Header */}
      <View style={styles.listHeader}>
        <Text style={styles.itemCountText}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'} Saved
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.productGrid}>
          {items.map((product) => (
            <View key={product._id} style={styles.productItem}>
              {/* Product Card Component */}
              <ProductCard product={product} />
            </View>
          ))}
        </View>
        {/* Bottom padding for navigation bars */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- LAYOUT & BASICS ---
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  /* --- Placeholder Styles (Login/Empty) --- */
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '400',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  /* --- List Styles --- */
  listHeader: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    paddingBottom: 12,
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    gap: GAP,
    justifyContent: 'flex-start',
  },
  productItem: {
    width: CARD_WIDTH,
    position: 'relative',
  },

  /* Remove Button */
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    zIndex: 10,
  },
});
