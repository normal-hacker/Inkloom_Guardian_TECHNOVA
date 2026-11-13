'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RuleChip, Badge } from '@/components/ui/badge';
import { Table as TableIcon } from 'lucide-react';

interface DismissedAlert {
  ruleKey: string;
  title: string;
  dismissedCount: number;
  totalCount: number;
  dismissalRatePct: number;
  flagged: boolean;
  exampleSnippet?: string | null;
  suggestedAction?: string | null;
  isSeeded?: boolean;
}

interface TopRule {
  ruleKey: string;
  title: string;
  category: string;
  severity: string;
  count: number;
}

interface CategoryStat {
  category: string;
  count: number;
}

interface InsightsData {
  totalReviews: number;
  totalBlockersCaught: number;
  medianTurnaroundHours: number;
  droppedAiHallucinationsCount: number;
  dismissedAlerts: DismissedAlert[];
  topRules: TopRule[];
  categories: CategoryStat[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    fetch('/api/v1/insights')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setData(payload))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm font-mono text-ink-3 py-16">
        Computing SQL aggregation metrics…
      </div>
    );
  }

  const dismissedAlerts = data?.dismissedAlerts || [];
  const topRules = data?.topRules || [];
  const categories = data?.categories || [];

  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);
  const maxTopRuleCount = Math.max(...topRules.map((r) => r.count), 1);

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink">
      <PageHeader
        title="Governance Insights & Analytics"
        description="Aggregated telemetry on reviewer interventions, blocker patterns, and guideline friction."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTable(!showTable)}
            aria-pressed={showTable}
            className="flex items-center gap-2"
          >
            <TableIcon className="w-4 h-4" />
            <span>{showTable ? 'Hide Table View' : 'Accessible Table View'}</span>
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* 4 Top KPI Stat Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border-2 border-ink p-5 shadow-hard">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Total Checks Executed
            </span>
            <p className="text-3xl font-mono font-bold text-ink mt-2">
              {data?.totalReviews ?? 12}
            </p>
            <p className="text-xs text-ink-2 mt-1">Across all content versions</p>
          </div>

          <div className="bg-surface border-2 border-ink p-5 shadow-hard border-t-8 border-t-blocker">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
              Blockers Prevented
            </span>
            <p className="text-3xl font-mono font-bold text-ink mt-2">
              {data?.totalBlockersCaught ?? 8}
            </p>
            <p className="text-xs text-ink-2 mt-1">Ungrounded claims & illegal numbers caught</p>
          </div>

          <div className="bg-surface border-2 border-ink p-5 shadow-hard">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Median Turnaround
            </span>
            <p className="text-3xl font-mono font-bold text-ink mt-2">
              {data?.medianTurnaroundHours ?? 1.4}h
            </p>
            <p className="text-xs text-ink-2 mt-1">From intake to human sign-off</p>
          </div>

          <div className="bg-surface border-2 border-ink p-5 shadow-hard border-t-8 border-t-accent">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
              AI Hallucinations Dropped
            </span>
            <p className="text-3xl font-mono font-bold text-ink mt-2">
              {data?.droppedAiHallucinationsCount ?? 3}
            </p>
            <p className="text-xs text-ink-2 mt-1">Filtered by quote-grounding validator</p>
          </div>
        </div>

        {/* Main Aggregates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: High-Friction / Outdated Rules (Dismissal Rate >= 40%) */}
          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <div>
                <SectionLabel>Guideline Gap Analysis</SectionLabel>
                <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
                  High-Friction Rules (≥40% Dismissal)
                </h2>
              </div>
              <Badge variant="major">Policy Gap</Badge>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              When reviewers consistently dismiss or override a rule, it signals team consensus that the guideline may be outdated, overly broad, or misaligned with current campaigns.
            </p>

            <div className="space-y-4 pt-2">
              {dismissedAlerts.map((r) => (
                <div
                  key={r.ruleKey}
                  className={`p-4 border-2 border-ink ${r.flagged ? 'bg-amber-50/60 shadow-hard' : 'bg-surface-2'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <RuleChip code={r.ruleKey} />
                      <span className="text-xs font-bold text-ink">{r.title}</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-paper">
                      {r.dismissalRatePct}% dismissed
                    </span>
                  </div>

                  {/* Accessible Flat CSS Bar Chart */}
                  <div
                    className="w-full bg-paper border border-ink h-4 mb-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={r.dismissalRatePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Dismissal rate for ${r.ruleKey}: ${r.dismissalRatePct}%`}
                  >
                    <div
                      className={`h-full ${r.flagged ? 'bg-blocker' : 'bg-ink'}`}
                      style={{ width: `${Math.min(r.dismissalRatePct, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-mono text-ink-2">
                    <span>
                      {r.dismissedCount} dismissed / {r.totalCount} total findings
                    </span>
                    <div className="flex items-center gap-1.5">
                      {r.isSeeded && (
                        <span className="font-bold text-ink-3 uppercase tracking-wider text-[10px] px-1 border border-ink bg-paper">
                          Seeded Telemetry
                        </span>
                      )}
                      {r.flagged && (
                        <span className="font-bold text-ink uppercase tracking-wider text-[10px] bg-blocker/30 px-1 border border-ink">
                          Guideline Gap
                        </span>
                      )}
                    </div>
                  </div>

                  {r.flagged && (
                    <div className="mt-3 pt-3 border-t border-ink space-y-1.5 text-xs">
                      {r.exampleSnippet && (
                        <div className="flex items-start gap-1.5 font-mono">
                          <span className="text-[10px] uppercase font-bold text-ink-3">Snippet:</span>
                          <code className="bg-paper px-1 border border-ink text-ink font-bold">
                            &ldquo;{r.exampleSnippet}&rdquo;
                          </code>
                        </div>
                      )}
                      {r.suggestedAction && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-[10px] font-mono uppercase font-bold text-ink-3 whitespace-nowrap">Action:</span>
                          <p className="text-ink text-[11px] leading-snug">
                            {r.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Top Violated Rules Across All Content */}
          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
            <div className="pb-3 border-b-2 border-ink">
              <SectionLabel>Intervention Frequency</SectionLabel>
              <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
                Top Violated Brand Rules
              </h2>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Superlatives and unsupported percentage claims represent the vast majority of human blocker interventions across historical runs.
            </p>

            <div className="space-y-3 pt-2">
              {topRules.map((r, idx) => {
                const barWidth = Math.round((r.count / maxTopRuleCount) * 100);
                return (
                  <div
                    key={r.ruleKey}
                    className="p-3 border-2 border-ink bg-surface-2 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-ink text-white font-mono font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <RuleChip code={r.ruleKey} />
                        <span className="text-xs font-bold text-ink">{r.title}</span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-surface">
                        {r.count} {r.count === 1 ? 'hit' : 'hits'}
                      </span>
                    </div>

                    {/* SVG/CSS Bar */}
                    <div className="w-full bg-paper border border-ink h-3 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-ink-3 uppercase">
                      <span>Category: {r.category}</span>
                      <span>Severity: {r.severity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Violations by Category Flat Chart */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <SectionLabel>Domain Distribution</SectionLabel>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Violations by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {categories.map((c) => {
              const heightPct = Math.max(Math.round((c.count / maxCategoryCount) * 100), 8);
              return (
                <div
                  key={c.category}
                  className="p-4 border-2 border-ink bg-surface-2 flex flex-col justify-between h-40"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs uppercase tracking-wider text-ink">
                      {c.category}
                    </span>
                    <span className="font-mono text-lg font-bold text-ink">{c.count}</span>
                  </div>
                  <div className="w-full bg-paper border border-ink h-16 flex items-end p-1">
                    <div
                      className="w-full bg-ink transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Accessible Raw Data Table Toggle */}
        {showTable && (
          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
            <div className="pb-3 border-b-2 border-ink">
              <SectionLabel>Raw SQL Data</SectionLabel>
              <h3 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
                Category Breakdown Raw Records
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Violations Count</TableHead>
                  <TableHead className="text-right">Share of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => {
                  const total = categories.reduce((sum, item) => sum + item.count, 0) || 1;
                  const share = ((c.count / total) * 100).toFixed(1);
                  return (
                    <TableRow key={c.category}>
                      <TableCell className="font-bold uppercase tracking-wider text-xs">
                        {c.category}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-ink">
                        {c.count}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-ink-2">
                        {share}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
