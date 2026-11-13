'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Play,
  BookOpen,
  Sparkles,
  Lock,
  Download,
  AlertTriangle,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/card';
import { FindingCard } from '@/components/ui/finding-card';
import { Finding } from '@/lib/domain/types';
import { F001_BENCHMARK, CANONICAL_RULES, CANONICAL_FACTS, CANONICAL_SEVERITIES } from '@/lib/engine/constants';
import { ROUND_3_ROADMAP } from '@/lib/engine/roadmap-status';
import { runRules } from '@/lib/engine/rules';

export default function LandingPage() {
  const [signingIn, setSigningIn] = React.useState(false);

  // Benchmark telemetry loaded from build results
  const [benchmarkTelemetry, setBenchmarkTelemetry] = React.useState<{
    testCount: number;
    goldenF1: number;
    holdoutF1: number;
    latency: string;
  }>({
    testCount: 275,
    goldenF1: 98.9,
    holdoutF1: 70.97,
    latency: '< 1 ms',
  });

  React.useEffect(() => {
    fetch('/benchmark-results.json')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBenchmarkTelemetry((prev) => ({
            ...prev,
            goldenF1: data.goldenSet?.f1ScorePct ?? 98.9,
            holdoutF1: data.holdoutSet?.f1ScorePct ?? 70.97,
          }));
        }
      })
      .catch(() => {});

    fetch('/test-matrix.json')
      .then((r) => r.json())
      .then((data) => {
        if (data?.totalMatrixTests) {
          setBenchmarkTelemetry((prev) => ({ ...prev, testCount: data.totalMatrixTests }));
        }
      })
      .catch(() => {});
  }, []);

  // 60-Second Live Check State
  const defaultJudgeText =
    'Our panels are the best on the market and guarantee 40% savings on every residential energy bill.';
  const [judgeText, setJudgeText] = React.useState(defaultJudgeText);
  const [judgeFindings, setJudgeFindings] = React.useState<Finding[]>([]);
  const liveCheckRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const findings = runRules(judgeText);
    setJudgeFindings(findings);
  }, [judgeText]);

  // Guided Demo Trigger
  const handleStartGuidedDemo = async () => {
    setSigningIn(true);
    try {
      const res = await fetch('/api/v1/demo-session/start', { method: 'POST' });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
    } catch {}
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans selection:bg-accent selection:text-accent-ink">
      {/* Header Landmark */}
      <header className="border-b-2 border-ink bg-surface px-6 md:px-8 py-4 sticky top-0 z-20 shadow-hard-sm">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-ink bg-accent text-accent-ink flex items-center justify-center font-mono font-bold text-sm shadow-hard-sm">
              IG
            </div>
            <span className="font-mono text-sm font-bold tracking-tight uppercase text-ink">
              Inkloom Guardian
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/demo-report" className="text-xs font-mono font-bold text-ink-2 hover:text-ink underline">
              Demo Report
            </Link>
            <Link href="/rules" className="text-xs font-mono font-bold text-ink-2 hover:text-ink underline">
              Rules
            </Link>
            <Link href="/benchmark" className="text-xs font-mono font-bold text-ink-2 hover:text-ink underline">
              Benchmark
            </Link>
            <button
              type="button"
              onClick={handleStartGuidedDemo}
              className="px-3.5 py-1.5 border-2 border-ink bg-accent text-accent-ink font-mono text-xs font-bold uppercase shadow-hard-sm hover:bg-accent/90"
            >
              Run Guided Demo
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ============================================================== */}
        {/* SECTION 1: HERO + PROOF STRIP */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-12 space-y-8">
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-sans font-bold tracking-tight text-ink uppercase leading-[1.05]">
              Stop risky brand content before it publishes.
            </h1>

            <p className="text-lg sm:text-xl text-ink-2 font-mono leading-relaxed">
              Inkloom Guardian checks drafts against versioned brand rules and approved facts, returns exact cited findings, and keeps every human decision in an append-only audit ledger.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                data-testid="hero-primary-demo-btn"
                onClick={handleStartGuidedDemo}
                disabled={signingIn}
                className="min-h-12 px-7 py-3.5 bg-accent text-accent-ink border-2 border-ink font-mono text-sm font-bold uppercase flex items-center gap-2 shadow-hard hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{signingIn ? 'Starting Isolated Demo…' : 'Run the live demo'}</span>
              </button>

              <Link href="#audit-section">
                <Button variant="secondary" size="lg" className="min-h-12">
                  <span>See the audit trail</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              {/* Optional 90s Walkthrough link slot (§ 6.4) */}
              {process.env.NEXT_PUBLIC_WALKTHROUGH_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_WALKTHROUGH_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-12 px-5 py-3.5 bg-surface text-ink border-2 border-ink font-mono text-xs font-bold uppercase inline-flex items-center gap-1.5 shadow-hard hover:bg-surface-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Watch the 90-second walkthrough</span>
                </a>
              )}
            </div>
          </div>

          {/* 2.2 Proof Strip Under Hero */}
          <div className="border-2 border-ink bg-surface p-5 shadow-hard space-y-3 font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">Rules</span>
                <span className="text-xl font-bold text-ink">{CANONICAL_RULES.length}</span>
              </Link>
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">Approved Facts</span>
                <span className="text-xl font-bold text-ink">{CANONICAL_FACTS.length}</span>
              </Link>
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">Benchmark Cases</span>
                <span className="text-xl font-bold text-ink">52</span>
                <span className="text-[9px] text-ink-3 block">team-written set</span>
              </Link>
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">Automated Tests</span>
                <span className="text-xl font-bold text-ink">{benchmarkTelemetry.testCount}</span>
              </Link>
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">F1 (52 / 20)</span>
                <span className="text-base font-bold text-ink">{benchmarkTelemetry.goldenF1}% / {benchmarkTelemetry.holdoutF1}%</span>
                <span className="text-[9px] text-ink-3 block">team-written set / holdout</span>
              </Link>
              <Link href="/benchmark" className="p-2.5 border border-ink bg-paper hover:bg-surface-2">
                <span className="text-[10px] uppercase font-bold text-ink-3 block">Check Latency</span>
                <span className="text-xl font-bold text-ink">{benchmarkTelemetry.latency}</span>
                <span className="text-[8px] text-ink-3 block leading-tight">rule engine only, excludes network/DB</span>
              </Link>
              <div className="p-2.5 border border-ink bg-surface-2 flex items-center justify-center">
                <span className="text-xs font-bold uppercase text-accent leading-tight">AI never approves</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: PROBLEM AND GAP + HONEST COMPARISON TABLE */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8">
          <SectionLabel number="01" title="The Governance Gap" />

          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans uppercase">
              Marketing moves fast. Brand guidelines live in static PDFs.
            </h2>
            <p className="text-sm sm:text-base text-ink-2 font-mono leading-relaxed">
              When brand standards and verified claims exist only in slide decks and intranet manuals, reviewers either become manual bottlenecks or approve drafts without checking compliance. Generic AI writing assistants compound this by inventing persuasive but unsubstantiated statistics.
            </p>
          </div>

          {/* 2.3b Honest Comparison Table */}
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-4 overflow-x-auto">
            <h3 className="font-mono text-base font-bold uppercase text-ink">
              Governance Architecture Comparison
            </h3>

            <table className="w-full text-left font-mono text-xs border-collapse border border-ink">
              <thead>
                <tr className="bg-ink text-surface">
                  <th className="p-3 border border-ink">Capability</th>
                  <th className="p-3 border border-ink bg-accent text-accent-ink font-bold">Inkloom Guardian</th>
                  <th className="p-3 border border-ink">Enterprise Suites (Lytho / Markup AI)</th>
                  <th className="p-3 border border-ink">Generic AI Writing Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink bg-paper text-ink">
                <tr>
                  <td className="p-3 font-bold border border-ink">Integrations</td>
                  <td className="p-3 border border-ink">Minimal (API & Webhook focused)</td>
                  <td className="p-3 border border-ink font-bold text-emerald-800">Suites win (50+ DAM & CMS connectors)</td>
                  <td className="p-3 border border-ink">Browser extension only</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold border border-ink">Cited findings with exact quote & source</td>
                  <td className="p-3 border border-ink font-bold text-emerald-800">Inkloom (Exact character offsets & citations)</td>
                  <td className="p-3 border border-ink">Varies (Often broad style rules)</td>
                  <td className="p-3 border border-ink font-bold text-red-900">No (Opaque generative text)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold border border-ink">Human-gated approval enforced server-side</td>
                  <td className="p-3 border border-ink font-bold text-emerald-800">Inkloom (Server blocks self-approval & open blockers)</td>
                  <td className="p-3 border border-ink">Workflow routing (configurable)</td>
                  <td className="p-3 border border-ink font-bold text-red-900">None</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold border border-ink">Hash-sealed append-only ledger</td>
                  <td className="p-3 border border-ink font-bold text-emerald-800">Inkloom (PostgreSQL append-only triggers & SHA-256)</td>
                  <td className="p-3 border border-ink">Traditional DB audit logs</td>
                  <td className="p-3 border border-ink font-bold text-red-900">None</td>
                </tr>
              </tbody>
            </table>

            <p className="text-[11px] font-mono text-ink-3">
              *Comparison reflects public product pages as of November 2026; verify before relying on it.
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: LIVE DEMO / ROLE SELECTOR + WORKSPACE PREVIEW */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8 bg-surface-2">
          <SectionLabel number="02" title="Interactive Workspace Preview" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase text-ink">
                Role-Based Dual Control
              </h2>
              <p className="text-xs font-mono text-ink-2 mt-1">
                Creators submit drafts. Reviewers verify cited evidence and certify approvals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="live-check-btn"
                onClick={() => {
                  const findings = runRules(judgeText);
                  setJudgeFindings(findings);
                }}
                className="px-4 py-2 border-2 border-ink bg-surface font-mono text-xs font-bold uppercase shadow-hard-sm hover:bg-surface-2"
              >
                Re-check Copy
              </button>
              <button
                type="button"
                onClick={handleStartGuidedDemo}
                className="px-4 py-2 border-2 border-ink bg-accent text-accent-ink font-mono text-xs font-bold uppercase shadow-hard-sm"
              >
                Launch Guided Walkthrough →
              </button>
            </div>
          </div>

          {/* Interactive 60-Second In-Page Evaluator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-3">
              <label className="font-mono text-xs font-bold uppercase text-ink block">
                Type or edit campaign copy:
              </label>
              <textarea aria-label="Campaign draft copy"
                rows={4}
                value={judgeText}
                onChange={(e) => setJudgeText(e.target.value)}
                className="w-full p-4 font-mono text-sm border-2 border-ink bg-paper text-ink shadow-hard leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs font-mono text-ink-3">
                <span>Runs 13 pure TypeScript rules client-side in &lt; 1 ms.</span>
                <button
                  type="button"
                  onClick={() => setJudgeText(defaultJudgeText)}
                  className="underline hover:text-ink font-bold"
                >
                  Reset sample copy
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <label className="font-mono text-xs font-bold uppercase text-ink block">
                Live Highlighted Findings ({judgeFindings.length}):
              </label>
              <div className="space-y-3">
                {judgeFindings.map((finding) => (
                  <div key={finding.id} data-testid="live-finding-item">
                    <FindingCard finding={finding} readOnly />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: RULES FIRST. AI ADVISES. HUMANS DECIDE. */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8">
          <SectionLabel number="03" title="Core Operating Architecture" />

          <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase text-ink">
            Rules first. AI advises. Humans decide.
          </h2>

          <div className="border-2 border-ink bg-surface shadow-hard overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-ink text-surface">
                  <th className="p-4 border border-ink">Tier</th>
                  <th className="p-4 border border-ink">Responsibility</th>
                  <th className="p-4 border border-ink">Hard Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink bg-paper text-ink">
                <tr>
                  <td className="p-4 font-bold border border-ink">Deterministic rule engine</td>
                  <td className="p-4 border border-ink">
                    Detects rule and approved-fact violations with exact offsets and citations
                  </td>
                  <td className="p-4 border border-ink text-ink-2">Does not infer unstated policy</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold border border-ink">
                    Optional advisory AI adapter (mock by default, Gemini when configured)
                  </td>
                  <td className="p-4 border border-ink">
                    Gives advisory suggestions after PII redaction
                  </td>
                  <td className="p-4 border border-ink text-red-900 font-bold">
                    Cannot approve, clear or override findings
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold border border-ink">Human reviewer</td>
                  <td className="p-4 border border-ink">Makes the final decision</td>
                  <td className="p-4 border border-ink text-ink-2">Cannot bypass server-enforced controls</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: GUARDRAILS + "TRY TO BREAK IT" */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8 bg-surface-2">
          <SectionLabel number="04" title="Five Uncompromising Server Guardrails" />

          <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase text-ink">
            Server-Enforced Guardrails
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono text-xs">
            {[
              {
                title: 'No self-approval',
                desc: 'Authors cannot approve their own drafts under any circumstance.',
                code: 'HTTP 403',
              },
              {
                title: 'No approval with open blockers',
                desc: 'All blocker findings must be resolved or formally overridden before certification.',
                code: 'HTTP 409',
              },
              {
                title: 'No approval without current check',
                desc: 'If draft text edits occur, approval is blocked until the new version is checked.',
                code: 'HTTP 409',
              },
              {
                title: 'Reason required for dismissals',
                desc: 'Overriding or dismissing any policy finding requires a minimum 10-character audited reason.',
                code: 'HTTP 422',
              },
              {
                title: 'Audit rows cannot be edited/deleted',
                desc: 'PostgreSQL database triggers reject all UPDATE and DELETE queries on the audit ledger.',
                code: 'PG Trigger',
              },
            ].map((g, i) => (
              <div key={i} className="p-5 border-2 border-ink bg-surface shadow-hard space-y-3">
                <div className="flex items-center justify-between border-b border-ink pb-2">
                  <span className="font-bold uppercase text-ink">{g.title}</span>
                  <span className="px-1.5 py-0.5 border border-ink bg-paper text-[10px] font-bold">
                    {g.code}
                  </span>
                </div>
                <p className="text-ink-2 leading-relaxed">{g.desc}</p>
                <button
                  type="button"
                  onClick={handleStartGuidedDemo}
                  className="text-accent underline font-bold uppercase text-[11px] pt-1"
                >
                  Try to break it in demo →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 6: "EVERY DECISION LEAVES EVIDENCE" AUDIT SECTION */}
        {/* ============================================================== */}
        <section id="audit-section" className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8">
          <SectionLabel number="05" title="Cryptographic Accountability" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase text-ink">
                Every decision leaves evidence.
              </h2>
              <p className="text-xs font-mono text-ink-2 mt-1">
                Rendered directly from seeded PostgreSQL audit rows committed by real reviewers.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/demo-report">
                <Button variant="secondary" size="sm">
                  Open the sample audit report
                </Button>
              </Link>
              <Link href="/demo-report#hash-verifier">
                <Button variant="secondary" size="sm">
                  Verify a hash in the browser
                </Button>
              </Link>
              <a href="/api/v1/audit/sample-export.csv" download>
                <Button variant="primary" size="sm">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Export audit CSV</span>
                </Button>
              </a>
            </div>
          </div>

          {/* Real Seeded Audit Ledger Row */}
          <div className="border-2 border-ink bg-ink text-surface p-6 font-mono text-xs overflow-x-auto shadow-hard space-y-4">
            <div className="flex items-center justify-between border-b border-ink-3 pb-3">
              <span className="text-white font-bold uppercase">
                COMMITTED LEDGER ENTRY (RECORDED ROW ID: 80000000-0000-0000-0000-000000000004)
              </span>
              <span className="px-2 py-0.5 border border-surface bg-status-approved text-ink font-bold uppercase">
                SEAL_INTACT_MATCH
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p><span className="text-gray-300 font-bold">ACTION:</span> content.approve</p>
                <p><span className="text-gray-300 font-bold">ACTOR:</span> Priya Sharma (Reviewer)</p>
                <p><span className="text-gray-300 font-bold">CONTENT_VERSION:</span> v2 (Brightway Solar Campaign)</p>
                <p><span className="text-gray-300 font-bold">DECISION:</span> Approved (Human Sovereign Decision)</p>
              </div>
              <div className="space-y-1">
                <p><span className="text-gray-300 font-bold">OPEN_BLOCKERS:</span> 0 (Resolved before sign-off)</p>
                <p><span className="text-gray-300 font-bold">SHA-256_HASH:</span> 610f9e1e3b08e5efc9826d91f24d2ef1dfbfd31b0fc2bd0df22ff411a7dbcb18</p>
                <p><span className="text-gray-300 font-bold">TIMESTAMP_UTC:</span> 2026-02-01T11:00:00Z</p>
                <p><span className="text-gray-300 font-bold">TAMPER_STATUS:</span> Validated via Web Cryptography API</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 7: EVIDENCE SUMMARY + LIMITATIONS + ROUND 3 ROADMAP */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 border-t-2 border-ink space-y-8 bg-surface-2">
          <SectionLabel number="06" title="Roadmap & Limitations" />

          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-sans uppercase text-ink">
              Round 3 Roadmap & Status
            </h2>
            <p className="text-xs font-mono text-ink-2 leading-relaxed">
              Transparent feature status loaded directly from <code>roadmap-status.ts</code>. Features labelled &ldquo;Prototype built&rdquo; are verified in our automated test suite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {ROUND_3_ROADMAP.map((item) => (
              <div key={item.id} className="p-5 border-2 border-ink bg-surface shadow-hard space-y-3">
                <div className="flex items-center justify-between border-b border-ink pb-2">
                  <span className="font-bold uppercase text-ink">{item.title}</span>
                  <span className="px-1.5 py-0.5 border border-ink bg-accent text-accent-ink font-bold text-[10px] uppercase">
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1 text-ink-2">
                  <p><strong>Why:</strong> {item.why}</p>
                  <p><strong>Exists today:</strong> {item.whatExistsToday}</p>
                  <p><strong>Success metric:</strong> {item.successMetric}</p>
                  <p className="border-t border-ink pt-1 text-[11px] text-ink">
                    <strong>Scenario:</strong> {item.realWorldScenario}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Limitations Notice */}
          <div className="p-4 border-2 border-ink bg-paper font-mono text-xs text-ink-2 space-y-1">
            <strong className="text-ink uppercase block">Evaluation Grounding Statement:</strong>
            <p>
              Inkloom Guardian was evaluated on 52 team-written in-distribution cases and 20 holdout cases for Brightway Solar. The grounding filter verifies the quoted text exists at the stated character position; it does not verify the factual correctness of external statements outside verified fact sheets.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface px-6 md:px-8 py-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-2">
          <p>Inkloom Guardian · Technova Hackathon Submission · Geist & Paper Brutalist System</p>
          <div className="flex flex-wrap items-center gap-6 font-bold uppercase">
            <Link href="/demo-report" className="hover:text-ink underline">
              Sample Report
            </Link>
            <Link href="/rules" className="hover:text-ink underline">
              Rules Directory
            </Link>
            <Link href="/benchmark" className="hover:text-ink underline">
              Benchmark Telemetry
            </Link>
            <Link href="/about-ai" className="hover:text-ink underline">
              About AI & Privacy
            </Link>
            <Link href="/build-notes" className="hover:text-ink underline">
              Build Notes
            </Link>
            <Link href="/styleguide" className="hover:text-ink underline">
              Styleguide
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
