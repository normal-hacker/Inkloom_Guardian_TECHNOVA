'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Lock, Cpu, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handleQuickDemo = async (role: string) => {
    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Inkloom Guardian</span>
              <span className="ml-2 text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                Round 2 Build
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/demo-report"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:inline-block"
            >
              Sample Report
            </Link>
            <Link
              href="/about-ai"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:inline-block"
            >
              About AI
            </Link>
            <Link
              href="/build-notes"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:inline-block"
            >
              Build Notes
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              Sign In / Demo
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex-1">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Brand Governance · A Human Always Decides</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-serif leading-tight">
            Check copy against brand guidelines <span className="text-indigo-600">before</span> you publish.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
            Content goes in. It is verified against approved brand rules, terminology, and facts.
            Every issue cites the exact rule and source document. Fixes are suggested, never auto-applied.
          </p>

          {/* Quick Demo Access Buttons */}
          <div className="mt-10 p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Instant Hackathon Judge Access — Click Any Role (No Sign-Up)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => handleQuickDemo('creator')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">Asha</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Creator
                  </span>
                </div>
                <p className="text-xs text-slate-500">Intake content & apply suggestions</p>
              </button>

              <button
                onClick={() => handleQuickDemo('creator')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">Ben</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Creator
                  </span>
                </div>
                <p className="text-xs text-slate-500">Second author for isolation tests</p>
              </button>

              <button
                onClick={() => handleQuickDemo('reviewer')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">Priya</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Reviewer
                  </span>
                </div>
                <p className="text-xs text-slate-500">Approve, request changes, or reject</p>
              </button>

              <button
                onClick={() => handleQuickDemo('manager')}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">Marcus</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Manager
                  </span>
                </div>
                <p className="text-xs text-slate-500">Rules, insights & audit CSV export</p>
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 italic">
              Workflow hint: Log in as Asha to submit copy → switch to Priya to review & approve.
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Grounded Citations</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every finding quotes the exact snippet, highlights it with UTF-16 offsets, and links to the official guideline document and section.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Blocker Gate & Human Sign-Off</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The AI never approves content. Content with open blocker findings cannot be approved until a human reviewer resolves, dismisses, or overrides them with a reason.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Deterministic Engine & PII Redaction</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              13 brand rules run in pure TypeScript in under 2ms. PII and confidential terms are redacted before reaching optional external AI providers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Inkloom Guardian</span>
            <span>· Round 2 &ldquo;The Build&rdquo; Prototype</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-slate-600">
            <Link href="/demo-report" className="hover:text-indigo-600">Demo Report</Link>
            <Link href="/about-ai" className="hover:text-indigo-600">About AI & Privacy</Link>
            <Link href="/build-notes" className="hover:text-indigo-600">Build Notes</Link>
            <Link href="/selftest" className="hover:text-indigo-600">Engine Self-Test</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
