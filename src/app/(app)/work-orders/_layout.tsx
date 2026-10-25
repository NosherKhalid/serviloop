import { Stack } from 'expo-router';

// A section must always start at its list, even when another tab jumps straight to a screen inside it
// (e.g. "Add customer" from the Jobs tab). Without this the stack holds only that screen: no back arrow,
// no list underneath, and "back" after saving falls out to the first tab.
export const unstable_settings = {
  anchor: 'index',
};

export default function WorkOrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Jobs' }} />
      <Stack.Screen name="new" options={{ title: 'New job' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Job' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit job' }} />
    </Stack>
  );
}
