import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  bigserial,
  uuid,
  varchar,
  uniqueIndex,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// 1. workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  confidentialTerms: text('confidential_terms')
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. users
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull().unique(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash'),
    role: text('role').notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_users_role',
      sql`${table.role} IN ('creator', 'reviewer', 'manager')`
    ),
  ]
);

// 3. guideline_sources
export const guidelineSources = pgTable(
  'guideline_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    versionLabel: text('version_label'),
    kind: text('kind').notNull(),
    bodyMarkdown: text('body_markdown'),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_guideline_sources_kind',
      sql`${table.kind} IN ('guideline', 'terminology', 'fact_sheet', 'asset_policy')`
    ),
  ]
);

// 4. rule_sets
export const ruleSets = pgTable(
  'rule_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    status: text('status').notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
  },
  (table) => [
    unique('uq_rule_sets_workspace_version').on(table.workspaceId, table.version),
    uniqueIndex('idx_rule_sets_active_workspace')
      .on(table.workspaceId)
      .where(sql`${table.status} = 'active'`),
    check(
      'chk_rule_sets_status',
      sql`${table.status} IN ('draft', 'active', 'archived')`
    ),
  ]
);

// 5. rules
export const rules = pgTable(
  'rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ruleSetId: uuid('rule_set_id')
      .notNull()
      .references(() => ruleSets.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull(),
    title: text('title').notNull(),
    definition: jsonb('definition').notNull(),
    explanation: text('explanation').notNull(),
    suggestionHint: text('suggestion_hint'),
    sourceId: uuid('source_id').references(() => guidelineSources.id),
    sourceSection: text('source_section'),
    enabled: boolean('enabled').default(true).notNull(),
  },
  (table) => [
    unique('uq_rules_rule_set_key').on(table.ruleSetId, table.key),
    check(
      'chk_rules_category',
      sql`${table.category} IN ('tone', 'terminology', 'messaging', 'claim', 'fact', 'accessibility', 'visual', 'confidentiality')`
    ),
    check(
      'chk_rules_severity',
      sql`${table.severity} IN ('blocker', 'major', 'minor', 'info')`
    ),
  ]
);

// 6. glossary_terms
export const glossaryTerms = pgTable(
  'glossary_terms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    kind: text('kind').notNull(),
    preferredAlternative: text('preferred_alternative'),
    caseSensitive: boolean('case_sensitive').default(false).notNull(),
    note: text('note'),
    sourceId: uuid('source_id').references(() => guidelineSources.id),
  },
  (table) => [
    check(
      'chk_glossary_terms_kind',
      sql`${table.kind} IN ('preferred', 'banned', 'discouraged')`
    ),
  ]
);

// 7. approved_facts
export const approvedFacts = pgTable(
  'approved_facts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    key: text('key'),
    statement: text('statement').notNull(),
    numericValues: jsonb('numeric_values'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    sourceId: uuid('source_id').references(() => guidelineSources.id),
    searchVector: text('search_vector'),
  },
  (table) => [
    unique('uq_approved_facts_workspace_key').on(table.workspaceId, table.key),
  ]
);

// 8. content_items
export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    contentType: text('content_type').notNull(),
    status: text('status').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    currentVersionId: uuid('current_version_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_content_items_content_type',
      sql`${table.contentType} IN ('blog', 'social', 'ad', 'web', 'press', 'other')`
    ),
    check(
      'chk_content_items_status',
      sql`${table.status} IN ('draft', 'checked', 'in_review', 'changes_requested', 'approved', 'rejected')`
    ),
  ]
);

// 9. content_versions (append-only)
export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    versionNo: integer('version_no').notNull(),
    textBody: text('text_body').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    sourceKind: text('source_kind').default('paste').notNull(),
    originalFilename: text('original_filename'),
    originalBytes: text('original_bytes'),
    imageAltText: text('image_alt_text'),
    changeNote: text('change_note'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uq_content_versions_item_version').on(table.contentItemId, table.versionNo),
  ]
);

// 10. review_runs (append-only)
export const reviewRuns = pgTable(
  'review_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentVersionId: uuid('content_version_id')
      .notNull()
      .references(() => contentVersions.id, { onDelete: 'cascade' }),
    ruleSetId: uuid('rule_set_id')
      .notNull()
      .references(() => ruleSets.id),
    status: text('status').notNull(),
    aiProvider: text('ai_provider'),
    aiModel: text('ai_model'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    counts: jsonb('counts').default(sql`'{}'::jsonb`).notNull(),
    errorDetail: text('error_detail'),
  },
  (table) => [
    check(
      'chk_review_runs_status',
      sql`${table.status} IN ('running', 'complete', 'rules_only_ai_failed', 'error')`
    ),
  ]
);

// 11. findings
export const findings = pgTable(
  'findings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reviewRunId: uuid('review_run_id')
      .notNull()
      .references(() => reviewRuns.id, { onDelete: 'cascade' }),
    origin: text('origin').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull(),
    ruleId: uuid('rule_id').references(() => rules.id),
    factId: uuid('fact_id').references(() => approvedFacts.id),
    spanStart: integer('span_start').notNull(),
    spanEnd: integer('span_end').notNull(),
    quote: text('quote').notNull(),
    explanation: text('explanation').notNull(),
    suggestion: text('suggestion'),
    confidence: numeric('confidence', { precision: 3, scale: 2 })
      .default('1.00')
      .notNull(),
    status: text('status').default('open').notNull(),
  },
  (table) => [
    check(
      'chk_findings_origin',
      sql`${table.origin} IN ('rule', 'ai')`
    ),
    check(
      'chk_findings_category',
      sql`${table.category} IN ('tone', 'terminology', 'messaging', 'claim', 'fact', 'accessibility', 'visual', 'confidentiality')`
    ),
    check(
      'chk_findings_severity',
      sql`${table.severity} IN ('blocker', 'major', 'minor', 'info')`
    ),
    check(
      'chk_findings_status',
      sql`${table.status} IN ('open', 'fixed', 'dismissed', 'overridden')`
    ),
    // Grounding Check enforced in schema
    check(
      'chk_findings_grounding',
      sql`${table.ruleId} IS NOT NULL OR ${table.factId} IS NOT NULL`
    ),
  ]
);

// 12. finding_decisions (append-only)
export const findingDecisions = pgTable(
  'finding_decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    findingId: uuid('finding_id')
      .notNull()
      .references(() => findings.id, { onDelete: 'cascade' }),
    decidedBy: uuid('decided_by')
      .notNull()
      .references(() => users.id),
    decision: text('decision').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_finding_decisions_decision',
      sql`${table.decision} IN ('fixed', 'dismissed', 'overridden', 'reopened')`
    ),
  ]
);

// 13. comments
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentItemId: uuid('content_item_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  contentVersionId: uuid('content_version_id').references(() => contentVersions.id),
  findingId: uuid('finding_id').references(() => findings.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 14. approvals (append-only)
export const approvals = pgTable(
  'approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contentVersionId: uuid('content_version_id')
      .notNull()
      .references(() => contentVersions.id, { onDelete: 'cascade' }),
    reviewRunId: uuid('review_run_id')
      .notNull()
      .references(() => reviewRuns.id),
    decision: text('decision').notNull(),
    decidedBy: uuid('decided_by')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    contentHash: varchar('content_hash', { length: 64 }),
    ruleSetId: uuid('rule_set_id').references(() => ruleSets.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'chk_approvals_decision',
      sql`${table.decision} IN ('approved', 'changes_requested', 'rejected')`
    ),
  ]
);

// 15. audit_log (append-only)
export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  contentHash: varchar('content_hash', { length: 64 }),
  ruleSetId: uuid('rule_set_id').references(() => ruleSets.id),
  detail: jsonb('detail').default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  prevHash: varchar('prev_hash', { length: 64 }),
  rowHash: varchar('row_hash', { length: 64 }),
});

// 16. ai_calls
export const aiCalls = pgTable('ai_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewRunId: uuid('review_run_id')
    .notNull()
    .references(() => reviewRuns.id, { onDelete: 'cascade' }),
  provider: text('provider'),
  model: text('model'),
  inputSha256: varchar('input_sha256', { length: 64 }),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  latencyMs: integer('latency_ms'),
  status: text('status'),
  rawOutput: text('raw_output'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  guidelineSources: many(guidelineSources),
  ruleSets: many(ruleSets),
  glossaryTerms: many(glossaryTerms),
  approvedFacts: many(approvedFacts),
  contentItems: many(contentItems),
  auditLogs: many(auditLog),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [users.workspaceId],
    references: [workspaces.id],
  }),
  contentItems: many(contentItems),
  findingDecisions: many(findingDecisions),
  approvals: many(approvals),
}));

export const contentItemsRelations = relations(contentItems, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [contentItems.workspaceId],
    references: [workspaces.id],
  }),
  owner: one(users, {
    fields: [contentItems.ownerId],
    references: [users.id],
  }),
  versions: many(contentVersions),
  comments: many(comments),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one, many }) => ({
  contentItem: one(contentItems, {
    fields: [contentVersions.contentItemId],
    references: [contentItems.id],
  }),
  reviewRuns: many(reviewRuns),
  approvals: many(approvals),
}));

export const reviewRunsRelations = relations(reviewRuns, ({ one, many }) => ({
  contentVersion: one(contentVersions, {
    fields: [reviewRuns.contentVersionId],
    references: [contentVersions.id],
  }),
  ruleSet: one(ruleSets, {
    fields: [reviewRuns.ruleSetId],
    references: [ruleSets.id],
  }),
  findings: many(findings),
  aiCalls: many(aiCalls),
}));

export const findingsRelations = relations(findings, ({ one, many }) => ({
  reviewRun: one(reviewRuns, {
    fields: [findings.reviewRunId],
    references: [reviewRuns.id],
  }),
  rule: one(rules, {
    fields: [findings.ruleId],
    references: [rules.id],
  }),
  fact: one(approvedFacts, {
    fields: [findings.factId],
    references: [approvedFacts.id],
  }),
  decisions: many(findingDecisions),
}));

