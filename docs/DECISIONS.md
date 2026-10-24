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

## D-005 — Mock data behind repository-shaped functions (planned, slice 5)
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
