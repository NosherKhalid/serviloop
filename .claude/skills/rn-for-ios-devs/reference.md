# iOS → React Native / Expo reference

Companion to `SKILL.md`. Each row says what maps and, in the last column, where the analogy breaks.

## 1. UI and state

| SwiftUI / UIKit | React Native | Where it differs |
|---|---|---|
| `View` struct, `body` | function component | Re-runs whole function on every state/props change; it is cheap because it only builds a description. |
| `@State` | `useState` | Setter is async-batched: you do not see the new value until the next render. |
| `@Binding` | prop + setter callback | No two-way binding; data flows down, events flow up. |
| `@StateObject` + `ObservableObject` | custom hook (`useXxx`) | Hooks must be called unconditionally, at the top level, in the same order every render. |
| `@Environment` | Context | Any value change re-renders all consumers; keep contexts small. |
| `.onAppear` / `.task` | `useEffect(fn, [])` | Return a cleanup function (like `onDisappear` / task cancellation). If React Strict Mode is on, dev builds run effects twice on mount to expose missing cleanup. |
| `.onChange(of: x)` | `useEffect(fn, [x])` | Prefer deriving values during render over syncing state with effects. |
| `@Observable` / Combine pipelines | plain hooks with `useState` + `useEffect` (no state library in Serviloop) | No automatic dependency tracking; you subscribe via hooks/selectors. |
| `ViewModifier`, `.padding().background()` | `style` props and wrapper components | No modifier chain; styles are plain objects (`StyleSheet.create`). |
| Auto Layout / stacks | Flexbox | `View` lays out children in a column by default. `flex: 1` fills available space. Units are density-independent points. |
| `ScrollView` + `LazyVStack` | `FlashList` / `FlatList` | A `ScrollView` renders all children; only the list components virtualize. |
| `safeAreaInset` | `react-native-safe-area-context` | Not automatic; wrap screens or use `useSafeAreaInsets`. |
| `Dynamic Type` | font scaling on `Text` | On by default; do not turn it off. |
| `Animation` / `withAnimation` | Reanimated (UI thread) | Animations that touch JS state on every frame will stutter; use shared values/worklets. |
| `UIGestureRecognizer` / `DragGesture` | Gesture Handler | Runs on the UI thread with Reanimated. |

## 2. Navigation (Expo Router)
- The file tree under `app/` **is** the navigation graph. `app/(tabs)/home.tsx` is a tab screen; a folder in parentheses groups routes without adding a URL segment.
- `_layout.tsx` defines the container for its folder: `<Stack>` ≈ `NavigationStack`, `<Tabs>` ≈ `TabView`. It plays the coordinator role.
- `router.push('/path')` / `<Link href>` ≈ appending to the `NavigationPath`. Params are strings; validate them with Zod.
- Deep links come for free because every route has a path.

## 3. Language and data
| Swift | TypeScript | Note |
|---|---|---|
| `struct` / `class` / `enum` with payloads | `type` / object / discriminated union | Structural typing: shape matters, not name (like protocols with no explicit conformance). |
| `Optional<T>` | `T \| undefined` / `T \| null` | Both exist; Supabase returns `null` for empty columns, so DB types use `T \| null`; use `undefined` for optional props and params. |
| `Codable` | Zod `schema.parse` / `safeParse` | TS types alone do not validate at runtime. |
| `async/await`, `Task` | `async/await`, `Promise` | No structured concurrency; handle cancellation yourself (`AbortController`, query cancellation). |
| `guard let` | early `return` + narrowing | |
| `Result` | try/catch or `{ok: boolean}` unions | Errors thrown from `await` are untyped (`unknown`). |
| `lazy var` / memoization | `useMemo` | Use only for measured cost or stable identities. |
| `==` on value types | `===` compares references for objects | Two equal-looking objects are not `===`; this matters in dependency arrays. |

## 4. Toolchain
| Xcode world | Expo / RN world |
|---|---|
| Xcode project, targets, schemes | Generated `ios/` project from `expo prebuild` (Continuous Native Generation). Configure via `app.config.ts` + config plugins. |
| `Info.plist`, entitlements, capabilities | `ios.infoPlist`, `ios.entitlements` in `app.config.ts`, or a config plugin |
| Debug / Release configurations | EAS build profiles (`development`, `preview`, `production`) + `APP_ENV` |
| SPM / CocoaPods | npm for JS; CocoaPods still runs under the hood for native iOS dependencies (`pod install` during prebuild) |
| LLVM/Swift compiler | **Metro** bundles JS; **Hermes** runs it (bytecode-compiled). Native code is compiled by Xcode as usual. |
| Run on simulator (⌘R) | `npm start` (Metro) + a **development build** (your own app with `expo-dev-client`) on the simulator; edits hot-reload via Fast Refresh |
| Expo Go vs dev build | Expo Go = prebuilt generic app, perfect for learning; cannot include custom native modules. Serviloop starts on Expo Go and stays native-code-free so moving to a dev build later is a one-step change. |
| Instruments, View Debugger | React Native DevTools (press `j` in the Metro terminal) for JS/components; Xcode Instruments still works for native/perf |
| XCTest / Swift Testing | Jest + React Native Testing Library |
| XCUITest | Maestro (YAML flows) |
| SwiftLint / swift-format | ESLint / Prettier |
| Xcode Cloud / Fastlane | GitHub Actions + EAS Build / EAS Workflows |
| Archive → App Store Connect | EAS Build (cloud or `--local`) → EAS Submit |
| (no equivalent) | **EAS Update**: ship JS/asset-only fixes over the air without store review. Native changes still need a new binary. |

## 5. Threads
- **JS thread**: your components, hooks and business logic (Hermes).
- **UI (main) thread**: native views, gestures, Reanimated worklets.
- Bridge-free in the New Architecture (always on in SDK 55+): JS can call native synchronously via JSI, but calling the UI thread from JS every frame is still expensive.

## 6. Mental traps for SwiftUI developers
1. Mutating state directly (`items.push(x)`) does nothing visible. Always set a new value.
2. Stale closures: a callback captures the values from the render it was created in. Use the functional setter form (`setCount(c => c + 1)`) or correct dependency arrays.
3. Effects with missing/over-broad dependencies cause loops or stale data.
4. Keys in lists must be stable IDs, never array indexes, or state jumps between rows.
5. `console.log` in render runs often; it is not an `onAppear`.
6. Running in a debugger-attached dev build is much slower than a release build; judge performance on release builds.
