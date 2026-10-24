import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';

import { useCustomerForm } from '../hooks/useCustomerForm';
import type { CustomerFormValues, CustomerInput } from '../validation';

type CustomerFormProps = {
  initialValues: CustomerFormValues;
  submitLabel: string;
  onSave: (input: CustomerInput) => Promise<void>;
};

// Shared by "new" and "edit": the only differences are the starting values and what `onSave` does.
export function CustomerForm({ initialValues, submitLabel, onSave }: CustomerFormProps) {
  const colors = useTheme();
  const { values, errors, isSubmitting, submitError, setField, submit } = useCustomerForm({ initialValues, onSave });

  return (
    // A ScrollView keeps every field reachable when the keyboard is open.
    // `keyboardShouldPersistTaps="handled"` lets the Save button work on the first tap while the keyboard is up.
    // iOS: `automaticallyAdjustKeyboardInsets` is iOS-only; Android resizes the window instead.
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Input
        label="Name"
        value={values.name}
        onChangeText={(text) => setField('name', text)}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        editable={!isSubmitting}
      />
      <Input
        label="Phone (optional)"
        value={values.phone}
        onChangeText={(text) => setField('phone', text)}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        editable={!isSubmitting}
      />
      <Input
        label="Address (optional)"
        value={values.address}
        onChangeText={(text) => setField('address', text)}
        error={errors.address}
        autoCapitalize="words"
        autoComplete="street-address"
        editable={!isSubmitting}
      />

      {submitError !== null ? (
        <Text accessibilityRole="alert" style={[styles.submitError, { color: colors.danger }]}>
          {submitError}
        </Text>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  submitError: {
    ...typography.body,
  },
});
