'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function BuildNotesPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      {/* Header */}
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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="neutral">Round 2 Build Submission</Badge>
            <span className="text-xs font-mono text-ink-3">Delivered 2026-11</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-ink uppercase">
            Build Notes & Architectural Decisions
          </h1>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed">
            Detailed breakdown of what was delivered in Round 2 &ldquo;The Build&rdquo;, architectural consolidation decisions, and our intentional Round 3 roadmap.
          </p>
        </div>

        {/* Section 1: Delivered Features Matrix */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between">
            <h2 className="text-base font-bold text-ink uppercase tracking-tight">
              Delivered Features Checklist (Round 2)
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-approved text-ink uppercase">
              100% Complete
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Implementation Scope</TableHead>
                <TableHead>Verification Artifact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Deterministic Rule Engine</TableCell>
                <TableCell className="text-xs">13 pure TypeScript rules evaluating in &lt;2ms</TableCell>
                <TableCell className="font-mono text-xs">/selftest & vitest suite</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">NUM-001 Proximity Matcher</TableCell>
                <TableCell className="text-xs">Context window matching numbers against approved research metrics</TableCell>
                <TableCell className="font-mono text-xs">lib/engine/rules.ts</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Human Blocker Gate</TableCell>
                <TableCell className="text-xs">Hard prevention of approval when blocker findings are open</TableCell>
                <TableCell className="font-mono text-xs">lib/domain/derive.ts</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Immutable Audit Log</TableCell>
                <TableCell className="text-xs">Append-only triggers preventing tampering of reviews & runs</TableCell>
                <TableCell className="font-mono text-xs">/audit & CSV export</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Multi-Format Intake</TableCell>
                <TableCell className="text-xs">Direct paste or file upload (.docx, .pdf) with text extraction</TableCell>
                <TableCell className="font-mono text-xs">/content/new</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Paper Brutalist UI System</TableCell>
                <TableCell className="text-xs">Custom tokens, Geist typography, hard shadows, zero radius</TableCell>
                <TableCell className="font-mono text-xs">/styleguide & styles/tokens.css</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Section 2: Deliberate Architectural Consolidations */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Deviations Ledger
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Deliberate Consolidations from Round 1 Plan
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                1. Unified Next.js 15 App Router & Drizzle Stack
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Rather than deploying an external Python FastAPI container alongside a Node frontend, we consolidated the engine and API into Next.js 15 App Router route handlers with Drizzle ORM. This eliminated inter-process latency, Docker orchestrator fragility, and duplicate type definitions while delivering full end-to-end type safety.
              </p>
            </div>

            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                2. Dual-Execution Pure TypeScript Rule Engine
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Writing the seed governance rules in zero-dependency TypeScript enabled the exact same rule evaluator to run server-side during content submission and client-side on the public Self-Test page for judges to test with zero network latency.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: The Three Round 3 Improvements */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Forward Roadmap
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              The Three Round 3 Improvements
            </h2>
          </div>
          <p className="text-xs text-ink-2">
            In accordance with hackathon instructions, the following three architectural enhancements are scheduled for Round 3 and deliberately excluded from today&apos;s build:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2 shadow-hard">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                01. Stale-Content Re-Audit Pipeline
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Automatically re-scans historical approved campaigns whenever a new brand guideline or fact sheet is activated, flagging copy that has become non-compliant over time.
              </p>
            </div>

            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2 shadow-hard">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                02. Guideline-Gap Detector
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Aggregates reviewer override and dismissal telemetry to detect ambiguities and friction in guidelines where human reviewers consistently diverge from policy.
              </p>
            </div>

            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2 shadow-hard">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                03. Multimodal Banner Inspection
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Analyzes creative banner assets beyond alt-text to verify logo clearspace, WCAG color contrast ratios, and visual balance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface py-6 text-center text-xs font-mono text-ink-3">
        INKLOOM GUARDIAN · ROUND 2 ARCHITECTURAL REPORT
      </footer>
    </div>
  );
}
