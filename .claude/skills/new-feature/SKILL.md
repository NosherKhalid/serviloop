---
name: new-feature
description: Scaffold a new feature module (components, hooks, validation, public index.ts, repository, thin route) following the Serviloop architecture. Use when the owner runs /new-feature <name> or asks to start a new feature folder.
argument-hint: <feature-name-in-camelCase>
arguments: [name]
disable-model-invocation: true
---

# Scaffold feature `$name`

1. Read `.claude/rules/architecture.md` and the relevant spec sections (§4 structure, §6 screens). If `src/features/$name` exists, stop and ask.
2. Create only what is needed now:
   ```
   src/features/$name/
     components/    # presentational pieces, no data access
     hooks/         # useXxx "ViewModels" (loading/error/data state)
     validation.ts  # Zod schemas for forms
     index.ts       # the feature's only public surface
   src/repositories/${name}Repository.ts   # typed Supabase access, no JSX
   ```
3. If the feature has a screen, add a **thin** route in `app/` that imports it from `@/features/$name` and does nothing else.
4. Write the first test before the implementation: validation and repository error handling first, then a screen/form test covering loading, empty and error states.
5. Implement. Add a single `// iOS:` note on the first use of each new React concept.
6. Run `npm run check` and show the output. Fix failures; do not weaken tests.
7. Summarise using the teaching format in `.claude/rules/teaching.md` (what hooks/ ≈ in iOS terms, trace the data flow, two-question quiz). Do not commit unless asked.
