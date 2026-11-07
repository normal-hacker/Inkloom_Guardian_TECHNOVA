# Inkloom Guardian

**Check before you publish.** Inkloom Guardian reviews content against an organisation's approved brand guidelines, terminology, and facts, explains each issue with the exact rule and source citation, suggests context-aware fixes that preserve author intent, and enforces strict human reviewer approval gates.

---

## Public Demonstration Links (Zero Sign-In Required)

Judges can explore the product without creating any account:

| Page / Capability | Route | Description |
|---|---|---|
| **Product Landing** | `/` | Hero section, proof strip with interactive finding cards, and 4-step workflow |
| **Authentication & Personas** | `/login` | 1-click demo switcher (`Asha`, `Ben`, `Priya`, `Marcus`) with optional Google sign-in |
| **Content Repository** | `/dashboard` | Filterable content items with severity counts, status pills, and search |
| **Content Intake** | `/content/new` | Direct paste or drag-and-drop file upload (`.txt`, `.md`, `.docx`, `.pdf`, alt-text) |
| **Review Workspace** | `/content/[id]` | Split-pane workspace with quote highlights, finding cards, and human decision gate |
| **Brand Guidelines** | `/guidelines` | S1–S4 sources, 13 versioned rules, glossary, facts, and YAML import |
| **Governance Insights** | `/insights` | Telemetry on reviewer interventions, high-friction rules (≥40% dismissal), and turnaround |
| **Compliance Audit Trail** | `/audit` | Append-only cryptographic ledger with content SHA-256 hashes and CSV export |
| **Verified Sample Report** | `/demo-report` | Public proof artifact demonstrating version progression and human approval seal |
| **AI Disclosure & Privacy** | `/about-ai` | Data boundary matrix, PII redaction pipeline, and "AI never approves" policy |
| **Build Notes & Decisions** | `/build-notes` | Architectural consolidation rationale, deviations ledger, and Round 3 roadmap |
| **Deterministic Self-Test** | `/selftest` | In-browser test runner evaluating all 13 rules in pure TypeScript (<25ms) |
| **Paper Brutalist Styleguide** | `/styleguide` | Visual token gallery, base components, and interactive UI states |

---

## Design System v2 — Paper Brutalist

The interface adheres strictly to **Design System v2 ("Paper Brutalist")**:
- **Palette:** Off-white paper background (`--paper: #F4F3EE`), warm surface cards (`--surface: #FBFAF6`), and deep carbon ink (`--ink: #0A0A0A`).
- **Borders & Radius:** Strict 2px solid ink borders (`border-2 border-ink`) with zero border radius (`rounded-none`).
- **Hard Offset Shadows:** Flat, unblurred offset drop shadows (`shadow-hard: 4px 4px 0 var(--ink)`).
- **Typography:** Geist Sans for body text paired with Geist Mono for numbers, codes, citations, and hashes.
- **Color Fills:** Flat severity fills with black text: Blocker (`#FF6B5E`), Major (`#FFC93C`), Minor (`#9CC2FF`), Info (`#E4E2DA`), Approved (`#86E3A9`).
- **WCAG AA Compliance:** 100% of token pairings pass WCAG 2.1 AA/AAA contrast guidelines.

---

## What Inkloom Guardian Delivers

1. **Brand Knowledge Base:** Full Brightway Solar guideline sources (S1–S4), 13 active rules, glossary terms, and approved facts (F-001–F-006).
2. **Multi-Format Intake:** Ingests copy via text paste, markdown (`.md`), plain text (`.txt`), Word documents (`.docx`), and PDFs (`.pdf`), alongside image alt-text validation.
3. **Deterministic Rule Engine:** 13 pure TypeScript rules evaluating in <2ms with zero external network dependencies, exact UTF-16 character offsets, and targeted word diffing.
4. **Interactive Review Workspace:** Severity-coded underlines, interactive quote popovers, and 1-click suggestion application creating clean, unmutated version snapshots.
5. **Human Decision Workflow:**
   - **Blocker Gate:** Content strictly cannot be approved while any blocker finding remains unresolved.
   - **Self-Approval Prevention:** Authors are forbidden from approving their own drafts.
   - **Stale Check Protection:** Approvals require a complete check run on the latest content version.
   - **Mandatory Justification:** Blocker dismissals and content rejections require clear human rationale ($\ge 10$ characters).
6. **Immutable Audit Trail:** Append-only PostgreSQL triggers reject `UPDATE` and `DELETE` queries on audit and check run tables.
7. **Compliance Analytics:** Real SQL aggregations for manager visibility into rule friction, guideline gaps, and turnaround times.

---

## Anti-Drift CI Quality Guarantees

The project enforces three automated anti-drift gates:
- `npm run check:tokens`: Scans all UI files for raw hex colors or arbitrary pixel classes, ensuring strict token adherence.
- `npm run check:types`: Scans all files for duplicate domain interfaces, guaranteeing single-source-of-truth domain models.
- `npm run check:routes`: Verifies `docs/SITEMAP.md` mapped routes against actual Next.js App Router files.

---

## Test & Benchmark Results (15 Suites / 147 Tests)

```
Test Files  15 passed (15)
     Tests  147 passed (147)
  Duration  ~6.9s
```

### Golden Set Benchmark (Stage S7)
```
================ GOLDEN SET BENCHMARK RESULTS ================
Total Cases:     20
True Positives:  20
False Positives: 1
False Negatives: 0
Precision:       95.24% (Target >= 90%)
Recall:          100.00% (Target >= 90%)
F1-Score:        97.56%
==============================================================
```

---

## Quick Start

### 1. Installation & Environment
```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Verify configuration and anti-drift quality gates
npm run check:tokens
npm run check:types
npm run check:routes
```

### 2. Run Test Suite
```powershell
npm test
```

### 3. Production Build & Start
```powershell
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation Map

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements, problem statement, and scoring rubric alignment |
| [Architecture](docs/Architecture.md) | System components, Next.js consolidation, and architectural decisions |
| [Plan](docs/Plan.md) | Stage roadmap (S0–S7), progress logs, and deviation ledger |
| [Testing](docs/Testing.md) | 15 test suites, WCAG AA contrast matrix, and benchmark results |
| [Design System](docs/DESIGN_SYSTEM.md) | Paper Brutalist design system v2 specifications and token definitions |
| [Domain](docs/DOMAIN.md) | Single source of truth domain models and lifecycle states |
| [Sitemap](docs/SITEMAP.md) | Complete 12-route sitemap with access controls and status |
| [Database](docs/Database.md) | 16-table PostgreSQL schema, trigger definitions, and relational models |
| [API](docs/API.md) | REST API specification, Route Handlers, error envelopes, and request payloads |
| [Auth](docs/Auth.md) | Session token specification, RBAC matrix, and demo accounts |
| [Setup](docs/Setup.md) | Local development setup, Docker compose, and environment variables |

---

## Round 3 — The Three Forward Roadmap Commitments
1. **Stale-Content Re-Audit Pipeline:** Automatically re-scans historical approved campaigns whenever brand rules or fact sheets are updated.
2. **Guideline-Gap Detector:** Uses reviewer dismissal telemetry to highlight blind spots in brand guidelines.
3. **Multimodal Banner Inspection:** Analyzes layout balance, logo clearspace, and WCAG contrast on uploaded creative banners.

---

## Disclosures
- **AI Tools Used to Build:** Google Antigravity, Claude, and Gemini API for architecture planning and test suite generation.
- **AI in Product:** Pluggable AI adapter with PII redaction (email, phone, confidential codenames) and client-side deterministic validator. The AI never approves content.
- **Brand Data:** All guidelines and assets for "Brightway Solar" are simulated for hackathon evaluation.
