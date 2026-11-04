# Design System Specification — Inkloom Guardian

## 1. Color Palette & Contrast Tokens
| Token Name | Hex Value | Background / Pair | Contrast Ratio | Usage |
|---|---|---|---|---|
| `--color-ink` | `#111827` | `#F9FAFB` | 15.6:1 (AAA) | Primary headings & high-emphasis body text |
| `--color-secondary` | `#4B5563` | `#FFFFFF` | 7.1:1 (AAA) | Subtext, secondary labels, metadata |
| `--color-border` | `#E5E7EB` | `#FFFFFF` | 1.2:1 (Structural) | Card borders, table dividers, tab outlines |
| `--color-page` | `#F9FAFB` | N/A | Background | Application viewport canvas |
| `--color-card` | `#FFFFFF` | `#F9FAFB` | Contrast surface | Surface cards, modals, popovers |
| `--color-brand` | `#4F46E5` | `#FFFFFF` | 5.8:1 (AA) | Primary buttons, active tabs, focus ring |
| `--color-brand-hover`| `#4338CA` | `#FFFFFF` | 7.3:1 (AAA) | Primary button hover & active states |
| `--color-blocker` | `#B91C1C` | `#FEE2E2` | 5.5:1 (AA) | ⛔ Blocker findings, critical badges |
| `--color-major` | `#B45309` | `#FEF3C7` | 4.8:1 (AA) | ▲ Major findings, warning banners |
| `--color-minor` | `#1D4ED8` | `#DBEAFE` | 5.3:1 (AA) | ● Minor findings, informational tips |
| `--color-info` | `#374151` | `#F3F4F6` | 8.2:1 (AAA) | ℹ Info findings, neutral metadata pills |
| `--color-ok` | `#047857` | `#D1FAE5` | 4.9:1 (AA) | Resolved items, approved status pills |

## 2. Typography & Scale
- **UI Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace Stack**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
- **Scale**:
  - `text-xs`: 12px (0.75rem), line-height: 1.4 — Badges, metadata, timestamps
  - `text-sm`: 14px (0.875rem), line-height: 1.45 — Form inputs, table cells, secondary copy
  - `text-base`: 16px (1.0rem), line-height: 1.5 — Default body copy, guideline text
  - `text-lg`: 18px (1.125rem), line-height: 1.4 — Subsection titles, card headers
  - `text-xl`: 20px (1.25rem), line-height: 1.35 — Screen section headers
  - `text-2xl`: 24px (1.5rem), line-height: 1.25 — Page titles, dashboard headline
  - `text-3xl`: 30px (1.875rem), line-height: 1.2 — Marketing hero headline

## 3. Spacing Grid & Border Radii
- **Grid Unit**: 4px base (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`)
- **Radii**:
  - Card & Container Radius: `8px`
  - Form Control & Button Radius: `6px`
  - Status & Severity Pill Radius: `9999px` (Full rounded)

## 4. Button & Interactive Element Styles
- **Primary Button**: Background `--color-brand` (`#4F46E5`), text `#FFFFFF`, font-weight 600, padding `8px 16px`, shadow `0 1px 2px rgba(0,0,0,0.05)`. Hover: `#4338CA`.
- **Secondary / Outline Button**: Border `1px solid --color-border` (`#E5E7EB`), text `--color-ink` (`#111827`), background `#FFFFFF`. Hover: background `#F3F4F6`.
- **Destructive Button**: Background `--color-blocker` (`#B91C1C`), text `#FFFFFF`. Hover: `#991B1B`.
- **Disabled State**: Opacity `0.5`, cursor `not-allowed`, title tooltip explaining exact blocking reason.
- **Focus Rings**: Universal `outline: 2px solid #4F46E5; outline-offset: 2px;` for WCAG 2.1 AA focus indication.

## 5. Severity Representations (Non-Color Relying)
- **⛔ Blocker**: Icon `⛔`, prefix `Blocker`, solid bottom border `2.5px solid #B91C1C` on text highlights, `#FEE2E2` background tint.
- **▲ Major**: Icon `▲`, prefix `Major`, dashed bottom border `2px dashed #B45309` on text highlights, `#FEF3C7` background tint.
- **● Minor**: Icon `●`, prefix `Minor`, dotted bottom border `2px dotted #1D4ED8` on text highlights, `#DBEAFE` background tint.
- **ℹ Info**: Icon `ℹ`, prefix `Info`, solid subtle border `1px solid #9CA3AF`, `#F3F4F6` background tint.

## 6. Layout & Responsiveness
- **Desktop (>= 1024px)**: Top bar with demo switcher + Left navigation sidebar (240px) + Main content canvas (max-width 1200px). Review workspace renders side-by-side: 60% Content pane with interactive highlights, 40% Findings list with instant filtering.
- **Mobile (< 1024px, down to 360px)**: Top bar with collapsible hamburger navigation menu. Review workspace stacks vertically into a mobile tab bar: `[Content View]` / `[Findings (N)]` allowing swift single-thumb toggling.

## 7. Interaction & Motion Rules
- **Reduced Motion**: Under `@media (prefers-reduced-motion: reduce)`, transitions and animated loaders are suppressed to 0s duration.
- **Loading State**: Step-by-step progress indicator ("Step 1/3: Reading content... Step 2/3: Applying deterministic rule engine... Step 3/3: Verifying claim offsets and facts...").
- **Empty States**: Clear graphic icon, explanatory copy, and explicit single primary call to action (e.g. "No content in review — Create new content").
