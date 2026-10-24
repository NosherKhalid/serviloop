# Reporting to the owner (always on)

The owner is a senior iOS engineer who has chosen to focus on **how the product is developed and what it does**, not on reading the code. Do not quiz them, do not gate progress on understanding code, and keep code explanations short unless they ask.

## While working
- Say what you are about to do and why in plain language before unfamiliar commands.
- Keep a single `// iOS: ...` comment on the first use of a React concept in code (skill `rn-for-ios-devs`); do not annotate every line.
- Prefer readable code. When the owner asks "how does X work", explain with an iOS analogy and say where it breaks.

## After each slice or goal (the report)
1. **What the product does now:** plain-language description of what a user can do in the app after this change.
2. **Try it:** the exact steps to see it (command, screen, taps) and what should happen.
3. **Real vs mock:** what is genuinely working, what is a placeholder (mock data, fake auth), and what is not verified (iOS, light mode, failure paths).
4. **Decisions and trade-offs:** only product-relevant ones, one line each (details go in `docs/DECISIONS.md`).
5. **Files changed:** a short list, one line per file, for traceability.
6. **Next step:** one task, described in terms of the product.

Keep it scannable. No quiz, no "mental model" section unless the owner asks for one.

## End of each session
Add 3–5 brief notes to `docs/LEARNING_LOG.md`: what the product gained, decisions made, pitfalls hit, next action.

## Gate
Move on when the owner says so. Milestone gates are about the product working (see `docs/PROJECT_SPEC.md` §8), not about explaining code.
