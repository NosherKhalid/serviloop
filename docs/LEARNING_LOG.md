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
