import {
  IconHelpCircle,
  IconLogout,
  IconMapPin,
  IconReceipt,
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

export default function AccountTab() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const profile = useUserStore((state) => state.profile);
  const logout = useUserStore((state) => state.logout);

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      Icon: IconUser,
      onPress: () => router.push('/profile'),
    },
    {
      id: 'orders',
      title: 'My Orders',
      Icon: IconReceipt,
      onPress: () => router.push('/profile/orders'),
    },
    {
      id: 'address',
      title: 'Address',
      Icon: IconMapPin,
      onPress: () => router.push('/profile/address'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      Icon: IconHelpCircle,
      onPress: () => router.push('/profile/help-support'),
    },
  ];

  const handleLogout = () => {
    logout();
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loginContainer}>
          <View style={styles.loginContent}>
            <View style={styles.loginIconContainer}>
              <IconUserCircle size={80} color='#4CAF50' />
            </View>
            <Text style={styles.loginTitle}>Welcome to Suggi Thota</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to access your account and start shopping
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <IconUserCircle size={48} color='#4CAF50' />
          </View>
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => {
            const IconComponent = item.Icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={item.onPress}
              >
                <View style={styles.iconContainer}>
                  <IconComponent size={24} color='#4CAF50' />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <IconLogout size={24} color='#FF5722' />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 32,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginLeft: 8,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginContent: {
    alignItems: 'center',
    width: '100%',
  },
  loginIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
