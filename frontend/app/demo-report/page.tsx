'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, Lock, Check } from 'lucide-react';
import { SeverityBadge, StatusPill, RuleChip } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DemoReportPage() {
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'matched' | 'mismatch'>('idle');
  const [computedHash, setComputedHash] = useState<string | null>(null);

  const approvedText =
    'Switch to clean energy with Brightway Solar. Enjoy 20% savings on your bill and a 25-year panel warranty.';

  const handleVerify = async () => {
    try {
      const msgBuffer = new TextEncoder().encode(approvedText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);
      if (hashHex === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
        setVerifyStatus('matched');
      } else {
        setVerifyStatus('mismatch');
      }
    } catch {
      setVerifyStatus('mismatch');
    }
  };

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
            <div className="w-8 h-8 bg-ink text-surface flex items-center justify-center font-bold border-2 border-ink shadow-hard-sm">
              <ShieldCheck className="w-5 h-5 text-surface" />
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
              <span className="text-[10px] text-ink-3 block mt-0.5">10:05 UTC → 11:00 UTC</span>
            </div>
          </div>

          {/* Timestamps breakdown */}
          <div className="p-3.5 border-2 border-ink bg-surface text-xs font-mono space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2 text-ink-2">
              <span><strong>Intake & Check Start:</strong> 2026-02-01 10:05:00 UTC</span>
              <span><strong>Final Human Approval:</strong> 2026-02-01 11:00:00 UTC</span>
              <span className="px-2 py-0.5 bg-surface-2 border border-ink text-ink font-bold">Elapsed: Exactly 55m 00s</span>
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
                <mark className="bg-severity-blocker text-ink font-bold px-1 border border-ink">
                  best
                </mark>{' '}
                on the market and{' '}
                <mark className="bg-severity-blocker text-ink font-bold px-1 border border-ink">
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
                    <span className="font-bold text-ink">NUM-001 (Blocker):</span> &ldquo;40%&rdquo; exceeds approved benchmark in Fact Sheet 2025-Q3 (Fact F-001).
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
                <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-status-approved text-ink uppercase">
                  0 Open Blockers · Cleared
                </span>
              </div>

              <div className="p-4 bg-surface border border-ink font-mono text-xs leading-relaxed text-ink">
                &ldquo;Switch to clean energy with Brightway Solar. Enjoy{' '}
                <mark className="bg-status-approved text-ink font-bold px-1 border border-ink">
                  20% savings
                </mark>{' '}
                on your bill and a{' '}
                <mark className="bg-status-approved text-ink font-bold px-1 border border-ink">
                  25-year panel warranty
                </mark>
                .&rdquo;
              </div>

              {/* Explicit Grounding Citations */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2 p-2 border border-ink bg-surface">
                  <span className="px-1.5 py-0.5 bg-status-approved text-ink font-bold text-[10px] border border-ink uppercase">
                    FACT-001
                  </span>
                  <div>
                    <span className="font-bold text-ink">Verified Fact (F-001):</span> &ldquo;20% savings&rdquo; falls within certified 18–24% customer study range (n=412).
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 border border-ink bg-surface">
                  <span className="px-1.5 py-0.5 bg-status-approved text-ink font-bold text-[10px] border border-ink uppercase">
                    FACT-002
                  </span>
                  <div>
                    <span className="font-bold text-ink">Verified Fact (F-002):</span> &ldquo;25-year panel warranty&rdquo; grounded directly in Approved Fact Sheet 2025-Q3 tier-1 performance warranty terms.
                  </div>
                </div>
              </div>

              <div className="p-3 border border-ink bg-surface-2 text-xs font-mono text-ink">
                <span className="font-bold uppercase tracking-wider text-ink-3 block text-[10px]">
                  Reviewer Decision Note:
                </span>
                &ldquo;Claims updated to match approved 2025-Q3 residential benchmarks (F-001 savings, F-002 warranty). Superlative and absolute guarantees removed.&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Cited Reference Documents Summary */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Source Attribution & Verification Basis
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Cited Governance Guidelines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 border-2 border-ink bg-paper space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink uppercase">Brand Voice Guide v4 § 5.2</span>
                <span className="text-[10px] text-ink-3">Policy Source S1</span>
              </div>
              <p className="font-sans text-xs text-ink-2">
                &ldquo;Superlatives (best, #1, fastest, only) and absolute guarantee statements create substantial regulatory risk and violate brand posture without independent third-party lab documentation.&rdquo;
              </p>
            </div>
            <div className="p-4 border-2 border-ink bg-paper space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink uppercase">Approved Fact Sheet 2025-Q3</span>
                <span className="text-[10px] text-ink-3">Fact Source S3</span>
              </div>
              <p className="font-sans text-xs text-ink-2">
                &ldquo;F-001 establishes 18–24% electricity bill savings (2025 study, n=412). F-002 establishes 25-year performance warranty for standard tier-1 residential photovoltaic modules.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Cryptographic Seal & Interactive Verifier */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Cryptographic Audit Seal
              </span>
              <span className="text-[11px] font-mono text-ink-3">
                How to verify: SHA-256 hash is computed over the raw UTF-8 string bytes: <code className="text-ink bg-surface-2 px-1">echo -n &apos;...&apos; | sha256sum</code>
              </span>
            </div>
            <Lock className="w-4 h-4 text-ink" />
          </div>

          <div className="font-mono text-xs bg-ink text-surface p-4 space-y-1.5 overflow-x-auto leading-relaxed border-2 border-ink">
            <p><span className="text-ink-3">ACTION:</span> content.approve</p>
            <p><span className="text-ink-3">ACTOR:</span> Priya Sharma (Role: reviewer · masked identity)</p>
            <p><span className="text-ink-3">RULE_SET_ID:</span> 30000000-0000-0000-0000-000000000003</p>
            <p><span className="text-ink-3">CONTENT_HASH:</span> ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad</p>
            <p><span className="text-ink-3">HUMAN_GATE_STATUS:</span> PASSED_ZERO_OPEN_BLOCKERS</p>
            <p><span className="text-ink-3">TIMESTAMP_UTC:</span> 2026-02-01T11:00:00Z</p>
          </div>

          {/* Interactive Hash Verification Control */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleVerify}
              className="font-mono text-xs uppercase"
            >
              Verify Hash In Browser
            </Button>

            {verifyStatus === 'matched' && (
              <div className="inline-flex items-center gap-2 p-2 bg-status-approved border border-ink text-xs font-mono font-bold text-ink">
                <Check className="w-4 h-4 text-ink" />
                <span>Hash Verified: SHA-256 matches cryptographic seal perfectly!</span>
              </div>
            )}

            {verifyStatus === 'mismatch' && (
              <div className="inline-flex items-center gap-2 p-2 bg-severity-blocker border border-ink text-xs font-mono font-bold text-ink">
                <span>Hash mismatch: computed {computedHash?.substring(0, 16)}…</span>
              </div>
            )}
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
