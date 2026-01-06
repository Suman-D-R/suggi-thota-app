import {
  IconHelpCircle,
  IconInfoCircle,
  IconLogout,
  IconMapPin,
  IconMessageCircle,
  IconReceipt,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../components/Header';
import { useUserStore } from '../store/userStore';

export default function AccountPage() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const profile = useUserStore((state) => state.profile);
  const logout = useUserStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

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

  const aboutItems = [
    {
      id: 'about',
      title: 'About',
      Icon: IconInfoCircle,
      onPress: () => router.push('/profile/about'),
    },
    {
      id: 'feedback',
      title: 'Feedback',
      Icon: IconMessageCircle,
      onPress: () => router.push('/profile/feedback'),
    },
    {
      id: 'logout',
      title: 'Logout',
      Icon: IconLogout,
      onPress: handleLogout,
    },
  ];

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.loginContainer}>
          <View style={styles.loginContent}>
            <Text style={styles.loginTitle}>Hello!</Text>
            <Text style={styles.loginSubtitle}>
              Welcome to Vitura. To continue, please sign in or create an
              account.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.loginButton, styles.signInButton]}
                onPress={() => router.push('/login')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginButton, styles.loginButtonSecondary]}
                onPress={() => router.push('/login')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonTextSecondary}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack={true} title='My Profile' backgroundColor='#FBFBFB' />

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <IconUserCircle size={48} strokeWidth={1} color='#4CAF50' />
        </View>
        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        {menuItems.map((item) => {
          const IconComponent = item.Icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={item.onPress}
            >
              <View style={styles.iconContainer}>
                <IconComponent size={20} strokeWidth={1.5} color='#00000070' />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoSection}>
        {aboutItems.map((item) => {
          const IconComponent = item.Icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <IconComponent size={20} strokeWidth={1.5} color='#00000070' />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerAppName}>Vitura</Text>
        <Text style={styles.footerAppVersion}>(Version 1.0.0)</Text>
      </View>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  borderWidth: 0.2,
  borderColor: '#E0E0E0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    padding: 16,
    ...shadow,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
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
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    ...shadow,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: '#4CAF50',
  },
  loginButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  loginButtonTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  footerAppVersion: {
    fontSize: 12,
    color: '#66666650',
    fontWeight: '500',
  },
  footerAppName: {
    fontSize: 26,
    color: '#66666650',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
});
