import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing, useTheme } from '@/theme';

type ScreenProps = ViewProps & {
  centered?: boolean;
};

// Full-screen container with the theme background. Navigation headers sit outside it.
export function Screen({ centered = false, style, ...viewProps }: ScreenProps) {
  const colors = useTheme();

  return (
    <View
      {...viewProps}
      style={[styles.screen, { backgroundColor: colors.background }, centered && styles.centered, style]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
});
