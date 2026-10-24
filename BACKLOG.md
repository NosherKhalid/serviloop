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
