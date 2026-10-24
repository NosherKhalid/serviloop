import { Stack, ThemeProvider } from 'expo-router';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useNavigationTheme } from '@/theme';

// iOS: this file is the app's root coordinator. Providers wrap everything below them,
// like `.environmentObject(...)` on the root view.
export default function RootLayout() {
  const navigationTheme = useNavigationTheme();

  return (
    <AuthProvider>
      <ThemeProvider value={navigationTheme}>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

// Separate component because it reads the AuthProvider, so it must render *inside* it.
function RootNavigator() {
  const { isSignedIn } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only the group whose `guard` is true can be reached. When `isSignedIn` flips,
          Expo Router moves the user to the other group by itself. */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
