// DOMAIN — single source of truth for TypeScript types across Inkloom Guardian
// Copied verbatim from docs/DOMAIN.md §1–§5

// 1. Enums
export type Role = 'creator' | 'reviewer' | 'manager';
export type Severity = 'blocker' | 'major' | 'minor' | 'info';
export type Category =
  | 'tone'
  | 'terminology'
  | 'messaging'
  | 'claim'
  | 'fact'
  | 'accessibility'
  | 'visual'
  | 'confidentiality';
export type ContentType = 'blog' | 'social' | 'ad' | 'web' | 'press' | 'other';
export type ContentStatus =
  | 'draft'
  | 'checked'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'needs_review';
export type RunStatus = 'running' | 'complete' | 'rules_only_ai_failed' | 'error';
export type FindingOrigin = 'rule' | 'ai';
export type FindingStatus = 'open' | 'fixed' | 'dismissed' | 'overridden';
export type FindingDecisionType = 'fixed' | 'dismissed' | 'overridden' | 'reopened';
export type ApprovalDecision = 'approved' | 'changes_requested' | 'rejected';
export type RuleSetStatus = 'draft' | 'active' | 'archived';
export type SourceKind = 'guideline' | 'terminology' | 'fact_sheet' | 'asset_policy';
export type VersionSourceKind = 'paste' | 'txt' | 'md' | 'docx' | 'pdf' | 'image';

// 2. Core entities
export type UUID = string;
export type ISODate = string;

export interface User {
  id: UUID;
  workspace_id: UUID;
  email: string;
  display_name: string;
  role: Role;
  is_demo: boolean;
}

export interface GuidelineSource {
  id: UUID;
  title: string;
  version_label: string | null;
  kind: SourceKind;
  body_markdown: string;
}

export interface RuleSet {
  id: UUID;
  version: number;
  status: RuleSetStatus;
  notes: string | null;
  created_by: UUID;
  created_at: ISODate;
  activated_at: ISODate | null;
}

export type RuleDefinition =
  | { type: 'term'; terms: string[]; case_sensitive?: boolean }
  | { type: 'regex'; pattern: string; flags?: string }
  | { type: 'number_claim'; units: string[]; fact_tags?: string[] }
  | { type: 'accessibility'; check: 'image_alt_present' | 'all_caps_run' | 'link_text'; max_words?: number }
  | { type: 'llm'; prompt_hint: string; examples_ok?: string[]; examples_bad?: string[] };

export interface Rule {
  id: UUID;
  rule_set_id: UUID;
  key: string; // e.g. CLAIM-001
  category: Category;
  severity: Severity;
  title: string;
  definition: RuleDefinition;
  explanation: string;
  suggestion_hint: string | null;
  source_id: UUID;
  source_section: string | null;
  enabled: boolean;
}

export interface GlossaryTerm {
  id: UUID;
  term: string;
  kind: 'preferred' | 'banned' | 'discouraged';
  preferred_alternative: string | null;
  case_sensitive: boolean;
  note: string | null;
  source_id: UUID | null;
}

export interface ApprovedFact {
  id: UUID;
  key: string; // F-001
  statement: string;
  numeric_values: { value: number; unit: string; min?: number; max?: number }[];
  valid_from: string | null;
  valid_until: string | null;
  source_id: UUID;
  context_keywords: string[];
}

export interface ContentItem {
  id: UUID;
  title: string;
  content_type?: ContentType;
  contentType?: string;
  status: ContentStatus;
  owner_id?: UUID;
  ownerId?: string;
  owner_name?: string;
  ownerName?: string;
  ownerRole?: string;
  current_version_id?: UUID;
  currentVersionNo?: number;
  blockersCount?: number;
  created_at?: ISODate;
  updated_at?: ISODate;
  updatedAt?: string;
}

export interface ContentVersion {
  id: UUID;
  content_item_id?: UUID;
  version_no?: number;
  versionNo?: number;
  text_body?: string;
  textBody?: string;
  content_hash?: string; // sha-256 hex, 64 chars
  contentHash?: string;
  source_kind?: VersionSourceKind;
  original_filename?: string | null;
  image_alt_text?: string | null;
  change_note?: string | null;
  changeNote?: string;
  created_by?: UUID;
  created_at?: ISODate;
  createdAt?: string;
}

export interface Finding {
  id: string;
  review_run_id?: string;
  rule_id?: string;
  ruleId?: string;
  rule_key?: string;
  ruleKey: string;
  rule_title?: string;
  ruleTitle?: string;
  rule_set_version?: number;
  ruleSetVersion?: number;
  source_doc?: string;
  sourceDoc?: string;
  source_section?: string;
  sourceSection?: string;
  fact_id?: string;
  factKey?: string;
  origin: FindingOrigin;
  category: Category;
  severity: Severity;
  span_start?: number;
  span_end?: number;
  spanStart: number;
  spanEnd: number;
  quote: string;
  explanation: string;
  suggestion?: string | null;
  confidence: number | string;
  status: FindingStatus;
  rule?: { key: string; title: string; rule_set_version?: number } | null;
  fact?: { key: string; statement: string } | null;
  source?: { id?: string; title: string; version_label?: string | null; section?: string | null };
  decisions?: Array<{
    decision: FindingDecisionType;
    reason: string | null;
    decided_by_name: string;
    created_at: ISODate;
  }>;
}

export interface ReviewRun {
  id: UUID;
  content_version_id: UUID;
  rule_set_id: UUID;
  rule_set_version: number;
  status: RunStatus;
  ai: { used: boolean; provider: string | null; model: string | null };
  counts: Record<Severity, number>;
  started_at: ISODate;
  finished_at: ISODate | null;
  error_detail: string | null;
}

export interface Approval {
  id: UUID;
  content_version_id: UUID;
  review_run_id: UUID;
  decision: ApprovalDecision;
  decided_by: UUID;
  note: string | null;
  content_hash: string;
  rule_set_id: UUID;
  created_at: ISODate;
}

export interface Comment {
  id: UUID;
  content_item_id: UUID;
  content_version_id: UUID | null;
  finding_id: UUID | null;
  author_id: UUID;
  author_name: string;
  author_role: Role;
  body: string;
  created_at: ISODate;
}

export interface AuditEntry {
  id: number;
  actor_id: UUID | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: UUID;
  content_hash: string | null;
  rule_set_id: UUID | null;
  rule_set_version: number | null;
  detail: Record<string, unknown>;
  created_at: ISODate;
}

// 3. The Finding
export interface FindingView {
  id: UUID;
  review_run_id: UUID;
  origin: FindingOrigin;
  category: Category;
  severity: Severity;
  span: { start: number; end: number }; // UTF-16 code-unit offsets into ContentVersion.text_body
  quote: string; // invariant: text_body.slice(start, end) === quote
  explanation: string;
  suggestion: string | null; // replaces ONLY the quote
  confidence: number; // 1.0 for origin "rule"
  status: FindingStatus;
  rule: { key: string; title: string; rule_set_version: number } | null;
  fact: { key: string; statement: string } | null;
  source: { id: UUID; title: string; version_label: string | null; section: string | null };
  decisions: {
    decision: FindingDecisionType;
    reason: string | null;
    decided_by_name: string;
    created_at: ISODate;
  }[];
}

// 5. Request/response shapes used by multiple screens
export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    request_id: string;
  };
}

export interface Providers {
  demo: boolean;
  password: boolean;
  google: boolean;
  demo_users?: {
    id: UUID;
    name: string;
    role: Role;
    blurb: string;
  }[];
}

export interface DashboardRow {
  id: UUID;
  title: string;
  status: ContentStatus;
  version_no: number;
  owner_name: string;
  open_findings: number;
  open_blockers: number;
  last_checked_at: ISODate | null;
}
