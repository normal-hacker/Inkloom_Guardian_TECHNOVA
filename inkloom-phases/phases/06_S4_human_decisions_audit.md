PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

# S4 — Human decision workflow, comments, audit
1. `POST /findings/{id}/decision` (fixed / dismissed / overridden / reopened; reasons ≥ 10 chars; blocker dismiss/override reviewer+manager only).
2. `POST /content/{id}/submit` (needs a complete run on the current version) and `POST /content/{id}/decision` with all guards: role, blocker gate (409 `approval_blocked`), `stale_check`, self-approval (403 `self_approval_forbidden`), note required for request-changes/reject. Store approval with content hash + rule-set id.
3. Comments CRUD anchored to a version and optionally a finding.
4. Audit: services (not routers) write audit rows for every state change: content/version create, check run, finding decision, submit, approval, rule-set publish, demo login. Add `GET /audit` with filters and `GET /audit/export.csv` (manager).
5. Guidelines management for managers: create draft rule set (copy of active), edit rule enabled/severity/explanation, glossary and facts CRUD, YAML import with line-numbered errors, activate (archives previous, audit row). Older runs keep citing their original rule-set version.
Acceptance: table-driven test of (state, action, role) → allowed/denied + error code; the 409/403 cases above; double-click safety (idempotent submit/approve — second call returns the same result or 409, never two approvals); activating rule set v4 leaves old runs citing v3.
