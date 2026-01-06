import {
  IconHeart,
  IconHeartFilled,
  IconHome,
  IconHomeFilled,
  IconLayoutGrid,
  IconLayoutGridFilled,
  IconRefresh,
} from '@tabler/icons-react-native';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationStore } from '../../store/locationStore';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const selectedStore = useLocationStore((state) => state.selectedStore);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#479100',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: selectedStore
          ? {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              ...Platform.select({
                ios: {
                  shadowColor: '#E0E0E0',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                },
                android: {
                  elevation: 8,
                  paddingBottom: Math.max(insets.bottom, 8),
                  paddingTop: 4,
                  height: 56 + Math.max(insets.bottom, 8),
                },
              }),
            }
          : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconHomeFilled size={24} color={color} />
            ) : (
              <IconHome size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name='categories'
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconLayoutGridFilled size={24} color={color} />
            ) : (
              <IconLayoutGrid size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name='reorder'
        options={{
          title: 'Reorder',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconRefresh size={24} color={color} />
            ) : (
              <IconRefresh size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name='wishlist'
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconHeartFilled size={24} color={color} />
            ) : (
              <IconHeart size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
