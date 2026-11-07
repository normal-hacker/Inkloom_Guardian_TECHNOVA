# Inkloom Guardian

[![Live Demo](https://img.shields.io/badge/Live%20Demo-inkloomguardiantechnova.vercel.app-86E3A9?style=for-the-badge&logo=vercel&logoColor=black)](https://inkloomguardiantechnova.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-221%20Passing%20(23%20Suites)-86E3A9?style=for-the-badge)](https://inkloomguardiantechnova.vercel.app/selftest)
[![F1 Score](https://img.shields.io/badge/Golden%20Set%20F1-98.90%25-86E3A9?style=for-the-badge)](https://inkloomguardiantechnova.vercel.app/selftest)
[![Engine Speed](https://img.shields.io/badge/Rule%20Engine-%3C1ms%20(9µs%20avg)-86E3A9?style=for-the-badge)](https://inkloomguardiantechnova.vercel.app/selftest)

**Check before you publish.**  
Inkloom Guardian reviews marketing and product copy against approved brand guidelines, terminology, and facts.  
It executes 13 pure TypeScript governance rules locally in < 1 ms with exact source citations and UTF-16 character offsets.  
An optional Gemini AI adapter offers advisory phrasing suggestions on unstructured copy without ever approving content.  
Strict governance gates prevent authors from approving their own work and block approval while critical findings remain open.  
Every action is cryptographically sealed in an immutable, append-only PostgreSQL audit ledger with SHA-256 hashes.

---

## ⚡ Try as Reviewer in 1 Click (Zero Setup / Incognito Friendly)

Judges can test the complete end-to-end governance workflow without creating an account:

1. Open **[https://inkloomguardiantechnova.vercel.app](https://inkloomguardiantechnova.vercel.app)** in an incognito window.
2. Click **"Try Demo as Reviewer (1-Click)"** in the top navigation or hero section.
3. You will be instantly signed in as **Priya Sharma (Reviewer)** with full authorization to review, request changes, or approve content.

### Seeded Persona Governance Matrix

| Persona | Role | Primary Permissions & Governance Scope | 1-Click Access |
|---|---|---|---|
| **Asha** | Author / Creator | Can create and upload drafts; strictly prohibited from approving own submissions | Click "Asha (Author)" |
| **Ben** | Author / Creator | Can submit drafts, run checks, and apply suggestions; cannot approve content | Click "Ben (Author)" |
| **Priya** | Reviewer | Authorized to approve content, request revisions, and override findings with mandatory justification | Click "Priya (Reviewer)" |
| **Marcus** | Compliance Manager / Admin | Full oversight: manage brand rules, trigger stale-content re-audits, view immutable audit ledger | Click "Marcus (Admin)" |

---

## 🗺️ Verified Route Map (13 Routes · Zero Sign-In Required for Public Routes)

| Route | Type | Description |
|---|---|---|
| `/` | **Public** | Product landing page with live finding cards, 1-click persona switcher, and workflow |
| `/login` | **Public** | Persona role matrix, instant demo switcher, and optional Google OAuth |
| `/demo-report` | **Public** | Public verified audit artifact with 55-min turnaround, masked reviewer email, and client-side SHA-256 verifier |
| `/about-ai` | **Public** | Transparent AI disclosure, data boundary matrix, PII redaction pipeline, and "AI never approves" policy |
| `/build-notes` | **Public** | Architectural deviations ledger, AI & tools disclosure, known limitations, and 13-route inventory |
| `/selftest` | **Public** | In-browser test harness, 52-case golden benchmark telemetry, and live "Paste Any Copy" analyzer |
| `/styleguide` | **Public** | Paper Brutalist design system gallery, token palette, base components, and WCAG AA contrast matrix |
| `/dashboard` | **App** | Filterable content repository with status pills (including 'Needs Re-Review'), search, and blocker counts |
| `/content/new` | **App** | Multi-format intake supporting direct text paste, Markdown, Word (`.docx`), PDF (`.pdf`), and alt-text |
| `/content/[id]` | **App** | Split-pane review workspace with severity underlines, quote popovers, and 1-click suggestion application |
| `/guidelines` | **App** | Brand knowledge base: sources S1–S4, 13 rules, facts F-001–F-006, YAML importer, and Stale Re-Audit Demo |
| `/insights` | **App** | Real SQL telemetry: top violated rules, turnaround hours, and Guideline-Gap Detector (rules dismissed $\ge 40\%$) |
| `/audit` | **App** | Immutable append-only audit trail with SHA-256 content hashes, actor tracking, and CSV export |

---

## 🏗️ Architecture & Governance Guardrails

```mermaid
flowchart TD
    User([Content Author / Reviewer]) --> Intake[Multi-Format Intake /content/new]
    Intake --> PII[PII & Confidential Redactor]
    
    subgraph CoreEngine [Dual-Engine Analysis Layer]
        PII --> Engine[Deterministic Pure TS Rule Engine\n13 Rules + 6 Facts · < 1ms Latency\n0 Network Calls · 0 Hallucinations]
        PII -. Optional AI Key .-> AIAdapter[Pluggable Gemini AI Adapter\nAdvisory Suggestions Only\nLower Confidence · PII Redacted]
    end
    
    Engine --> Findings[Cited Findings with Exact Offsets & Suggestions]
    AIAdapter -. Advisory Findings .-> Findings
    
    Findings --> Workspace[Review Workspace /content/id\nSplit-Pane · Highlights · Diffing]
    
    subgraph HumanGate [Human Governance Gate]
        Workspace --> BlockerGate{Blocker Findings Open?}
        BlockerGate -- Yes --> BlockApproval[APPROVAL FORBIDDEN]
        BlockerGate -- No --> SelfApproval{Author Approving Own Draft?}
        SelfApproval -- Yes --> DenySelfApproval[SELF-APPROVAL FORBIDDEN]
        SelfApproval -- No --> ReviewerSignOff[Human Reviewer Sign-Off\nPriya Sharma]
    end
    
    ReviewerSignOff --> CryptographicSeal[SHA-256 Content Hash Computed]
    CryptographicSeal --> AuditLedger[(PostgreSQL Audit Ledger\nAppend-Only Triggers\nNO UPDATE · NO DELETE)]
    
    subgraph Round3Hardening [Round 3 Continuous Compliance]
        FactUpdate[Brand Fact Updated in /guidelines\ne.g. F-001 Savings 20% → 15%] --> ReAuditPipeline[Stale-Content Re-Audit Pipeline]
        ReAuditPipeline --> HistoricalCheck[Re-Scan Approved Campaigns]
        HistoricalCheck --> StaleFlag[Transition to 'Needs re-review'\nFact Diff Logged in Audit Trail]
        
        ReviewerTelemetry[Reviewer Dismissal Telemetry] --> GapDetector[Guideline-Gap Detector\nFlags Rules Dismissed ≥ 40%]
    end
```

---

## 🎨 Design System v2 — Paper Brutalist

The entire interface adheres to **Design System v2 ("Paper Brutalist")**:
- **Palette:** Off-white paper background (`--paper: #F4F3EE`), warm surface cards (`--surface: #FBFAF6`), carbon ink (`--ink: #0A0A0A`), and primary yellow accent (`--accent: #FFE500`).
- **Borders & Radius:** Strict 2px solid ink borders (`border-2 border-ink`) with zero border radius (`rounded-none`).
- **Hard Offset Shadows:** Flat, unblurred offset drop shadows (`shadow-hard: 4px 4px 0 var(--ink)`).
- **Typography:** Geist Sans for body text paired with Geist Mono for numbers, codes, citations, and cryptographic hashes.
- **Severity Fills:** Blocker (`#FF6B5E`), Major (`#FFC93C`), Minor (`#9CC2FF`), Info (`#E4E2DA`), Approved (`#86E3A9`).
- **WCAG AA Compliance:** 100% of token pairings pass WCAG 2.1 AA/AAA contrast guidelines.

---

## 📊 Benchmark & Test Credibility (23 Suites / 221 Tests)

```
Test Files  23 passed (23)
     Tests  221 passed (221)
  Duration  ~9.2s
```

### 52-Case Golden Set Benchmark Evaluation (Stage S7 & Round 3)
```
================ GOLDEN SET BENCHMARK RESULTS ================
Total Cases:     52
True Positives:  45
False Positives: 1
False Negatives: 0
Precision:       97.83% (Target >= 90%)
Recall:          100.00% (Target >= 90%)
F1-Score:        98.90%
==============================================================
```
- **1 Known False Positive:** In compound Case 19 (`best and guarantee 45% savings`), the 40-character sliding context window for `NUM-001` overlaps with the guarantee token.
- **Zero False Negatives:** 100% recall across all 52 cases.
- **Deterministic Latency:** Evaluates in **0.009 ms (9 µs)** average per check across 10,000 iterations (111,429 checks/sec).

---

## 🚀 Round 3 Hardening Status

| Improvement | Status | Description & Demo Path |
|---|---|---|
| **A. Stale-Content Re-Audit** | **DELIVERED & LIVE** | When brand facts change (e.g. F-001 savings 20% → 15%), approved campaigns are automatically re-evaluated and moved to `Needs re-review` with fact diffs and audit logs. Demo: Button in `/guidelines?tab=facts`. |
| **B. Guideline-Gap Detector** | **DELIVERED & LIVE** | Aggregates reviewer dismissals and overrides on `/insights`. Rules with dismissal rate $\ge 40\%$ are flagged as policy gaps with example snippets, suggested actions, and seeded telemetry labels. |
| **C. Generalization Beyond Rules ("Paste Any Copy")** | **DELIVERED & LIVE** | Interactive dual-engine copy tester on `/selftest` and `/api/v1/content/quick-check`. Runs PII redaction, 13 rules, and pluggable AI advisory adapter on arbitrary copy with 10 one-click unseen risky copy samples. |
| **D. Multimodal Banner Inspection** | **PLANNED** | Visual inspection of creative banner layout balance, logo clearspace, and WCAG color contrast (documented on roadmap). |

---

## 🛠️ Local Development & Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- PostgreSQL (or uses built-in in-memory `pg-mem` fallback automatically if `DATABASE_URL` is omitted)

### 2. Clone & Install
```bash
git clone https://github.com/normal-hacker/Inkloom_Guardian_TECHNOVA.git
cd Inkloom_Guardian_TECHNOVA/frontend
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inkloom"
SESSION_SECRET="inkloom-guardian-session-secret-key-32chars"
AI_PROVIDER="mock" # or "gemini"
AI_API_KEY=""      # Optional Gemini API Key
```
*(Note: If `DATABASE_URL` is not provided, the server automatically boots an in-memory PostgreSQL instance with seeded data!)*

### 4. Run Anti-Drift Quality Gates
```bash
npm run check:tokens   # Scans 65 UI files for raw hex/arbitrary px classes
npm run check:types    # Enforces single source of truth domain models
npm run check:routes   # Verifies all 13 mapped routes
```

### 5. Run Test Suite
```bash
npm test               # Runs all 23 Vitest suites (221 tests)
```

### 6. Build & Start Production
```bash
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚠️ Known Limitations & Disclosures

1. **Simulated Brand Corpus:** Brand guidelines, facts, and marketing copy depict the fictional entity "Brightway Solar" created purely for hackathon evaluation.
2. **Golden Benchmark Scope:** The golden benchmark consists of 52 curated cases covering edge cases, adversarial formatting, and clean controls.
3. **Hand-Authored Rule Logic:** The 13 core brand rules are authored in pure TypeScript regex and token window algorithms rather than auto-extracted from arbitrary PDFs.
4. **Advisory AI Boundary:** The Gemini AI adapter provides phrasing suggestions and advisory flags on unstructured copy. It **never approves content** and cannot bypass human blocker gates.
5. **Tools Used:** Anthropic Claude (architectural planning & test generation), Google Antigravity & Gemini API (context synthesis, coding assistance, and runtime AI adapter).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
