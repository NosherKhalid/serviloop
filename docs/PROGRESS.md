# Progress

| Milestone | Status |
|---|---|
| M0 Setup + mock UI | complete, merged to main (PR #1) |
| M1 Database, RLS, seed | built and verified; awaiting owner review (2026-10-24) |
| M2 Auth + onboarding | not started |
| M3 CRUD via repositories | not started |
| M4 Dashboard + status | not started |
| M5 AI summary | not started |
| M6 Tests, polish, docs | not started |

## Log
- 2026-10-13: Project restructured (spec moved to `docs/PROJECT_SPEC.md`, new `CLAUDE.md`, `.claude/` rules/skills/settings, git initialised). No app code yet.

## M0 close-out (2026-10-24)
- `npm run check`: lint clean, `tsc` clean, 22/22 tests.
- Gate: app runs on Android emulator (all flows) and iOS simulator (boots to Sign in; customer/job flows not re-checked since slice 4); route groups `(auth)`/`(app)` with nested stacks; mock customer and job lists; one mock CRUD flow (add + edit customer).
- Not verified: iOS customer/job flows and keyboard behaviour on iOS, Android keyboard overlap and Android back from the form, a failed save in the running app, Dynamic Type at the largest size.
- README, `docs/ARCHITECTURE.md` and `docs/TEST_PLAN.md` do not exist yet; they are due in M6.

## Next
Owner reviews M1 (run `/finish-milestone M1`), then M2: sign-up, sign-in, session persistence and onboarding wired to Supabase.

## Open questions
- Supabase project: not created yet (needed for M1). Local (Docker) or hosted project? Owner decides at the start of M1.
- AI provider: undecided (mock summary is the fallback; see spec §7).
