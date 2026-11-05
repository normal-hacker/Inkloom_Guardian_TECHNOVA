'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Download } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionFilter, setActionFilter] = useState('');

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
    return log.action.toLowerCase().includes(actionFilter.toLowerCase());
  });

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Compliance Audit Trail"
        description="Who decided what, on which exact version"
        chips={
          isManager && (
            <a
              href="/api/v1/audit/export.csv"
              download="audit_log_export.csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Total Records:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {logs.length}
            </span>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action (e.g. decision, submit)…"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading audit trail…</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-400">No audit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Content Hash</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">#{log.id}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.actorEmail ? (
                          <div>
                            <span className="font-semibold">{log.actorEmail}</span>
                            {log.actorRole && (
                              <span className="ml-1 text-[10px] uppercase font-bold text-slate-400">
                                ({log.actorRole})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {log.entityType ? `${log.entityType}:${log.entityId ? log.entityId.slice(0, 8) + '…' : ''}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {log.contentHash ? `${log.contentHash.slice(0, 12)}…` : '—'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate font-mono">
                        {log.detail ? JSON.stringify(log.detail) : '{}'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
