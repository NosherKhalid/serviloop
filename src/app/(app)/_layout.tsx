import { Tabs } from 'expo-router';

import { useTheme } from '@/theme';

// iOS: like a TabView. Each file or folder in this directory becomes one tab, in the order declared below.
export default function AppLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIconStyle: { display: 'none' }, // text-only tabs for now (no icon library yet)
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
        tabBarLabelPosition: 'beside-icon',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      {/* These three own a nested Stack (list -> detail), and that Stack draws its own header. */}
      <Tabs.Screen name="customers" options={{ title: 'Customers', headerShown: false }} />
      <Tabs.Screen name="work-orders" options={{ title: 'Jobs', headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
    </Tabs>
  );
}
