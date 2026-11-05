# Auth — Login, JWT, Roles

## 1. Goals
- Three roles with least privilege, enforced **on the server**.
- Judges and testers can use the product without creating accounts (demo mode), while real deployments stay safe.
- Simple, auditable, no custom crypto.

## 2. Roles and permission matrix
| Capability | Creator | Reviewer | Manager |
|---|:-:|:-:|:-:|
| Create content / new versions (own) | ✔ | ✔ | ✔ |
| View content | own only | all | all |
| Run check | own | all | all |
| Apply suggestion | own | all | all |
| Dismiss/fix low-severity finding | own | ✔ | ✔ |
| Dismiss/override **blocker** (reason required) | ✘ | ✔ | ✔ |
| Comment | own + shared | ✔ | ✔ |
| Approve / request changes / reject | ✘ | ✔ | ✔ |
| Edit rules, glossary, facts, rule sets | ✘ | ✘ | ✔ |
| View insights | ✘ | ✔ | ✔ |
| View audit log | ✘ | ✔ (read) | ✔ (read + CSV) |
| Hard-delete content (privacy request) | ✘ | ✘ | ✔ |
Rule: **a creator cannot approve their own content**, and a reviewer cannot approve content they created (separation of duties; returns 403 `self_approval_forbidden`). For small demos, seed a second creator so reviewers can approve without conflict.

## 3. Authentication flow
```
POST /auth/login {email,password}
  → verify argon2id hash (constant-time) → issue access JWT (60 min) + refresh JWT (7 days)
Client stores access token in memory (+ sessionStorage for reloads); sends Authorization: Bearer
POST /auth/refresh {refresh_token} → new access token (refresh rotated, old one revoked)
```
### JWT claims
```json
{"sub":"<user_id>","wid":"<workspace_id>","role":"reviewer","type":"access",
 "iat":1730700000,"exp":1730703600,"jti":"<uuid>"}
```
- Algorithm HS256 with `SECRET_KEY` (≥ 32 random bytes) from env; `alg` pinned on verify; reject `none`.
- Always load the user from the DB per request (or cache ≤ 60 s) so role changes/deactivation take effect; **do not trust the `role` claim alone for sensitive actions**.
- Refresh tokens: store `jti` hash in a `refresh_tokens` table (user_id, jti_hash, expires_at, revoked_at); rotate on use; revoke on logout. (If time is short in Round 2: access tokens only, 8-hour expiry, and document the limitation.)

## 4. Passwords
- argon2id (`argon2-cffi`), per-user salt, parameters from library defaults.
- Minimum 10 characters; no composition rules; block the demo passwords in production (`APP_ENV=production` rejects seeded demo password hashes at startup unless `DEMO_MODE=true`).
- Lockout/throttle: 10 attempts per minute per IP and per email → 429.

## 5. Demo mode & Hackathon Round 2 Auth Decisions
- **1-Click Demo Personas:** `DEMO_MODE=true` enables `POST /api/v1/auth/demo-login` returning authenticated sessions for:
  - `Asha Patel` (`creator`)
  - `Ben Cooper` (`creator`)
  - `Priya Nair` (`reviewer`)
  - `Marcus Vance` (`manager`)
- **Google OAuth (Optional):** Available via `/api/v1/auth/google/start` and `/api/v1/auth/google/callback` with PKCE code verification. Google sign-in is strictly optional; when unconfigured, the UI disables the button with a clear explanatory notice and never blocks access. New Google sign-ins default to the `creator` role.
- **Scope Decision:** User self-registration and sign-up wizards are intentionally out of scope for Round 2 so judges face zero account creation or verification barriers.
- **Redirect Security:** The `?next=` query parameter is validated by `sanitizeNextUrl` rejecting protocol-relative (`//evil.com`), backslash (`/\evil`), or absolute URI vectors.
- **Session Tokens:** Signed HMAC-SHA256 stateless session cookies (`inkloom_session`), expiring in 2 hours for demo logins and 8 hours for standard logins. Strict multi-tenant workspace isolation is enforced on every API route.

## 6. Authorization implementation
```python
# deps.py (sketch)
def current_user(token=Depends(oauth2_scheme), db=Depends(get_db)) -> User: ...
def require_role(*roles):
    def checker(user=Depends(current_user)):
        if user.role not in roles: raise Forbidden("insufficient_role")
        return user
    return checker
# object-level check
def get_content_for_user(content_id, user, db):
    item = db.get(ContentItem, content_id)
    if not item or item.workspace_id != user.workspace_id: raise NotFound()
    if user.role == "creator" and item.owner_id != user.id: raise NotFound()  # 404, not 403: don't leak existence
    return item
```
Every query filters by `workspace_id`. Add tests that user A cannot read user B's content (IDOR test) and that a user from another workspace gets 404.

## 7. Transport and browser security
- HTTPS only in production; `Strict-Transport-Security` via host.
- CORS allow-list = the web origin(s) only; no `*` with credentials.
- Token in memory/sessionStorage means XSS could steal it — mitigate with a strict CSP, escaping all rendered content (we render user text; never use `dangerouslySetInnerHTML`), and no third-party scripts on app pages. Document this trade-off. (Alternative: httpOnly cookie, which needs same-site hosting or careful `SameSite=None; Secure` + CSRF protection.)
- Security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`.

## 8. Uploaded files
Allow-list extensions + magic bytes, 10 MB cap, never execute or serve uploads from a public path, extract text server-side only, strip metadata when displaying images, scan with `pypdf` safe mode (no JS execution). Store bytes in DB, serve only through authorised endpoints.

## 9. Audit of auth events
Log `auth.login.success|failure`, `auth.refresh`, `auth.demo_login` (no secrets, no passwords), role-denied events (403) as warnings.

## 10. Test checklist
- [ ] Login success/failure/throttle
- [ ] Expired/forged/`alg:none` token → 401
- [ ] Each endpoint × each role matrix test (table-driven)
- [ ] Creator cannot see another creator's item (404)
- [ ] Self-approval blocked
- [ ] Demo login disabled when `DEMO_MODE=false`
- [ ] Deactivated user's token stops working
