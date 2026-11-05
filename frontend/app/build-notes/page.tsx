'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, Layers, Sparkles } from 'lucide-react';

export default function BuildNotesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">Inkloom Guardian</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Hackathon Round 2 Submission
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif mt-3">
            Build Notes & Architectural Decisions
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Detailed breakdown of what was built, our deliberate architectural consolidations, and our forward roadmap.
          </p>
        </div>

        {/* Section 1: Completed Features in Round 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Delivered Features (Round 2 &ldquo;The Build&rdquo;)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">1. Deterministic Rule Engine</p>
              <p className="text-slate-500 mt-0.5">13 pure TypeScript rules running in &lt;2ms with exact UTF-16 offset mapping.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">2. NUM-001 Proximity Matcher</p>
              <p className="text-slate-500 mt-0.5">Context window matching numbers against approved research metrics.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">3. Human Governance Blocker Gate</p>
              <p className="text-slate-500 mt-0.5">Hard prevention of approval when blocker findings are open.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">4. Immutable Evidence & Triggers</p>
              <p className="text-slate-500 mt-0.5">PostgreSQL append-only triggers preventing tampering of review runs and approvals.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">5. Multi-Format Intake (.docx, .pdf)</p>
              <p className="text-slate-500 mt-0.5">Text layer extraction, magic byte validation, and 10MB protection.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">6. Compliance CSV Export & Insights</p>
              <p className="text-slate-500 mt-0.5">Manager-only audit log download and real SQL aggregations.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Deviations Ledger from Round 1 Plan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Deliberate Deviations from Round 1 Plan</span>
          </h2>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-900">Stack Consolidation:</strong> We unified the architecture into Next.js 15 App Router route handlers with Drizzle ORM rather than deploying a standalone Python FastAPI service. This eliminated cross-service network hops, serialization overhead, and deployment fragility while maintaining full type-safety.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-900">Pure TypeScript Rule Engine:</strong> Writing the 13 seed rules in pure TypeScript allowed the entire engine to run both on the server and in the browser (see our Engine Self-Test page), delivering sub-2ms evaluation without cold starts.
            </div>
          </div>
        </div>

        {/* Section 3: The Three Round 3 Improvements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>The Three Round 3 Improvements (Future Roadmap)</span>
          </h2>
          <p className="text-xs text-slate-500">
            As specified in the hackathon rules, these improvements are planned for Round 3 and intentionally not built today:
          </p>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
              <h3 className="font-bold text-slate-900">1. Stale-Content Re-Audit Pipeline</h3>
              <p className="text-slate-600 leading-relaxed">
                Automatically scans all historical approved content whenever a new brand rule set or fact sheet is activated, identifying copy that has become non-compliant over time.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
              <h3 className="font-bold text-slate-900">2. Guideline-Gap Detector</h3>
              <p className="text-slate-600 leading-relaxed">
                Uses aggregated finding override and dismissal telemetry to highlight blind spots in brand guidelines where creators and reviewers repeatedly diverge from current policy.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
              <h3 className="font-bold text-slate-900">3. Multimodal Visual Compliance Check</h3>
              <p className="text-slate-600 leading-relaxed">
                Expands beyond alt text to analyze layout balance, contrast ratios, and correct logo clearspace on uploaded creative banners.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Inkloom Guardian · Round 2 Engineering Report
      </footer>
    </div>
  );
}
