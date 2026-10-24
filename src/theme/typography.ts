// No fixed line heights or text heights: text must scale with the user's font size setting
// (iOS: Dynamic Type). React Native scales `fontSize` automatically.
export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;
