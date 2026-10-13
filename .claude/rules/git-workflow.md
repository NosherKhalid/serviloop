# Git workflow (always on)

- Default branch `main` is always releasable. Work on branches: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`. One branch per milestone or per feature inside a milestone.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`. Subject ≤ 72 chars, imperative, explains the change; the body explains why when it is not obvious.
- Small, reviewable commits. Do not mix refactors with behaviour changes. Do not commit generated folders (`ios/`, `android/`, `node_modules/`, `.expo/`).
- Run `npm run check` before committing. Never commit failing tests, lint errors or type errors "to fix later".
- Open PRs with `gh pr create`; description = what changed, why, how it was verified, and any iOS-vs-RN notes. CI (lint, typecheck, unit tests) must be green before merge.
- Never force-push `main`. Never rewrite pushed history without the owner's explicit approval. Never skip hooks (`--no-verify`).
- Commit or push only when the owner asked for it or the active skill says so. Pushing is outward-facing: state what will be pushed first.
