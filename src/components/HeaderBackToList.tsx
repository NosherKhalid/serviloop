import { useRouter, type Href } from 'expo-router';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { minTouchSize, spacing, typography, useTheme } from '@/theme';

type HeaderBackToListProps = {
  label: string; // the list's name, e.g. "Jobs"
  href: Href; // where the list lives, e.g. "/work-orders"
};

// A back button for a screen that has nothing underneath it in its tab's stack. That happens when another tab
// jumps straight into this one ("Add job" on the Dashboard, "Add customer" from the job form): the stack holds
// only that screen, so the normal back arrow never appears (found on a device in M4; D-034, D-042).
function HeaderBackToList({ label, href }: HeaderBackToListProps) {
  const colors = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      hitSlop={spacing.sm}
      onPress={() => router.dismissTo(href)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={[styles.text, { color: colors.primary }]}>‹ {label}</Text>
    </Pressable>
  );
}

// Everything the options function needs from React Navigation: how many screens this section's stack holds.
type NavigationProps = { navigation: { getState: () => { routes: readonly unknown[] } } };

// Use as a screen's `options` (it is a function because it looks at the stack when the screen renders). With a
// list underneath, only the title is set and the normal back arrow stays. Alone in the stack, the header shows
// "‹ <list>" and goes to the list instead of leaving the section.
// iOS: like showing a custom `leftBarButtonItem` only when the navigation stack has a single controller.
export function backToListOptions(title: string, label: string, href: Href) {
  return ({ navigation }: NavigationProps): { title: string; headerLeft?: () => ReactElement } => ({
    title,
    headerLeft: navigation.getState().routes.length > 1 ? undefined : () => <HeaderBackToList label={label} href={href} />,
  });
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
});
