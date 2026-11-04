# Architecture — Inkloom Guardian

## 1. Principles
1. **Deterministic first, AI second.** Rules we can compute are computed. AI only handles what rules cannot (tone, messaging, claim support) and is constrained to supplied material.
2. **Grounded or dropped.** A finding without a valid rule/fact citation and a real quote is discarded by the validator.
3. **Human gate in the data model.** Approval is a state transition that only a reviewer/manager can perform and only when no blocker is open.
4. **Immutable evidence.** Content versions, rule sets, review runs and audit rows are append-only.
5. **Boring tech.** PostgreSQL + one Next.js TypeScript app. No queues or microservices for Round 2.

## 2. Stack
| Layer | Choice | Why |
|---|---|---|
| Application | Next.js 15 (App Router + Route Handlers), TypeScript strict mode, React | One language and one deploy target for the three-person team |
| Database | PostgreSQL 16 (managed: Supabase; local: Docker), Drizzle ORM + SQL migrations | SQL-first schema and explicit migrations keep constraints auditable |
| AI | `LLMProvider` interface: Anthropic (default), Mock (tests/offline) | Swap providers without touching business logic |
| File parsing | TypeScript extraction adapters (formats added in S3) | Keep parsing in the application runtime |
| Auth | Signed session cookie + role guards | See `Auth.md`; simulated demo mode is not production auth |
| Tests | Vitest (unit/integration), Playwright (E2E) | See `Testing.md` |
| Deploy | Vercel (app), Supabase (Postgres) | One app deployment and a managed database |

## 3. System diagram
```
┌──────────────┐   HTTPS/JSON   ┌────────────────────────────────────────────┐
│ Next.js app  │ ─────────────► │ Route Handlers /api/v1                     │
│ (Vercel)     │ ◄───────────── │  routes → services → repositories          │
└──────────────┘                │                                            │
                                │  src/lib/                                  │
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
| Database access | Drizzle ORM with explicit SQL migrations | SQL-first schema and constraints remain reviewable |
| Rules | YAML imported into `rules.definition` JSONB, versioned by rule set | As planned |
| LLM | Provider-agnostic; model name from env | Deck left provider open |
| Files | Extracted text stored in DB; original file bytes stored in DB (≤ 10 MB) because free hosts have ephemeral disks | New |
| Realtime | Polling every 2 s on check status; no websockets | Simplification |
| Background work | Persisted review-run state and polling; no queue in Round 2 | Simplification |

Update this table whenever reality differs from the plan; it feeds the "changes made to the original plan" submission item.

## 7. Folder structure
```
inkloom-guardian/
├── README.md
├── docs/                      # the 15 planning/ops docs
├── docker-compose.yml         # local PostgreSQL
├── .env.example
├── frontend/
│   ├── app/
│   │   └── api/v1/            # thin Route Handlers
│   ├── src/lib/
│   │   ├── engine/            # pure deterministic checks
│   │   ├── ai/                # provider interface + analyzer
│   │   ├── services/          # workflow, audit, insights, extraction
│   │   ├── db/                # Drizzle schema, migrations, seed
│   │   └── auth/              # sessions, roles, guards
│   ├── components/ui/         # presentational components
│   ├── styles/
│   ├── tests/                 # Vitest
│   └── e2e/                   # Playwright specs
```

## 8. Environments and config
| Env | Web | API | DB |
|---|---|---|---|
| local | `localhost:3000` | Next.js Route Handlers on `localhost:3000` | Docker Postgres |
| production | Vercel | Next.js Route Handlers on Vercel | Supabase |

Config via environment variables only (see `Setup.md` / `.env.example`). No secrets in the repo.

## 9. Observability
- Request ID middleware; JSON logs (`level, request_id, route, user_id, duration_ms`).
- `ai_calls` table: provider, model, input hash, token counts, latency, status, raw output (kept for debugging, purge after the event).
- `/api/v1/health` (liveness) and `/api/v1/health/ready` (DB + provider reachability).

## 10. Security architecture summary
Server-side API keys; JWT bearer auth; role checks in dependencies; redaction before external calls; CORS allow-list; upload type/size limits; rate limiting on auth and check endpoints; content treated as untrusted data in prompts. Details: `Auth.md`, `Agents.md`.
