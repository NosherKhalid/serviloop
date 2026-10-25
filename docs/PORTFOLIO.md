# Portfolio and market notes

Working notes for presenting Serviloop to prospective clients and employers. Final public copy goes in the README (M6). Claims must stay honest: no implied customers, revenue or production use (spec header).

## The pitch (one paragraph)
Serviloop helps a small field-service business (plumbing, electrical, HVAC, cleaning) run its day: keep customers, create and assign jobs, track status, and turn a technician's rough notes into a clear, customer-friendly job summary with AI. One owner signs in on iOS or Android; their data is private to their business.

## Who it is for, and how it behaves in the market
- **Buyer:** the owner-operator of a 1–10 person service business who currently uses paper, WhatsApp and spreadsheets.
- **Everyday value:** see today's open / in-progress / completed jobs at a glance; find a customer and their history fast; send the customer a professional write-up without typing it from scratch.
- **Where it stops (v0.1, by design):** one owner login, no technician or customer accounts, no payments, invoices, scheduling calendar, push notifications or offline mode. Those are the natural paid-product roadmap (see `BACKLOG.md`) and are the conversation to have with a real client.

## Demo story (about 2 minutes, both platforms)
1. Create an account (or sign in to the permanent demo account), tap "Start with demo data": a populated fictional business in one tap.
2. Dashboard: open / in-progress / completed counts and the latest jobs. *(built in M4)*
3. Add a customer, then create a job for them, assign a technician and pick a date and time. *(built in M3)* Optional: delete a test job.
4. Open the job, tap Start job, add completion notes, tap Mark completed; the Dashboard counts change. *(built in M4)*
5. Tap **Generate summary**: the AI drafts a customer-facing write-up, the owner edits and saves it. *(M5)*
6. Sign out and back in: everything persisted.
7. (Talking point, not on screen) Another business cannot see this data, and the AI key never reaches the app.

## What makes it credible to clients (evidence to collect)
- [ ] Short screen recording on iOS **and** Android with the story above.
- [ ] Sanitised screenshots (fictional data only): list, form, job detail, AI summary.
- [ ] Architecture diagram: app → Supabase (Auth, Postgres + RLS) → Edge Function → AI provider.
- [x] Security notes: tenant isolation tested with real accounts against the hosted project, 62 of 62 checks (results in `docs/TEST_PLAN.md`; re-run with `npm run test:rls` before a demo). Secrets kept server-side.
- [ ] AI notes: what the model may and may not say, input limits, per-user rate limit, graceful fallback, spend cap.
- [ ] Test and tooling evidence: `npm run check` output (261 tests in 35 suites after M4), the 62-check tenant-isolation run.
- [ ] README with problem, target user, scope, stack, setup, limitations and an honest AI-assistance disclosure.

## Talking points for AI-integration work
- AI is called only from a server function after verifying the caller owns the job; the app never holds the provider key.
- The model is told to use only what the notes say (no invented parts, prices or warranties), and a human edits before saving.
- Cost and abuse controls (limits, rate limiting, spend cap) are part of the design, not an afterthought.

## Demo hygiene
- Free Supabase projects **pause after about a week of inactivity**. Open the project in the dashboard (or run `npm run test:rls`) a day before any recording or client demo so it is awake.
- Have a clean demo account: sign up, tap "Start with demo data" once. Demo data cannot be loaded twice; a reset action is in `BACKLOG.md`.

## Later (outside the 30-day sprint)
Ideas that would turn the portfolio piece into a sellable product (technician logins, customer booking, invoices, calendar, photo attachments, web admin) belong in `BACKLOG.md` until the MVP is finished.
