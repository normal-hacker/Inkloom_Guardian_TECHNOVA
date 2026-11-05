'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, Clock, FileCheck } from 'lucide-react';

export default function DemoReportPage() {
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

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Verified Governance Sample Report
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif mt-3">
            Residential Solar Campaign Copy (Report #BRW-2026-081)
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            Content Hash: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold">Lifecycle State</span>
              <p className="text-lg font-extrabold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Approved by Human Reviewer</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-bold">Governance Rule Pack</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Brightway Solar v3 (Active)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Author</span>
              <p className="font-bold text-slate-800">Asha Patel (Creator)</p>
            </div>
            <div>
              <span className="text-slate-400">Reviewed By</span>
              <p className="font-bold text-slate-800">Priya Sharma (Reviewer)</p>
            </div>
            <div>
              <span className="text-slate-400">Blockers Prevented</span>
              <p className="font-bold text-red-600">2 Blockers Resolved</p>
            </div>
            <div>
              <span className="text-slate-400">Turnaround</span>
              <p className="font-bold text-slate-800">55 minutes</p>
            </div>
          </div>
        </div>

        {/* Text Progression (v1 → v2) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Evolution from Draft to Approved Copy
          </h2>

          <div className="space-y-3 text-xs">
            {/* Version 1 */}
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-red-950">
                <span>Version 1 (Initial Intake)</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-200 text-red-900">
                  2 Blockers Flagged
                </span>
              </div>
              <p className="font-mono text-slate-700 leading-relaxed">
                &ldquo;Our panels are the <mark className="bg-red-200 text-red-950 px-1 py-0.5 rounded">best</mark> on the market and <mark className="bg-red-200 text-red-950 px-1 py-0.5 rounded">guarantee 40% savings</mark>!&rdquo;
              </p>
              <div className="text-[11px] text-red-800 space-y-1">
                <p>• <strong>CLAIM-001 (Blocker):</strong> Superlative &ldquo;best&rdquo; cited against Brand Voice Guide § 5.2.</p>
                <p>• <strong>NUM-001 (Blocker):</strong> &ldquo;40%&rdquo; exceeds approved range of 20% in Facts Sheet 2025-Q3.</p>
              </div>
            </div>

            {/* Version 2 */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>Version 2 (Approved by Priya Sharma)</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  0 Open Blockers · Signed
                </span>
              </div>
              <p className="font-mono text-slate-700 leading-relaxed">
                &ldquo;Switch to clean energy with Brightway Solar. Enjoy <mark className="bg-emerald-200 text-emerald-950 px-1 py-0.5 rounded">20% savings</mark> on your bill and a 25-year panel warranty.&rdquo;
              </p>
              <p className="text-[11px] text-emerald-800">
                Approved note: <em>&ldquo;Verified against approved fact sheet and voice guidelines.&rdquo;</em>
              </p>
            </div>
          </div>
        </div>

        {/* Immutable Audit Log Entry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Immutable Audit Trail Seal
          </h2>
          <div className="font-mono text-xs bg-slate-900 text-slate-200 p-4 rounded-xl space-y-1.5 overflow-x-auto">
            <p><span className="text-slate-400">ACTION:</span> content.approve</p>
            <p><span className="text-slate-400">ACTOR:</span> priya@brightway.example (Reviewer)</p>
            <p><span className="text-slate-400">RULE_SET_ID:</span> 30000000-0000-0000-0000-000000000003</p>
            <p><span className="text-slate-400">CONTENT_HASH:</span> ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</p>
            <p><span className="text-slate-400">HUMAN_GATE_STATUS:</span> PASSED_BLOCKER_CHECK</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Inkloom Guardian · Public Proof of Execution
      </footer>
    </div>
  );
}
