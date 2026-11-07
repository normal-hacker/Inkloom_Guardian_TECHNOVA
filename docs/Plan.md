# Plan — Implementation Roadmap (Round 2)

> Built and verified across stages S0 through S7. This document records the architectural roadmap, execution milestones, deviation ledger, and submission status.

---

## 1. Team Allocation & Ownership
| Member | Primary Ownership | Secondary Support |
|---|---|---|
| **Ugesh Kumar** | Data models, Drizzle ORM schema, deterministic rule engine, check pipeline, security suite, API route handlers | Seed brand pack, NUM-001 proximity algorithm |
| **Raghvendra Basarwar** | Next.js 15 application, review workspace UI, intake workflows, persona authentication | End-to-end integration, production build |
| **Riya Sharma** | Brand pack guidelines (S1–S4, 13 rules, facts F-001–F-006), 20-case golden set, documentation, demo flow | Insights aggregations, user testing |

---

## 2. Stage Execution Ledger (S0–S7)

| Stage | Name | Key Deliverables | Verification Status |
|---|---|---|---|
| **S0** | Foundations & Contracts | Next.js 15.5.29 app skeleton, dual-client test harness, root `.env` loading, API contracts | **PASSED** |
| **S1** | Data Layer & Persistence | 16 PostgreSQL tables via Drizzle ORM, append-only triggers, idempotent seed script, auth-lite HMAC tokens | **PASSED** (10 tests) |
| **S1B**| Persona Sign-in | Clean login component (`AuthComponent`), 1-click persona switching (Asha, Ben, Priya, Marcus), route middleware | **PASSED** |
| **S2** | Pure TS Rule Engine | Deterministic 13-rule engine, `NUM-001` proximity-weighted fact matching, word-level diff, PII redaction | **PASSED** (16 tests) |
| **S3** | Intake & Pipeline | File extraction (`.txt`, `.md`, `.docx`, `.pdf`, image alt-text), magic byte validation, check pipeline, PII scrubbing | **PASSED** (6 tests) |
| **S4** | Workflow & Decisions | Blocker gate, self-approval prevention, stale check protection, comments, immutable audit log, draft v4 rules, YAML importer | **PASSED** (8 tests) |
| **S5** | Review Workspace & Screens| 11 functional pages: Landing, Dashboard, Intake, Workspace, Guidelines, Insights, Audit, About AI, Demo Report, Build Notes, Selftest | **PASSED** |
| **S6** | Insights & Analytics | Aggregated compliance metrics: top violated rules, high-friction rules (>40% dismissal), turnaround times | **PASSED** (3 tests) |
| **S7** | Hardening & Benchmarks | 20-case Golden Set evaluation (Precision: 95.24%, Recall: 100.00%, F1: 97.56%), security test suite, production build | **PASSED** (26 tests) |

---

## 3. Deviation Ledger

Judges evaluate engineering discipline through honest and reasoned adaptation to technical realities:

| # | Original Specification | Implemented Architecture | Technical Rationale | Date |
|---|---|---|---|---|
| 1 | FastAPI Python backend + Next.js frontend | Unified full-stack Next.js 15.5.29 App Router | Eliminates cross-origin friction, reduces deployment complexity to a single container/service, and shares TypeScript types between UI and API. | 2026-11-05 |
| 2 | Heavy RAG / pgvector for rule lookup | In-memory deterministic rule engine with active rule-set version pinning | Small guideline corpus (13 rules, 6 facts). Rule engine is 100% deterministic, instant (<5ms), zero-cost, and completely free of hallucinated rulings. | 2026-11-05 |
| 3 | LLM auto-approval of content | Strict human-in-the-loop: AI never approves content | Legal safety and brand governance requirement. Only human reviewers and managers hold approval permissions. | 2026-11-05 |
| 4 | Client-side only single HTML file (`index.html`) | Full-stack Next.js + PostgreSQL database with append-only triggers | Hackathon prompt required robust multi-user workflow, audit trail, role enforcement, and server-side persistence. | 2026-11-05 |
| 5 | Celery / Redis queue infrastructure | Direct asynchronous Next.js Route Handlers and database check runs | Avoids Redis dependency overhead; simplifies hosting on standard platforms like Supabase, Vercel, and Render. | 2026-11-05 |
| 6 | Keyword-only `NUM-001` matching | Proximity-weighted context window matching with claim-value candidate tie-breaking | Prevents false positives where multiple facts share keywords (e.g. inverter warranty vs panel warranty). | 2026-11-05 |
| 7 | Mandatory Google sign-in | Google OAuth is optional; degrades gracefully with clear explanation when unconfigured | Prevents judging friction; judges must never be blocked by OAuth configuration or testing status. | 2026-11-05 |
| 8 | Self-registration / Sign-up wizard | Seeded demo accounts with 1-click login; registration out of scope for Round 2 | Hackathon judges need instant, frictionless evaluation across all roles (Creator, Reviewer, Manager). | 2026-11-05 |

---

## 4. Submission Checklist (Round 2)

- [x] **Completed Features:** All 13 core features verified live across 11 routes.
- [x] **Technical Documentation:** `README.md`, `docs/Architecture.md`, `docs/Database.md`, `docs/API.md`, `docs/Testing.md`.
- [x] **Deviation Ledger:** Documented above with clear rationale.
- [x] **Evaluation Evidence:** Golden Set benchmark table (20 test cases, 95.24% Precision, 100% Recall).
- [x] **Round 3 Commitments:** Stale-content re-audits, guideline gap detection, and visual compliance analysis.
- [x] **Zero Errors:** `npm test` (74/74 passing), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run build` (29/29 routes compiled).

### Phase UI-Tabs: ExpandableTabs Component & Semantic Navigation
- [x] **Component Reference:** Saved `docs/ui/expandable-tabs-component.md`.
- [x] **Defect Hardening:** Implemented `components/ui/expandable-tabs.tsx` addressing all 11 prompt defects:
  1. No collapse on outside click for active nav (`collapseOnOutsideClick={false}`).
  2. Accessible names on collapsed state via `aria-label` and `title` tooltips, incorporating badge counts.
  3. Strict `variant="nav" | "tabs"` semantics with roving tabindex and ArrowLeft/ArrowRight/Home/End keyboard handling.
  4. Module-scope `Separator` component to prevent re-creation.
  5. Stable `id` keys for all tabs and separators.
  6. Framework `motion.create(Link)` integration for real anchor behavior.
  7. 44px minimum touch targets and 360px viewport scroll protection without horizontal window overflow.
  8. Spring transition (`bounce: 0, duration: 0.4`) with zero artificial delay and reserved `min-h` to eliminate CLS.
  9. `useReducedMotion()` instant transitions when requested.
  10. Badges with accessible names, hiding when 0/undefined.
  11. Atomic click handling with single `onChange` invocation.
- [x] **Single Source of Truth:** Authored `lib/nav/config.ts` with role-based filtering for creator, reviewer, and manager.
- [x] **Layout & Headers:** Authored `components/layout/AppNav.tsx` and `components/layout/PageHeader.tsx` with animated detail strip.
- [x] **Review Workspace Tabs:** Integrated `ExpandableTabs` in `/content/[id]` for mobile Content/Findings switching (<1024px) and desktop bottom panel tabs (Comments, History, and Audit for reviewers/managers).
- [x] **Guidelines Tabs:** Integrated `ExpandableTabs` in `/guidelines` for Sources, Rules, Glossary, Facts, and Rule sets with `?tab=` query parameter persistence.
- [x] **Verification:** `npm test` (99/99 passing), `npm run typecheck` (0 errors), `npm run lint` (0 errors), and `npm run build` (31/31 routes compiled).

### Phase UI-Sidebar: Animated Collapsible Sidebar & App Shell
- [x] **Component Reference:** Saved `docs/ui/sidebar-component.md`.
- [x] **Defect Hardening:** Implemented `components/ui/sidebar.tsx` addressing all 12 prompt defects:
  1. Desktop rail fixed slot (64px) avoiding layout jump on hover; pinned state expands flex width to 280px with zero CLS on main content.
  2. Pin toggle persists across reloads in `localStorage` (`inkloom_sidebar_pinned`) with try/catch error safety.
  3. Hover intent delay (~120ms) and collapse delay (~150ms) to prevent hair-trigger jitter.
  4. BrandMark component keeps shield icon visible in collapsed rail and reveals "Inkloom Guardian" text only when expanded.
  5. Distinguish navigational links (`SidebarLink` with Next.js `Link`) and action buttons (`SidebarButton` with native `<button type="button">`), avoiding `href="#"`.
  6. Visible focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-600`) and accessible tooltip titles.
  7. Minimum 44px touch targets across desktop and mobile.
  8. `useReducedMotion()` instant transitions when requested.
  9. Mobile slide-in drawer dialog (`role="dialog"`, `aria-modal="true"`) with backdrop blur, Escape-to-close, and focus restoration to the trigger button.
  10. Auto-close mobile drawer on route navigation click.
  11. Clean semantic hierarchy: `<nav aria-label="Main">`, skip link (`a.sr-only[href="#main"]`), and main container `<main id="main">`.
  12. Pure presentational isolation: `sidebar.tsx` contains zero fetch, session, or role logic.
- [x] **App Shell & Layout Integration:**
  - Implemented `components/layout/AppShell.tsx` wrapping all authenticated views in full-height layout (`h-dvh flex flex-col md:flex-row overflow-hidden bg-[#F8F9FA]`) with `rounded-tl-2xl` white main panel and top skip link.
  - Implemented `components/layout/AppSidebar.tsx` consuming `lib/nav/config.ts`, persona badge, accessible demo user switcher, and logout.
  - Retired deprecated top `Navbar` / `AppNav` while keeping `ExpandableTabs` active for in-page workspace and guideline tabs.
- [x] **Verification:** `npm test` (108/108 passing across 12 suites), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run build` (31/31 routes compiled), unit test suite `tests/sidebar.test.ts` (9/9 passing), and Playwright E2E suite `e2e/sidebar.spec.ts`.

### Phase UI-Optimistic: Optimistic UI & Governance Gate Enforcement
- [x] **Principles & Allowlist:** Defined single source of truth `lib/optimistic/allowlist.ts` with 18 categorized operations. Verified that Pending-only actions throw an invariant violation if wired to optimistic updates.
- [x] **Reusable Hook Core:** Implemented `lib/optimistic/useOptimisticMutation.ts` (<200 lines, 0 heavy libraries):
  1. Pure `apply` function with `client_request_id` and `__pending: true` tagging.
  2. In-flight request deduplication ignoring rapid clicks or Enter spam.
  3. Single UUID v4 `Idempotency-Key` reuse across retries.
  4. Server truth reconciliation replacing temp items without duplicates or flicker.
  5. Rollback on failure with full input text restoration and derived count reversion.
  6. Out-of-order sequence protection (`currentSeqRef`).
  7. Client timeout (10s) with single auto-retry for unknown connection failures.
  8. Unmount abort via `AbortController`.
- [x] **Server Idempotency:** Implemented `idempotency_keys` table with unique constraint on `(user_id, key)` in PostgreSQL, `handleIdempotentRequest()` wrapper with `Idempotent-Replay: true` header, and 24h cleanup.
- [x] **UI Components:** Implemented `PendingBadge` (`border-2 border-dashed border-ink font-mono "SAVING…"`) and `InlineRetry` (`role="alert"` with plain language error, Retry, and Discard). Added to `docs/DESIGN_SYSTEM.md`.
- [x] **Feature Wiring:**
  - `/content/[id]`: Optimistic comment add/delete, tab badge derivation, input restoration on rollback, and strict `isDecisionPending` governance button protection on content approval.
  - `/guidelines`: Optimistic draft rule enable/disable and severity edits with `PendingBadge` and `InlineRetry`.
- [x] **Verification:**
  - `npm run check:tokens`: 60 files scanned, 0 errors.
  - `npm run check:types`: 100 files scanned, 0 errors.
  - `npm run lint`: 0 errors. All warnings in `lib/optimistic/**` and edited files fixed.
  - `npm test`: 17 test suites, 164 tests passing (100% PASS), including concurrent idempotency (`Promise.all`), authorization replay protection, and repeat PATCH/DELETE idempotency.
  - `npm run build`: All 33 routes compiled successfully, including `/api/v1/cron/cleanup-idempotency`.
  - `npx playwright test e2e/optimistic-ui.spec.ts`: 14/14 passing (offline handling, in-flight dedupe, navigate mid-flight safety, sequence preservation, plain-language HTTP errors, and 6 negative governance gates delayed 1.5s).
  - Performance & Bundle: React render median 13.35 ms (20 runs), hook gzip size 3.15 KB.


