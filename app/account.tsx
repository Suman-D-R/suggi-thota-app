import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { useUserStore } from '../store/userStore';

// --- MODERN THEME CONSTANTS ---
const COLORS = {
  primary: '#059669', // Modern Emerald
  primarySoft: '#ECFDF5',
  textDark: '#111827',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  danger: '#EF4444',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#F3F4F6',
};

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
      iconName: 'person-outline',
      onPress: () => router.push('/profile'),
    },
    {
      id: 'orders',
      title: 'My Orders',
      iconName: 'receipt-outline',
      onPress: () => router.push('/profile/orders'),
    },
    {
      id: 'address',
      title: 'Address Book',
      iconName: 'location-outline',
      onPress: () => router.push('/profile/address'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      iconName: 'help-buoy-outline',
      onPress: () => router.push('/profile/help-support'),
    },
  ];

  const aboutItems = [
    {
      id: 'about',
      title: 'About Vitura',
      iconName: 'information-circle-outline',
      onPress: () => router.push('/profile/about'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      iconName: 'chatbox-ellipses-outline',
      onPress: () => router.push('/profile/feedback'),
    },
    {
      id: 'logout',
      title: 'Log Out',
      iconName: 'log-out-outline',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  // --- LOGIN / GUEST VIEW ---
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <LoginForm />
        {/* <View style={styles.loginContainer}>
          <View style={styles.loginContent}>
            <View style={styles.loginIconCircle}>
              <Ionicons name='person' size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.loginTitle}>Welcome to Vitura</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to track your orders, manage addresses, and access your
              wishlist.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/login?redirect=/account')}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/login?redirect=/account')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View> */}
      </View>
    );
  }

  // --- LOGGED IN VIEW ---
  return (
    <View style={styles.container}>
      <Header showBack={true} title='Account' />

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile?.firstName?.charAt(0) || 'V'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
          <Ionicons name='pencil' size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Menu Section 1 */}
      <View style={styles.sectionContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuRow,
              index === menuItems.length - 1 && styles.menuRowLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, styles.primaryIconBox]}>
              <Ionicons
                name={item.iconName as any}
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.menuText}>{item.title}</Text>
            <Ionicons
              name='chevron-forward'
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu Section 2 */}
      <View style={styles.sectionContainer}>
        {aboutItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuRow,
              index === aboutItems.length - 1 && styles.menuRowLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconBox,
                item.isDestructive
                  ? styles.destructiveIconBox
                  : styles.secondaryIconBox,
              ]}
            >
              <Ionicons
                name={item.iconName as any}
                size={20}
                color={item.isDestructive ? COLORS.danger : COLORS.textGray}
              />
            </View>
            <Text
              style={[
                styles.menuText,
                item.isDestructive && styles.destructiveText,
              ]}
            >
              {item.title}
            </Text>
            {!item.isDestructive && (
              <Ionicons
                name='chevron-forward'
                size={20}
                color={COLORS.textLight}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerAppName}>Vitura</Text>
        <Text style={styles.footerAppVersion}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // --- PROFILE HEADER ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // --- MENU LISTS ---
  sectionContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  primaryIconBox: {
    backgroundColor: COLORS.primarySoft,
  },
  secondaryIconBox: {
    backgroundColor: COLORS.border,
  },
  destructiveIconBox: {
    backgroundColor: '#FEF2F2',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textDark,
    flex: 1,
  },
  destructiveText: {
    color: COLORS.danger,
  },

  // --- LOGIN SCREEN STYLES ---
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginContent: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.cardBg,
    padding: 32,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginIconCircle: {
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
  loginTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loginSubtitle: {
    fontSize: 15,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textGray,
  },

  // --- FOOTER ---
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  footerAppName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  footerAppVersion: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '400',
  },
});
