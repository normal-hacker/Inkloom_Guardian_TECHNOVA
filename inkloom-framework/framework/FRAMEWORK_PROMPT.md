# FRAMEWORK SETUP — prompt for your VS Code AI agent

BEFORE YOU PASTE
1. Copy `SITEMAP.md`, `DESIGN_SYSTEM.md`, `DOMAIN.md` and `BUILD_PROTOCOL.md` into your project's `docs/` folder.
2. Paste this once, before building any more screens. It sets up the shared foundation and the automatic checks. After it passes, build screens one section at a time with the per-section template in BUILD_PROTOCOL.md.

---------------------------------------------------------------------

You are my senior full-stack engineer. I can't code. We are adding a project framework so every screen fits the whole product and looks consistent. Read `docs/SITEMAP.md`, `docs/DESIGN_SYSTEM.md`, `docs/DOMAIN.md`, `docs/BUILD_PROTOCOL.md`, then `docs/Design.md`, `docs/Database.md`, `docs/API.md`, `docs/Plan.md`. These four new files are now the source of truth for routes/roles/build order (SITEMAP), visuals (DESIGN_SYSTEM) and data shapes (DOMAIN). Do not build any new screen in this task.

## Tasks
1. **Audit what exists (≤ 10 lines):** routes already in the app vs SITEMAP; colours/spacing/fonts actually used vs DESIGN_SYSTEM; types/interfaces declared in components vs DOMAIN; which inventory components exist. List every mismatch in a table.
2. **Design tokens:** create `styles/tokens.css` with every token in DESIGN_SYSTEM §2–§5 as CSS variables (complete colour values, no HSL triplets), map them into the Tailwind theme (v3 `theme.extend` or v4 `@theme`), set `color-scheme: light`, load Inter, JetBrains Mono and the single serif display face with the framework's font loader (self-hosted; no external requests). Scope any existing shadcn tokens so current screens (login, sidebar, tabs) keep working; don't break them. Add the `Button`, `Input`, `Textarea`, `Select`, `Badge`, `SeverityBadge`, `StatusPill`, `Card`, `Panel`, `EmptyState`, `ErrorState`, `Skeleton` base components **only if they don't already exist**, styled strictly from tokens, with accessible names/focus rings/44 px touch targets and a small Vitest test for each.
3. **Shared types:** create `lib/domain/types.ts` by copying DOMAIN.md §1–§5 verbatim, and `lib/domain/derive.ts` implementing §4 (`isCleared`, `openBlockers`, `canApprove`, `needsRecheck`) with unit tests that cover every branch (include: approve blocked for own content, stale run, open blocker, rules-only run). Replace any duplicate local type declarations in existing code with imports. If existing code or API.md uses a different field name (e.g. camelCase `demoUsers` vs `demo_users`), tell me and fix the code to match DOMAIN.md; if DOMAIN.md and Database.md/API.md truly disagree, stop and report instead of choosing.
4. **Route map check:** create `scripts/check-routes.mjs` that reads the route tables in `docs/SITEMAP.md` and compares them to the app's actual routes (e.g. the `app/` folder). It fails on routes missing from the map and on routes marked `done` that don't exist. Treat `todo`/`building` routes as allowed to be missing.
5. **Anti-drift scripts** (add npm scripts + run them in CI): `check:tokens` (fails on raw hex colours or arbitrary pixel Tailwind classes such as `w-[283px]` in feature code, allowing `styles/tokens.css` and the auth glass component), `check:types` (fails if a file other than `lib/domain/types.ts` declares an interface/type named `Finding`, `FindingView`, `ContentItem`, `ContentVersion`, `ReviewRun`, `Rule`, `RuleSet`, `Approval`, `AuditEntry`, `User`), `check:routes`. Put each script's behaviour under test with one passing and one failing fixture.
6. **Status in the map:** set the Status column in SITEMAP.md to match reality for the screens that already exist (`done` only if it meets BUILD_PROTOCOL's checklist; otherwise `review`).
7. **Docs:** add a short "Framework" section to `README.md` and the deviation ledger in `docs/Plan.md` (log: sidebar is the main navigation; ExpandableTabs are in-page only; DESIGN_SYSTEM supersedes Design.md for visuals, including Major colour `#92400E` and lucide severity icons instead of emoji).

## Rules
Don't add features, don't restyle existing screens beyond what's needed to adopt tokens, don't weaken a guardrail (role checks, validator, approval gate). Verify contrast of every token pair in DESIGN_SYSTEM §2 with a tool and record results in `docs/Testing.md`. If anything is ambiguous, make the smallest safe choice and tell me.

## Acceptance (run and show real output)
`npm run lint && npm run check:tokens && npm run check:types && npm run check:routes && npm test && npm run build` all pass; the existing login, sidebar and tabs still render correctly (screenshots at 360 px and 1280 px in `tests/screenshots/`); the mismatch table from step 1 shows every item resolved or explicitly listed as deferred.

## Finish with this report
(1) mismatch table and what changed, (2) files changed, (3) commands run + results, (4) tests added + counts, (5) contrast results, (6) not done/deferred, (7) known issues, (8) the first section to build next (should be Section 1: Entry, per SITEMAP §6).
