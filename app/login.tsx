import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { useUserStore } from '../store/userStore';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (redirect) {
        router.replace(redirect as any);
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [isLoggedIn, redirect, router]);

  const handleLoginSuccess = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem('onboarding_completed', 'true');
    // Redirect to the specified path or default to home
    if (redirect) {
      router.replace(redirect as any);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  // Don't render login form if already logged in
  if (isLoggedIn) {
    return null;
  }

  // Hide back button if coming from onboarding/first time (no redirect parameter)
  // Back button should only show when navigating from other pages like account
  const showBackButton = !!redirect;

  return (
    <View style={styles.container}>
      <Header showBack={showBackButton} />
      <LoginForm onLoginSuccess={handleLoginSuccess} showHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
