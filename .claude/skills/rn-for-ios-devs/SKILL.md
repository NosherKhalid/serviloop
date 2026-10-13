---
name: rn-for-ios-devs
description: Explain React, React Native, Expo and JavaScript/TypeScript concepts in iOS terms (SwiftUI, UIKit, Combine, Xcode, SPM). Use whenever you introduce or explain a React/RN/Expo concept to the owner, when they ask "what is the iOS equivalent of ...", or when writing the "iOS:" comment/note the project requires.
when_to_use: Introducing hooks, state, effects, navigation, layout, async/data fetching, auth, build tooling, testing or release steps; any time the owner seems unsure what a React/RN term means.
---

# React Native for a senior iOS engineer

The owner knows Swift, SwiftUI and MVVM-C well and is new to React Native. Explain by mapping to what they know, then point out where the analogy **breaks**, because that is where bugs come from.

## How to explain
1. One sentence: the concept in iOS terms.
2. The smallest code example (TypeScript).
3. "Where it differs": the one thing that would surprise a SwiftUI developer.
4. In code, leave a single `// iOS: ...` comment on first use only.

## Core mental model
- A component is a **function that returns a description of the UI** (JSX), like a SwiftUI `body`. It re-runs when its state or props change; React diffs the result and updates native views.
- State is **immutable by convention**: never mutate, always set a new value (`setItems([...items, x])`). SwiftUI value types enforce this; JS does not.
- Types are **erased at runtime**. `Codable` decodes and fails; a TypeScript type does not. Validate external data with Zod.
- JS is **single-threaded**. No actors or `@MainActor`; long synchronous work freezes the UI.
- A callback **captures the render it was created in** (stale closures). Closest Swift trap: capturing a value-type copy.

## Quick map (full tables in [reference.md](reference.md))
| iOS / SwiftUI | React Native / Serviloop |
|---|---|
| `struct MyView: View` / `body` | function component returning JSX |
| `@State` | `useState` |
| `@Binding` | value + setter passed as props |
| `ObservableObject` + `@Published` (ViewModel) | custom hook (`useXxx`) |
| `@EnvironmentObject` (e.g. session) | React Context (`AuthProvider`, `useContext`) |
| `.onAppear` / `.task` | `useEffect(() => {...}, [])` |
| `.onChange(of:)` | `useEffect` with that value in the deps array |
| `List` / `ForEach` | `FlatList`; `key`/`keyExtractor` ≈ `Identifiable.id` |
| `NavigationStack`, `TabView`, coordinators | Expo Router: files = routes, `_layout.tsx` = container |
| `VStack` / `HStack` / `ZStack` | `View` (column by default) / `flexDirection: 'row'` / `position: 'absolute'` |
| `Codable` | Zod schema + inferred TS type |
| Repository protocol + implementation | typed repository functions over `supabase-js` |
| `URLSession` + async/await | `supabase-js` calls with `async/await` |
| Keychain | `expo-secure-store` |
| `Info.plist`, entitlements | `app.json` / `app.config.ts`, config plugins |
| SPM / `Package.swift` | npm / `package.json` |
| Run in Xcode (⌘R) | `npm start`, then `i` / `a`; Fast Refresh on save |

## When the owner asks "how do I..." in Xcode terms
Read [reference.md](reference.md) (toolchain, debugging, release sections) rather than answering from memory, and check current Expo docs for the installed SDK before giving commands.
