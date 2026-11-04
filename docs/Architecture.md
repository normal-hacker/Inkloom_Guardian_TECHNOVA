# Architecture — Inkloom Guardian

## 1. Principles
1. **Deterministic first, AI second.** Rules we can compute are computed. AI only handles what rules cannot (tone, messaging, claim support) and is constrained to supplied material.
2. **Grounded or dropped.** A finding without a valid rule/fact citation and a real quote is discarded by the validator.
3. **Human gate in the data model.** Approval is a state transition that only a reviewer/manager can perform and only when no blocker is open.
4. **Immutable evidence.** Content versions, rule sets, review runs and audit rows are append-only.
5. **Boring tech.** Postgres + FastAPI + Next.js. No queues or microservices for Round 2.

## 2. Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query | Fast UI work, accessible primitives, matches Round 1 plan |
| Backend | FastAPI (Python 3.12), Pydantic v2, SQLAlchemy 2, Alembic | Team strength in Python/AI; typed schemas; auto OpenAPI docs for judges |
| Database | PostgreSQL 16 (managed: Supabase or Neon; local: Docker) | Relational integrity for audit; JSONB for rule definitions |
| AI | `LLMProvider` interface: Anthropic (default), Mock (tests/offline) | Swap providers without touching business logic |
| File parsing | `python-docx`, `pypdf`/`pdfplumber`, `Pillow` | Plain-text extraction, image metadata |
| Auth | JWT (PyJWT) + argon2id password hashing | See `Auth.md` |
| Tests | pytest, httpx, Vitest (UI units), Playwright (E2E) | See `Testing.md` |
| Deploy | Vercel (web), Render or Railway (API), Supabase/Neon (DB) | Free tiers, public URLs |

## 3. System diagram
```
┌──────────────┐   HTTPS/JSON   ┌────────────────────────────────────────────┐
│ Next.js web  │ ─────────────► │ FastAPI  /api/v1                           │
│ (Vercel)     │ ◄───────────── │  routers → services → repositories         │
└──────────────┘                │                                            │
                                │  services/                                 │
                                │   extraction ─► redaction ─► rule_engine   │
                                │                         └──► analyzer(LLM) │
                                │                               └► validator │
                                │   audit  insights  suggestions             │
                                └───────┬───────────────────────┬────────────┘
                                        │ SQL                   │ HTTPS (redacted text only)
                                 ┌──────▼──────┐         ┌──────▼───────┐
                                 │ PostgreSQL  │         │ LLM provider │
                                 └─────────────┘         └──────────────┘
```

## 4. Check pipeline (the heart of the product)
```
submit(content_version_id)
 1. load text of the version + active rule set + glossary + approved facts
 2. rule_engine.run(text) → deterministic findings          (always runs)
 3. redaction.apply(text) → redacted text + mapping
 4. analyzer.run(redacted, rules, facts)                    (may fail / time out)
      └ provider returns JSON → pydantic parse
 5. validator.filter(ai_findings, text, rule_ids, fact_ids)
      └ drop: unknown ID · quote not in text · bad schema · duplicate of rule finding
 6. de-redact quotes/spans → map back to original offsets
 7. persist review_run (pinned rule_set_version, model id, status)
      status = complete | rules_only_ai_failed
 8. audit.write('review.run', hash, rule_set_version, counts)
```
`rules_only_ai_failed` is **never displayed as clean**. The UI says "AI check unavailable — not cleared".

## 5. Review state machine
```
draft ──check──► checked ──submit──► in_review ──approve──► approved
                    ▲                    │ └─request_changes─► changes_requested
                    │                    └─reject──► rejected
                    └──── new version (creator revises) ◄──────────────┘
```
Guards enforced in the service layer (not only the UI):
- `approve` requires role ∈ {reviewer, manager}, review run exists for the **current** version, and no open `blocker` finding.
- Editing content creates a new version and invalidates the previous run for approval purposes.
- Approval record stores `content_hash` and `rule_set_id`.

## 6. Technical decisions and honest deviations from the Round 1 deck
| Decision | Detail | Deviation from deck? |
|---|---|---|
| Retrieval | The brand pack for the demo is small, so all active rules + relevant facts go into the prompt. Approved facts are selected by Postgres full-text search + keyword match. | Deck said RAG with pgvector. **Deferred**: pgvector adds an embedding provider, chunking and tuning with little visible benefit at this corpus size. Revisit in Round 3 if documents grow. |
| Rules | YAML imported into `rules.definition` JSONB, versioned by rule set | As planned |
| LLM | Provider-agnostic; model name from env | Deck left provider open |
| Files | Extracted text stored in DB; original file bytes stored in DB (≤ 10 MB) because free hosts have ephemeral disks | New |
| Realtime | Polling every 2 s on check status; no websockets | Simplification |
| Background work | FastAPI `BackgroundTasks` + status column; no Celery/Redis | Simplification |

Update this table whenever reality differs from the plan; it feeds the "changes made to the original plan" submission item.

## 7. Folder structure
```
inkloom-guardian/
├── README.md
├── docs/                      # the 15 planning/ops docs
├── docker-compose.yml         # postgres + api + web for local dev
├── .env.example
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/versions/
│   ├── app/
│   │   ├── main.py            # app factory, CORS, routers
│   │   ├── config.py          # pydantic-settings
│   │   ├── db.py              # engine, session
│   │   ├── deps.py            # auth + role dependencies
│   │   ├── models/            # SQLAlchemy tables (see Database.md)
│   │   ├── schemas/           # Pydantic request/response
│   │   ├── routers/           # auth, guidelines, rules, glossary, facts,
│   │   │                      # content, reviews, findings, comments,
│   │   │                      # decisions, insights, audit, public, health
│   │   ├── services/
│   │   │   ├── extraction.py  # txt/md/docx/pdf/image → text/metadata
│   │   │   ├── redaction.py
│   │   │   ├── rule_engine.py # deterministic checks
│   │   │   ├── analyzer.py    # builds prompt, calls provider
│   │   │   ├── validator.py   # grounding filter
│   │   │   ├── review_service.py  # pipeline + state machine
│   │   │   ├── suggestions.py
│   │   │   ├── insights.py
│   │   │   ├── audit.py
│   │   │   └── llm/{base.py,anthropic_provider.py,mock_provider.py}
│   │   └── seed/
│   │       ├── brand_pack.yaml      # rules, glossary, facts (fictional brand)
│   │       ├── sample_content/      # 20+ test documents with planted issues
│   │       └── seed.py
│   └── tests/{unit,integration,eval}/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # public landing + "Try the demo"
│   │   ├── demo/report/page.tsx       # public read-only sample report
│   │   ├── login/page.tsx
│   │   └── (app)/
│   │       ├── dashboard/page.tsx
│   │       ├── content/new/page.tsx
│   │       ├── content/[id]/page.tsx  # review workspace
│   │       ├── guidelines/page.tsx
│   │       ├── insights/page.tsx
│   │       ├── audit/page.tsx
│   │       └── about-ai/page.tsx      # disclosure
│   ├── components/{findings,editor,layout,ui}/
│   ├── lib/{api.ts,auth.ts,types.ts}
│   └── tests/
└── e2e/                        # Playwright specs
```

## 8. Environments and config
| Env | Web | API | DB |
|---|---|---|---|
| local | `localhost:3000` | `localhost:8000` | Docker Postgres |
| production | Vercel | Render/Railway | Supabase/Neon |

Config via environment variables only (see `Setup.md` / `.env.example`). No secrets in the repo.

## 9. Observability
- Request ID middleware; JSON logs (`level, request_id, route, user_id, duration_ms`).
- `ai_calls` table: provider, model, input hash, token counts, latency, status, raw output (kept for debugging, purge after the event).
- `/api/v1/health` (liveness) and `/api/v1/health/ready` (DB + provider reachability).

## 10. Security architecture summary
Server-side API keys; JWT bearer auth; role checks in dependencies; redaction before external calls; CORS allow-list; upload type/size limits; rate limiting on auth and check endpoints; content treated as untrusted data in prompts. Details: `Auth.md`, `Agents.md`.
