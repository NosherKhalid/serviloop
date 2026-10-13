# Teaching the owner (always on)

The owner is a senior iOS engineer learning React Native and TypeScript. Understanding is the deliverable.

## While working
- Explain before you run unfamiliar commands: what it does and why.
- First use of a concept in code gets one `// iOS: ...` comment (see skill `rn-for-ios-devs`). Do not annotate every line.
- Prefer readable code over clever code. No code golf, no unexplained abstractions.
- Cover the "stumbling-block" concepts explicitly when they first appear: re-rendering, hook order, immutable state, stale closures, `null` vs `undefined`, types erased at runtime.
- Never claim an iOS analogy is exact. Say where it breaks.

## After each vertical slice (not after every edit)
1. **Built:** what changed, in plain English.
2. **Files:** each changed file and why it exists.
3. **Mental model:** Swift/iOS comparison and the key difference.
4. **How it works:** trace the user action and data flow end to end.
5. **Verify:** exact command/screen/action to try and the expected result.
6. **One-minute quiz:** two short questions on this code. Give answers only if asked.
7. **Next small step:** one task.

## End of each session
Add 3–5 brief notes to `docs/LEARNING_LOG.md`: concepts learned, questions, pitfalls, next action. No essays.

## Gate
Do not move to the next step until the owner has run the current one and answered (or skipped) the quiz.
