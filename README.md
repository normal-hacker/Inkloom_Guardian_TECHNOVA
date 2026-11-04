# Inkloom Guardian

**Check before you publish.** Inkloom Guardian reviews content against an organisation's approved guidelines, terminology and facts, explains each issue with the exact rule and source, suggests fixes that keep the author's intent, and leaves the final decision to a human reviewer.

> Hackathon: Inkloom AI — Brand Governance · **Round 2: The Build**
> Status: planning docs complete; implementation in progress (see `docs/Plan.md`).

## Links (fill in before submitting; test each in an incognito window)
| What | URL |
|---|---|
| Live app (no sign-in; use "Try the demo") | _TBD_ |
| Public sample review report | _TBD_ |
| API docs (Swagger) | _TBD_ |
| Source repository | _TBD_ |
| Demo video / walkthrough | _TBD_ |

## What it does
1. A manager loads the brand pack: guideline sources, versioned rules, glossary, approved facts.
2. A creator submits content (paste text or upload `.txt .md .docx .pdf`; images get an alt-text check).
3. The system runs deterministic rule checks plus an AI check constrained to the supplied rules and facts. A validator discards any finding that lacks a valid citation or an exact quote.
4. The creator sees highlighted text, plain-language explanations, the rule and source behind each flag, and suggested corrections (never auto-applied).
5. A reviewer resolves findings (dismiss/override needs a reason) and approves, requests changes, or rejects. Approval is impossible while a blocker is open.
6. Every action is written to an audit log tied to the exact content hash and rule-set version. Managers see insights on repeated mistakes and rules that reviewers keep overriding.

## Features completed
_Keep this list honest and current. Move items here only when they work on the deployed link._
- [ ] F1 Auth, roles, demo access
- [ ] F2 Brand knowledge base (sources, rules, glossary, facts, rule-set versions)
- [ ] F3 Content intake (paste, txt/md/docx/pdf, image alt text)
- [ ] F4 Deterministic rule engine
- [ ] F5 AI analyser + grounding validator
- [ ] F6 Findings with explanations, sources, suggestions
- [ ] F7 Review workspace UI
- [ ] F8 Human decision workflow (no auto-approval)
- [ ] F9 Comments and revision history with diff
- [ ] F10 Audit trail
- [ ] F11 Insights dashboard
- [ ] F12 AI disclosure and redaction
- [ ] F13 Public sample report and deployment

## Round 3 — three improvements we commit to
1. **Stale-content re-audit** when rules or facts change.
2. **Guideline-gap detector** that proposes clarifications for rules reviewers keep overriding.
3. **Visual compliance check** (logo, palette, contrast) for images using image analysis and a vision model.

## Tech stack
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
cp .env.example .env
docker compose up -d db
cd backend && pip install -e ".[dev]" && alembic upgrade head && python -m app.seed.seed
uvicorn app.main:app --reload            # http://localhost:8000/docs
cd ../frontend && npm install && npm run dev   # http://localhost:3000
```
Full steps: [`docs/Setup.md`](docs/Setup.md).

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
