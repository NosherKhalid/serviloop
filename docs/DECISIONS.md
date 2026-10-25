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

## D-025 — Encrypted login-session storage (M2)
- **Date:** 2026-10-24
- **What:** The Supabase session is stored with Supabase's documented "LargeSecureStore" pattern (`src/lib/secureSessionStorage.ts`): AES-256-CTR ciphertext in AsyncStorage, a fresh random key per write in expo-secure-store (Keychain / Keystore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so it does not restore to another phone). Unreadable or corrupt data counts as "signed out" and is cleaned up instead of crashing.
- **Packages (owner approved):** `@supabase/supabase-js` ^2.118.0, `@react-native-async-storage/async-storage` 2.2.0, `expo-secure-store` ~57.0.4, `react-native-get-random-values` ~1.11.0 (all native parts are bundled in Expo Go, so D-001 holds), `aes-js` ^3.1.2 + `@types/aes-js` (plain JS; `aes-js` was last released in 2023: stable but unmaintained).
- **Why:** Matches the project rule "tokens in encrypted storage" and the spec ("current official mechanism, no improvised storage"); Supabase's own page warns that edits to this adapter can introduce subtle vulnerabilities, so it stays close to their example and is covered by tests.
- **Verified:** 9 unit tests; on the Android emulator and the iOS simulator a 6.8 KB value round-trips with the real native modules, is never stored as plaintext, and is removed cleanly.
- **Not needed:** `react-native-url-polyfill` (tested without it on RN 0.86).
- **Alternatives:** plain AsyncStorage (official quickstart default, unencrypted).

## D-026 — Settings come from one validated place
- **What:** `src/lib/env.ts` validates `EXPO_PUBLIC_SUPABASE_URL` (must be `https://<ref>.supabase.co`) and the key (must start `sb_publishable_`), and throws one readable startup error that never repeats a value. A secret key pasted by mistake is refused. After changing `.env`, restart Metro with `npm start -- --clear`.

## D-027 — Auth design (M2 slice 2)
- **Date:** 2026-10-24
- **What:** `AuthProvider` exposes only `{ status, user: { id, email } }` plus `signIn` / `signUp` / `signOut`; access and refresh tokens never enter React state, context or logs. Sign-out is `scope: 'local'` (this device only; in the installed auth library the local session is removed even if the network call fails). Root layout holds the splash screen until the saved session has been looked up and guards `(app)` / `(auth)` with `Stack.Protected`. One shared message for "wrong password" and "unknown email" so the app cannot reveal who has an account; unknown service errors always show a fixed generic sentence, never raw text. New passwords: 8–72 characters (72 is the hashing limit).
- **Known limit:** with email confirmation off, sign-up for an existing email reveals that the email is registered ("already exists"). Accepted for the MVP; it goes away when confirmation is turned back on before a real launch.
- **Verified on the Android emulator against the hosted project:** sign-up, session survives a full app close and reopen, sign-out, wrong password (friendly message), sign-in again, sign-out and sign-in with the network off (friendly "can't reach the server", app recovers when the network returns). 29 new unit tests.

## Open issue — dev-only React warning on the first restart after sign-up (not fixed)
- **What:** Android, development build only: "Can't perform a React state update on a component that hasn't mounted yet". It showed on the **first cold start after creating a brand-new account** (2 of 2 times, 2026-10-24) and did not appear in about 25 other cold starts (signed in, signed out, offline). Nothing breaks: the app lands on the right screen, and sign-in, restore and sign-out all work.
- **Where it comes from:** the in-app component stack names `ContextNavigator` and `ExpoRoot` (Expo Router's own root code in `node_modules/expo-router`), not any Serviloop component; no Serviloop code appears in the stack.
- **Status:** not reproduced on demand beyond that pattern and not fixed; it is a React *development* warning (not shown in release builds). Revisit when Expo Router is patched (`npx expo install --check`) or if it ever appears on another flow. If it does, capture the LogBox component stack again.

## D-028 — Onboarding and business state (M2 slice 3)
- **Date:** 2026-10-24
- **What:** `BusinessProvider` (inside `AuthProvider`) looks up the signed-in owner's business and exposes `idle | loading | error | none | demoLoaded | ready`. The root layout has three guarded groups: `(auth)`, `(onboarding)` (no business, or demo data just loaded) and `(app)` (ready). The splash screen stays up until both the session and the business are known; a failed lookup shows "Can't load your business" with Try again instead of a wrong screen. The business is stored together with the user id it belongs to, so a different account can never briefly see the previous owner's business. Onboarding offers "Create my business" (name, 2-100 chars, same limits as the database) or "Start with demo data" (calls `load_demo_data()`, validates its JSON answer with Zod, shows "Loaded 6 customers, 3 technicians and 6 jobs." with a Continue button).
- **Why:** The demo data is not visible in the app until M3 (lists are still mock), so the confirmation screen is the visible proof for the owner and portfolio viewers; the shared-network-error helper (`src/utils/networkError.ts`) is used by auth and business errors.
- **Verified:** 31 new unit tests (96 total); on the Android emulator against the hosted project: create business, restart skips onboarding, demo data path, account switching, and opening the app offline.
- **Known limit:** a business cannot be renamed or deleted in the app yet (BACKLOG).

## D-029 — Text fields always start from the left (English-only for now)
- **Date:** 2026-10-24
- **What:** `src/components/Input.tsx` sets `textAlign: 'left'` and `writingDirection: 'ltr'`. All 8 text fields in the app (sign in, create account, customer form, business name) use this one component, so one change covers them all.
- **Why:** On the owner's iPhone simulator the preferred languages are `en-GB` then `ur-US` (Urdu, a right-to-left language). iOS then put the cursor on the right edge of an empty English field and typing started from the right. The app is English-only for now, so direction is pinned explicitly instead of depending on the phone's language list.
- **Verified:** new unit test (`__tests__/Input.test.tsx`), Android emulator (text starts on the left), iOS simulator reloads the change without a crash. **Not verified by me:** the cursor position on the iOS keyboard (I cannot tap the iOS simulator); owner to confirm.
- **Later:** proper Urdu/RTL support (mirrored layout, translated text) would be a separate localisation task; see BACKLOG.

## D-030 — Customers on real data (M3 slice 1)
- **Date:** 2026-10-24
- **What:** `customerRepository` now runs real Supabase queries (list ordered by name, get one, create with the owner's `business_id`, update), maps snake_case rows to the app's camelCase `Customer`, and throws the service error. Updating a row that does not exist (or is not yours) reports "not found" instead of silently doing nothing. Create/update moved out of the screens into hooks (`useCreateCustomer`, `useUpdateCustomer`) so the layering is screen -> hook -> repository. A shared `dataErrorMessage` helper turns failures into one friendly sentence (offline, expired session, or the screen's own fallback); raw database text is never shown.
- **Why:** D-005 planned this swap (same function names, so list/form screens barely changed). `business_id` is sent only on creation and never on update; the database would reject a foreign business anyway (RLS + foreign keys, M1).
- **Verified:** 11 new unit tests (repository with a recording mock client, helper, action hooks; 109 total). On the Android emulator against the hosted project: the demo account's 6 customers appear alphabetically; adding "Zephyr Air Cafe" and renaming it to "Zephyr Air Bistro" with a new address both persist after a full app restart and match a database query; a second business sees "No customers yet".
- **Test-script notes (not app bugs):** pressing Back with the emulator's floating keyboard navigates away instead of closing the keyboard, so forms are submitted by tapping the button directly.

## D-031 — Technicians (M3 slice 2)
- **Date:** 2026-10-25
- **What:** Technicians are managed from **Settings > Manage technicians** (routes live under `settings/technicians/…`, not at the top level as the original spec sketch had them, so the Settings tab gets its own stack and a normal back button). `technicianRepository`: list (active first, then A-Z), get, create (with the owner's `business_id`), update (name, specialty) and `setTechnicianActive` (deactivate / reactivate). No delete: the database does not allow it, and old jobs keep pointing at former technicians. The row shows "Inactive" in words, not only dimmed. Validation mirrors the database (name 2-100, specialty up to 100 or empty).
- **Verified:** 23 new unit tests (repository with the shared recording mock `src/testing/mockSupabase.ts`, validation, action hooks, list and edit screens including empty/error/retry and a failed deactivation; 132 total). Live (Android emulator, read-only on the owner's own signed-in account): Settings shows "Manage technicians"; the list shows the 3 real technicians from the database; the edit form is pre-filled with a Deactivate button; back navigation works. **Not live-tested:** add / edit / deactivate against the real database, because the emulator was signed in as the owner's own account and those actions would permanently change their demo data (see the unit tests, and the owner can try them).

## D-032 — Jobs on real data (M3 slice 3)
- **Date:** 2026-10-25
- **What:** `workOrderRepository.listWorkOrders()` reads real jobs and gets the customer's and technician's names in the same request through the two composite foreign keys (`customers!work_orders_customer_same_business(name)`, `technicians!work_orders_technician_same_business(name)`), so there is no extra request per row and renaming a customer updates every job. A job with no technician shows "Unassigned". Unknown statuses fall back to `open` and a missing customer name to "Unknown customer" instead of crashing the screen.
- **Display rules (product decisions):** (1) Times show **in the phone's own time zone** with the time of day (e.g. "Oct 25, 2:00 PM"), replacing the UTC-only date of M0, because owners will pick local times with the date picker in slice 4. (2) The list is sorted for "what needs doing": open and in-progress jobs first, soonest first, undated last; then completed and cancelled jobs, most recent first (`src/features/workOrders/sort.ts`, a pure function).
- **Verified:** 15 new tests (147 total): repository query and mapping, sorting, time-zone formatting (UTC, Karachi, New York, day roll-over), list screen states. Live on the Android emulator against the hosted database (read-only, owner's demo business): all 6 jobs appear with the right customer, technician, status and date; the demo's 09:00 UTC job shows as 2:00 PM on the emulator (UTC+5), proving the time-zone conversion; needs-doing jobs come before the cancelled and completed ones.

## D-033 — Create and edit jobs (M3 slice 4)
- **Date:** 2026-10-25
- **What:** Jobs can be created (title, optional description, customer, optional technician, optional date and time) and edited (same fields plus status) through `createWorkOrder` / `updateWorkOrder`. Choosing a customer or technician uses a new `OptionPicker` (a field that opens a list sheet; the current choice carries a tick, not only colour). Dates use the **native** pickers via `@react-native-community/datetimepicker` **9.1.0** (the version SDK 57 expects, bundled in Expo Go; owner-approved): iOS compact date and time controls, Android's standard date dialog followed by the time dialog, with a Clear button. Time is entered in the phone's own zone and stored as UTC. New jobs always start **Open** (the form has no status field and the repository forces `status: 'open'`); when editing, the status list offers only the current status plus the moves allowed by D-017 (so Open cannot jump to Completed). Only active technicians can be chosen, plus the one already on the job even if deactivated (shown as "(inactive)"). With no customers yet the form says "Add a customer first".
- **Safety by design:** `business_id` is sent only on creation, never on update; the database still refuses a customer or technician from another business (composite foreign keys, M1). The validation message for a missing customer is "Choose a customer for this job", distinct from the placeholder.
- **API note:** the library deprecated the catch-all `onChange` in 9.x; the field uses `onValueChange` (and leaves `onDismiss` unhandled, so a cancelled dialog changes nothing). A test pins this.
- **Verified:** 43 new tests (190 total): validation and status rules, repository create/update/get (payloads checked), `OptionPicker`, `DateTimeField` on iOS and Android paths, and the new and edit screens (empty, error and retry, validation, create, edit, allowed statuses, inactive technician). Live on the Android emulator against the hosted database with a throwaway account: the customer and technician sheets list the real records; the real Android date and time dialogs set "Oct 21, 2:00 PM" (cancelling a dialog changed nothing); creating "Replace bathroom tap" for Priya Natarajan with Sam Rivera worked; editing it to In progress and Ivy Chen worked; a database query confirmed customer, technician, `in_progress`, `2026-10-21 09:00 UTC` and an updated timestamp later than the created one; the empty form shows the title and customer errors. iOS: loads the new code, **date picker and keyboard not tapped through by me**.
- **Test-account note:** live create/edit was done on a throwaway account (owner approved), so the owner's own demo data is untouched.

## D-034 — Sections stay anchored to their list; job form choices refresh on focus (M3 bug fix)
- **Date:** 2026-10-25
- **Bug (owner-reported, reproduced):** with no customers, Jobs → Add job → "Add a customer first" → "Add customer" opened the New customer form on the Customers tab **without a back arrow** (that tab's stack held only `new`). After saving, `router.back()` had nothing to pop and fell through to the first tab (Dashboard); the customer was saved, but the user never saw the Customers list, and the job form still showed "Add a customer first" when they returned.
- **Fix 1 (navigation):** `unstable_settings = { anchor: 'index' }` in the Customers, Jobs and Settings stack layouts. Whatever screen is opened first in a section by a cross-tab link, that section's list sits underneath it, so Back and `router.back()` return to the list. iOS analogy: like pushing a detail controller onto a navigation controller that always has its root list controller; it breaks as an analogy because Expo Router builds the stack from the URL, not from code that pushed each controller.
- **Fix 2 (stale choices):** `useWorkOrderFormOptions` refetches customers and technicians every time the screen gains focus (`useFocusEffect`, like `viewWillAppear`). The refresh is silent after the first load (no spinner, no error screen) so a half-typed form is not lost; if a refresh fails the existing lists are kept. Tabs stay mounted in Expo Router, so mounting alone never reloads.
- **Fix 3 (owner re-test on iOS, same day):** the first fix did not hold on the owner's iPhone simulator: the form stayed on screen after saving. Saving a customer no longer relies on `router.back()`; New and Edit customer call `router.dismissTo('/customers')`, which pops to the list if it is underneath and shows it otherwise, so the result no longer depends on how the screen was reached or on stale navigation state. Two tests pin it (`CustomerSaveNavigation.test.tsx`). **Update (M4 device check): `anchor` does NOT take effect for jumps between tabs** (a screen opened from another tab still has no back arrow and no list underneath); `dismissTo` is the fix that works, and the anchor setting is kept only because it is harmless and correct for deep links.
- **Alternatives:** a shared cache or global store (rejected: stack says no state library until needed); passing the new customer back as a route parameter (rejected: only fixes this one path, not technicians added or deactivated elsewhere).
- **Follow-up:** the M4 dashboard counts must refetch on focus for the same reason.
- **Verified:** 7 new tests (197 total); breaking the refetch makes 3 of them fail. **Live re-check on the Android emulator was not completed:** the emulator became overloaded (guest load average above 28, "system isn't responding") before the new empty-business account could be created. Owner to confirm on their device.

## D-035 — Delete jobs and customers (M3 slice 4b)
- **Date:** 2026-10-25
- **What:** The edit screens for a job and a customer end with a red "Delete job" / "Delete customer" button. The first tap only asks (native alert: "Delete this job?", Cancel / Delete, the confirm button marked destructive); deleting is permanent with no undo. On success the app shows the list. A customer who still has jobs cannot be deleted: the database refuses (foreign key, error 23503) and the screen says "This customer still has jobs. Delete those jobs first, then delete the customer." Other failures show a fixed friendly sentence, never raw database text. The new job and new customer forms have no delete button.
- **Technicians are not deletable (unchanged):** they are deactivated so old jobs keep their history; the database has no delete rule for them and none was added.
- **No migration and no security-policy change:** the delete rules and grants for customers and jobs already existed from M1 (owner-scoped through the business). `npm run test:rls` already covers B deleting A's customer or job (no rows affected), A deleting a customer with jobs (refused) and A deleting own records; re-run: 62 of 62.
- **Scope:** this goes beyond the spec's "delete may be deferred" ("Delete may be deferred or restricted if customers have work orders", `docs/PROJECT_SPEC.md` line 47) at the owner's request.
- **Alternatives:** soft delete / archive with undo (more states, more screens; backlog if ever needed); checking "has jobs?" before offering the button (extra request, can go stale; the database rule is the real guard).
- **Verified:** 17 new tests (216 total): repository deletes (one row targeted by id, refusals surface), the shared `DeleteButton` (asks first, cancel does nothing, destructive confirm, in-use message, friendly failures, retry), and both edit screens (delete then return to the list; no button on new forms). **Not yet checked by me on a device:** the emulator became unreliable earlier, so the owner should try it (see report).

## D-036 — Job detail screen, separate from edit (M4 slice 1)
- **Date:** 2026-10-25
- **What:** Tapping a job opens a **Job detail** screen: title and status, customer, technician, date, description, the allowed next moves as buttons ("Start job", "Mark completed", "Cancel job", "Back to open", "Reopen job" from `nextStatuses`, D-017), a Completion notes box with "Save notes", and "Edit job". "Edit job" opens the existing form for the job's own details (title, customer, technician, date, description). Routes: `work-orders/[id]/index` (detail) and `[id]/edit`; saving an edit goes back to the detail, deleting goes to the Jobs list. The detail reloads whenever it regains focus (D-034) and, after the first load, silently (no spinner, a failed refresh keeps what is shown). The status field is no longer needed in the edit form for day-to-day use, but is kept (it only offers allowed moves) so nothing regresses.
- **Why:** spec §6 lists Job detail as its own screen ("update status and notes", later "generate summary"); M5 puts the AI summary here. Status is an action on a job, not a form field.
- **Alternatives:** keep one edit form with status and notes (rejected by the owner: the AI summary would live in a form); a modal sheet for status (more code, no gain).
- **Verified:** 31 new tests (248 total): repository (notes returned, progress update sends only `status` and `completion_notes`, not-found, refusal), notes validation, button labels, and the screen (every state, every allowed move per status, status plus notes in one request, failures show friendly text, typed text survives a refresh and a failed save, refresh on return). Mutation check: sending the stale notes instead of the typed ones fails the matching test. Live on the Android emulator against the hosted database (demo test account): open job -> "Start job" -> In progress (database `in_progress`, `updated_at` moved); typed notes + "Mark completed" -> database `completed` with the exact notes in one write; screen then says "Completed jobs are final" and the list shows Completed.

## D-038 — Completion notes: optional, editable always, saved with a status change (M4 slice 1)
- **Date:** 2026-10-25
- **What:** Notes are optional (owner decision): nothing blocks "Mark completed". Any status change sends the notes currently in the box in the same update, so typed text is never left unsaved or lost; "Save notes" saves them alone. Notes stay editable after completion (fixing a typo is not a status change), while the status itself stays final (D-017). Blank text is stored as `null`; the limit is 4000 characters, matching the database check, with a friendly message if exceeded.
- **Alternatives:** require notes to complete (rejected by the owner: slows closing a job); freeze notes after completion (rejected: no way to fix a typo, and the AI summary in M5 is written from these notes).

## D-037 — Dashboard counts and recent jobs (M4 slice 2)
- **Date:** 2026-10-25
- **What:** The Dashboard shows Open, In progress and Completed as three cards, a quiet line "Cancelled: N · T jobs in total", and the 5 most recently changed jobs (by `updated_at`, any status), each opening its detail; cards and "See all jobs" open the Jobs tab. Counts come from the database as four `count` requests (one per status, `head: true`, so no rows are downloaded), sent together; if any one fails the whole load fails (an error screen with Try again, never a half-right number). The screen reloads every time the tab regains focus, silently after the first load (a failed refresh keeps the last numbers). With zero jobs it shows "No jobs yet" with an "Add job" action. The dashboard reaches the job row through the jobs feature's `index.ts` (feature isolation rule).
- **Why:** spec §6 "matches actual database records"; counting in the database stays correct past the 1,000-row default page that a "fetch all and tally" approach would hit. A recent list ordered by last change doubles as an activity feed ("what did I just touch").
- **Alternatives:** one request that downloads every job's status and counts in the app (breaks past 1,000 jobs); a database view or function for counts (needs a migration and a security review for no benefit at this size).
- **Trade-off:** a job opened from the Dashboard opens on the Jobs tab with the Jobs list underneath (how Expo Router tabs own their stacks), so Back returns to the Jobs list, not the Dashboard.
- **Verified:** 13 new tests (261 total): the four count requests (one per status, no rows, failure fails the whole load, null count is 0), the recent query (ordered by `updated_at` newest first, limited), and the screen (counts, singular/plural, recent rows and navigation, empty, error and retry, silent refresh on return, failed refresh keeps numbers). Live on the Android emulator against the hosted database (demo test account): the cards (1 open, 2 in progress, 3 completed, 1 cancelled, 7 total) equalled a direct database query; after starting a job on the Jobs tab the Dashboard showed 0 / 3 / 3 / 1 with that job on top, matching the database.

## Open issue (update, 2026-10-25) — Expo Router dev warning
Seen a third time (Android, first cold start after signing in as a different account). Component stack still points into Expo Router's own `ContextNavigator` / `ExpoRoot`, nothing breaks, development builds only.
