import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { spacing, typography, useTheme } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useBusiness } from '@/providers/BusinessProvider';

export function SettingsScreen() {
  const colors = useTheme();
  const { state, signOut } = useAuth();
  const { state: businessState } = useBusiness();
  const email = state.status === 'signedIn' ? state.user.email : null;
  const businessName = businessState.status === 'ready' ? businessState.business.name : '';

  return (
    <Screen style={styles.content}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Signed in as</Text>
      <Text style={[styles.value, { color: colors.text }]}>{email ?? 'Unknown'}</Text>

      <Text style={[styles.label, { color: colors.textMuted }]}>Business</Text>
      <Text style={[styles.value, { color: colors.text }]}>{businessName}</Text>

      {/* No navigation call here: signing out changes the auth state and the root layout swaps to the sign-in screens. */}
      <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
  },
  value: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
});
