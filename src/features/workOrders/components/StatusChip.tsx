import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme, type ThemeColors } from '@/theme';
import type { WorkOrderStatus } from '@/types/workOrder';

import { statusLabel } from '../status';

function dotColor(status: WorkOrderStatus, colors: ThemeColors): string {
  switch (status) {
    case 'open':
      return colors.primary;
    case 'in_progress':
      return colors.warning;
    case 'completed':
      return colors.success;
    case 'cancelled':
      return colors.textMuted;
  }
}

type StatusChipProps = {
  status: WorkOrderStatus;
};

// The status is always written out as text. The coloured dot only decorates it, so colour is never
// the only way to tell statuses apart (accessibility rule).
export function StatusChip({ status }: StatusChipProps) {
  const colors = useTheme();

  return (
    <View style={[styles.chip, { borderColor: colors.border }]}>
      <View importantForAccessibility="no" style={[styles.dot, { backgroundColor: dotColor(status, colors) }]} />
      <Text style={[styles.label, { color: colors.text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
