import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

export function SignUpScreen() {
  const colors = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>

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
        autoComplete="new-password"
      />

      {/* MOCK (M0): creating an account just signs you in. */}
      <Button title="Create account" onPress={signIn} />

      <Link href="/sign-in" style={[styles.link, { color: colors.primary }]}>
        Already have an account? Sign in
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
