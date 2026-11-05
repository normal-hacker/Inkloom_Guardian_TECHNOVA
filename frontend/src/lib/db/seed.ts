import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { getDb } from './client';

// Stable UUIDs for idempotent seeding
export const SEED_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
export const SEED_USERS = {
  ASHA: '10000000-0000-0000-0000-000000000001',
  BEN: '10000000-0000-0000-0000-000000000002',
  PRIYA: '10000000-0000-0000-0000-000000000003',
  MARCUS: '10000000-0000-0000-0000-000000000004',
};

export const SEED_SOURCES = {
  S1: '20000000-0000-0000-0000-000000000001',
  S2: '20000000-0000-0000-0000-000000000002',
  S3: '20000000-0000-0000-0000-000000000003',
  S4: '20000000-0000-0000-0000-000000000004',
};

export const SEED_RULE_SETS = {
  V1: '30000000-0000-0000-0000-000000000001',
  V2: '30000000-0000-0000-0000-000000000002',
  V3: '30000000-0000-0000-0000-000000000003',
};

export async function seedDatabase(customDb?: NodePgDatabase<typeof schema>) {
  const db = customDb || getDb();

  // 1. Workspace
  await db
    .insert(schema.workspaces)
    .values({
      id: SEED_WORKSPACE_ID,
      name: 'Brightway Solar',
      confidentialTerms: ['Project Helios', 'unreleased', 'internal only', 'do not share'],
      createdAt: new Date('2026-01-01T00:00:00Z'),
    })
    .onConflictDoUpdate({
      target: schema.workspaces.id,
      set: {
        name: 'Brightway Solar',
        confidentialTerms: ['Project Helios', 'unreleased', 'internal only', 'do not share'],
      },
    });

  // 2. Demo Users
  const demoUsers = [
    {
      id: SEED_USERS.ASHA,
      workspaceId: SEED_WORKSPACE_ID,
      email: 'asha@brightway.example',
      displayName: 'Asha (Creator)',
      role: 'creator',
      isDemo: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_USERS.BEN,
      workspaceId: SEED_WORKSPACE_ID,
      email: 'ben@brightway.example',
      displayName: 'Ben (Creator 2)',
      role: 'creator',
      isDemo: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_USERS.PRIYA,
      workspaceId: SEED_WORKSPACE_ID,
      email: 'priya@brightway.example',
      displayName: 'Priya (Reviewer)',
      role: 'reviewer',
      isDemo: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_USERS.MARCUS,
      workspaceId: SEED_WORKSPACE_ID,
      email: 'marcus@brightway.example',
      displayName: 'Marcus (Manager)',
      role: 'manager',
      isDemo: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  for (const user of demoUsers) {
    await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          displayName: user.displayName,
          role: user.role,
          isDemo: user.isDemo,
        },
      });
  }

  // 3. Guideline Sources
  const sources = [
    {
      id: SEED_SOURCES.S1,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Brand Voice Guide',
      versionLabel: 'v4',
      kind: 'guideline',
      uploadedBy: SEED_USERS.MARCUS,
      bodyMarkdown: `# Brand Voice Guide v4\n\n## 2. Tone\n### 2.1 Punctuation\nUse measured punctuation. Avoid consecutive exclamation marks or excessive excitement.\n### 2.3 Pressure Tactics\nDo not use high-pressure urgency phrases like 'act now' or 'limited time only'.\n### 2.4 Hype Words\nAvoid exaggerated hype words such as revolutionary or game-changing.\n\n## 4. Messaging\n### 4.1 Comparative Claims\nAvoid direct comparative claims like 'cheaper than' or 'better than'.\n\n## 5. Claims\n### 5.2 Superlatives\nDo not claim #1, best, or fastest without audited proof.\n### 5.3 Guarantees\nNever guarantee zero bills or 100% savings.\n\n## 7. Confidentiality\nKeep internal codenames like Project Helios strictly confidential.`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_SOURCES.S2,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Terminology Sheet',
      versionLabel: '2025',
      kind: 'terminology',
      uploadedBy: SEED_USERS.MARCUS,
      bodyMarkdown: `# Terminology Sheet 2025\n\n## 1. Approved and Banned Terms\n- Use 'affordable' instead of 'cheapest'.\n- Use 'clean energy' instead of 'free energy'.\n- Use 'solar panels' instead of 'solar cells'.\n\n## 2. Product Naming\nAlways write 'SunLink' with camel case. Never write 'Sun Link' or 'sun-link'.`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_SOURCES.S3,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Approved Facts Sheet',
      versionLabel: '2025-Q3',
      kind: 'fact_sheet',
      uploadedBy: SEED_USERS.MARCUS,
      bodyMarkdown: `# Approved Facts Sheet 2025-Q3\n\n## 1. Verified Metrics\nAll published numbers and percentages must match verified research records.`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: SEED_SOURCES.S4,
      workspaceId: SEED_WORKSPACE_ID,
      title: 'Accessibility & Asset Policy',
      versionLabel: 'v2',
      kind: 'asset_policy',
      uploadedBy: SEED_USERS.MARCUS,
      bodyMarkdown: `# Accessibility & Asset Policy v2\n\n## 1. Content Standards\n### 1.1 Images\nAll images must have descriptive alt text (at least 5 characters).\n### 1.3 Links\nNever use standalone vague links like 'click here' or 'read more'.\n### 1.5 Capitalisation\nAvoid runs of 4 or more consecutive ALL-CAPS words.`,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  for (const src of sources) {
    await db
      .insert(schema.guidelineSources)
      .values(src)
      .onConflictDoUpdate({
        target: schema.guidelineSources.id,
        set: {
          title: src.title,
          versionLabel: src.versionLabel,
          kind: src.kind,
          bodyMarkdown: src.bodyMarkdown,
        },
      });
  }

  // 4. Rule Sets (v1 archived, v2 archived, v3 active)
  const ruleSetsData = [
    {
      id: SEED_RULE_SETS.V1,
      workspaceId: SEED_WORKSPACE_ID,
      version: 1,
      status: 'archived',
      notes: 'Initial baseline rule set',
      createdBy: SEED_USERS.MARCUS,
      createdAt: new Date('2025-10-01T00:00:00Z'),
      activatedAt: new Date('2025-10-01T00:00:00Z'),
    },
    {
      id: SEED_RULE_SETS.V2,
      workspaceId: SEED_WORKSPACE_ID,
      version: 2,
      status: 'archived',
      notes: 'Updated tone guidelines and SunLink product rules',
      createdBy: SEED_USERS.MARCUS,
      createdAt: new Date('2025-12-01T00:00:00Z'),
      activatedAt: new Date('2025-12-01T00:00:00Z'),
    },
    {
      id: SEED_RULE_SETS.V3,
      workspaceId: SEED_WORKSPACE_ID,
      version: 3,
      status: 'active',
      notes: 'Active Brightway Solar standard with NUM-001 algorithm',
      createdBy: SEED_USERS.MARCUS,
      createdAt: new Date('2026-01-15T00:00:00Z'),
      activatedAt: new Date('2026-01-15T00:00:00Z'),
    },
  ];

  for (const rs of ruleSetsData) {
    await db
      .insert(schema.ruleSets)
      .values(rs)
      .onConflictDoUpdate({
        target: schema.ruleSets.id,
        set: {
          status: rs.status,
          notes: rs.notes,
          activatedAt: rs.activatedAt,
        },
      });
  }

  // 5. Rules for Rule Set v3 (13 rules)
  const rulesList = [
    {
      key: 'TONE-001',
      category: 'tone',
      severity: 'minor',
      title: 'Excessive punctuation',
      definition: { type: 'punctuation', maxConsecutive: 1, maxPerWords: { count: 1, words: 60 } },
      explanation: 'Two or more exclamation marks in a row or more than one exclamation mark per 60 words violates our measured voice.',
      suggestionHint: 'Replace excessive exclamation marks with a period.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '2.1',
    },
    {
      key: 'TONE-002',
      category: 'tone',
      severity: 'major',
      title: 'Pressure phrases',
      definition: { type: 'term', terms: ['act now', 'limited time only', "don't miss out", 'hurry', 'last chance'] },
      explanation: 'High-pressure urgency phrases diminish brand trust.',
      suggestionHint: 'Focus on enduring customer value rather than manufactured urgency.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '2.3',
    },
    {
      key: 'TONE-003',
      category: 'tone',
      severity: 'minor',
      title: 'Hype words',
      definition: { type: 'term', terms: ['revolutionary', 'game-changing', 'unbelievable', 'amazing', 'mind-blowing'] },
      explanation: 'Overstated hype weakens customer confidence in technical claims.',
      suggestionHint: 'Use grounded, demonstrable descriptions of product benefits.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '2.4',
    },
    {
      key: 'TERM-001',
      category: 'terminology',
      severity: 'major',
      title: 'Banned terminology',
      definition: { type: 'glossary_banned' },
      explanation: 'This term is deprecated or forbidden in brand communications.',
      suggestionHint: 'Use the preferred brand alternative.',
      sourceId: SEED_SOURCES.S2,
      sourceSection: '1',
    },
    {
      key: 'TERM-002',
      category: 'terminology',
      severity: 'minor',
      title: 'Product naming format',
      definition: { type: 'regex', pattern: '\\b(Sun Link|Sunlink|SUNLINK|sun-link)\\b' },
      explanation: 'The flagship product must always be formatted with camel case as "SunLink".',
      suggestionHint: 'Write "SunLink".',
      sourceId: SEED_SOURCES.S2,
      sourceSection: '2',
    },
    {
      key: 'MSG-001',
      category: 'messaging',
      severity: 'major',
      title: 'Comparative claims',
      definition: { type: 'term', terms: ['better than', 'cheaper than', 'unlike other', 'beats'] },
      explanation: 'Direct comparative claims create legal exposure and contradict our respectful brand posture.',
      suggestionHint: 'State our strengths without referencing unnamed or named competitors.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '4.1',
    },
    {
      key: 'CLAIM-001',
      category: 'claim',
      severity: 'blocker',
      title: 'Superlatives',
      definition: { type: 'regex', pattern: '\\b(best|#1|number one|fastest|leading|unbeatable|world-class|only)\\b', flags: 'i' },
      explanation: 'Superlatives must be backed by documented third-party verification.',
      suggestionHint: 'Specify the specific metric or certification rather than an unqualified superlative.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '5.2',
    },
    {
      key: 'CLAIM-002',
      category: 'claim',
      severity: 'blocker',
      title: 'Guarantee statements',
      definition: { type: 'regex', pattern: '\\b(guarantee|guaranteed|risk-free|100%)\\b', flags: 'i' },
      explanation: 'Absolute guarantee claims create legal liability.',
      suggestionHint: 'Reference the official warranty terms instead of making absolute guarantees.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '5.3',
    },
    {
      key: 'NUM-001',
      category: 'fact',
      severity: 'blocker',
      title: 'Unsupported figures or metrics',
      definition: { type: 'number_claim', units: ['%', 'years', 'days', 'cities'] },
      explanation: 'All figures with units must be supported by an approved brand fact sheet.',
      suggestionHint: 'Align figure with approved fact sheet metrics.',
      sourceId: SEED_SOURCES.S3,
      sourceSection: '1',
    },
    {
      key: 'CONF-001',
      category: 'confidentiality',
      severity: 'blocker',
      title: 'Confidential information',
      definition: { type: 'regex', pattern: '\\b(Project Helios|unreleased|internal only|do not share|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\b', flags: 'i' },
      explanation: 'Internal project names and private contact details must not appear in public copy.',
      suggestionHint: 'Redact internal identifiers and confidential details.',
      sourceId: SEED_SOURCES.S1,
      sourceSection: '7',
    },
    {
      key: 'ACC-001',
      category: 'accessibility',
      severity: 'major',
      title: 'Image missing alt text',
      definition: { type: 'accessibility', check: 'image_alt_present', minChars: 5 },
      explanation: 'All imagery requires descriptive alternative text for screen readers.',
      suggestionHint: 'Provide descriptive alt text of at least 5 characters.',
      sourceId: SEED_SOURCES.S4,
      sourceSection: '1.1',
    },
    {
      key: 'ACC-002',
      category: 'accessibility',
      severity: 'minor',
      title: 'Non-descriptive link text',
      definition: { type: 'term', terms: ['click here', 'read more', 'learn more'] },
      explanation: 'Vague link copy like "click here" fails accessibility standards for assistive devices.',
      suggestionHint: 'Describe the destination in the link text.',
      sourceId: SEED_SOURCES.S4,
      sourceSection: '1.3',
    },
    {
      key: 'ACC-003',
      category: 'accessibility',
      severity: 'minor',
      title: 'Excessive uppercase words',
      definition: { type: 'accessibility', check: 'all_caps_run', maxWords: 3 },
      explanation: 'Runs of 4 or more ALL-CAPS words are difficult to read and read poorly on screen readers.',
      suggestionHint: 'Use standard title case or sentence case.',
      sourceId: SEED_SOURCES.S4,
      sourceSection: '1.5',
    },
  ];

  for (let i = 0; i < rulesList.length; i++) {
    const r = rulesList[i];
    const ruleId = `40000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`;
    await db
      .insert(schema.rules)
      .values({
        id: ruleId,
        ruleSetId: SEED_RULE_SETS.V3,
        key: r.key,
        category: r.category,
        severity: r.severity,
        title: r.title,
        definition: r.definition,
        explanation: r.explanation,
        suggestionHint: r.suggestionHint,
        sourceId: r.sourceId,
        sourceSection: r.sourceSection,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: [schema.rules.ruleSetId, schema.rules.key],
        set: {
          category: r.category,
          severity: r.severity,
          title: r.title,
          definition: r.definition,
          explanation: r.explanation,
          suggestionHint: r.suggestionHint,
          sourceSection: r.sourceSection,
          enabled: true,
        },
      });
  }

  // 6. Glossary Terms
  const glossary = [
    { term: 'cheapest', kind: 'banned', pref: 'affordable', note: 'Avoid racing to the bottom' },
    { term: 'free energy', kind: 'banned', pref: 'clean energy', note: 'Misleading claim' },
    { term: 'zero bills', kind: 'banned', pref: 'lower bills', note: 'Unattainable promise' },
    { term: 'solar cells', kind: 'banned', pref: 'solar panels', note: 'Industry term preference' },
    { term: 'users', kind: 'discouraged', pref: 'customers', note: 'Brand voice is human-centric' },
    { term: 'green', kind: 'discouraged', pref: 'renewable', note: 'Avoid vague greenwashing' },
  ];

  for (let i = 0; i < glossary.length; i++) {
    const g = glossary[i];
    const gid = `50000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`;
    await db
      .insert(schema.glossaryTerms)
      .values({
        id: gid,
        workspaceId: SEED_WORKSPACE_ID,
        term: g.term,
        kind: g.kind,
        preferredAlternative: g.pref,
        caseSensitive: false,
        note: g.note,
        sourceId: SEED_SOURCES.S2,
      })
      .onConflictDoNothing();
  }

  // 7. Approved Facts (F-001 through F-006)
  const facts = [
    {
      key: 'F-001',
      statement: 'Average household electricity-bill savings were 18–24% (2025 customer study, n=412)',
      numericValues: [{ min: 18, max: 24, unit: '%' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'savings save saving bill bills electricity 18 24 percent',
    },
    {
      key: 'F-002',
      statement: 'Panels carry a 25-year performance warranty',
      numericValues: [{ value: 25, unit: 'years' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'warranty panels performance 25 years',
    },
    {
      key: 'F-003',
      statement: 'Typical home installation takes 1–2 days',
      numericValues: [{ min: 1, max: 2, unit: 'days' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'install installation installed 1 2 days home',
    },
    {
      key: 'F-004',
      statement: 'The inverter carries a 12-year warranty',
      numericValues: [{ value: 12, unit: 'years' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'inverter warranty 12 years',
    },
    {
      key: 'F-005',
      statement: 'Panel efficiency is up to 22.5%',
      numericValues: [{ value: 22.5, unit: '%' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'efficiency efficient 22.5 percent panels',
    },
    {
      key: 'F-006',
      statement: 'Brightway Solar serves customers in 14 cities',
      numericValues: [{ value: 14, unit: 'cities' }],
      sourceId: SEED_SOURCES.S3,
      searchVector: 'cities serve serves 14 customers locations',
    },
  ];

  for (let i = 0; i < facts.length; i++) {
    const f = facts[i];
    const fid = `60000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`;
    await db
      .insert(schema.approvedFacts)
      .values({
        id: fid,
        workspaceId: SEED_WORKSPACE_ID,
        key: f.key,
        statement: f.statement,
        numericValues: f.numericValues,
        sourceId: f.sourceId,
        searchVector: f.searchVector,
        validFrom: new Date('2025-01-01T00:00:00Z'),
        validUntil: new Date('2027-01-01T00:00:00Z'),
      })
      .onConflictDoUpdate({
        target: [schema.approvedFacts.workspaceId, schema.approvedFacts.key],
        set: {
          statement: f.statement,
          numericValues: f.numericValues,
          searchVector: f.searchVector,
        },
      });
  }

  // 8. 5 Seed Content Items
  const contentItemsData = [
    {
      id: '70000000-0000-0000-0000-000000000001',
      title: 'Spring savings blog',
      contentType: 'blog',
      status: 'approved',
      ownerId: SEED_USERS.ASHA,
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      title: 'Installer partnership post',
      contentType: 'social',
      status: 'in_review',
      ownerId: SEED_USERS.BEN,
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      title: 'Social post: SunLink launch',
      contentType: 'social',
      status: 'changes_requested',
      ownerId: SEED_USERS.ASHA,
    },
    {
      id: '70000000-0000-0000-0000-000000000004',
      title: 'Homepage banner copy',
      contentType: 'web',
      status: 'checked',
      ownerId: SEED_USERS.BEN,
    },
    {
      id: '70000000-0000-0000-0000-000000000005',
      title: 'Press note',
      contentType: 'press',
      status: 'draft',
      ownerId: SEED_USERS.ASHA,
    },
  ];

  for (const item of contentItemsData) {
    await db
      .insert(schema.contentItems)
      .values({
        id: item.id,
        workspaceId: SEED_WORKSPACE_ID,
        title: item.title,
        contentType: item.contentType,
        status: item.status,
        ownerId: item.ownerId,
        createdAt: new Date('2026-02-01T10:00:00Z'),
        updatedAt: new Date('2026-02-02T12:00:00Z'),
      })
      .onConflictDoUpdate({
        target: schema.contentItems.id,
        set: {
          title: item.title,
          contentType: item.contentType,
          status: item.status,
        },
      });
  }

  // Content Version & Review Run for approved item (ci-001)
  const v1Text = 'Switch to clean energy with Brightway Solar. Enjoy 20% savings on your bill and a 25-year panel warranty.';
  const v1Hash = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const cv1Id = '80000000-0000-0000-0000-000000000001';
  const rr1Id = '90000000-0000-0000-0000-000000000001';

  await db
    .insert(schema.contentVersions)
    .values({
      id: cv1Id,
      contentItemId: contentItemsData[0].id,
      versionNo: 1,
      textBody: v1Text,
      contentHash: v1Hash,
      sourceKind: 'paste',
      changeNote: 'Initial draft',
      createdBy: SEED_USERS.ASHA,
      createdAt: new Date('2026-02-01T10:00:00Z'),
    })
    .onConflictDoNothing();

  await db
    .update(schema.contentItems)
    .set({ currentVersionId: cv1Id })
    .where(eq(schema.contentItems.id, contentItemsData[0].id));

  await db
    .insert(schema.reviewRuns)
    .values({
      id: rr1Id,
      contentVersionId: cv1Id,
      ruleSetId: SEED_RULE_SETS.V3,
      status: 'complete',
      counts: { blocker: 0, major: 0, minor: 0, info: 0 },
      startedAt: new Date('2026-02-01T10:05:00Z'),
      finishedAt: new Date('2026-02-01T10:05:01Z'),
    })
    .onConflictDoNothing();

  await db
    .insert(schema.approvals)
    .values({
      id: 'a0000000-0000-0000-0000-000000000001',
      contentVersionId: cv1Id,
      reviewRunId: rr1Id,
      decision: 'approved',
      decidedBy: SEED_USERS.PRIYA,
      note: 'Verified against approved fact sheet and voice guidelines.',
      contentHash: v1Hash,
      ruleSetId: SEED_RULE_SETS.V3,
      createdAt: new Date('2026-02-01T11:00:00Z'),
    })
    .onConflictDoNothing();

  // Content Version & Review Run for in_review item with open blocker (ci-002)
  const v2Text = 'Our SunLink panels are the best on the market with a 25-year warranty.';
  const cv2Id = '80000000-0000-0000-0000-000000000002';
  const rr2Id = '90000000-0000-0000-0000-000000000002';
  const ruleClaim001Id = '40000000-0000-0000-0000-000000000007';

  await db
    .insert(schema.contentVersions)
    .values({
      id: cv2Id,
      contentItemId: contentItemsData[1].id,
      versionNo: 1,
      textBody: v2Text,
      contentHash: 'f4b9b94e69e15728a4c379a277ec3c30722aa02616b3ffb35237225c9ab45100',
      sourceKind: 'paste',
      changeNote: 'Draft ready for review',
      createdBy: SEED_USERS.BEN,
      createdAt: new Date('2026-02-02T09:00:00Z'),
    })
    .onConflictDoNothing();

  await db
    .update(schema.contentItems)
    .set({ currentVersionId: cv2Id })
    .where(eq(schema.contentItems.id, contentItemsData[1].id));

  await db
    .insert(schema.reviewRuns)
    .values({
      id: rr2Id,
      contentVersionId: cv2Id,
      ruleSetId: SEED_RULE_SETS.V3,
      status: 'complete',
      counts: { blocker: 1, major: 0, minor: 0, info: 0 },
      startedAt: new Date('2026-02-02T09:05:00Z'),
      finishedAt: new Date('2026-02-02T09:05:01Z'),
    })
    .onConflictDoNothing();

  const findingBlockerId = 'b0000000-0000-0000-0000-000000000001';
  await db
    .insert(schema.findings)
    .values({
      id: findingBlockerId,
      reviewRunId: rr2Id,
      origin: 'rule',
      category: 'claim',
      severity: 'blocker',
      ruleId: ruleClaim001Id,
      spanStart: 28,
      spanEnd: 32,
      quote: 'best',
      explanation: 'Superlatives must be backed by documented third-party verification.',
      suggestion: 'top-rated',
      confidence: '1.00',
      status: 'open',
    })
    .onConflictDoNothing();

  // 9. Historical findings and decisions across 90 days (~40 records)
  // Ensures TONE-003 and ACC-003 are dismissed/overridden > 50%
  const historicalCategories = [
    { cat: 'tone', rule: 'TONE-003', ruleId: '40000000-0000-0000-0000-000000000003', sev: 'minor', quote: 'revolutionary', dismissedPct: 0.65 },
    { cat: 'accessibility', rule: 'ACC-003', ruleId: '40000000-0000-0000-0000-000000000013', sev: 'minor', quote: 'SAVE BIG ON SOLAR', dismissedPct: 0.70 },
    { cat: 'claim', rule: 'CLAIM-002', ruleId: '40000000-0000-0000-0000-000000000008', sev: 'blocker', quote: 'guaranteed', dismissedPct: 0.10 },
    { cat: 'terminology', rule: 'TERM-001', ruleId: '40000000-0000-0000-0000-000000000004', sev: 'major', quote: 'cheapest', dismissedPct: 0.15 },
  ];

  let historicalCounter = 100;
  for (let dayOffset = 85; dayOffset >= 5; dayOffset -= 8) {
    for (const h of historicalCategories) {
      historicalCounter++;
      const fId = `b0000000-0000-0000-0000-${historicalCounter.toString().padStart(12, '0')}`;
      const isDismissed = Math.random() < h.dismissedPct;
      const status = isDismissed ? 'dismissed' : 'fixed';

      await db
        .insert(schema.findings)
        .values({
          id: fId,
          reviewRunId: rr1Id,
          origin: 'rule',
          category: h.cat,
          severity: h.sev,
          ruleId: h.ruleId,
          spanStart: 0,
          spanEnd: h.quote.length,
          quote: h.quote,
          explanation: `Historical finding from day -${dayOffset}`,
          suggestion: 'Adjusted copy',
          confidence: '1.00',
          status: status,
        })
        .onConflictDoNothing();

      const dId = `c0000000-0000-0000-0000-${historicalCounter.toString().padStart(12, '0')}`;
      await db
        .insert(schema.findingDecisions)
        .values({
          id: dId,
          findingId: fId,
          decidedBy: isDismissed ? SEED_USERS.PRIYA : SEED_USERS.ASHA,
          decision: status,
          reason: isDismissed ? 'Approved context-specific exception for technical accuracy.' : null,
          createdAt: new Date(Date.now() - dayOffset * 86400000),
        })
        .onConflictDoNothing();
    }
  }

  // 10. Audit log entry
  await db
    .insert(schema.auditLog)
    .values({
      workspaceId: SEED_WORKSPACE_ID,
      actorId: SEED_USERS.MARCUS,
      action: 'ruleset.activate',
      entityType: 'rule_set',
      entityId: SEED_RULE_SETS.V3,
      ruleSetId: SEED_RULE_SETS.V3,
      detail: { version: 3, notes: 'Published active Brightway Solar rule set v3' },
      createdAt: new Date('2026-01-15T00:00:00Z'),
    })
    .onConflictDoNothing();

  return { success: true };
}

// CLI execution helper
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('seed.ts'))) {
  seedDatabase()
    .then(() => {
      console.log('Database seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
