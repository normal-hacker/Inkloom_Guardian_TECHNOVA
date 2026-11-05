'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/../components/Navbar';
import { BookOpen, Shield, FileText, CheckCircle2, Upload, AlertCircle, Sparkles, Layers } from 'lucide-react';

export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'glossary' | 'facts' | 'yaml'>('rules');
  const [activeData, setActiveData] = useState<any>(null);
  const [draftData, setDraftData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [_loading, setLoading] = useState(true);

  // YAML import state
  const [yamlText, setYamlText] = useState(`rules:
  - key: TONE-004
    category: tone
    severity: minor
    title: Respectful Comparisons
    explanation: Avoid disparaging competitors or making derogatory comments about their offerings.
    suggestionHint: focus on our value proposition
    enabled: true`);
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [yamlSuccess, setYamlSuccess] = useState<string | null>(null);

  const loadGuidelines = async () => {
    try {
      const gRes = await fetch('/api/v1/guidelines/active');
      if (gRes.ok) {
        const data = await gRes.json();
        setActiveData(data);
      }

      const dRes = await fetch('/api/v1/guidelines/draft');
      if (dRes.ok) {
        const data = await dRes.json();
        setDraftData(data.draft);
      }

      const uRes = await fetch('/api/v1/auth/me');
      if (uRes.ok) {
        const uData = await uRes.json();
        setCurrentUser(uData.user);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuidelines();
  }, []);

  const isManager = currentUser?.role === 'manager';

  const handleCreateDraft = async () => {
    try {
      const res = await fetch('/api/v1/guidelines/draft', { method: 'POST' });
      if (res.ok) {
        await loadGuidelines();
      }
    } catch {}
  };

  const handleActivateDraft = async () => {
    try {
      const res = await fetch('/api/v1/guidelines/draft/activate', { method: 'POST' });
      if (res.ok) {
        await loadGuidelines();
      }
    } catch {}
  };

  const handleImportYaml = async (e: React.FormEvent) => {
    e.preventDefault();
    setYamlError(null);
    setYamlSuccess(null);

    try {
      const res = await fetch('/api/v1/guidelines/import-yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: yamlText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setYamlError(data.message || 'YAML validation failed.');
        return;
      }

      setYamlSuccess(`Successfully imported ${data.count} rules into draft rule set.`);
      await loadGuidelines();
    } catch (err: any) {
      setYamlError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Brand Guidelines & Rule Sets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Active rule pack: {activeData?.ruleSet?.name || `Brightway Solar v${activeData?.ruleSet?.version || 3}`}
            </p>
          </div>

          {/* Manager Draft Actions */}
          {isManager && (
            <div className="flex items-center gap-2">
              {!draftData ? (
                <button
                  onClick={handleCreateDraft}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Create Draft Rule Set (v{(activeData?.ruleSet?.version || 3) + 1})
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                    Draft v{draftData.ruleSet.version} in progress
                  </span>
                  <button
                    onClick={handleActivateDraft}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    Activate v{draftData.ruleSet.version}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rules ({activeData?.rules?.length || 13})
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'glossary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Glossary Terms ({activeData?.glossary?.length || 4})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === 'facts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approved Facts ({activeData?.facts?.length || 6})
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                activeTab === 'yaml'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Import YAML
            </button>
          )}
        </div>

        {/* Tab: Rules */}
        {activeTab === 'rules' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">13 Pure TypeScript Rules (Grounding Sources Attached)</span>
              <span className="text-slate-500">Deterministic · Sub-2ms Latency</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activeData?.rules?.map((r: any) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {r.key}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.severity === 'blocker'
                            ? 'bg-red-100 text-red-800'
                            : r.severity === 'major'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                        {r.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm ml-1">{r.title}</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{r.explanation}</p>
                    {r.suggestionHint && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                        <strong>Fix pattern:</strong> {r.suggestionHint}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {r.sourceSection ? `§ ${r.sourceSection}` : 'Guideline doc'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Glossary */}
        {activeTab === 'glossary' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Approved & Discouraged Terminology</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {activeData?.glossary?.map((t: any) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{t.term}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        t.kind === 'preferred'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.kind === 'banned'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.kind}
                    </span>
                  </div>
                  {t.preferredAlternative && (
                    <p className="text-slate-600">
                      Use instead: <strong className="text-emerald-700">{t.preferredAlternative}</strong>
                    </p>
                  )}
                  {t.note && <p className="text-slate-500 text-[11px] italic">{t.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Approved Facts */}
        {activeTab === 'facts' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Approved Metrics Sheet 2025-Q3 (NUM-001 Grounding)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {activeData?.facts?.map((f: any) => (
                <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {f.key}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Verified 2025</span>
                  </div>
                  <p className="font-bold text-slate-900">{f.statement}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Keywords: {f.searchVector}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: YAML Import (Manager only) */}
        {activeTab === 'yaml' && isManager && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Rule Guidelines from YAML</h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload or paste rules in YAML format. The parser will validate syntax and report exact line numbers if an error occurs.
              </p>
            </div>

            {yamlError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{yamlError}</span>
              </div>
            )}

            {yamlSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{yamlSuccess}</span>
              </div>
            )}

            <form onSubmit={handleImportYaml} className="space-y-4">
              <textarea
                value={yamlText}
                onChange={(e) => setYamlText(e.target.value)}
                rows={12}
                className="w-full p-4 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-900 text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Validate & Import into Draft
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
