# Inkloom Guardian

**Check before you publish.** Inkloom Guardian reviews content against an organisation's approved guidelines, terminology and facts, explains each issue with the exact rule and source, suggests fixes that keep the author's intent, and leaves the final decision to a human reviewer.

> Hackathon: Inkloom AI — Brand Governance · **Round 2: The Build**
> Status: **Phase A Prototype Complete** — A self-contained, zero-dependency, single-file application (`index.html`) running entirely client-side with full offline support, hash routing (`#/`), deterministic rule checking, role-based access control, and localStorage persistence. See `docs/Plan.md` deviation ledger for architecture details.

## Links (test each in an incognito window with no sign-in)
| What | URL |
|---|---|
| Single-file App | Open `index.html` directly in any modern browser |
| Public sample review report | `index.html#/demo-report` |
| About AI & Disclosures | `index.html#/about-ai` |
| Build Notes & Deviations | `index.html#/build-notes` |
| Automated Self-Tests | `index.html#/selftest` (15/15 tests passing) |

## What it does
1. A manager loads the brand pack: guideline sources (S1–S4), versioned rules (v1–v3), glossary, approved facts (F-001–F-006).
2. A creator submits content (paste text or upload `.txt`, `.md`, or image files with alt text).
3. The system runs a deterministic 13-rule engine in local JavaScript. Every finding includes exact start/end character offsets, quote slice verification, guideline citation, and suggestions.
4. The creator sees highlighted text with severity-coded underlines, plain-language explanations, and clickable "Open source" popovers.
5. A human reviewer resolves findings (dismiss/override requires a reason ≥ 10 chars) and approves, requests changes, or rejects. Approval is strictly blocked while any blocker is open, if the check is stale, or if the author attempts self-approval.
6. Every action writes to an immutable append-only audit log tied to the exact SHA-256 content hash and rule-set version. Managers inspect live compliance insights and export audit logs as CSV.

## Features completed
_Phase A single-file prototype implementation status:_
- [x] F1 Auth, roles, demo access (Creator Asha, Creator Ben, Reviewer Priya, Manager Marcus with permission matrix)
- [x] F2 Brand knowledge base (Sources S1–S4, 13 versioned rules, glossary terms, approved facts F-001–F-006, rule sets v1–v3)
- [x] F3 Content intake (Paste, `.txt`, `.md` file reader, image preview & required alt-text check; clear notice for DOCX/PDF)
- [x] F4 Deterministic rule engine (13 rules: tone, banned terms, capitalization, comparative claims, superlatives, guarantees, numerical fact-checking, confidentiality, alt text, ALL-CAPS)
- [ ] F5 AI analyser + grounding validator (Deferred to Phase B full-stack; deterministic engine used for 100% transparency)
- [x] F6 Findings with explanations, sources, suggestions (Exact slice verification, popover citation, diff suggestion)
- [x] F7 Review workspace UI (Desktop 2-column, mobile tabs, interactive highlights, filters by severity/category/status)
- [x] F8 Human decision workflow (No auto-approval; blocker gate, stale check gate, self-approval prevention)
- [x] F9 Comments and revision history with diff (Append-only versions, cryptographic SHA-256 digests, threaded comments)
- [x] F10 Audit trail (Append-only audit log with content hash and rule-set version, CSV export for Manager)
- [x] F11 Insights dashboard (Top violated rules, weekly category trends, most bypassed rules >50%, median approval time)
- [x] F12 AI disclosure and redaction (Transparent disclosure: Built with AI assistance: Antigravity (Google))
- [x] F13 Public sample report and deployment (Single-file `index.html` runs offline and without sign-in; public sample report at `#/demo-report`)

## Round 3 — three improvements we commit to
1. **Stale-content re-audit** when rules or facts change.
2. **Guideline-gap detector** that proposes clarifications for rules reviewers keep overriding.
3. **Visual compliance check** (logo, palette, contrast) for images using image analysis and a vision model.

## Phase A single-file note
**Phase A** is a fully working self-contained prototype: `index.html` (6 645 lines, ~256 KB). Open it by double-clicking or deploying to any static host (Netlify Drop, GitHub Pages, Vercel). No server, no sign-in, no network required. All 11 screens, 13 rules, role enforcement, localStorage persistence, SHA-256 hashing, and 15 automated self-tests run entirely in the browser.

**Phase B** (not yet started) will add the full Next.js + FastAPI + PostgreSQL stack documented in `docs/Architecture.md`.

## Tech stack (Phase A)
- Single HTML file — vanilla JS, inline CSS, zero external dependencies
- Hash router (`#/route`) for shareable URLs and browser Back/Forward support
- Web Crypto API (`crypto.subtle.digest`) + pure-JS SHA-256 fallback for content hashing
- `localStorage` key `inkloom_guardian_v1` (schema v1) with in-memory fallback if storage is blocked
- 13-rule deterministic brand engine: `runRules(text, ctx) → findings[]`
- Labelled everywhere as **"Rule engine (local, deterministic)"** — no LLM claims

## Tech stack (Phase B — planned)
Next.js 15 · TypeScript · Tailwind · shadcn/ui — FastAPI · Pydantic · SQLAlchemy · Alembic — PostgreSQL 16 — JWT auth — pluggable LLM provider (Anthropic default, mock for tests). Details: [`docs/Architecture.md`](docs/Architecture.md).

## Documentation map
| Doc | Purpose |
|---|---|
| [PRD](docs/PRD.md) | Product plan, requirements, rubric mapping |
| [Architecture](docs/Architecture.md) | Stack, pipeline, folder structure, deviations |
| [Design](docs/Design.md) | UI rulebook |
| [Database](docs/Database.md) | Tables and relationships |
| [API](docs/API.md) | Endpoints |
| [Agents](docs/Agents.md) | AI rules and guardrails |
| [Plan](docs/Plan.md) | Roadmap, deviation ledger, submission checklist |
| [Setup](docs/Setup.md) | Run locally |
| [Features](docs/Features.md) | Build guide per feature |
| [Auth](docs/Auth.md) | Login, JWT, roles |
| [MCP](docs/MCP.md) | Tool connections |
| [Integrations](docs/Integrations.md) | External services |
| [Testing](docs/Testing.md) | Test plan |
| [Debugging](docs/Debugging.md) | Troubleshooting |

## Quick start
```bash
# Phase A: just open the file — no install needed
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

**To deploy for judges (3 steps):**
1. Go to [Netlify Drop](https://app.netlify.com/drop) and drag-and-drop `index.html`.
2. Copy the generated `.netlify.app` URL.
3. Open it in an incognito window — the landing page should appear with no sign-in required.

**Phase B quick start (backend + frontend):**

## Team and contributions
| Member | Role | Contribution (update with real commits/PRs) |
|---|---|---|
| Ugesh Kumar | AI / Backend Engineer | _rule engine, analyser, validator, API, DB_ |
| Raghvendra Basarwar | Full-Stack / Product Builder | _frontend, integration, deployment_ |
| Riya Sharma | Product, UX & Pitch Lead | _brand pack, UX, user testing, docs, demo_ |

## Disclosures (required by event rules)
- **AI tools used to build:** Claude (planning docs, code assistance), Gamma (Round 1 deck), Perplexity (research), Antigravity (if used for code) — list exact usage per member before submitting.
- **AI in the product:** one LLM provider (set in config) receives redacted text only; see in-app **About AI** page.
- **Templates/boilerplate:** shadcn/ui components, framework starters — list exact ones here.
- **Data:** all demo content and the "Brightway Solar" brand pack are invented for this event.
- **Time window:** all product code was written inside the official build window; commit history shows this.

## Known limitations (honest list — update as you learn)
- Small user-research sample (6 interviews); not statistically representative.
- AI findings can be wrong or miss issues; humans must review. Accuracy is reported only on our own test set.
- Round 2 handles text-centred formats; images get alt-text checks only.
- Free-tier hosting may be slow on first request.

## Licence
_Choose before publishing (e.g. MIT) and keep dependency licences compatible._
