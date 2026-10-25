import { Stack } from 'expo-router';

// Settings owns a small stack so "Manage technicians" opens a screen with a normal back button.
export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="technicians/index" options={{ title: 'Technicians' }} />
      <Stack.Screen name="technicians/new" options={{ title: 'New technician' }} />
      <Stack.Screen name="technicians/[id]" options={{ title: 'Edit technician' }} />
    </Stack>
  );
}
