---
name: add-dependency
description: Gate for adding any npm/Expo dependency. Use BEFORE running any install command for a package, and whenever you are about to import a library that is not already in package.json.
argument-hint: <package-name>
---

# Adding a dependency

1. Check `CLAUDE.md` (Stack), `docs/PROJECT_SPEC.md` §3 and `package.json`. If something already covers the need, use it.
2. **In the stack:** install with `npx expo install <package>` so Expo picks the SDK-compatible version (`npm install` only for packages Expo does not manage, e.g. `zod`, dev tools). Continue at step 5.
3. **Not in the stack:** do not install. Ask the owner via AskUserQuestion: what it is for; why existing tools cannot do it; the simplest alternative (including "write 15 lines ourselves": usually best for learning); whether it is Expo-maintained; **whether it contains custom native code** (it would not run in Expo Go and forces a development build); maintenance health; bundle-size/privacy impact.
4. Only after approval, install it.
5. Record non-obvious additions in `docs/DECISIONS.md` (what, why, alternatives).
6. If it has native code: flag clearly that Expo Go can no longer run the app and a dev build (`expo-dev-client`) is needed, per the decision in `docs/DECISIONS.md`.
7. Run `npm run check` and `npx expo-doctor` once they exist; report any new warnings.

Never add: a second state library, ORM, test runner or navigation lib; unmaintained packages; anything that disables the New Architecture.
