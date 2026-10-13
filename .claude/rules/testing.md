---
paths:
  - "**/__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing

- Jest + React Native Testing Library (use the Expo-compatible preset via `npx expo install`). Tests live in `__tests__/` and are named `*.test.ts(x)`.
- Few but meaningful. Must cover: work-order validation and status transitions; repository error handling (mock the Supabase client); one real screen or form interaction.
- RLS is verified with a scripted two-user check against the dev database, documented in `docs/TEST_PLAN.md` (manual-scripted is acceptable in v0.1).
- Test what the user sees: query by role, label or text, not by implementation details.
- Mock only boundaries (the Supabase client, native Expo modules). Do not mock your own validation or logic.
- Deterministic: no real network, no real time, no unseeded randomness.
- Every bug fix starts with a failing regression test.
- Never weaken, skip or delete a test to make `npm run check` pass. If the test is wrong, fix it and say why.
- UI changes: after checks pass, run the app (simulator/emulator) and look at it before calling the work done.
- Document untested limitations explicitly in `docs/TEST_PLAN.md`.
