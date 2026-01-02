import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useUserStore } from '../store/userStore';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const initialize = useUserStore((state) => state.initialize);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize user store (load tokens and profile from storage)
      await initialize();

      // Check onboarding status
      const onboardingCompleted = await AsyncStorage.getItem(
        'onboarding_completed'
      );
      setHasSeenOnboarding(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#4CAF50' />
      </View>
    );
  }

  if (hasSeenOnboarding) {
    return <Redirect href='/(tabs)/home' />;
  }

  return <Redirect href='/onboarding' />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
