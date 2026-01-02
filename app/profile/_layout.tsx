import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
