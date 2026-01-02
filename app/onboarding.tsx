import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import LoginForm from '../components/LoginForm';

export default function LoginScreen() {
  const router = useRouter();

  const handleLoginSuccess = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem('onboarding_completed', 'true');
    // Redirect to home page
    router.replace('/(tabs)/home');
  };

  const handleSkip = () => {
    router.push('/(tabs)/home');
    AsyncStorage.setItem('onboarding_completed', 'true');
  };

  return (
    <View style={styles.container}>
      <LoginForm onLoginSuccess={handleLoginSuccess} onSkip={handleSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
