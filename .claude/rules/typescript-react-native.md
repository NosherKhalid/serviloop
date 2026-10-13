---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript and React Native code style

## TypeScript
- `strict: true`. No `any` without a comment saying why; prefer `unknown` and narrow it. No `@ts-ignore`. No non-null `!` or `as` casts to silence the compiler: fix the type or parse with Zod.
- Types are erased at runtime. Anything crossing a boundary (Supabase responses, route params, Edge Function responses, form input) is validated; derive the TS type from the Zod schema with `z.infer` where practical.
- Prefer `type` aliases and discriminated unions over enums and optional-field soup. Model screen state explicitly: `{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }`.
- No floating promises: `await` or `.catch`. Never swallow errors silently.
- Timestamps are UTC ISO strings in storage; convert for display only.
- Generate DB types with Supabase tooling and keep them in sync with migrations.

## React / React Native
- Function components and hooks only. Named exports, one component per file. Default export only where Expo Router requires it (route files).
- Never mutate state or props; create new objects/arrays.
- `useEffect` is for synchronising with the outside world (fetching, subscriptions), not for deriving data; derive during render. Always handle cleanup/unmount so a late response cannot set state on a gone screen.
- Keep hook dependency arrays honest; `react-hooks` lint rules are errors. No `useMemo`/`useCallback` without a reason you can state.
- Long lists use `FlatList` with a stable `keyExtractor` (the row's id, never the index). Never `.map()` a long list inside a `ScrollView`.
- Styles: `StyleSheet.create` plus tokens from `src/theme`. No hardcoded colours, spacing or font sizes.
- `Platform.select` or `.ios.tsx`/`.android.tsx` only where behaviour truly differs. Remember Android hardware back and keyboard differences.
- Comment the non-obvious "why". Add a single `// iOS: ...` note on the first use of a concept that differs from SwiftUI/UIKit.
