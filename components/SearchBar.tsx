import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({
  placeholder = 'Search for products...',
}: SearchBarProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.searchBar}
      onPress={() => router.push('/search')}
      activeOpacity={0.7}
    >
      <Ionicons name='search' size={20} color={COLORS.primary} />
      <Text style={styles.placeholderText}>{placeholder}</Text>
      <View style={styles.micContainer}>
        <Ionicons name='mic' size={18} color={COLORS.textGray} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    height: Platform.select({
      ios: 48,
      android: 42,
      default: 44,
    }),
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Darker border
  },
  placeholderText: {
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.textGray,
    flex: 1,
    fontWeight: '400',
  },
  micContainer: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 12,
  },
});
