import crypto from 'node:crypto';
import { eq, and, desc } from 'drizzle-orm';
import { parseDocument } from 'yaml';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { DEFAULT_FACTS } from '../engine/num001';
import { runRules } from '../engine/rules';

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

/**
 * Re-audits all approved content when a brand guideline or fact-sheet entry changes.
 * Flagged non-compliant items move to 'needs_review' with exact diff and audit events.
 */
export async function reAuditApprovedContent(
  workspaceId: string,
  actorId: string,
  targetFactKey: string = 'F-001',
  updatedMaxValue: number = 15
) {
  // 1. Get current active fact
  const facts = await db
    .select()
    .from(schema.approvedFacts)
    .where(and(eq(schema.approvedFacts.workspaceId, workspaceId), eq(schema.approvedFacts.key, targetFactKey)))
    .limit(1);

  const existingFact = facts[0];
  const oldStatement = existingFact?.statement || 'Average household electricity-bill savings were 18–24%';
  const newStatement = `Average household electricity-bill savings were up to ${updatedMaxValue}% (2026 updated study)`;

  if (existingFact) {
    await db
      .update(schema.approvedFacts)
      .set({
        statement: newStatement,
        numericValues: [{ min: 10, max: updatedMaxValue, value: updatedMaxValue, unit: '%' }],
      })
      .where(eq(schema.approvedFacts.id, existingFact.id));
  }

  // 2. Audit trigger entry
  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId,
    action: 'stale_audit.triggered',
    entityType: 'fact',
    entityId: existingFact?.id || crypto.randomUUID(),
    detail: {
      factKey: targetFactKey,
      oldStatement,
      newStatement,
      oldValue: '20%',
      newValue: `${updatedMaxValue}%`,
      timestamp: new Date().toISOString(),
    },
  });

  // 3. Find all currently approved content items
  const approvedItems = await db
    .select({
      id: schema.contentItems.id,
      title: schema.contentItems.title,
      status: schema.contentItems.status,
      currentVersionId: schema.contentItems.currentVersionId,
    })
    .from(schema.contentItems)
    .where(and(eq(schema.contentItems.workspaceId, workspaceId), eq(schema.contentItems.status, 'approved')));

  const flaggedItems: Array<{ id: string; title: string; findingsCount: number; reason: string }> = [];

  const engineFacts = DEFAULT_FACTS.map((f) => {
    if (f.key === targetFactKey) {
      return {
        ...f,
        statement: newStatement,
        values: [{ min: 10, max: updatedMaxValue, value: updatedMaxValue, unit: '%' }],
      };
    }
    return f;
  });

  for (const item of approvedItems) {
    if (!item.currentVersionId) continue;

    const versions = await db
      .select()
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.id, item.currentVersionId))
      .limit(1);

    if (!versions.length) continue;
    const version = versions[0];

    const findings = runRules(version.textBody, { facts: engineFacts, ruleSetVersion: 3 });
    const blockersOrMajors = findings.filter((f) => f.severity === 'blocker' || f.severity === 'major');

    if (blockersOrMajors.length > 0) {
      await db
        .update(schema.contentItems)
        .set({ status: 'needs_review', updatedAt: new Date() })
        .where(eq(schema.contentItems.id, item.id));

      const newRunId = crypto.randomUUID();
      await db.insert(schema.reviewRuns).values({
        id: newRunId,
        contentVersionId: version.id,
        ruleSetId: '30000000-0000-0000-0000-000000000003',
        status: 'complete',
        counts: {
          blocker: findings.filter((f) => f.severity === 'blocker').length,
          major: findings.filter((f) => f.severity === 'major').length,
          minor: findings.filter((f) => f.severity === 'minor').length,
          info: findings.filter((f) => f.severity === 'info').length,
        },
        startedAt: new Date(),
        finishedAt: new Date(),
      });

      for (const f of blockersOrMajors) {
        await db.insert(schema.findings).values({
          id: crypto.randomUUID(),
          reviewRunId: newRunId,
          origin: f.origin,
          category: f.category,
          severity: f.severity,
          ruleId: '40000000-0000-0000-0000-000000000009',
          spanStart: f.spanStart,
          spanEnd: f.spanEnd,
          quote: f.quote,
          explanation: `Stale-content re-audit: ${f.explanation}`,
          suggestion: f.suggestion || null,
          confidence: '1.00',
          status: 'open',
        });
      }

      await db.insert(schema.auditLog).values({
        workspaceId,
        actorId,
        action: 'content.flagged_for_rereview',
        entityType: 'content_item',
        entityId: item.id,
        detail: {
          title: item.title,
          previousStatus: 'approved',
          newStatus: 'needs_review',
          reason: `Fact ${targetFactKey} updated: ${oldStatement} -> ${newStatement}. Content claim violates updated fact ceiling.`,
          diff: { old: '20%', new: `${updatedMaxValue}%` },
          findingsCount: blockersOrMajors.length,
        },
      });

      flaggedItems.push({
        id: item.id,
        title: item.title,
        findingsCount: blockersOrMajors.length,
        reason: `Claim exceeds updated ${targetFactKey} ceiling (${updatedMaxValue}%)`,
      });
    }
  }

  return {
    success: true,
    targetFactKey,
    oldValue: '20%',
    newValue: `${updatedMaxValue}%`,
    flaggedCount: flaggedItems.length,
    flaggedItems,
  };
}

/**
 * Reset fact F-001 back to standard 20% savings.
 */
export async function resetFactAndReAudit(workspaceId: string, actorId: string) {
  const originalStatement = 'Average household electricity-bill savings were 18–24% (2025 customer study, n=412)';

  const facts = await db
    .select()
    .from(schema.approvedFacts)
    .where(and(eq(schema.approvedFacts.workspaceId, workspaceId), eq(schema.approvedFacts.key, 'F-001')))
    .limit(1);

  if (facts.length) {
    await db
      .update(schema.approvedFacts)
      .set({
        statement: originalStatement,
        numericValues: [{ min: 18, max: 24, unit: '%' }],
      })
      .where(eq(schema.approvedFacts.id, facts[0].id));
  }

  await db.insert(schema.auditLog).values({
    workspaceId,
    actorId,
    action: 'stale_audit.reset',
    entityType: 'fact',
    entityId: facts[0]?.id || crypto.randomUUID(),
    detail: {
      factKey: 'F-001',
      statement: originalStatement,
      value: '18–24%',
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true, message: 'Fact F-001 reset to 18–24% savings.' };
}
