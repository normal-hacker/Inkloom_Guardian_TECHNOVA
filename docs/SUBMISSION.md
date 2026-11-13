# Inkloom Guardian: Hackathon Submission Artifact

**Project Name:** Inkloom Guardian  
**Team:** TECHNOVA (Ugesh Kumar, Raghvendra Basarwar, Riya Sharma)  
**Live Site:** [https://inkloomguardiantechnova.vercel.app](https://inkloomguardiantechnova.vercel.app)  
**Repository:** [https://github.com/normal-hacker/Inkloom_Guardian_TECHNOVA.git](https://github.com/normal-hacker/Inkloom_Guardian_TECHNOVA.git)  
**License:** MIT License  

---

## 1. Executive Summary & Problem Solved
Content marketing and brand communications are fraught with compliance risks: unsubstantiated claims, outdated facts, prohibited terms, and legal exposure from absolute guarantees. Generic LLM checkers hallucinate, lack exact citations, and cannot be trusted with autonomous approvals.

**Inkloom Guardian** enforces brand integrity with:
1. **Deterministic Speed & Citation:** 13 pure TypeScript governance rules and 6 verified facts evaluating locally in **< 1 ms** (measured 0.009 ms / 9 µs average per check) with zero network dependencies.
2. **Human-Sovereign Governance:** The AI never approves content. Strict database-level gates block approval while blocker findings exist, prevent self-approval by authors, require completed check runs on latest versions, and demand mandatory human justifications.
3. **Immutable Cryptographic Audit Trail:** Append-only PostgreSQL triggers reject `UPDATE` and `DELETE` on audit and check run tables, maintaining SHA-256 cryptographic hashes of every content version.
4. **Continuous Compliance (Round 3 Hardening):** Stale-content re-audits re-evaluate approved copy when brand guidelines change, and telemetry surfaces guideline blind spots.

---

## 2. Completed Features Inventory (13 Mapped Routes)

| Feature / Capability | Route | Status | Verification Evidence |
|---|---|---|---|
| **Landing & 1-Click Access** | `/` | **Complete** | 1-click persona buttons, proof strip with live finding cards, 00 removed, responsive |
| **Persona Auth & Matrix** | `/login` | **Complete** | Visible persona table (Asha, Ben, Priya, Marcus), Paper Brutalist fallback, Google auth |
| **Content Repository** | `/dashboard` | **Complete** | Status filter tabs (including 'Needs Re-Review'), search, blocker counters |
| **Multi-Format Intake** | `/content/new` | **Complete** | Plain text, Markdown, Word (`.docx`), PDF (`.pdf`), and image alt-text extraction |
| **Split-Pane Review Workspace**| `/content/[id]` | **Complete** | Severity highlights, interactive finding popovers, 1-click suggestions with diffing |
| **Brand Knowledge Base** | `/guidelines` | **Complete** | 4 source documents (S1–S4), 13 versioned rules, glossary, facts, and YAML importer |
| **Compliance Analytics** | `/insights` | **Complete** | SQL aggregations, top violated rules, turnaround metrics, and guideline gap detector |
| **Cryptographic Audit Ledger** | `/audit` | **Complete** | Append-only ledger, SHA-256 hashes, actor email tracking, CSV export |
| **Public Verified Report** | `/demo-report` | **Complete** | 55-min turnaround proof, masked reviewer email, client-side SHA-256 verifier |
| **AI Safety & Privacy** | `/about-ai` | **Complete** | Data boundary matrix, PII redaction pipeline, and "AI never approves" policy |
| **Architectural Build Notes** | `/build-notes` | **Complete** | Deviations ledger, AI & tools disclosure, known limitations, route inventory |
| **Deterministic Self-Test** | `/selftest` | **Complete** | In-browser 12-test harness, 52-case golden benchmark, "Paste Any Copy" analyzer |
| **Paper Brutalist Styleguide** | `/styleguide` | **Complete** | Visual token gallery, base components, WCAG AA contrast matrix |

---

## 3. Technical Architecture & Stack Details

- **Frontend & API Framework:** Next.js 15.5.29 App Router (React 19, TypeScript strict mode)
- **Database & ORM:** PostgreSQL (Neon cloud & local) managed via Drizzle ORM (16 tables, 5 append-only triggers)
- **Styling & Design System:** Custom Paper Brutalist design system v2 (2px solid ink borders, 0 border radius, hard 4px offset drop shadows, off-white paper background `--paper: #F4F3EE`)
- **Anti-Drift Quality Gates:**
  - `check:tokens`: Scans 65 UI files for raw hex colors or arbitrary pixel classes (0 errors)
  - `check:types`: Enforces single-source-of-truth domain models across 107 files (0 duplicates)
  - `check:routes`: Inspects and verifies all 13 mapped routes against `docs/SITEMAP.md`
- **Test Infrastructure:** Vitest test suite encompassing **23 suites and 221 tests** (100% PASS), plus Playwright E2E suites for optimistic UI and navigation.

---

## 4. Changes to Original Plan (Deviation Ledger)

Judges evaluate engineering discipline through reasoned architectural adaptation:

1. **Unified Next.js 15 App Router Replacing Python FastAPI:**
   - *Original Plan:* Python FastAPI container alongside a Node.js frontend.
   - *Actual Implementation:* Unified Next.js 15 App Router route handlers with Drizzle ORM.
   - *Technical Rationale:* Eliminates inter-process network latency, Docker container orchestrator fragility, duplicate schema definitions, and cross-origin CORS headers while delivering full end-to-end TypeScript type safety.
2. **In-Memory Dual-Execution Pure TypeScript Rule Engine Replacing Heavy Vector RAG:**
   - *Original Plan:* RAG / pgvector database embeddings for rule lookups.
   - *Actual Implementation:* Deterministic rule engine in pure TypeScript running both server-side and client-side on `/selftest`.
   - *Technical Rationale:* The 13 brand rules and 6 verified facts fit in memory. Rule matching runs in **< 1 ms** with zero latency, zero API costs, exact UTF-16 character offsets, and 0% risk of hallucinated citations.
3. **Pluggable & Graceful AI Adapter Replacing Direct LLM Dependency:**
   - *Original Plan:* Hard dependency on external LLM for all checks.
   - *Actual Implementation:* Deterministic engine runs first; optional Gemini API adapter provides advisory suggestions only when configured, degrading gracefully to mock mode if absent. PII is redacted before text leaves the system.

---

## 5. Round 3 Hardening Improvements: Real Status

### Feature A: Stale-Content Re-Audit Pipeline
- **Status:** **DELIVERED & LIVE**
- **Implementation:** Built `reAuditApprovedContent` service and `POST /api/v1/guidelines/re-audit`. When Fact `F-001` savings ceiling is updated (e.g. 20% → 15%), the system re-runs checks against all approved content. Affected campaigns transition to `'needs_review'` with fact diffs and audit ledger events.
- **Demo Path:** Click "Simulate Fact Update (20% → 15%) & Re-Audit" in `/guidelines?tab=facts`. Shows campaign flagged; view in `/dashboard` under "Needs Re-Review" tab.
- **Verification:** Unit tests in `frontend/tests/stale-audit.test.ts` passing.

### Feature B: Guideline-Gap Detector
- **Status:** **DELIVERED & LIVE**
- **Implementation:** Aggregates reviewer dismissal and override telemetry in `/insights`. Rules with dismissal rate $\ge 40\%$ are flagged as policy gaps with example snippets, suggested actions (e.g., relaxing headline rules), and seeded telemetry badges.
- **Verification:** Unit tests in `frontend/tests/guideline-gap.test.ts` passing.

### Feature C: Generalization Beyond Hand-Written Rules ("Paste Any Copy")
- **Status:** **DELIVERED & LIVE**
- **Implementation:** Added interactive "Paste Any Copy" dual-engine analyzer on `/selftest` and `/api/v1/content/quick-check`. Runs PII redaction, 13 deterministic rules, and pluggable AI advisory analysis on arbitrary copy. Includes 10 one-click unseen risky copy samples and segregates `RULE` (cited, deterministic) vs `AI-ADVISORY` (suggestion, human judgment required) findings.
- **Verification:** Unit tests in `frontend/tests/quick-check.test.ts` passing.

### Feature D: Multimodal Banner Inspection
- **Status:** **PLANNED** (Accurately documented on forward roadmap; no live page claims existence).

---

## 6. Benchmarks & Verification Evidence

- **Golden Benchmark Set:** **52 curated cases** in `frontend/tests/golden/labels.yaml`
  - **Precision:** 97.83%
  - **Recall:** 100.00%
  - **F1-Score:** 98.90%
  - **True Positives:** 45 | **False Positives:** 1 (documented compound overlap) | **False Negatives:** 0
- **Deterministic Rule Engine Speed:** **< 1 ms** (measured 0.009 ms / 9 µs average per check; 111,429 checks/sec)
- **Automated Test Suite:** **23 test suites, 221 tests passing** (`npm test`)
- **Compilation:** **33 Next.js routes compiled cleanly** (`npm run build`) with zero TypeScript or token errors.

