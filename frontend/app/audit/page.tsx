'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState, Skeleton } from '@/components/ui/states';
import { Download, ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface AuditLogEntry {
  id: number;
  timestamp: string;
  action: string;
  actorEmail?: string | null;
  actorRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  contentHash?: string | null;
  detail?: any;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/v1/audit?limit=100')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items) {
          setLogs(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const isManager = currentUser?.role === 'manager';

  const filteredLogs = logs.filter((log) => {
    if (!actionFilter) return true;
    const q = actionFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
      (log.contentHash && log.contentHash.toLowerCase().includes(q))
    );
  });

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink">
      <PageHeader
        title="Compliance Audit Trail"
        description="Append-only cryptographic ledger of human reviews, override rationales, and content hashes."
        actions={
          isManager && (
            <a
              href="/api/v1/audit/export.csv"
              download="audit_log_export.csv"
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-ink shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all focus:outline-none"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Filter Toolbar */}
        <div className="bg-surface border-2 border-ink p-4 shadow-hard flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Total Records:
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-ink bg-paper">
              {logs.length}
            </span>
          </div>

          <div className="w-full sm:w-80">
            <Input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action, actor, or hash…"
              aria-label="Filter audit log records"
              className="w-full font-mono text-xs"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-surface border-2 border-ink shadow-hard overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title="No audit records match your query"
                description="Try clearing your filter or perform a review action in the workspace."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>Content Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow
                          onClick={() => toggleExpand(log.id)}
                          className="cursor-pointer hover:bg-surface-2 transition-colors"
                        >
                          <TableCell className="w-12 text-center text-ink-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 mx-auto" />
                            ) : (
                              <ChevronRight className="w-4 h-4 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-ink">
                            #{log.id}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-ink-2 whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 border border-ink bg-paper">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.actorEmail ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-ink">{log.actorEmail}</span>
                                {log.actorRole && (
                                  <Badge variant="neutral" className="text-[10px]">
                                    {log.actorRole}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-ink-3">system</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-ink-2">
                            {log.entityType ? (
                              <span>
                                {log.entityType}:
                                <span className="text-ink font-bold">
                                  {log.entityId ? log.entityId.slice(0, 8) + '…' : ''}
                                </span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-ink-2">
                            {log.contentHash ? (
                              <span title={log.contentHash}>
                                {log.contentHash.slice(0, 12)}…
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="bg-surface-2">
                            <TableCell colSpan={7} className="p-4">
                              <div className="border-2 border-ink bg-paper p-4 space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-rule">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                                    Audit Record Payload Details (Record #{log.id})
                                  </span>
                                  {log.contentHash && (
                                    <span className="font-mono text-[11px] text-ink-3">
                                      Full SHA-256: {log.contentHash}
                                    </span>
                                  )}
                                </div>
                                <pre className="font-mono text-xs text-ink overflow-x-auto whitespace-pre-wrap leading-relaxed p-2 bg-surface-2 border border-rule">
                                  {JSON.stringify(log.detail || {}, null, 2)}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
