# Plan — Implementation Roadmap (Round 2)

> The build-window length is not yet known. This plan is written in **milestones with priorities and a cut line**, not fixed dates. Once the window is confirmed, convert M0–M7 into time boxes (rule of thumb below).

## 0. Ground rules
- Code only inside the official window. Commit early and often (judges can inspect history). No force-pushes to `main`.
- Deploy a skeleton in M0 and keep it deployed. A working simple product beats a broken ambitious one.
- **Cut line:** M0–M5 are required for a convincing Round 2. M6–M7 are valuable but droppable. Never cut M5 (human decision gate) or the validator.

## 1. Team split
| Member | Owns | Also |
|---|---|---|
| Ugesh | DB models, rule engine, analyser, validator, review service, audit, tests for these | Seed brand pack with Riya |
| Raghvendra | Next.js app, review workspace UI, API client, deployment, E2E | Auth wiring |
| Riya | Brand pack content (rules, facts, 20+ test documents), Design QA, user testing, README/disclosures, demo script, Round 3 write-up | Insights UI copy |
Pairing points: API contract (Ugesh + Raghvendra, M1), finding card UX (Raghvendra + Riya, M4).

## 2. Milestones
| # | Milestone | Deliverables | Exit test | Pri | Rule of thumb |
|---|---|---|---|---|---|
| M0 | Skeleton + deploy | Repo, docker-compose, FastAPI `/health`, Next.js page, Postgres connected, deployed on all three hosts, CI running lint+tests | Public URL shows page that reads from API/DB | P0 | 8% |
| M1 | Auth + data model | Alembic migrations (Database.md), JWT, roles, demo-login, seed script | Log in as 3 roles; role guards tested | P0 | 12% |
| M2 | Knowledge base + intake | Rule sets, YAML import, glossary, facts, content paste/upload, text extraction, versions | Upload docx/pdf → text stored with hash | P0 | 15% |
| M3 | Check pipeline | Rule engine, redaction, analyser (mock first, then real), validator, review runs, findings API | Planted-issue docs produce expected cited findings; AI off → "not cleared" | P0 | 25% |
| M4 | Review workspace UI | Highlighted text, finding cards, source popover, apply-suggestion → new version | A creator fixes a flagged claim in under 2 minutes | P0 | 15% |
| M5 | Human decision + audit | Resolve/dismiss/override with reason, submit, approve/request changes/reject, blocker gate, audit log UI | Approve blocked with open blocker; audit row has hash + rule-set version | P0 | 10% |
| M6 | Comments, history diff, insights | Comments, version diff, insights tiles, unclear-rules list | Insights reflect seeded + live data | P1 | 8% |
| M7 | Polish + evidence | Public sample report, About AI page, a11y pass, user tests (3–5), docs, demo video, submission form | All links open in incognito; checklist §5 ticked | P0 | 7% |
Total = 100% of the window. If the window is short, drop M6 first, then simplify insights to one tile.

## 3. Vertical-slice order inside M2–M5 (do this, not layer-by-layer)
1. Hard-code one rule (`CLAIM-001`) → paste text → finding appears in UI → approve. Ugly but end to end.
2. Add glossary terms, number-claim vs facts.
3. Add analyser with `MockProvider`, then swap in the real provider.
4. Add validator, then failure mode.
5. Add decisions/audit, then insights.

## 4. Deviation ledger (feeds "Explanation of changes made to the original plan")
Update this table as reality changes. Judges reward honest, reasoned deviations (Progress against the plan = 20 pts).

| # | Round 1 plan | Built / decided | Reason | Date |
|---|---|---|---|---|
| 1 | RAG with pgvector | Full active rule set in prompt + full-text fact retrieval; pgvector deferred | Small corpus; embeddings add cost, tuning and a second provider | 2026-11-04 |
| 2 | Stale-content check (interview ask) | Moved to Round 3 improvement #1 | Needs stable rule versions first; keeps Round 2 focused | 2026-11-04 |
| 3 | "Different content formats" | Round 2: text, md, docx, pdf, image alt-text; full visual checks in Round 3 | Scope/feasibility | 2026-11-04 |
| 4 | LLM provider open | Provider-agnostic interface; default configured in env; mock for tests | Avoid lock-in, enable offline demo | 2026-11-04 |
| 5 | Celery/queues (not in deck) | Persisted review-run state and polling in Next.js; no queue | Boring tech and fewer moving parts | 2026-11-04 |
| 6 | Next.js frontend + FastAPI backend | Single-file prototype (`index.html`) in Phase A; full-stack FastAPI/Next.js in Phase B | Hackathon time constraint; allows immediate judge evaluation with no server or sign-in friction | 2026-11-05 |
| 7 | LLM-powered AI analyser | Deterministic JS rule engine (13 rules, cited findings) in Phase A | Honesty requirement: eliminates hallucinated rulings; engine is 100% transparent and auditable | 2026-11-05 |
| 8 | Server-side PostgreSQL DB | `localStorage` persistence with memory fallback mirroring Postgres schema | Enables complete offline workflow and instant evaluation without database provisioning | 2026-11-05 |
| 9 | PDF/DOCX content extraction | `.txt` and `.md` via FileReader, images for alt-text check in Phase A | Browser FileReader limitations; full binary parsing deferred to server-side Phase B | 2026-11-05 |
_Add rows during the build._

## 5. Submission checklist (Round 2)
Required by the rules:
- [ ] **List of completed features** → `README.md` "Features completed" (only items that work live)
- [ ] **Technology and implementation details** → `Architecture.md` + README stack; list APIs, models, libraries, templates, external services
- [ ] **Explanation of changes made to the original plan** → §4 ledger
- [ ] **Three major improvements for Round 3** → `PRD.md` §8 (not cosmetic)
- [ ] Functional product on a **deployed link**, openable without sign-in
- [ ] Public/judge-accessible **source repo**
- [ ] Evidence of **user testing / structured feedback** (3–5 testers; form + results table)
- [ ] **Each team member's contribution** stated truthfully
- [ ] AI tools, templates and external services **disclosed**
- [ ] Every link tested in incognito; API awake (wake-up request) before judging

## 6. Scoring self-check (run before submitting)
| Criterion | Self-test |
|---|---|
| Core workflow (30) | Someone unfamiliar completes paste → check → fix → submit → approve on the live link without help |
| Technical depth/reliability (25) | Kill the AI key → app still works and says "not cleared"; try prompt injection text; run test suite green |
| Progress vs plan (20) | Ledger is honest and complete; deck v7 vs product comparison written |
| Three improvements (15) | Each has a 3–4 line spec, acceptance criteria and why it matters (from interviews) |
| Usability (10) | Testers' feedback summarised; top 3 issues fixed or listed |

## 7. Risk register
| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Window shorter than expected | Med | High | Apply cut line; start with M0–M3 vertical slice |
| LLM output messy | High | Med | Validator + mock + golden set |
| PDF/docx parsing edge cases | Med | Low | Limit supported inputs, show clear errors, test on 5 sample files |
| Free host sleep/cold start | High | Med | Wake-up script; mention in README; keep a recorded demo |
| One person bottleneck (backend) | Med | High | Raghvendra can run backend via mock provider; keep API contract stable |
| Rule-based detection too naive | Med | Med | Be honest in limitations; report precision on golden set |

## 8. Daily rhythm
10-minute stand-up (done / next / blocked) · merge by evening · deploy main · update ledger and README checkboxes · note decisions in `docs/` same day.
