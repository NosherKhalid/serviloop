import { Stack } from 'expo-router';

// iOS: `_layout.tsx` is the container for every route in this folder, like a NavigationStack.
// `<Stack>` gives native push/pop navigation and the Android back behaviour for free.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Serviloop' }} />
    </Stack>
  );
}
