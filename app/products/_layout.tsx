import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="vegetables" />
      <Stack.Screen name="fruits" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

