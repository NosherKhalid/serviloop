import { Stack } from 'expo-router';

// A section must always start at its list, even when another tab jumps straight to a screen inside it
// (e.g. "Add customer" from the Jobs tab). Without this the stack holds only that screen: no back arrow,
// no list underneath, and "back" after saving falls out to the first tab.
export const unstable_settings = {
  anchor: 'index',
};

export default function CustomersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Customers' }} />
      <Stack.Screen name="new" options={{ title: 'New customer' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit customer' }} />
    </Stack>
  );
}
