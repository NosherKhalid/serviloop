# Architecture

Status: data model and security are built (M1). The app still reads mock data until M3.

## Data flow
```
Screen -> feature hook -> repository -> Supabase client -> Postgres (RLS) -> response -> screen
                                                      \-> Edge Function (M5) -> AI provider
```
- The app holds only the **publishable key**. Every request carries the signed-in user's login token, and the database decides what that user may see or change.
- Secret keys and the AI provider key never enter the app (AI key lives only as an Edge Function secret).

## Data model (hosted Supabase Postgres)
```
auth.users (Supabase Auth)
   1
   |  owner_id (unique: one business per owner in v0.1)
   v
businesses -----< customers      (business_id)
     |------< technicians        (business_id)
     \------< work_orders        (business_id, customer_id, technician_id?)
                 FK (customer_id,   business_id) -> customers   (id, business_id)
                 FK (technician_id, business_id) -> technicians (id, business_id)
```
- Composite foreign keys mean a job can only reference a customer or technician of the **same business**, even with a forged id.
- `work_orders.status` is one of `open`, `in_progress`, `completed`, `cancelled`.
- Customers/technicians that still have jobs cannot be deleted; technicians are deactivated (`active`).
- Migrations: `supabase/migrations/20261024103554_core_schema.sql` (tables, rules, RLS) and `20261024105337_demo_data.sql` (`load_demo_data()`).
- TypeScript types are generated from the live schema into `src/types/database.ts` (`npm run db:types`).

## Security model (row-level security)
- RLS is on for all four tables, and every default privilege is revoked, then re-granted narrowly to signed-in users.
- A row is visible and changeable only if its `business_id` belongs to a business whose `owner_id` is the signed-in user.
- Column-level grants make `id`, `owner_id`, `business_id`, `created_at` and `updated_at` unwritable after creation, so rows cannot be moved or re-owned.
- Signed-out visitors have no access to any table or to `load_demo_data()`.
- Evidence: see `docs/TEST_PLAN.md` (62 checks against the hosted project).

## Demo data
`public.load_demo_data()` runs with the caller's permissions (security invoker), creates their business if missing, and inserts fictional data only into an empty business. See D-021.

## Not built yet
Auth screens wired to Supabase (M2), customer/technician/job screens on real data (M3), dashboard counts (M4), the `generate-job-summary` Edge Function with per-user limits (M5).
