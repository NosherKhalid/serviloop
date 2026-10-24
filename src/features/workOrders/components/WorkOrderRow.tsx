import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';
import type { WorkOrder } from '@/types/workOrder';

import { formatScheduledDate } from '../format';
import { statusLabel } from '../status';
import { StatusChip } from './StatusChip';

type WorkOrderRowProps = {
  workOrder: WorkOrder;
};

export function WorkOrderRow({ workOrder }: WorkOrderRowProps) {
  const colors = useTheme();

  return (
    // One spoken summary per row, so a screen reader reads it as a single item.
    <View
      accessible
      accessibilityLabel={`${workOrder.title}, ${workOrder.customerName}, ${statusLabel(workOrder.status)}, ${formatScheduledDate(workOrder.scheduledFor)}`}
      style={[styles.row, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{workOrder.title}</Text>
      <Text style={{ color: colors.textMuted }}>{workOrder.customerName}</Text>
      <View style={styles.footer}>
        <StatusChip status={workOrder.status} />
        <Text style={{ color: colors.textMuted }}>{formatScheduledDate(workOrder.scheduledFor)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.heading,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
