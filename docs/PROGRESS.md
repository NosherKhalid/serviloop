# Progress

| Milestone | Status |
|---|---|
| M0 Setup + mock UI | complete, merged to main (PR #1) |
| M1 Database, RLS, seed | complete, merged to main (PRs #2, #3) |
| M2 Auth + onboarding | complete, merged to main (PR #4) |
| M3 CRUD via repositories | complete, merged to main (PR #5, close-out PR #6); iOS flows still to be confirmed by the owner |
| M4 Dashboard + status | complete, PR #7 open for review; iOS flows still to be confirmed by the owner |
| M5 AI summary | in progress (slices 1-2 built: secure function verified on the hosted project (71/71 security, 22/22 function checks) and the summary in the app (generate, edit, save, share) verified on Android with the mock; next slice 3: go live with Claude, then close-out) |
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

## M2 close-out (2026-10-24)
- Gate verified with fresh evidence on the Android emulator against the hosted project: sign-up, sign-in, session restore after a full restart, sign-out, first-business creation with no SQL (also the demo-data path, account switching and offline start, earlier the same day).
- `npm run check`: lint clean, typecheck clean, 96/96 tests (15 suites). No `any`/suppressions, no `console` calls, no token handling outside the Supabase client, no secrets or `.env` ever committed. Database unchanged since M1 (migrations identical), so the M1 62-check security result still applies; Supabase's own security advisor shows only the known leaked-password-protection note.
- Open: one dev-only React warning on the first restart after sign-up (inside Expo Router's own code); iOS flows not walked by me (cannot tap the simulator); light mode, large text and Android back on the new screens untested.

## M3 close-out (2026-10-25)
- `npm run check`: lint clean, typecheck clean, 216/216 tests (33 suites). No `any`/suppressions, no `console` calls, no secrets or `.env` tracked (the only scan hit is the warning comment in `.env.example`).
- Gate ("customers, technicians, work orders create/read/update through repositories on both platforms"): **Android verified live** against the hosted project (customers, jobs, assignment, restart persistence, database matches); **iOS not verified by me** (cannot tap the simulator). Technician add/edit/deactivate and job/customer delete are covered by unit tests and the security script, not yet walked on a device.
- Security: no migration or policy change since M1; `npm run test:rls` re-run 2026-10-25: 62/62 (includes B cannot delete A's customer or job, customers with jobs refused, A deletes own).
- Bugs found by owner testing and fixed: customer form left on screen after saving (D-034; the first fix was reported done before a live check, the real fix is an explicit `dismissTo` after save).
- Decisions D-030 to D-035; new dependency `@react-native-community/datetimepicker` 9.1.0 (owner-approved).
- No CI exists in the repository (rule says CI must be green before merge); owner chose to postpone it.
- Open: iOS walk-through of date and time controls, keyboard with the job form, delete alert, customer navigation; the dev-only Expo Router warning; offline, light mode and large text on the M3 screens.

## M4 close-out (2026-10-25)
- `npm run check`: lint clean, typecheck clean, 261/261 tests (35 suites). No `any`/suppressions, no `console`, no non-null assertions, no secrets or `.env` tracked. No schema or policy change (`supabase/` untouched since M3), so the 62/62 two-account result from 2026-10-25 still applies (re-run the same day, after the M4 screens were built).
- Gate: **dashboard counts match the database** (Android, compared with direct database counts: 1/2/3/1, then 0/3/3/1 after a status change); **status changes and notes persist** (database read-back: `completed` with the exact notes in one write; after sign-out and sign-in the Dashboard showed 0/0/1); **loading, empty and error states present** (dashboard: spinner, "No jobs yet", retryable error; job detail: spinner, not found, retryable error; all unit-tested and the empty dashboard seen on the device); **main journey with no fake data** (sign-up to completed job on a brand-new account, Android; no mock data left in the app).
- Decisions D-036 (job detail), D-037 (dashboard counts), D-038 (completion notes); D-034 corrected (stack anchor does not apply across tabs).
- Open: iOS flows not walked (detail, notes with keyboard, dashboard); light mode, largest text and offline behaviour on the new screens; no back arrow on screens opened from another tab (BACKLOG); Back from a job opened on the Dashboard returns to the Jobs list.
- No CI in the repository (owner postponed it).

## Next
Owner tries the M4 flows on iOS, merges PR #7, then `/start-milestone M5`: the AI job summary (Edge Function that verifies the caller and the job's owner, editable and saved summary).

## Open questions
- AI provider for M5: undecided. Live model, or a clearly labelled mock summary as the fallback (spec §7). The owner decides at `/start-milestone M5`.
