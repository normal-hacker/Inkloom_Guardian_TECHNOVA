PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

# S7 — Hardening, evidence and deployment
1. Playwright E2E: the happy path from S5, the negative path (approve blocked), role denial, AI-down path, unsupported upload. All green.
2. Security tests: IDOR across users, forged/expired session, role escalation attempt, XSS strings in content and comments render inert, upload abuse (huge/zip-bomb-like/polyglot), secrets scan. Add security headers and CSP.
3. Accessibility: run axe on landing, dashboard, review workspace, guidelines, insights; fix critical/serious issues; keyboard-only walkthrough; record results in `docs/Testing.md`.
4. Golden-set evaluation: create ≥ 20 labelled sample texts (planted issues, clean texts, injection strings) under `tests/golden/` with `labels.yaml`; script prints precision/recall for rule-engine-only and combined with the mock/real provider. Write the real numbers into `docs/Testing.md`. Do not claim anything the script did not measure.
5. Deployment: walk me through deploying DB (Supabase), app (Vercel) with env vars, running migrations and seed against production, and a wake-up/health check. Then verify EVERY public link in an incognito-style fresh context with no sign-in and report results.
6. Update `README.md` (tick only features that work on the deployed link; fill links; disclosures; per-member contribution placeholders), `docs/Plan.md` deviation ledger, and `docs/user-testing.md` template (3–5 testers, task script, SUS, findings).
7. Give me a final honest status: works / simulated / not built / known bugs / risks for judging.
Acceptance: `npm run lint && npm test && npm run build && npm run e2e` all green; deployed URL passes the 2-minute happy path unaided.
