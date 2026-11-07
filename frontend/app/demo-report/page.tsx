'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { SeverityBadge, StatusPill, RuleChip } from '@/components/ui/badge';

export default function DemoReportPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      {/* Public Top Header */}
      <header className="border-b-2 border-ink bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-ink hover:underline focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-mono font-bold text-sm tracking-tight">INKLOOM GUARDIAN</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full space-y-8">
        {/* Verification Band */}
        <div className="p-4 bg-surface border-2 border-ink shadow-hard flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusPill status="approved" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
              Verified Governance Sample Report · Public Proof Artifact
            </span>
          </div>
          <span className="text-xs font-mono text-ink-3">
            Report ID: BRW-2026-081
          </span>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-ink uppercase">
            Residential Solar Campaign Copy
          </h1>
          <p className="text-xs font-mono text-ink-2 break-all">
            Content SHA-256: <span className="font-bold text-ink">ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</span>
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-ink gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
                Final Review Status
              </span>
              <p className="text-xl font-mono font-bold text-ink flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-5 h-5 text-ink" />
                <span>Approved by Human Reviewer</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
                Active Rule Pack
              </span>
              <p className="text-sm font-mono font-bold text-ink mt-1">
                Brightway Solar v3 (Active Policy)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-3 text-[11px] uppercase block">Author</span>
              <p className="font-bold text-ink mt-1">Asha Patel (Creator)</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-3 text-[11px] uppercase block">Reviewer</span>
              <p className="font-bold text-ink mt-1">Priya Sharma (Reviewer)</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-3 text-[11px] uppercase block">Blockers Handled</span>
              <p className="font-bold text-ink mt-1">2 Blockers Resolved</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-3 text-[11px] uppercase block">Turnaround</span>
              <p className="font-bold text-ink mt-1">55 Minutes</p>
            </div>
          </div>
        </div>

        {/* Copy Evolution (v1 vs v2) */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-6">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Version Progression
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Evolution from Draft to Compliant Copy
            </h2>
          </div>

          <div className="space-y-6">
            {/* Version 1 */}
            <div className="border-2 border-ink bg-surface-2 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rule">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Version 1 (Initial Intake Draft)
                </span>
                <SeverityBadge severity="blocker" count={2} />
              </div>

              <div className="p-4 bg-paper border border-ink font-mono text-xs leading-relaxed text-ink">
                &ldquo;Our panels are the{' '}
                <mark className="bg-blocker text-ink font-bold px-1 border border-ink">
                  best
                </mark>{' '}
                on the market and{' '}
                <mark className="bg-blocker text-ink font-bold px-1 border border-ink">
                  guarantee 40% savings
                </mark>
                !&rdquo;
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2 p-2 border border-ink bg-paper">
                  <RuleChip code="CLAIM-001" />
                  <div>
                    <span className="font-bold text-ink">CLAIM-001 (Blocker):</span> Superlative &ldquo;best&rdquo; cited against Brand Voice Guide § 5.2.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 border border-ink bg-paper">
                  <RuleChip code="NUM-001" />
                  <div>
                    <span className="font-bold text-ink">NUM-001 (Blocker):</span> &ldquo;40%&rdquo; exceeds approved 20% benchmark in Facts Sheet 2025-Q3.
                  </div>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div className="border-2 border-ink bg-paper p-5 space-y-4 shadow-hard">
              <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Version 2 (Approved & Signed by Priya Sharma)
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-approved text-ink uppercase">
                  0 Open Blockers · Cleared
                </span>
              </div>

              <div className="p-4 bg-surface border border-ink font-mono text-xs leading-relaxed text-ink">
                &ldquo;Switch to clean energy with Brightway Solar. Enjoy{' '}
                <mark className="bg-approved text-ink font-bold px-1 border border-ink">
                  20% savings
                </mark>{' '}
                on your electric bill and a 25-year panel warranty.&rdquo;
              </div>

              <div className="p-3 border border-ink bg-surface-2 text-xs font-mono text-ink">
                <span className="font-bold uppercase tracking-wider text-ink-3 block text-[10px]">
                  Reviewer Decision Note:
                </span>
                &ldquo;Updated claim to match approved 2025-Q3 residential benchmark. Superlative replaced with factual statement.&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Seal */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
              Cryptographic Audit Seal
            </span>
            <Lock className="w-4 h-4 text-ink" />
          </div>
          <div className="font-mono text-xs bg-ink text-white p-4 space-y-1.5 overflow-x-auto leading-relaxed">
            <p><span className="text-ink-3">ACTION:</span> content.approve</p>
            <p><span className="text-ink-3">ACTOR:</span> priya@brightway.example (Role: reviewer)</p>
            <p><span className="text-ink-3">RULE_SET_ID:</span> 30000000-0000-0000-0000-000000000003</p>
            <p><span className="text-ink-3">CONTENT_HASH:</span> ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</p>
            <p><span className="text-ink-3">HUMAN_GATE_STATUS:</span> PASSED_ZERO_OPEN_BLOCKERS</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface py-6 text-center text-xs font-mono text-ink-3">
        INKLOOM GUARDIAN · PUBLIC PROOF OF EXECUTION · GOVERNANCE REPORT
      </footer>
    </div>
  );
}
