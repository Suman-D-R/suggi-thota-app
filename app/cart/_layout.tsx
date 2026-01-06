import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS === 'android' && { animation: 'fade' }),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="checkout" />
    </Stack>
  );
}

