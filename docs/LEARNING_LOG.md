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

## 2026-10-24 — M0 slice 4
- Folders in `src/app` are the navigation graph: `(auth)` and `(app)` are route groups (parentheses = no URL segment); `_layout.tsx` is the container (Stack/Tabs) ≈ coordinator.
- Context = shared value for a whole subtree (`AuthProvider` + `useAuth`) ≈ `@EnvironmentObject`; every consumer re-renders when the value changes. `useContext` returns `T | null` here, so the hook narrows away `null`.
- `Stack.Protected guard={...}` replaces hand-written redirects: flip the flag and Expo Router moves the user.
- Android back: from a non-first tab it returns to the first tab; from the first tab it leaves the app.
- Pitfall: adding/deleting files under a running app can leave Fast Refresh with a stale module ("Requiring unknown module"); a cold reload fixes it, it is not a code bug.

## 2026-10-24 — M0 slice 5
- Screen state is a discriminated union (`loading | error | ready`) ≈ Swift enum with associated values; `switch (state.status)` narrows so only `ready` exposes `customers`.
- `useEffect` ≈ `.task(id:)` but nothing cancels it for you: use a local `isCancelled` flag in the cleanup so a late response cannot set state on a gone screen.
- `setReloadCount(c => c + 1)` (functional update) reads the latest value, avoiding stale closures; changing a dependency (`reloadCount`) is how you re-run an effect.
- `FlatList` + `keyExtractor` (stable id, not index) ≈ `List` + `Identifiable`; `value && <X/>` can render stray `0`/`""`, so compare explicitly (`!== null`).
- Repositories hide the data source: M3 swaps the body of `listCustomers`, not the hook or screen.

## 2026-10-24 — M0 slice 6
- Controlled inputs: the field always shows `values[field]`; typing calls `setField`, which uses a functional update (`setValues(current => ({...current, [field]: value}))`) so it never overwrites newer state with a stale copy.
- `z.input` vs `z.output`: the form holds strings; after `safeParse` we get trimmed values with blank optional fields as `null`. Types are erased at runtime, Zod is not.
- Route params (`[id]`) arrive as `string` (or `string[]`) and are untrusted: check them before use, and handle "not found" as a normal state.
- A screen under a pushed screen stays mounted, so `useEffect` does not re-run on return. `useFocusEffect` + `useCallback` refetches on focus; without `useCallback` the effect would re-run every render.
- Pitfall: Expo Go's floating Tools button covers the header's right edge; keep primary actions at the bottom.

## 2026-10-24 — M0 slice 7
- The Jobs tab lists fictional work orders with a text status chip (colour is decoration only), a customer name and a scheduled date.
- `npm run check` now exists (lint + typecheck + 22 tests) and already caught two hook problems before they reached the app.
- Job status rules are a tested pure module, ready for the status-change UI in M4.
- Tests were mutation-checked: breaking the name rule and the "completed is final" rule made the right tests fail.
- Next: `/finish-milestone M0`, then M1 (database, RLS, seed).

## 2026-10-24 — M0 wrap-up
- M0 delivered a navigable app with mock data: auth shell, customers (list + add + edit), jobs (list), settings, themed light/dark, 22 tests.
- Biggest time sinks were environment, not code: stale Wi-Fi IP vs `--localhost`, IPv6-only Metro binding, Android AVD images stripped, Xcode 27 DeviceHub. All recorded in DECISIONS (D-008, D-011, D-012).
- Expo Go quirk: its floating Tools button covers the header's right edge, so primary actions go at the bottom (D-013).
- Lint and tests earned their keep immediately (two hook problems, and a mutation check proved the tests can fail).
- Next: M1, the database and row-level security; the first milestone with real security requirements.

## 2026-10-24 — M1 (database, security, demo data)
- The hosted Supabase project now holds the real schema: four tables, composite foreign keys that make cross-business references impossible, and row-level security on everything.
- Security is proven, not assumed: 56 + 10 checks in an in-memory Postgres before pushing, then 62 checks against the real project; deliberate holes were detected.
- `load_demo_data()` gives any new user a populated business in one call (ready for the M2 onboarding button).
- Setup lessons: Supabase CLI needs a real terminal for `login`/`link`/`db push` (password prompts); `npm run test:rls` loads `.env` via Node so keys never appear in output.
- Next: M2, real sign-up / sign-in / session persistence replacing the mock `AuthProvider`.
