import { SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useNavigationTheme } from '@/theme';

// Keep the native splash screen on until the saved session has been looked up (see RootNavigator).
// iOS: like holding the launch screen until your first real view model is ready.
void SplashScreen.preventAutoHideAsync();

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
  const { state } = useAuth();
  const isRestoring = state.status === 'loading';

  useEffect(() => {
    if (!isRestoring) {
      SplashScreen.hide();
    }
  }, [isRestoring]);

  if (isRestoring) {
    return null; // the splash screen is still showing, so nothing flashes
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only the group whose `guard` is true can be reached. When the sign-in state changes,
          Expo Router moves the user to the other group by itself. */}
      <Stack.Protected guard={state.status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={state.status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
