# Progress

| Milestone | Status |
|---|---|
| M0 Setup + mock UI | complete, merged to main (PR #1) |
| M1 Database, RLS, seed | complete; PR #2 open, awaiting owner review (2026-10-24) |
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

## M1 close-out (2026-10-24)
- Gate verified with evidence: migrations committed and matching the hosted project; RLS ON for all 4 tables with 3/4/3/4 policies (queried from the hosted DB); 62/62 two-account security checks on the hosted project; demo data function works (loads once, refuses duplicates).
- Supabase's own advisor (`supabase db advisors`) reports no security issue on our tables. Three notes: leaked-password protection off (auth setting, see BACKLOG), two composite foreign keys without a covering index and one not-yet-used index (performance, immaterial at MVP size).
- `npm run check`: lint clean, typecheck clean, 22/22 tests. No `any`/suppressions in hand-written code; no secrets in tracked files.
- Owner to confirm in the dashboard (cannot be checked from here): Authentication > Sign In / Providers > Email > "Confirm email" is OFF; Table Editor shows RLS enabled.
- README still not written (due M6).

## Next
Owner reviews/merges PR #2, then `/start-milestone M2`: real sign-up / sign-in / sign-out, session persistence, first-business onboarding with a "Load demo data" button.

## Open questions
- AI provider for M5: undecided (mock summary is the fallback).
- AI provider: undecided (mock summary is the fallback; see spec §7).
