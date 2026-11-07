# DESIGN SYSTEM v2 — "Paper Brutalist" (locked)

> Replaces the previous DESIGN_SYSTEM.md. Single source of truth for everything visual. If any older doc (Design.md, login/sidebar/tabs prompts) disagrees on look, this wins. Behaviour, roles, data and routes are unchanged (SITEMAP.md, DOMAIN.md).
> Contrast numbers were calculated by hand; the agent must verify with a tool and record results in `docs/Testing.md`.

## 1. Direction in one paragraph
A modern, minimalist-brutalist product UI on **off-white paper**, not pure white. Lots of empty space, big confident type, visible structure (thick black rules, boxed blocks, hard offset shadows), one electric accent colour, flat colour fills for severity. It should feel intentional and current — like today's design-led product sites — while staying **instantly usable**: conventional navigation, predictable placement, buttons that look like buttons, high contrast. Brutal in style, never in usability.

## 2. Tokens (single source: `styles/tokens.css`, mapped into Tailwind)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4F3EE` | App/page background (the "light white") |
| `--surface` | `#FBFAF6` | Cards, inputs, content panel |
| `--surface-2` | `#ECEAE3` | Sidebar, table header, quiet blocks |
| `--ink` | `#0A0A0A` | Text, borders, hard shadows (≈ 18:1 on paper) |
| `--ink-2` | `#4A4A45` | Secondary text (≈ 8:1) |
| `--ink-3` | `#6B6B64` | Captions only, ≥ 12 px (≈ 4.8:1) |
| `--rule` | `#D9D7CF` | Hairline dividers (decorative, not text) |
| `--accent` | `#2D2AE8` | Primary actions, links, active states (≈ 7.2:1 on paper; white text on it ≈ 8:1) |
| `--accent-ink` | `#FFFFFF` | Text on accent |
| `--focus` | `#2D2AE8` | Focus ring on light surfaces |
| `--focus-on-dark` | `#F4F3EE` | Focus ring on ink/accent surfaces |
Flat severity/status fills — **text is always `--ink` (black), border always 2 px `--ink`**, so contrast is ≥ 7:1:
| Name | Fill | Icon (lucide; verify names) |
|---|---|---|
| Blocker | `#FF6B5E` | `OctagonX` |
| Major | `#FFC93C` | `TriangleAlert` |
| Minor | `#9CC2FF` | `CircleAlert` |
| Info | `#E4E2DA` | `Info` |
| Approved / OK | `#86E3A9` | `CircleCheck` |
Status pills reuse the same fills: draft `#E4E2DA`, checked `#9CC2FF`, in_review `#C9C7FF`, changes_requested `#FFC93C`, approved `#86E3A9`, rejected `#FF6B5E`; each is icon + text + 2 px border. Severity/status is never colour alone.
Content-pane highlights: marker background in the severity fill at ~55% opacity plus underline (blocker solid 3 px, major dashed, minor dotted); text stays `--ink`.

## 3. Typography
- **Geist** (sans) for UI and headings; **Geist Mono** for labels, rule keys, quoted spans, numbers and audit hashes. Load with the framework's font loader (self-hosted, `display: swap`, subset). **No serif anywhere.**
- Fluid scale with `clamp()`: display (landing only) `clamp(3rem, 9vw, 8rem)` / 0.95 line-height / tracking −0.04em / weight 600 · page title `clamp(1.875rem, 3.2vw, 3rem)` / 1.05 / −0.03em · section title 1.5rem / 600 · body 1rem (16px) / 1.6 · small 0.875rem · label (mono, uppercase) 0.75rem / tracking +0.06em / weight 500 — never below 12 px.
- Headings are left-aligned, tight, short. Numbered section labels like `01 — Findings` in mono.

## 4. Space, grid, shape
- Base unit 4 px; allowed: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Be generous: sections 96–128 px apart on desktop, 48–64 on mobile; blocks have 24–32 px inner padding.
- 12-column grid, max width 1280 px, gutters 24 px (16 on mobile). Asymmetric layouts welcome (e.g. 5/7 split), but alignment to the grid is strict.
- **Radius 0** everywhere (inputs, buttons, cards, badges, dialogs). Only avatars are circles.
- **Borders:** 2 px `--ink` for structure (cards, buttons, inputs, panes, sidebar edge); 1 px `--rule` for quiet dividers.
- **Shadows:** no blur shadows anywhere. Raised/interactive elements use a hard offset shadow: `4px 4px 0 var(--ink)`; overlays/dialogs `8px 8px 0 var(--ink)`.
- Breakpoints: 360 (min) · 768 (sidebar rail) · 1024 (two-pane review) · 1280.

## 5. Interaction & motion
- Buttons: rest = border + `4px 4px 0` shadow; hover = translate(−2px, −2px) and shadow `6px 6px 0`; active = translate(2px, 2px), shadow `0`; 120 ms linear/ease-out. Disabled = `--surface-2` fill, `--ink-3` text, dashed border, plus visible reason text.
- Inputs: 2 px ink border, `--surface` fill; focus = ring (§ below) + shadow `4px 4px 0 var(--accent)`; error = 2 px `--ink` border + blocker-fill message block with icon.
- Focus ring (all interactive): `outline: 3px solid var(--focus); outline-offset: 3px` (use `--focus-on-dark` on dark/accent fills). Never removed.
- Motion budget: 120 ms (press/hover) · 250 ms (header strip, tab/panel changes, drawer) · 400 ms (sidebar, expandable tab). Slides and clip-reveals only; no parallax, no blur/glass, no confetti, no auto-playing marquee. First paint of a deep link has no intro animation. `prefers-reduced-motion: reduce` → instant state changes.

## 6. Iconography and imagery
lucide-react only, 20 px (16 inline), stroke width 2 to match the 2 px borders. No emoji icons. No stock photos or illustrations; visual interest comes from type, grid, real product UI and flat colour. **No fabricated logos, testimonials, statistics or awards** (hackathon rules forbid misleading claims).

## 7. Component inventory (build once; feature code may not restyle them)
| Component | File | Notes |
|---|---|---|
| `Button` | `components/ui/button.tsx` | primary (accent fill, white text) · secondary (surface, ink text) · ghost (no shadow, underline on hover) · destructive (blocker fill, ink text); sm/md/lg; loading; disabled-with-reason; min 44 px |
| `Input`, `Textarea`, `Select`, `FileDrop` | `components/ui/` | label always visible above; hint/error with `aria-describedby` |
| `Badge`, `SeverityBadge`, `StatusPill`, `RuleChip`, `OriginChip` | `components/ui/` | rectangular, 2 px border, icon + text |
| `Card`, `Panel`, `SectionLabel` (`01 — Title`) | `components/ui/` | |
| `Dialog`, `ConfirmDialog`, `Toast` | `components/ui/` | hard 8 px shadow; reason field variant (≥ 10 chars) |
| `Table` | `components/ui/` | 2 px ink header rule, 1 px row rules, no zebra, mono for ids/hashes |
| `ExpandableTabs` | `components/ui/expandable-tabs.tsx` | boxy: 2 px border container; active pill = ink fill + paper text with label; in-page tabs only |
| `Sidebar` family | `components/ui/sidebar.tsx` | rail 64 px / overlay 280 px / drawer; `--surface-2`, 2 px right border; active = ink fill + paper text + label |
| `PageHeader` | `components/layout/PageHeader.tsx` | big title + one-line description; 2 px bottom rule |
| `EmptyState`, `ErrorState`, `Skeleton` | `components/ui/` | skeleton = flat `--surface-2` blocks, no shimmer gradient (use a simple opacity pulse unless reduced motion) |
| `FindingCard`, `HighlightedText`, `SourcePopover`, `DecisionBar`, `VersionDiff`, `ChartWithTable` | feature folders | see §8 |
| `AuthPanel` (login) | `components/ui/sign-up.tsx` | restyled to this system: keep the step logic/animation, **remove glass, gradient background and confetti** |
New components must be added here (file path, variants) in the same change that creates them.

## 8. Patterns for the key surfaces
- **Finding card:** 2 px bordered block; top band = severity fill with icon + label (e.g. `■ BLOCKER · CLAIM`) in mono; body: quoted span in mono on `--surface-2`, plain-language "Why", source line (`Brand Voice Guide v4 · §5.2` underlined link), suggestion block with `Apply` button; chips `RULE`/`AI` + confidence; hard shadow when selected or hovered.
- **Decision bar:** sticky at the bottom of the workspace, 2 px top rule; Approve (accent) / Request changes (secondary) / Reject (destructive); when blocked, the reason sits next to it in plain text ("2 blockers open").
- **Tables:** dense but airy rows (min 48 px), mono for ids/hashes, status pills, sticky header.
- **Charts:** flat bars in `--ink` with one `--accent` highlight, direct value labels, no gradients/3D, always paired with a data table toggle and a one-sentence summary.
- **Empty/error/forbidden:** big short sentence, one button, optional mono request id.

## 9. State patterns (every screen)
Loading (flat skeletons shaped like the final layout) · empty (sentence + next action) · error (plain cause + "Try again" + request id) · forbidden/404 (friendly, link to dashboard) · disabled actions show reasons · success = toast + visible state change.

## 10. Copy and voice
Plain, direct, a little dry. Buttons start with verbs ("Save & check", "Approve version 3"). Sentence case; mono labels uppercase. AI output labelled "AI suggestion"; deterministic output "Rule". Never say "pass/fail" about people.

## 11. Do / Don't
**Do:** off-white paper, black 2 px rules, hard shadows, mono labels, big whitespace, left-aligned oversized headings, real product UI as the visual, one accent colour, flat fills.
**Don't:** gradients, glass, blur, soft drop shadows, rounded corners, neon glows, emoji, stock imagery, decorative blobs, centred-everything hero layouts, more than one accent colour, tiny low-contrast grey text, hidden affordances, weird navigation. The look must not reduce legibility or discoverability.

## 12. Rules for feature code (enforced)
1. Only tokens/Tailwind theme values; no raw hex or arbitrary px in feature code (`npm run check:tokens`; hex allowed only in `styles/tokens.css`).
2. Reuse inventory components; no one-off buttons/cards.
3. Accessibility floor: names on controls, focus ring, contrast ≥ 4.5:1 (UI parts ≥ 3:1), 44 px targets, keyboard operable, reduced motion honoured, user text rendered as text only.
4. Every screen PR includes screenshots at 360 px and 1280 px, and a Lighthouse check (landing: performance ≥ 90, accessibility ≥ 95; app screens: accessibility ≥ 95, CLS ≤ 0.1).
