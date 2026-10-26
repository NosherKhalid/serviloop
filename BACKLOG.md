# Backlog

Ideas outside the P0 scope. Do not build during the 30-day sprint (see `docs/PROJECT_SPEC.md` §2).

## Deferred questions
- Final commercial name, target country, service vertical
- Pricing, business registration, multi-owner organisations
- Technician accounts; customer booking app
- AI provider choice and spend limits
- Public app store release
- Move from Expo Go to a development build (see `docs/DECISIONS.md` D-001)

## Ideas
-
- Database trigger for job status transitions (today only the app enforces them; tenant isolation is unaffected)
- "Reset demo data" action (delete all rows in the business, then reload) for repeatable portfolio demos
- Turn on Supabase Auth "leaked password protection" (HaveIBeenPwned check) if the plan allows, and turn email confirmation back on, before any real launch
- Performance hygiene if data grows: covering indexes for the two composite foreign keys on work_orders (D-024)
- Forgot / reset password flow
- Resend confirmation email and an in-app 'confirm your email' screen (needed once email confirmation is turned back on)
- Delete account (removes the business and all its data)
- Biometric unlock (Face ID / fingerprint) for returning owners
- Rename business (Settings)
- Reset / delete demo data from Settings for repeatable demos
- Localisation: Urdu and other right-to-left languages (mirrored layout, translated text, RTL-aware alignment); today the app is English-only and pins text to left-to-right (D-029)
- Search and filter customers and jobs (spec P1); sort or filter jobs by technician or date
- Undo for delete (soft delete / archive instead of permanent removal), and a way to remove a technician for good (needs a database rule; today: deactivate only)
- A "this customer's jobs" list on the customer screen, so a customer who cannot be deleted can be cleared in one place
- Open job detail from the list, with completion notes and the AI summary (M4 / M5)
- Back arrow on screens opened from another tab (Dashboard -> Add job, Jobs -> Add customer): `anchor: 'index'` does not apply across tabs (D-034 update); options are pushing the list first (`navigate` then `push`) or a custom header back button
- After opening a job from the Dashboard, Back returns to the Jobs list, not the Dashboard (tab stack behaviour, D-037)
- Go live with the AI summary: create the provider account, set a spend limit, set `ANTHROPIC_API_KEY`, redeploy, run `npm run test:summary` (D-041); then confirm `thinking: {type: "disabled"}` is accepted by Haiku 5.5 and review real-note quality
- Summary extras: tone or language options (including translating the summary for the customer), summary history, a per-business usage view
- Upgrade ESLint (9.39.5 is reported as no longer supported by `npm ci`); needs the `/add-dependency` gate
- Pin GitHub Actions to commit hashes (supply-chain hygiene) if the repository ever takes outside contributions
