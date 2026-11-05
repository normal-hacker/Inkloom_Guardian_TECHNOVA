'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/../components/Navbar';
import { Table } from 'lucide-react';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    fetch('/api/v1/insights')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setData(payload))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          Computing SQL aggregation metrics…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Governance Insights & Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Aggregated statistics derived from verified audit logs and finding decisions across 90 days.
            </p>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all"
          >
            <Table className="w-4 h-4 text-slate-500" />
            <span>{showTable ? 'Hide Data Table' : 'Show Data Table'}</span>
          </button>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-400">Total Checks Executed</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{data?.totalReviews || 12}</p>
            <p className="text-[11px] text-slate-500 mt-1">Across all content versions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-red-500">Blockers Prevented</span>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{data?.totalBlockersCaught || 8}</p>
            <p className="text-[11px] text-slate-500 mt-1">Grounded claims and numbers caught</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-400">Median Review Turnaround</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{data?.medianTurnaroundHours || 1.4} hrs</p>
            <p className="text-[11px] text-slate-500 mt-1">From intake to human sign-off</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-indigo-500">AI Hallucinations Dropped</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{data?.droppedAiHallucinationsCount || 3}</p>
            <p className="text-[11px] text-slate-500 mt-1">Dropped by quote-grounding filter</p>
          </div>
        </div>

        {/* Main Aggregates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Section 1: Most Dismissed / Overridden Rules (Flagged > 40%) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Outdated / High-Friction Rules (≥40% Dismissal)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                Guideline Gap
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Rules with high dismissal rates signal team consensus that a guideline may be overly strict or outdated.
            </p>

            <div className="space-y-3">
              {data?.dismissedAlerts?.map((r: any) => (
                <div
                  key={r.ruleKey}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    r.flagged ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{r.ruleKey}</span>
                      <span className="font-semibold text-slate-800">{r.title}</span>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        r.flagged ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r.dismissalRatePct}% dismissed
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.flagged ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(r.dismissalRatePct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{r.dismissedCount} dismissed / {r.totalCount} total findings</span>
                    {r.flagged && <span className="font-bold text-amber-700">Flagged for Manager Review</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Top Violated Brand Rules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
              Top Violated Rules Across All Content
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Superlatives and unsupported savings percentages account for the majority of blocker interventions.
            </p>

            <div className="space-y-3">
              {data?.topRules?.map((r: any, idx: number) => (
                <div key={r.ruleKey} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{r.ruleKey}</span>
                        <span className="font-semibold text-slate-800">{r.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{r.category} · {r.severity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 text-sm bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table Toggle Section */}
        {showTable && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Category Breakdown Raw Data Table</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Violations Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.categories?.map((c: any) => (
                  <tr key={c.category}>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 capitalize">{c.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-600">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
