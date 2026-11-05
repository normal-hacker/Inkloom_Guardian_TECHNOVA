PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

You are my senior full-stack engineer and my QA lead. I can't code. I'm building "Inkloom Guardian" for a hackathon (Round 2 = a working product judges can open from a public link with no sign-in). A basic one-page prototype already runs at localhost:3000 (a textarea, a "Check content" button and an empty "Findings" panel). It is NOT enough: it has no review workflow, roles, history, audit trail or persistence. We are turning it into the real product.

## Read first
Read everything in `docs/` before writing code: PRD.md, Architecture.md, Design.md, Database.md, API.md, Agents.md, Plan.md, Setup.md, Features.md, Auth.md, MCP.md, Integrations.md, Testing.md, Debugging.md, and ANTIGRAVITY_PROMPT.md.
- `ANTIGRAVITY_PROMPT.md` is the exact spec for: the seed brand pack (Brightway Solar rules, glossary, approved facts), the NUM-001 number-matching algorithm, seed content, and the 15 engine/workflow test cases. Use those sections as-is. **Ignore its "single HTML file / localStorage / no server" instructions** — they no longer apply.

## What we are building (the scored core workflow)
Content goes in → checked against approved guidelines, terms and facts → every issue is explained with the exact rule and source → fixes are suggested but never auto-applied → a human reviewer approves, requests changes or rejects → everything is recorded in an audit trail tied to the exact content version and rule-set version. Managers see insights on repeated mistakes and unclear guidelines. The AI never approves anything.

## Stack decision (this overrides Architecture.md's FastAPI choice)
Keep the framework the project already uses. First inspect the repo and tell me in 5 lines what it is. If it is Next.js (likely), build one TypeScript full-stack app: React UI + Route Handlers (`app/api/v1/...`) with the same endpoints, roles and error shape as API.md. Database: PostgreSQL via an ORM with migrations (Drizzle or Prisma — pick one, explain why in one line). Production DB: Supabase (used only as managed Postgres). Tests: Vitest (unit/integration), Playwright (E2E). Record this change in the deviation ledger in `docs/Plan.md` (reason: our existing prototype is already JS; one language, one deploy, faster for a 3-person team).

## Architecture rules (keep these boundaries — they make the UI restyle painless)
```
src/
  lib/engine/        # PURE functions, no DB, no network: rules, number-claims, redaction, validator, diff, hash
  lib/ai/            # provider interface + mock + real adapters + analyzer (prompt builder, JSON parse)
  lib/services/      # review pipeline, workflow/state machine, audit, insights, extraction
  lib/db/            # schema, migrations, seed, repositories
  lib/auth/          # session, roles, guards
  app/api/v1/        # thin route handlers: validate → call service → shape response
  app/(pages)/       # screens, data fetching only
  components/ui/     # presentational components, NO business logic (restyled later)
  styles/            # design tokens as CSS variables (restyled later)
```
UI rule: components accept data via props and call handlers; no fetch calls or rules inside `components/ui`. Every interactive element gets a stable `data-testid`. Use semantic HTML and labels now so accessibility is not retrofitted.

## Non-negotiable product rules
1. Deterministic rule engine always runs first and works with no network. AI is a second, optional layer.
2. Every finding is grounded: it must reference a rule (or approved fact), the rule-set version, a source document + section, an exact quote, and offsets where `text.slice(start,end) === quote`. Enforce in code and with a DB CHECK. Drop and log violators.
3. A run with no findings says "No issues found by the checks that ran. A human reviewer still decides." Never "approved" or "safe". If the AI layer is unavailable the run is `rules_only_ai_failed` and the UI says "AI check unavailable — not cleared".
4. Approval is human-only, blocked while any blocker is open, blocked if the current version has no complete run (`stale_check`), and blocked for the author's own content. Dismiss/override needs a reason ≥ 10 characters. Server-side enforcement, not just UI.
5. content_versions, review_runs, approvals, finding_decisions and audit_log are append-only (DB triggers + tests).
6. Prompt-injection safe: content is untrusted data; the validator and the role gates make injected instructions harmless.
7. Privacy: redact emails, phone numbers and workspace confidential terms before any external AI call; never send files; log hashes and token counts, not content. API keys only on the server, only from env. Never commit secrets (`.env*` in `.gitignore`).
8. Honesty: label deterministic findings "Rule", AI findings "AI" with confidence. Do not claim accuracy we have not measured. All demo data is invented.
9. Hackathon integrity: small, frequent commits with clear messages (judges read history); disclose AI-assisted work in the README.

## How you work in every stage
- Start with a short plan (≤ 10 lines). Then build. Then **run** the tests/commands yourself and show real output — never say "should work".
- If something needs me (accounts, keys, clicking in a dashboard), stop and give me numbered plain-language steps. Don't invent keys or fake success.
- Finish every stage with this report: (1) what was built, (2) commands you ran + results, (3) tests added and pass/fail counts, (4) anything not done or simulated, (5) bugs you know about, (6) the single next step. Then commit and wait for my next prompt.
- Do not restyle the UI or add features that are not in the stage. If you find a spec conflict, tell me and propose the fix; don't silently choose.

Reply "READY" and nothing else once you've read the docs and inspected the repo.
