'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { ExpandableTabs, TabItem } from '@/components/ui/expandable-tabs';
import {
  Library,
  ListChecks,
  BookA,
  BadgeCheck,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

function GuidelinesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [activeData, setActiveData] = useState<any>(null);
  const [draftData, setDraftData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // YAML import state
  const [yamlText, setYamlText] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [yamlSuccess, setYamlSuccess] = useState<string | null>(null);

  const loadGuidelines = async () => {
    try {
      const res = await fetch('/api/v1/guidelines/active');
      if (res.ok) {
        const data = await res.json();
        setActiveData(data);
      }

      const dRes = await fetch('/api/v1/guidelines/draft');
      if (dRes.ok) {
        const dData = await dRes.json();
        setDraftData(dData);
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

  const isManager = currentUser && currentUser.role === 'manager';

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
      const res = await fetch('/api/v1/guidelines/activate-draft', { method: 'POST' });
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

  // Guidelines Tab Configuration
  const tabDefs: TabItem[] = [
    {
      id: 'sources',
      title: 'Sources',
      icon: Library,
      badgeLabel: 'Grounding policy sources',
    },
    {
      id: 'rules',
      title: 'Rules',
      icon: ListChecks,
      badge: activeData?.rules?.length || 13,
      badgeLabel: `Rules, ${activeData?.rules?.length || 13} active`,
    },
    {
      id: 'glossary',
      title: 'Glossary',
      icon: BookA,
      badge: activeData?.glossary?.length || 4,
      badgeLabel: `Glossary, ${activeData?.glossary?.length || 4} terms`,
    },
    {
      id: 'facts',
      title: 'Facts',
      icon: BadgeCheck,
      badge: activeData?.facts?.length || 6,
      badgeLabel: `Facts, ${activeData?.facts?.length || 6} approved`,
    },
    {
      id: 'rulesets',
      title: 'Rule sets',
      icon: GitBranch,
      badgeLabel: 'Rule set versions & draft controls',
    },
  ];

  // Derive active tab from URL query param ?tab=
  const currentTabParam = searchParams.get('tab') || 'rules';
  const foundIndex = tabDefs.findIndex((t) => t.id === currentTabParam);
  const activeTabIndex = foundIndex !== -1 ? foundIndex : 1; // default to rules (index 1)
  const currentTabId = tabDefs[activeTabIndex]?.id || 'rules';

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const selected = tabDefs[index];
    if (!selected || selected.type === 'separator') return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', selected.id);
    router.push(`/guidelines?${params.toString()}`);
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Brand Guidelines & Policy Grounding"
        description="Approved rules, terminology and facts the checks use to evaluate copy."
        chips={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
            Active: {activeData?.ruleSet?.name || `Brightway Solar v${activeData?.ruleSet?.version || 3}`}
          </span>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Guidelines Tabs Switcher */}
        <div className="flex justify-center sm:justify-start">
          <ExpandableTabs
            tabs={tabDefs}
            variant="tabs"
            value={activeTabIndex}
            onChange={handleTabChange}
            ariaLabel="Guidelines sections"
            idPrefix="guidelines-tabs"
            className="bg-white"
          />
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {/* TAB: Sources */}
          {currentTabId === 'sources' && (
            <motion.div
              key="sources"
              role="tabpanel"
              id="guidelines-tabs-panel-sources"
              aria-labelledby="guidelines-tabs-tab-sources"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">Grounding Policy Documentation</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every rule check in Inkloom Guardian cites one of these approved brand & legal documents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Brightway Brand Guidelines (2026-Q1)',
                    section: '§ 3.2 Approved Claims, § 4.1 Prohibited Superlatives',
                    desc: 'Defines acceptable savings claims, prohibited words (#1, best, cheapest), and warranty phrasing standards.',
                    badge: 'Core Policy',
                  },
                  {
                    title: 'Solar Terminology & Phrasing Manual v2.4',
                    section: '§ Terminology Standards & Prohibited Synonyms',
                    desc: 'Authoritative dictionary of preferred terminology (e.g. photovoltaic module vs solar slab).',
                    badge: 'Glossary Grounding',
                  },
                  {
                    title: 'Approved Performance Metrics Sheet 2025-Q3',
                    section: '§ Verified Fact Sheet (NUM-001)',
                    desc: 'Numeric fact registry: efficiency ranges (18.5% - 22.8%), warranty periods (25 years), payback timeline (5-7 years).',
                    badge: 'Numeric Grounding',
                  },
                  {
                    title: 'FTC Clean Energy Advertising Compliance Manual',
                    section: '§ 12 Substantiated Environmental Benefit Claims',
                    desc: 'Federal Trade Commission regulatory standards governing renewable energy and carbon reduction claims.',
                    badge: 'Regulatory',
                  },
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        {doc.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{doc.desc}</p>
                    <p className="text-[11px] font-mono text-slate-500">{doc.section}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: Rules */}
          {currentTabId === 'rules' && (
            <motion.div
              key="rules"
              role="tabpanel"
              id="guidelines-tabs-panel-rules"
              aria-labelledby="guidelines-tabs-tab-rules"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">13 Pure TypeScript Rules (Deterministic & Grounded)</span>
                <span className="text-slate-500">Sub-2ms Latency · 0 External Calls</span>
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
                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      {r.sourceSection ? `§ ${r.sourceSection}` : 'Brand Policy'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: Glossary */}
          {currentTabId === 'glossary' && (
            <motion.div
              key="glossary"
              role="tabpanel"
              id="guidelines-tabs-panel-glossary"
              aria-labelledby="guidelines-tabs-tab-glossary"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6"
            >
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
            </motion.div>
          )}

          {/* TAB: Facts */}
          {currentTabId === 'facts' && (
            <motion.div
              key="facts"
              role="tabpanel"
              id="guidelines-tabs-panel-facts"
              aria-labelledby="guidelines-tabs-tab-facts"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Approved Metrics Sheet 2025-Q3 (NUM-001 Grounding)
              </h3>
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
            </motion.div>
          )}

          {/* TAB: Rule Sets & Manager Controls */}
          {currentTabId === 'rulesets' && (
            <motion.div
              key="rulesets"
              role="tabpanel"
              id="guidelines-tabs-panel-rulesets"
              aria-labelledby="guidelines-tabs-tab-rulesets"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Active & Draft Status */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Rule Set Version Governance</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Rule changes are versioned atomically so past audit logs remain strictly reproducible.
                    </p>
                  </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <span className="text-[10px] font-bold uppercase text-emerald-700">Currently Active</span>
                    <p className="font-bold text-slate-900 text-sm mt-1">
                      {activeData?.ruleSet?.name || 'Brightway Solar'} (Version {activeData?.ruleSet?.version || 3})
                    </p>
                    <p className="text-slate-600 mt-1">{activeData?.rules?.length || 13} rules active across all checks.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Draft Status</span>
                    <p className="font-bold text-slate-900 text-sm mt-1">
                      {draftData ? `Draft v${draftData.ruleSet.version}` : 'No active draft'}
                    </p>
                    <p className="text-slate-600 mt-1">
                      {draftData ? 'Staged changes pending manager activation.' : 'Create a draft to test rule adjustments.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* YAML Import Section (Manager Only) */}
              {isManager && (
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
                      rows={10}
                      placeholder="Paste YAML rules configuration here…"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function GuidelinesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-400 text-xs">Loading guidelines…</div>
        </div>
      }
    >
      <GuidelinesContent />
    </Suspense>
  );
}
