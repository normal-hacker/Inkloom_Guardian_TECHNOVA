# Optimistic UI & Governance Gates — Architecture & Guidelines

Single source of truth for optimistic updates, governance protections, deduplication, and failure rollbacks in **Inkloom Guardian**.

---

## 0. The Principle (Governance First)

Optimistic UI shows the *expected result* before the server confirms it. This is safe and delightful for low-risk, reversible actions. It is **categorically forbidden** for a governance product to show human decisions or compliance gates as completed before the server has authorized and committed them:
- An "Approved" state appearing and then vanishing on rejection is legally dangerous, breaks auditor trust, and creates compliance risk.
- Server-side gates (open blockers, self-approval prevention, stale checks) can and will reject actions.
- Hashing, version numbers, audit logs, and blocker gates require server confirmation.

### Classification Rules:
- **Optimistic (immediate render, rollback on failure):** Only actions that are (a) low-risk, (b) reversible, (c) predictable, (d) not a governance decision, and (e) do not depend on server-generated evidence (hashes, version numbers, audit rows, gate results).
- **Pending-only (instant visual feedback via loading state; final state ONLY after server confirms):** Everything else.
- **Local state only:** Interactions with zero server mutation (filters, tabs, sidebar pins).

---

## 1. Mutation Inventory (`lib/optimistic/allowlist.ts`)

The full application mutation inventory is codified as a runtime allowlist in `frontend/src/lib/optimistic/allowlist.ts`. Any attempt to wire a `pending_only` action to `useOptimisticMutation` throws an immediate invariant violation error in development and tests.

| Action Identifier | Endpoint | Who Can Do It | Current Loading / UI Feedback | Classification | Governance / Technical Reason |
|---|---|---|---|---|---|
| `comment.add` | `POST /api/v1/content/[id]/comments` | All Authenticated | Pending badge, dashed border | **Optimistic** | Low-risk collaboration, reversible, predictable author attribution |
| `comment.delete` | `DELETE /api/v1/content/[id]/comments/[commentId]` | Comment Owner, Manager | Immediate list removal | **Optimistic** | Reversible, low-risk, predictable |
| `comment.edit` | `PATCH /api/v1/content/[id]/comments/[commentId]` | Comment Owner | Immediate text update | **Optimistic** | Reversible, low-risk, predictable |
| `guidelines.rule.toggle` | `PUT /api/v1/guidelines/draft/rules/[ruleKey]` | Manager only | Pending badge, dashed border | **Optimistic** | Reversible, isolated to draft rule set; not published to production |
| `guidelines.rule.severity` | `PUT /api/v1/guidelines/draft/rules/[ruleKey]` | Manager only | Pending badge, dashed border | **Optimistic** | Reversible, isolated to draft rule set; not published to production |
| `guidelines.term.add` | `POST /api/v1/guidelines/draft/terms` | Manager only | None (staged in draft) | **Deferred** | Staging currently handled via active guidelines and YAML batch importer |
| `guidelines.term.delete` | `DELETE /api/v1/guidelines/draft/terms/[id]` | Manager only | None (staged in draft) | **Deferred** | Staging currently handled via active guidelines and YAML batch importer |
| `guidelines.fact.add` | `POST /api/v1/guidelines/draft/facts` | Manager only | None (staged in draft) | **Deferred** | Staging currently handled via active metrics sheet and YAML batch importer |
| `guidelines.fact.delete` | `DELETE /api/v1/guidelines/draft/facts/[id]` | Manager only | None (staged in draft) | **Deferred** | Staging currently handled via active metrics sheet and YAML batch importer |
| `auth.login` | `POST /api/v1/auth/login` | Public | Button spinner | **Pending-only** | Authentication token generation and credential verification |
| `auth.demo_login` | `POST /api/v1/auth/demo-login` | Public (Demo mode) | Button spinner | **Pending-only** | Persona switching, cookie setting |
| `auth.logout` | `POST /api/v1/auth/logout` | All Authenticated | Full page redirect | **Pending-only** | Session invalidation and cookie clearing |
| `content.create` | `POST /api/v1/content` | Creator, Reviewer, Manager | Button spinner | **Pending-only** | Server generates UUID, version 1, and initial SHA-256 content hash |
| `content.upload` | `POST /api/v1/content/upload` | Creator, Reviewer, Manager | Upload progress spinner | **Pending-only** | Server handles file extraction, virus scanning, and versioning |
| `content.check` | `POST /api/v1/content/[id]/check` | Content Owner, Reviewer, Manager | Async polling spinner | **Pending-only** | Heavy rule execution, AI evaluation run ID creation |
| `content.apply_suggestion` | `POST /api/v1/content/[id]/apply-suggestion` | Content Owner, Reviewer, Manager | Button spinner | **Pending-only** | Server computes new version number, diff, and new content hash |
| `finding.decision` | `POST /api/v1/findings/[id]/decision` | Reviewer, Manager, Owner | Button spinner | **Pending-only** | Affects blocker gate, audit trail, and compliance clearance |
| `content.submit` | `POST /api/v1/content/[id]/submit` | Content Owner | Button spinner | **Pending-only** | Validates complete check run before state transition |
| `content.decision` | `POST /api/v1/content/[id]/decision` | Reviewer, Manager | Button spinner (`aria-busy="true"`) | **Pending-only** | Core governance gate: blocker check, self-approval prevention, audit row |
| `guidelines.activate` | `POST /api/v1/guidelines/draft/activate` | Manager only | Button spinner | **Pending-only** | Irreversible promotion of draft to production active rule set |
| `guidelines.import_yaml` | `POST /api/v1/guidelines/import-yaml` | Manager only | Modal spinner | **Pending-only** | Batch validation, syntax parsing, schema enforcement |

---

## 2. Reusable Core Hook (`lib/optimistic/useOptimisticMutation.ts`)

The reusable hook provides type-safe, lightweight optimistic UI without external library bloat (<3 KB bundle impact).

### Key Architectural Capabilities:
1. **Allowlist Enforcement:** Validates `action` against `MUTATION_ALLOWLIST`. Throws if a governance action is misconfigured.
2. **Pure `apply` Function:** Previews the user's action in memory. Temporary entities are tagged with `client_request_id: UUID` and `__pending: true`.
3. **In-Flight Deduplication:** Locks the hook while a mutation with the same idempotency key is in flight. Spammed clicks or rapid `Enter` presses produce exactly one HTTP request.
4. **Idempotency Key Management:** Generates a standard UUID v4 `Idempotency-Key` once per user action and reuses the exact same key during automatic or manual retries.
5. **Reconciliation:** On 2xx response, replaces the temporary item with the confirmed server item (matching on `client_request_id` or `id`), preventing flicker or duplicate entries. Re-evaluates derived state (such as tab badge counters).
6. **Rollback with Input Preservation:** On failure, reverts state exactly to the snapshot prior to the action, logs the error, and retains `lastInput` so user typing in textareas/inputs is never lost.
7. **Out-of-Order Safety:** Tracks an internal sequence counter (`currentSeqRef`). Late responses from older mutations are silently discarded and cannot overwrite newer state.
8. **Client Timeout & Single Auto-Retry:** Uses a 10-second `AbortController` timeout. Network drops or timeouts automatically trigger **one** retry with the same `Idempotency-Key` after 1 second.
9. **Unmount Protection:** In-flight network requests are automatically aborted on component unmount; late promises resolve as no-ops.

---

## 3. Server Idempotency (`idempotency_keys` table)

For endpoints that create database rows (`POST /api/v1/content/[id]/comments`, `POST /api/v1/guidelines/draft/terms`, etc.):
- **Header:** `Idempotency-Key: <UUID>`
- **Database Schema:** `idempotency_keys`
  - `user_id` uuid REFERENCES users(id) NOT NULL
  - `key` text NOT NULL
  - `endpoint` text NOT NULL
  - `response_status` integer NOT NULL
  - `response_body` jsonb NOT NULL
  - `created_at` timestamptz DEFAULT now() NOT NULL
  - **Constraint:** Unique composite index on `(user_id, key)`
- **Behavior:**
  - On first arrival, the request executes normally and stores status and body in `idempotency_keys`.
  - On repeat arrival with the same key and user, returns the stored status and body with header `Idempotent-Replay: true`.
  - Concurrent requests with the same key rely on PostgreSQL's unique constraint: one wins, the other retrieves the committed response.
  - Authentication and authorization checks are evaluated **before** checking the idempotency table; replay never bypasses permission checks.
  - Expired keys (>24 hours) are pruned by `cleanupExpiredIdempotencyKeys()`.

---

## 4. Network and Error Handling

| Scenario | HTTP Status / Error | UI State | User Message | Recovery Action |
|---|---|---|---|---|
| Offline | `navigator.onLine === false` or network drop | Rollback | "You're offline. This wasn't saved." | Restores input; shows "Retry" |
| Timeout | Request exceeds 10s | Auto-retry once; then Rollback | "Couldn't confirm this was saved. Retry or discard." | Restores input; manual "Retry" reuses same `Idempotency-Key` |
| Session Expired | 401 Unauthorized | Rollback | Redirects to `/login?next=...` | Preserves return path |
| Forbidden | 403 Forbidden | Rollback | "You don't have permission to do this." | Displays inline alert |
| Not Found | 404 Not Found | Rollback | "That item no longer exists." | Displays inline alert |
| Conflict | 409 Conflict | Rollback | "Conflict: The item was modified elsewhere." | Refetches fresh state |
| Validation Error | 422 Unprocessable Entity | Rollback | Shows field error message | Restores user input in form |
| Rate Limited | 429 Too Many Requests | Rollback | "Too many requests, try again in N seconds" | Uses `Retry-After` header |
| Server Error | 500 / 5xx Internal Error | Rollback | "Something went wrong on our side. Nothing was changed." | Shows request ID; restores input |

---

## 5. UI Components (Paper Brutalist)

### `PendingBadge` (`components/ui/pending-badge.tsx`)
Rendered alongside items with `__pending: true`:
- 2px dashed `--ink` border
- `--surface-2` fill
- Geist Mono uppercase font: `SAVING…`
- Screen-reader accessible label

### `InlineRetry` (`components/ui/inline-retry.tsx`)
Rendered when an optimistic action fails:
- Boxy Paper Brutalist banner with 2px solid `--ink` border and `4px 4px 0 var(--ink)` hard shadow
- Accessible alert container: `role="alert"` and `aria-live="assertive"`
- Plain language explanation without relying solely on color
- Action buttons: `Retry` (re-triggers with same key) and `Discard` (dismisses alert and clears preserved draft)

---

## 6. How to Safely Add a New Optimistic Action

1. **Verify Against §0 Principles:**
   - Is it low-risk?
   - Is it fully reversible?
   - Is the outcome predictable?
   - Is it free of governance gates, blocker calculations, version numbers, or audit evidence?
2. **Register in Allowlist:**
   - Add the action name and metadata to `MUTATION_ALLOWLIST` in `frontend/src/lib/optimistic/allowlist.ts`.
   - Update `docs/Optimistic-UI.md` inventory table.
3. **Backend Idempotency (if creating resources):**
   - Wrap the route handler with `handleIdempotentRequest(req, user, endpoint, async () => { ... })`.
4. **Wire the Hook:**
   - Instantiate `useOptimisticMutation` with typed `TState`, `TInput`, and `TResult`.
   - Wire `PendingBadge` for items where `item.__pending === true`.
   - Wire `InlineRetry` for inline error recovery.
   - Wire input restoration on rollback.
5. **Add Automated Tests:**
   - Add a unit test in `tests/optimistic-hook.test.ts` verifying reconciliation and rollback.
   - Run `npm test` and `npm run e2e`.

