import { IconArrowLeft } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  backgroundColor?: string;
}

export default function Header({
  showBack = false,
  title,
  backgroundColor = '#fff',
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, backgroundColor: backgroundColor || '#fff' },
      ]}
    >
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <IconArrowLeft size={24} strokeWidth={1.5} color='#333' />
        </TouchableOpacity>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {/* {title && !showBack && <View style={styles.iconButton} />} */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 36,
    backgroundColor: '#fff',
  },
});
