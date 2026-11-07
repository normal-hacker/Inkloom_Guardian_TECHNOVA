'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, ArrowUpRight } from 'lucide-react';
import type { ContentItem } from '@/lib/domain/types';

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

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
