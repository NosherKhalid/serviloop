import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { minTouchSize, radius, spacing, typography, useTheme } from '@/theme';

// A union of string literals: the compiler only accepts these exact values.
// iOS: like a Swift enum without associated values.
type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant; // `?` = optional prop; its type is `ButtonVariant | undefined`
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }: ButtonProps) {
  const colors = useTheme();
  const isPrimary = variant === 'primary';
  const isInactive = disabled || loading;

  const backgroundColor = isPrimary ? colors.primary : 'transparent';
  const textColor = isPrimary ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      // `style` can be a function of the press state. Arrays merge styles; later items win.
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor: colors.primary },
        pressed && styles.pressed,
        isInactive && styles.inactive,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

// Layout lives in StyleSheet.create; colours come from the theme at render time.
const styles = StyleSheet.create({
  base: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.heading,
  },
  pressed: {
    opacity: 0.7,
  },
  inactive: {
    opacity: 0.5,
  },
});
