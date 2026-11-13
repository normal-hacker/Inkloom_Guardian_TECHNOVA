'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, BookOpen, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { SeverityBadge, RuleChip } from '@/components/ui/badge';
import { CANONICAL_RULES, CANONICAL_FACTS } from '@/lib/engine/constants';

export default function PublicRulesPage() {
  useEffect(() => {
    document.title = 'Brand Governance Rules & Approved Facts Directory | Inkloom Guardian';
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      {/* Top Header */}
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

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard-sm mb-3">
            <BookOpen className="w-4 h-4 text-ink" />
            <span>Public Governance Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold uppercase tracking-tight text-ink">
            Brand Rules & Verified Facts Directory
          </h1>
          <p className="mt-2 text-sm text-ink-2 max-w-2xl leading-relaxed">
            Every deterministic governance check in Inkloom Guardian evaluates against these 13 versioned rules and 6 certified facts. All rules cite verified policy documentation.
          </p>
        </div>

        {/* Severity Definitions Card */}
        <section className="bg-surface border-2 border-ink p-6 shadow-hard space-y-3" data-testid="severity-definitions">
          <h2 className="text-sm font-mono font-bold uppercase text-ink tracking-wider">
            Severity Classification Definitions
          </h2>
          <p className="text-xs text-ink leading-relaxed">
            Findings are classified into three strict tiers: <strong className="text-red-900 uppercase font-mono">Blocker</strong> findings represent hard compliance barriers (unsubstantiated superlative claims, unverified guarantees, unsupported metric numbers, or confidential codenames/PII) that mathematically prevent human publication approval until resolved, dismissed, or overridden with a mandatory justification. <strong className="text-amber-900 uppercase font-mono">Major</strong> findings represent substantive brand deviations (prohibited terms, aggressive hype language, or missing image alt text) that require explicit editorial attention before launch. <strong className="text-blue-900 uppercase font-mono">Minor</strong> findings represent typographic polish, casing conventions, exclamation mark restraint, or accessible phrase formatting that advise authors on brand excellence without halting workflow.
          </p>
        </section>

        {/* All 13 Rules */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
            <h2 className="text-lg font-mono font-bold uppercase text-ink">
              All 13 Brand Governance Rules
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-surface" data-testid="rules-count-badge">
              {CANONICAL_RULES.length} Active Rules
            </span>
          </div>

          <div className="space-y-3" data-testid="rules-list">
            {CANONICAL_RULES.map((rule) => (
              <div
                key={rule.key}
                data-testid={`rule-item-${rule.key}`}
                className="p-4 border-2 border-ink bg-surface shadow-hard-sm space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <RuleChip code={rule.key} />
                    <span className="font-bold text-sm text-ink">{rule.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 border border-ink bg-surface-2 uppercase font-bold text-[10px]">
                      {rule.category}
                    </span>
                    <SeverityBadge severity={rule.severity} />
                  </div>
                </div>
                <p className="text-xs text-ink-2 font-sans">{rule.description}</p>
                <div className="pt-2 border-t border-rule font-mono text-[11px] text-ink-3 flex items-center justify-between flex-wrap gap-2">
                  <span>Source: {rule.sourceDoc} ({rule.sourceSection})</span>
                  <span className="uppercase font-bold text-[10px]">Deterministic Check</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All 6 Approved Facts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
            <h2 className="text-lg font-mono font-bold uppercase text-ink">
              All 6 Verified Fact Sheet Metrics
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-ink bg-surface" data-testid="facts-count-badge">
              {CANONICAL_FACTS.length} Certified Facts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="facts-list">
            {CANONICAL_FACTS.map((fact) => (
              <div
                key={fact.key}
                data-testid={`fact-item-${fact.key}`}
                className="p-4 border-2 border-ink bg-surface shadow-hard-sm space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-status-approved text-ink border border-ink">
                      {fact.key}
                    </span>
                    <span className="font-mono text-[10px] text-ink-3 uppercase">
                      Unit: {fact.unit}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-ink leading-relaxed font-sans">
                    {fact.statement}
                  </p>
                </div>
                <div className="pt-2 border-t border-rule font-mono text-[10px] text-ink-3 flex items-center justify-between">
                  <span>{fact.sourceDoc} ({fact.sourceSection})</span>
                  <span className="text-emerald-800 font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CERTIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-surface py-6 text-center text-xs font-mono text-ink-3">
        INKLOOM GUARDIAN · PUBLIC RULES & FACTS DIRECTORY · ZERO HALLUCINATION RISK DISCLOSED
      </footer>
    </div>
  );
}

