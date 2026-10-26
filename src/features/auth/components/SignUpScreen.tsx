import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';

import { useAuthForm } from '../hooks/useAuthForm';

export function SignUpScreen() {
  const colors = useTheme();
  const { values, errors, isSubmitting, formError, notice, setField, submit } = useAuthForm('signUp');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        Create your account
      </Text>

      <Input
        label="Email"
        value={values.email}
        onChangeText={(text) => setField('email', text)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!isSubmitting}
      />
      <Input
        label="Password (at least 8 characters)"
        value={values.password}
        onChangeText={(text) => setField('password', text)}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!isSubmitting}
      />

      {formError !== null ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.danger }]}>
          {formError}
        </Text>
      ) : null}
      {notice !== null ? <Text style={[styles.message, { color: colors.text }]}>{notice}</Text> : null}

      <Button title="Create account" onPress={submit} loading={isSubmitting} />

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
  message: {
    ...typography.body,
  },
  link: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
