import { Stack } from 'expo-router';

export default function WorkOrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Jobs' }} />
    </Stack>
  );
}
