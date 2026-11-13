'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function BuildNotesPage() {
  useEffect(() => {
    document.title = 'Engineering Build Notes & Architecture | Inkloom Guardian';
  }, []);

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
            <Badge variant="neutral">System Build Specification</Badge>
            <span className="text-xs font-mono text-ink-3">Delivered 2026-11</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-ink uppercase">
            Build Notes & Architectural Decisions
          </h1>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed">
            Detailed breakdown of delivered capabilities, architectural consolidation decisions, and our intentional forward roadmap.
          </p>
        </div>

        {/* Section 1: Delivered Features Matrix */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between">
            <h2 className="text-base font-bold text-ink uppercase tracking-tight">
              Delivered Features Checklist
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-surface-2 text-ink uppercase">
              Complete, with known limits
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
                <TableCell className="text-xs">13 pure TypeScript rules evaluating in &lt;1ms (measured 0.009 ms / 9 µs avg)</TableCell>
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
              Deliberate Architectural Consolidations
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

        {/* Section 3: Unified AI Architecture & Precise Boundary Statement */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Core Definition
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Unified AI & Deterministic Engine Boundary
            </h2>
          </div>
          <div className="p-4 border-2 border-ink bg-surface-2 space-y-3">
            <p className="text-xs text-ink leading-relaxed font-mono">
              Deterministic rule engine. Optional advisory AI (mock by default; Gemini when configured). Inkloom Guardian&apos;s core governance engine evaluates 13 brand rules and 6 verified facts locally in pure TypeScript with zero external network dependencies. When an AI API key is configured, an optional, pluggable Gemini AI adapter provides advisory suggestions and phrasing alternatives on unstructured copy. The AI adapter never approves content, never bypasses blocker gates, and all text undergoes automated PII redaction before leaving the boundary.
            </p>
          </div>
        </div>

        {/* Section 4: AI & Tools Disclosure */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Transparency
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              AI & Tools Disclosure
            </h2>
          </div>
          <p className="text-xs text-ink-2">
            In compliance with hackathon transparency guidelines, below is the exhaustive disclosure of tools, AI assistance, and open-source foundations utilized in constructing Inkloom Guardian:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool / Provider</TableHead>
                <TableHead>Scope of Utilization</TableHead>
                <TableHead>Governance & Verification Gate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Anthropic Claude</TableCell>
                <TableCell className="text-xs">Architectural planning, interface contracts, and unit test generation</TableCell>
                <TableCell className="font-mono text-xs">Human engineer validated; 182+ automated vitest checks</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Google Antigravity & Gemini API</TableCell>
                <TableCell className="text-xs">Context synthesis, coding assistance, and pluggable runtime LLM advisory adapter</TableCell>
                <TableCell className="font-mono text-xs">Deterministic PII redaction + strict grounding validation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Next.js 15 & Drizzle ORM</TableCell>
                <TableCell className="text-xs">Application framework, API route handlers, and SQL schema management (MIT)</TableCell>
                <TableCell className="font-mono text-xs">Compiled with strict TypeScript and ESLint</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Paper Brutalist UI System</TableCell>
                <TableCell className="text-xs">Custom CSS tokens, Geist font, Lucide icons (ISC/MIT)</TableCell>
                <TableCell className="font-mono text-xs">npm run check:tokens (0 raw hex, 0 arbitrary px)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Section 5: Known Limitations */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Engineering Honesty
            </span>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Known System Limitations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
              <span className="font-mono text-xs font-bold uppercase text-ink block">
                1. Simulated Brand Corpus
              </span>
              <p className="text-xs text-ink-2">
                Brand guidelines, facts, and campaign items are grounded in the fictional company &ldquo;Brightway Solar&rdquo; for realistic hackathon evaluation.
              </p>
            </div>
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
              <span className="font-mono text-xs font-bold uppercase text-ink block">
                2. Golden Benchmark Scope
              </span>
              <p className="text-xs text-ink-2">
                The golden evaluation benchmark contains 50 curated copy examples covering edge cases, adversarial phrasing, and numeric units.
              </p>
            </div>
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
              <span className="font-mono text-xs font-bold uppercase text-ink block">
                3. Hand-Authored Rule Logic
              </span>
              <p className="text-xs text-ink-2">
                The 13 seed rules are hand-written in pure TypeScript regex and token window matchers rather than auto-extracted from arbitrary PDFs.
              </p>
            </div>
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-1">
              <span className="font-mono text-xs font-bold uppercase text-ink block">
                4. NUM-001 Proximity False Positive
              </span>
              <p className="text-xs text-ink-2">
                When two percentage metrics appear within a 40-character sliding window (e.g. comparing 40% vs 20%), NUM-001 flags the higher number even if framed as a disclaimer.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Verified Route Inventory (13 Routes) */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink flex items-center justify-between">
            <h2 className="text-base font-bold text-ink uppercase tracking-tight">
              Verified Route Inventory
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-approved text-ink uppercase">
              13 Mapped Routes Verified
            </span>
          </div>
          <p className="text-xs text-ink-2">
            The application route tree is strictly verified against <code className="bg-surface-2 px-1 border border-ink font-mono text-[11px]">docs/SITEMAP.md</code> via <code className="bg-surface-2 px-1 border border-ink font-mono text-[11px]">npm run check:routes</code>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
            {[
              { path: '/', type: 'Public', desc: 'Landing & Demo Switcher' },
              { path: '/login', type: 'Public', desc: 'Persona Roles & Auth' },
              { path: '/demo-report', type: 'Public', desc: 'Sample Signed Report' },
              { path: '/about-ai', type: 'Public', desc: 'AI Safety & Privacy' },
              { path: '/build-notes', type: 'Public', desc: 'Architecture & Disclosures' },
              { path: '/selftest', type: 'Public', desc: 'In-Browser Test Runner' },
              { path: '/styleguide', type: 'Public', desc: 'Design System Gallery' },
              { path: '/dashboard', type: 'App', desc: 'Content Repository' },
              { path: '/content/new', type: 'App', desc: 'Multi-Format Intake' },
              { path: '/content/[id]', type: 'App', desc: 'Review Workspace' },
              { path: '/guidelines', type: 'App', desc: 'Brand Rule Base' },
              { path: '/insights', type: 'App', desc: 'Governance Metrics' },
              { path: '/audit', type: 'App', desc: 'Immutable Audit Log' },
            ].map((r) => (
              <div key={r.path} className="p-2 border border-ink bg-surface-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{r.path}</span>
                  <span className="text-[10px] uppercase font-bold text-ink-3">{r.type}</span>
                </div>
                <span className="text-[11px] text-ink-2 mt-1">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface py-6 text-center text-xs font-mono text-ink-3">
        INKLOOM GUARDIAN · ARCHITECTURAL REPORT
      </footer>
    </div>
  );
}
