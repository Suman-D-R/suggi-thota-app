import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS === 'android' && { animation: 'fade' }),
      }}
    >
      <Stack.Screen name="vegetables" />
      <Stack.Screen name="fruits" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

