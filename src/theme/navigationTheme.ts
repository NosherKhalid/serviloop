import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useColorScheme } from 'react-native';

import { palettes } from './colors';

// React Navigation draws headers, tab bars and screen backgrounds from its own theme.
// We start from its built-in light/dark themes and swap in our colours so everything matches.
export function useNavigationTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = isDark ? palettes.dark : palettes.light;

  return {
    ...base, // copy every field, then override only these colours (immutable update)
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.surface,
    },
  };
}
