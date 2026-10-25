import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';
import type { Technician } from '@/types/technician';

type TechnicianRowProps = {
  technician: Technician;
  onPress: () => void;
};

export function TechnicianRow({ technician, onPress }: TechnicianRowProps) {
  const colors = useTheme();
  const label = `${technician.name}${technician.specialty !== null ? `, ${technician.specialty}` : ''}${technician.active ? '' : ', inactive'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface },
        !technician.active && styles.inactive,
        pressed && styles.pressed,
      ]}>
      <View style={styles.texts}>
        <Text style={[styles.name, { color: colors.text }]}>{technician.name}</Text>
        {technician.specialty !== null ? <Text style={{ color: colors.textMuted }}>{technician.specialty}</Text> : null}
      </View>
      {/* Written out, not only dimmed, so status never depends on colour alone. */}
      {!technician.active ? (
        <Text style={[styles.badge, { color: colors.textMuted, borderColor: colors.border }]}>Inactive</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.heading,
  },
  badge: {
    ...typography.caption,
    fontWeight: '600',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  inactive: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.6,
  },
});
