import { Stack } from 'expo-router';

// Settings owns a small stack so "Manage technicians" opens a screen with a normal back button.
// Correct for deep links: the section's stack starts at its list. It does NOT take effect when another tab
// jumps straight into a screen here (found on a device, D-034); those screens use `backToListOptions` for a
// "‹ list" button instead (D-042).
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
