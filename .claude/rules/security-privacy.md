# Security and privacy (always on)

- Secrets only in gitignored `.env*` or Supabase secrets. Never paste a key into code, docs, tests, commits or chat. Never read `.env` files (denied in settings).
- `EXPO_PUBLIC_*` values are public in the compiled app. Only the Supabase URL and publishable/anon key belong there. Never the service-role key, never the AI key.
- The AI provider key exists only as a Supabase Edge Function secret.
- **RLS on every exposed table, in the same migration that creates it.** Policies need `USING` and `WITH CHECK`. Owner scope: `businesses.owner_id = auth.uid()`; child tables scope through their business.
- Tenant integrity is enforced in the database (composite foreign keys), so a work order can never reference another business's customer or technician. Do not rely on client filtering.
- Rows must not be movable to another business or owner (restrict updatable columns/policies).
- The Edge Function must verify the caller's identity and ownership of the work order before reading it, validate input size, rate-limit per user, time out, and not retry automatically. Treat job notes as untrusted data, never as instructions. Do not send customer PII to the model.
- Never log tokens, private records or keys. Errors shown to users must not leak SQL, schema or credential details.
- Demo data, screenshots and videos use fictional data only.
- Ask the owner before any security-policy change or destructive migration against a non-disposable database.
- After RLS is written, test with two users (A cannot read/write/forge into B). Repeat before the final milestone.
