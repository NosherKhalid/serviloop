import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing, typography, useTheme } from '@/theme';

import { useTechnicianForm } from '../hooks/useTechnicianForm';
import type { TechnicianFormValues, TechnicianInput } from '../validation';

type TechnicianFormProps = {
  initialValues: TechnicianFormValues;
  submitLabel: string;
  onSave: (input: TechnicianInput) => Promise<void>;
  // Extra content shown under the form (e.g. the deactivate button on the edit screen).
  children?: React.ReactNode;
};

export function TechnicianForm({ initialValues, submitLabel, onSave, children }: TechnicianFormProps) {
  const colors = useTheme();
  const { values, errors, isSubmitting, submitError, setField, submit } = useTechnicianForm({ initialValues, onSave });

  return (
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
        label="Specialty (optional)"
        value={values.specialty}
        onChangeText={(text) => setField('specialty', text)}
        error={errors.specialty}
        autoCapitalize="sentences"
        editable={!isSubmitting}
      />

      {submitError !== null ? (
        <Text accessibilityRole="alert" style={[styles.submitError, { color: colors.danger }]}>
          {submitError}
        </Text>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
      {children}
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
