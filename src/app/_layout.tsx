import { SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { BusinessProvider, useBusiness } from '@/providers/BusinessProvider';
import { useNavigationTheme } from '@/theme';

// Keep the native splash screen on until we know which screen to show (see RootNavigator).
// iOS: like holding the launch screen until your first real view model is ready.
void SplashScreen.preventAutoHideAsync();

// iOS: this file is the app's root coordinator. Providers wrap everything below them,
// like `.environmentObject(...)` on the root view. Order matters: the business lookup needs to
// know who is signed in, so BusinessProvider sits inside AuthProvider.
export default function RootLayout() {
  const navigationTheme = useNavigationTheme();

  return (
    <AuthProvider>
      <BusinessProvider>
        <ThemeProvider value={navigationTheme}>
          <RootNavigator />
        </ThemeProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}

// Separate component because it reads the providers, so it must render *inside* them.
function RootNavigator() {
  const { state: auth } = useAuth();
  const { state: business, reload } = useBusiness();

  // Still working out who this is, or what business they have: the splash screen stays up.
  const isDeciding = auth.status === 'loading' || (auth.status === 'signedIn' && business.status === 'loading');

  useEffect(() => {
    if (!isDeciding) {
      SplashScreen.hide();
    }
  }, [isDeciding]);

  if (isDeciding) {
    return null; // the splash screen is still showing, so nothing flashes
  }

  // Signed in, but the business lookup failed (almost always no connection): never show the wrong
  // screen, offer a retry instead.
  if (auth.status === 'signedIn' && business.status === 'error') {
    return (
      <Screen centered>
        <EmptyState
          title="Can't load your business"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={reload}
        />
      </Screen>
    );
  }

  const needsOnboarding = business.status === 'none' || business.status === 'demoLoaded';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only the group whose `guard` is true can be reached. When the state changes, Expo Router
          moves the person to the right group by itself: no manual navigation anywhere. */}
      <Stack.Protected guard={auth.status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={auth.status === 'signedIn' && needsOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={auth.status === 'signedIn' && business.status === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
