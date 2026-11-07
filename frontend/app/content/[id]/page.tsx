'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ExpandableTabs, TabItem } from '@/components/ui/expandable-tabs';
import { FindingCard } from '@/components/ui/finding-card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { SectionLabel } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import {
  RotateCcw,
  Send,
  Loader2,
  ScrollText,
  FileText,
  MessageSquare,
  History,
  OctagonX,
  TriangleAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { Finding, ContentVersion, ContentItem } from '@/lib/domain/types';
import { useOptimisticMutation } from '@/lib/optimistic/useOptimisticMutation';
import { PendingBadge } from '@/components/ui/pending-badge';
import { InlineRetry } from '@/components/ui/inline-retry';

interface CommentItem {
  id: string;
  authorEmail: string;
  authorRole: string;
  body: string;
  createdAt: string;
  __pending?: boolean;
  clientRequestId?: string;
}

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail?: string;
  actorRole?: string;
  createdAt: string;
  detail?: unknown;
}

export default function ReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [content, setContent] = useState<ContentItem | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersionNo, setSelectedVersionNo] = useState<number>(1);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: string; displayName?: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isDecisionPending, setIsDecisionPending] = useState(false);
  const [commentAnnouncement, setCommentAnnouncement] = useState('');
  const [activeBottomTabIndex, setActiveBottomTabIndex] = useState<number>(0);
  const [mobileTabIndex, setMobileTabIndex] = useState<number>(0);

  // Finding filter
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals / forms
  const [decisionModal, setDecisionModal] = useState<{
    type: 'dismiss' | 'override' | 'changes' | 'reject';
    findingId?: string;
  } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Optimistic UI for comments
  const commentMutation = useOptimisticMutation<CommentItem[], string, CommentItem>({
    action: 'comment.add',
    initialState: [],
    apply: (current, text, clientRequestId) => {
      const tempItem: CommentItem = {
        id: `temp-${clientRequestId}`,
        clientRequestId,
        __pending: true,
        authorEmail: currentUser?.email || 'user@brightway.example',
        authorRole: currentUser?.role || 'reviewer',
        body: text,
        createdAt: new Date().toISOString(),
      };
      return [tempItem, ...current];
    },
    mutate: async (text, { signal, idempotencyKey, clientRequestId }) => {
      const res = await fetch(`/api/v1/content/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Client-Request-Id': clientRequestId,
        },
        body: JSON.stringify({
          contentVersionId: currentVersion?.id,
          body: text,
        }),
        signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, status: res.status, errorJson: data, headers: res.headers };
      }
      return { ok: true, status: res.status, data, headers: res.headers };
    },
    reconcile: (current, serverComment, clientRequestId) => {
      return current.map((c) =>
        c.clientRequestId === clientRequestId || c.id === `temp-${clientRequestId}`
          ? {
              ...serverComment,
              id: serverComment.id,
              authorEmail: serverComment.authorEmail || c.authorEmail,
              authorRole: serverComment.authorRole || c.authorRole,
              body: serverComment.body,
              createdAt: serverComment.createdAt || c.createdAt,
              __pending: false,
            }
          : c
      );
    },
    onSuccess: () => {
      setCommentText('');
      setCommentAnnouncement('Comment added.');
    },
    onError: (err, restoredInput) => {
      setCommentText(restoredInput);
      setCommentAnnouncement(`Comment not saved: ${err.message}`);
    },
  });

  const deleteCommentMutation = useOptimisticMutation<CommentItem[], string, { success: boolean; id: string }>({
    action: 'comment.delete',
    initialState: [],
    apply: (current, commentId) => {
      return current.filter((c) => c.id !== commentId);
    },
    mutate: async (commentId, { signal, idempotencyKey }) => {
      const res = await fetch(`/api/v1/content/${id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, status: res.status, errorJson: data, headers: res.headers };
      }
      return { ok: true, status: res.status, data, headers: res.headers };
    },
    reconcile: (current) => current,
    onSuccess: () => {
      setCommentAnnouncement('Comment deleted.');
    },
    onError: (err) => {
      setCommentAnnouncement(`Failed to delete comment: ${err.message}`);
    },
  });

  const loadData = useCallback(async () => {
    try {
      const cRes = await fetch(`/api/v1/content/${id}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setContent(cData.item);
        if (cData.item.currentVersionNo) {
          setSelectedVersionNo(cData.item.currentVersionNo);
        }
      }

      const vRes = await fetch(`/api/v1/content/${id}/versions`);
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersions(vData.versions || []);
      }

      const fRes = await fetch(`/api/v1/content/${id}/findings`);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindings(fData.findings || []);
      }

      const commRes = await fetch(`/api/v1/content/${id}/comments`);
      if (commRes.ok) {
        const commData = await commRes.json();
        const loaded = commData.comments || [];
        commentMutation.setState(loaded);
        deleteCommentMutation.setState(loaded);
      }

      let userRole: string | undefined;
      const uRes = await fetch('/api/v1/auth/me');
      if (uRes.ok) {
        const uData = await uRes.json();
        setCurrentUser(uData.user);
        userRole = uData.user?.role;
      }

      if (userRole === 'reviewer' || userRole === 'manager') {
        const aRes = await fetch(`/api/v1/audit?limit=50`);
        if (aRes.ok) {
          const aData = await aRes.json();
          const list = Array.isArray(aData.items) ? aData.items : [];
          const filtered = list.filter(
            (item: { entityId?: string; detail?: { contentId?: string }; action?: string }) =>
              item.entityId === id ||
              item.detail?.contentId === id ||
              item.action?.includes('content')
          );
          setAuditLogs(filtered.length > 0 ? filtered : list.slice(0, 5));
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id, commentMutation, deleteCommentMutation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentVersion =
    versions.find((v) => (v.versionNo || v.version_no) === selectedVersionNo) ||
    versions[versions.length - 1];

  const handleRunCheck = async () => {
    setChecking(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/content/${id}/check`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Check failed to run.');
      }
      setActionSuccess('Content checks completed successfully.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setChecking(false);
    }
  };

  const handleApplySuggestion = async (findingId: string, suggestion: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/content/${id}/apply-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, suggestion }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply suggestion.');
      }
      setActionSuccess(`Suggestion applied. Created version ${data.newVersionNo}.`);
      await loadData();
      if (data.newVersionNo) {
        setSelectedVersionNo(data.newVersionNo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleFindingDecisionConfirm = async (reason?: string) => {
    if (!decisionModal || !decisionModal.findingId) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/v1/findings/${decisionModal.findingId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionModal.type === 'dismiss' ? 'dismissed' : 'overridden',
          reason: reason?.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record decision.');
      }

      setDecisionModal(null);
      setActionSuccess(`Finding ${decisionModal.type === 'dismiss' ? 'dismissed' : 'overridden'} successfully.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleSubmitForReview = async () => {
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/content/${id}/submit`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit content.');
      }
      setActionSuccess('Content submitted for review.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleContentDecision = async (decision: 'approved' | 'changes_requested' | 'rejected', reason?: string) => {
    setActionError(null);
    setIsDecisionPending(true);
    try {
      const res = await fetch(`/api/v1/content/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || (typeof data.error === 'object' ? data.error.message : data.error) || 'Failed to record content decision.');
      }

      setDecisionModal(null);
      setActionSuccess(`Content decision recorded: ${decision}.`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setIsDecisionPending(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentMutation.isBusy) return;
    const textToSubmit = commentText.trim();
    setCommentText('');
    await commentMutation.mutate(textToSubmit);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deleteCommentMutation.isBusy) return;
    await deleteCommentMutation.mutate(commentId);
  };

  const renderHighlightedText = () => {
    const text = currentVersion?.textBody || currentVersion?.text_body;
    if (!text) return null;

    const activeSpans = findings
      .filter((f) => {
        const s = f.spanStart ?? f.span_start;
        const e = f.spanEnd ?? f.span_end;
        return f.status === 'open' && s !== undefined && e !== undefined && s >= 0 && e <= text.length;
      })
      .sort((a, b) => (a.spanStart ?? a.span_start ?? 0) - (b.spanStart ?? b.span_start ?? 0));

    if (activeSpans.length === 0) {
      return <div className="whitespace-pre-wrap font-sans text-base leading-7 text-ink">{text}</div>;
    }

    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    activeSpans.forEach((f, i) => {
      const s = f.spanStart ?? f.span_start ?? 0;
      const e = f.spanEnd ?? f.span_end ?? 0;

      if (s > lastIdx) {
        elements.push(<span key={`plain-${lastIdx}`}>{text.slice(lastIdx, s)}</span>);
      }

      let highlightClass = 'bg-severity-info text-ink border-b-2 border-ink';
      if (f.severity === 'blocker') {
        highlightClass = 'bg-severity-blocker/50 text-ink border-b-[3px] border-ink font-semibold';
      } else if (f.severity === 'major') {
        highlightClass = 'bg-severity-major/50 text-ink border-b-2 border-dashed border-ink font-semibold';
      } else if (f.severity === 'minor') {
        highlightClass = 'bg-severity-minor/50 text-ink border-b-2 border-dotted border-ink';
      }

      const isSelected = selectedFindingId === f.id;

      elements.push(
        <mark
          key={`finding-${f.id}-${i}`}
          onClick={() => setSelectedFindingId(f.id)}
          className={`cursor-pointer px-1 py-0.5 rounded-none transition-all ${highlightClass} ${
            isSelected ? 'outline-3 outline-focus outline-offset-2' : ''
          }`}
          title={`${f.severity.toUpperCase()} (${f.ruleKey || f.rule_key || 'Fact'}): ${f.explanation}`}
        >
          {text.slice(s, e)}
        </mark>
      );

      lastIdx = Math.max(lastIdx, e);
    });

    if (lastIdx < text.length) {
      elements.push(<span key={`plain-${lastIdx}`}>{text.slice(lastIdx)}</span>);
    }

    return <div className="whitespace-pre-wrap font-sans text-base leading-7 text-ink">{elements}</div>;
  };

  const openBlockers = findings.filter((f) => f.severity === 'blocker' && f.status === 'open');
  const openFindings = findings.filter((f) => f.status === 'open');
  const isReviewerOrManager = currentUser && ['reviewer', 'manager'].includes(currentUser.role);
  const isAuthor = currentUser && content && (content.ownerId === currentUser.id || content.owner_id === currentUser.id);

  const bottomTabs: TabItem[] = [
    {
      id: 'comments',
      title: 'Comments',
      icon: MessageSquare,
      badge: commentMutation.state.length,
      badgeLabel: `Comments, ${commentMutation.state.length} total`,
    },
    {
      id: 'history',
      title: 'History',
      icon: History,
      badge: versions.length,
      badgeLabel: `History, ${versions.length} versions`,
    },
    ...(isReviewerOrManager
      ? [
          {
            id: 'audit',
            title: 'Audit',
            icon: ScrollText,
            badge: auditLogs.length,
            badgeLabel: `Audit log, ${auditLogs.length} events`,
          },
        ]
      : []),
  ];

  const mobileTabs: TabItem[] = [
    {
      id: 'content',
      title: 'Content',
      icon: FileText,
    },
    {
      id: 'findings',
      title: 'Findings',
      icon: TriangleAlert,
      badge: openFindings.length,
      badgeLabel: `Findings, ${openFindings.length} open`,
    },
  ];

  const activeBottomTab = bottomTabs[activeBottomTabIndex] || bottomTabs[0];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-paper text-ink">
        <div className="flex items-center gap-3 text-ink-2 font-mono text-xs font-bold uppercase">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span>Loading review workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink min-h-screen pb-28">
      {/* Workspace Subheader */}
      <div className="border-b-2 border-ink bg-surface px-6 md:px-8 py-4 shrink-0">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard" className="text-xs font-mono font-bold text-ink-2 hover:text-ink underline">
              ← Dashboard
            </Link>
            <span className="text-rule font-mono">/</span>
            <h1 className="text-lg font-bold text-ink truncate max-w-md font-sans">
              {content?.title}
            </h1>
            <StatusPill status={content?.status || 'draft'} />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedVersionNo}
              onChange={(e) => setSelectedVersionNo(Number(e.target.value))}
              className="text-xs font-mono font-bold px-3 py-1.5 border-2 border-ink bg-surface text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.versionNo || v.version_no}>
                  v{v.versionNo || v.version_no} { (v.versionNo || v.version_no) === (content?.currentVersionNo || content?.current_version_id) ? '(current)' : ''}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunCheck}
              disabled={checking}
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1 ${checking ? 'animate-spin text-accent' : ''}`} />
              <span>{checking ? 'Checking…' : 'Check again'}</span>
            </Button>

            {content?.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitForReview}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Submit for review</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action alerts */}
      {actionError && (
        <div
          role="alert"
          className="bg-severity-blocker border-b-2 border-ink px-6 py-2.5 text-xs font-mono font-medium text-ink flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <OctagonX className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-status-approved border-b-2 border-ink px-6 py-2.5 text-xs font-mono font-bold text-ink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Switcher (< 1024px) */}
      <div className="lg:hidden flex justify-center px-4 pt-4">
        <ExpandableTabs
          tabs={mobileTabs}
          variant="tabs"
          value={mobileTabIndex}
          onChange={(idx) => setMobileTabIndex(idx ?? 0)}
          ariaLabel="Switch content or findings view"
          idPrefix="mobile-workspace"
        />
      </div>

      {/* Main Split Review Workspace */}
      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Content Pane (7 cols) */}
        <section className={`lg:col-span-7 flex flex-col gap-6 ${mobileTabIndex === 0 ? 'flex' : 'hidden lg:flex'}`}>
          <div className="border-2 border-ink bg-surface p-6 md:p-8 shadow-hard flex flex-col gap-4">
            {/* Run Banner */}
            {openBlockers.length === 0 ? (
              <div className="p-3 border-2 border-ink bg-status-approved text-ink font-mono text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>No blocking issues found by the checks that ran. A human reviewer still decides.</span>
              </div>
            ) : (
              <div className="p-3 border-2 border-ink bg-severity-blocker text-ink font-mono text-xs font-bold flex items-center gap-2">
                <OctagonX className="w-4 h-4 shrink-0" />
                <span>{openBlockers.length} open blocker finding(s) require resolution before approval.</span>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b-2 border-rule">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-ink-3">
                  Version {selectedVersionNo} Draft Copy
                </span>
                <p className="font-mono text-xs text-ink-3 mt-0.5">
                  SHA-256: {currentVersion?.contentHash?.slice(0, 16) || currentVersion?.content_hash?.slice(0, 16)}…
                </p>
              </div>
              {currentVersion?.changeNote && (
                <span className="text-xs font-mono text-ink-2 italic">&ldquo;{currentVersion.changeNote}&rdquo;</span>
              )}
            </div>

            {/* Reading measure text with styled highlights */}
            <div className="p-4 bg-surface-2 border-2 border-ink min-h-64 overflow-y-auto max-w-prose">
              {renderHighlightedText()}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-ink-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-bold">
                  <span className="w-2.5 h-2.5 bg-severity-blocker border border-ink" /> Blocker
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <span className="w-2.5 h-2.5 bg-severity-major border border-ink" /> Major
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <span className="w-2.5 h-2.5 bg-severity-minor border border-ink" /> Minor
                </span>
              </div>
              <span>Click any highlighted span to select finding</span>
            </div>
          </div>

          {/* Bottom Tabs Panel (Comments · History · Audit) */}
          <div className="border-2 border-ink bg-surface p-6 shadow-hard space-y-4">
            <ExpandableTabs
              tabs={bottomTabs}
              variant="tabs"
              value={activeBottomTabIndex}
              onChange={(idx) => setActiveBottomTabIndex(idx ?? 0)}
              ariaLabel="Workspace details and history"
              idPrefix="workspace-bottom"
            />

            <div className="pt-2">
              {activeBottomTab.id === 'comments' && (
                <div className="space-y-4">
                  <div className="sr-only" role="status" aria-live="polite">
                    {commentAnnouncement}
                  </div>

                  {commentMutation.error && (
                    <InlineRetry
                      error={commentMutation.error}
                      onRetry={commentMutation.retry}
                      onDiscard={commentMutation.discard}
                      isRetrying={commentMutation.isBusy}
                    />
                  )}

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an internal reviewer comment…"
                      value={commentText}
                      disabled={commentMutation.isBusy}
                      aria-busy={commentMutation.isBusy}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 min-h-11 px-3.5 py-2 border-2 border-ink bg-surface text-ink text-xs font-sans focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={commentMutation.isBusy || !commentText.trim()}
                      aria-busy={commentMutation.isBusy}
                    >
                      {commentMutation.isBusy ? 'Posting…' : 'Post'}
                    </Button>
                  </form>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {commentMutation.state.length === 0 ? (
                      <p className="text-xs font-mono text-ink-3 italic">No comments posted yet.</p>
                    ) : (
                      commentMutation.state.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 border-2 bg-surface-2 text-xs transition-colors ${
                            c.__pending ? 'border-dashed border-ink' : 'border-rule'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 font-mono text-ink-3 text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{c.authorEmail} ({c.authorRole})</span>
                              {c.__pending && <PendingBadge label="Saving…" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                              {(c.authorEmail === currentUser?.email || currentUser?.role === 'manager') && !c.__pending && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-ink-3 hover:text-severity-blocker transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus p-0.5"
                                  aria-label="Delete comment"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-ink">{c.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeBottomTab.id === 'history' && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVersionNo(v.versionNo || v.version_no || 1)}
                      className="p-3 border-2 border-rule bg-surface-2 hover:bg-surface text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-mono font-bold text-ink">v{v.versionNo || v.version_no}</span>
                        {v.changeNote && <span className="ml-2 text-ink-2">&ldquo;{v.changeNote}&rdquo;</span>}
                      </div>
                      <span className="font-mono text-xs text-ink-3">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeBottomTab.id === 'audit' && (
                <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
                  {auditLogs.length === 0 ? (
                    <p className="text-ink-3 italic">No audit records logged.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 border-2 border-rule bg-surface-2 text-ink flex items-center justify-between">
                        <div>
                          <span className="font-bold uppercase text-accent">{log.action}</span>
                          <span className="ml-2 text-ink-2">by {log.actorEmail || 'System'}</span>
                        </div>
                        <span className="text-ink-3 text-[10px]">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Findings Pane (5 cols) */}
        <section className={`lg:col-span-5 flex flex-col gap-4 ${mobileTabIndex === 1 ? 'flex' : 'hidden lg:flex'}`}>
          <div className="border-2 border-ink bg-surface p-6 shadow-hard flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-rule">
              <div>
                <SectionLabel number="02" title="Cited Findings" />
                <p className="text-xs font-mono text-ink-2 mt-1">
                  {openFindings.length} open / {findings.length} total
                </p>
              </div>

              {/* Severity Filter pills */}
              <div className="flex items-center gap-1">
                {['all', 'blocker', 'major', 'minor'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 border font-mono text-xs font-bold uppercase ${
                      severityFilter === sev
                        ? 'border-ink bg-ink text-surface'
                        : 'border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {findings.filter((f) => severityFilter === 'all' || f.severity === severityFilter).length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-rule">
                  <p className="text-xs font-mono text-ink-3">No findings matching the filter.</p>
                </div>
              ) : (
                findings
                  .filter((f) => severityFilter === 'all' || f.severity === severityFilter)
                  .map((f) => (
                    <FindingCard
                      key={f.id}
                      finding={f}
                      selected={selectedFindingId === f.id}
                      onSelect={() => setSelectedFindingId(f.id)}
                      onApply={(sug) => handleApplySuggestion(f.id, sug)}
                      onDismiss={() => setDecisionModal({ type: 'dismiss', findingId: f.id })}
                      onOverride={() => setDecisionModal({ type: 'override', findingId: f.id })}
                    />
                  ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Human Decision Bar */}
      {isReviewerOrManager && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-2 border-ink px-6 md:px-8 py-4 shadow-hard-lg">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase text-ink-3">
                HUMAN GOVERNANCE GATE:
              </span>
              {openBlockers.length > 0 ? (
                <span className="font-mono text-xs font-bold text-severity-blocker">
                  Blocked: {openBlockers.length} open blocker(s) must be dismissed or resolved.
                </span>
              ) : isAuthor ? (
                <span className="font-mono text-xs font-bold text-severity-blocker">
                  Blocked: Authors cannot self-approve their own submissions.
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-accent">
                  Ready for reviewer approval.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDecisionModal({ type: 'reject' })}
              >
                Reject
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDecisionModal({ type: 'changes' })}
              >
                Request changes
              </Button>

              <Button
                variant="primary"
                size="sm"
                aria-busy={isDecisionPending}
                disabled={openBlockers.length > 0 || isAuthor || isDecisionPending}
                disabledReason={
                  openBlockers.length > 0
                    ? `${openBlockers.length} open blocker(s)`
                    : isAuthor
                      ? 'Self-approval forbidden'
                      : isDecisionPending
                        ? 'Approval in flight…'
                        : undefined
                }
                onClick={() => handleContentDecision('approved')}
              >
                {isDecisionPending ? 'Approving…' : `Approve version ${selectedVersionNo}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Justification Modal */}
      <ConfirmDialog
        open={Boolean(decisionModal)}
        onClose={() => setDecisionModal(null)}
        onConfirm={(reason) => {
          if (decisionModal?.findingId) {
            handleFindingDecisionConfirm(reason);
          } else if (decisionModal?.type === 'changes') {
            handleContentDecision('changes_requested', reason);
          } else if (decisionModal?.type === 'reject') {
            handleContentDecision('rejected', reason);
          }
        }}
        title={
          decisionModal?.type === 'dismiss'
            ? 'Dismiss Finding'
            : decisionModal?.type === 'override'
              ? 'Override Policy Finding'
              : decisionModal?.type === 'changes'
                ? 'Request Changes'
                : 'Reject Submission'
        }
        description="All policy overrides and rejection actions require a verified justification of at least 10 characters for audit compliance."
        requireReason={true}
        variant={decisionModal?.type === 'reject' ? 'destructive' : 'primary'}
        confirmLabel="Confirm Decision"
      />
    </div>
  );
}
