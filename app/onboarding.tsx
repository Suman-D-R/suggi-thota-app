import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LoginForm from '../components/LoginForm';
import { useUserStore } from '../store/userStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  useEffect(() => {
    // If user is already logged in, skip to home
    if (isLoggedIn) {
      handleSkip();
    }
  }, [isLoggedIn]);

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)/home');
    }
  };

  const handleLoginSuccess = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)/home');
    }
  };

  const handleGetStarted = () => {
    setShowLogin(true);
  };

  if (showLogin) {
    return (
      <View style={styles.container}>
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          showHeader={false}
          onSkip={handleSkip}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='storefront' size={70} color='#4CAF50' />
          </View>
          <Text style={styles.appNameLarge}>Suggi Thota</Text>
          <Text style={styles.appTagline}>Fresh Groceries Delivered</Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name='leaf' size={20} color='#4CAF50' />
            </View>
            <Text style={styles.featureTitle}>Fresh Products</Text>
            <Text style={styles.featureDescription}>
              Get the freshest vegetables and fruits delivered daily
            </Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name='arrow-forward' size={18} color='#fff' />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButtonBottom}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonTextBottom}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    marginBottom: 24,
  },
  appNameLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  featuresSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  featureItem: {
    alignItems: 'center',
    maxWidth: 300,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonSection: {
    gap: 16,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButtonBottom: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonTextBottom: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
});
