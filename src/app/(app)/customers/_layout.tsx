import { Stack } from 'expo-router';

import { backToListOptions } from '@/components/HeaderBackToList';

// Correct for deep links: the section's stack starts at its list. It does NOT take effect when another tab
// jumps straight into a screen here (found on a device, D-034); those screens use `backToListOptions` for a
// "‹ list" button instead (D-042).
export const unstable_settings = {
  anchor: 'index',
};

export default function CustomersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Customers' }} />
      <Stack.Screen name="new" options={backToListOptions('New customer', 'Customers', '/customers')} />
      <Stack.Screen name="[id]" options={backToListOptions('Edit customer', 'Customers', '/customers')} />
    </Stack>
  );
}
