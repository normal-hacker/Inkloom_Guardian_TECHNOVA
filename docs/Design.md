# Design — UI Rulebook

Goal: a reviewer understands **what is wrong, why, and what to do** in seconds, and a judge can follow the whole workflow without instructions. Usability is 10 points; first impressions also colour the 30-point workflow score.

## 1. Principles
1. **Explain before alarm.** Every flag carries its reason and source; never a bare red mark.
2. **One primary action per screen.** Check → Submit for review → Approve. The next step is always visible.
3. **Human in control.** Buttons say what a person decides ("Approve version 3"), AI output is labelled as a suggestion.
4. **Calm density.** Information-rich but quiet; reserve strong colour for severity.
5. **Accessible by default.** We build an accessibility checker; our own UI must pass its own standard.

## 2. Visual tokens
| Token | Value | Use |
|---|---|---|
| Font | Inter (UI), JetBrains Mono (rule IDs, quotes) | |
| Base size | 16 px, line-height 1.5 | Body |
| Scale | 12 / 14 / 16 / 20 / 24 / 32 | |
| Spacing | 4-px grid (4, 8, 12, 16, 24, 32, 48) | |
| Radius | 8 px cards, 6 px inputs, 999 px pills | |
| Ink | `#111827` text · `#4B5563` secondary · `#E5E7EB` borders · `#F9FAFB` page | |
| Brand | `#4F46E5` (indigo-600) primary, hover `#4338CA` | |
| Blocker | `#B91C1C` on `#FEE2E2` | Must fix |
| Major | `#B45309` on `#FEF3C7` | Should fix |
| Minor | `#1D4ED8` on `#DBEAFE` | Consider |
| Info | `#374151` on `#F3F4F6` | FYI |
| OK | `#047857` on `#D1FAE5` | Resolved / approved |

All text/background pairs ≥ 4.5:1 (verify with a contrast tool before shipping). **Never rely on colour alone**: severity always has an icon + text label (e.g. ⛔ Blocker, ▲ Major, ● Minor, ℹ Info).

## 3. Layout
- Top bar: logo, role badge, user menu, **"AI disclosure"** link.
- Left nav (collapses < 1024 px): Dashboard · New content · Guidelines · Insights · Audit.
- Content max-width 1200 px; review workspace uses two panes.

## 4. Key screens
### 4.1 Landing (public)
Headline "Check before you publish." Three-step explainer, **Try the demo** (role picker: Creator / Reviewer / Manager), link to sample report, link to GitHub, link to AI disclosure. No sign-in needed for any of these.

### 4.2 Dashboard
Cards: items awaiting my action, recent checks, open blockers. Table of content items with status pill, version, owner, last check, open findings count.

### 4.3 New content
Tabs: **Paste text** · **Upload file** (.txt .md .docx .pdf, images). Fields: title, content type (blog, social, ad, web page, press release), channel. Primary button **Save & check**. Show file limits (10 MB) and a one-line privacy note.

### 4.4 Review workspace (`/content/[id]`) — the most important screen
```
┌ Header: title · v3 · status pill · [Check again] [Submit for review] ───────────┐
├──────────────────────────────────────┬───────────────────────────────────────────┤
│ Content pane (left, ~60%)            │ Findings pane (right, ~40%)               │
│  text with highlighted spans         │  filters: severity ▾ category ▾ status ▾  │
│  hover/click highlight ↔ card        │  ┌ Finding card ───────────────────────┐ │
│  version selector + diff toggle      │  │ ⛔ Blocker · Claim · Rule CLAIM-001  │ │
│                                      │  │ "the best solar panels"              │ │
│                                      │  │ Why: superlatives need evidence…     │ │
│                                      │  │ Source: Brand Voice Guide §5.2 [open]│ │
│                                      │  │ Suggest: "high-efficiency panels"    │ │
│                                      │  │ [Apply] [Dispute] [Dismiss…]         │ │
│                                      │  └──────────────────────────────────────┘ │
├──────────────────────────────────────┴───────────────────────────────────────────┤
│ Tabs: Comments · History · Audit                                                  │
│ Reviewer bar (reviewers only): [Request changes] [Reject] [Approve v3]            │
└───────────────────────────────────────────────────────────────────────────────────┘
```
Rules:
- Highlight colour follows severity but also uses underline style (solid = blocker, dashed = major, dotted = minor) for colour-blind users.
- Finding card order: severity, then position in text.
- **Approve** is disabled with an inline reason ("2 blockers open") — never silently hidden.
- AI-origin findings show an "AI" chip and confidence; rule-origin show "Rule".
- Status banner when AI failed: "AI check unavailable. Rule checks ran; this content is **not cleared**."

### 4.5 Guidelines (manager)
Tabs: Sources · Rules · Glossary · Facts. Rules table with category, severity, version, source. YAML editor with validation errors inline. **Publish rule set vN** creates a new active version (confirmation dialog states the effect).

### 4.6 Insights
Four tiles: top violated rules, findings by category over time, most overridden/dismissed rules (possible unclear guideline), median time to approval. Every chart has a data table toggle and text summary.

### 4.7 Audit
Filterable table: time, actor, action, content, version hash (short), rule-set version. Row expands to full detail. Export CSV.

### 4.8 AI disclosure (public)
Plain-language list: what AI does in the product, what data leaves the system (redacted text only), which providers, what is stored, limitations, and tools used to build the project.

## 5. Components (shadcn/ui based)
`Button, Badge/Pill, Card, Tabs, Dialog, Sheet, Select, Textarea, Toast, Table, Tooltip, Skeleton` plus custom: `FindingCard`, `HighlightedText`, `SeverityBadge`, `StatusPill`, `VersionDiff`, `DecisionBar`, `SourcePopover`.

## 6. Interaction rules
- Destructive/decisive actions use a dialog: Approve, Reject, Override (requires reason ≥ 10 chars).
- Loading: skeletons, and the check shows steps ("Rules ✓ · AI … · Validating").
- Errors: say what happened and what to do; never raw stack traces.
- Empty states always include the next action ("No content yet — Create your first check").
- Optimistic UI only for comments; never for decisions.

## 7. Content and tone for UI copy
Plain, direct, no hype. Use "check", "finding", "version", "decision". Avoid "fail/pass" for people; use "needs changes". Labels sentence case.

## 8. Accessibility checklist (must pass before Round 2 submit)
- [ ] Full keyboard operation incl. highlighted spans (focusable, `aria-describedby` to card)
- [ ] Visible focus ring (2 px indigo, offset 2)
- [ ] Form controls have labels; errors announced (`aria-live="polite"`)
- [ ] Contrast ≥ 4.5:1 text, ≥ 3:1 UI components
- [ ] Severity never colour-only
- [ ] Respects `prefers-reduced-motion`
- [ ] Page titles and landmarks; headings in order
- [ ] Run axe/Lighthouse; record scores in `Testing.md`

## 9. Responsive
Desktop-first (review work is desktop work). Below 1024 px panes stack with a sticky "Findings (n)" toggle. Minimum supported width 360 px for dashboard and the public report.
