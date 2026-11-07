# API — REST, JSON, `/api/v1`

Auto-generated OpenAPI is served at `/docs` (Swagger) and `/openapi.json`; link it in the submission so judges can browse endpoints without signing in.

## 1. Conventions
- Auth: `Authorization: Bearer <jwt>` except where marked **Public**.
- IDs are UUIDs. Times are ISO-8601 UTC.
- Errors use one shape:
```json
{"error":{"code":"approval_blocked","message":"2 blocker findings are open.","details":{"open_blockers":2},"request_id":"r_9f2c"}}
```
- Status codes: 200/201 ok · 204 no body · 400 bad request · 401 unauthenticated · 403 forbidden role · 404 · 409 state conflict · 413 file too large · 415 unsupported type · 422 validation · 429 rate limit · 502 AI provider failure (only for endpoints that require AI).
- **Idempotency:** Creation endpoints (`POST /api/v1/content/{id}/comments`, glossary, facts) accept an optional `Idempotency-Key: <UUID>` header. Stored responses are returned on replays with header `Idempotent-Replay: true`. Authorization is strictly verified before cached responses are returned. Expired keys are purged after 24 hours.
- Lists: `?limit=50&offset=0`, response `{"items":[…],"total":123}`.
- Roles: **C** creator · **R** reviewer · **M** manager. "any" = all authenticated.

## 2. Endpoint index
### Health and public
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Liveness |
| GET | `/health/ready` | Public | DB + provider status |
| GET | `/public/demo-report` | Public | Seeded read-only review (content, findings, decision, audit) |
| GET | `/public/ai-disclosure` | Public | JSON of services/tools used |

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Email + password → tokens |
| POST | `/auth/demo-login` | Public (only if `DEMO_MODE=true`) | `{"role":"reviewer"}` → tokens for seeded demo user |
| POST | `/auth/refresh` | refresh token | New access token |
| GET | `/auth/me` | any | Current user |

### Knowledge base (guidelines)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/guidelines/sources` | any / M | List / add a source document |
| GET | `/guidelines/sources/{id}` | any | Source with text (for "open source" popovers) |
| GET | `/rule-sets` | any | List versions |
| GET | `/rule-sets/active` | any | Active set with rules |
| POST | `/rule-sets` | M | Create draft (optionally copy active) |
| PUT | `/rule-sets/{id}/rules/{key}` | M | Edit a rule in a draft |
| POST | `/rule-sets/{id}/import-yaml` | M | Validate + import YAML rules into a draft |
| POST | `/rule-sets/{id}/activate` | M | Make active (archives previous) |
| GET/POST/PUT/DELETE | `/glossary` , `/glossary/{id}` | any / M | Terms |
| GET/POST/PUT/DELETE | `/facts` , `/facts/{id}` | any / M | Approved facts |

### Content
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/content` | any | List (creators see own; reviewers/managers see all). Filters: `status`, `owner`, `q` |
| POST | `/content` | C,R,M | Create from JSON `{title, content_type, text}` |
| POST | `/content/upload` | C,R,M | Multipart: `file`, `title`, `content_type`, `alt_text?` |
| GET | `/content/{id}` | any* | Item + current version |
| GET | `/content/{id}/versions` | any* | Version list |
| GET | `/content/{id}/versions/{n}` | any* | Single version |
| GET | `/content/{id}/diff?from=1&to=3` | any* | Word-level diff |
| POST | `/content/{id}/versions` | owner,R,M | New version `{text, change_note}` |
| POST | `/content/{id}/versions/apply-suggestion` | owner,R,M | `{finding_id}` → new version with that replacement applied |

\* creators only for own items.

### Reviews and findings
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/content/{id}/check` | owner,R,M | Start a check on current version → `202 {review_run_id}` |
| GET | `/review-runs/{id}` | any* | Status + counts (poll every 2 s) |
| GET | `/review-runs/{id}/findings` | any* | Findings (filters: `severity`, `category`, `status`, `origin`) |
| GET | `/findings/{id}` | any* | Finding + rule + source + decision history |
| POST | `/findings/{id}/decision` | owner (`fixed`,`dismissed` own low-severity), R,M (all) | `{decision, reason}` |
| GET | `/content/{id}/comments` | any* | List comments for item |
| POST | `/content/{id}/comments` | any* | Add comment `{body, version_id?}` (supports `Idempotency-Key`) |
| DELETE | `/content/{id}/comments/{commentId}` | author, M | Delete comment (idempotent, records audit row) |
| PATCH | `/content/{id}/comments/{commentId}` | author | Edit comment `{body}` (records audit row) |

### Decisions
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/content/{id}/submit` | owner | Move `checked → in_review` (requires a complete run on current version) |
| POST | `/content/{id}/decision` | R,M | `{decision:"approved"\|"changes_requested"\|"rejected", note}`; **409 `approval_blocked`** if blockers open; **409 `stale_check`** if the current version has no complete run |

### Insights and audit
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/insights/summary?days=30` | M,R | Totals, median time to approval, approval rate |
| GET | `/insights/top-rules?days=30` | M,R | Most-violated rules |
| GET | `/insights/categories?days=90` | M,R | Findings by category per week |
| GET | `/insights/unclear-rules?days=90` | M,R | Rules with high dismiss/override rate (min 5 findings) |
| GET | `/audit?entity=&actor=&from=&to=` | M,R | Audit log |
| GET | `/audit/export.csv` | M | CSV |

## 3. Key payloads

### POST `/auth/demo-login`
```json
// request
{"role":"reviewer"}
// 200
{"access_token":"eyJ…","refresh_token":"eyJ…","expires_in":3600,
 "user":{"id":"…","display_name":"Priya (Reviewer, demo)","role":"reviewer"}}
```

### POST `/content`
```json
{"title":"Spring launch blog","content_type":"blog",
 "text":"Our panels are the best on the market and guarantee 40% savings!"}
// 201
{"id":"c1…","status":"draft","current_version":{"version_no":1,"content_hash":"9b3c…"}}
```

### POST `/content/{id}/check` → 202
```json
{"review_run_id":"r7…","status":"running"}
```

### GET `/review-runs/{id}` (complete)
```json
{"id":"r7…","status":"complete","rule_set":{"id":"…","version":3},
 "ai":{"used":true,"provider":"anthropic","model":"<from env>"},
 "counts":{"blocker":2,"major":1,"minor":1,"info":0}}
```
When the AI failed: `"status":"rules_only_ai_failed"`, `"cleared":false`, `"notice":"AI check unavailable — not cleared."`.

### GET `/review-runs/{id}/findings`
```json
{"items":[{
  "id":"f1…","origin":"rule","category":"claim","severity":"blocker",
  "span":{"start":16,"end":42},"quote":"the best on the market",
  "explanation":"Superlatives such as 'best' need approved evidence.",
  "rule":{"key":"CLAIM-001","title":"Superlatives require evidence","rule_set_version":3},
  "source":{"id":"s1…","title":"Brand Voice Guide","version_label":"v4","section":"5.2"},
  "fact":null,
  "suggestion":"high-efficiency panels",
  "confidence":1.0,"status":"open"
 },{
  "id":"f2…","origin":"ai","category":"fact","severity":"blocker",
  "span":{"start":55,"end":68},"quote":"40% savings",
  "explanation":"Approved figure is 18–24% average household savings (2025 study). 40% is not supported.",
  "rule":{"key":"FACT-001","title":"Numeric claims must match approved facts","rule_set_version":3},
  "fact":{"key":"FACT-002","statement":"Average household savings were 18–24% (2025 customer study, n=412)"},
  "source":{"id":"s3…","title":"Approved Facts Sheet","version_label":"2025-Q3","section":"Savings"},
  "suggestion":"18–24% average savings","confidence":0.92,"status":"open"}],
 "total":2}
```

### POST `/findings/{id}/decision`
```json
{"decision":"dismissed","reason":"Quote is inside a customer testimonial, not our claim."}
// 200 → finding with new status and the decision row
// 422 if reason < 10 chars for dismissed/overridden
```

### POST `/content/{id}/decision`
```json
{"decision":"approved","note":"Claims corrected in v3."}
// 201
{"approval_id":"…","content_hash":"b81e…","rule_set_version":3,"status":"approved"}
// 409
{"error":{"code":"approval_blocked","message":"1 blocker finding is open.","details":{"finding_ids":["f2…"]}}}
```

## 4. Permission rules (enforced server-side)
1. Creators can read/write only their own content.
2. Only reviewer/manager may use `/content/{id}/decision`.
3. Only the owner or reviewer/manager may dismiss low-severity findings; `blocker` dismissal/override is reviewer/manager only and requires a reason.
4. Only manager may change rules, glossary, facts, rule sets.
5. A decision applies to a specific version; if a newer version exists the call returns `409 stale_check`.

## 5. Rate limits
Auth endpoints 10/min/IP · check endpoint 6/min/user · uploads 20/hour/user. Return `429` with `Retry-After`.

## 6. Versioning and change policy
Breaking changes bump the prefix (`/api/v2`). Keep `docs/API.md` in the same PR as any endpoint change. Contract tests (`tests/integration/test_contract.py`) compare the OpenAPI schema to the paths above.
