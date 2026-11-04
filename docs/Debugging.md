# Debugging — Find and Fix Errors Fast

## 1. Method (use every time)
1. **Reproduce** with the smallest input; write the exact steps.
2. **Locate the layer:** UI → API → service → DB → AI provider. Use the request ID to follow one request across logs.
3. **Form one hypothesis**, test it, change one thing at a time.
4. **Write a failing test** before the fix when possible; keep it afterwards.
5. **Record** non-obvious causes in §8 so the next person (or judge Q&A) benefits.
Do not "fix" by weakening guardrails (validator, role checks, approval gate).

## 2. Where to look
| Need | Where |
|---|---|
| API request trace | Response header `X-Request-ID` → search logs for it |
| API docs / try endpoints | `/docs` |
| SQL issues | `psql $DATABASE_URL` or Supabase SQL editor; `EXPLAIN ANALYZE` |
| What the AI saw/returned | `ai_calls` (input hash, status, raw_output) |
| Why a finding exists | `GET /findings/{id}` → rule, source, fact, decisions |
| Why approval failed | error `code` + `details` in the 409 body |
| Frontend errors | Browser console, Network tab, React error overlay |
| Deploy problems | Render/Railway logs, Vercel build/runtime logs |
Log format: JSON lines `{"ts","level","request_id","route","user_id","duration_ms","msg"}`. Never log passwords, tokens, full content text or API keys.

## 3. Symptom → cause → fix
### Setup and environment
| Symptom | Likely cause | Fix |
|---|---|---|
| `connection refused` to Postgres | Container not running / wrong port | `docker compose up -d db`; `docker compose ps`; check `DATABASE_URL` |
| `alembic: Can't locate revision` | Local DB ahead of migrations | New dev DB: drop volume `docker compose down -v` then `alembic upgrade head` |
| `relation "x" does not exist` | Migration not applied | `alembic upgrade head` |
| `extension "citext" does not exist` | Missing extension | `CREATE EXTENSION IF NOT EXISTS citext;` in the first migration |
| Frontend shows network error | Wrong `NEXT_PUBLIC_API_URL` or API down | Check URL has `/api/v1`; open `/health` in browser |
| CORS error in browser | Origin not in `CORS_ORIGINS` | Add exact origin (scheme + host, no trailing slash) and restart API |
| Works locally, 502/timeout on host | Free tier sleeping / wrong start command | Run `scripts/wake.sh`; check bind `0.0.0.0:$PORT` |
| SSL error to managed DB | Missing `sslmode=require` | Append to `DATABASE_URL` |

### Auth
| Symptom | Cause | Fix |
|---|---|---|
| 401 after a while | Access token expired and refresh not wired | Implement refresh on 401 once; else re-login |
| 401 always in production | Different `SECRET_KEY` across instances or deploys | Set one stable env var |
| 403 for a role that should work | Route decorated with wrong roles or token role stale | Check `require_role`; re-login to refresh claims; confirm DB role |
| Demo login 404 | `DEMO_MODE=false` | Set `true` only on demo workspace |

### Content intake
| Symptom | Cause | Fix |
|---|---|---|
| 415 on valid docx | MIME/magic mismatch | Check by extension + zip magic (`PK`) and `[Content_Types].xml` |
| Empty text from PDF | Scanned/image PDF | Expected: 422 with clear message; OCR is out of scope |
| Garbled characters | Wrong encoding | Try UTF-8, then UTF-8-sig, then cp1252 |
| Highlight offsets wrong | Newline normalisation changed text after offsets computed | Normalise **before** hashing and checking; store normalised `text_body` only |
| Highlights off by emoji/accents | Python code points vs JS UTF-16 units | Convert offsets to UTF-16 units for the client or send both; test with emoji |

### Check pipeline and AI
| Symptom | Cause | Fix |
|---|---|---|
| Run stuck `running` | Background task crashed | Check logs by request ID; wrap pipeline in try/finally that sets `error`; add a reaper job that marks runs `error` after 2 min |
| `rules_only_ai_failed` every time | Bad/missing key, wrong model id, timeout too low | `ai_calls.status/raw_output`; test key with a one-line script; confirm `LLM_MODEL` |
| AI findings never show | Validator drops all | Inspect drop reasons; usually quote whitespace/redaction mismatch — compare against restored text |
| Quote not found after redaction | Placeholders shifted offsets | Map spans through the redaction mapping; search quote in redacted text first, then translate |
| Invalid JSON from model | Prose around JSON, truncated output | Raise max tokens, tighten prompt, parse first JSON object, one retry with error message |
| Duplicate findings | Rule engine and AI both flagged same span | De-dup by overlapping span + rule category, prefer rule origin |
| Too many false positives | Rule regex too broad / AI over-reporting | Add examples to `prompt_hint`; adjust severity; measure on golden set before changing |
| Slow checks | Large documents, no caching | Chunk by section, cache by `(rule_set_id, content_hash)`, show progress |
| Prompt-injection text changed behaviour | Content not delimited / treated as instructions | Re-check delimiter & system rule 7; validator and role gates must still hold — add the string to the test corpus |

### Workflow and data
| Symptom | Cause | Fix |
|---|---|---|
| Approve button disabled unexpectedly | Open blocker or stale check | Read the inline reason; check latest version has a complete run |
| 409 `stale_check` | New version created after last run | Run **Check again** |
| Can't update an audit row | Append-only trigger | By design; add a corrective row instead |
| Two active rule sets | Missing partial unique index | Add index; archive extras in a migration |
| Insights empty | No data in window or seed missing | Seed history; widen `days` |
| Counts differ between UI and SQL | Counting dismissed/fixed findings | Align definition in `Insights` code and docs |

### Frontend
| Symptom | Cause | Fix |
|---|---|---|
| Hydration mismatch | Rendering dates/random IDs on server vs client | Format on client or use stable values |
| Highlight overlaps break layout | Overlapping spans rendered nested | Split text into non-overlapping segments with a list of finding IDs per segment |
| State lost on refresh | Token only in memory | Persist to `sessionStorage`, re-fetch `/auth/me` on load |
| Slow list pages | N+1 queries | Use `selectinload`/joins; add indexes listed in `Database.md` |

## 4. Quick commands
```bash
# API health and readiness
curl -s $API/health ; curl -s $API/health/ready
# Reproduce a check from the CLI
curl -s -X POST $API/content -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
  -d '{"title":"t","content_type":"blog","text":"Our panels are the best."}'
# Inspect latest AI calls
psql $DATABASE_URL -c "select created_at,status,latency_ms,input_tokens,output_tokens from ai_calls order by created_at desc limit 10;"
# Find findings without grounding (should be 0)
psql $DATABASE_URL -c "select count(*) from findings where rule_id is null and fact_id is null;"
# Run one test with output
pytest tests/unit/test_validator.py -k quote -x -vv
```

## 5. Debug flags
`LOG_LEVEL=debug` · `AI_DEBUG_STORE_RAW=true` (stores raw model output in `ai_calls`; **off** in production for real data) · `LLM_PROVIDER=mock` to isolate AI from the rest.

## 6. Pre-demo / pre-submission health check
- [ ] `scripts/wake.sh` returns 200 for web and API
- [ ] `/health/ready` shows DB ok and provider status
- [ ] Demo logins work for all three roles
- [ ] Happy path takes < 2 min and shows a blocker, a fix, an approval, an audit row
- [ ] Public report and repo links open in an incognito window
- [ ] Provider key present and spend limit sane (or mock labelled in UI)
- [ ] Backup recording of the demo ready

## 7. If something breaks during a live demo
1. Say what you see; do not hide it. 2. Switch to the recorded run-through or the public sample report. 3. Show `rules_only_ai_failed` handling as a feature if it is the AI that failed. 4. Fix after, add a test, log it in §8.

## 8. Incident log (fill during the build)
| Date | Symptom | Root cause | Fix | Test added |
|---|---|---|---|---|
| _TBD_ | | | | |
