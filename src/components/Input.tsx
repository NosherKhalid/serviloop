import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { minTouchSize, radius, spacing, typography, useTheme } from '@/theme';

// `&` combines types: every normal TextInput prop, plus our own `label` and `error`.
type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...textInputProps }: InputProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {/* `...textInputProps` forwards value, onChangeText, keyboardType, etc. untouched. */}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...textInputProps}
        style={[
          styles.input,
          { color: colors.text, borderColor: error ? colors.danger : colors.border },
          style,
        ]}
      />
      {/* iOS: `cond && <View/>` is how you write `if` inside a view builder. */}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  error: {
    ...typography.caption,
  },
});
