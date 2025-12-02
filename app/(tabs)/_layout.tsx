import {
  IconHome,
  IconLayoutGrid,
  IconShoppingCart,
  IconUser,
} from '@tabler/icons-react-native';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

// Floating background component
function FloatingTabBarBackground() {
  return (
    <View style={styles.backgroundWrapper}>
      <View style={styles.floatingBar} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',

        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 90,
        },

        // ⭐ MAIN FIX → Push icons + labels down
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 12, // ← THE REAL FIX
        },

        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },

        tabBarBackground: () => <FloatingTabBarBackground />,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconHome size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name='categories'
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <IconLayoutGrid size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name='account'
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconUser size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name='cart'
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <IconShoppingCart size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  floatingBar: {
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
