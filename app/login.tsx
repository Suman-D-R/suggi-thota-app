import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';

export default function LoginScreen() {
  const router = useRouter();

  const handleLoginSuccess = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem('onboarding_completed', 'true');
    // Redirect to home page
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} title='Login' />
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

