'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2, Lock, Check, AlertTriangle } from 'lucide-react';
import { SeverityBadge, StatusPill, RuleChip } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { F001_BENCHMARK, CANONICAL_SEVERITIES } from '@/lib/engine/constants';

async function computeSha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function DemoReportPage() {
  useEffect(() => {
    document.title = 'Sample Audit Report · Hash-Sealed Evidence | Inkloom Guardian';
  }, []);

  const approvedText =
    'Switch to clean energy with Brightway Solar. Enjoy 20% savings on your bill and a 25-year panel warranty.';

  const [sealedHash, setSealedHash] = useState<string>('');
  const [tamperedText, setTamperedText] = useState<string>(approvedText);
  const [computedHash, setComputedHash] = useState<string>('');
  const [isMatch, setIsMatch] = useState<boolean>(true);
  const tamperTextareaId = useId();

  // Compute sealed hash and initial verification on mount
  useEffect(() => {
    let active = true;
    computeSha256(approvedText).then((hash) => {
      if (!active) return;
      setSealedHash(hash);
      setComputedHash(hash);
      setIsMatch(true);
    });
    return () => {
      active = false;
    };
  }, [approvedText]);

  // Recompute hash whenever tamperedText changes
  useEffect(() => {
    let active = true;
    computeSha256(tamperedText).then((hash) => {
      if (!active) return;
      setComputedHash(hash);
      setIsMatch(hash === sealedHash);
    });
    return () => {
      active = false;
    };
  }, [tamperedText, sealedHash]);

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
          <span className="text-xs font-mono text-ink-2">
            Report ID: BRW-2026-081
          </span>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-ink uppercase">
            Residential Solar Campaign Copy
          </h1>
          <p className="text-xs font-mono text-ink-2 break-all">
            Content SHA-256 (Sealed):{' '}
            <span className="font-bold text-ink" data-testid="sealed-hash-display">
              {sealedHash || 'Computing…'}
            </span>
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-ink gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">
                Final Review Status
              </span>
              <p className="text-xl font-mono font-bold text-ink flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-5 h-5 text-ink" />
                <span>Approved by Human Reviewer</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">
                Active Rule Pack
              </span>
              <p className="text-sm font-mono font-bold text-ink mt-1">
                Brightway Solar v3 (Active Policy)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-2 text-[11px] uppercase block">Author</span>
              <p className="font-bold text-ink mt-1">Asha Patel (Creator)</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-2 text-[11px] uppercase block">Reviewer</span>
              <p className="font-bold text-ink mt-1">Priya Sharma (Reviewer)</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-2 text-[11px] uppercase block">Blockers Handled</span>
              <p className="font-bold text-ink mt-1">2 Blockers Resolved</p>
            </div>
            <div className="p-3 border border-ink bg-surface-2">
              <span className="text-ink-2 text-[11px] uppercase block">Turnaround</span>
              <p className="font-bold text-ink mt-1">55 Minutes</p>
              <span className="text-[10px] text-ink-2 block mt-0.5">10:05 UTC → 11:00 UTC</span>
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
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">
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
                    <span className="font-bold text-ink">CLAIM-001 (Blocker):</span> Superlative &ldquo;best&rdquo; cited against{' '}
                    <Link href="/rules" className="underline hover:text-ink-2 font-bold">
                      Brand Voice Guide § 5.2
                    </Link>.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 border border-ink bg-paper">
                  <RuleChip code="NUM-001" />
                  <div>
                    <span className="font-bold text-ink">NUM-001 ({CANONICAL_SEVERITIES['NUM-001'].toUpperCase()}):</span> &ldquo;40%&rdquo; exceeds approved benchmark in Fact Sheet 2025-Q3 ({' '}
                    <Link href="/rules" className="underline hover:text-ink-2 font-bold">
                      Fact F-001: 18–24% certified
                    </Link>).
                  </div>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div className="border-2 border-ink bg-paper p-5 space-y-4 shadow-hard">
              <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  Version 2 (Approved & Hash-Sealed)
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-status-approved text-ink uppercase">
                  0 Open Blockers · Cleared
                </span>
              </div>

              <div className="p-4 bg-surface border border-ink font-mono text-xs leading-relaxed text-ink">
                &ldquo;{approvedText}&rdquo;
              </div>

              {/* Explicit Grounding Citations */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2 p-2 border border-ink bg-surface">
                  <span className="px-1.5 py-0.5 bg-status-approved text-ink font-bold text-[10px] border border-ink uppercase">
                    FACT-001
                  </span>
                  <div>
                    <span className="font-bold text-ink">Verified Fact (F-001):</span> &ldquo;20% savings&rdquo; falls within certified {F001_BENCHMARK.certifiedRange} customer study range (n=412). Citation:{' '}
                    <Link href="/rules" className="underline hover:text-ink-2 font-bold">
                      Public Rules & Facts Directory →
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 border border-ink bg-surface">
                  <span className="px-1.5 py-0.5 bg-status-approved text-ink font-bold text-[10px] border border-ink uppercase">
                    FACT-002
                  </span>
                  <div>
                    <span className="font-bold text-ink">Verified Fact (F-002):</span> &ldquo;25-year panel warranty&rdquo; grounded directly in Approved Fact Sheet 2025-Q3 tier-1 performance warranty terms.{' '}
                    <Link href="/rules" className="underline hover:text-ink-2 font-bold">
                      View Rule & Fact →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-ink bg-surface-2 text-xs font-mono text-ink">
                <span className="font-bold uppercase tracking-wider text-ink-2 block text-[10px]">
                  Reviewer Decision Note:
                </span>
                &ldquo;Claims updated to match approved 2025-Q3 residential benchmarks (F-001 savings: 20%, F-002 warranty: 25 years). Superlative and absolute guarantees removed.&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Cited Reference Documents Summary */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">
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
                <Link href="/rules" className="text-[10px] text-ink-2 underline hover:text-ink font-bold">
                  View Public Policy S1 →
                </Link>
              </div>
              <p className="font-sans text-xs text-ink-2">
                &ldquo;Superlatives (best, #1, fastest, only) and absolute guarantee statements create substantial regulatory risk and violate brand posture without independent third-party lab documentation.&rdquo;
              </p>
            </div>
            <div className="p-4 border-2 border-ink bg-paper space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink uppercase">Approved Fact Sheet 2025-Q3</span>
                <Link href="/rules" className="text-[10px] text-ink-2 underline hover:text-ink font-bold">
                  View Public Fact Sheet S3 →
                </Link>
              </div>
              <p className="font-sans text-xs text-ink-2">
                &ldquo;F-001 establishes 18–24% electricity bill savings (2025 study, n=412, benchmark 20%). F-002 establishes 25-year performance warranty for standard tier-1 residential photovoltaic modules.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Real Hash Verifier Panel */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-5" data-testid="hash-verifier-panel">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink block">
                Hash-Sealed Audit Trail Verifier
              </span>
              <span className="text-[11px] font-mono text-ink-2">
                Live SHA-256 verification in browser via Web Cryptography API (crypto.subtle)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-ink" />
              {isMatch ? (
                <span
                  data-testid="hash-status-badge"
                  className="px-2 py-0.5 border border-ink bg-status-approved text-ink font-mono text-xs font-bold inline-flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  MATCH
                </span>
              ) : (
                <span
                  data-testid="hash-status-badge"
                  className="px-2 py-0.5 border border-ink bg-severity-blocker text-ink font-mono text-xs font-bold inline-flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  MISMATCH
                </span>
              )}
            </div>
          </div>

          {/* Audit Ledger Entry Details */}
          <div className="font-mono text-xs bg-ink text-white p-4 space-y-1.5 overflow-x-auto leading-relaxed border-2 border-ink">
            <p><span className="text-gray-300 font-bold">ACTION:</span> content.approve</p>
            <p><span className="text-gray-300 font-bold">ACTOR:</span> Priya Sharma (Role: reviewer · masked identity)</p>
            <p><span className="text-gray-300 font-bold">RULE_SET_ID:</span> 30000000-0000-0000-0000-000000000003</p>
            <p><span className="text-gray-300 font-bold">SEALED_CONTENT_HASH:</span> {sealedHash || 'Computing…'}</p>
            <p><span className="text-gray-300 font-bold">COMPUTED_HASH:</span> {computedHash}</p>
            <p><span className="text-gray-300 font-bold">VERIFICATION_STATUS:</span> {isMatch ? 'SEAL_INTACT_MATCH' : 'TAMPER_DETECTED_MISMATCH'}</p>
            <p><span className="text-gray-300 font-bold">TIMESTAMP_UTC:</span> 2026-02-01T11:00:00Z</p>
          </div>

          {/* Tamper Simulation Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={tamperTextareaId}
                className="font-mono text-xs font-bold uppercase text-ink flex items-center gap-1.5"
              >
                <span>Tamper with the text (Judge Verification):</span>
              </label>
              {tamperedText !== approvedText && (
                <button
                  type="button"
                  onClick={() => setTamperedText(approvedText)}
                  className="font-mono text-xs underline text-ink hover:text-ink-2 font-bold"
                >
                  Reset to Original
                </button>
              )}
            </div>
            <textarea aria-label="Tamper test copy"
              id={tamperTextareaId}
              data-testid="tamper-textarea"
              rows={3}
              value={tamperedText}
              onChange={(e) => setTamperedText(e.target.value)}
              className="w-full p-3 font-mono text-xs border-2 border-ink bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Edit any character to immediately see MISMATCH..."
            />
            <p className="text-[11px] font-mono text-ink-2">
              Edit a single letter or number above. The computed SHA-256 will immediately change and trigger the red MISMATCH status badge.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface py-6 text-center text-xs font-mono text-ink-2">
        INKLOOM GUARDIAN · PUBLIC PROOF OF EXECUTION · GOVERNANCE REPORT
      </footer>
    </div>
  );
}
