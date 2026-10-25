import { Stack } from 'expo-router';

// Settings owns a small stack so "Manage technicians" opens a screen with a normal back button.
// A section must always start at its list, even when another tab jumps straight to a screen inside it
// (e.g. "Add customer" from the Jobs tab). Without this the stack holds only that screen: no back arrow,
// no list underneath, and "back" after saving falls out to the first tab.
export const unstable_settings = {
  anchor: 'index',
};

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
