# Serviloop

Field-service management MVP for small service businesses (plumbing, electrical, HVAC, cleaning): customers, technicians, work orders and an AI-written job summary. iOS + Android from one Expo / React Native codebase.
Full spec: `docs/PROJECT_SPEC.md` (not auto-loaded; read the section you need before starting a milestone).
**The goal is a working, demonstrable product, built in a way the owner can follow.** Reports focus on what the product does, not on code walkthroughs.

## Who you work with
- Owner: Nosher Khalid, senior iOS engineer (Swift, SwiftUI, MVVM-C), new to JavaScript, TypeScript and React Native. Go step by step; say what and why before running unfamiliar commands.
- Reports describe what the product does now and how to try it; no quizzes. iOS analogies only when asked (skill `rn-for-ios-devs`). Format: `.claude/rules/teaching.md`.

## Working rules
1. Work milestone by milestone (spec §8, M0–M6). Start with `/start-milestone`, end with `/finish-milestone`: run `npm run check`, update `docs/PROGRESS.md`, then STOP for owner review. Never begin the next milestone unprompted.
2. One narrow vertical slice at a time. Before a nontrivial change: goal in 2–4 sentences, files involved, the smallest change.
3. Scope discipline (spec §2): anything outside P0 goes to `BACKLOG.md`, not into code. Ask before building P1.
4. Log every non-obvious technical choice in `docs/DECISIONS.md` (what, why, alternatives).
5. Ask before adding any dependency not in the stack below (`/add-dependency`). Install with `npx expo install`; never guess versions.
6. Ask before changing RLS/security policies, destructive DB commands, or costly services.
7. Never commit secrets. `.env*` is gitignored except `.env.example`. The AI provider key exists only as a Supabase Edge Function secret.
8. Conventional Commits, small commits, feature branches. Commit/push only when the owner asks.
9. Tests ship with the feature (spec §11). Never say a check passed unless you ran it this session.
10. If the spec is ambiguous, stop and ask. Keep this file under ~80 lines; detail goes to `.claude/rules/` or a skill.

## Stack (fixed — ask before deviating)
Expo (current SDK, installed via `npx expo install`) · React Native · TypeScript strict · Expo Router · `@supabase/supabase-js` (Auth, Postgres + RLS, one Edge Function) · Zod · `@react-native-community/datetimepicker` (native date/time, D-033) · core `StyleSheet` + small theme file · Jest + React Native Testing Library · npm.
Deliberately absent: Redux/Zustand/TanStack Query, ORMs, UI kits, analytics. Add only with demonstrated need.

## Architecture
Screen → feature hook → repository → Supabase client → Postgres/RLS. Detail: `.claude/rules/architecture.md`.
- `src/app/` thin Expo Router routes · `src/features/<name>/` · `src/repositories/` · `src/providers/` · `src/lib/supabase.ts` · `src/components/` · `src/theme/` · `src/types/`
- `supabase/{migrations,functions,seed.sql}` · `docs/` · `__tests__/`

## Commands
Keep in sync with `package.json`:
- `npm start` — Metro on IPv4 loopback (D-011); press `i` for iOS simulator, `a` for Android emulator
- `npm run lint` · `npm run typecheck` · `npm test` (Jest + RNTL, tests in `__tests__/`)
- `npm run check` — lint + typecheck + tests; must pass before every commit that ends a task
- `npm run test:rls` — two-account security check against the hosted Supabase project (needs `.env`; re-run after any table/policy change)
- `npm run db:types` — regenerate `src/types/database.ts` from the hosted schema; `npx supabase db push --linked` applies migrations (owner runs it: needs the DB password)

## Environment gotchas
- Start on **Expo Go**, but stay scalable: use only Expo Go-compatible packages and do not hand-edit `ios/`/`android/`. Moving to a development build (`expo-dev-client`) later must be a config step, not a rewrite (see `docs/DECISIONS.md`).
- Xcode 27 has no `Simulator.app`: open DeviceHub (D-012). After restarting Metro, Android Expo Go needs `adb shell am force-stop host.exp.exponent` before `a` (see memory/docs).
- Native arm64 toolchain only. If `arch` prints `i386` you are under Rosetta: stop and tell the owner.
- Only `EXPO_PUBLIC_SUPABASE_URL` and the publishable key go in the app; `EXPO_PUBLIC_*` is public in the bundle.
- Expo APIs change between SDKs. Check docs for the installed SDK (`https://docs.expo.dev/llms.txt` or the Expo MCP), not training data.
