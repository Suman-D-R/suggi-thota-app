import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS === 'android' && { animation: 'fade' }),
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='orders' />
      <Stack.Screen name='orders/[id]' />
      <Stack.Screen name='address' />
      <Stack.Screen name='help-support' />
      <Stack.Screen name='about' />
      <Stack.Screen name='feedback' />
      <Stack.Screen name='terms-of-service' />
      <Stack.Screen name='privacy-policy' />
    </Stack>
  );
}
