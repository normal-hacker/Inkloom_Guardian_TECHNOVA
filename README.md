# Inkloom Guardian

**Check before you publish.** Inkloom Guardian reviews content against an organisation's approved guidelines, terminology and facts, explains each issue with the exact rule and source, suggests fixes that keep the author's intent, and leaves the final decision to a human reviewer.

> Hackathon: Inkloom AI — Brand Governance · **Round 2: The Build (Completed)**
> Status: **Production-Grade Next.js 15 Full-Stack Application** — Unified Next.js 15.5.29 + React 19 + TypeScript architecture with Route Handlers (`app/api/v1/...`), Drizzle ORM PostgreSQL persistence with immutable audit triggers, pure deterministic 13-rule engine, role-based auth-lite with 1-click persona switching, and optional privacy-preserving LLM evaluation.

---

## Live Navigation & Routes
Judges can explore the application without setup or sign-in:

| Page / Route | Path | Description |
|---|---|---|
| **Landing Page** | `/` | Public product landing with demo quick access, 3-step workflow, and role personas |
| **Login / Persona Picker** | `/login` | 1-click demo persona switcher (`Asha`, `Ben`, `Priya`, `Marcus`) or password login |
| **Content Dashboard** | `/dashboard` | Filterable content repository with status badges, blocker counts, and quick actions |
| **Content Intake** | `/content/new` | Multi-format content intake: Text Paste or file upload (`.txt`, `.md`, `.docx`, `.pdf`, images) |
| **Interactive Workspace** | `/content/[id]` | 2-column split workspace: highlighted text with severity underlines, findings cards, citation popovers, 1-click suggestion application, and blocker-enforced human decision bar |
| **Brand Guidelines** | `/guidelines` | Sources (S1–S4), 13 active rules, glossary terms, approved facts (F-001–F-006), draft rule set editor, and YAML rule importer |
| **Compliance Insights** | `/insights` | Aggregated analytics: top violated rules, high-friction rules (>40% dismissal rate), AI hallucination drop rate, and turnaround times |
| **Immutable Audit Log** | `/audit` | Full cryptographically verified audit trail with content SHA-256 digests and 1-click CSV export |
| **About AI & Privacy** | `/about-ai` | Transparent privacy disclosure, PII redaction pipeline, and "AI never approves" policy |
| **Sample Review Report** | `/demo-report` | Public read-only review report with findings breakdown and decision history |
| **Build Notes & Roadmap** | `/build-notes` | Full architectural overview, deviations ledger, trade-offs, and Round 3 roadmap |
| **In-Browser Self-Tests** | `/selftest` | Client-side test runner executing deterministic engine and algorithm verification |

---

## Demo Personas & Credentials
The application includes pre-seeded demo accounts. Click any persona button on `/login` to sign in instantly with signed HMAC session tokens:

| Persona | Name | Role | Access Scope |
|---|---|---|---|
| **Asha** | Asha Patel | `creator` | Draft content, run checks, apply suggestions, submit for review (cannot approve) |
| **Ben** | Ben Cooper | `creator` | Secondary author persona for multi-user workflow and permission testing |
| **Priya** | Priya Nair | `reviewer` | Review submissions, resolve findings, request changes, approve compliant content |
| **Marcus** | Marcus Vance | `manager` | Full oversight: manage guidelines, import rules, inspect analytics, export CSV audit logs |

---

## Benchmark Results (Stage S7 Golden Set Evaluation)
Evaluated across 20 labelled test cases covering tone, terminology, superlatives, guarantees, numerical fact ranges (NUM-001), confidentiality, accessibility, injection attacks, and clean controls:

| Metric | Target | Measured Result | Status |
|---|---|---|---|
| **Precision** | $\ge 90\%$ | **95.24%** | PASSED |
| **Recall** | $\ge 90\%$ | **100.00%** | PASSED |
| **F1-Score** | $\ge 90\%$ | **97.56%** | PASSED |
| **True Positives** | - | 20 | - |
| **False Positives** | - | 1 | - |
| **False Negatives** | - | 0 | - |

---

## What Inkloom Guardian Does
1. **Brand Knowledge Base:** Loads Brightway Solar guideline sources (S1–S4), 13 versioned rules, glossary, and approved facts (F-001–F-006).
2. **Multi-Format Intake:** Ingests copy via text paste, markdown (`.md`), plain text (`.txt`), Word documents (`.docx`), and PDFs (`.pdf`), alongside image alt-text extraction.
3. **Deterministic Rule Engine:** Executes 13 deterministic pure TypeScript rules with zero external network dependencies. Extracts UTF-16 character offsets, verifies quote slices, provides source citations, and computes targeted word-level diff suggestions.
4. **Interactive Review Workspace:** Renders severity-coded underlines (blocker, major, minor, info), interactive quote popovers, and 1-click suggestion application creating clean, unmutated version snapshots.
5. **Human Decision Workflow:** Enforces rigorous safety gates:
   - **Blocker Gate:** Content cannot be approved while any blocker finding remains unresolved.
   - **Self-Approval Prevention:** Authors are forbidden from approving their own content.
   - **Stale Check Protection:** Approvals require a complete check run on the latest content version.
   - **Mandatory Justification:** Blocker dismissals and content rejections require clear human rationale ($\ge 10$ characters).
6. **Immutable Audit Trail:** PostgreSQL triggers reject `UPDATE` and `DELETE` queries on audit and check run tables, guaranteeing an unalterable compliance ledger exportable as CSV.
7. **Compliance Analytics:** Managers track rule friction, recurring violations, and turnaround durations to iteratively improve guidelines.

---

## Tech Stack & Architecture
- **Framework:** Next.js 15.5.29 (App Router) + React 19 + TypeScript 5.7
- **Styling & UI:** Tailwind CSS + Lucide Icons + Framer Motion
- **Database & ORM:** PostgreSQL 16 via Drizzle ORM with schema migrations, SQL triggers, and `pg-mem` test adapter
- **Deterministic Engine:** Pure TypeScript rule engine (`runRules`), regex word-boundary matchers, and proximity-weighted context windowing (`NUM-001`)
- **Crypto & Integrity:** Universal pure-JS SHA-256 digest calculation and HMAC-SHA256 stateless session tokens
- **File Ingestion:** Mammoth (`.docx`), PDF-Parse (`.pdf`), native UTF-8 streaming, and magic byte validation

---

## Quick Start & Verification

### 1. Installation & Environment Setup
```bash
# Clone the repository
git clone <repo-url>
cd Inkloom_Guardian/frontend

# Install dependencies
npm install

# Configure environment (root .env is loaded automatically)
cp ../.env.example ../.env
```

### 2. Database Migrations & Seeding
```bash
# Apply schema migrations
npm run db:migrate

# Seed Brightway Solar guidelines, demo accounts, and sample content
npm run db:seed
```

### 3. Run Test Suites
```bash
# Run all 74 unit, integration, golden-set, and security tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Run ESLint validation
npm run lint
```

### 4. Build & Start Production Server
```bash
# Compile production build
npm run build

# Start production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation Map
| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements, problem statement, and scoring rubric alignment |
| [Architecture](docs/Architecture.md) | System components, data flow, Next.js consolidation, and architectural decisions |
| [Plan](docs/Plan.md) | Stage roadmap (S0–S7), progress logs, and deviation ledger |
| [Testing](docs/Testing.md) | Complete test matrix, coverage metrics, and benchmark results |
| [Database](docs/Database.md) | 16-table PostgreSQL schema, trigger definitions, and relational models |
| [API](docs/API.md) | REST API specification, Route Handlers, error envelopes, and request payloads |
| [Agents](docs/Agents.md) | AI agent responsibilities, PII redaction pipeline, and safety boundaries |
| [Auth](docs/Auth.md) | Session token specification, RBAC matrix, and persona switching |
| [Setup](docs/Setup.md) | Local development setup, Docker compose, and environment variables |

---

## Disclosures
- **AI Tools Used to Build:** Google Antigravity, Claude, and Gemini API for design planning and test case authoring.
- **AI in Product:** Pluggable AI adapter with PII redaction (email, phone, confidential codenames) and client-side deterministic validator. The AI never approves content.
- **Brand Data:** All guidelines and assets for "Brightway Solar" are simulated for hackathon evaluation.
