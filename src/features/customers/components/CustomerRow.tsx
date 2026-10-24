import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';
import type { Customer } from '@/types/customer';

type CustomerRowProps = {
  customer: Customer;
  onPress: () => void;
};

export function CustomerRow({ customer, onPress }: CustomerRowProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${customer.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
      <Text style={[styles.name, { color: colors.text }]}>{customer.name}</Text>
      {/* `value && <Text/>` would render a stray "0" or "" for falsy values; compare explicitly. */}
      {customer.phone !== null ? <Text style={{ color: colors.textMuted }}>{customer.phone}</Text> : null}
      {customer.address !== null ? <Text style={{ color: colors.textMuted }}>{customer.address}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    ...typography.heading,
  },
});
