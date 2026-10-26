# Test plan and results

Honest record of what is tested, how, and what is not. Updated at the end of each milestone.

## Automated, no backend (`npm test`)
261 tests in 35 suites (Jest + React Native Testing Library; counted by `npm run check` on 2026-10-25). M4 added 45: job detail (every status's allowed moves, notes saved with a status change, failures, too-long notes, refresh on return), completion-notes validation and button labels, the progress, recent-jobs and count repository queries, and the Dashboard (counts, singular/plural, recent rows, empty, error and retry, silent refresh, failed refresh keeps numbers); mutation-checked (saving stale notes with a status change fails a test). M3 added 120 (of the first 216): customer, technician and job repositories (recording mock client; the exact query, the column mapping, errors surface, deletes target one id), job and technician validation, status rules, sorting and time-zone formatting, `OptionPicker`, `DateTimeField` (iOS and Android paths), the customer, technician and job screens (loading, empty, error and retry, validation, create, edit, delete), the section layouts, and the job form's refresh when the owner returns to it. Mutation-checked: breaking that refresh made 3 tests fail. M0 (first 96 tests): customer form validation, job-status rules, date formatting, mock customer repository, customer form. M2: settings check, encrypted session storage (round trip, over 2 KB, lost key, failing keychain), auth validation and friendly errors, sign-in/sign-up screens, `AuthProvider` (restore, sign-out, listening), `BusinessProvider` (loading, error and retry, account switching never leaks, create, demo data), business repository (mocked client), onboarding screen. Mutation-checked: weakening the account-switch rule and the secret-key check each made the right test fail. Run with `npm run check` (lint + typecheck + tests).

## Security: tenant isolation (`npm run test:rls`), M1
Runs against the **hosted Supabase project** over the same public HTTP API the app uses, with **only the publishable key**. It signs up three throwaway users, attacks data across accounts, and checks the exact database error. Re-run it after any change to a table, grant or policy, and before every demo.

**Result (2026-10-24, and again 2026-10-25 after M3 and M4 added screens; no schema change): 62 of 62 checks passed.**

| Area | What must happen | Result |
|---|---|---|
| Reading | B cannot see A's business, customers, technicians or jobs: not in lists, not by id, not by filtering on A's `business_id` | Pass (0 rows each) |
| Changing / deleting | B cannot rename A's business, edit A's customer, deactivate A's technician, cancel A's job, or delete A's customer or job; A's data is unchanged afterwards | Pass (0 rows matched; verified unchanged) |
| Writing into A's business | B cannot add a customer, technician or job to A's business | Pass (HTTP 403, `42501`) |
| Forged references | A job cannot use another business's customer or technician id, on insert or update | Pass (HTTP 409, `23503`) |
| Locked columns | Nobody can choose or change `owner_id`; rows cannot be moved to another business (`business_id`); `updated_at` cannot be set by hand; a second business per owner is refused; businesses and technicians cannot be deleted via the API | Pass (`42501` / `23505`) |
| Signed-out visitors | Cannot read or write any table, cannot call `load_demo_data()`; a made-up login token is refused; the internal `set_updated_at()` helper is not callable | Pass (HTTP 401/404) |
| Data rules | Invalid status, one-letter title and blank customer name are refused for signed-in users | Pass (`23514`) |
| Normal use | An owner can edit their customer, rename their business, change job status and notes, save an AI summary, deactivate a technician, and delete their own job and customer; `updated_at` advances automatically | Pass |
| Demo data | A new user gets 6 customers, 3 technicians, 6 jobs (2 open, 1 in progress, 2 completed, 1 cancelled); a second load is refused with no duplicates; other users see none of it; a business that already has data is refused | Pass |

**Independent check:** Supabase's built-in advisor (`npx supabase db advisors --linked`) found no security issues on our tables, and a direct query of the hosted database confirmed RLS is ON for all four tables with 3 / 4 / 3 / 4 policies. Its only notes: leaked-password protection is disabled (an Auth setting, see `BACKLOG.md`), and two performance hints (composite foreign keys without a covering index, an index not yet used) that do not matter at MVP size.

**How the evidence was strengthened**
- Before pushing, the same rules were checked in an in-memory Postgres (56 + 10 checks). Two deliberate security holes (a policy allowing any insert, a writable `business_id`) were both detected, so the checks can fail.
- Rejection cases must return a specific database error code, so a typo or network error cannot pass as "secure".
- Not done: the same deliberate-hole test against the hosted project (it would change live policies). The in-memory run covers it.

**Known limits**
- Throwaway users (`rls-test-*@example.com`) remain in Authentication after each run; deleting users needs a secret key. Delete them from the dashboard occasionally.
- Job status transitions are enforced by the app, not the database (D-020); tenant isolation is unaffected.
- Sign-up rate limits can stop the script; wait a few minutes and re-run.

## Manual device checks: accounts and onboarding (M2), Android emulator (Pixel 7 Pro, Expo Go) against the hosted project, 2026-10-24
| Check | Result |
|---|---|
| Short password blocked before any request; Go key on the keyboard submits | Pass |
| Create a real account; lands in the app; Settings shows the email | Pass |
| Fully close and reopen: still signed in, straight to the app, splash holds meanwhile | Pass |
| Sign out returns to Sign in; wrong password shows "Email or password is incorrect." | Pass |
| Sign in again with the right password | Pass |
| Network OFF: sign-out works; sign-in shows "We can't reach the server..."; recovers when network returns | Pass |
| Signed-in owner with no business lands on onboarding; one-letter name rejected | Pass |
| Create "Riverside Plumbing Co": lands in the app, Settings shows it, reopening skips onboarding | Pass |
| Second new account: "Start with demo data" shows "Loaded 6 customers, 3 technicians and 6 jobs." then Continue; Settings shows Demo Plumbing Co. | Pass |
| Switch from the demo account to the first account: only the first account's business appears | Pass |
| Hosted database matches: each test owner has exactly one business; demo owner has 6 / 3 / 6 rows | Pass |
| Open the app offline while signed in: "Can't load your business" with Try again; one tap recovers online | Pass |

Not verified here: the same flows on the iOS simulator (only the Sign in screen boot was confirmed; owner to walk the flow), light mode on the new screens, large text sizes, Android back from onboarding. A development-only React warning appears on the first restart after creating a brand-new account (2 of 2); its stack points into Expo Router, nothing breaks (see DECISIONS, open issue).

### M2 close-out pass (fresh run, same device, 2026-10-24)
Create account "m2-final-…" -> onboarding -> "Gate Check Plumbing" -> full app restart (straight back in, business shown) -> sign out -> sign in again with the same account: all pass. A first attempt at the last step showed "Email or password is incorrect" only because an overlapping test script typed the password twice (about 29 characters); the clean retry signed in.

## Manual device checks: customers, technicians and jobs (M3), Android emulator (Pixel 7 Pro, Expo Go) against the hosted project, 2026-10-25
Run with throwaway accounts (the owner's own demo data was only read, never changed).

| Check | Result |
|---|---|
| Customers tab shows the demo account's 6 customers, alphabetical | Pass |
| Add "Zephyr Air Cafe", rename to "Zephyr Air Bistro" with a new address; full app restart keeps both; a database query matches | Pass |
| A second, new business sees "No customers yet" | Pass |
| Settings -> Manage technicians lists the 3 real technicians; edit form is pre-filled with Deactivate | Pass (read only) |
| Jobs tab shows all 6 demo jobs with the right customer, technician, status and date; unfinished jobs first | Pass |
| The 09:00 UTC demo job shows as 2:00 PM on a UTC+5 phone (time-zone conversion) | Pass |
| Job form lists the real customers and technicians; the real Android date dialog then time dialog set "Oct 21, 2:00 PM"; cancelling a dialog changes nothing | Pass |
| Create "Replace bathroom tap" (customer + technician + date); edit to In progress with another technician; restart; a database query matches (customer, technician, `in_progress`, 09:00 UTC, newer `updated_at`) | Pass |
| Empty job form shows the title and customer errors | Pass |
| New business, Jobs -> Add job shows "Add a customer first" -> Add customer: reproduced a **bug** (no back arrow; saving fell through to Dashboard; job form kept saying "Add a customer first"). Fixed in D-034 | Bug found and fixed |

**Not verified live (owner to try, or still open):**
- The fix for the empty-business flow above (the emulator became overloaded before the re-check; covered by unit tests only).
- Deleting a job or a customer, the in-use refusal and the confirmation alert (unit tests, plus the database rules via `npm run test:rls`).
- Technician add, edit, deactivate and reactivate against the database (unit tests only).
- Everything on **iOS**: the date and time controls, the keyboard with the job form, the alert. The owner's own run on the iPhone simulator found the customer-form navigation bug; the fix has not been confirmed there yet.
- Offline behaviour on the M3 screens, light mode, largest text size, Android hardware back on the new screens.

## Manual device checks: dashboard, job detail and the whole journey (M4), Android emulator (Pixel 7 Pro, Expo Go) against the hosted project, 2026-10-25
Run with throwaway accounts (the owner's own data was never touched). Database values were read back with read-only queries.

| Check | Result |
|---|---|
| Job detail shows customer, technician (or "Unassigned"), date, description and only the allowed moves for the job's status | Pass |
| Open job -> "Start job": screen shows In progress with the next moves; database `in_progress`, `updated_at` moved | Pass |
| Typed notes + "Mark completed": database `completed` with the exact notes in one write; screen says "Completed jobs are final"; "Save notes" disabled when nothing changed; list shows Completed after going back | Pass |
| Dashboard on a business with demo data: cards 1 / 2 / 3, "Cancelled: 1 · 7 jobs in total" equal a direct database count; newest-changed job on top | Pass |
| Start a job on the Jobs tab, return to the Dashboard: counts 0 / 3 / 3 and that job on top, equal to the database | Pass |
| **Whole journey on a brand-new account:** sign up -> onboarding "Journey Test Co" -> empty Dashboard ("No jobs yet", Add job) -> "Add a customer first" -> Add customer -> save lands on the Customers list with the customer -> Jobs shows the full job form with that customer in the picker -> save job lands on the Dashboard (1 open, 1 job) -> open job -> Start job -> notes -> Mark completed (database `completed` with the notes) | Pass |
| Sign out, sign back in: Dashboard shows 0 / 0 / 1 and the completed job; everything persisted | Pass |
| Customer-form fix from M3 (D-034): saving a customer opened from another tab returns to the Customers list; the job form offers the new customer | Pass (this was unverified on a device before) |

**Findings on the device**
- Opening a screen from another tab (Dashboard -> Add job, Jobs -> Add customer) leaves a screen with **no back arrow**: the `anchor: 'index'` setting from D-034 does **not** take effect for jumps between tabs. Saving still lands in the right place because of `dismissTo` (customers) and because the job form was opened from the Dashboard, but the header has no back arrow on those cross-tab screens (Android hardware back still works). Logged in `BACKLOG.md`.
- After saving a job opened from the Dashboard's empty state, the app returns to the Dashboard, not the Jobs list.

**Not verified here (owner to check):** everything on **iOS** (detail screen, notes with the keyboard, dashboard, the cross-tab back-arrow finding), light mode and the largest text size on the new screens, offline behaviour on Dashboard and Job detail, Edit -> Save -> back to detail on a device, deleting from the edit screen, technician add/edit/deactivate (still unit-tested only), the Android hardware back button on every new screen.

## AI summary (M5), hosted project and Android emulator, 2026-10-26
**State: mock mode (no AI key configured).** Everything except the live model call was exercised.

`npm run test:rls` against the hosted project: **71 of 71** (62 earlier + 9 for M5).

| Check (`npm run test:rls`, section 10) | Result |
|---|---|
| A cannot read, add, edit or delete rows in `ai_summary_usage` directly; a signed-out visitor cannot read it or call `claim_ai_summary_slot()` | Pass (`42501`) |
| A gets exactly 10 slots in the hour, the 11th is refused; the first claim reports 9 left this hour and 29 today | Pass |
| B still has a full allowance after A used all of hers | Pass |

`npm run test:summary` against the deployed function: **22 of 22**.

| Check | Result |
|---|---|
| No login token, a made-up token, the publishable key used as a token, no api key: all refused; GET refused | Pass (401 / 405) |
| An id that is not a UUID, an extra field, not JSON, an empty body, an oversized body, an injection attempt in the id | Pass (400 `bad_request`) |
| B asks for A's job vs. a job id that does not exist | Pass (404 both, **identical bodies**: no way to probe which ids exist) |
| A's job with no completion notes | Pass (422 `empty_notes`, uses no allowance) |
| A's own job: 200 with a summary and `source: "mock"`; reply has only `summary` and `source`; no customer name, phone or address in the text | Pass |
| Exactly 10 summaries allowed in an hour, the 11th is 429 `rate_limited`; B unaffected | Pass |

Android emulator, deployed function, hosted database, throwaway account:

| Check | Result |
|---|---|
| Customer summary section appears under the notes; Generate is on for a job with saved notes | Pass |
| Generate returns a draft in an editable box with the visible "Demo summary" badge; nothing is saved by it | Pass |
| Save writes the exact text to `work_orders.ai_summary` (database read-back); badge disappears and Save turns off | Pass |
| Share opens the Android share sheet with the summary text | Pass |

Unit tests added in M5: 39 for the function's pure logic (request checks, prompt rules, forged-tag removal, mock text, output cleanup, fail-closed limiter reply) and 42 for the app (summary repository error mapping, saved-summary repository, the section's states); mutation-checked (generating while notes are unsaved fails a test).

**Not verified (limits to state honestly):**
- **The live model path has never run.** No provider key exists, so the Claude call, the prompt's effect on real notes, the prompt-injection and no-invented-facts behaviour of the real model, and the bad-key and timeout fallbacks are untested. `npm run test:summary` includes the spot checks and will run them once a key is set (D-041). One known risk: whether Haiku 5.5 accepts `thinking: {type: "disabled"}`.
- iOS: the summary section, the keyboard in the summary box, and the share sheet.
- Light mode, largest text size and offline behaviour on the new section; the Android hardware back button.
- The 10-per-hour limit is shared across all summaries a user makes in any business (one account owns one business today).

## Quality pass (M6 slice 1), Android emulator (Pixel 7 Pro, Expo Go), 2026-10-26
Run read-only on an existing account (nothing was created or changed); system settings were restored afterwards.

| Check | Result |
|---|---|
| A screen opened from another tab shows "‹ Jobs"; tapping it lands on the Jobs list (before: no back arrow) | Pass (fixed, D-042) |
| Light mode: Dashboard and Job detail readable, good contrast | Pass |
| Text size 150%: Job detail wraps and scrolls | Pass |
| Text size 150%: Dashboard count label "Completed" broke mid-word | Found and fixed (test-verified; not re-checked on the device) |
| Text size 150%: bottom tab names truncated ("Dashb…") | Found and fixed (test-verified; not re-checked on the device) |
| Accessibility scan: every interactive element has a role and a label; four gaps (validation errors not announced, five screen titles not headings) | Found and fixed with tests |
| `npx expo-doctor` | 21 of 21 |

Not verified in this pass: the offline pass on Dashboard and Job detail on a device; the same checks on iOS (VoiceOver, Dynamic Type, light mode); TalkBack on Android.

## Not yet tested
iOS manual pass for M2, M3, M4 and M5, the live AI model (M5), accessibility at the largest text size, offline behaviour on data screens.
