# FRONTEND STYLE PROMPTS — "Paper Brutalist" minimal modern UI

HOW TO USE
1. Copy `docs/DESIGN_SYSTEM.md` from this pack into your project's `docs/`, **replacing** the old DESIGN_SYSTEM.md. (It is the complete visual spec. The prompts below don't repeat it.)
2. Paste the **BRIEF** once. Then paste **F0 → F5 one at a time**; don't paste the next until the agent shows real output and screenshots for the current one.
3. Run F0 **before** building more screens: because everything uses tokens, later screens inherit the look automatically, and existing screens update with it.
4. These prompts change look, layout and interaction only. They must not change business logic, API, database, roles or domain types.
5. Works with Antigravity or your VS Code agent. If it's the agent that built the earlier phases, it already knows the docs.

---------------------------------------------------------------------
# BRIEF (paste once)

You are my senior front-end engineer and visual QA lead. I can't code. We are giving "Inkloom Guardian" a distinctive, modern front end: **minimalism + brutalism on off-white paper**: huge whitespace, big tight headings, thick black rules, boxed blocks, hard offset shadows, mono labels, one electric accent colour, flat fills. It must look designed and current, like today's design-led product sites, and be easier to use than a generic dashboard. Not pure white: paper `#F4F3EE`.

Read, in this order: `docs/DESIGN_SYSTEM.md` (v2, the visual source of truth), `docs/SITEMAP.md`, `docs/DOMAIN.md`, `docs/BUILD_PROTOCOL.md`, `docs/Design.md` (layout intent only; visuals are overridden), and the component notes in `docs/ui/` if present (login, expandable tabs, sidebar).

Ground rules
- **Only look, layout and interaction.** Do not change APIs, database, roles, domain types or business logic. If a visual change needs data that doesn't exist, tell me and stop.
- **Everything via tokens.** No raw hex/arbitrary px in feature code. Add anything new to the DESIGN_SYSTEM inventory first.
- **Brutal in style, never in usability.** Conventional navigation, predictable positions, real-looking buttons, readable type, strong contrast, visible focus. Brutalist trends that hurt usability (illegible type, hidden controls, unusual scrolling) are not allowed.
- **No fakery.** No made-up logos, testimonials, numbers, awards or stock images. Use real product UI (built from the seeded demo data) as the visual.
- **Polish is the point.** Brutalism looks unfinished when alignment slips. Strict 12-column grid, consistent spacing from the scale, consistent border widths, nothing off by a few pixels. Review screenshots yourself before reporting.
- **Accessibility floor:** names on all controls, `focus-visible` ring (3 px accent, offset 3), contrast ≥ 4.5:1 (UI parts ≥ 3:1), 44 px targets, keyboard operable, `prefers-reduced-motion` honoured, state never by colour alone, no horizontal scroll at 360 px.
- **Performance:** self-hosted fonts (Geist, Geist Mono) with `display: swap`; no heavy UI/animation/chart libraries beyond what's installed (framer-motion is allowed for the supplied components; keep bundles small); landing LCP < 2.5 s on a mid-range mobile profile.
- **How you work:** plan first (≤ 10 lines) → build → run everything and show real output (never "should work") → take screenshots at 360 px and 1280 px (and expanded/hover/focus states where relevant), save to `tests/screenshots/<phase>/` → self-critique against the DESIGN_SYSTEM Do/Don't list and fix what you find → report. If something needs me, stop and give numbered plain-language steps. Small commits with clear messages.
- **Report format:** (1) what changed visually, (2) files changed, (3) commands run + real results, (4) tests added + pass/fail, (5) screenshot paths, (6) self-critique findings you fixed, (7) not done/known issues, (8) proposed next phase.

Reply "READY" and nothing else once you've read the docs.

---------------------------------------------------------------------
# F0 — Foundation: tokens, fonts, base components, styleguide

1. Audit what exists: current colours/fonts/radii/shadows in use, which inventory components exist, how login/sidebar/tabs are styled. List mismatches with DESIGN_SYSTEM v2 (≤ 15 lines).
2. Rewrite `styles/tokens.css` for every token in DESIGN_SYSTEM §2–§5 (complete colour values, not HSL triplets), map into Tailwind (v3 `theme.extend` or v4 `@theme`), `color-scheme: light`, global `:focus-visible` ring rules, `::selection` in accent, `body` on `--paper`, text on `--ink`. Remove leftover gradients/glass/serif/soft-shadow tokens. Load Geist and Geist Mono via the framework font loader (self-hosted).
3. Build or restyle the base components exactly per §7: `Button` (4 variants, 3 sizes, loading, disabled-with-reason, hard-shadow hover/press behaviour), `Input`, `Textarea`, `Select`, `FileDrop`, `Badge`, `SeverityBadge`, `StatusPill`, `RuleChip`, `OriginChip`, `Card`, `Panel`, `SectionLabel`, `Dialog`/`ConfirmDialog` (focus trap, Escape, reason variant), `Toast` (`aria-live`), `Table`, `EmptyState`, `ErrorState`, `Skeleton`. Each has a Vitest test (renders, names, states, keyboard).
4. Restyle the three supplied components to the new system **without changing their behaviour or accessibility fixes**: `ExpandableTabs` (boxy, ink-filled active pill with label), `Sidebar` (surface-2, 2 px right edge, ink-filled active item), login `AuthPanel` (remove glass, gradient background and confetti; keep the step logic, labels, error handling and real login calls; layout per F1).
5. Create a public route `/styleguide` (add it to SITEMAP as `P8`, status `done` when finished) showing every token, type style, component and state (hover/focus/disabled/loading/error) for visual review. It must open with no sign-in.
6. Update `scripts/check-tokens.mjs` if needed so the new system passes (hex only in tokens.css). Update the deviation ledger in `docs/Plan.md` (login restyled from glass to Paper Brutalist, serif and gradient removed, Major/severity palette changed).
Acceptance: `npm run lint && npm run check:tokens && npm test && npm run build` pass; `/styleguide` screenshots at 360 and 1280 saved; contrast of every token pair verified with a tool and recorded in `docs/Testing.md`; existing screens still work (they now look different, that's expected).

---------------------------------------------------------------------
# F1 — Landing, Login and the app shell

**Landing `/`** (this is where the "modern website" feel lives):
- Header: brand mark (ShieldCheck + "INKLOOM GUARDIAN" in mono), links (Sample report · About AI · Build notes), **Try the demo →** button.
- Hero: oversized left-aligned headline "Check before you publish." (display scale), one-sentence subcopy ("Brand checks that cite the rule, explain the issue and leave the decision to a human."), two buttons (Try the demo, View sample report). Lots of empty space; a visible 2 px rule under the header and a thin grid feel (hairline column lines are allowed, subtle).
- **Proof strip:** a real, static rendering of the actual components using seeded data: the sentence "Our panels are the best on the market and guarantee 40% savings!" with highlights, next to two real `FindingCard`s (CLAIM-001 and NUM-001) showing rule key, source and suggestion. Label it "Example from the demo workspace".
- **How it works:** four numbered blocks (`01 Submit` · `02 Check` · `03 Review` · `04 Decide`) in a 4-column bordered grid (stack on mobile), one sentence each.
- **What it won't do** block: "The AI never approves. A human decides. Every approval is tied to the exact version." plus a link to About AI. No fake metrics, logos or quotes.
- Footer: links (Sample report, About AI, Build notes, GitHub), "Demo mode uses fictional data."
- Scroll reveals: subtle 250 ms fade/translate on sections only, disabled under reduced motion; no parallax.

**Login `/login`** (keep all existing behaviour: demo accounts first, optional Google, email/password steps, real error states, `next` validation):
- Desktop two columns: left = headline "Check before you publish." and three short rules (mono, numbered); right = boxed panel with 2 px border and hard shadow. Mobile: single column.
- Demo accounts as four stacked full-width blocks (name large, role in mono label, arrow icon), hover = hard-shadow lift, each one click. Google button secondary, disabled-with-explanation when not configured. Email steps slide horizontally (250 ms).
- Success state: hard-edged confirmation block "Welcome, Priya — Reviewer" then redirect; no confetti.

**App shell** (authenticated layout): paper background; sidebar per §7 (rail 64 px, overlay 280 px, pinned option, mobile drawer); content panel = `--surface` with 2 px left edge, square corners; `PageHeader` with large page title, one-line description and a 2 px bottom rule; page padding 24/32 px, content max-width 1280. Skip link first in tab order.
Acceptance: Playwright runs the three journeys' entry steps (landing → login → dashboard as each role) on desktop and 360 px; axe zero critical/serious on `/`, `/login`, `/dashboard`; Lighthouse landing performance ≥ 90 and accessibility ≥ 95 (show the numbers); screenshots of landing (full page), login (each step), shell (rail collapsed, expanded, drawer).

---------------------------------------------------------------------
# F2 — Dashboard and New content

**Dashboard `/dashboard`:** page title "Dashboard". Top: three or four large stat blocks (2 px borders, big mono numerals): "Need your action", "In review", "Open blockers", "Approved" — computed from real data. Then the content table (title, status pill, version, owner, open findings/blockers, last checked) with 48 px rows, hairline row rules, sortable headers, row click → `/content/[id]`. Empty state: "Nothing here yet" + **New content** button. Role-aware: creators see own items, reviewers/managers see all. Loading = flat skeleton rows; error = ErrorState.
**New content `/content/new`:** two large tab-like switches (Paste | Upload) as a boxy segmented control. Fields with visible labels: Title, Content type, Channel (if existing), the text area (large, mono optional toggle off by default), `FileDrop` for `.txt .md .docx .pdf` (and images with an alt-text field). Sticky bottom action bar with **Save & check** (accent) and a plain-language privacy note ("Text is stored in the demo database. AI checks receive a redacted copy."). Inline validation with error blocks; progress step labels while the check runs ("Rules ✓ · AI … · Validating").
Acceptance: Playwright for create-content journey (paste → check → lands on workspace), upload error cases (wrong type, too large), empty/loading/error states visible in screenshots; axe clean.

---------------------------------------------------------------------
# F3 — Review workspace (`/content/[id]`) — the screen that wins or loses the demo

Build in four visual sub-steps, stopping for my review after each (4a→4d), following BUILD_PROTOCOL:
- **4a Content pane:** header with title, `StatusPill`, version selector and Check again; reading text at 16/28 in the sans face, 72-character measure, highlights per DESIGN_SYSTEM §2 (marker fill + underline style), hover/focus link between highlight and its card, UTF-16 offsets correct (test with emoji/accents). Run banner: complete / "AI check unavailable — not cleared" / "No issues found by the checks that ran. A human reviewer still decides."
- **4b Findings pane:** `FindingCard` per §8 with severity band, mono rule key, quoted span, "Why", source line + `SourcePopover` (excerpt + link to the rule in Guidelines), suggestion block, `RULE`/`AI` chip and confidence, buttons Apply / Dispute / Dismiss… Filters as a compact toolbar (severity, category, status) with counts. Selected card gets the hard shadow and scrolls into view from its highlight.
- **4c Decisions:** reason dialogs for Dismiss/Override (≥ 10 chars), sticky `DecisionBar` (Approve / Request changes / Reject) with the blocked reason inline; confirm dialogs naming the version ("Approve version 3"); submit-for-review button states.
- **4d Side tabs:** `ExpandableTabs` (Comments · History · Audit) with count badges and smooth panel cross-fade; History shows `VersionDiff`; Audit rows in mono with short hashes. Mobile: Content | Findings switch; default to Findings when a blocker is open.
Layout: two panes on ≥ 1024 px separated by a 2 px rule (content ~60 %, findings ~40 %, each independently scrollable, header and decision bar fixed); stacked tabs below 1024.
Acceptance: the full creator→reviewer journey in Playwright at 1280 and 360 px with screenshots of each state (open blocker, disabled approve with reason, rules-only run, approved with audit row); keyboard-only run; reduced-motion run; axe zero critical/serious; layout shift ≤ 0.1 while selecting findings.

---------------------------------------------------------------------
# F4 — Guidelines, Insights, Audit, public pages

- **Guidelines `/guidelines?tab=`:** `ExpandableTabs` (Sources · Rules · Glossary · Facts · Rule sets). Rules as a table with rule key (mono), category, severity badge, source, enabled toggle; manager edits in a side `Dialog`/panel with inline validation; YAML editor in mono with line-numbered errors; "Publish v4" confirm dialog states the effect. Read-only presentation for non-managers (no dead buttons: show "Managers can edit").
- **Insights `/insights`:** four blocks with large mono numerals and flat charts per §8 (top violated rules, findings by category per week, most dismissed/overridden rules, median time to approval), each with data-table toggle and one-sentence summary. Charts are lightweight SVG/CSS (no heavy library unless one is already installed); direct labels; ink bars with one accent highlight.
- **Audit `/audit`:** filter toolbar, table with mono hashes and rule-set versions, expandable rows, Export CSV (manager).
- **Public pages:** `/demo-report` (the read-only sample reusing the real workspace components with a "Read-only sample" band), `/about-ai` (long-form text on a narrow 72-character column, numbered sections, a clear "what leaves the system" table), `/build-notes` (submission content as clean numbered sections and a features checklist table; the three Round 3 improvements as three bordered blocks), `/selftest` (pass/fail list in mono).
Acceptance: Playwright navigation across all `done` routes; manager-only edit controls absent for others; axe clean; screenshots at 360/1280 for each page; every public page opens signed-out.

---------------------------------------------------------------------
# F5 — Polish and QA sweep

1. **Consistency sweep:** run `check:tokens`; grep for off-scale spacing, non-2px borders, radii > 0 (except avatars), soft shadows, gradients, emoji; list and fix every hit.
2. **Visual QA:** screenshot every route in `done` status at 360, 768, 1280 (and 1920) in all states; check alignment to the 12-column grid, whitespace rhythm, heading hierarchy, truncation/overflow, long-text and RTL/emoji content, empty/error/loading versions. Fix anything that looks off, uneven or unfinished.
3. **Interaction QA:** hover/active/focus on every control, keyboard-only walkthrough of the three journeys, reduced-motion run, touch targets ≥ 44 px, no layout shift when sidebar/tabs/dialogs open.
4. **Accessibility:** axe on every route (zero critical/serious), contrast table of all token pairs (and the severity fills with black text) saved in `docs/Testing.md`, screen-reader spot check notes.
5. **Performance:** Lighthouse mobile on `/`, `/login`, `/dashboard`, `/content/[id]`; landing performance ≥ 90, accessibility ≥ 95, CLS ≤ 0.1; fix the worst offenders (font loading, image-free so mostly JS size); report bundle sizes.
6. **Cross-browser:** latest Chrome, Firefox and Safari/WebKit (Playwright) for the happy path; note any difference.
7. Update `docs/Design.md` with a pointer to DESIGN_SYSTEM v2 and mark which sections are superseded; update README screenshots; final report with a before/after pair for the landing and review workspace.
Acceptance: `npm run lint && npm run check:tokens && npm run check:types && npm run check:routes && npm test && npm run build && npm run e2e` all green, with the Lighthouse and axe numbers shown.

---------------------------------------------------------------------
# IF THE RESULT LOOKS GENERIC, UNFINISHED OR TOO "AI-MADE" (paste when needed)
"Compare your screenshots with docs/DESIGN_SYSTEM.md §1, §8 and §11. List five concrete places where the screen drifts from it (alignment off the grid, inconsistent border widths, soft shadows, rounded corners, centred layout, weak hierarchy, cramped spacing, grey low-contrast text). Fix them, re-take screenshots at 360 and 1280 px, and show the before/after. Do not add decoration to compensate: improve type scale, spacing, alignment and real product content instead."
