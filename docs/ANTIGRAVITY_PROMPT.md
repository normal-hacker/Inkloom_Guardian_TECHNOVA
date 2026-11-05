# PROMPT FOR ANTIGRAVITY — copy everything below this line

You are my AI website team. I can't code. Build me a complete, working website that I can open and use, and that hackathon judges can open from a public link with no sign-in.

## CONTEXT (read first)
**MY APP IDEA:** Inkloom Guardian — an AI-assisted brand-governance website. Content (text) goes in, it is checked against approved brand guidelines, terminology and facts, every issue is explained with the exact rule and source behind it, a fix is suggested that keeps the author's intent, and a HUMAN makes the final decision (approve / request changes / reject). The AI never approves anything.

**WHO IT'S FOR:** This is the Round 2 ("The Build") prototype for the Inkloom AI Brand Governance hackathon. Judges score: core workflow runs end to end (30), technical depth and reliability (25), progress against our Round 1 plan (20), the three Round 3 improvements we name (15), usability (10). Users in the product: Creators (submit content), Reviewers (decide), Managers (maintain rules, see insights).

**SOURCE OF TRUTH:** I've given you 15 planning files (README.md, PRD.md, Architecture.md, Design.md, Database.md, API.md, Agents.md, Plan.md, Setup.md, Features.md, Auth.md, MCP.md, Integrations.md, Testing.md, Debugging.md). Read ALL of them before doing anything. They define the product, rules, roles, data model, states, and guardrails. Do not contradict them except where the "PHASE A OVERRIDES" below say so.

## PHASE A OVERRIDES (this beats the docs where they conflict)
The docs describe a full stack (Next.js + FastAPI + PostgreSQL). We are starting from scratch and I can't code, so first we build **Phase A: a self-contained single-file prototype** that implements the same product behaviour in the browser. This is a deliberate deviation. Therefore:
1. Build ONE file, `index.html` (HTML + CSS + JavaScript, no frameworks, no CDN, no external fonts/scripts/images — it must work offline and from a plain public URL).
2. Data lives in memory and is persisted to `localStorage` (key `inkloom_guardian_v1`, with a schema version). Wrap storage in try/catch; if blocked, fall back to memory and show a small notice. Provide a "Reset demo data" button (Manager only, with confirm dialog).
3. The "database" is plain JS objects that mirror the tables in Database.md (same names and fields where practical: users, guideline_sources, rule_sets, rules, glossary_terms, approved_facts, content_items, content_versions, review_runs, findings, finding_decisions, comments, approvals, audit_log).
4. The "check" runs a **deterministic rule engine in JavaScript**. Do NOT fake an LLM. Label the checker everywhere as **"Rule engine (local, deterministic)"**. The docs' AI analyser is deferred; see OPTIONAL PHASE B. Being honest here matters: hackathon rules forbid misleading claims.
5. Uploads: `.txt` and `.md` (read with FileReader) plus paste. Images: accept PNG/JPG/WebP for preview + the alt-text accessibility check only. `.docx`/`.pdf` are NOT supported in Phase A — show a clear message saying so ("supported in the full-stack version").
6. Auth is simulated: the landing page has **Try the demo** buttons for 4 seeded users (Creator Asha, Creator Ben, Reviewer Priya, Manager Marcus). No passwords, no real security claims. Role permissions are still enforced in code exactly per Auth.md's matrix, including: creators see only their own items; blocker dismiss/override needs reviewer/manager + reason; a user can never approve their own content.
7. Hash router (`#/...`) so every screen has a shareable URL and the Back button works.

## NON-NEGOTIABLE RULES
- No placeholders, no "TODO", no lorem ipsum, no "add your code here". Every button on every screen does something real.
- Escape all user text. Use `textContent`/safe DOM building for anything user-provided; never `innerHTML` with user data. Add a restrictive CSP `<meta>` where compatible with inline script/style.
- Every finding MUST contain: rule key, rule-set version, source document + section, exact quote, start/end offsets where `text.slice(start,end) === quote` (assert this in code; drop and log any finding that violates it), explanation, severity, category, suggestion (or none).
- A run with zero findings must say "No issues found by the rule engine. A human reviewer still decides." — never "approved" or "safe".
- Approval is a human-only action and is blocked while any `blocker` finding is open, or when the current version has not been checked (stale check). Show the reason on the disabled button.
- Dismiss/override requires a reason of at least 10 characters.
- Content versions, review runs, approvals and audit entries are append-only. Each version stores a SHA-256 hash of its text (use `crypto.subtle` with a small pure-JS SHA-256 fallback, because some contexts block it). Audit rows store content hash + rule-set version.
- Accessibility (we build an accessibility checker, so we must pass our own): keyboard operable everywhere, visible focus, labelled inputs, `aria-live` for status messages, contrast ≥ 4.5:1, severity never shown by colour alone (icon + text + underline style), `prefers-reduced-motion` respected.
- Mobile-first, works from 360px wide up; the review workspace stacks into tabs (Content / Findings) on small screens.
- Hackathon integrity: put a visible "Built with AI assistance: Antigravity (Google), Claude" disclosure on the About AI and Build Notes pages. All demo data is invented (fictional brand "Brightway Solar").

## HOW TO WORK
Work as a team of four, in this exact order. Show each role's work under its own heading. Make git commits after each role finishes (commit messages say which role). Do not skip a role.

### 1. PLANNER
- Do NOT redo broad market research. In ≤ 15 lines, confirm you understood the docs: users, the 6 interview asks (exact rule+source, exact-version audit trail, versioned rules, no auto-approval, stale-content check, human control), and what similar tools (Lytho, Adobe Brand Concierge-style tools, Bynder) do well; state our differentiator: cited findings + exact-version audit + enforced human gate.
- Confirm the Phase A must-have list (cut everything else): (1) demo roles, (2) brand knowledge base viewer/editor with versioned rule sets, (3) content intake, (4) rule engine with cited findings, (5) review workspace with highlights + suggestions + apply-as-new-version, (6) human decision workflow with blocker gate, (7) audit log, (8) insights, (9) About AI + Build Notes + public sample report. Comments and version diff are P1: build them if time allows after everything else passes testing.
- Screens (build exactly these) and what each button does — list them:
  1. **Landing** `#/` (public): headline "Check before you publish.", 3-step explainer, Try the demo (4 role buttons), links to Sample report, About AI, Build Notes.
  2. **Dashboard** `#/app/dashboard`: items needing my action, table of content with status/version/owner/open findings; "New content".
  3. **New content** `#/app/new`: tabs Paste | Upload; title, content type (blog, social, ad, web, press, other); image alt-text field when an image is chosen; "Save & check".
  4. **Review workspace** `#/app/content/:id` — the most important screen: highlighted text with underline styles by severity; finding cards (severity, category, Rule/engine chip, rule key + title, "Why", source with an "Open source" popover showing the guideline excerpt, suggestion, buttons Apply / Dismiss… / Override…); filters by severity/category/status; version selector; buttons Check again, Submit for review; decision bar for reviewers/managers (Approve / Request changes / Reject) with confirm dialogs; tabs Comments, History, Audit for this item.
  5. **Guidelines** `#/app/guidelines`: tabs Sources, Rules, Glossary, Facts, Rule sets. Managers can edit a draft rule set (enable/disable a rule, change severity, edit explanation), add glossary terms and facts, and "Publish vN" (creates new active version, archives the old one, writes audit). Others see read-only.
  6. **Insights** `#/app/insights` (reviewer/manager): top violated rules, findings by category (per week), most dismissed/overridden rules ("possibly unclear guidelines"), median time to approval; every chart has a data-table toggle and a one-sentence text summary. Compute from stored data, not hard-coded.
  7. **Audit** `#/app/audit` (reviewer/manager): filterable table, row expands for detail, Export CSV (manager).
  8. **About AI** `#/about-ai` (public): what the checker does and does not do, what data leaves the browser (nothing in Phase A), limitations, build-tool disclosure.
  9. **Sample report** `#/demo-report` (public, read-only): a seeded approved item with 2 versions, findings, a dismissal with reason, approval, audit rows.
  10. **Build Notes** `#/build-notes` (public): this page is OUR Round 2 SUBMISSION CONTENT — (a) list of completed features (generated from a features array so it stays accurate), (b) technology and implementation details, (c) explanation of changes made to the original plan (the deviation ledger: pgvector/RAG deferred; full-stack deferred to Phase B; stale-content check moved to Round 3; formats limited to txt/md/images; AI analyser replaced by deterministic engine in Phase A), (d) the three Round 3 improvements: **Stale-content re-audit**, **Guideline-gap detector**, **Visual compliance check** (do NOT build these now), (e) team roles (Ugesh Kumar – AI/Backend, Raghvendra Basarwar – Full-Stack/Product, Riya Sharma – Product/UX/Pitch), (f) honest known limitations.
  11. **Self-test** `#/selftest` (public): runs the in-page engine tests (see TESTER) and shows pass/fail.
- Do not ask me questions unless truly blocked (max 3). The docs answer almost everything. List your assumptions.

### 2. DESIGNER
Follow Design.md. Palette: ink `#111827`, secondary `#4B5563`, border `#E5E7EB`, page `#F9FAFB`, brand `#4F46E5` (hover `#4338CA`); Blocker `#B91C1C` on `#FEE2E2`, Major `#B45309` on `#FEF3C7`, Minor `#1D4ED8` on `#DBEAFE`, Info `#374151` on `#F3F4F6`, OK `#047857` on `#D1FAE5`. System font stack (no downloads), mono stack for rule keys. 4px spacing grid, 8px radius cards. Severity: ⛔ Blocker (solid underline), ▲ Major (dashed), ● Minor (dotted), ℹ Info. Design every screen mobile-first so it looks like a real product, not a template. Include empty states, loading states (step labels while a check runs), and error states. Give me a short style summary (hex codes, type scale, button styles) before building.

### 3. BUILDER
Build the full app in `index.html` per the overrides above. Organise the script into clearly commented sections: store+persistence, seed data, hashing, rule engine, router, views, a11y helpers, self-tests. Implement the following EXACTLY.

**Seed brand pack (fictional "Brightway Solar")**
Sources: S1 "Brand Voice Guide" v4; S2 "Terminology Sheet" 2025; S3 "Approved Facts Sheet" 2025-Q3; S4 "Accessibility & Asset Policy" v2. Give each a short body text with numbered sections so "Open source" popovers show a real excerpt.
Active rule set v3 (v1, v2 archived, with short change notes). Rules (key · category · severity · what it detects · source):
- TONE-001 · tone · minor · 2+ exclamation marks in a row, or more than 1 "!" per 60 words · S1 §2.1 — suggestion: replace with "."
- TONE-002 · tone · major · pressure phrases: "act now", "limited time only", "don't miss out", "hurry", "last chance" · S1 §2.3
- TONE-003 · tone · minor · hype words: revolutionary, game-changing, unbelievable, amazing, mind-blowing · S1 §2.4
- TERM-001 · terminology · major · banned terms from the glossary (see below), each with preferred alternative as suggestion · S2 §1
- TERM-002 · terminology · minor · product name must be written "SunLink" (flag "Sun Link", "Sunlink", "SUNLINK", "sun-link") · S2 §2
- MSG-001 · messaging · major · comparative claims: "better than", "cheaper than", "unlike other", "beats" · S1 §4.1
- CLAIM-001 · claim · blocker · superlatives: best, #1, number one, fastest, leading, unbeatable, world-class, only (whole words, case-insensitive) · S1 §5.2
- CLAIM-002 · claim · blocker · guarantee language: guarantee, guaranteed, risk-free, "100%" · S1 §5.3
- NUM-001 · fact · blocker · every figure with a unit must be supported by an approved fact (algorithm below) · S3 §1
- CONF-001 · confidentiality · blocker · "Project Helios", "unreleased", "internal only", "do not share", and any email address · S1 §7
- ACC-001 · accessibility · major · image without alt text (empty or < 5 characters) · S4 §1.1
- ACC-002 · accessibility · minor · link-style text "click here" / "read more" / "learn more" alone · S4 §1.3
- ACC-003 · accessibility · minor · runs of 4+ consecutive ALL-CAPS words · S4 §1.5
Glossary: banned → alternative: "cheapest" → "affordable"; "free energy" → "clean energy"; "zero bills" → "lower bills"; "solar cells" → "solar panels". Discouraged → alternative: "users" → "customers"; "green" → "renewable" (info severity).
Approved facts (key · statement · values · unit · context keywords):
- F-001 · Average household electricity-bill savings were 18–24% (2025 customer study, n=412) · 18–24 · % · savings, save, saving, bill, bills, electricity
- F-002 · Panels carry a 25-year performance warranty · 25 · years · warranty, panels, performance
- F-003 · Typical home installation takes 1–2 days · 1–2 · days · install, installation, installed
- F-004 · The inverter carries a 12-year warranty · 12 · years · inverter
- F-005 · Panel efficiency is up to 22.5% · 22.5 · % · efficiency, efficient
- F-006 · Brightway Solar serves customers in 14 cities · 14 · cities · cities, serve, serves
**NUM-001 algorithm (implement exactly, and unit-test it):** find numbers with units via regex supporting ranges and hyphens ("25-year", "18–24%", "1 to 2 days", "22.5 %", "40 percent"). Normalise units (percent→%, year/years→years, day/days→days, city/cities→cities). For each figure take the ±80-character window around it. Find approved facts of the same unit whose context keywords appear in that window. If such a fact exists: supported only if the claimed value (or claimed range) lies inside the fact's value/range — otherwise a blocker finding that names the fact ("Approved figure is 18–24%; 40% is not supported") with the fact's replacement as suggestion. If no fact of that unit has context in the window: a **major** finding "No approved fact supports this figure." with no suggestion. Ignore bare numbers with no unit (years like 2025, list numbers). Document in Build Notes the known limitation that matching is keyword-window based, not semantic.
Engine requirements: pure functions `runRules(text, ctx) → findings[]`; word-boundary matching that is Unicode-safe; de-duplicate overlapping spans keeping the higher severity (tie → earlier rule order); sort by severity then position; cap 50 findings; each finding gets a stable id. Run in a try/catch: if the engine throws, mark the run `error`, show "Check failed — not cleared", never show a clean result.
Apply suggestion: replaces ONLY the quoted span, creates a new version (never mutates old ones) with change note, and marks the status as "needs re-check".

**Workflow states:** `draft → checked → in_review → approved | changes_requested | rejected`. Editing/applying creates a new version and invalidates approval until re-checked. Submit for review requires a complete run on the current version. Self-approval is forbidden (show message). A "Request changes"/"Reject" requires a note.

**Roles:** Creator Asha, Creator Ben, Reviewer Priya, Manager Marcus. Role badge in the top bar; switching user is done from a user menu (re-seeded state persists). Enforce the Auth.md matrix in code and hide/disable accordingly with visible reasons.

**Seed content:** 5 items — (1) APPROVED "Spring savings blog" by Asha with v1 (issues) → v2 (fixed) and a recorded approval by Priya, used for the public sample report; (2) IN_REVIEW "Installer partnership post" by Ben with one open blocker; (3) CHANGES_REQUESTED "Social post: SunLink launch"; (4) CHECKED "Homepage banner copy"; (5) DRAFT "Press note". Also seed ~40 historical findings/decisions over the last 90 days so Insights shows trends, with TONE-003 and ACC-003 dismissed/overridden > 50% so the "possibly unclear guidelines" list is non-empty.

**Optional Phase B (do NOT start until the TESTER reports zero open bugs, and only if I say "go Phase B"):** add an optional "AI second opinion" panel where the user pastes their own LLM API key (stored in `sessionStorage` only, with a warning that keys in browsers are for demos). Rules: send redacted text only (emails, phones, confidential terms replaced by placeholders); require JSON output; validator drops any finding whose rule key is unknown or whose quote is not an exact substring; on any failure show "AI check unavailable — not cleared" and keep rule-engine results; mark AI findings with an "AI" chip. If you can't do this safely, skip it and say so.

### 4. TESTER
Use the app in a real browser like a real user, on desktop width and 375px width. Test every button, form, role and screen, including edge cases: empty text, whitespace-only text, 50,000-character text (must not freeze), `<script>`/`<img onerror>` strings (must render inert), emoji and accented text (highlights line up), double-clicking Check/Approve (no duplicate runs/approvals), Back/forward navigation, refresh mid-flow (state persists), blocked localStorage, switching role while on a page, direct URL to another user's item as a creator (must be denied), uploading an unsupported file, an image without alt text.
Build the in-page `#/selftest` suite and make sure it passes. It must include at least these cases:
1. `"Our panels are the best on the market and guarantee 40% savings!"` → findings: CLAIM-001 ("best"), CLAIM-002 ("guarantee"), NUM-001 blocker ("40%" vs F-001 18–24%), TONE-001 not triggered (single "!"); every quote equals `text.slice(start,end)`.
2. `"Customers report average bill savings of 22% after installation."` → no NUM-001 finding for 22%.
3. `"Savings of 18-24% on your electricity bill."` → supported (range inside F-001).
4. `"Enjoy 30% off and a 25-year panel warranty."` → "30%" gets the major "no approved fact" finding; "25-year" supported by F-002.
5. `"BUY NOW AND SAVE BIG TODAY!!"` → ACC-003 and TONE-001 (and TONE-002 not triggered).
6. `"We are cheaper than every rival. Click here"` → TERM-001? (no) / MSG-001 and ACC-002 present.
7. `"Contact me at jo@example.com about Project Helios"` → two CONF-001 findings.
8. Clean sentence `"Brightway Solar installs panels for homes."` → 0 findings and the UI text says a human still decides.
9. Overlap: "the best, guaranteed 100% result" → no overlapping findings after de-duplication.
10. XSS: `<img src=x onerror=alert(1)>` as content → displayed as literal text.
11. Approve blocked with an open blocker; approve blocked on stale check; approve blocked for own content; allowed after resolving + re-check by a different reviewer.
12. Dismiss with a 5-character reason rejected; with 12 characters accepted.
13. Audit log has a row for every create, check, decision, approval, rule-set publish, each with content hash + rule-set version; no UI path edits or deletes audit rows.
14. Publishing rule-set v4 does not change older runs' cited rule-set version (v3).
15. SHA-256 of `"abc"` equals `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad` (both implementations).
List every bug you find. The Builder then fixes them. Repeat test → fix until nothing breaks and the self-test is all green. Run an accessibility pass (keyboard-only walkthrough, contrast, labels) and fix issues.

## FINALLY
1. Give me the final, corrected full code (save it as `index.html` in the project folder and show it as a live preview). Do not truncate it.
2. Update `README.md` (tick only features that truly work, add the "Phase A single-file" note) and add rows to the deviation ledger in `Plan.md`. Do not change anything else in the docs.
3. Tell me in 3 simple steps how to open and use it, and 3 simple steps to put it online for judges (e.g. drag-and-drop to Vercel or Netlify, or GitHub Pages), including how to confirm it opens in an incognito window with no sign-in.
4. Give me a 6-line honest status: what works, what is simulated, what is not built, known bugs, and what Phase B (the full-stack version from the docs) should do next.
5. Suggest 3 features for version 2 — they must be our three Round 3 improvements (Stale-content re-audit, Guideline-gap detector, Visual compliance check), each with a 3-line plan. Do not build them now.
