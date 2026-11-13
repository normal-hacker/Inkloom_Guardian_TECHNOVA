'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { Plus, Search, ArrowUpRight } from 'lucide-react';

import { ContentStatus } from '@/lib/domain/types';

interface DashboardContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  contentType: string;
  ownerId?: string;
  ownerName?: string;
  currentVersionNo?: number;
  blockersCount?: number;
  warningsCount?: number;
  updatedAt?: string;
  createdAt?: string;
  currentVersionId?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<DashboardContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [reAuditing, setReAuditing] = React.useState(false);
  const [reAuditMessage, setReAuditMessage] = React.useState<string | null>(null);

  const triggerReAudit = async (ceiling: number) => {
    setReAuditing(true);
    setReAuditMessage(null);
    try {
      const res = await fetch('/api/v1/guidelines/re-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', factKey: 'F-001', newValue: ceiling }),
      });
      const data = await res.json();
      if (res.ok) {
        setReAuditMessage(`Re-audit complete: ${data.flaggedCount || 0} item(s) flagged as needs re-review due to F-001 savings ceiling updated to ${ceiling}%.`);
        loadData();
      } else {
        setReAuditMessage(data.error?.message || 'Re-audit failed');
      }
    } catch (err: any) {
      setReAuditMessage(err.message || 'Network error');
    } finally {
      setReAuditing(false);
    }
  };

  const resetReAudit = async () => {
    setReAuditing(true);
    setReAuditMessage(null);
    try {
      const res = await fetch('/api/v1/guidelines/re-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok) {
        setReAuditMessage('Reset fact F-001 back to benchmark (18-24%).');
        loadData();
      }
    } catch (err: any) {
      setReAuditMessage(err.message);
    } finally {
      setReAuditing(false);
    }
  };


  const loadData = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/v1/content')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.items) {
          setItems(data.items);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load content submissions.');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute stat metrics
  const needActionCount = items.filter(
    (i) => i.status === 'in_review' || i.status === 'changes_requested' || i.status === 'needs_review'
  ).length;
  const inReviewCount = items.filter((i) => i.status === 'in_review' || i.status === 'needs_review').length;
  const openBlockersCount = items.reduce(
    (acc, curr) => acc + (curr.blockersCount || 0),
    0
  );
  const approvedCount = items.filter((i) => i.status === 'approved').length;

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink min-h-full pb-16">
      <PageHeader
        title="Dashboard"
        description="Active brand governance content submissions and approval status."
        actions={
          <Link href="/content/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              <span>New content</span>
            </Button>
          </Link>
        }
      />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-8 space-y-8 flex-1">
        
        {/* Stale Approvals Section (Phase 2.1) */}
        {items.filter((i) => i.status === 'needs_review').length > 0 && (
          <section className="border-2 border-severity-blocker bg-paper p-5 shadow-hard space-y-4" data-testid="stale-approvals-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 font-mono text-xs font-bold uppercase bg-severity-blocker text-surface">
                    Stale Approvals Detected
                  </span>
                  <span className="font-mono text-xs text-ink-2">Action Required</span>
                </div>
                <h3 className="font-mono text-base font-bold uppercase mt-1 text-ink">
                  Items Requiring Re-Review Due To Rule/Fact Change
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerReAudit(15)}
                  disabled={reAuditing}
                  className="px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-ink bg-surface hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                  {reAuditing ? 'Auditing…' : 'Simulate F-001 Drop to 15%'}
                </button>
                <button
                  type="button"
                  onClick={resetReAudit}
                  disabled={reAuditing}
                  className="px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-ink bg-paper hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                  Reset Benchmark
                </button>
              </div>
            </div>

            {reAuditMessage && (
              <div className="p-3 border-2 border-ink bg-surface text-xs font-mono">
                {reAuditMessage}
              </div>
            )}

            <div className="space-y-3">
              {items
                .filter((i) => i.status === 'needs_review')
                .map((staleItem) => (
                  <div
                    key={staleItem.id}
                    className="p-4 border-2 border-ink bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{staleItem.title}</span>
                        <span className="px-1.5 py-0.5 border border-ink bg-amber-100 text-[10px] font-mono font-bold uppercase">
                          Status: Needs Re-Review
                        </span>
                      </div>
                      <p className="font-mono text-xs text-ink-2">
                        Before/After Diff: Approved at 20% savings fact ceiling → Updated fact ceiling violated (new blocker flagged).
                      </p>
                      <p className="text-[11px] text-severity-blocker font-mono font-bold">
                        ⚠️ Status unchanged until human reviewer acts. Human decision required to accept or override.
                      </p>
                    </div>
                    <Link
                      href={`/content/${staleItem.id}`}
                      className="px-4 py-2 border-2 border-ink bg-ink text-surface font-mono text-xs font-bold uppercase hover:bg-ink-2 shrink-0 inline-flex items-center justify-center"
                    >
                      Inspect Diff & Re-review →
                    </Link>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Top 4 Stat Blocks */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Need your action', count: needActionCount, highlight: needActionCount > 0 },
            { label: 'In review', count: inReviewCount },
            { label: 'Open blockers', count: openBlockersCount, alert: openBlockersCount > 0 },
            { label: 'Approved', count: approvedCount },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`p-5 md:p-6 border-2 border-ink bg-surface shadow-hard flex flex-col justify-between gap-3 ${
                stat.alert ? 'border-severity-blocker bg-severity-blocker/10' : ''
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-2">
                {stat.label}
              </span>
              <p
                className={`font-mono text-4xl sm:text-5xl font-bold ${
                  stat.alert ? 'text-severity-blocker' : stat.highlight ? 'text-accent' : 'text-ink'
                }`}
              >
                {loading ? '—' : stat.count}
              </p>
            </div>
          ))}
        </section>

        {/* Filter and Search Bar */}
        <div className="p-4 border-2 border-ink bg-surface shadow-hard flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'needs_review', label: 'Needs Re-Review' },
              { id: 'in_review', label: 'In Review' },
              { id: 'draft', label: 'Draft' },
              { id: 'changes_requested', label: 'Changes Requested' },
              { id: 'approved', label: 'Approved' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 transition-all ${
                  statusFilter === tab.id
                    ? 'border-ink bg-ink text-surface shadow-hard-sm'
                    : 'border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content by title…"
              className="w-full min-h-11 pl-9 pr-3.5 py-2 border-2 border-ink bg-surface text-ink text-xs font-sans focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            />
          </div>
        </div>

        {/* Main Content Table / States */}
        {loading ? (
          <div className="border-2 border-ink bg-surface p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Submit your first content draft to run policy and compliance checks."
            actionLabel="New content"
            onAction={() => router.push('/content/new')}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Blockers</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => router.push(`/content/${item.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-bold text-ink max-w-xs truncate">
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={item.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    v{item.currentVersionNo || 1}
                  </TableCell>
                  <TableCell className="text-ink-2 text-xs">
                    {item.ownerName || 'Asha'}
                  </TableCell>
                  <TableCell>
                    {item.blockersCount && item.blockersCount > 0 ? (
                      <span className="font-mono text-xs font-bold text-severity-blocker">
                        {item.blockersCount} open
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-ink-3">0</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-3">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Today'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-accent hover:underline">
                      <span>Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
