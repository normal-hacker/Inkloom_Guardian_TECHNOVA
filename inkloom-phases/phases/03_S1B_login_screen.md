PASTE THE TEXT BELOW THE LINE INTO YOUR VS CODE AGENT.
Do not paste the next phase until the agent's report shows every check PASSED with real command output.

----------------------------------------

You are my senior full-stack engineer and QA lead. I can't code. Build the **login screen** for "Inkloom Guardian" (hackathon Round 2) using the UI/UX component in `docs/ui/sign-up-component.md`, adapted as specified below. Read that file and these docs first: `docs/Auth.md`, `docs/Design.md`, `docs/API.md`, `docs/Architecture.md`, `docs/Setup.md`, `docs/Plan.md`.

## 0. The one rule that matters most
The hackathon requires that **judges can use the product without any sign-up or personal account**. Therefore:
- **Demo accounts are the primary, always-working way in.** One click per role, no typing, no email, no password.
- **Google sign-in is OPTIONAL.** It must never be required, never block the page, and must degrade gracefully (disabled with an explanation) when it isn't configured or fails.
- The login page itself, `/demo-report`, `/about-ai` and `/build-notes` must open with no sign-in.

## 1. Check the current state first (report in ≤ 8 lines, then continue)
Inspect the repo: framework, Tailwind version (v3 or v4), whether shadcn is set up (`components.json`, `@/lib/utils` exporting `cn`), TypeScript, existing auth/session code, existing `/api/v1/auth/*` routes, the existing `/login` or landing page. Reuse what exists; don't duplicate. If shadcn/Tailwind/TypeScript is missing, set it up with the shadcn CLI and tell me every manual step in plain numbered language (Windows/PowerShell commands).

## 2. Integrate the component (follow the component file's own instructions)
- Install: `lucide-react framer-motion canvas-confetti class-variance-authority` and `@types/canvas-confetti` (dev). Verify `@/` path alias works.
- Put the visual component at `components/ui/sign-up.tsx`. **Rename the export to `AuthComponent` only if it already is; otherwise keep the name**, and keep it presentational (see §4). Business logic and `fetch` calls live in `app/login/page.tsx` (or your framework's equivalent) and `lib/auth/client.ts`, NOT in `components/ui`.
- No Unsplash/stock images are needed. Logo = lucide `ShieldCheck` in a rounded indigo square.

## 3. Theme tokens (the component depends on CSS variables — get this exactly right)
The component uses `var(--background)`, `var(--foreground)`, `var(--border)`, `var(--card)`, `var(--color-primary)`, `--color-secondary`, `--color-accent`, `--color-destructive`, `--color-chart-1…5`, and relative colour syntax like `oklch(from var(--foreground) l c h / 20%)`. For that to work every one of these must resolve to a **complete colour value** (e.g. `#111827`), not an HSL triplet like `0 0% 3.9%`. In `globals.css` define (light theme; set `color-scheme: light`):
```
--background:#F9FAFB; --foreground:#111827; --card:#FFFFFF; --card-foreground:#111827;
--primary:#4F46E5; --primary-foreground:#FFFFFF; --secondary:#E0E7FF; --accent:#C7D2FE;
--muted-foreground:#4B5563; --border:#E5E7EB; --destructive:#B91C1C;
--chart-1:#6366F1; --chart-2:#0EA5E9; --chart-3:#8B5CF6; --chart-4:#38BDF8; --chart-5:#A5B4FC;
--color-primary:var(--primary); --color-secondary:var(--secondary); --color-accent:var(--accent);
--color-destructive:var(--destructive); --color-chart-1:var(--chart-1); … --color-chart-5:var(--chart-5);
```
If Tailwind v4: also map them in `@theme inline` (`--color-background: var(--background)` etc.). If Tailwind v3 with HSL-triplet shadcn tokens: **do not break other screens** — scope these values to the login page via a wrapper class (e.g. `.auth-theme`) instead of changing global tokens. Configure `font-serif` (the heading uses it) with a loaded serif (use the framework's built-in font loader, e.g. `next/font`, self-hosted) so it doesn't fall back unpredictably.
Browser support: relative colour syntax needs a modern browser. Add an `@supports not (color: oklch(from red l c h))` fallback giving the glass buttons/inputs solid semi-transparent backgrounds and visible borders, so older browsers still look correct and usable.

## 4. Adapt the component (the original is a sign-UP wizard with fake timers — change it)
Make these changes; keep the glass look, animations, gradient background and layout style intact:
**Remove:** the GitHub button, the "confirm password" step, the sign-up copy ("Get started with Us", "Create your password", "One Last Step", "Welcome Aboard!"), and ALL fake `setTimeout` progress. Real calls only.
**Fix these defects in the original code (do not skip):**
1. `GlassButton` double-fires clicks: the wrapper `onClick` calls `button.click()` when the click target is a child `<span>` of the button, so `onClick` runs twice. Fix by ignoring clicks that originate inside the button (`if (!button || button.contains(e.target as Node)) return;`) or by removing the wrapper handler. Add a test proving one click = one call.
2. `Modal` is defined inside the component and is recreated on every render (animations restart, loops reset). Move it to a top-level component receiving props.
3. Inputs have only placeholders. Add real accessible names (`<label>` visually hidden or `aria-label`), `autoComplete="email"` / `current-password`, `inputMode`, and `name` attributes.
4. `focus:outline-none` removes focus visibility. Add a clearly visible focus ring (2px `--primary`, offset 2px) on inputs (via `:focus-within` of the glass wrapper), buttons and links, in addition to the existing glow.
5. `whitespace-nowrap` headings in a 280px column overflow on 360px phones. Let headings wrap, set the column to `w-[min(92vw,420px)]`, and verify no horizontal scroll at 360px.
6. Contrast: placeholder/label text over the coloured gradient must meet 4.5:1 (UI borders 3:1). If it doesn't, lower blob opacity or add a translucent white panel behind the form. Also replace the red `--color-destructive` blob in `GradientBackground` with `--color-chart-5` so the background is on-brand (errors still use destructive red).
7. Honour `prefers-reduced-motion`: no confetti, no float animations, no blur-fade (render final state).
8. Keep the success confetti subtle (it fires once on successful login only).
9. Disable controls while a request is in flight; guard against double submission.
10. Add `aria-live="polite"` status region for loading/error/success messages and focus management (move focus to the error message / "Try again" button; return focus sensibly).

**Component API (props only; no fetching inside):**
```ts
type Role = "creator" | "reviewer" | "manager";
type DemoUser = { id: string; name: string; role: Role; blurb: string };
type Providers = { demo: boolean; password: boolean; google: boolean };
type Status = { state: "idle" | "loading" | "success" | "error"; step?: string; message?: string; retryAfter?: number };
AuthComponent({ logo, brandName, providers, demoUsers, status,
  onDemoLogin(user: DemoUser), onPasswordLogin(email, password), onGoogle(), onDismissError() })
```

## 5. Login screen behaviour (exact spec)
Route: `/login` (public). If a valid session exists, redirect to `/dashboard`. If a protected route redirects here, keep `?next=` (only allow same-origin relative paths; reject anything else to avoid open redirects) and go there after login.

**Step "choose" (default):**
- Brand top-left (centred on md+): ShieldCheck logo + "Inkloom Guardian".
- Headline (serif): **"Check before you publish."** Sub: "Sign in to review content against your approved brand rules. A human always makes the final decision."
- Section **"Try the demo — no sign-up needed"** with four glass buttons/cards (each clearly labelled, keyboard reachable, `data-testid="demo-<role>-<name>"`):
  - **Asha — Creator**: "Submit content and fix flagged issues"
  - **Ben — Creator**: "A second creator, for approval tests"
  - **Priya — Reviewer**: "Review findings, approve or request changes"
  - **Marcus — Manager**: "Rules, insights and audit trail"
  One click → logs in immediately as that seeded demo user.
- Small hint under the buttons: "Tip: submit as Asha, then approve as Priya."
- Divider "OR".
- **Continue with Google (optional)** glass button with the Google icon. States: enabled when `providers.google`; otherwise disabled with visible text "Not available on this deployment — demo accounts work without it" and `aria-disabled`/description linked via `aria-describedby`. Never hide the demo buttons because of Google.
- **Email sign-in** (the component's email → password steps, minus confirm step) for the seeded accounts and any real accounts: email step with arrow button → password step ("Welcome back" / "Enter your password") with show/hide toggle, "Go back", Enter key works. Only render this if `providers.password`.
- A collapsible "Demo credentials" `<details>` listing the 4 demo emails/passwords from `docs/Setup.md` — **render it only when the server says demo mode is on**.
- Footer links (all public): "View a sample report", "About AI & privacy", "Build notes", "GitHub repo". Plus one-line notice: "Demo mode uses fictional data. Don't enter real confidential content."

**Progress/result modal (real states, no fake timers):**
- Loading: step text changes with real progress: "Signing you in…" → "Preparing your workspace…" (switch when the API call resolves and before navigation).
- Success: "Welcome, {name}" + role badge; confetti once (unless reduced motion); navigate to `next` or `/dashboard` after ~700 ms (or immediately on keypress/click).
- Error: show the server's message in plain language with a "Try again" button; handle: invalid credentials (401), too many attempts (429, show seconds from `Retry-After`), demo mode disabled (404/403), Google not configured/denied/cancelled, network offline/timeouts (10 s client timeout). Never show raw stack traces.

## 6. Backend (build only what's missing; follow `docs/Auth.md` and `docs/API.md`)
Endpoints (same error shape as API.md):
- `GET /api/v1/auth/providers` → `{ demo: boolean, password: boolean, google: boolean, demoUsers: [{id,name,role,blurb}] }` — `demo` from `DEMO_MODE`, `google` true only if `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `AUTH_BASE_URL` are all set. `demoUsers` returned only when demo mode is on. No secrets, ever.
- `POST /api/v1/auth/demo-login` `{ userId }` (or `{role}`) → sets the session cookie; 404 `demo_disabled` when `DEMO_MODE=false`; only seeded `is_demo` users are allowed; rate limit 30/hour/IP.
- `POST /api/v1/auth/login` `{ email, password }` → argon2id verify in constant time; generic message "Email or password is incorrect"; throttle 10/min per IP and per email → 429 with `Retry-After`.
- `POST /api/v1/auth/logout` and `GET /api/v1/auth/me`.
- Google (optional): `GET /api/v1/auth/google/start` → creates `state` + PKCE verifier (httpOnly, SameSite=Lax, short-lived cookie), redirects to Google with scopes `openid email profile` only; `GET /api/v1/auth/google/callback` → validate `state`, exchange code with PKCE, verify the ID token (issuer, audience = our client id, expiry, `email_verified === true`), upsert the user in the demo workspace as **role `creator` only** (never auto-grant reviewer/manager; a manager can promote later), set the same session cookie, redirect to `next` or `/dashboard`. On any failure redirect to `/login?error=google_failed` (or `google_denied`) — the UI shows a friendly message and demo buttons still work. Use a small maintained OAuth library (e.g. Arctic or Auth.js) **or** hand-rolled code-flow; choose whichever fits the existing session code and explain the choice in one line. Do not store Google tokens; store only email, display name, provider id.
- Session: signed httpOnly cookie, `SameSite=Lax`, `Secure` in production, 2 h for demo logins, 8 h otherwise; load the user from the DB per request.
- Route protection: `middleware` (or equivalent) redirects unauthenticated requests for protected pages to `/login?next=…`; public routes: `/`, `/login`, `/demo-report`, `/about-ai`, `/build-notes`, `/selftest`, static assets, `/api/v1/health`, `/api/v1/auth/*`, `/api/v1/public/*`.
- Audit: write `auth.demo_login`, `auth.login.success|failure`, `auth.logout`, `auth.google.success|failure` rows (no passwords/tokens in details).
- Env additions to `.env.example`: `DEMO_MODE=true`, `SESSION_SECRET=` (≥ 32 random chars; app refuses to start in production without it), `AUTH_BASE_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID=`, `GOOGLE_CLIENT_SECRET=` (both blank by default = Google disabled).

## 7. Security & privacy checklist (must all hold)
- No secrets in client bundles; only `NEXT_PUBLIC_*` values are public and none are secrets.
- `next` parameter validated (same-origin relative path only).
- Login errors don't reveal whether an email exists.
- Demo-login cannot be used to obtain a non-demo user; with `DEMO_MODE=false` it's 404 and the UI hides the demo section.
- Production refuses to start if `DEMO_MODE=true` is combined with a non-demo workspace flag (document the rule: demo mode only on the fictional workspace).
- Security headers/CSP not broken by the component's inline `<style>` blocks (use a nonce or move the CSS into `globals.css`/a CSS file; prefer moving it).
- Rate limiting works behind a proxy (use the first trusted `X-Forwarded-For`; don't trust arbitrary headers).

## 8. Accessibility & responsive requirements
Keyboard-only: Tab order = brand → demo buttons → Google → email field → footer links; Enter/Space activate; Escape closes the error modal; focus trapped in the modal while open and restored after. Screen reader: headings in order (one `h1`), buttons have names ("Sign in as Priya, Reviewer"), status messages announced. 200% zoom OK. Layout verified at 360, 768 and 1280 px, no horizontal scroll. Axe: zero critical/serious violations on `/login`. Use only text/icons together for state (not colour alone).

## 9. Files
Create or modify (adjust to the project's conventions; list what you actually changed): `components/ui/sign-up.tsx`, `app/login/page.tsx`, `app/login/layout.tsx` (if needed), `lib/auth/client.ts`, `lib/auth/session.ts`, `lib/auth/providers.ts`, `app/api/v1/auth/{providers,demo-login,login,logout,me}/route.ts`, `app/api/v1/auth/google/{start,callback}/route.ts`, `middleware.ts`, `app/globals.css`, `.env.example`, tests under `tests/`, and the `docs/Auth.md` + `docs/Plan.md` deviation ledger (record: Google is optional; email/password retained for seeded accounts; sign-up/registration intentionally out of scope for Round 2).

## 10. Tests and acceptance (run them yourself and show real output)
Unit/component (Vitest + Testing Library):
- One click on a demo button calls `onDemoLogin` exactly once (regression test for the double-fire bug).
- Google button: enabled/disabled + description text per `providers.google`; demo buttons render in both cases.
- Email → password steps: invalid email can't continue; valid enables the arrow; Enter works; Go back works; password toggle works.
- `next` validation rejects `//evil.com`, `https://evil.com`, `/\evil` and accepts `/dashboard`, `/content/123`.
API/integration:
- `GET /auth/providers` shape with Google unset (google:false) and set (google:true); never leaks secrets.
- demo-login success for each of the 4 seeded users sets a cookie and `/auth/me` returns the right role; with `DEMO_MODE=false` → 404.
- login: wrong password → 401 generic; 11th attempt in a minute → 429 with `Retry-After`.
- Google callback with bad/missing `state` → rejected; with unverified email → rejected; (mock the Google token endpoint in tests — do not call Google from CI).
- Protected page redirects to `/login?next=…` when logged out; `/login` redirects to `/dashboard` when logged in.
E2E (Playwright), desktop and 360px mobile:
1. Open `/login` logged-out → click "Asha — Creator" → modal shows real loading → lands on `/dashboard` with role badge "Creator".
2. Log out → click "Priya — Reviewer" → dashboard shows reviewer.
3. Double-click a demo button quickly → exactly one login request.
4. Wrong password path shows the friendly error and "Try again" restores the form with focus.
5. Google button disabled with explanation when unconfigured; the demo path still works.
6. Keyboard-only run of scenario 1.
7. `prefers-reduced-motion` run: no confetti canvas activity; flow still works.
8. Axe scan of `/login` passes; screenshot of `/login` at 360px and 1280px saved to `tests/screenshots/`.
Acceptance: `npm run lint && npm test && npm run build && npm run e2e` all green; I can open `http://localhost:3000/login` in an incognito window and enter the product as each role in one click.

## 11. Manual steps for me (give me these as numbered plain-language steps when you reach them)
A. Generate `SESSION_SECRET` (PowerShell one-liner) and put it in `.env.local`.
B. **Optional — Google sign-in:** step-by-step how to create a Google Cloud OAuth client (Web application), set the authorised redirect URIs to `http://localhost:3000/api/v1/auth/google/callback` and the production URL's callback, add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`AUTH_BASE_URL` to local and Vercel environment variables, and what to do about the consent screen. Warn me plainly: while the Google app is in "Testing" status only listed test users can sign in, so judges would see "access blocked" — that is exactly why demo accounts are the main path and Google stays optional. If I skip this section, Google stays disabled and everything else must still pass.
C. Deployment env vars for Vercel (`DEMO_MODE=true`, `SESSION_SECRET`, `AUTH_BASE_URL`, `DATABASE_URL`, optional Google vars) and how to confirm `/login` works in an incognito window on the live URL.

## 12. How to work
Plan first (≤ 10 lines). Build. Run everything and show real output — never say "should work". If something needs me, stop and give numbered steps; don't invent keys or fake success. Don't touch unrelated screens or restyle anything outside the login page except the shared tokens needed in §3. Small, clear commits (e.g. "login: integrate glass auth component", "login: demo accounts and providers endpoint", "login: optional Google OAuth", "login: tests"). Do not weaken a guardrail (role checks, rate limits, `next` validation, demo-mode gating) to make a test pass.
Finish with this report: (1) what was built, (2) files changed, (3) commands run + results, (4) tests added + pass/fail counts, (5) what is simulated or not done (be explicit about whether Google was actually tested end to end), (6) known issues, (7) the single next step.
