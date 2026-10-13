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
