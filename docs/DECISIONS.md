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
