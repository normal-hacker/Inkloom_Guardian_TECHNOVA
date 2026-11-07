'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { ExpandableTabs, TabItem } from '@/components/ui/expandable-tabs';
import { Button } from '@/components/ui/button';
import { SeverityBadge, RuleChip } from '@/components/ui/badge';
import { SectionLabel, Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/dialog';
import {
  Library,
  ListChecks,
  BookA,
  BadgeCheck,
  GitBranch,
  OctagonX,
  ShieldCheck,
} from 'lucide-react';
import { useOptimisticMutation } from '@/lib/optimistic/useOptimisticMutation';
import { PendingBadge } from '@/components/ui/pending-badge';
import { InlineRetry } from '@/components/ui/inline-retry';
import { Severity } from '@/lib/domain/types';

interface DraftRuleItem {
  id: string;
  key: string;
  category: string;
  severity: Severity;
  title: string;
  explanation: string;
  suggestionHint?: string | null;
  enabled: boolean;
  sourceSection?: string | null;
  __pending?: boolean;
}

interface ActiveGuidelinesData {
  ruleSet?: { id: string; version: number; name?: string };
  rules?: DraftRuleItem[];
  glossary?: Array<{ id: string; term: string; kind: string; preferredAlternative?: string; note?: string }>;
  facts?: Array<{ id: string; key: string; statement: string; searchVector?: string }>;
  sources?: Array<{ id: string; title: string; versionLabel?: string; kind: string }>;
}

function GuidelinesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [activeData, setActiveData] = useState<ActiveGuidelinesData | null>(null);
  const [draftData, setDraftData] = useState<{
    rules?: DraftRuleItem[];
    ruleSet?: { id: string; version: number; name?: string };
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string; displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // YAML import state
  const [yamlText, setYamlText] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [yamlSuccess, setYamlSuccess] = useState<string | null>(null);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [rulesViewMode, setRulesViewMode] = useState<'active' | 'draft'>('active');

  // Optimistic UI for toggling draft rules
  const ruleToggleMutation = useOptimisticMutation<
    DraftRuleItem[],
    { ruleKey: string; enabled: boolean },
    { success: boolean; ruleKey: string; updates: Record<string, unknown> }
  >({
    action: 'guidelines.draft_rule_toggle',
    initialState: [],
    apply: (current, input) => {
      return current.map((r) =>
        r.key === input.ruleKey ? { ...r, enabled: input.enabled, __pending: true } : r
      );
    },
    mutate: async (input, { signal, idempotencyKey }) => {
      const res = await fetch(`/api/v1/guidelines/draft/rules/${input.ruleKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ enabled: input.enabled }),
        signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, status: res.status, errorJson: data, headers: res.headers };
      }
      return { ok: true, status: res.status, data, headers: res.headers };
    },
    reconcile: (current, result) => {
      return current.map((r) =>
        r.key === result.ruleKey ? { ...r, __pending: false } : r
      );
    },
  });

  const loadGuidelines = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/guidelines/active');
      if (res.ok) {
        const data = await res.json();
        setActiveData(data);
      }

      const dRes = await fetch('/api/v1/guidelines/draft');
      if (dRes.ok) {
        const dData = await dRes.json();
        setDraftData(dData);
        if (dData?.rules) {
          ruleToggleMutation.setState(dData.rules);
        }
      }

      const uRes = await fetch('/api/v1/auth/me');
      if (uRes.ok) {
        const uData = await uRes.json();
        setCurrentUser(uData.user);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [ruleToggleMutation]);

  useEffect(() => {
    loadGuidelines();
  }, [loadGuidelines]);

  const [reAuditLoading, setReAuditLoading] = useState(false);
  const [reAuditResult, setReAuditResult] = useState<{
    success: boolean;
    targetFactKey?: string;
    oldValue?: string;
    newValue?: string;
    flaggedCount?: number;
    flaggedItems?: Array<{ id: string; title: string; reason: string }>;
    message?: string;
  } | null>(null);

  const handleReAudit = async (action: 'update' | 'reset') => {
    setReAuditLoading(true);
    try {
      const res = await fetch('/api/v1/guidelines/re-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, factKey: 'F-001', newValue: 15 }),
      });
      if (res.ok) {
        const data = await res.json();
        setReAuditResult(data);
        await loadGuidelines();
      }
    } catch {}
    setReAuditLoading(false);
  };

  const tabParam = searchParams.get('tab') || 'sources';

  const tabList: TabItem[] = [
    { id: 'sources', title: 'Sources', icon: Library },
    {
      id: 'rules',
      title: 'Rules',
      icon: ListChecks,
      badge: activeData?.rules?.length || 13,
      badgeLabel: `Rules, ${activeData?.rules?.length || 13} total`,
    },
    { id: 'glossary', title: 'Glossary', icon: BookA },
    { id: 'facts', title: 'Facts', icon: BadgeCheck },
    { id: 'rulesets', title: 'Rule Sets', icon: GitBranch },
  ];

  const currentTabIndex = Math.max(
    0,
    tabList.findIndex((t) => t.id === tabParam)
  );
  const currentTabId = tabList[currentTabIndex]?.id || 'sources';

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const selected = tabList[index];
    if (selected?.id) {
      router.push(`/guidelines?tab=${selected.id}`);
    }
  };

  const isManager = currentUser && currentUser.role === 'manager';

  const handleCreateDraft = async () => {
    try {
      const res = await fetch('/api/v1/guidelines/draft', { method: 'POST' });
      if (res.ok) {
        await loadGuidelines();
      }
    } catch {}
  };

  const handleActivateDraft = async () => {
    try {
      const res = await fetch('/api/v1/guidelines/draft/activate', { method: 'POST' });
      if (res.ok) {
        setActivateConfirmOpen(false);
        await loadGuidelines();
      }
    } catch {}
  };

  const handleImportYaml = async (e: React.FormEvent) => {
    e.preventDefault();
    setYamlError(null);
    setYamlSuccess(null);

    try {
      const res = await fetch('/api/v1/guidelines/import-yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: yamlText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setYamlError(data.message || 'YAML validation failed.');
      } else {
        setYamlSuccess(`Successfully imported ${data.rulesCount} rules into Draft.`);
        await loadGuidelines();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setYamlError(msg);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink min-h-screen pb-20">
      <PageHeader
        title="Brand Guidelines"
        description="Approved source documents, pure TypeScript rules, glossary, and facts for governance audits."
        actions={
          isManager ? (
            <span className="px-2.5 py-1 bg-ink text-surface font-mono text-xs font-bold uppercase">
              Manager Mode: Editing Enabled
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-surface-2 border-2 border-rule text-ink-2 font-mono text-xs font-bold uppercase">
              Managers can edit
            </span>
          )
        }
      />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-8 space-y-8 flex-1">
        {/* In-Page ExpandableTabs */}
        <div className="flex justify-start">
          <ExpandableTabs
            tabs={tabList}
            variant="tabs"
            value={currentTabIndex}
            onChange={handleTabChange}
            ariaLabel="Brand guideline sections"
            idPrefix="guidelines-tabs"
          />
        </div>

        {/* Tab Panels */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 bg-surface-2 border-2 border-rule animate-pulse" />
            <div className="h-32 bg-surface-2 border-2 border-rule animate-pulse" />
            <div className="h-32 bg-surface-2 border-2 border-rule animate-pulse" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
          {/* TAB: Sources */}
          {currentTabId === 'sources' && (
            <motion.div
              key="sources"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <SectionLabel number="01" title="Approved Source Documents" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Brand Voice & Writing Guide v4',
                    desc: 'Primary tone, language substantiation, and superlative advertising claims policy.',
                    section: '§1 Tone · §3 Superlatives · §5 Proof',
                    badge: 'Core Policy',
                  },
                  {
                    title: 'Approved Metrics Fact Sheet 2025-Q3',
                    desc: 'Numeric parameters for residential solar efficiency, capacity, and average savings.',
                    section: '6 Verified Facts (F-001 to F-006)',
                    badge: 'Facts Base',
                  },
                  {
                    title: 'Asset Policy & Accessibility 2025',
                    desc: 'Requirements for alt-text presence, uppercase scan limits, and descriptive anchor text.',
                    section: 'ACC-001 Alt · ACC-002 Caps',
                    badge: 'Compliance',
                  },
                ].map((doc, idx) => (
                  <Card key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-ink">{doc.title}</span>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-ink bg-surface-2 text-ink">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed">{doc.desc}</p>
                    <p className="text-xs font-mono text-ink-3 pt-2 border-t border-rule">{doc.section}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: Rules */}
          {currentTabId === 'rules' && (
            <motion.div
              key="rules"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionLabel
                  number="02"
                  title={
                    rulesViewMode === 'draft' && draftData
                      ? `Draft Policy Rule Set v${draftData.ruleSet?.version || 4} (Optimistic Staging)`
                      : 'Active Policy Rule Set (Deterministic Engine)'
                  }
                />
                <div className="flex items-center gap-2">
                  {draftData && isManager && (
                    <div className="flex border-2 border-ink bg-surface p-0.5">
                      <button
                        type="button"
                        onClick={() => setRulesViewMode('active')}
                        className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors ${
                          rulesViewMode === 'active' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        Active (v{activeData?.ruleSet?.version || 3})
                      </button>
                      <button
                        type="button"
                        onClick={() => setRulesViewMode('draft')}
                        className={`px-2.5 py-1 text-xs font-mono font-bold uppercase transition-colors ${
                          rulesViewMode === 'draft' ? 'bg-ink text-surface' : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        Draft (v{draftData.ruleSet?.version || 4})
                      </button>
                    </div>
                  )}
                  <span className="font-mono text-xs text-ink-3 uppercase">13 Rules · 0ms External Latency</span>
                </div>
              </div>

              {ruleToggleMutation.error && (
                <InlineRetry
                  error={ruleToggleMutation.error}
                  onRetry={ruleToggleMutation.retry}
                  onDiscard={ruleToggleMutation.discard}
                  isRetrying={ruleToggleMutation.isBusy}
                />
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Key</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Source Document</TableHead>
                    {rulesViewMode === 'draft' && isManager && <TableHead>Status</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rulesViewMode === 'draft' && draftData && ruleToggleMutation.state.length > 0
                    ? ruleToggleMutation.state
                    : activeData?.rules
                  )?.map((r) => (
                    <TableRow key={r.id || r.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RuleChip ruleKey={r.key} />
                          {r.__pending && <PendingBadge label="Saving…" />}
                        </div>
                      </TableCell>
                      <TableCell><SeverityBadge severity={r.severity} /></TableCell>
                      <TableCell className="font-mono text-xs uppercase text-ink-2">{r.category}</TableCell>
                      <TableCell>
                        <p className="font-bold text-ink text-sm">{r.title}</p>
                        <p className="text-xs text-ink-2 mt-0.5 max-w-lg leading-relaxed">{r.explanation}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink-3">
                        {r.sourceSection ? `§ ${r.sourceSection}` : 'Brand Policy'}
                      </TableCell>
                      {rulesViewMode === 'draft' && isManager && (
                        <TableCell>
                          <button
                            type="button"
                            disabled={ruleToggleMutation.isBusy}
                            onClick={() =>
                              ruleToggleMutation.mutate({ ruleKey: r.key, enabled: !r.enabled })
                            }
                            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border-2 border-ink transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus ${
                              r.enabled
                                ? 'bg-status-approved text-ink hover:bg-status-approved/80'
                                : 'bg-surface-2 text-ink-3 hover:text-ink'
                            }`}
                          >
                            {r.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}

          {/* TAB: Glossary */}
          {currentTabId === 'glossary' && (
            <motion.div
              key="glossary"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <SectionLabel number="03" title="Approved & Discouraged Terminology" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeData?.glossary?.map((t) => (
                  <Card key={t.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-ink">{t.term}</span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border-2 border-ink ${
                          t.kind === 'preferred'
                            ? 'bg-status-approved text-ink'
                            : t.kind === 'banned'
                              ? 'bg-severity-blocker text-ink'
                              : 'bg-severity-major text-ink'
                        }`}
                      >
                        {t.kind}
                      </span>
                    </div>
                    {t.preferredAlternative && (
                      <p className="text-xs text-ink">
                        Preferred: <strong className="text-accent underline">{t.preferredAlternative}</strong>
                      </p>
                    )}
                    {t.note && <p className="text-xs font-mono text-ink-3 italic">{t.note}</p>}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: Facts */}
          {currentTabId === 'facts' && (
            <motion.div
              key="facts"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Round 3 Feature A: Stale-Content Re-Audit Demo Box */}
              <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-ink">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
                      Round 3 Feature A
                    </span>
                    <h3 className="text-base font-bold text-ink uppercase tracking-tight mt-0.5">
                      Stale-Content Re-Audit Pipeline
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 border border-ink bg-paper uppercase">
                    Admin Simulation Gate
                  </span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  When a verified brand guideline or fact-sheet metric changes (e.g., F-001 savings ceiling updated from 20% to 15%), the system automatically re-evaluates all historical approved campaigns. Non-compliant copy is moved to <code className="bg-paper px-1 border border-ink font-mono font-bold text-ink">Needs re-review</code> with full diff and audit ledger events.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={reAuditLoading}
                    onClick={() => handleReAudit('update')}
                    className="font-mono"
                  >
                    {reAuditLoading ? 'Re-Auditing…' : 'Simulate Fact Update (20% → 15%) & Re-Audit'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={reAuditLoading}
                    onClick={() => handleReAudit('reset')}
                    className="font-mono"
                  >
                    Reset F-001 (18–24%)
                  </Button>
                </div>

                {reAuditResult && (
                  <div
                    className={`p-4 border-2 border-ink shadow-hard-sm space-y-2 ${
                      reAuditResult.flaggedCount && reAuditResult.flaggedCount > 0
                        ? 'bg-amber-50 text-ink'
                        : 'bg-surface-2 text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase">
                        {reAuditResult.message || `Fact ${reAuditResult.targetFactKey} Updated: ${reAuditResult.oldValue} → ${reAuditResult.newValue}`}
                      </span>
                      {reAuditResult.flaggedCount !== undefined && (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-blocker text-ink">
                          {reAuditResult.flaggedCount} Campaign Flagged
                        </span>
                      )}
                    </div>
                    {reAuditResult.flaggedItems && reAuditResult.flaggedItems.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-ink text-xs font-mono">
                        {reAuditResult.flaggedItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span>{item.title}</span>
                            <a
                              href="/dashboard?status=needs_review"
                              className="underline font-bold hover:text-ink-2"
                            >
                              View in Dashboard →
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <SectionLabel number="04" title="Approved Metrics Sheet 2025-Q3 (NUM-001 Grounding)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {activeData?.facts?.map((f) => (
                  <Card key={f.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <RuleChip ruleKey={f.key} />
                      <span className="text-[10px] font-mono font-bold text-ink-3">VERIFIED 2025</span>
                    </div>
                    <p className="font-bold text-sm text-ink">{f.statement}</p>
                    <p className="text-xs text-ink-3 font-mono pt-2 border-t border-rule">
                      Context Keywords: {f.searchVector}
                    </p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: Rule Sets & Manager Controls */}
          {currentTabId === 'rulesets' && (
            <motion.div
              key="rulesets"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
            >
              <Card className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-rule">
                  <div>
                    <SectionLabel number="05" title="Atomic Version Governance" />
                    <p className="text-xs text-ink-2 mt-1">
                      Rule changes are versioned atomically so past audit logs remain strictly reproducible.
                    </p>
                  </div>

                  {isManager && (
                    <div className="flex items-center gap-2">
                      {!draftData ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleCreateDraft}
                        >
                          Create Draft Rule Set (v{(activeData?.ruleSet?.version || 3) + 1})
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-severity-major border border-ink bg-severity-major/20 px-2.5 py-1">
                            Draft v{draftData.ruleSet?.version || 4} in progress
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setActivateConfirmOpen(true)}
                          >
                            Activate v{draftData.ruleSet?.version || 4}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-accent">Active Rule Set</span>
                    <p className="font-bold text-ink text-sm">
                      {activeData?.ruleSet?.name || 'Brightway Solar'} (v{activeData?.ruleSet?.version || 3})
                    </p>
                    <p className="text-ink-2 font-mono">{activeData?.rules?.length || 13} rules active across all checks.</p>
                  </div>

                  <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-ink-3">Draft Status</span>
                    <p className="font-bold text-ink text-sm">
                      {draftData?.ruleSet ? `Draft v${draftData.ruleSet.version}` : 'No active draft'}
                    </p>
                    <p className="text-ink-2 font-mono">
                      {draftData ? 'Staged changes pending manager activation.' : 'Create a draft to test rule adjustments.'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* YAML Import Section (Manager Only) */}
              {isManager && (
                <Card className="space-y-4">
                  <SectionLabel number="06" title="Import Rule Guidelines from YAML" />
                  <p className="text-xs text-ink-2">
                    Upload or paste rules in YAML format. The parser validates syntax and reports line-numbered errors.
                  </p>

                  {yamlError && (
                    <div
                      role="alert"
                      className="p-3 border-2 border-ink bg-severity-blocker text-ink text-xs font-mono font-medium flex items-center gap-2"
                    >
                      <OctagonX className="w-4 h-4 shrink-0" />
                      <span>{yamlError}</span>
                    </div>
                  )}

                  {yamlSuccess && (
                    <div className="p-3 border-2 border-ink bg-status-approved text-ink text-xs font-mono font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{yamlSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleImportYaml} className="space-y-4">
                    <textarea
                      value={yamlText}
                      onChange={(e) => setYamlText(e.target.value)}
                      rows={8}
                      placeholder="Paste YAML rules configuration here…"
                      className="w-full p-4 font-mono text-xs border-2 border-ink bg-surface text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus rounded-none"
                    />
                    <Button type="submit" variant="secondary" size="md">
                      Validate & Import into Draft
                    </Button>
                  </form>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>

      {/* Confirm Activation Dialog */}
      <ConfirmDialog
        open={activateConfirmOpen}
        onClose={() => setActivateConfirmOpen(false)}
        onConfirm={handleActivateDraft}
        title={`Publish Rule Set v${draftData?.ruleSet?.version || 4}`}
        description="Activating this draft makes it the active rule set for all subsequent compliance checks. Existing approved items will remain pinned to their historical version."
        confirmLabel={`Publish v${draftData?.ruleSet?.version || 4}`}
      />
    </div>
  );
}

export default function GuidelinesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper flex items-center justify-center text-ink-2 font-mono text-xs">
          Loading guidelines…
        </div>
      }
    >
      <GuidelinesContent />
    </Suspense>
  );
}
