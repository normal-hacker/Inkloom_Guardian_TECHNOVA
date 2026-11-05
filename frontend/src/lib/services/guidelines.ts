import crypto from 'node:crypto';
import { eq, and, desc } from 'drizzle-orm';
import { parseDocument } from 'yaml';
import { db } from '../db/client';
import * as schema from '../db/schema';

export class GuidelinesError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'GuidelinesError';
  }
}

/**
 * Get current active rule set, its rules, glossary terms, and facts
 */
export async function getActiveGuidelines(workspaceId: string) {
  const activeSets = await db
    .select()
    .from(schema.ruleSets)
    .where(and(eq(schema.ruleSets.workspaceId, workspaceId), eq(schema.ruleSets.status, 'active')))
    .orderBy(desc(schema.ruleSets.version))
    .limit(1);

  if (!activeSets.length) {
    return null;
  }

  const activeSet = activeSets[0];

  const ruleList = await db
    .select()
    .from(schema.rules)
    .where(eq(schema.rules.ruleSetId, activeSet.id));

  const glossary = await db
    .select()
    .from(schema.glossaryTerms)
    .where(eq(schema.glossaryTerms.workspaceId, workspaceId));

  const facts = await db
    .select()
    .from(schema.approvedFacts)
    .where(eq(schema.approvedFacts.workspaceId, workspaceId));

  return {
    ruleSet: activeSet,
    rules: ruleList,
    glossary,
    facts,
  };
}

/**
 * Get existing draft rule set if any
 */
export async function getDraftGuidelines(workspaceId: string) {
  const draftSets = await db
    .select()
    .from(schema.ruleSets)
    .where(eq(schema.ruleSets.status, 'draft'))
    .orderBy(desc(schema.ruleSets.version));

  const workspaceDrafts = draftSets.filter((s) => s.workspaceId === workspaceId);

  if (!workspaceDrafts.length) {
    return null;
  }

  const draftSet = workspaceDrafts[0];

  const ruleList = await db
    .select()
    .from(schema.rules)
    .where(eq(schema.rules.ruleSetId, draftSet.id));

  return {
    ruleSet: draftSet,
    rules: ruleList,
  };
}

/**
 * Create a new draft rule set by copying current active rules
 */
export async function createDraftRuleSet(workspaceId: string, userId: string) {
  // Check if draft already exists
  const existingDraft = await getDraftGuidelines(workspaceId);
  if (existingDraft) {
    return existingDraft;
  }

  // Get active rule set
  const active = await getActiveGuidelines(workspaceId);
  if (!active) {
    throw new GuidelinesError(404, 'not_found', 'No active rule set found to branch from.');
  }

  const nextVersion = active.ruleSet.version + 1;
  const draftId = crypto.randomUUID();

  // Insert draft rule set
  await db.insert(schema.ruleSets).values({
    id: draftId,
    workspaceId,
    version: nextVersion,
    status: 'draft',
    notes: `Brightway Brand Guidelines v${nextVersion} (Draft)`,
    createdBy: userId,
  });

  // Copy all rules from active
  for (const r of active.rules) {
    await db.insert(schema.rules).values({
      id: crypto.randomUUID(),
      ruleSetId: draftId,
      key: r.key,
      category: r.category,
      severity: r.severity,
      title: r.title,
      definition: r.definition,
      explanation: r.explanation,
      suggestionHint: r.suggestionHint,
      sourceId: r.sourceId,
      sourceSection: r.sourceSection,
      enabled: r.enabled,
    });
  }

  // Log audit
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action: 'rule_set.create_draft',
    entityType: 'rule_set',
    entityId: draftId,
    detail: { version: nextVersion, branchedFrom: active.ruleSet.id },
  });

  return getDraftGuidelines(workspaceId);
}

/**
 * Update a specific rule in the draft rule set
 */
export async function updateDraftRule(params: {
  draftRuleSetId: string;
  ruleKey: string;
  updates: {
    enabled?: boolean;
    severity?: string;
    explanation?: string;
    suggestionHint?: string;
    title?: string;
  };
}) {
  const { draftRuleSetId, ruleKey, updates } = params;

  if (
    updates.severity &&
    !['blocker', 'major', 'minor', 'info'].includes(updates.severity)
  ) {
    throw new GuidelinesError(400, 'invalid_severity', 'Invalid severity level.');
  }

  const existing = await db
    .select()
    .from(schema.rules)
    .where(and(eq(schema.rules.ruleSetId, draftRuleSetId), eq(schema.rules.key, ruleKey)))
    .limit(1);

  if (!existing.length) {
    throw new GuidelinesError(404, 'not_found', `Rule ${ruleKey} not found in draft.`);
  }

  await db
    .update(schema.rules)
    .set({
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.severity && { severity: updates.severity }),
      ...(updates.explanation && { explanation: updates.explanation }),
      ...(updates.suggestionHint && { suggestionHint: updates.suggestionHint }),
      ...(updates.title && { title: updates.title }),
    })
    .where(and(eq(schema.rules.ruleSetId, draftRuleSetId), eq(schema.rules.key, ruleKey)));

  return { success: true, ruleKey, updates };
}

/**
 * Activate draft rule set: archives current active, activates draft
 */
export async function activateDraftRuleSet(
  draftRuleSetId: string,
  workspaceId: string,
  userId: string
) {
  // Verify draft rule set by primary key
  const drafts = await db
    .select()
    .from(schema.ruleSets)
    .where(eq(schema.ruleSets.id, draftRuleSetId))
    .limit(1);

  if (!drafts.length || drafts[0].workspaceId !== workspaceId || drafts[0].status !== 'draft') {
    throw new GuidelinesError(400, 'invalid_state', 'Specified rule set is not in draft status.');
  }

  const draft = drafts[0];

  // 1. Archive current active rule set(s) for this workspace
  const activeSets = await db
    .select()
    .from(schema.ruleSets)
    .where(eq(schema.ruleSets.status, 'active'));

  for (const a of activeSets) {
    if (a.workspaceId === workspaceId) {
      await db
        .update(schema.ruleSets)
        .set({ status: 'archived' })
        .where(eq(schema.ruleSets.id, a.id));
    }
  }

  // 2. Activate draft rule set
  await db
    .update(schema.ruleSets)
    .set({
      status: 'active',
      notes: `Brightway Brand Guidelines v${draft.version}`,
      activatedAt: new Date(),
    })
    .where(eq(schema.ruleSets.id, draftRuleSetId));

  // 3. Log audit event
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId: userId,
    action: 'rule_set.activate',
    entityType: 'rule_set',
    entityId: draftRuleSetId,
    ruleSetId: draftRuleSetId,
    detail: { version: draft.version, activatedAt: new Date().toISOString() },
  });

  return { success: true, version: draft.version, ruleSetId: draftRuleSetId };
}

/**
 * Import YAML rules with line-numbered error reporting
 */
export async function importYamlRules(
  workspaceId: string,
  userId: string,
  yamlContent: string
) {
  const doc = parseDocument(yamlContent);

  if (doc.errors.length > 0) {
    const firstErr = doc.errors[0];
    const line = firstErr.linePos ? firstErr.linePos[0].line : 1;
    const col = firstErr.linePos ? firstErr.linePos[0].col : 1;
    throw new GuidelinesError(
      400,
      'yaml_syntax_error',
      `YAML syntax error at line ${line}, column ${col}: ${firstErr.message}`,
      { line, col }
    );
  }

  const data = doc.toJS();
  if (!data || !Array.isArray(data.rules)) {
    throw new GuidelinesError(
      400,
      'invalid_schema',
      'YAML must contain a top-level "rules" array.'
    );
  }

  // Validate each rule
  const validCategories = [
    'tone',
    'terminology',
    'messaging',
    'claim',
    'fact',
    'accessibility',
    'visual',
    'confidentiality',
  ];
  const validSeverities = ['blocker', 'major', 'minor', 'info'];

  for (let i = 0; i < data.rules.length; i++) {
    const r = data.rules[i];
    if (!r.key || !r.category || !r.severity || !r.title || !r.explanation) {
      throw new GuidelinesError(
        400,
        'invalid_rule_schema',
        `Rule at index ${i} is missing required fields (key, category, severity, title, explanation).`
      );
    }
    if (!validCategories.includes(r.category)) {
      throw new GuidelinesError(
        400,
        'invalid_category',
        `Rule ${r.key} has invalid category "${r.category}". Must be one of ${validCategories.join(', ')}.`
      );
    }
    if (!validSeverities.includes(r.severity)) {
      throw new GuidelinesError(
        400,
        'invalid_severity',
        `Rule ${r.key} has invalid severity "${r.severity}". Must be one of ${validSeverities.join(', ')}.`
      );
    }
  }

  // Ensure draft rule set exists
  const draft = await createDraftRuleSet(workspaceId, userId);
  const draftId = draft!.ruleSet.id;

  // Insert or update rules
  for (const r of data.rules) {
    const existing = await db
      .select()
      .from(schema.rules)
      .where(and(eq(schema.rules.ruleSetId, draftId), eq(schema.rules.key, r.key)))
      .limit(1);

    if (existing.length) {
      await db
        .update(schema.rules)
        .set({
          category: r.category,
          severity: r.severity,
          title: r.title,
          explanation: r.explanation,
          suggestionHint: r.suggestionHint || null,
          definition: r.definition || {},
          enabled: r.enabled ?? true,
        })
        .where(eq(schema.rules.id, existing[0].id));
    } else {
      await db.insert(schema.rules).values({
        id: crypto.randomUUID(),
        ruleSetId: draftId,
        key: r.key,
        category: r.category,
        severity: r.severity,
        title: r.title,
        explanation: r.explanation,
        suggestionHint: r.suggestionHint || null,
        definition: r.definition || {},
        enabled: r.enabled ?? true,
      });
    }
  }

  return { success: true, count: data.rules.length, draftRuleSetId: draftId };
}
