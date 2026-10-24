import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { spacing, typography, useTheme } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

export function SettingsScreen() {
  const colors = useTheme();
  const { state, signOut } = useAuth();
  const email = state.status === 'signedIn' ? state.user.email : null;

  return (
    <Screen style={styles.content}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Signed in as</Text>
      <Text style={[styles.value, { color: colors.text }]}>{email ?? 'Unknown'}</Text>

      <Text style={[styles.label, { color: colors.textMuted }]}>Business</Text>
      {/* MOCK (M0): the real business name comes from Supabase in M2. */}
      <Text style={[styles.value, { color: colors.text }]}>Demo Plumbing Co.</Text>

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
