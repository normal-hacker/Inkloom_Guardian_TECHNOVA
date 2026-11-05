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

---

## 4. Submission Checklist (Round 2)

- [x] **Completed Features:** All 13 core features verified live across 11 routes.
- [x] **Technical Documentation:** `README.md`, `docs/Architecture.md`, `docs/Database.md`, `docs/API.md`, `docs/Testing.md`.
- [x] **Deviation Ledger:** Documented above with clear rationale.
- [x] **Evaluation Evidence:** Golden Set benchmark table (20 test cases, 95.24% Precision, 100% Recall).
- [x] **Round 3 Commitments:** Stale-content re-audits, guideline gap detection, and visual compliance analysis.
- [x] **Zero Errors:** `npm test` (74/74 passing), `npm run typecheck` (0 errors), `npm run lint` (0 errors), `npm run build` (29/29 routes compiled).
