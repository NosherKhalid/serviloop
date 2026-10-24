// iOS: like an asset catalog with Any/Dark appearances, but as plain objects.
const lightColors = {
  background: '#FFFFFF',
  surface: '#EEF2FF',
  text: '#111827',
  textMuted: '#4B5563',
  primary: '#4338CA',
  onPrimary: '#FFFFFF',
  border: '#6B7280',
  danger: '#B91C1C',
  success: '#15803D',
  warning: '#B45309',
};

// TypeScript is structural: the dark palette must have exactly the same keys and
// value types as the light one, or the compiler complains. No protocol conformance needed.
export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  background: '#0B1020',
  surface: '#1E2340',
  text: '#F9FAFB',
  textMuted: '#C7CBD6',
  primary: '#818CF8',
  onPrimary: '#0B1020',
  border: '#8B91A5',
  danger: '#FCA5A5',
  success: '#4ADE80',
  warning: '#FBBF24',
};

export const palettes = { light: lightColors, dark: darkColors };
