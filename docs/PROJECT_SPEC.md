# PROJECT_SPEC.md — Serviloop (30-Day React Native MVP)

> **Status note (2026-10-13):** This is the reference spec. Day-to-day working rules live in the root `CLAUDE.md` and `.claude/`; where they differ (teaching format cadence, milestones, Expo Go with a scalable path to a dev build), `CLAUDE.md` wins.

> **Instructions for Claude Code.** This file is the primary working specification for the repository. Read it before making changes. You are an experienced React Native/Expo/TypeScript and Supabase mentor collaborating with a senior native iOS engineer who is **new to JavaScript, TypeScript and React Native**. The primary outcome is a reliable, demonstrable portfolio MVP **and genuine understanding of its code**, not the maximum amount of generated code.

**Project working name:** Serviloop  
**Version:** MVP v0.1  
**Target:** iOS and Android (Expo/React Native)  
**Timeline:** 30 calendar days, part time (~45–60 minutes weekdays; longer sessions on weekends)  
**Audience:** Small field-service businesses (plumbing, electrical, HVAC, cleaning), initially **one owner/operator** per business.  
**Portfolio claim:** “Built an AI-assisted cross-platform field-service management MVP using React Native, TypeScript, Expo, and Supabase.” Do not imply paid customers, commercial traction, or production React Native employment without evidence.

---

## 1. Product statement

Help a small service business owner **record customers, assign work orders to technicians, track job status, and produce a concise customer-facing job summary with AI**.

A demo owner should be able to sign in, view example records, create and edit customers, create a work order for an existing customer, optionally assign it to a technician, change its status, record technician notes, and generate/edit/save an AI-written summary.

**Primary success:** A stranger can understand the app and complete the core flow on both iOS and Android using a demo account, without developer assistance.

### Personas
- **Owner/operator (authenticated)** — the only logged-in role in v0.1. Can manage their business's data.
- **Technician (record only)** — selectable on a work order. Does **not** log in in v0.1.
- **Customer (record only)** — does **not** book online or log in in v0.1.

### Main user journey
1. Sign up or sign in with email/password.
2. Create a business profile on first sign-in (or load a seeded demo business).
3. View dashboard counts: Open / In Progress / Completed jobs.
4. Browse customers and create/update a customer.
5. Browse work orders; create one with title, description, customer, optional technician, scheduled date, status.
6. Edit the job, update the status, and add completion notes.
7. Tap **Generate Summary**; a server-side function securely calls an AI model.
8. Review/edit the generated summary and save it; revisit it on the work-order detail screen.
9. Sign out and sign back in; records persist in Supabase.

---

## 2. Strict MVP scope

### Must have (P0)
- Expo React Native app written in **TypeScript**, running on iOS and Android.
- Email/password Supabase authentication with persistent session, loading/error states, logout.
- Create/read/update customers. Delete may be deferred or restricted if customers have work orders.
- Create/read/update work orders, including statuses: `open`, `in_progress`, `completed`, `cancelled`.
- List technicians and optionally assign a work order; create/edit technicians is useful but secondary to customer/job flow.
- Home dashboard with job counts and a recent jobs list.
- Notes field and **one AI action**: create a clear customer-friendly summary of work-order notes. User must be able to edit before saving.
- Postgres database; tenant-aware **Row Level Security** for every exposed business table.
- Basic navigation, loading/empty/error states, forms with validation and retry where appropriate.
- Seed **fictional** demo data; an actual backend connection, not just screenshots.
- A README, app screenshots or demo video, architecture explanation, setup instructions, limitations, and test instructions.

### Should have only if ahead of schedule (P1)
- Search/filter customers or jobs.
- Simple job schedule/date sorting.
- Technician create/edit screens.
- A few meaningful automated tests plus polished accessibility.
- Read-only job-photo attachment, if storage permissions and time allow.

### Explicitly out of scope (P2 — do not build in this 30-day sprint)
- Customer marketplace, customer booking app, public listings, maps, GPS, route planning.
- Stripe/payments, quotes/invoices, subscriptions, in-app purchases.
- Push notifications, SMS/email automation, chat, live technician tracking.
- Technician/customer accounts and role-based teams; multi-owner business permissions.
- Offline-first synchronization or elaborate caching.
- Calendar provider integrations; admin web dashboard; analytics instrumentation platforms.
- Multi-agent AI workflows, vector databases, autonomous AI dispatching.
- Complex clean architecture / DI containers / state-management libraries without demonstrated need.
- App Store/Play Store **public** launches during the sprint. Local builds and private demos are sufficient.

**Scope discipline:** When tempted to add a feature, first ask if it makes the main user journey more demonstrable. If not, write it into `BACKLOG.md` and return to P0. Do not silently expand scope.

---

## 3. Locked-in technical choices

| Concern | MVP choice | Reason |
| --- | --- | --- |
| UI / app | React Native + Expo + TypeScript | A cross-platform path with approachable tooling |
| Navigation | Expo Router | File-based routes; good default with Expo |
| Backend | Supabase | Auth, Postgres, API, server-side functions |
| Database | Supabase PostgreSQL | Natural relationships between businesses, customers, technicians and work orders |
| Data access | `@supabase/supabase-js` | Query through Supabase with RLS |
| Auth session persistence | Current official Expo/Supabase-compatible mechanism | Follow installed SDK's docs; no improvised storage implementation |
| Validation | Zod or similarly lightweight typed form validation | Input quality without framework proliferation |
| Styling | Core React Native `StyleSheet` and a small theme file | Learn fundamentals; keep dependencies low |
| Server AI | Supabase Edge Function -> provider API | Keep provider secret and authorization on server |
| Tests | Jest / React Native Testing Library if compatible with selected Expo SDK, plus manual device testing | Practical coverage |
| Package manager | npm | Consistent commands, one lockfile |

**Do not pin guessed versions.** Before installing, consult the current documentation and choose Expo-SDK-compatible package versions via `npx expo install`. Keep one lockfile and record versions in README. Do not change stacks without asking.

**Official sources (check as needed; APIs change):**
- Expo create project: https://docs.expo.dev/get-started/create-a-project/
- Expo Router: https://docs.expo.dev/router/introduction/
- Supabase with Expo: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Supabase Auth for React Native: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Function auth: https://supabase.com/docs/guides/functions/auth

---

## 4. Recommended project structure (explain this before implementing)

Prefer a **small feature-oriented codebase with thin route files**, not a literal translation of iOS MVVM-C and not an overengineered domain-driven system.

```text
serviloop/
├── CLAUDE.md                       # Instructions and scope for Claude Code
├── README.md                       # Public portfolio documentation
├── BACKLOG.md                      # Non-MVP ideas (do not build yet)
├── .env.example                    # Public keys/URLs placeholders only
├── .gitignore                      # Ignore .env, local caches, etc.
├── app/                            # Expo Router: routes only
│   ├── _layout.tsx                 # Root navigation + auth gate
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── index.tsx                # Dashboard
│       ├── customers/
│       │   ├── index.tsx            # Customer list
│       │   ├── new.tsx
│       │   └── [id].tsx             # Detail/edit
│       ├── technicians/
│       │   └── index.tsx
│       └── work-orders/
│           ├── index.tsx
│           ├── new.tsx
│           └── [id].tsx
├── src/
│   ├── components/                 # Reusable UI: Button, Input, EmptyState
│   ├── theme/                      # Colors, spacing, typography
│   ├── lib/
│   │   └── supabase.ts             # Single initialized Supabase client
│   ├── providers/
│   │   └── AuthProvider.tsx        # Auth/session state only
│   ├── features/
│   │   ├── customers/              # Components, hooks, validation
│   │   ├── technicians/
│   │   └── workOrders/
│   ├── repositories/               # Typed data access, NOT JSX
│   │   ├── customerRepository.ts
│   │   ├── technicianRepository.ts
│   │   └── workOrderRepository.ts
│   ├── types/                      # Shared/domain/database types
│   └── utils/                      # Only truly shared helpers
├── supabase/
│   ├── migrations/                 # Ordered, reviewable SQL migrations
│   ├── seed.sql                    # Fictional demo data, safely scoped
│   └── functions/
│       └── generate-job-summary/
│           └── index.ts           # Authenticated server-side AI call
├── docs/
│   ├── ARCHITECTURE.md             # High-level diagram / data flow
│   ├── LEARNING_LOG.md             # Swift -> TS/RN learning notes
│   └── TEST_PLAN.md                # Happy paths and security tests
└── __tests__/                      # Tests chosen for real value
```

Only create folders/files when the feature requires them. Expo may scaffold its own routing and configuration; **adapt** instead of fighting its supported structure.

### Required mental model: where work goes
- `app/.../*.tsx`: navigation endpoints and screen composition. **Avoid database calls here.**
- `src/features/...`: user-facing behaviors, feature-specific components, hooks, form logic.
- `src/repositories/...`: query/mutation functions calling Supabase; no UI.
- `src/providers/...`: cross-screen session/auth state, not a dumping ground.
- `src/lib/supabase.ts`: one configured client; no embedded service-role/admin secrets.
- `supabase/migrations/...`: database schema + policies in version control.
- `supabase/functions/...`: privileged server-side integration, particularly AI key usage.

**Data flow:** Screen -> feature hook/handler -> repository -> Supabase client -> Postgres/RLS -> response -> screen. For AI: screen -> function invocation -> authenticated Edge Function -> verifies owned work order -> AI provider -> return draft -> user edits -> save through protected repository.

### Swift / React Native mapping to teach
- Swift `struct` models / `Codable` -> TypeScript `type` or `interface` plus runtime validation where needed.
- SwiftUI `View` -> React function component (`.tsx`).
- SwiftUI `@State` -> React `useState` (not identical semantics).
- SwiftUI `onAppear` / `task` -> React effects or data loading hooks (different lifecycle rules).
- `NavigationStack` -> Expo Router route navigation.
- iOS repository/service protocols -> typed repository functions (introduce interfaces only when useful).
- Swift `async/await` -> TypeScript `async/await` with Promises.
- Swift optional -> `T | null` / `T | undefined` (understand the difference).

Do **not** claim these pairs are precisely equivalent. Teach React rendering, closures, effects, hooks rules, and immutable state explicitly; these are common stumbling blocks for Swift developers.

---

## 5. Data model and source of data

**All operational records come from our own Supabase Postgres database.** First we insert **fictional seed data**; afterward users enter/update records in the app. No external plumber/customer data API is required. The AI API is used only for the summary feature, not as the source of business records.

Required tables (names can be refined, but record changes in the architecture doc):

```text
auth.users                      # Managed by Supabase Auth
    1
    |
    +----< businesses          # id, owner_id, name, created_at
                1
                +----< customers     # id, business_id, name, phone?, address?, created_at
                +----< technicians   # id, business_id, name, specialty?, active
                +----< work_orders   # id, business_id, customer_id, technician_id?,
                                     # title, description?, status,
                                     # scheduled_for?, completion_notes?,
                                     # ai_summary?, created_at, updated_at
```

- All IDs should use UUIDs by default.
- `businesses.owner_id` is `auth.users.id` and is set to `auth.uid()` when created; never trust a client-provided arbitrary owner.
- Every customer/technician/work order belongs to one `business_id`.
- `work_orders.customer_id` is required; `technician_id` optional.
- Work-order status must be constrained to four accepted values.
- Enforce cross-table tenant consistency: a work order **must not** reference a customer/technician from a different business. Use composite foreign keys with suitable unique constraints or an equally strong DB-side guarantee; filtering dropdowns on the client is not security.
- Add meaningful indexes (e.g., `business_id`, job status, scheduling date), not speculative indexes.
- Avoid storing live personal information in seeds or screenshots.
- TypeScript database types should be generated using supported Supabase tooling when practical; keep them synchronized with SQL migrations.
- Do not put access-control logic solely in the mobile app.

### Security: required from Day 8 onward
1. Enable **RLS** on `businesses`, `customers`, `technicians`, `work_orders` (and any storage tables/buckets you later expose).
2. Policies scope read/write to businesses where `owner_id = auth.uid()`. Ensure inserts/updates have appropriate `WITH CHECK` constraints as well as `USING` filters.
3. Users must not reassign an existing row to another business or owner; restrict mutable fields/privileges if necessary.
4. Verify a user from Business A cannot read, create into, change, or delete Business B data, including by forging foreign keys.
5. Never embed service-role, secret, or AI provider credentials in the app. Expo `EXPO_PUBLIC_...` variables are **public** in the compiled client; only Supabase project URL and publishable/anon client key belong there. RLS provides the protection.
6. Never log access tokens, private business records, or AI keys.
7. Ask the human before any destructive schema reset/migration against a non-disposable database.

**Example public client configuration (place placeholders in `.env.example`):**

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

**AI provider key:** store only as a **Supabase Edge Function secret**, e.g., `OPENAI_API_KEY` or the chosen provider equivalent. Never use `EXPO_PUBLIC_` for it.

---

## 6. Screens and acceptance criteria

| Screen | Minimum behavior | Done when... |
| --- | --- | --- |
| Sign in/up | Email/password, validation, loading/errors | Auth works; session survives restart; sign out works |
| Onboarding | Create first business profile | First login can proceed without manual SQL operations |
| Dashboard | Count jobs by status, show recent jobs | Matches actual database records |
| Customers | List, create, detail/edit | A newly created customer appears after app restart |
| Technicians | Display seeded techs, choose tech in job form | Assignment persists; no technician login needed |
| Jobs list | Show jobs and status, open details | Jobs from database appear with useful empty state |
| New/edit job | Select customer/tech; title, description, date/status | Validation and persistence work |
| Job detail | Update status and notes; generate/edit/save summary | AI feature works only for owner of that work order |
| Settings/profile | Business name + sign out | Business context and sign out reliable |

**Minimum UX quality:** clear top-level navigation; tap targets; keyboard-safe forms; loading/empty/error states; readable typography; input validation; avoid over-polishing before the main flow works. If offline, surface a friendly error; full offline sync is out of scope.

---

## 7. AI summary feature specification

**Input:** An existing work order's ID; the server reads the authorized job title, description, and completion notes. Avoid sending client-supplied arbitrary business records that bypass permissions.

**Output:** A professional, factual, concise summary intended for a customer; ideally 2–5 sentences. It can describe only work actually recorded in the notes. It must **not invent parts replaced, warranty terms, pricing, safety certifications, or work performed**.

**Flow:**
1. Signed-in user taps **Generate Summary** on a work order.
2. React Native invokes `generate-job-summary` with `{ workOrderId }` using the user's authenticated session.
3. Edge Function **validates the user's identity** using the current official Supabase secure-function pattern, then verifies ownership/tenant membership of that work order.
4. Validate input size; load minimal needed notes; omit unnecessary customer PII.
5. Make the model call server-side using a secret configured in the function environment.
6. Return a summary draft; display it in an editable text field.
7. User checks accuracy and taps **Save** to persist `ai_summary` via normal RLS-protected access.
8. Show an informative fallback if notes are empty, model is unavailable, or quota is exceeded.

**Limits:** Add timeout/error handling and a sensible input limit. Avoid retries that multiply cost; for a public demo, implement a basic per-user rate limit or disable public AI access until one exists. Keep a modest hard spending cap in the provider dashboard. Treat job notes as untrusted data, not instructions to the model. Never send real customer PII during initial development. If provider credentials are unavailable, use a clearly labeled *mock AI summary* for UI testing; do not pass it off as live integration.

---

## 8. 30-day delivery plan with gates

| Days | Deliverable | Gate to proceed |
| --- | --- | --- |
| **1–3** | Working Expo app, TypeScript basics, first components | Runs in iOS simulator and at least one Android environment; developer can explain `.tsx`, props and state |
| **4–7** | Route groups, customer/job screens using mock arrays | Full mock navigation and one mock CRUD flow; no backend yet |
| **8–10** | Supabase project, local env, migration, RLS, seed strategy | Schema reviewed; cross-business reads/writes rejected |
| **11–13** | Auth + business onboarding + persistence | Sign-up, login, restore session and sign-out work |
| **14–18** | Customers, technicians, work orders via repositories | Create/edit/read from Postgres on both platforms |
| **19–22** | Dashboard, status changes, loading/error handling | Main user journey works without fake UI data |
| **23–25** | Secure summary Edge Function + editable result | Live AI path works with provider key kept server-side |
| **26–28** | Tests, cross-platform debugging, accessibility/UX pass | Test plan passes; security check repeated |
| **29–30** | README, diagram, screenshots/video, limitations | Someone else can clone and understand the demo |

### Milestones (how the days above are worked and gated)

Work is organised as milestones. Each ends with `/finish-milestone`, an understanding check, and a stop for owner review.

| Milestone | Days | Done when |
| --- | --- | --- |
| **M0** Setup + mock UI | 1–7 | Expo TS app runs on iOS simulator and Android emulator via Expo Go; owner can explain `.tsx`, props, state; route groups and mock-array customer/job screens with one mock CRUD flow |
| **M1** Database, RLS, seed | 8–10 | Migrations committed; RLS on all tables; cross-business reads/writes/forged FKs rejected in a scripted two-user test; fictional seed works |
| **M2** Auth + onboarding | 11–13 | Sign-up, sign-in, session restore after restart, sign-out, first-business creation without manual SQL |
| **M3** CRUD via repositories | 14–18 | Customers, technicians, work orders create/read/update through repositories on both platforms |
| **M4** Dashboard + status | 19–22 | Dashboard counts match DB; status changes and notes persist; loading/empty/error states present; main journey works with no fake data |
| **M5** AI summary | 23–25 | Edge Function verifies caller + ownership; live (or clearly labelled mock) summary editable and saved; provider key only in function secrets |
| **M6** Tests, polish, docs | 26–30 | Test plan passes; security check repeated; README, architecture doc, screenshots/video, limitations, AI-assistance disclosure |

**Reality rule:** If behind schedule, cut P1 and additional polish first. Do not sacrifice working auth, RLS, or correct data ownership. A polished but insecure backend is not a completed MVP.

---

## 9. How Claude Code must collaborate with the human developer

The human is a **senior iOS engineer** but a **TypeScript/React Native beginner**. Act as a coach and pair programmer, not a silent code generator.

### Before each nontrivial change
1. Explain the goal in **2–4 sentences** and identify the relevant files.
2. Map the new React/TypeScript concept to something familiar in Swift/iOS, noting important differences.
3. Propose the **smallest change** to achieve the next acceptance criterion.
4. Ask permission **before** changing security policies, running destructive commands, adding costly services, or implementing features outside scope.

### During work
- Implement **one narrow vertical slice at a time**, not 30 days of work in one prompt.
- Prefer straightforward, readable code and descriptive names. Avoid code golf.
- Keep TypeScript `strict` enabled; avoid `any`, `@ts-ignore`, and risky non-null assertions unless justified.
- Use typed data models and small, focused functions.
- Handle loading, empty states, failures, cancellation/unmount where relevant.
- Avoid duplicated business logic in route components.
- Do not add a new dependency if the existing stack solves the problem simply.
- **Do not silently rewrite unrelated files.** Show the changes and explain trade-offs.
- Run available linters, type checks, tests, and relevant manual checks; report actual output. Never claim tests passed if not run.
- Before using unfamiliar packages, check current docs rather than inventing APIs.

### After each coding step — mandatory teaching format
Respond with:
1. **Built:** What changed, in plain English.
2. **Files:** Each changed file and why it exists.
3. **Mental model:** Swift/iOS comparison with any important difference.
4. **How it works:** Trace the user action and data flow end-to-end.
5. **Verify:** Exactly which command/screen/action to run, and what should happen.
6. **One-minute quiz:** Ask **two short questions** that test whether the developer understands this code. Give answers if requested.
7. **Next small step:** One task, not a sprawling list.

At the end of each session, add 3–5 brief notes to `docs/LEARNING_LOG.md`: concepts learned, questions, pitfalls, and next action. Do not create noise or write essays.

### Required concepts to cover over the 30 days
- `let`/`const`, arrays/objects, functions, arrow functions, structural typing, interfaces/types.
- `null` vs `undefined`, unions, generics at a basic practical level.
- `.ts` vs `.tsx`, JSX expressions, components, props, `useState`, `useEffect`, `useMemo` only if useful.
- Re-renders, hook ordering, state immutability, asynchronous closures.
- Expo Router and screen lifecycle, navigation params, route groups.
- `async/await` and Promises, handling network errors.
- Repository pattern and UI vs data separation.
- Supabase Auth sessions, Postgres keys/joins, RLS and why keys in mobile apps are public.
- Environment variables, secrets, local build/debugging.
- Cross-platform differences: keyboard behavior, safe areas, permissions, Android back navigation.
- Testing a business flow end-to-end, not just rendering a screen.

---

## 10. Git and collaboration conventions

- Branches: `main` for demonstrable milestones; `feat/<short-name>` for scoped work; `fix/<short-name>` for bug fixes.
- Small commits with meaningful names such as `feat: add customer list with Supabase query`.
- Prefer feature slices rather than enormous AI-generated commits.
- Never commit `.env`, API secrets, private keys, device tokens, or real customer data.
- Commit migrations, `.env.example`, README, and sanitized screenshots.
- Before each milestone, update README with status: implemented, mocked, or planned.
- If the repo already exists, inspect its current shape and preserve valid code; don't blindly overwrite an existing Expo scaffold.

---

## 11. Quality bar and test checklist

### Functional checks
- Fresh signup creates/loads the user's own business; sign-in and sign-out work.
- Restart app: session persists and relevant data remains.
- New customer persists and appears in list.
- New job links to correct customer; assigning technician persists.
- Status and completion notes persist across reloads.
- Dashboard counts update after changing job statuses.
- Empty list, slow request, network failure, invalid form and unauthorized session all show understandable states.
- AI draft can be edited; final saved text survives restart.

### Security checks (mandatory)
- Account A cannot read or mutate Account B's business/customer/technician/job IDs.
- Account A cannot create a job using Account B's customer/technician ID.
- Unauthenticated calls cannot access business data or successfully invoke AI summarization.
- API key for model provider exists only in Edge Function secrets.
- Published/demo screenshots and logs contain no real personal information.
- Errors don't leak private database or credential values.

### Platform checks
- iOS simulator or device and Android emulator/device both run the **same project**.
- Forms remain usable with keyboard visible.
- Back navigation works on Android.
- Date input and platform-specific controls render sensibly.
- Error/loading states are usable under network failure.

### Automated tests (small but meaningful)
- Status transitions or work-order validation.
- Customer or work-order repository error-handling behavior (mock Supabase client).
- One primary UI screen or form interaction.
- SQL/RLS verification with two test users (manual scripted checks acceptable in v0.1).

Keep any untested limitations explicitly documented.

---

## 12. Setup sequence — what to do when this repository is empty

1. Verify Node.js LTS, npm, Xcode/iOS simulator and an Android runtime (emulator or physical device).
2. Initialize Expo with its current default TypeScript + Expo Router template, using a command consistent with current docs, e.g.:

   ```bash
   npx create-expo-app@latest serviloop
   cd serviloop
   npx expo start
   ```

   If this `CLAUDE.md` is outside the new folder, move/copy it into the **repository root** first. If it already lives in an existing folder, scaffold there safely instead of nesting projects accidentally.
3. Run on iOS and Android, note environment constraints, and explain generated files.
4. Add `.env.example`; create local `.env` only after a Supabase project has been configured.
5. Before backend integration, build mock-data UI and route navigation.
6. Create Supabase schema with migration files; review and verify RLS **before** wiring real data.
7. Wire auth and CRUD through repositories.
8. Add the AI function only when job persistence is working.
9. Repeat checks on both platforms and produce a portfolio README/demo.

**Don't ask the user to learn Node/Express or create a separate custom REST server for this MVP.** Supabase already provides the API. If a true custom endpoint is needed, use the one Edge Function described above.

---

## 13. Deliverables by Day 30

- [ ] GitHub-ready Expo/React Native/TypeScript source repository.
- [ ] Screens on iOS and Android, with actual Supabase records.
- [ ] Supabase migrations, RLS policies, fictional seed-data workflow.
- [ ] Secure AI summary Edge Function, or documented mock fallback if credentials unavailable.
- [ ] Working signup/sign-in/sign-out, customers, jobs, technician assignment, dashboard.
- [ ] README with **problem**, **target user**, **feature scope**, **stack**, **architecture**, **setup**, **security**, **demo**, **limitations**, and **AI-assistance disclosure**.
- [ ] `docs/ARCHITECTURE.md` showing data flow and database relationships.
- [ ] `docs/TEST_PLAN.md` with manual results and outstanding issues.
- [ ] `docs/LEARNING_LOG.md` with React Native/TypeScript insights for the iOS developer.
- [ ] 1–2 minute walkthrough video or annotated screenshots from both platforms.

### Definition of Done
An owner can go from sign-in to customer creation to a completed work order and a saved, verified AI-assisted summary on both iOS and Android. Data persists, tenant isolation has been tested, setup can be reproduced, and portfolio documentation is honest about what was built.

---

## 14. Claude Code: FIRST MESSAGE AND FIRST TASK

**Do not start building the entire product when this file is first loaded.** Start with this workflow:

1. Inspect the current directory: is it empty, an existing Expo project, or another repository? Check for existing files before changes.
2. Give a short summary of the product, constraints, and architectural plan.
3. Verify available Node, Expo, Xcode and Android tools; distinguish environment blockers from app problems.
4. Propose **Day 1 only**: initialize/confirm an Expo TypeScript project, run the starter app, explain its top-level structure and make a trivial reusable `WelcomeCard` component to demonstrate props.
5. Explain how TypeScript components/props/state differ from SwiftUI, with a tiny example.
6. Ask the user to run the app and answer the two learning questions; move to Day 2 only when Day 1 is verified or the user explicitly asks you to continue.

**If the user explicitly says “go ahead and implement,” you may perform Day 1 setup. Still stop at that milestone, report what you verified, and keep the teaching loop.**

---

## 15. Questions to defer (not blockers)

Track these in `BACKLOG.md` rather than interrupting MVP development:
- The product's final commercial name, target country, and service vertical.
- Paid pricing, business registration or multi-tenant organization membership.
- Whether technicians should eventually have accounts.
- Whether customers need a public booking web/mobile app.
- Which AI provider to use; start with a supported API, enforce cost limits, and keep function boundary replaceable.
- Publishing to app stores; decide after a stable internal demo.

**Operating principle:** Ship the smallest useful, secure, understandable cross-platform app. Teach the human developer the underlying technology at every step. The portfolio is the evidence; the developer's understanding is the lasting asset.
