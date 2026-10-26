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
      {error ? (
        // An "alert" is announced by VoiceOver / TalkBack when it appears, so a validation message is not silent.
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
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
    // Serviloop is English-only for now. Without these two lines iOS lets the phone's preferred
    // languages decide: with an RTL language such as Urdu in the list, an empty field puts the cursor
    // on the right and English typing starts from the right edge.
    textAlign: 'left',
    writingDirection: 'ltr',
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  error: {
    ...typography.caption,
  },
});
