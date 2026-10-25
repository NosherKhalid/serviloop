import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

type CountCardProps = {
  label: string;
  count: number;
  onPress: () => void;
};

// One big number with its label. The whole card is a button that opens the Jobs tab.
export function CountCard({ label, count, onPress }: CountCardProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${count} ${count === 1 ? 'job' : 'jobs'}`}
      accessibilityHint="Opens the jobs list"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
      <Text style={[styles.count, { color: colors.text }]}>{count}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
  count: {
    ...typography.title,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});
