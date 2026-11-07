# DESIGN SYSTEM — locked

> Framework step 2: define once, before screens. Every screen inherits this; nothing is invented per screen.
> Precedence: for anything visual, this wins over `Design.md`. Where it differs (severity icons, Major colour, fonts) this file is correct. Layout intent in Design.md still applies.
> Contrast values below were calculated by hand; the agent must verify with a tool and record results in `docs/Testing.md`.

## 1. Look and feel
Calm, precise, trustworthy — a review tool, not a marketing site. Light theme only. Quiet surfaces, one brand colour, strong colour reserved for severity. **No decorative gradients, glows or glass inside the app** (see §9). Explain-before-alarm: severity always comes with an icon and a text label.

## 2. Colour tokens (single source: `styles/tokens.css`; mapped into Tailwind)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F9FAFB` | App background |
| `--surface` | `#FFFFFF` | Cards, content panel |
| `--surface-muted` | `#F3F4F6` | Rails, table stripes, muted pills |
| `--border` | `#E5E7EB` | Borders, dividers |
| `--ink` | `#111827` | Primary text |
| `--ink-2` | `#4B5563` | Secondary text (≥ 7:1 on white) |
| `--brand` | `#4F46E5` | Primary actions, active nav, links (≈ 6.3:1 on white) |
| `--brand-hover` | `#4338CA` | Hover/pressed |
| `--brand-soft` | `#E0E7FF` | Selected backgrounds |
| `--focus` | `#4F46E5` | Focus ring (2 px, offset 2 px) |
Severity (text on background; icon uses the text colour):
| Severity | Text | Background | Border | Icon (lucide) |
|---|---|---|---|---|
| Blocker | `#B91C1C` | `#FEE2E2` | `#FCA5A5` | `OctagonX` |
| Major | `#92400E` | `#FEF3C7` | `#FCD34D` | `TriangleAlert` |
| Minor | `#1D4ED8` | `#DBEAFE` | `#93C5FD` | `CircleAlert` |
| Info | `#374151` | `#F3F4F6` | `#D1D5DB` | `Info` |
Status pills (text / bg): draft `#374151/#F3F4F6` · checked `#1D4ED8/#DBEAFE` · in_review `#4338CA/#E0E7FF` · changes_requested `#92400E/#FEF3C7` · approved `#047857/#D1FAE5` · rejected `#B91C1C/#FEE2E2`. Each pill = icon + text.
Highlight underline styles in the content pane: blocker solid 2px, major dashed, minor dotted, info none + faint bg; colour from the severity text colour; never colour alone.
Verify every icon name exists in the installed lucide version.

## 3. Typography
- UI: **Inter** (self-hosted via the framework's font loader). Mono for rule keys and quoted spans: **JetBrains Mono**. One serif display face (via the font loader) used **only** for the hero headings on `/login` and `/`; app screens never use serif.
- Scale (px / line-height): 12/16 · 14/20 · 16/24 · 20/28 · 24/32 · 32/40. Page title 24 semibold; section title 20 semibold; body 14 or 16; table/label 14; caption 12.
- Weights: 400 body, 500 labels/buttons, 600 headings.

## 4. Spacing, layout, shape
- 4 px grid: 4, 8, 12, 16, 24, 32, 48, 64. Only these values.
- Shell: sidebar rail 64 px (expanded overlay 280 px) · content panel `rounded-tl-2xl` white with 1 px `--border` · page content max-width 1200 px · gutters 16 (mobile) / 24 / 32.
- Radius: 6 inputs · 8 cards/popovers · 12 content panel & dialogs · full pills/badges.
- Elevation: cards `shadow-sm`; overlays (sidebar expanded, dialog, popover) `shadow-lg`. No other shadows.
- Breakpoints: 360 (min supported) · 768 (sidebar rail appears) · 1024 (review workspace goes two-pane) · 1280.

## 5. Motion
Durations 150 ms (hover/press) · 250 ms (panels, header strip) · 400 ms (expandable tab, sidebar). Ease-out; the expandable tab uses a spring with bounce 0, no delay. `prefers-reduced-motion: reduce` → no springs, no slides, instant state changes. Nothing animates on first paint of a deep link.

## 6. Iconography
lucide-react only, 20 px in navigation/buttons, 16 px inline, stroke width default. No emoji as icons, no mixed icon sets, every icon-only control has an accessible name and a tooltip.

## 7. Component inventory (build once, reuse everywhere; feature code may not restyle them)
| Component | File | Variants / props | Notes |
|---|---|---|---|
| `Button` | `components/ui/button.tsx` | primary · secondary · ghost · destructive; sm/md; loading; disabled with `disabledReason` | Min 44 px touch height on mobile |
| `Input`, `Textarea`, `Select`, `FileDrop` | `components/ui/` | label, hint, error, `aria-describedby` | Always visible label |
| `Badge`, `SeverityBadge`, `StatusPill`, `RuleChip`, `OriginChip` (Rule/AI) | `components/ui/` | per §2 | icon + text |
| `Card`, `Panel` | `components/ui/` | — | |
| `Dialog`, `ConfirmDialog` | `components/ui/` | reason field variant (≥ 10 chars) | Focus trap, Escape |
| `Toast` | `components/ui/` | success, error, info | `aria-live` |
| `Table` | `components/ui/` | sortable, empty, loading rows | |
| `ExpandableTabs` | `components/ui/expandable-tabs.tsx` | `nav` · `tabs` | In-page tabs only (decision: sidebar is main nav) |
| `Sidebar` family | `components/ui/sidebar.tsx` | rail/overlay/pinned/drawer | Main navigation |
| `PageHeader` | `components/layout/PageHeader.tsx` | title, description, chips | |
| `EmptyState`, `ErrorState`, `Skeleton` | `components/ui/` | | See §8 |
| `FindingCard` | `components/findings/FindingCard.tsx` | open/fixed/dismissed/overridden | Quote, why, rule key, source popover, suggestion, actions |
| `HighlightedText` | `components/findings/HighlightedText.tsx` | segments with finding ids | UTF-16 offsets; text only, never HTML |
| `SourcePopover` | `components/findings/` | excerpt + link to rule | |
| `DecisionBar` | `components/review/DecisionBar.tsx` | Approve / Request changes / Reject | Disabled shows reason inline |
| `VersionDiff` | `components/review/` | word-level | |
| `ChartWithTable` | `components/insights/` | chart + data-table toggle + text summary | |
| `AuthGlass*` (glass button/input, gradient bg) | `components/ui/sign-up.tsx` | — | **Auth screens only** |
New components must be added to this table (with file path and variants) in the same change that creates them.

## 8. State patterns (every screen)
- **Loading:** skeletons matching the final layout; the check run shows step labels ("Rules ✓ · AI … · Validating").
- **Empty:** icon + one sentence + the next action button.
- **Error:** plain-language cause + "Try again"; never a stack trace; includes request id in small text.
- **Forbidden/404:** friendly page with a link back to the dashboard.
- **Disabled actions:** visible reason text, not just a greyed button.
- **Success:** toast + state change; never rely on colour alone.

## 9. Surfaces: where the "glass" login look is allowed
Glass buttons/inputs, serif hero text and the animated gradient background are allowed **only** on `/login` (and the `/` hero). Everything inside the app uses standard surfaces. This keeps the product from looking like a template and keeps the review screens calm and legible.

## 10. Copy and voice
Plain, direct, no hype. Words: check, finding, version, rule, source, decision. Buttons start with a verb ("Save & check", "Submit for review", "Approve version 3"). Never "fail/pass" for people; use "needs changes". Sentence case. AI output is labelled "AI suggestion"; deterministic output "Rule".

## 11. Rules for feature code (enforced)
1. Colours, spacing, radii, shadows come from tokens/Tailwind theme only — **no raw hex values or arbitrary pixel values in feature code**. A script `scripts/check-tokens.mjs` fails CI if it finds hex colours outside `styles/tokens.css` and the auth glass component.
2. Reuse inventory components; no one-off buttons or cards.
3. Accessibility floor: names on all controls, focus ring, contrast ≥ 4.5:1 (UI parts ≥ 3:1), 44 px targets, keyboard operable, reduced motion honoured.
4. User text is rendered as text, never `dangerouslySetInnerHTML`.
5. Each screen PR includes screenshots at 360 px and 1280 px.
