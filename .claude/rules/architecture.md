---
paths:
  - "app/**"
  - "src/**"
---

# Architecture

Flow: **Screen → feature hook → repository → Supabase client → Postgres/RLS.**

```
app/ routes  →  features/<x>
components → hooks → repositories → src/lib/supabase.ts
types: importable from anywhere; they import nothing
```

- **Routes are thin.** A file in `app/` renders a screen from a feature and sets route options. No data access, no business logic. (iOS: a route file is like a coordinator entry that just instantiates a view.)
- **Screens render and dispatch.** Loading, error and data logic live in a `useXxx` hook (the "ViewModel"). Screens never import `@supabase/supabase-js`.
- **Repositories are the only code that talks to Supabase.** Typed async functions, no JSX, no React. They throw or return typed errors; hooks translate them for the UI.
- **One Supabase client** in `src/lib/supabase.ts`. Never create another. No service-role or secret keys in the app.
- **Providers hold cross-screen state only** (auth session, current business). Not a dumping ground; do not mirror table rows into context.
- **Access control lives in the database (RLS + constraints),** never only in the app. Filtering a dropdown is UX, not security.
- **AI goes through the Edge Function** `generate-job-summary` only. The app sends `{ workOrderId }`, never record contents.
- **Features are isolated:** `src/features/<name>/{components,hooks,validation}`. Import another feature only through its `index.ts`.
- **No state library** until a concrete problem proves the need; record the decision in `docs/DECISIONS.md` first.
- Path alias `@/` → `src/`. Avoid relative imports that climb more than one level.
- New feature: `/new-feature <name>`.
