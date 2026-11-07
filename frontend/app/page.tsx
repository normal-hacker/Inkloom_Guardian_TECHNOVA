'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/card';
import { FindingCard } from '@/components/ui/finding-card';
import { Finding } from '@/lib/domain/types';

export default function LandingPage() {
  const [signingIn, setSigningIn] = React.useState(false);

  const handleQuickDemo = async (role = 'reviewer') => {
    setSigningIn(true);
    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
        return;
      }
    } catch {}
    window.location.href = '/login';
  };

  const sampleFinding1: Finding = {
    id: 'sample-f1',
    ruleKey: 'CLAIM-001',
    ruleTitle: 'Unsubstantiated superlative claim',
    sourceDoc: 'Brand Voice Guide v4',
    sourceSection: '§5.2',
    origin: 'rule',
    category: 'claim',
    severity: 'blocker',
    spanStart: 0,
    spanEnd: 18,
    quote: 'best on the market',
    explanation: 'Superlative claims such as "best" or "guarantee" without third-party laboratory verification violate advertising policy.',
    suggestion: 'leading residential solar choice in the tri-state area',
    confidence: 1.0,
    status: 'open',
  };

  const sampleFinding2: Finding = {
    id: 'sample-f2',
    ruleKey: 'NUM-001',
    ruleTitle: 'Unverified savings percentage',
    sourceDoc: 'Approved Fact Sheet 2025-Q3',
    sourceSection: 'F-001',
    origin: 'rule',
    category: 'fact',
    severity: 'major',
    spanStart: 0,
    spanEnd: 11,
    quote: '40% savings',
    explanation: 'Approved savings claim is strictly "up to 25%" based on average regional kilowatt-hour utility data.',
    suggestion: 'up to 25% average utility savings',
    confidence: 1.0,
    status: 'open',
  };

  return (
    <div className="bg-paper min-h-screen text-ink flex flex-col justify-between selection:bg-accent selection:text-accent-ink">
      {/* 1. Header */}
      <header className="border-b-2 border-ink bg-surface sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-ink bg-ink text-surface flex items-center justify-center shadow-hard-sm">
              <ShieldCheck className="w-6 h-6 text-surface" aria-hidden="true" />
            </div>
            <div>
              <span className="font-mono text-sm font-bold uppercase tracking-tight block">
                INKLOOM GUARDIAN
              </span>
              <span className="text-[10px] uppercase font-bold text-ink-3 font-mono tracking-wider block">
                Brand Integrity Platform
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 font-mono text-xs font-bold uppercase">
              <Link href="/demo-report" className="text-ink-2 hover:text-ink underline">
                Sample report
              </Link>
              <Link href="/about-ai" className="text-ink-2 hover:text-ink underline">
                About AI
              </Link>
              <Link href="/build-notes" className="text-ink-2 hover:text-ink underline">
                Build notes
              </Link>
            </div>
            <button
              type="button"
              onClick={() => handleQuickDemo('reviewer')}
              disabled={signingIn}
              className="min-h-11 px-4 py-2 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase flex items-center gap-2 shadow-hard hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              <span>{signingIn ? 'Opening…' : 'Try Demo (1-Click)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 pt-16 md:pt-28 pb-16 md:pb-24 border-b-2 border-ink">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard-sm">
              <span className="w-2 h-2 bg-accent rounded-none inline-block border border-ink" />
              <span>Brand Governance Engine & Quality Verification</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-ink font-sans leading-[0.95]">
              Check before you publish.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-ink-2 font-sans max-w-2xl leading-relaxed pt-2">
              Brand checks that cite the rule, explain the issue, and leave the decision to a human.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleQuickDemo('reviewer')}
                disabled={signingIn}
                className="min-h-11 px-6 py-3.5 bg-accent text-accent-ink border-2 border-ink font-mono text-sm font-bold uppercase flex items-center gap-2 shadow-hard hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
              >
                <span>{signingIn ? 'Signing you in…' : 'Try Demo as Reviewer (1-Click)'}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
              <Link href="/demo-report">
                <Button variant="secondary" size="lg">
                  View sample report
                </Button>
              </Link>
            </div>
            {/* Quick persona switcher pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 font-mono text-xs">
              <span className="text-ink-3 uppercase font-bold text-[11px]">Instant Persona:</span>
              <button
                type="button"
                onClick={() => handleQuickDemo('reviewer')}
                className="px-2.5 py-1 border border-ink bg-surface hover:bg-surface-2 font-bold uppercase text-ink shadow-hard-sm"
              >
                Priya (Reviewer)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('creator')}
                className="px-2.5 py-1 border border-ink bg-surface hover:bg-surface-2 font-bold uppercase text-ink shadow-hard-sm"
              >
                Asha (Author)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('manager')}
                className="px-2.5 py-1 border border-ink bg-surface hover:bg-surface-2 font-bold uppercase text-ink shadow-hard-sm"
              >
                Marcus (Admin)
              </button>
              <Link
                href="/login"
                className="px-2.5 py-1 text-ink-2 underline hover:text-ink text-[11px] uppercase font-bold ml-1"
              >
                All personas & sign-in →
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Proof Strip: Real Static Component Rendering */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 md:py-24 border-b-2 border-ink space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <SectionLabel number="01" title="Example from the demo workspace" />
            <span className="font-mono text-xs text-ink-3 uppercase">
              SEEDED DEMO CONTENT · 2 CITED FINDINGS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Highlighted Content Preview */}
            <div className="lg:col-span-5 p-6 md:p-8 border-2 border-ink bg-surface shadow-hard space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-ink-3 block">
                Draft Marketing Copy:
              </span>
              <p className="text-lg md:text-xl leading-relaxed text-ink font-sans">
                &ldquo;Our panels are the{' '}
                <mark className="bg-severity-blocker/40 text-ink px-1 border-b-2 border-ink font-semibold">
                  best on the market
                </mark>{' '}
                and guarantee{' '}
                <mark className="bg-severity-major/50 text-ink px-1 border-b-2 border-dashed border-ink font-semibold">
                  40% savings
                </mark>{' '}
                on every residential energy bill.&rdquo;
              </p>
              <div className="pt-4 border-t-2 border-rule text-xs font-mono text-ink-2">
                Clicking any highlighted phrase scrolls directly to the citing rule card.
              </div>
            </div>

            {/* Right: Actual Finding Cards */}
            <div className="lg:col-span-7 space-y-4">
              <FindingCard finding={sampleFinding1} readOnly />
              <FindingCard finding={sampleFinding2} readOnly />
            </div>
          </div>
        </section>

        {/* 4. How It Works: 4-Column Bordered Grid */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 md:py-24 border-b-2 border-ink space-y-8">
          <SectionLabel number="02" title="How It Works" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-ink bg-surface divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-ink shadow-hard">
            {[
              {
                step: '01',
                title: 'Submit',
                desc: 'Paste or upload content drafts into the intake workspace in markdown, text, docx, or pdf.',
              },
              {
                step: '02',
                title: 'Check',
                desc: 'The 100% deterministic engine checks 13 rules and 6 facts locally in < 1 ms. An optional Gemini AI adapter provides advisory suggestions; it never approves.',
              },
              {
                step: '03',
                title: 'Review',
                desc: 'Reviewers view exact citations, rule keys, and suggestions. Blockers prevent accidental publication.',
              },
              {
                step: '04',
                title: 'Decide',
                desc: 'A designated reviewer approves or requests changes with mandatory audit justifications.',
              },
            ].map((col) => (
              <div key={col.step} className="p-6 md:p-8 space-y-3">
                <span className="px-2 py-0.5 bg-ink text-surface font-mono text-xs font-bold">
                  {col.step}
                </span>
                <h3 className="text-xl font-bold text-ink">{col.title}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. What It Won't Do Block */}
        <section className="max-w-[1280px] mx-auto px-6 md:px-8 py-16 md:py-24 space-y-6">
          <SectionLabel number="03" title="Ethical Boundary" />

          <div className="p-8 md:p-12 border-2 border-ink bg-surface shadow-hard space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
              The AI never approves. A human decides.
            </h2>
            <p className="text-base md:text-lg text-ink-2 max-w-3xl leading-relaxed">
              Every approval is tied to the exact content hash and rule-set version. No automatic merges, no silent overrides, and no black-box decision making.
            </p>
            <div className="pt-2">
              <Link href="/about-ai">
                <Button variant="secondary">
                  <span>Read our AI disclosure & privacy guarantee</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t-2 border-ink bg-surface px-6 md:px-8 py-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-2">
          <p>Demo mode uses fictional data. Built for hackathon evaluation.</p>
          <div className="flex flex-wrap items-center gap-6 font-bold uppercase">
            <Link href="/demo-report" className="hover:text-ink underline">
              Sample report
            </Link>
            <Link href="/about-ai" className="hover:text-ink underline">
              About AI
            </Link>
            <Link href="/build-notes" className="hover:text-ink underline">
              Build notes
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
