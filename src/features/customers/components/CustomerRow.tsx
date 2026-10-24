import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';
import type { Customer } from '@/types/customer';

type CustomerRowProps = {
  customer: Customer;
};

export function CustomerRow({ customer }: CustomerRowProps) {
  const colors = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <Text style={[styles.name, { color: colors.text }]}>{customer.name}</Text>
      {/* `value && <Text/>` would render a stray "0" or "" for falsy values; compare explicitly. */}
      {customer.phone !== null ? <Text style={{ color: colors.textMuted }}>{customer.phone}</Text> : null}
      {customer.address !== null ? <Text style={{ color: colors.textMuted }}>{customer.address}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  name: {
    ...typography.heading,
  },
});
