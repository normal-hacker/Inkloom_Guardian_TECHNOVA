# PRD — Inkloom Guardian (Round 2: The Build)

> Status: draft v1 · 2026-11-04 · Owners: Riya (product), Ugesh, Raghvendra
> Planning document only. No product code existed when this was written; all code is written inside the official build window.

## 1. One-line summary
Inkloom Guardian checks content **before publication** against an organisation's approved guidelines, terminology, facts and assets, **explains every issue with the exact rule and source behind it**, suggests a fix that keeps the author's intent, and leaves **the final decision to a human**.

## 2. Problem
Organisations publish through many employees, agencies and AI tools. Wrong claims, outdated facts, inconsistent wording and off-brand material reach the public before anyone notices. Existing brand tools mostly store assets or enforce templates; few explain *why* something is wrong, cite the source, or keep a defensible record of who approved what.

### Evidence (Round 1 interviews, n = 6)
Freelance creator · startup marketing manager · legal reviewer · agency account manager · senior brand manager at a large brand · content-operations lead.

What they asked for (these drive the requirements below):
1. Every flag shows the **exact rule and source** (no "the AI said so").
2. An **audit trail tied to the exact content version** that was approved.
3. **Versioned client/brand rules** (rules change; old approvals must stay explainable).
4. **No auto-approval** — a person always decides.
5. A way to find **stale approved content** when rules or facts change.

Honest caveat: n = 6 is small and self-selected. State this in the submission; do not claim statistical significance.

## 3. Users and roles
| Role | Who | Needs | Can do |
|---|---|---|---|
| Creator | Marketer, freelancer, agency writer | Fast feedback, fixes that keep their intent | Submit content, view findings, accept/reject suggestions on own content, revise, comment |
| Reviewer | Brand/legal/content reviewer | See issues + sources, decide quickly | Everything a creator can on any content, resolve/override findings with reason, approve / request changes / reject |
| Manager | Brand manager / content-ops lead | Governance view, rule upkeep | Everything a reviewer can, plus edit guidelines/rules/facts, view insights and audit log |

## 4. Goals and non-goals (Round 2)
**Goals**
- G1. The core workflow runs end to end, deployed, openable without sign-in (see §9 for how).
- G2. Every finding is explainable: category, severity, quoted span, explanation, rule/fact ID, source document + section, suggested fix.
- G3. Human control is enforced by the system, not just promised (approval is impossible while blocking issues are unresolved; AI never approves).
- G4. Reliable by design: deterministic checks always run; AI failure never produces a false "all clear".
- G5. Visible progress against the Round 1 plan, with deviations documented.

**Non-goals (Round 2)** — do not build these now:
- Payments, billing, SSO, email notifications, mobile app.
- Multi-brand workspaces, stale-content re-audit, full visual/logo analysis (these are Round 3 improvements — see §8).
- Auto-publishing to any channel.

## 5. Core workflow (this is what is scored)
```
Manager loads brand pack ──► Creator submits content ──► Guardian checks
(guidelines, terms,          (paste text / upload          (rule engine + AI,
 approved facts)              .txt .md .docx .pdf)           validated, cited)
                                                                │
        Published-ready ◄── Human decision ◄── Findings explained + fixes suggested
        (approved version      (reviewer approves /           (creator revises → new
         + audit record)        requests changes / rejects)    version → re-check)
```
Step by step:
1. Manager has an active **rule set** (versioned), glossary and approved facts (seeded brand pack + editable).
2. Creator creates a content item (paste or upload). System extracts text, stores **version 1** with a SHA-256 hash.
3. Creator clicks **Check**. Rule engine runs; AI analyser runs on redacted text; validator drops any finding that is not grounded; results saved as a **review run** pinned to the rule-set version.
4. Creator sees highlighted text and finding cards: what, why, which rule/source, suggested rewrite. They can apply a suggestion (creates a new version) or dispute it.
5. Creator submits for review. Reviewer sees findings, comments, history. Each finding is **accepted, fixed, dismissed (reason required) or overridden (reason required)**.
6. Reviewer chooses **Approve / Request changes / Reject**. Approve is blocked while any `blocker` finding is open.
7. Everything is written to the **audit log** (who, what, when, content hash, rule-set version, AI model used).
8. Manager opens **Insights**: recurring violations, categories over time, rules that are frequently overridden (possible unclear guidelines).

## 6. Functional requirements
Priority: **P0** = must work for Round 2 · **P1** = should · **P2** = nice. Each ID maps to a feature in `Features.md`.

| ID | Requirement | Pri |
|---|---|---|
| FR-01 | Login with JWT, three roles, role-based access; seeded demo accounts | P0 |
| FR-02 | One-click demo access (no password typing) + public read-only sample report so links open without sign-in | P0 |
| FR-03 | Import/define brand guidelines: source documents, YAML rules, glossary (preferred/banned terms), approved facts | P0 |
| FR-04 | Versioned rule sets (draft → active → archived); a review run pins the version it used | P0 |
| FR-05 | Content intake: paste text; upload `.txt .md .docx .pdf`; images accepted with alt-text check only | P0 |
| FR-06 | Deterministic rule engine: banned/preferred terms, regex, numeric/claim vs approved fact, accessibility basics | P0 |
| FR-07 | AI analyser for tone, messaging and unsupported claims, constrained to supplied rules/facts, JSON-schema output | P0 |
| FR-08 | Finding validator: reject findings with unknown rule/fact IDs or quotes not present in the text | P0 |
| FR-09 | Each finding shows category, severity, quote, explanation, rule ID, source + section, suggestion, confidence | P0 |
| FR-10 | Suggestions never auto-applied; creator applies explicitly → new version | P0 |
| FR-11 | Review workflow: submit, comment, resolve/dismiss/override with reason, approve/request changes/reject | P0 |
| FR-12 | Approval blocked while blocker findings are open; AI can never approve | P0 |
| FR-13 | Revision history with side-by-side diff | P1 |
| FR-14 | Audit log tied to exact content hash + rule-set version | P0 |
| FR-15 | Insights: top violated rules, category trend, override rate per rule, time-to-approve | P1 |
| FR-16 | AI/external-service disclosure banner; PII redaction before any external call | P0 |
| FR-17 | Graceful AI failure: rule-engine results still shown, run marked "AI check unavailable — not cleared" | P0 |
| FR-18 | In-app notification list (no email) | P2 |

## 7. Non-functional requirements
- **Reliability:** deterministic checks work with no network; target ≥ 99% of seeded demo checks succeed; AI timeout 20 s with one retry.
- **Performance:** rule-engine check on a 2,000-word document < 2 s; full check with AI < 30 s.
- **Security/privacy:** see `Auth.md`, `Agents.md`. Workspace data never sent to a provider without redaction; provider API keys only server-side.
- **Accessibility (our own UI):** WCAG 2.1 AA targets — keyboard navigable, contrast ≥ 4.5:1, labels on controls, no colour-only meaning (see `Design.md`).
- **Explainability:** a judge can click any finding and reach its rule and source in ≤ 2 clicks.
- **Cold start:** free-tier hosts sleep; add a wake-up step before demos/judging (see `Debugging.md`).

## 8. Round 3 — the three improvements we will name in the submission
They must be product capability, not cosmetics. They are deliberately **not built in Round 2** so they count as new work in Round 3.

1. **Stale-content re-audit.** When a rule set or approved fact changes, automatically re-check previously approved content and list items that would now fail, with a diff of which rule changed. *(From interview ask #5.)*
2. **Guideline-gap detector.** Cluster findings that reviewers repeatedly dismiss/override and draft a proposed clarification of the ambiguous rule for the manager to accept or reject. Extends Round 2 insights from "what" to "what to fix in the guidelines".
3. **Visual compliance check.** Analyse uploaded images for logo placement/clear-space, palette conformity and contrast using image processing plus a vision model, each finding tied to an asset rule. Round 2 only checks alt text.

*(Alternate if time forces a swap: multi-brand workspaces with per-client versioned rules.)*

## 9. "Links open without sign-in" plan
- Public landing page with a **"Try the demo"** button that logs in as a seeded role (demo mode, no real data).
- Public, read-only **sample review report** URL (seeded content, findings, decision, audit trail).
- Public GitHub repository, public README with architecture and disclosures.
- Test every submitted link in a private/incognito window before submitting.

## 10. Round 2 rubric mapping
| Criterion (pts) | How this product earns it |
|---|---|
| Core workflow end to end (30) | §5 flow works on the deployed link with seeded content; recorded run-through as backup |
| Technical depth and reliability (25) | Hybrid rule-engine + AI with validator, versioned rules, audit hashes, tests, graceful failure |
| Progress against the plan (20) | `Plan.md` deviation ledger compares Round 1 deck to what shipped, honestly |
| The three improvements named (15) | §8, concrete and specified in `Features.md` R3 section |
| Usability so far (10) | Clear review screen, demo mode, 3+ user tests with structured feedback |

## 11. Success metrics (measure, then report honestly)
- Seeded test set (≥ 20 documents): rule-engine finding precision ≥ 0.9; combined recall on planted issues ≥ 0.75.
- 0 findings shown without a valid rule/fact citation (enforced by validator, verified by test).
- 3–5 external testers complete submit → fix → review in < 10 min unaided; collect SUS-style score and comments.
- Round-trip: 100% of approvals have an audit record containing content hash and rule-set version.

## 12. Responsible design
- Human decides; AI suggests. No auto-approve, no auto-publish, no auto-rewrite.
- Show confidence and "AI-generated" labels on AI findings; deterministic findings are labelled "Rule".
- Redact emails, phone numbers and configured confidential terms before external calls; log what was sent (hash + size, not content) for each AI call.
- Disclosure page lists every external service and AI tool used in building and in the product.
- Known limitation to state: AI findings can be wrong; reviewers must be able to dismiss with a reason, and dismissals feed insights.

## 13. Risks (ranked)
1. **Scope overrun** — three people, short window. Mitigation: P0 only first; cut line in `Plan.md`.
2. **AI output unreliable or unavailable** — Mitigation: validator + deterministic fallback + mock provider for tests/demo.
3. **Deployment trouble near the deadline** — Mitigation: deploy a hello-world on day 1; deploy continuously.
4. **Judges can't open a link / host asleep** — Mitigation: §9, wake-up script, recorded backup.
5. **Weak differentiation vs Lytho/Adobe/Bynder** — Mitigation: lead with citations + audit-by-exact-version + human gate; do not claim to replace them.

## 14. Open decisions (confirm before coding)
- [ ] Build-window length and demo format (live vs video).
- [ ] LLM provider and API key availability (default: Anthropic Claude via env-configured model; mock provider otherwise).
- [ ] Hosting accounts: Vercel (frontend), Render/Railway (API), Supabase/Neon (Postgres).
- [ ] pgvector: deferred unless time remains (see `Architecture.md` §6).
