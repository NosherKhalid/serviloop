import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';

import { useAuthForm } from '../hooks/useAuthForm';

export function SignInScreen() {
  const colors = useTheme();
  const { values, errors, isSubmitting, formError, setField, submit } = useAuthForm('signIn');

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
        label="Password"
        value={values.password}
        onChangeText={(text) => setField('password', text)}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
        editable={!isSubmitting}
      />

      {formError !== null ? (
        <Text accessibilityRole="alert" style={[styles.formError, { color: colors.danger }]}>
          {formError}
        </Text>
      ) : null}

      <Button title="Sign in" onPress={submit} loading={isSubmitting} />

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
  formError: {
    ...typography.body,
  },
  link: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
