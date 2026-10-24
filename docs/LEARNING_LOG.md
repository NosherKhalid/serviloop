# Learning log

Swift → TypeScript / React Native notes. 3–5 brief bullets per session: concepts learned, questions, pitfalls, next action.

## 2026-10-13 — Project setup
- Nothing learned in code yet. Project structure decided: thin routes, feature hooks ≈ ViewModels, repositories hold all Supabase access.
- Next: scaffold Expo (M0) and build the first component.

## 2026-10-14 — M0 slices 1–2
- `package.json` ≈ `Package.swift` (what we depend on); `package-lock.json` ≈ `Package.resolved` (exact versions).
- A `.tsx` component is a function returning JSX; props are its typed parameters; `useState` ≈ `@State` but the setter schedules a re-render, it does not change `count` in place.
- Data flows down via props, events flow up via callbacks (`onIncrement`); there is no two-way `@Binding`.
- Pitfall: `setCount(count + 1)` reads `count` from the render the closure was created in. Fine here; we'll meet the stale-closure version later.
- Next: theme tokens and reusable Button/Input/EmptyState (slice 3).

## 2026-10-24 — M0 slice 3
- Design tokens (`src/theme`) replace hardcoded values; `useTheme()` is a custom hook (name starts with `use`, calls other hooks) ≈ reading `@Environment(\.colorScheme)`.
- TypeScript is structural: `darkColors: ThemeColors` must match the light palette's shape; no protocol conformance needed.
- Union types (`'primary' | 'secondary'`) ≈ Swift enums without payloads; `?` makes a prop optional (`T | undefined`).
- `{...rest}` forwards all remaining props; `A & B` combines types. Derived values (e.g. `nameError`) are computed during render, not stored in state.
- Next: route groups and the navigation shell (slice 4).
