import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export default function Header({ showBack = false, title }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name='arrow-back' size={18} color='#333' />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {title && !showBack && <View style={styles.iconButton} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'left',
    paddingBottom: 6,
  },
  iconButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
});
