'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionLabel } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AboutAiPage() {
  useEffect(() => {
    document.title = 'About AI & Sovereign Human Governance | Inkloom Guardian';
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink">
      <PageHeader
        title="About AI, Safety & Privacy Guardrails"
        description="Transparent disclosure of deterministic rule checking, bounded AI assistance, and privacy boundaries."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Intro */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3">
          <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-3">
              Public Architecture Disclosure
            </span>
            <Badge variant="neutral">Production Prototype</Badge>
          </div>
          <h1 className="text-2xl font-mono font-bold text-ink uppercase tracking-tight">
            Honest Labeling & Deterministic Priority
          </h1>
          <p className="text-sm text-ink-2 leading-relaxed font-sans">
            Deterministic rule engine. Optional advisory AI (mock by default; Gemini when configured). Inkloom Guardian&apos;s core governance engine evaluates 13 brand rules and 6 verified facts locally in pure TypeScript with zero external network dependencies. When an AI API key is configured, an optional, pluggable Gemini AI adapter provides advisory suggestions and phrasing alternatives on unstructured copy. The AI adapter never approves content, never bypasses blocker gates, and all text undergoes automated PII redaction before leaving the boundary.
          </p>
          <div className="pt-2">
            <Link href="/rules" className="font-mono text-xs font-bold text-ink underline hover:text-ink-2 uppercase">
              Browse Public Rules & Facts Directory (13 Rules, 6 Facts) →
            </Link>
          </div>
        </div>

        {/* 4 Architectural Guardrails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-ink text-white font-mono font-bold flex items-center justify-center text-sm">
                1
              </span>
              <h2 className="font-mono font-bold text-sm uppercase text-ink">
                Deterministic Engine First
              </h2>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              All 13 core brand rules evaluate locally in pure TypeScript. Benchmarks and latency telemetry are verified on our{' '}
              <Link href="/selftest" className="underline font-bold text-ink">
                /selftest
              </Link>{' '}
              harness.
            </p>
          </div>

          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-ink text-white font-mono font-bold flex items-center justify-center text-sm">
                2
              </span>
              <h2 className="font-mono font-bold text-sm uppercase text-ink">
                Pre-Call PII Redaction
              </h2>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Before draft text is ever passed to an external model (Gemini or Mock), emails, phone numbers, and confidential project codenames are replaced with deterministic placeholder tokens. Spans are re-aligned locally after inference.
            </p>
          </div>

          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-ink text-white font-mono font-bold flex items-center justify-center text-sm">
                3
              </span>
              <h2 className="font-mono font-bold text-sm uppercase text-ink">
                Strict Grounding Filter
              </h2>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              Every finding must satisfy the strict constraint <code className="bg-surface-2 px-1 border border-ink font-mono text-[11px]">text.slice(start, end) === quote</code> and match an existing rule code. The grounding filter verifies the quoted text exists at the stated position; it does not verify the finding is correct.
            </p>
          </div>

          <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-ink text-white font-mono font-bold flex items-center justify-center text-sm">
                4
              </span>
              <h2 className="font-mono font-bold text-sm uppercase text-ink">
                Human Gate Sovereign
              </h2>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              The AI never approves or signs off on content. If open blocker findings exist, the database trigger strictly prevents approval until a human reviewer explicitly addresses each blocker or logs an override rationale.
            </p>
          </div>
        </div>

        {/* What Leaves the System Table */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <SectionLabel>Data Boundary Matrix</SectionLabel>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              What Data Leaves Your Infrastructure
            </h2>
          </div>
          <p className="text-xs text-ink-2">
            The table below breaks down the telemetry and data flows by component.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System Component</TableHead>
                <TableHead>Payload Sent</TableHead>
                <TableHead>Network Destination</TableHead>
                <TableHead>Retention / Logging</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Deterministic Rules</TableCell>
                <TableCell className="text-xs">Plain text draft copy</TableCell>
                <TableCell className="font-mono text-xs">None (Local In-Memory)</TableCell>
                <TableCell className="text-xs">Zero retention</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Mock AI Adapter</TableCell>
                <TableCell className="text-xs">Redacted text spans</TableCell>
                <TableCell className="font-mono text-xs">None (Server Process)</TableCell>
                <TableCell className="text-xs">Zero retention</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Google Gemini Adapter</TableCell>
                <TableCell className="text-xs">PII-redacted text chunks</TableCell>
                <TableCell className="font-mono text-xs">Google AI API (HTTPS)</TableCell>
                <TableCell className="text-xs">Per customer cloud agreement</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold text-xs">Audit Ledger</TableCell>
                <TableCell className="text-xs">SHA-256 hash & actor email</TableCell>
                <TableCell className="font-mono text-xs">PostgreSQL DB</TableCell>
                <TableCell className="text-xs">Immutable append-only</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Supported AI Adapters Card */}
        <div className="bg-surface border-2 border-ink p-6 shadow-hard space-y-4">
          <div className="pb-3 border-b-2 border-ink">
            <SectionLabel>Provider Configuration</SectionLabel>
            <h2 className="text-base font-bold text-ink uppercase tracking-tight mt-1">
              Supported AI Adapters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                Mock Provider (Default)
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Always-on deterministic AI simulator clearly labeled as <code className="bg-paper px-1 border border-ink text-ink">demo AI (mock)</code>. Never claims to be an LLM when running in mock mode.
              </p>
            </div>

            <div className="p-4 border-2 border-ink bg-surface-2 space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink block">
                Google Gemini Provider (Optional)
              </span>
              <p className="text-xs text-ink-2 leading-relaxed">
                Activated seamlessly when <code className="bg-paper px-1 border border-ink text-ink">GEMINI_API_KEY</code> is configured. Includes automated retry with exponential backoff and circuit breaker fallback to the deterministic engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
