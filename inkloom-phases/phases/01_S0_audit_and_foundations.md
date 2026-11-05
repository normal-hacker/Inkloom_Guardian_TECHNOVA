PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

# S0 — Audit and foundations (no features yet)
1. Inspect the existing project: framework, package manager, folders, how it runs, what the current page does, any API, any secrets in the code. Report findings.
2. Create the folder structure from the Master Prompt without breaking the running page. Add: TypeScript strict mode, ESLint, Prettier, Vitest, Playwright config, `.env.example` (DATABASE_URL, SESSION_SECRET, DEMO_MODE, AI_PROVIDER=mock, AI_MODEL, AI_API_KEY, AI_TIMEOUT_S, MAX_UPLOAD_MB), `.gitignore` for env files, npm scripts: `dev`, `build`, `lint`, `test`, `e2e`, `db:migrate`, `db:seed`.
3. Add `/api/v1/health` returning `{status:"ok"}`; add request-ID handling and the error shape from API.md.
4. Add a GitHub Actions workflow that runs lint + test + build.
5. Update `docs/Plan.md` deviation ledger with the stack row. Commit: "S0: foundations".
Acceptance: `npm run lint`, `npm test` (one smoke test), `npm run build` all pass; the old page still loads.
