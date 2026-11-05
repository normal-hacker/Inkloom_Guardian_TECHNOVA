'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/../components/Navbar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Plus, Search, Filter, AlertTriangle, ArrowRight, Clock, FileText } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  contentType: string;
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'checked';
  ownerId: string;
  ownerName?: string;
  ownerRole?: string;
  currentVersionNo?: number;
  blockersCount?: number;
  updatedAt: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/v1/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items) {
          setItems(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Approved</span>;
      case 'in_review':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">In Review</span>;
      case 'changes_requested':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">Changes Requested</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'checked':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">Checked</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <PageHeader
        title="Content Dashboard"
        description="What needs your attention and the status of your content"
        actions={
          <Link
            href="/content/new"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Content</span>
          </Link>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'in_review', label: 'In Review' },
              { id: 'draft', label: 'Draft' },
              { id: 'changes_requested', label: 'Changes Requested' },
              { id: 'approved', label: 'Approved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content by title…"
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading content items…</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No content items found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or status filter.'
                  : 'Start by submitting a marketing draft for brand checks.'}
              </p>
              <Link
                href="/content/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Content</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Title & Type</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issues</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-4">
                        <Link
                          href={`/content/${item.id}`}
                          className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors block"
                        >
                          {item.title}
                        </Link>
                        <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.contentType}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600">
                        v{item.currentVersionNo || 1}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-4">
                        {item.blockersCount && item.blockersCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{item.blockersCount} Blocker</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <p className="font-semibold text-slate-800">{item.ownerName || 'Demo Creator'}</p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/content/${item.id}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-900 text-xs px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
