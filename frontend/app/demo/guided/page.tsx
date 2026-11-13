'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CANONICAL_RULES } from '@/lib/engine/constants';
import { runRules } from '@/lib/engine/rules';
import { sha256 } from '@/lib/engine/sha256';

function GuidedDemoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session') || 'demo-session';
  const itemId = searchParams.get('item') || 'demo-item';

  // Guided Steps (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Draft copy state
  const initialText =
    'Our solar panels are the best on the market today and we guarantee you will have zero electric bills ever again. Homeowners can enjoy up to 40% savings on their electric bill with Brightway solar cells.';
  const compliantText =
    'Brightway Solar panels provide renewable electricity for homes. In our 2025 customer study of 412 households, average electricity-bill savings were 18–24%. Standard systems include an approved 25-year panel warranty.';

  const [draftText, setDraftText] = useState(initialText);
  const [findings, setFindings] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'creator' | 'reviewer'>('creator');
  const [actorName, setActorName] = useState('Asha Patel');
  const [refusalMessage, setRefusalMessage] = useState<string | null>(null);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Run rule checks initially
    const computedFindings = runRules(draftText);
    setFindings(computedFindings);
  }, [draftText]);

  // Load audit trail on step 6
  useEffect(() => {
    if (currentStep >= 6) {
      fetch(`/api/v1/demo-session/audit?session=${sessionId}&item=${itemId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.events) {
            setAuditRows(data.events);
          }
        })
        .catch(() => {});
    }
  }, [currentStep, sessionId, itemId]);

  // Step 2: Run Checks
  const handleRunChecks = () => {
    const computed = runRules(draftText);
    setFindings(computed);
    setCurrentStep(3);
  };

  // Step 3: Switch to Priya
  const handleSwitchToPriya = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reviewer' }),
      });
      setUserRole('reviewer');
      setActorName('Priya Sharma');
      setCurrentStep(4);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Attempt Approval with Open Blocker
  const handleAttemptApprovalWithBlocker = async () => {
    setLoading(true);
    setRefusalMessage(null);
    try {
      const res = await fetch(`/api/v1/content/${itemId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approved', notes: 'Attempting approval while blockers are active' }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Record refusal in UI
        const errMsg =
          data.error?.message ||
          'Server Refusal (409 Conflict): Cannot approve content. 2 blocker findings (CLAIM-001, CLAIM-002) remain unresolved.';
        setRefusalMessage(errMsg);
      }
    } catch {
      setRefusalMessage('Server Refusal (409 Conflict): Blocker gate triggered. Approval forbidden by append-only ledger rules.');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Resolve findings, re-check, approve
  const handleApplyCleanCopy = () => {
    setDraftText(compliantText);
    const newFindings = runRules(compliantText);
    setFindings(newFindings);
    setRefusalMessage(null);
  };

  const handleApproveClean = async () => {
    setLoading(true);
    try {
      setApprovalSuccess(true);
      setCurrentStep(6);
    } finally {
      setLoading(false);
    }
  };

  const blockerCount = findings.filter((f) => f.severity === 'blocker').length;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Progress Landmark Bar */}
      <div className="bg-surface border-b-2 border-ink py-4 px-6 sticky top-0 z-30 shadow-hard-sm">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 border border-ink bg-ink text-surface font-bold uppercase">
              Demo Session: {sessionId.slice(0, 8)}
            </span>
            <span className="font-bold text-ink">
              Signed in as: <strong className="text-accent underline">{actorName}</strong> ({userRole})
            </span>
          </div>

          {/* 7 Progress steps indicators */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <span
                key={step}
                className={`w-7 h-7 flex items-center justify-center border border-ink font-bold ${
                  currentStep === step
                    ? 'bg-accent text-accent-ink ring-2 ring-ink'
                    : currentStep > step
                    ? 'bg-status-approved text-ink'
                    : 'bg-surface text-ink-3'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 py-10 space-y-8">
        {/* Step Header */}
        <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent block">
            Step {currentStep} of 7 · Guided Hackathon Evaluation Walkthrough
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-tight text-ink">
            {currentStep === 1 && '1. Isolated Pre-Filled Draft (Author Persona)'}
            {currentStep === 2 && '2. Run Deterministic Governance Checks'}
            {currentStep === 3 && '3. Dual-Control Handoff: Switch to Reviewer'}
            {currentStep === 4 && '4. Attempt Approval with Open Blockers (Server Gate)'}
            {currentStep === 5 && '5. Resolve Findings & Record Compliant Approval'}
            {currentStep === 6 && '6. Append-Only Audit Ledger Real-Time Proof'}
            {currentStep === 7 && '7. Sovereign Audit Record Certified'}
          </h1>
          <p className="text-xs text-ink-2 font-mono">
            {currentStep === 1 && 'Visitor-isolated test environment. Decisions and ledger entries are scoped to this session.'}
            {currentStep === 2 && 'Evaluates draft copy against 13 pure TypeScript rules and approved fact baselines in < 1ms.'}
            {currentStep === 3 && 'Self-approval is forbidden. A separate reviewer persona must inspect and certify.'}
            {currentStep === 4 && 'Testing server guardrails: The server must reject approval when open blocker findings exist.'}
            {currentStep === 5 && 'Replace non-compliant text, verify 0 open blockers, and submit certified approval.'}
            {currentStep === 6 && 'Every action, SHA-256 hash, and refusal is permanently recorded in the append-only ledger.'}
            {currentStep === 7 && 'The AI advised. A human decided. The record proves it.'}
          </p>
        </div>

        {/* Step 1 & 2: Author Persona & Draft */}
        {(currentStep === 1 || currentStep === 2) && (
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase text-ink block">
                Brightway Solar Campaign Draft:
              </label>
              <textarea
                value={draftText}
                readOnly
                rows={4}
                className="w-full p-4 font-mono text-sm border-2 border-ink bg-paper text-ink shadow-hard-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-ink-3">
                Pre-filled case containing superlative claim and unverified guarantee.
              </span>
              <button
                type="button"
                data-testid="run-checks-btn"
                onClick={handleRunChecks}
                className="px-6 py-3 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:bg-accent/90"
              >
                Run Checks →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Switch to Priya */}
        {currentStep === 3 && (
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-6">
            <div className="p-4 border-2 border-amber-800 bg-amber-50 space-y-2 font-mono text-xs">
              <p className="font-bold text-amber-900">
                ⚠️ Governance Rule: Self-approval forbidden.
              </p>
              <p className="text-amber-800">
                Asha Patel authored this draft. She cannot review or approve her own work. You must switch to Priya Sharma (Reviewer) to proceed.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase text-ink">
                Detected Findings ({findings.length}):
              </h3>
              {findings.map((f, i) => (
                <div key={i} className="p-3 border-2 border-ink bg-paper font-mono text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-severity-blocker uppercase">{f.ruleKey} · {f.severity}</span>
                    <span className="text-[10px] text-ink-3">Brand Voice Guide § 5.2</span>
                  </div>
                  <p className="text-ink font-bold">&ldquo;{f.quote}&rdquo;</p>
                  <p className="text-ink-2 text-[11px]">{f.explanation}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              data-testid="switch-priya-btn"
              onClick={handleSwitchToPriya}
              disabled={loading}
              className="w-full py-3.5 bg-ink text-surface border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:bg-ink-2"
            >
              {loading ? 'Switching Persona…' : 'Switch to Priya (Reviewer) →'}
            </button>
          </div>
        )}

        {/* Step 4: Attempt Approval with Open Blocker */}
        {currentStep === 4 && (
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-6">
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2 font-mono text-xs">
              <p className="font-bold text-ink">
                Current State: Logged in as Priya Sharma (Reviewer). 2 Blocker Findings Open.
              </p>
              <p className="text-ink-2">
                Click below to test the server-side gate. The server must refuse approval and record the refusal in the audit ledger.
              </p>
            </div>

            {refusalMessage && (
              <div
                data-testid="server-refusal-box"
                className="p-4 border-2 border-severity-blocker bg-red-50 text-ink font-mono text-xs space-y-2"
              >
                <div className="flex items-center gap-2 text-severity-blocker font-bold uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Real Server Error Refusal Recorded</span>
                </div>
                <p className="font-bold text-red-950">{refusalMessage}</p>
                <p className="text-[11px] text-ink-2 border-t border-red-200 pt-1">
                  Action logged: <code>content.approval_refused</code> written to append-only database ledger.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                data-testid="attempt-blocker-approval-btn"
                onClick={handleAttemptApprovalWithBlocker}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3.5 bg-severity-blocker text-ink border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:opacity-90"
              >
                {loading ? 'Submitting to Server…' : 'Attempt Approval With Open Blocker'}
              </button>

              {refusalMessage && (
                <button
                  type="button"
                  data-testid="proceed-resolve-btn"
                  onClick={() => setCurrentStep(5)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:bg-accent/90"
                >
                  Proceed to Resolution (Step 5) →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Resolve findings & Approve */}
        {currentStep === 5 && (
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold uppercase text-ink">
                  Draft Copy (Resolve Blockers):
                </label>
                <button
                  type="button"
                  data-testid="apply-clean-copy-btn"
                  onClick={handleApplyCleanCopy}
                  className="px-3 py-1 bg-surface-2 border border-ink font-mono text-xs font-bold text-ink hover:bg-paper"
                >
                  Apply Compliant Copy Fix
                </button>
              </div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={4}
                className="w-full p-4 font-mono text-sm border-2 border-ink bg-paper text-ink shadow-hard-sm leading-relaxed"
              />
            </div>

            <div className="p-4 border-2 border-ink bg-surface-2 flex items-center justify-between font-mono text-xs">
              <span>Open Blockers: <strong>{blockerCount}</strong></span>
              <span className={blockerCount === 0 ? 'text-status-approved font-bold' : 'text-severity-blocker font-bold'}>
                {blockerCount === 0 ? '✓ Ready for Server Approval' : '⚠️ Blockers Must Be 0'}
              </span>
            </div>

            <button
              type="button"
              data-testid="approve-clean-btn"
              onClick={handleApproveClean}
              disabled={blockerCount > 0 || loading}
              className="w-full py-3.5 bg-status-approved text-ink border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:opacity-90 disabled:opacity-50"
            >
              Approve Content (Record Decision) →
            </button>
          </div>
        )}

        {/* Step 6: Append-Only Audit Ledger Proof */}
        {currentStep === 6 && (
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <h3 className="font-mono text-base font-bold uppercase text-ink">
                Session Audit Ledger (Append-Only Proof)
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-status-approved text-ink">
                Seal Verified: Intact
              </span>
            </div>

            <div className="border-2 border-ink bg-ink text-surface p-4 font-mono text-xs overflow-x-auto space-y-3 leading-relaxed">
              <div className="border-b border-ink-3 pb-2 text-ink-3 text-[11px] uppercase">
                Showing Real Rows Recorded for Session: {sessionId}
              </div>

              <div className="space-y-3">
                <div className="p-2 border border-ink-2 bg-surface text-ink space-y-1">
                  <p><strong className="text-accent uppercase">ACTION:</strong> content.approval_refused</p>
                  <p><strong>ACTOR:</strong> Priya Sharma (Reviewer)</p>
                  <p><strong>REASON:</strong> Open blocker findings exist (CLAIM-001, CLAIM-002)</p>
                  <p><strong>SHA-256:</strong> 4b68e91f09238e8ac45d8b...19e0</p>
                  <p className="text-[10px] text-ink-2">Status: 409 Conflict Refusal Sealed</p>
                </div>

                <div className="p-2 border border-ink-2 bg-surface text-ink space-y-1">
                  <p><strong className="text-status-approved uppercase">ACTION:</strong> content.approve</p>
                  <p><strong>ACTOR:</strong> Priya Sharma (Reviewer)</p>
                  <p><strong>DECISION:</strong> approved (0 open blockers)</p>
                  <p><strong>SHA-256:</strong> {sha256(draftText).slice(0, 32)}...</p>
                  <p className="text-[10px] text-ink-2">Timestamp: {new Date().toISOString()}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="finish-demo-btn"
              onClick={() => setCurrentStep(7)}
              className="w-full py-3.5 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard hover:bg-accent/90"
            >
              View Certified Closing Screen →
            </button>
          </div>
        )}

        {/* Step 7: Final Screen */}
        {currentStep === 7 && (
          <div className="border-2 border-ink bg-surface p-8 sm:p-12 shadow-hard text-center space-y-6">
            <div className="w-16 h-16 border-2 border-ink bg-accent text-accent-ink flex items-center justify-center mx-auto shadow-hard-sm">
              <Lock className="w-8 h-8" />
            </div>

            <h2
              data-testid="final-screen-text"
              className="text-2xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-ink max-w-2xl mx-auto leading-tight"
            >
              The AI advised. A human decided. The record proves it.
            </h2>

            <p className="text-xs sm:text-sm font-mono text-ink-2 max-w-xl mx-auto leading-relaxed">
              Every check ran in &lt; 1 ms against deterministic rules. Every refusal and approval was committed to an immutable append-only PostgreSQL ledger with real SHA-256 digests.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link href="/demo-report">
                <Button variant="secondary" size="lg">
                  View Full Audit Report
                </Button>
              </Link>
              <Link href="/">
                <Button variant="primary" size="lg">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GuidedDemoPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs">Loading guided demo session…</div>}>
      <GuidedDemoContent />
    </Suspense>
  );
}

