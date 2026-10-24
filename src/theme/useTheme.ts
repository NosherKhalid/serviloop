import { useColorScheme } from 'react-native';

import { palettes, type ThemeColors } from './colors';

// iOS: like reading `@Environment(\.colorScheme)`. This is a custom hook: a function whose
// name starts with `use` and that calls other hooks. It re-runs when the system appearance changes.
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palettes.dark : palettes.light;
}
