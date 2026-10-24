# Decisions

One entry per non-obvious technical choice: what, why, alternatives.

## D-001 — Start on Expo Go, stay scalable to a development build
- **Date:** 2026-10-13
- **What:** Develop and demo on Expo Go. Use only packages that run in Expo Go (Expo SDK modules, `supabase-js`, `zod`, `expo-secure-store`). Configure native settings only in `app.json`/`app.config.ts`; never hand-edit `ios/` or `android/`.
- **Why:** Fastest learning loop and no native build toolchain to debug in the first weeks. The owner wants the project to remain scalable. Keeping config declarative and avoiding custom native code means moving to a development build later is `npx expo install expo-dev-client` plus a build, not a rewrite.
- **Alternatives:** Development build from day 1 (more setup friction up front, needed only once we add native-code libraries such as push notifications, Sentry or Sign in with Apple). Bare React Native (rejected: loses Expo tooling).
- **Revisit when:** a needed package contains custom native code (the `/add-dependency` skill flags this).

## D-002 — Project rules structure mirrors Hippocamp, trimmed
- **Date:** 2026-10-13
- **What:** Long spec lives in `docs/PROJECT_SPEC.md`; `CLAUDE.md` is a short rulebook; detail in `.claude/rules/` and skills. Milestones M0–M6 with owner-review gates.
- **Why:** Proven setup from the owner's other project; keeps always-loaded context small.
- **Alternatives:** Single large `CLAUDE.md` (original). Rejected: loaded every session, mixes spec with rules.
- **Differences from Hippocamp:** no Zustand/TanStack Query/Drizzle/i18n/analytics (Serviloop's learning goal favours core React primitives); teaching format added.

## D-003 — Routes live in `src/app/` (not `app/`)
- **Date:** 2026-10-14
- **What:** Use the SDK 57 template layout: Expo Router routes in `src/app/`, alias `@/*` → `./src/*`.
- **Why:** That is what the current official template generates and Expo Router supports it; adapting is cheaper than fighting the scaffold. Everything else in `src/` stays together.
- **Alternatives:** Move routes to a root `app/` (spec's original layout). Rejected: no benefit.

## D-004 — Scaffolded into a temp dir, then merged
- **Date:** 2026-10-14
- **What:** `create-expo-app --no-install --no-agents-md` in a scratch dir; copied `src/`, `assets/`, `scripts/`, `.vscode/`, `app.json`, `package.json`, `tsconfig.json` into the repo; kept our own `.gitignore`, `CLAUDE.md`, `.claude/`, docs.
- **Why:** The repo already had files; the scaffolder would also have generated `AGENTS.md` and `.claude/settings.json` that conflict with ours.

## D-005 — Mock data behind repository-shaped functions (done, slice 5)
- **What:** `customerRepository` gets an in-memory implementation with the same async signatures the Supabase version will have in M3.
- **Why:** Screens and hooks stay unchanged when the backend arrives.

## D-006 — Strip the template demo (done, slice 2)
- **What:** Remove the template's demo screens, web-only files and unused deps (web, animated icon, glass effect) as we replace them, keeping only what we can explain.
- **Done 2026-10-14:** removed demo screens, web-only files, `scripts/reset-project`, template images, the `web` config and unused deps (`react-dom`, `react-native-web`, `expo-glass-effect`, `@expo/ui`, `expo-symbols`, `expo-device`, `expo-web-browser`, `expo-image`). Web is out of scope.

## D-007 — React Compiler off while learning
- **Date:** 2026-10-14
- **What:** Removed `experiments.reactCompiler` from `app.json`.
- **Why:** The compiler auto-memoizes components, which hides the re-render and stale-closure behaviour the owner is here to learn. Revisit after M6 or when there is a measured performance reason.
- **Alternatives:** Keep it on (less manual memoization, but opaque).

## D-008 — Dedicated Android emulator, Metro with `--localhost`
- **Date:** 2026-10-24
- **What:** Use AVD `Serviloop_Pixel_7_Pro_API_36` (Pixel 7 Pro, API 36 `google_apis` image) and start Metro with `npx expo start --localhost`.
- **Why:** `Pixel_7_Pro_API_34` and `Pixel_3a_API_34` have stripped system images (no `system.img`) and cannot boot; sharing Hippocamp's AVD mixed apps and data. `--localhost` makes Expo use `adb reverse`, so a changing Wi-Fi/DHCP address (we hit `192.168.18.160` → `.161`) cannot break the connection.
- **Alternatives:** Re-download the API 34 image (~1.5 GB).

## D-009 — Mock auth via React Context + `Stack.Protected` (slice 4)
- **Date:** 2026-10-24
- **What:** `AuthProvider` holds an `isSignedIn` boolean (mock). The root layout wraps `(app)` and `(auth)` in `<Stack.Protected guard=...>`, so Expo Router switches flows when the flag flips. Screens call `useAuth()`.
- **Why:** This is the documented SDK 57 pattern (docs.expo.dev/router/advanced/authentication). In M2 only the provider's body changes (Supabase session); routes and screens stay the same.
- **Alternatives:** Manual `router.replace` redirects in each screen (more code, easy to forget); a state library (not justified).

## D-010 — JS tabs, text-only for now
- **What:** `Tabs` from `expo-router` (JS tabs, bundled since SDK 56) with icons hidden.
- **Why:** No icon library is in the stack; adding `@expo/vector-icons` needs `/add-dependency` approval. Revisit in the M6 polish pass.

## D-011 — `npm start` binds Metro to IPv4 loopback
- **Date:** 2026-10-24
- **What:** `"start": "NODE_OPTIONS=--dns-result-order=ipv4first expo start --localhost"`.
- **Why:** `--localhost` binds to `localhost`, which Node resolves to `::1` (IPv6) on this Mac. Metro then listened on `[::1]:8081` only, and the iOS simulator's Expo Go (which opens `exp://127.0.0.1:8081`, IPv4) got `Connection refused`. Preferring IPv4 makes Metro bind `127.0.0.1`, reachable from the iOS simulator and, via `adb reverse`, the Android emulator. Verified with `curl` on a spare port; end-to-end on both devices still to be confirmed by the owner.
- **Alternatives:** `npx expo start` without `--localhost` (works, but the URL embeds the Wi-Fi IP, which changed once already, see D-008).
- **Note:** macOS/Linux syntax; Windows would need `cross-env`.

## D-012 — Xcode 27 replaced Simulator.app with DeviceHub
- **What:** `open -a Simulator` fails on Xcode 27.0. Open `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`; boot devices with `xcrun simctl boot <udid>` (iPhone 17 Pro: `C9E2F811-1A28-428C-920A-363F98A60C77`).
- **Done 2026-10-24:** `src/repositories/customerRepository.ts` (in-memory, async, 600 ms fake latency). `getMockMode()` lets the owner rehearse `empty`, `error` and `slow` states; it is a function, not a `const`, so TypeScript does not narrow it. Default must stay `'normal'` when committing.

## D-013 — "Add customer" lives at the bottom of the list, not in the header
- **Date:** 2026-10-24
- **What:** A full-width `Button` pinned under the `FlatList` (plus an action in the empty state) instead of a header-right "Add".
- **Why:** In Expo Go the floating gear ("Tools") button covers the header's right edge, so a header button opens the dev menu instead. A bottom primary action also matches the thumb-reach rule in `.claude/rules/ui-accessibility.md`.
- **Alternatives:** Header button (unusable in Expo Go); floating action button (extra component, same overlap risk at the right edge).

## D-014 — Validation with Zod, as a pure function
- **What:** `validateCustomerForm(values)` in `src/features/customers/validation.ts` wraps `customerFormSchema.safeParse` and returns `{ success, data | errors }`. Form values are strings (`z.input`); saved values are trimmed with blank phone/address as `null` (`z.output`).
- **Why:** Types vanish at runtime, so user input must be validated; keeping it React-free makes it unit-testable (slice 7) and reusable for Supabase in M3.

## D-015 — Product-focused reporting, no quizzes
- **Date:** 2026-10-24
- **What:** The owner chose to focus on how the product is developed and what it does. Quizzes and the "explain `.tsx`/props/state" gate are removed; each slice report now describes what the product can do, how to try it, and what is real vs mock. Updated `CLAUDE.md`, `.claude/rules/teaching.md`, the `start-/finish-milestone` and `new-feature` skills, and the M0 gate in `docs/PROJECT_SPEC.md`.
- **Why:** The owner's stated priority. Code explanations remain available on request.
- **Alternatives:** Keep quizzes as optional (rejected by the owner).

## D-016 — Dev tooling: ESLint (expo config) and Jest (jest-expo + RNTL)
- **Date:** 2026-10-24
- **What:** Dev dependencies installed with `npx expo install`: `eslint`, `eslint-config-expo`, `jest`, `jest-expo`, `@types/jest`, `@testing-library/react-native`. `npm run check` = lint + typecheck + test. Tests live in `__tests__/` and map the `@/` alias to `src/`. Prettier is not used.
- **Why:** `npm run lint/typecheck/test/check` are the commands `CLAUDE.md` promises; these are Expo's documented defaults and are not shipped in the app.
- **First catch:** lint flagged a synchronous `setState` in an effect (`useCustomer`) and an unused effect dependency (`useCustomers`); both were fixed in code, not suppressed.

## D-017 — Job status rules (product decision, needs owner veto if wrong)
- **What:** `open → in_progress | cancelled`; `in_progress → open | completed | cancelled`; `completed → (none)`; `cancelled → open`. Implemented as a pure module (`src/features/workOrders/status.ts`) with tests; M4 will use it for the status-change UI.
- **Why:** Simple, matches the four statuses in the spec; a completed job is final in v0.1 so the dashboard counts stay trustworthy.
- **Also:** scheduled dates are shown in UTC for now (same on every device); proper time zones arrive with the database (M3).

## D-018 — Hosted Supabase project, Supabase CLI as a dev dependency
- **Date:** 2026-10-24
- **What:** Develop against a hosted (free-tier) Supabase project, no Docker. `supabase` CLI (2.122.0) installed as a dev dependency so the version is pinned in the lockfile; it is a dev tool only and never enters the app bundle. Email confirmation is OFF in development so sign-up is one step and the scripted two-user test needs only the publishable key.
- **Why:** The hosted project is what the final demo and the AI function use, so we build and test against the real thing; Docker would add ~1–2 GB of setup for a path we do not need. Docker-free commands used: `login`, `link`, `migration list`, `db push`.
- **Trade-offs:** no local reset (a mistake lands on the hosted dev project, which holds only fictional data); free projects pause after about a week of inactivity, so wake it before any demo. Turn email confirmation back on before any real launch.
- **Alternatives:** local Supabase in Docker (offline, resettable); both.

## D-019 — Core schema design (M1)
- **Date:** 2026-10-24
- **What:** `supabase/migrations/20261024103554_core_schema.sql`. One business per owner (`businesses.owner_id` unique, defaults to `auth.uid()`). Composite foreign keys `(customer_id, business_id)` and `(technician_id, business_id)` make cross-business references impossible at the database level. Foreign keys to customers/technicians use `ON DELETE NO ACTION` (not RESTRICT): a customer or technician with jobs cannot be deleted, but deleting a whole business or user still cascades cleanly (RESTRICT can fail mid-cascade). Technicians are deactivated (`active`), not deleted. Optional text fields reject empty strings (the app stores `null`, matching `validateCustomerForm`).
- **Verified before any push:** the migration was run in an in-memory Postgres (PGlite) with stand-ins for `auth.users`/`auth.uid()`: 29 checks (forged customer/technician ids rejected, optional technician allowed, status/length rules, `updated_at` trigger, delete behaviour). Row-level security is not part of this check; it is added in the next step and tested for real in slice 5.
- **Alternatives:** several businesses per owner (rejected for v0.1), `ON DELETE RESTRICT` or `SET NULL` for technicians.

## D-020 — Row-level security model (M1, awaiting owner approval)
- **Date:** 2026-10-24
- **What:** Part 2 of `20261024103554_core_schema.sql`. RLS enabled on all four tables; all default grants revoked from `public`, `anon`, `authenticated`; only needed operations re-granted to `authenticated`; 14 policies (one per operation), each `to authenticated`, scoped through `businesses.owner_id = (select auth.uid())`. Column-level grants make `id`, `owner_id`, `business_id`, `created_at`, `updated_at` unwritable by the app after creation, so rows cannot be moved or re-owned. No delete on `businesses` or `technicians`. `set_updated_at()` is not callable through the API.
- **Why:** Matches Supabase guidance and spec §5; isolation lives in the database, not the app.
- **Known gap (by design, v0.1):** job status transitions (e.g. completed is final) are enforced in the app (`src/features/workOrders/status.ts`), not in the database; a determined owner could edit their own job's status via the API. Tenant isolation is unaffected. A database trigger can be added later (BACKLOG).
- **Pre-push evidence:** 56 checks in an in-memory Postgres (PGlite, separate `anon`/`authenticated` roles, two fake users) all pass; two deliberate holes (open insert policy, writable `business_id`) were detected by the same checks. The real two-account test against the hosted project is slice 5.

## D-021 — Demo data via `load_demo_data()` instead of `seed.sql`
- **Date:** 2026-10-24
- **What:** `supabase/migrations/20261024105337_demo_data.sql` adds `public.load_demo_data()` (security invoker, executable by signed-in users only). It creates the caller's business if missing and inserts 6 fictional customers, 3 technicians and 6 jobs (2 open, 1 in progress, 2 completed with realistic completion notes for the AI summary, 1 cancelled), with dates relative to now. It refuses to run if the business already has any data and serialises double taps with an advisory lock.
- **Why:** Hosted `db push` does not run `seed.sql`, and inserting into `auth.users` would need secrets. This gives every signed-in user (including a portfolio visitor) a populated app in one tap, matching the spec's "load a seeded demo business" journey, and respects RLS.
- **Verified before push:** 10 checks in an in-memory Postgres (anon refused, counts and status mix, relative dates, second call refused with no duplicates, other users see nothing, works for an existing empty business, refuses a business with real data); the 56 RLS checks still pass.
- **Known limit:** the app cannot undo a demo load (no "reset demo" yet); BACKLOG.

## D-022 — Security test runs over the public API with the publishable key only
- **Date:** 2026-10-24
- **What:** `supabase/tests/rls-check.mjs` (`npm run test:rls`) uses plain Node `fetch` against the hosted project, signs up three throwaway users, and asserts specific database error codes (`42501`, `23503`, `23505`, `23514`) for every attack. It refuses to run with any key that is not `sb_publishable_…`. No new dependency.
- **Why:** It tests exactly what a real client or attacker can do, needs no secret key on this Mac, and doubles as the portfolio's security evidence. Requires email confirmation OFF (D-018).
- **Trade-offs:** throwaway users accumulate in Auth (cleanup needs a secret key / dashboard); no deliberate-hole mutation test against the hosted project (would change live policies); that was done in an in-memory Postgres instead.

## D-023 — Generated database types
- **What:** `npm run db:types` writes `src/types/database.ts` from the linked hosted schema (`supabase gen types typescript --linked --schema public`). Regenerate after every migration; M3 repositories will use it.

## D-024 — Accepted advisor notes at M1 close-out
- **Date:** 2026-10-24
- **What:** `supabase db advisors --linked` showed no security issue on our tables. Left as is: (1) two composite foreign keys on `work_orders` have no index starting with both columns, and `work_orders_business_status_idx` is unused so far; these are INFO-level, immaterial for a small MVP, and would need another migration for no visible benefit. (2) "Leaked password protection disabled" is an Auth setting, not schema.
- **Revisit:** if the app ever holds many jobs per business, replace `work_orders_customer_id_idx` with `(customer_id, business_id)` and add `(technician_id, business_id)`.
