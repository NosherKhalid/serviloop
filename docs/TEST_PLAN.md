# Test plan and results

Honest record of what is tested, how, and what is not. Updated at the end of each milestone.

## Automated, no backend (`npm test`)
22 tests (Jest + React Native Testing Library): customer form validation, job-status rules, date formatting, the mock customer repository, and the customer form interaction (errors, save, failed-save message). Run with `npm run check` (lint + typecheck + tests).

## Security: tenant isolation (`npm run test:rls`), M1
Runs against the **hosted Supabase project** over the same public HTTP API the app uses, with **only the publishable key**. It signs up three throwaway users, attacks data across accounts, and checks the exact database error. Re-run it after any change to a table, grant or policy, and before every demo.

**Result (2026-10-24): 62 of 62 checks passed.**

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

**How the evidence was strengthened**
- Before pushing, the same rules were checked in an in-memory Postgres (56 + 10 checks). Two deliberate security holes (a policy allowing any insert, a writable `business_id`) were both detected, so the checks can fail.
- Rejection cases must return a specific database error code, so a typo or network error cannot pass as "secure".
- Not done: the same deliberate-hole test against the hosted project (it would change live policies). The in-memory run covers it.

**Known limits**
- Throwaway users (`rls-test-*@example.com`) remain in Authentication after each run; deleting users needs a secret key. Delete them from the dashboard occasionally.
- Job status transitions are enforced by the app, not the database (D-020); tenant isolation is unaffected.
- Sign-up rate limits can stop the script; wait a few minutes and re-run.

## Not yet tested
iOS and Android manual passes for M1+ (no app changes in M1), live auth (M2), repositories against Supabase (M3), the AI function (M5), accessibility at the largest text size, offline behaviour.
