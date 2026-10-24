---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/theme/**"
  - "src/features/**/components/**"
---

# UI and accessibility

- Build from the small in-house components in `src/components` (Button, Input, EmptyState, ...). Add one there before duplicating styling. No UI kit.
- Colours, spacing, radii and typography come from `src/theme`. Support light and dark where cheap; never hardcode a colour.
- Every data screen handles **loading, empty, error (with retry)**, and a friendly offline message. A screen without these is not done.
- Touch targets ≥ 44 pt. Touchables get `accessibilityRole` and `accessibilityLabel`; icon-only buttons always have a label.
- Do not disable font scaling or fix text heights (Dynamic Type). Check large text sizes.
- Contrast meets WCAG AA. Never convey status (e.g. job status) by colour alone; add text.
- Respect safe areas and the keyboard: forms must stay usable with the keyboard open on both iOS and Android.
- Check Android back navigation on every new screen. Date inputs must render sensibly on both platforms.
- Do not over-polish before the main flow works.
