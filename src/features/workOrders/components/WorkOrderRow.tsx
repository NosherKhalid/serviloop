import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';
import type { WorkOrder } from '@/types/workOrder';

import { formatScheduledDate } from '../format';
import { statusLabel } from '../status';
import { StatusChip } from './StatusChip';

type WorkOrderRowProps = {
  workOrder: WorkOrder;
  onPress: () => void;
};

export function WorkOrderRow({ workOrder, onPress }: WorkOrderRowProps) {
  const colors = useTheme();
  const assigned = workOrder.technicianName !== null ? `assigned to ${workOrder.technicianName}` : 'unassigned';

  return (
    // One spoken summary per row, so a screen reader reads it as a single item.
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens the job"
      onPress={onPress}
      accessibilityLabel={`${workOrder.title}, ${workOrder.customerName}, ${assigned}, ${statusLabel(workOrder.status)}, ${formatScheduledDate(workOrder.scheduledFor)}`}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
      <Text style={[styles.title, { color: colors.text }]}>{workOrder.title}</Text>
      <Text style={{ color: colors.textMuted }}>{workOrder.customerName}</Text>
      <Text style={{ color: colors.textMuted }}>
        {workOrder.technicianName !== null ? `Assigned to ${workOrder.technicianName}` : 'Unassigned'}
      </Text>
      <View style={styles.footer}>
        <StatusChip status={workOrder.status} />
        <Text style={{ color: colors.textMuted }}>{formatScheduledDate(workOrder.scheduledFor)}</Text>
      </View>
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
