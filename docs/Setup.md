# Setup — Run Inkloom Guardian locally

## 1. Prerequisites
| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Python | 3.12 | `python --version` |
| Node.js | 20 LTS or newer | `node --version` |
| Docker + Compose | recent | `docker compose version` |
| (optional) LLM API key | — | not needed with `LLM_PROVIDER=mock` |

## 2. Clone and configure
```bash
git clone <repo-url> inkloom-guardian && cd inkloom-guardian
cp .env.example .env
```

### `.env.example`
```ini
# --- Database ---
DATABASE_URL=postgresql+psycopg://guardian:guardian@localhost:5432/guardian

# --- API ---
APP_ENV=local                       # local | production
SECRET_KEY=change-me-long-random    # JWT signing key (>= 32 chars)
ACCESS_TOKEN_MINUTES=60
REFRESH_TOKEN_DAYS=7
CORS_ORIGINS=http://localhost:3000
DEMO_MODE=true                      # enables /auth/demo-login (demo data only!)
MAX_UPLOAD_MB=10

# --- AI ---
LLM_PROVIDER=mock                   # mock | anthropic
LLM_MODEL=                          # set when using a real provider
LLM_API_KEY=
LLM_TIMEOUT_S=20
LLM_MAX_RETRIES=1

# --- Web (frontend/.env.local) ---
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```
Never commit `.env`. `.gitignore` must list `.env`, `.env.local`.

## 3. Database
```bash
docker compose up -d db          # Postgres 16 on :5432
```
`docker-compose.yml` (db service): image `postgres:16`, env `POSTGRES_USER=guardian`, `POSTGRES_PASSWORD=guardian`, `POSTGRES_DB=guardian`, volume `pgdata`, healthcheck `pg_isready`.

## 4. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head                                   # create tables
python -m app.seed.seed                                # brand pack + demo users + sample content
uvicorn app.main:app --reload --port 8000
```
Check: open `http://localhost:8000/docs` and `GET /api/v1/health` → `{"status":"ok"}`.

## 5. Frontend
```bash
cd frontend
cp .env.example .env.local        # or create with NEXT_PUBLIC_API_URL
npm install
npm run dev                       # http://localhost:3000
```

## 6. Demo accounts (seed, local/demo only)
| Role | Email | Password |
|---|---|---|
| Creator | creator@brightway.demo | `Demo-Creator-1` |
| Creator 2 | creator2@brightway.demo | `Demo-Creator-2` |
| Reviewer | reviewer@brightway.demo | `Demo-Reviewer-1` |
| Manager | manager@brightway.demo | `Demo-Manager-1` |
In `DEMO_MODE=true` the landing page's **Try the demo** buttons log in without typing. **Disable `DEMO_MODE` and rotate these passwords for any non-demo deployment.**

## 7. Try it (2-minute smoke test)
1. Click **Try the demo → Creator**.
2. **New content** → paste: `Our panels are the best on the market and guarantee 40% savings!` → **Save & check**.
3. Expect blocker findings for the superlative and the unsupported 40% claim, each with a rule ID and source.
4. Click **Apply** on a suggestion → version 2 → **Check again** → **Submit for review**.
5. Log out, **Try the demo → Reviewer** → open the item → resolve any blocker → **Approve**.
6. Open **Audit** (reviewer) and **Insights** (manager).

## 8. Using a real LLM
```ini
LLM_PROVIDER=anthropic
LLM_MODEL=<model id from the provider's docs>
LLM_API_KEY=<your key>
```
Restart the API. In the run detail you should see provider + model. If the key is wrong, the run ends as `rules_only_ai_failed` and the UI says "not cleared".

## 9. Tests
```bash
cd backend && pytest -q                     # unit + integration (mock provider)
cd frontend && npm test                     # component tests
cd e2e && npx playwright install --with-deps && npx playwright test
```

## 10. Deploy (summary)
| Part | Host | Notes |
|---|---|---|
| DB | Supabase or Neon | Use the connection string with SSL (`?sslmode=require`) |
| API | Render or Railway | Start: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`; set env vars from §2; set `CORS_ORIGINS` to the web URL |
| Web | Vercel | Root `frontend/`; set `NEXT_PUBLIC_API_URL` to the API URL |
Run the seed once against the production DB (demo data only). Open every public link in an incognito window.

## 11. Common problems
See [`Debugging.md`](Debugging.md).
