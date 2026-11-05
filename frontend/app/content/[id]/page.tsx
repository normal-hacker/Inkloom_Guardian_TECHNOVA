'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/../components/Navbar';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  GitCompare,
  MessageSquare,
  History,
  FileCheck,
  RotateCcw,
  Send,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface Finding {
  id: string;
  origin: string;
  category: string;
  severity: 'blocker' | 'major' | 'minor' | 'info';
  ruleId?: string;
  ruleKey?: string;
  ruleTitle?: string;
  sourceDoc?: string;
  sourceSection?: string;
  factKey?: string;
  spanStart: number;
  spanEnd: number;
  quote: string;
  explanation: string;
  suggestion?: string;
  confidence: string;
  status: 'open' | 'fixed' | 'dismissed' | 'overridden';
}

interface ContentVersion {
  id: string;
  versionNo: number;
  textBody: string;
  contentHash: string;
  changeNote?: string;
  createdAt: string;
}

interface CommentItem {
  id: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

interface AuditItem {
  id: number;
  timestamp: string;
  action: string;
  actorEmail?: string;
  actorRole?: string;
  detail: Record<string, unknown>;
}

export default function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [content, setContent] = useState<any>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersionNo, setSelectedVersionNo] = useState<number>(1);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'audit'>('comments');
  const [showDiff, setShowDiff] = useState(false);
  const [diffItems, setDiffItems] = useState<any[]>([]);

  // Finding filter
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals / forms
  const [decisionModal, setDecisionModal] = useState<{
    type: 'dismiss' | 'override' | 'changes' | 'reject';
    findingId?: string;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // 1. Content details
      const cRes = await fetch(`/api/v1/content/${id}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setContent(cData.item);
        if (cData.item.currentVersionNo) {
          setSelectedVersionNo(cData.item.currentVersionNo);
        }
      }

      // 2. Versions
      const vRes = await fetch(`/api/v1/content/${id}/versions`);
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersions(vData.versions || []);
      }

      // 3. Findings
      const fRes = await fetch(`/api/v1/content/${id}/findings`);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindings(fData.findings || []);
      }

      // 4. Comments
      const commRes = await fetch(`/api/v1/content/${id}/comments`);
      if (commRes.ok) {
        const commData = await commRes.json();
        setComments(commData.comments || []);
      }

      // 5. Current User
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
    loadData();
  }, [id]);

  const currentVersion = versions.find((v) => v.versionNo === selectedVersionNo) || versions[0];

  // Run Check
  const handleRunCheck = async () => {
    setChecking(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/content/${id}/check`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Check failed.');
      }
      setActionSuccess('Check completed successfully.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setChecking(false);
    }
  };

  // Submit Content
  const handleSubmitForReview = async () => {
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/content/${id}/submit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Submit failed.');
      }
      setActionSuccess('Content submitted for human review.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Apply suggestion
  const handleApplySuggestion = async (finding: Finding) => {
    if (!finding.suggestion) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/v1/content/${id}/apply-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionNo: currentVersion.versionNo,
          spanStart: finding.spanStart,
          spanEnd: finding.spanEnd,
          quote: finding.quote,
          suggestion: finding.suggestion,
          ruleKey: finding.ruleKey || 'RULE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply suggestion.');
      }

      setActionSuccess(`Applied suggestion. Created Version ${data.versionNo}.`);
      await loadData();
      // Auto run check on new version
      await fetch(`/api/v1/content/${id}/check`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Submit Decision on Finding
  const handleFindingDecisionSubmit = async () => {
    if (!decisionModal || !decisionModal.findingId) return;
    setActionError(null);

    try {
      const decisionKind = decisionModal.type === 'dismiss' ? 'dismissed' : 'overridden';
      const res = await fetch(`/api/v1/findings/${decisionModal.findingId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionKind,
          reason: modalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record decision.');
      }

      setDecisionModal(null);
      setModalReason('');
      setActionSuccess(`Finding marked as ${decisionKind}.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Reviewer Decision on Content (Approve, Request Changes, Reject)
  const handleContentDecision = async (decision: 'approved' | 'changes_requested' | 'rejected', notes?: string) => {
    setActionError(null);

    try {
      const res = await fetch(`/api/v1/content/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to record decision (${data.error}).`);
      }

      setDecisionModal(null);
      setModalReason('');
      setActionSuccess(`Content decision recorded: ${decision}.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Post comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/v1/content/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentVersionId: currentVersion?.id,
          body: commentText.trim(),
        }),
      });

      if (res.ok) {
        setCommentText('');
        const commRes = await fetch(`/api/v1/content/${id}/comments`);
        if (commRes.ok) {
          const commData = await commRes.json();
          setComments(commData.comments || []);
        }
      }
    } catch {}
  };

  // Compute text chunks with highlighted spans
  const renderHighlightedText = () => {
    if (!currentVersion?.textBody) return null;
    const text = currentVersion.textBody;

    // Filter active open findings with spans
    const activeSpans = findings
      .filter((f) => f.status === 'open' && f.spanStart >= 0 && f.spanEnd <= text.length)
      .sort((a, b) => a.spanStart - b.spanStart);

    if (activeSpans.length === 0) {
      return <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">{text}</div>;
    }

    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    activeSpans.forEach((f, i) => {
      // Un-highlighted text before finding
      if (f.spanStart > lastIdx) {
        elements.push(
          <span key={`plain-${lastIdx}`}>
            {text.slice(lastIdx, f.spanStart)}
          </span>
        );
      }

      // Underline / highlight style based on severity
      let styleClass = 'border-b-2 border-blue-500 bg-blue-50/70 text-blue-950';
      if (f.severity === 'blocker') {
        styleClass = 'border-b-2 border-red-600 bg-red-50 text-red-950 font-semibold';
      } else if (f.severity === 'major') {
        styleClass = 'border-b-2 border-orange-500 bg-orange-50 text-orange-950 font-semibold';
      } else if (f.severity === 'minor') {
        styleClass = 'border-b-2 border-amber-400 bg-amber-50 text-amber-950';
      }

      const isSelected = selectedFindingId === f.id;

      elements.push(
        <mark
          key={`finding-${f.id}-${i}`}
          onClick={() => setSelectedFindingId(f.id)}
          className={`cursor-pointer px-1 py-0.5 rounded transition-all ${styleClass} ${
            isSelected ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
          }`}
          title={`${f.severity.toUpperCase()} (${f.ruleKey || 'Fact'}): ${f.explanation}`}
        >
          {text.slice(f.spanStart, f.spanEnd)}
        </mark>
      );

      lastIdx = Math.max(lastIdx, f.spanEnd);
    });

    if (lastIdx < text.length) {
      elements.push(
        <span key={`plain-${lastIdx}`}>
          {text.slice(lastIdx)}
        </span>
      );
    }

    return (
      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
        {elements}
      </div>
    );
  };

  const openBlockers = findings.filter((f) => f.severity === 'blocker' && f.status === 'open');
  const isReviewerOrManager = currentUser && ['reviewer', 'manager'].includes(currentUser.role);
  const isAuthor = currentUser && content && content.ownerId === currentUser.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading review workspace…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Workspace Subheader */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              ← Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-bold text-slate-900 truncate max-w-md">{content?.title}</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
              {content?.contentType}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                content?.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : content?.status === 'in_review'
                    ? 'bg-amber-100 text-amber-800'
                    : content?.status === 'changes_requested'
                      ? 'bg-orange-100 text-orange-800'
                      : content?.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
              }`}
            >
              {content?.status}
            </span>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            {/* Version dropdown */}
            <select
              value={selectedVersionNo}
              onChange={(e) => setSelectedVersionNo(Number(e.target.value))}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNo}>
                  Version {v.versionNo} {v.versionNo === content?.currentVersionNo ? '(current)' : ''}
                </option>
              ))}
            </select>

            {/* Check Again button */}
            <button
              onClick={handleRunCheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{checking ? 'Checking…' : 'Check Again'}</span>
            </button>

            {/* Submit button (Creator) */}
            {content?.status === 'draft' && (
              <button
                onClick={handleSubmitForReview}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Review Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Copy Viewer with Highlights (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Version {currentVersion?.versionNo} Text
                </h2>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  SHA-256: {currentVersion?.contentHash?.slice(0, 16)}…
                </p>
              </div>
              <div className="text-[11px] text-slate-500">
                {currentVersion?.changeNote && <span>&ldquo;{currentVersion.changeNote}&rdquo;</span>}
              </div>
            </div>

            {/* Rendered Text with Underlines */}
            <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-xl flex-1 overflow-y-auto min-h-[320px]">
              {renderHighlightedText()}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Blocker
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Major
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Minor
                </span>
              </div>
              <span>Click any highlighted span to view rule details</span>
            </div>
          </div>

          {/* Reviewer Human Decision Bar */}
          {isReviewerOrManager && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Human Governance Sign-Off</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    The AI never approves content. You make the final decision.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Blocker Gate Warning */}
                  {openBlockers.length > 0 && (
                    <div className="w-full sm:w-auto text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{openBlockers.length} open blocker finding(s) must be resolved first.</span>
                    </div>
                  )}

                  {/* Self-approval prevention */}
                  {isAuthor && (
                    <div className="w-full text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                      Self-approval forbidden: Authors cannot approve their own copy.
                    </div>
                  )}

                  {/* Decision Buttons */}
                  <button
                    disabled={openBlockers.length > 0 || isAuthor}
                    onClick={() => handleContentDecision('approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      openBlockers.length > 0
                        ? 'Approval blocked: open blockers remain'
                        : isAuthor
                          ? 'Self-approval forbidden'
                          : 'Approve content'
                    }
                  >
                    Approve Copy
                  </button>

                  <button
                    onClick={() => setDecisionModal({ type: 'changes' })}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => setDecisionModal({ type: 'reject' })}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Findings Panel & Tabs (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Findings List Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Brand Rule Findings</h2>
                <p className="text-xs text-slate-500">
                  {findings.filter((f) => f.status === 'open').length} open / {findings.length} total
                </p>
              </div>

              {/* Severity Filter pills */}
              <div className="flex items-center gap-1">
                {['all', 'blocker', 'major', 'minor'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                      severityFilter === sev
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings Scroll Area */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {findings
                .filter((f) => severityFilter === 'all' || f.severity === severityFilter)
                .map((f) => {
                  const isSelected = selectedFindingId === f.id;
                  const isBlocker = f.severity === 'blocker';

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFindingId(f.id)}
                      className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/20'
                          : f.status !== 'open'
                            ? 'border-slate-200 bg-slate-50/60 opacity-60'
                            : isBlocker
                              ? 'border-red-200 bg-red-50/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              f.severity === 'blocker'
                                ? 'bg-red-100 text-red-800'
                                : f.severity === 'major'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                            {f.category}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {f.ruleKey || f.factKey}
                          </span>
                        </div>

                        {/* Origin chip */}
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                          {f.origin === 'rule' ? 'Deterministic Rule' : 'AI Analysis'}
                        </span>
                      </div>

                      {/* Quoted issue */}
                      <p className="text-slate-700 mb-1.5">
                        <span className="text-slate-400 font-semibold">Flagged: </span>
                        <span className="font-bold underline decoration-slate-400">&ldquo;{f.quote}&rdquo;</span>
                      </p>

                      {/* Explanation */}
                      <p className="text-slate-600 text-[11px] leading-relaxed mb-2.5">
                        {f.explanation}
                      </p>

                      {/* Source Citation */}
                      {f.sourceDoc && (
                        <div className="mb-3 px-2 py-1.5 bg-slate-100/70 rounded-lg flex items-center gap-1.5 text-[11px] text-slate-600">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>
                            Source: <strong>{f.sourceDoc}</strong> {f.sourceSection && `§ ${f.sourceSection}`}
                          </span>
                        </div>
                      )}

                      {/* Suggestion pill */}
                      {f.suggestion && f.status === 'open' && (
                        <div className="mb-3 p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between gap-2">
                          <div className="text-[11px] text-emerald-900">
                            <span className="font-bold text-emerald-700">Suggested Fix: </span>
                            &ldquo;{f.suggestion}&rdquo;
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplySuggestion(f);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-sm transition-all flex items-center gap-1"
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Finding Actions (Dismiss / Override) */}
                      {f.status === 'open' ? (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDecisionModal({ type: 'dismiss', findingId: f.id });
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Dismiss…
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDecisionModal({ type: 'override', findingId: f.id });
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Override…
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold uppercase text-slate-400 pt-1">
                          Status: {f.status}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bottom Tabs: Comments, History, Audit */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-2 mb-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History ({versions.length})</span>
              </button>
            </div>

            {/* Comments Tab Content */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No comments yet.</p>
                  ) : (
                    comments.map((comm) => (
                      <div key={comm.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{comm.authorName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{comm.body}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Leave a review comment or note…"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}

            {/* History Tab Content */}
            {activeTab === 'history' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      v.versionNo === selectedVersionNo
                        ? 'border-indigo-400 bg-indigo-50/30 font-semibold'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">Version {v.versionNo}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{v.changeNote || 'Draft revision'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{v.contentHash.slice(0, 16)}…</p>
                    </div>
                    <button
                      onClick={() => setSelectedVersionNo(v.versionNo)}
                      className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-bold text-indigo-600 hover:bg-slate-50"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Decision / Reason Modal */}
      {decisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              {decisionModal.type === 'dismiss'
                ? 'Dismiss Finding'
                : decisionModal.type === 'override'
                  ? 'Override Finding'
                  : decisionModal.type === 'changes'
                    ? 'Request Changes'
                    : 'Reject Content'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              A clear reason of at least 10 characters is required for accountability and audit logging.
            </p>

            <textarea
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              rows={4}
              placeholder="Provide a specific rationale (minimum 10 characters)…"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecisionModal(null);
                  setModalReason('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalReason.trim().length < 10}
                onClick={() => {
                  if (decisionModal.type === 'dismiss' || decisionModal.type === 'override') {
                    handleFindingDecisionSubmit();
                  } else if (decisionModal.type === 'changes') {
                    handleContentDecision('changes_requested', modalReason);
                  } else if (decisionModal.type === 'reject') {
                    handleContentDecision('rejected', modalReason);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
