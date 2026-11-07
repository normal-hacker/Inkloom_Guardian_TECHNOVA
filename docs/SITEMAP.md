# SITEMAP — the whole product on one page

> Framework step 1: map everything first. Every screen is built knowing where it fits.
> Precedence: this file is the source of truth for **routes, roles, navigation, journeys and build order**. If another doc disagrees, this wins; report the discrepancy.
> Status values: `todo` · `building` · `review` · `done`. Update the Status column in the same commit that changes a screen.

## 1. Route map
### Public (no sign-in; every one must open in an incognito window)
| # | Route | Purpose | Key content | Data | Status |
|---|---|---|---|---|---|
| P1 | `/` | Landing: what it is, "Try the demo" | Hero, 3-step explainer, links | none | done |
| P2 | `/login` | Demo accounts first, optional Google, email sign-in | Role buttons, Google (optional), email/password | `GET /auth/providers`, `POST /auth/demo-login`, `/auth/login` | done |
| P3 | `/demo-report` | Read-only sample of a finished review | Seeded approved item, findings, dismissal reason, approval, audit rows | `GET /public/demo-report` | done |
| P4 | `/about-ai` | AI disclosure and privacy | What AI does/doesn't, data sent, providers, limits, build tools | `GET /public/ai-disclosure` | done |
| P5 | `/build-notes` | Our Round 2 submission content | Features done, tech, changes from plan, 3 Round 3 improvements, team, limits | static + features array | done |
| P6 | `/selftest` | In-browser engine self-tests | pass/fail list | none | done |
| P7 | `/404`, error boundary | Friendly not-found / error | Next action link | none | done |
| P8 | `/styleguide` | Paper Brutalist component gallery | Tokens, type scale, components, states | none | done |

### App (signed in; shell = sidebar + page header + content panel)
| # | Route | Roles | Purpose | Primary actions | Data (see DOMAIN.md) | Status |
|---|---|---|---|---|---|---|
| A1 | `/dashboard` | all | What needs my attention; content list | Open item, New content | `ContentItem[]`, counts | done |
| A2 | `/content/new` | all | Submit content | Paste / upload, Save & check | `ContentItem`, `ContentVersion` | done |
| A3 | `/content/[id]` | owner, reviewer, manager | **Review workspace (core of the product)** | Check, apply suggestion, dismiss/override, comment, submit, decide | `ContentItem`, `ContentVersion[]`, `ReviewRun`, `FindingView[]`, `Comment[]`, `Approval`, `AuditEntry[]` | done |
| A4 | `/guidelines` | all view; manager edits | Approved material (sources, rules, glossary, facts, rulesets) | Edit draft rule set, add term/fact, publish version | `GuidelineSource`, `RuleSet`, `Rule`, `GlossaryTerm`, `ApprovedFact` | done |
| A5 | `/insights` | reviewer, manager | Repeated mistakes, unclear guidelines | Filter period, table toggle | aggregates | done |
| A6 | `/audit` | reviewer, manager | Who decided what on which exact version | Filter, expand, export CSV (manager) | `AuditEntry[]` | done |

## 2. Navigation structure
- **Sidebar (main nav, `components/ui/sidebar.tsx`):** Dashboard · New content · Guidelines · Insights* · Audit* · About AI. Footer: user card, Switch demo user (demo mode only), Log out. (*reviewer/manager only; UI hiding is convenience, the server enforces.)
- **In-page tabs (`ExpandableTabs`):**
  - A3 desktop: Comments · History · Audit(*). A3 mobile: Content · Findings.
  - A4: Sources · Rules · Glossary · Facts · Rule sets (URL `?tab=`).
- **Header strip (`PageHeader`):** title + one-line description from `lib/nav/config.ts`; updates on route change.
- **Footer links on public pages:** Sample report · About AI · Build notes · GitHub.

## 3. Core user journeys (each must work end to end before Round 2 submit)
1. **Creator fixes content:** `/login` → Asha → `/content/new` → paste text → Save & check → A3 shows cited findings → Apply suggestion (v2) → Check again → Submit for review.
2. **Reviewer decides:** `/login` (or Switch demo user) → Priya → `/dashboard` → open item → A3 → resolve/dismiss with reason → Approve (blocked while a blocker is open; blocked for own content) → audit row visible.
3. **Manager governs:** Marcus → `/guidelines` → edit draft rule set → Publish vN → `/insights` shows repeated issues and rules often overridden → `/audit` export.
4. **Judge with no account:** `/` → `/demo-report`, `/about-ai`, `/build-notes` all open signed-out.

## 4. Cross-screen links (so no screen is an island)
- A1 row → A3. A2 submit → A3. A3 finding "Open source" → popover (excerpt) with link to A4 `?tab=rules` anchor for that rule.
- A5 "most overridden rule" → A4 `?tab=rules#<rule key>`. A5 top rule → A3? no; link to A4 only.
- A6 row → A3 for that content version. P3 mirrors A3 read-only.
- Every public page → `/login` ("Try the demo").

## 5. Screen-level state rules
Every screen implements: loading (skeleton), empty (with next action), error (plain-language + retry), forbidden (403 → friendly, from server), and offline/timeout. See DESIGN_SYSTEM.md §8.

## 6. Build order (section by section; one at a time; each reviewed before the next)
| Order | Section | Screens | Depends on |
|---|---|---|---|
| 0 | Foundation | tokens, shared types, shell (sidebar, header strip), 404/error | DESIGN_SYSTEM, DOMAIN |
| 1 | Entry | P2 `/login`, P1 `/` | 0 |
| 2 | Dashboard | A1 | 0, seed data |
| 3 | Intake | A2 | 2 |
| 4 | Review workspace | A3 — split: 4a content pane + highlights · 4b findings list/cards · 4c decisions (finding + approval) · 4d side tabs (comments, history/diff, audit) | 3, engine, pipeline |
| 5 | Guidelines | A4 | 0 |
| 6 | Insights + Audit | A5, A6 | 4 (needs real runs/decisions) |
| 7 | Public pages | P3, P4, P5, P6 | 4, 6 |
| 8 | Hardening | E2E, a11y, security, deploy | all |

## 7. Out of scope for Round 2 (do not build; Round 3 improvements)
Stale-content re-audit, guideline-gap detector, visual compliance check. They appear only as text on `/build-notes`.
