import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

import { Button } from './Button';

// iOS: this type is like the `let` parameters of a SwiftUI View struct.
// It only exists at compile time; React does not check it at runtime.
type WelcomeCardProps = {
  title: string;
  subtitle: string;
  count: number;
  onIncrement: () => void;
};

// iOS: a component is just a function that returns UI (JSX), like a SwiftUI `body`.
// React calls this function again every time the props change.
export function WelcomeCard({ title, subtitle, count, onIncrement }: WelcomeCardProps) {
  const colors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

      {/* iOS: `onPress` is a closure passed from the parent, like a Button action.
          The card owns no state; the parent does (data flows down, events flow up). */}
      <Button title={`Tapped ${count} times`} onPress={onIncrement} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.md,
  },
});
