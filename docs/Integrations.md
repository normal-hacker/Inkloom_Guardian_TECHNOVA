# Integrations — External Services

Principle: every external service is **optional to run locally**, replaceable, and **disclosed**. The event requires disclosure of APIs, models, libraries, templates and external services (Round 2 submission item).

## 1. Summary table
| Area | Service | Required? | Data it sees | Config |
|---|---|---|---|---|
| LLM | Anthropic API (default); `MockProvider` for tests/offline | Optional (deterministic rules work without) | Redacted content text + rules/facts (no PII, no files) | `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` |
| Database | PostgreSQL (Supabase or Neon in production; Docker locally) | Yes | All app data | `DATABASE_URL` |
| Hosting | Vercel (web), Render/Railway (API) | For deployment | Traffic | host dashboards |
| Source control / CI | GitHub, GitHub Actions | Yes | Code | repo settings |
| File storage | **None external in Round 2** — bytes in Postgres (≤ 10 MB) | — | — | `MAX_UPLOAD_MB` |
| Payments | **Not applicable** — product has no billing in Round 2 | — | — | — |
| Email/Slack | **Not in Round 2** (in-app notifications only); Slack is a Round 3 stretch | — | — | — |
| OpenAI / other LLMs | Not used; the provider interface allows adding one | — | — | — |

## 2. LLM provider
### Interface
```python
class LLMProvider(Protocol):
    name: str
    model: str
    def complete(self, *, system: str, user: str, json_schema: dict, timeout_s: int) -> LLMResult: ...
# LLMResult: text, input_tokens, output_tokens, latency_ms
```
### Implementations
- `AnthropicProvider` — official SDK, server-side key, JSON-only output enforced by prompt + Pydantic validation, `temperature=0`.
- `MockProvider` — deterministic fixtures for tests, CI and the keyless demo; **labelled "demo AI (mock)" in the UI and in `/about-ai`** so nobody mistakes canned output for a real model.
### Operational rules
- Timeouts 20 s, 1 retry, circuit breaker: after 3 consecutive failures skip AI for 60 s and report `rules_only_ai_failed`.
- Cost control: cap prompt size (≈ 6k tokens of content, chunk longer documents by section and merge), cap findings, cache by `(rule_set_id, content_hash)` so re-checks of unchanged text cost nothing.
- Retention: use the provider's no-training API terms; state them on `/about-ai`. Do not send anything not listed in `Agents.md` A6.

## 3. Database hosting
- Supabase or Neon, used **only as managed Postgres** (we do not use their auth).
- Enforce SSL; restrict IPs if the plan allows; separate DB for production vs. development.
- Run Alembic from the API start command; never edit tables by hand.

## 4. Hosting and CI/CD
| Step | Detail |
|---|---|
| CI (GitHub Actions) | On PR: lint (ruff, eslint), type-check (mypy-lite, tsc), backend tests with Postgres service, frontend unit tests |
| CD | Merge to `main` → Vercel and Render auto-deploy |
| Smoke | Post-deploy script hits `/health/ready` and the demo-login endpoint |
| Cold start | Free tiers sleep. `scripts/wake.sh` pings API + web; run it 5 minutes before judging/demos |

## 5. File handling libraries
`python-docx` (docx), `pypdf` (pdf text), `Pillow` (image metadata, later palette analysis). Parsing is server-side only; no remote fetching of URLs inside uploaded documents (prevents SSRF).

## 6. Dependency and licence register
Maintain a table in `README.md` credits: name, version, licence, purpose. Prefer MIT/Apache-2.0/BSD. Disclose templates/boilerplate (e.g. shadcn/ui component code, `create-next-app` starter) exactly.

## 7. Secrets management
- Local: `.env` (gitignored). Hosts: environment variables in dashboards.
- Rotate any key that ever appears in a commit or log; run `gitleaks` (or GitHub secret scanning) in CI.
- Separate keys for development and production; demo deployment uses a key with a low spend limit.

## 8. Data flow disclosure (copy to `/about-ai`)
> Text you submit is stored in our database. When an AI check runs, a **redacted copy** (emails, phone numbers and configured confidential terms replaced by placeholders) plus the relevant brand rules and approved facts are sent to the configured AI provider. Original files are never sent. AI results are suggestions; a human decides. In demo mode all data is fictional.

## 9. Future integrations (not Round 2)
Slack/Teams notifications, Google Docs / CMS plug-ins (check on publish), SSO (OIDC), S3-compatible storage for large assets, Guardian MCP server (`MCP.md`).
