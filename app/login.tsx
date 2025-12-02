import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';

export default function LoginScreen() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.back();
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

