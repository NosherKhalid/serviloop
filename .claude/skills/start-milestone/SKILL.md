---
name: start-milestone
description: Begin a milestone (M0-M6) from docs/PROJECT_SPEC.md §8. Reads the milestone's scope and "Done when" gate, proposes a verifiable plan with iOS analogies, and creates the branch. Use when the owner runs /start-milestone <M0..M6> or says to start the next milestone.
argument-hint: <M0|M1|M2|M3|M4|M5|M6>
arguments: [milestone]
disable-model-invocation: true
---

# Start milestone $milestone

1. Confirm the previous milestone was reviewed and approved by the owner (see `docs/PROGRESS.md`). If not, stop and ask.
2. Read `docs/PROJECT_SPEC.md` §8 for **$milestone** and each section it references (§3 stack, §4 structure, §5 data/security, §6 screens, §7 AI, §11 quality). Quote the "Done when" gate back to the owner.
3. Check `docs/DECISIONS.md` for decisions that constrain this milestone and list any new decisions needed.
4. Ask any open questions that block this milestone via AskUserQuestion, before coding (e.g. M2: email confirmation on or off in Supabase; M5: which AI provider, or mock summary).
5. Enter plan mode and propose a task breakdown of narrow vertical slices, each verifiable by the owner. For each slice name the new React/TS concept and its Swift analogue. Wait for approval.
6. After approval: `git switch -c feat/<milestone>-<short-topic>` from an up-to-date `main`, and set the milestone to "in progress" in `docs/PROGRESS.md`.
7. Work one slice at a time using the teaching loop in `.claude/rules/teaching.md`.
