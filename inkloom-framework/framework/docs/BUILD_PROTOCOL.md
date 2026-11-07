# BUILD PROTOCOL — section by section

> Framework step 3: one section at a time; build, review, then the next; each referencing the shared map and system.
> Reads: `SITEMAP.md` (where it fits) · `DESIGN_SYSTEM.md` (how it looks) · `DOMAIN.md` (what the data is). Nothing else decides these three things.

## The loop (for every section in SITEMAP §6)
1. **Locate.** Quote the section's rows from SITEMAP.md (route, roles, data, actions, depends-on). Confirm dependencies are `done`.
2. **Plan (≤ 10 lines).** Components to reuse from the DESIGN_SYSTEM inventory; new components needed (add them to the inventory first); data types from DOMAIN.md; endpoints from API.md; states (loading/empty/error/forbidden).
3. **Build only this section.** No work on other screens. No new colours, spacings, fonts, or one-off components. No new data shapes: if a field is missing, add it to DOMAIN.md + Database.md + API.md first.
4. **Test.** Unit/component tests for new logic; Playwright for the screen's journey (SITEMAP §3); axe scan; screenshots at 360 px and 1280 px.
5. **Self-review checklist (must all be ticked, with evidence):**
   - [ ] Uses only tokens/inventory components (`npm run check:tokens` passes)
   - [ ] All four states present (loading, empty, error, forbidden) and visible in screenshots
   - [ ] Types come from `lib/domain/types.ts`; no local re-declared shapes
   - [ ] Roles match SITEMAP; server enforces, UI only reflects
   - [ ] Keyboard-only run works; focus visible; names on controls; contrast verified
   - [ ] Reduced-motion respected; no layout shift on interaction
   - [ ] Cross-links from SITEMAP §4 work
   - [ ] User text rendered as text only
6. **Update** the Status column in SITEMAP.md, add a row to `docs/Plan.md` deviation ledger if anything differed from plan, commit with a clear message.
7. **Stop and report** (format below). Wait for my "next" before starting the following section.

## Report format
(1) section built · (2) files changed · (3) commands run + real results · (4) tests added + counts · (5) checklist with evidence · (6) screenshots saved at paths · (7) not done / simulated · (8) known issues · (9) proposed next section.

## Per-section prompt template (paste with the blanks filled)
```
Build section <N>: <name> (<routes>) following docs/BUILD_PROTOCOL.md.
Read first: docs/SITEMAP.md, docs/DESIGN_SYSTEM.md, docs/DOMAIN.md, plus docs/API.md for the endpoints listed in the SITEMAP rows.
Scope: only <routes/sub-sections>. Do not touch other screens.
Specifics I care about: <1–3 bullets, e.g. "highlights must stay aligned with emoji text">.
Run the loop, show real command output, and stop after the report.
```

## Section-specific notes
- **Section 4 (review workspace) is split into 4a–4d.** Each sub-section ends with a working, demonstrable state: 4a text with highlights from real findings; 4b finding cards with source popovers and apply-suggestion → new version; 4c finding decisions + submit + approval with the blocker gate and disabled reasons; 4d comments, history with diff, audit tab. Do not start 4c before 4b is reviewed.
- **Sections 6–7 need real data** from sections 3–4; if the seed history is thin, extend the seed rather than hard-coding numbers in screens.
- **Section 8 (hardening)** is the existing S7 stage.

## Anti-drift guards (automate; don't rely on memory)
- `npm run check:tokens` — fails on raw hex colours or arbitrary pixel classes in feature code.
- `npm run check:types` — fails if a file declares its own `Finding`, `ContentItem`, `Rule`… instead of importing from `lib/domain/types`.
- `npm run check:routes` — compares the app's routes to SITEMAP.md and fails on routes not in the map or mapped routes missing from the app (while the section is marked `done`).
- Playwright smoke across all `done` routes on every PR.

## Relationship to the earlier stage prompts
The stage prompts (S0–S7), login, tabs and sidebar prompts remain valid. This protocol governs **how screens are built within S5 and later**: instead of "wire all screens" in one go, run sections 1–7 above one by one. S0–S4 (foundations, data, engine, pipeline, workflow) still run first.
