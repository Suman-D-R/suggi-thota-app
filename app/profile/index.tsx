import {
  IconEdit,
  IconMail,
  IconPhone,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { useUserStore } from '../../store/userStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserStore();

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header showBack={true} title='My Profile' backgroundColor='#FBFBFB' />
        <View style={styles.emptyContainer}>
          <IconUserCircle size={64} strokeWidth={1} color='#ccc' />
          <Text style={styles.emptyText}>No profile found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} title='My Profile' backgroundColor='#FBFBFB' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconUser size={20} strokeWidth={1.5} color='#00000070' />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>First Name</Text>
              <Text style={styles.value}>{profile.firstName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconUser size={20} strokeWidth={1.5} color='#00000070' />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Last Name</Text>
              <Text style={styles.value}>{profile.lastName}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconMail size={20} strokeWidth={1.5} color='#00000070' />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconPhone size={20} strokeWidth={1.5} color='#00000070' />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.label}>Mobile Number</Text>
              <Text style={styles.value}>{profile.mobileNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.menuCard} onPress={handleEdit}>
            <View style={styles.iconContainer}>
              <IconEdit size={20} strokeWidth={1.5} color='#00000070' />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,
  borderWidth: 0.2,
  borderColor: '#E0E0E0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    ...shadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
});
