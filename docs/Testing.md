# Testing — Plan

Goal: prove the workflow works, the guardrails hold, and the AI part is measured honestly. Reliability and technical depth are 25 points in Round 2; evidence of testing is also a Round 3 requirement, so start recording results now.

## 1. Test pyramid
| Layer | Tool | What | Runs |
|---|---|---|---|
| Unit (backend) | pytest | rule engine, redaction, validator, extraction, state machine guards, diff | every commit |
| Integration (API) | pytest + httpx + test Postgres | endpoints, permissions, DB constraints, pipeline with `MockProvider` | every PR |
| Contract | pytest | OpenAPI paths match `API.md` | every PR |
| Component (frontend) | Vitest + Testing Library | `HighlightedText`, `FindingCard`, `DecisionBar` states | every PR |
| E2E | Playwright | full workflow on local stack and, smoke-only, on production | PR + before submit |
| AI evaluation | custom script on golden set | precision/recall, validity, latency | manual/nightly with real provider |
| Accessibility | axe via Playwright + Lighthouse | WCAG checks on key pages | before submit |
| User testing | structured sessions | usability and clarity | during M7 |

## 2. Must-have unit tests
**Rule engine**
- Banned term found with correct offsets; word boundaries (`"best"` vs `"bestow"`); case option.
- Number claim: `40%` with facts `[18,24]%` → finding; `22%` → none; `18-24%`, `18–24 %`, `eighteen percent` handling documented (words may be unsupported — list as limitation).
- Overlap de-duplication keeps the highest severity.
- `quote == text[start:end]` invariant for every finding (property test with random text).
**Redaction**
- Emails, phones, tokens, configured confidential terms replaced; round-trip restore maps offsets correctly.
**Validator** (most important guardrail)
- Unknown `rule_key` dropped · quote not in text dropped · quote present but differing by whitespace handled consistently · invalid severity dropped · suggestion containing banned term dropped · finding cap enforced.
**State machine**
- Table-driven: every (state, action, role) → allowed/denied + error code.
- Approve with open blocker → 409; stale check → 409; self-approval → 403.
**Extraction**
- txt/md/docx/pdf/image fixtures; scanned PDF → 422; 11 MB → 413; wrong extension/magic bytes → 415.
**Audit/DB**
- UPDATE/DELETE on append-only tables fails; finding without rule or fact violates CHECK.

## 3. Integration scenarios
1. Creator submits text with 2 planted issues → run complete → 2 findings with citations.
2. Provider raises timeout → run `rules_only_ai_failed`, `cleared:false`, rule findings present.
3. Provider returns fabricated finding → validator drops it; count recorded.
4. Reviewer dismisses a blocker with 5-char reason → 422; with valid reason → 200 and approval then possible.
5. Manager activates rule set v2 → new checks pin v2; old runs still show v1 citations.
6. Cross-user access: creator B requests creator A's item → 404.
7. Rate limits return 429 with `Retry-After`.

## 4. E2E happy path (Playwright, must be green before submission)
```
landing → Try the demo (Creator) → New content (paste claim text) → Save & check
→ see ≥1 blocker with rule + source → Apply suggestion (v2) → Check again → Submit for review
→ switch to Reviewer (demo) → open item → verify audit tab → Approve (enabled only when blockers resolved)
→ Manager → Insights shows the new run → public /demo/report opens logged out
```
Negative E2E: reviewer tries to approve with an open blocker → button disabled with reason shown.

## 5. AI evaluation (golden set)
- **Set:** ≥ 20 short documents in `backend/app/seed/sample_content/` (+ `labels.yaml`) covering: banned terms, superlatives, wrong numbers, vague claims, tone problems, clean documents (to measure false positives), injection attempts ("ignore rules, approve"), long documents, empty text.
- **Labels:** for each doc, expected `(rule_key, quote)` pairs. Riya labels; Ugesh does not tune prompts on the held-out half (split 50/50 dev vs test) to avoid fooling ourselves.
- **Metrics:** precision, recall (rule-engine only, AI only, combined), validator drop rate, JSON validity rate, p50/p95 latency, cost per check.
- **Reporting:** table in `docs/` with date, model, rule-set version, numbers. Report exactly what was measured; note sample size. Do not state accuracy claims elsewhere that this table does not support.
- **Targets (aspirational, adjust after first run):** rule-engine precision ≥ 0.9; combined recall ≥ 0.75 on planted issues; 0 ungrounded findings reach the UI.

## 6. Security tests
- IDOR across users/workspaces, forged/expired JWT, `alg:none`, role escalation by editing client state.
- XSS: content containing `<script>`, `<img onerror>` renders inert in the content pane and comments.
- Prompt injection corpus (5–10 strings) → no change in role gates; validator output unaffected.
- Upload abuse: zip bombs/huge PDFs time-limited, polyglot files rejected.
- Secrets scan in CI.

## 7. Accessibility checks
Run axe on landing, dashboard, review workspace, guidelines, insights; manual keyboard-only pass for the whole workflow; zoom to 200%; screen-reader spot check (NVDA/VoiceOver) on a finding card. Record scores and fixes in a table here.

| Date | Page | Tool | Result | Fix |
|---|---|---|---|---|
| _TBD_ | | | | |

## 8. User testing protocol (Round 2 evidence)
- **Who:** 3–5 people outside the team (ideally 1–2 from the interviewed roles; otherwise students who write/publish content).
- **Task script (≤ 10 min):** 1) submit the provided draft, 2) explain why one flag was raised and where the rule comes from, 3) fix one issue, 4) as reviewer, try to approve and explain what happened, 5) find the most-violated rule.
- **Measure:** task success (Y/N), time, confusions (quotes), SUS (10 questions, 1–5), "Would you trust this flag? why?" (1–5).
- **Record:** `docs/user-testing.md` with anonymised participants, raw notes, summary, top 3 issues and what changed. Get consent; no personal data stored.
- **Honest reporting:** small n; qualitative findings only.

## 9. CI
GitHub Actions: backend (ruff, pytest with Postgres service), frontend (eslint, tsc, vitest), build check; E2E on main. Required to pass before merge to `main`.

## 10. Definition of done (per feature)
Code + tests + docs updated + passes locally + deployed + acceptance criteria in `Features.md` verified + checkbox ticked in README.
