---
name: finish-milestone
description: Close out a milestone: run all checks, verify each "Done when" criterion with evidence, update PROGRESS/DECISIONS/LEARNING_LOG/CLAUDE.md, then STOP for owner review. Use when the owner runs /finish-milestone <M0..M6> or when all work for a milestone appears complete.
argument-hint: <M0|M1|M2|M3|M4|M5|M6>
arguments: [milestone]
disable-model-invocation: true
---

# Finish milestone $milestone

Never skip a step and never claim success without evidence from this session.

1. Run `npm run check` (lint + typecheck + tests). If anything fails, fix the cause; do not weaken tests or add suppressions. Show the final passing output. (In M0, before the script exists, say so.)
2. Take each "Done when" criterion for **$milestone** from `docs/PROJECT_SPEC.md` §8 and verify it one by one. Mark each: ✅ verified (with evidence) / ❌ not met / ⚠ cannot verify here (say what the owner must check, e.g. on the Android emulator).
3. Check the quality bar (spec §11) for what this milestone touched: loading/empty/error states, accessibility labels, no `any` without a comment, no secrets or PII committed. From M1 on, repeat the two-user RLS check if the schema or policies changed.
4. **Understanding check:** ask the owner two short questions per new concept introduced. Do not close the milestone until they've answered or explicitly skipped.
5. Update, in this order: `docs/PROGRESS.md` (done, next, open questions) · `docs/DECISIONS.md` (one entry per non-obvious choice) · `docs/LEARNING_LOG.md` (3–5 notes) · `CLAUDE.md` if commands/stack/structure changed (keep under ~80 lines) · `.env.example` if variables were added · README status (implemented / mocked / planned) once README exists.
6. Make sure work is in small Conventional Commits on the milestone branch. Open a PR only if the owner asks.
7. **STOP.** Give a short review summary (what to look at, how to run it, anything not verifiable here) and ask the owner to review. Do not start the next milestone.
