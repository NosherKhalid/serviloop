import { Stack } from 'expo-router';

// iOS: a NavigationStack for the signed-out flow. Android's back button pops it automatically.
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
    </Stack>
  );
}
