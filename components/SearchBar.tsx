import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
      activeOpacity={0.9}
    >
      <Ionicons name='search' size={20} color='#16a34a' />
      <Text style={styles.placeholderText}>{placeholder}</Text>
      <View style={styles.micContainer}>
        <Ionicons name='mic' size={18} color='#666' />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: Platform.select({
      ios: 48,
      android: 42,
      default: 44,
    }),
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  placeholderText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#999',
    flex: 1,
  },
  micContainer: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
    paddingLeft: 12,
  },
});
