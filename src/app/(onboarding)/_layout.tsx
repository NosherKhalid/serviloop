import { Stack } from 'expo-router';

// Shown only to a signed-in owner who has no business yet (see the guards in the root layout).
export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ title: 'Welcome', headerBackVisible: false }} />
    </Stack>
  );
}
