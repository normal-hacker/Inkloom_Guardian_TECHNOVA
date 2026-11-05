'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Cpu, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function AboutAiPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">Inkloom Guardian</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Public Disclosure
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif mt-3">
            About AI, Safety & Privacy Guardrails
          </h1>
          <p className="mt-2 text-base text-slate-600 leading-relaxed">
            Inkloom Guardian is built on a principle of honest labeling: we combine deterministic rule verification with bounded AI assistance.
          </p>
        </div>

        {/* 4 Architectural Guardrails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900">1. Deterministic Rule Engine First</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              All 13 core brand rules (claims, superlatives, prohibited terms, numeric ranges) are evaluated in pure TypeScript without any network dependencies or LLMs. This delivers sub-2ms latency and 100% reproducible results.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900">2. Pre-Call PII & Secret Redaction</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before text is sent to an external model (Gemini or Mock), emails, phone numbers, and confidential codenames (e.g. &ldquo;Project Helios&rdquo;) are replaced with tokens (<code>[REDACTED_EMAIL_1]</code>). Spans are restored locally after validation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900">3. Strict Grounding Constraint</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every finding must satisfy <code>text.slice(spanStart, spanEnd) === quote</code> and link to a recognized rule or approved fact. Any hallucinated rule keys or ungrounded quotes from the AI are automatically discarded by the validator.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-slate-900">4. Human Decision Sovereign</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The AI never approves content. Content with open blocker findings cannot be approved until a human reviewer explicitly resolves or overrides them with a logged rationale.
            </p>
          </div>
        </div>

        {/* AI Model Disclosures */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-slate-900">Supported AI Adapters</h2>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">Mock Provider (Default Hackathon Mode)</p>
              <p className="text-slate-500 mt-0.5">
                Always-on deterministic AI adapter labeled clearly as <code>demo AI (mock)</code>. Never pretends to be a cloud LLM.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900">Google Gemini Provider (Optional)</p>
              <p className="text-slate-500 mt-0.5">
                Activated when <code>GEMINI_API_KEY</code> is present. If the external API fails 3 times, a circuit-breaker automatically falls back to the deterministic engine without breaking user workflows.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Inkloom Guardian · Round 2 Submission Public Disclosure
      </footer>
    </div>
  );
}
