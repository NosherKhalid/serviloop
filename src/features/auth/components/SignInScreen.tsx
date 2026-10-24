import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

export function SignInScreen() {
  const colors = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    // ScrollView (not a plain View) so small screens and the keyboard never hide the button.
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
      />

      {/* MOCK (M0): any input signs you in. Real validation (Zod) and Supabase Auth arrive in M2. */}
      <Button title="Sign in" onPress={signIn} />

      {/* `Link` is Expo Router's navigation element, like a SwiftUI NavigationLink. */}
      <Link href="/sign-up" style={[styles.link, { color: colors.primary }]}>
        New here? Create an account
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  link: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
