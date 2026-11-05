PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

# S1 — Data layer, seed and demo access
1. Implement the schema from `docs/Database.md` (users, workspaces, guideline_sources, rule_sets, rules, glossary_terms, approved_facts, content_items, content_versions, review_runs, findings, finding_decisions, comments, approvals, audit_log, ai_calls) with migrations, constraints, partial unique index (one active rule set per workspace), the grounding CHECK on findings, and append-only triggers.
2. Seed script from `ANTIGRAVITY_PROMPT.md`: Brightway Solar pack (rule set v3 active, v1–v2 archived), 4 demo users, 5 content items in different states, ~40 historical findings/decisions across 90 days so insights are meaningful (TONE-003 and ACC-003 dismissed/overridden > 50%).
3. Auth-lite: signed, httpOnly session cookie with role + user id; `POST /auth/demo-login {role|userId}` guarded by `DEMO_MODE`; `GET /auth/me`; `requireRole()` and object-level guards (creators only see their own items → 404 for others). Rate-limit demo-login.
4. If I haven't given you `DATABASE_URL`, stop and walk me through creating a free Supabase project and copying the connection string (numbered steps, Windows-friendly). Until then run against a local Postgres or a Docker container — tell me which is easier for me.
Acceptance (show output): migrations apply from empty; seed is idempotent; a test proves UPDATE/DELETE on append-only tables fails; a test proves a finding without rule/fact is rejected; role-matrix test for `/auth/*`.
