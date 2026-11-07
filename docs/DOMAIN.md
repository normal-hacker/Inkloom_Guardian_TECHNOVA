# DOMAIN — one shape for every thing in the product

> Framework step 4: decide the data shape before screens connect. Screens do not invent their own versions of a finding or a content item.
> Precedence: `Database.md` is the storage truth; `API.md` is the wire truth. This file is their TypeScript mirror and the **only** place UI code imports types from (`lib/domain/types.ts`, generated from this file). If this file disagrees with `Database.md` or `API.md`, stop and report it — do not silently pick one.
> **Wire format = snake_case JSON, and the UI uses exactly the same field names.** No renaming layer, no camelCase twins.

## 1. Enums (single definition; DB CHECKs and UI use the same strings)
```ts
export type Role = "creator" | "reviewer" | "manager";
export type Severity = "blocker" | "major" | "minor" | "info";
export type Category = "tone" | "terminology" | "messaging" | "claim" | "fact" | "accessibility" | "visual" | "confidentiality";
export type ContentType = "blog" | "social" | "ad" | "web" | "press" | "other";
export type ContentStatus = "draft" | "checked" | "in_review" | "changes_requested" | "approved" | "rejected";
export type RunStatus = "running" | "complete" | "rules_only_ai_failed" | "error";
export type FindingOrigin = "rule" | "ai";
export type FindingStatus = "open" | "fixed" | "dismissed" | "overridden";
export type FindingDecisionType = "fixed" | "dismissed" | "overridden" | "reopened";
export type ApprovalDecision = "approved" | "changes_requested" | "rejected";
export type RuleSetStatus = "draft" | "active" | "archived";
export type SourceKind = "guideline" | "terminology" | "fact_sheet" | "asset_policy";
export type VersionSourceKind = "paste" | "txt" | "md" | "docx" | "pdf" | "image";
```

## 2. Core entities (field names = column names in Database.md)
```ts
type UUID = string; type ISODate = string;

export interface User { id: UUID; workspace_id: UUID; email: string; display_name: string; role: Role; is_demo: boolean }
export interface GuidelineSource { id: UUID; title: string; version_label: string | null; kind: SourceKind; body_markdown: string }
export interface RuleSet { id: UUID; version: number; status: RuleSetStatus; notes: string | null; created_by: UUID; created_at: ISODate; activated_at: ISODate | null }

export type RuleDefinition =
  | { type: "term"; terms: string[]; case_sensitive?: boolean }
  | { type: "regex"; pattern: string; flags?: string }
  | { type: "number_claim"; units: string[]; fact_tags?: string[] }
  | { type: "accessibility"; check: "image_alt_present" | "all_caps_run" | "link_text"; max_words?: number }
  | { type: "llm"; prompt_hint: string; examples_ok?: string[]; examples_bad?: string[] };

export interface Rule { id: UUID; rule_set_id: UUID; key: string /* e.g. CLAIM-001 */; category: Category; severity: Severity; title: string; definition: RuleDefinition; explanation: string; suggestion_hint: string | null; source_id: UUID; source_section: string | null; enabled: boolean }
export interface GlossaryTerm { id: UUID; term: string; kind: "preferred" | "banned" | "discouraged"; preferred_alternative: string | null; case_sensitive: boolean; note: string | null; source_id: UUID | null }
export interface ApprovedFact { id: UUID; key: string /* F-001 */; statement: string; numeric_values: { value: number; unit: string; min?: number; max?: number }[]; valid_from: string | null; valid_until: string | null; source_id: UUID; context_keywords: string[] }

export interface ContentItem { id: UUID; title: string; content_type: ContentType; status: ContentStatus; owner_id: UUID; current_version_id: UUID; created_at: ISODate; updated_at: ISODate }
export interface ContentVersion { id: UUID; content_item_id: UUID; version_no: number; text_body: string; content_hash: string /* sha-256 hex, 64 chars */; source_kind: VersionSourceKind; original_filename: string | null; image_alt_text: string | null; change_note: string | null; created_by: UUID; created_at: ISODate }

export interface ReviewRun { id: UUID; content_version_id: UUID; rule_set_id: UUID; rule_set_version: number; status: RunStatus; ai: { used: boolean; provider: string | null; model: string | null }; counts: Record<Severity, number>; started_at: ISODate; finished_at: ISODate | null; error_detail: string | null }
export interface Approval { id: UUID; content_version_id: UUID; review_run_id: UUID; decision: ApprovalDecision; decided_by: UUID; note: string | null; content_hash: string; rule_set_id: UUID; created_at: ISODate }
export interface Comment { id: UUID; content_item_id: UUID; content_version_id: UUID | null; finding_id: UUID | null; author_id: UUID; author_name: string; author_role: Role; body: string; created_at: ISODate }
export interface AuditEntry { id: number; actor_id: UUID | null; actor_name: string | null; action: string; entity_type: string; entity_id: UUID; content_hash: string | null; rule_set_id: UUID | null; rule_set_version: number | null; detail: Record<string, unknown>; created_at: ISODate }
```

## 3. The Finding — the most-shared shape (what every screen receives)
```ts
export interface FindingView {
  id: UUID;
  review_run_id: UUID;
  origin: FindingOrigin;
  category: Category;
  severity: Severity;
  span: { start: number; end: number };       // UTF-16 code-unit offsets into ContentVersion.text_body
  quote: string;                               // invariant: text_body.slice(start, end) === quote
  explanation: string;
  suggestion: string | null;                   // replaces ONLY the quote
  confidence: number;                          // 1.0 for origin "rule"
  status: FindingStatus;
  rule: { key: string; title: string; rule_set_version: number } | null;
  fact: { key: string; statement: string } | null;
  source: { id: UUID; title: string; version_label: string | null; section: string | null };
  decisions: { decision: FindingDecisionType; reason: string | null; decided_by_name: string; created_at: ISODate }[];
}
```
Invariants (tests exist for each): `rule !== null || fact !== null`; quote equals the slice; offsets are UTF-16 (the same unit JavaScript uses for highlighting); suggestions never contain a banned term.

## 4. Derived values (computed in one place: `lib/domain/derive.ts`, never re-implemented in screens)
- `isCleared(run)` → **always false** when `run.status !== "complete"`; even when complete it means only "checks found nothing", never "approved". UI wording: "No issues found by the checks that ran. A human reviewer still decides."
- `openBlockers(findings)` → findings with `severity === "blocker" && status === "open"`.
- `canApprove({ user, item, version, run, findings })` → `{ allowed: boolean; reason?: string }`: role is reviewer/manager; user ≠ item owner; `run.content_version_id === item.current_version_id` and `run.status` is complete or rules_only_ai_failed-with-note; no open blockers. The server re-checks; the UI uses this only to show a disabled reason.
- `needsRecheck(item, version, run)` → true if the current version has no run.
- Status transitions allowed: `draft→checked→in_review→(approved|changes_requested|rejected)`; `changes_requested|rejected → (new version) → draft`.

## 5. Request/response shapes used by multiple screens
```ts
export interface Paginated<T> { items: T[]; total: number }
export interface ApiError { error: { code: string; message: string; details?: unknown; request_id: string } }
export interface Providers { demo: boolean; password: boolean; google: boolean; demo_users?: { id: UUID; name: string; role: Role; blurb: string }[] }
export interface DashboardRow { id: UUID; title: string; status: ContentStatus; version_no: number; owner_name: string; open_findings: number; open_blockers: number; last_checked_at: ISODate | null }
```
(`Providers.demo_users` is snake_case on the wire; if the login prompt used `demoUsers`, change it to this form and update the tests.)

## 6. Seed identifiers (stable so tests and screenshots are repeatable)
Workspace "Brightway Solar (demo)"; users: Asha (creator), Ben (creator), Priya (reviewer), Marcus (manager); rule set v3 active; rule keys `TONE-001…`, `CLAIM-001/002`, `NUM-001`, etc.; fact keys `F-001…F-006`; five content items with fixed titles per `ANTIGRAVITY_PROMPT.md`.

## 7. How this file is used
`lib/domain/types.ts` is generated by copying §1–§5 verbatim; Zod (or equivalent) schemas for API responses are derived from the same types; API contract tests assert real responses match these schemas. A screen that needs a field not listed here must first add it here (and to Database.md/API.md), then build the screen.
