import { describe, it, expect } from 'vitest';
import { isCleared, openBlockers, canApprove, needsRecheck } from '../src/lib/domain/derive';
import { FindingView, ReviewRun } from '../src/lib/domain/types';

describe('Domain Derivations Suite (DOMAIN.md §4)', () => {
  const dummyFinding = (severity: 'blocker' | 'major' | 'minor', status: 'open' | 'fixed' | 'dismissed'): FindingView => ({
    id: 'f-1',
    review_run_id: 'run-1',
    origin: 'rule',
    category: 'claim',
    severity,
    span: { start: 0, end: 5 },
    quote: 'hello',
    explanation: 'issue',
    suggestion: 'hi',
    confidence: 1.0,
    status,
    rule: { key: 'CLAIM-001', title: 'Claim check', rule_set_version: 1 },
    fact: null,
    source: { id: 's-1', title: 'Brand Guide', version_label: 'v1', section: '1.0' },
    decisions: [],
  });

  describe('isCleared', () => {
    it('returns false when run is null or undefined', () => {
      expect(isCleared(null)).toBe(false);
      expect(isCleared(undefined)).toBe(false);
    });

    it('returns false when status is not complete', () => {
      const run: ReviewRun = {
        id: 'r-1',
        content_version_id: 'v-1',
        rule_set_id: 'rs-1',
        rule_set_version: 1,
        status: 'rules_only_ai_failed',
        ai: { used: false, provider: null, model: null },
        counts: { blocker: 0, major: 0, minor: 0, info: 0 },
        started_at: '2026-11-05T00:00:00Z',
        finished_at: '2026-11-05T00:00:01Z',
        error_detail: null,
      };
      expect(isCleared(run)).toBe(false);
    });

    it('returns false when complete but has findings (counts > 0)', () => {
      const run: ReviewRun = {
        id: 'r-1',
        content_version_id: 'v-1',
        rule_set_id: 'rs-1',
        rule_set_version: 1,
        status: 'complete',
        ai: { used: true, provider: 'gemini', model: 'gemini-1.5-flash' },
        counts: { blocker: 1, major: 0, minor: 0, info: 0 },
        started_at: '2026-11-05T00:00:00Z',
        finished_at: '2026-11-05T00:00:01Z',
        error_detail: null,
      };
      expect(isCleared(run)).toBe(false);
    });

    it('returns true ONLY when complete and all severity counts are 0', () => {
      const run: ReviewRun = {
        id: 'r-1',
        content_version_id: 'v-1',
        rule_set_id: 'rs-1',
        rule_set_version: 1,
        status: 'complete',
        ai: { used: true, provider: 'gemini', model: 'gemini-1.5-flash' },
        counts: { blocker: 0, major: 0, minor: 0, info: 0 },
        started_at: '2026-11-05T00:00:00Z',
        finished_at: '2026-11-05T00:00:01Z',
        error_detail: null,
      };
      expect(isCleared(run)).toBe(true);
    });
  });

  describe('openBlockers', () => {
    it('filters strictly blocker severity with open status', () => {
      const list = [
        dummyFinding('blocker', 'open'),
        dummyFinding('blocker', 'dismissed'),
        dummyFinding('major', 'open'),
        dummyFinding('minor', 'open'),
      ];
      const result = openBlockers(list);
      expect(result.length).toBe(1);
      expect(result[0].severity).toBe('blocker');
      expect(result[0].status).toBe('open');
    });
  });

  describe('canApprove', () => {
    const defaultParams = {
      user: { id: 'user-reviewer', role: 'reviewer' as const },
      item: { owner_id: 'user-creator', current_version_id: 'ver-current' },
      version: { id: 'ver-current' },
      run: {
        content_version_id: 'ver-current',
        status: 'complete' as const,
        ai: { used: true, provider: 'gemini', model: 'gemini-1.5' },
      },
      findings: [] as FindingView[],
    };

    it('allows approval when all conditions are satisfied', () => {
      const res = canApprove(defaultParams);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBeUndefined();
    });

    it('allows manager to approve', () => {
      const res = canApprove({
        ...defaultParams,
        user: { id: 'user-manager', role: 'manager' },
      });
      expect(res.allowed).toBe(true);
    });

    it('blocks approval if user is a creator', () => {
      const res = canApprove({
        ...defaultParams,
        user: { id: 'user-creator-2', role: 'creator' },
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/only reviewers and managers/i);
    });

    it('blocks self-approval when reviewer owns the content', () => {
      const res = canApprove({
        ...defaultParams,
        user: { id: 'user-creator', role: 'reviewer' },
        item: { owner_id: 'user-creator', current_version_id: 'ver-current' },
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/authors cannot approve their own content/i);
    });

    it('blocks approval if there is no check run', () => {
      const res = canApprove({
        ...defaultParams,
        run: null,
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/check run is required/i);
    });

    it('blocks approval if run is for a stale/different version', () => {
      const res = canApprove({
        ...defaultParams,
        run: {
          content_version_id: 'ver-old',
          status: 'complete',
          ai: { used: true, provider: null, model: null },
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/does not match the current version/i);
    });

    it('blocks approval if currently viewing a non-current version', () => {
      const res = canApprove({
        ...defaultParams,
        version: { id: 'ver-historical' },
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/must view and approve the current version/i);
    });

    it('blocks approval if run status is error or running', () => {
      const res = canApprove({
        ...defaultParams,
        run: {
          content_version_id: 'ver-current',
          status: 'running' as any,
          ai: { used: false, provider: null, model: null },
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/successful run is required/i);
    });

    it('allows approval on rules_only_ai_failed run with no blockers', () => {
      const res = canApprove({
        ...defaultParams,
        run: {
          content_version_id: 'ver-current',
          status: 'rules_only_ai_failed',
          ai: { used: false, provider: null, model: null },
        },
      });
      expect(res.allowed).toBe(true);
    });

    it('blocks approval if there is an open blocker finding', () => {
      const res = canApprove({
        ...defaultParams,
        findings: [dummyFinding('blocker', 'open')],
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/open blocker/i);
    });

    it('allows approval if blocker was dismissed or overridden', () => {
      const res = canApprove({
        ...defaultParams,
        findings: [dummyFinding('blocker', 'dismissed')],
      });
      expect(res.allowed).toBe(true);
    });
  });

  describe('needsRecheck', () => {
    it('returns true if run is null', () => {
      expect(needsRecheck({ current_version_id: 'v-1' }, { id: 'v-1' }, null)).toBe(true);
    });

    it('returns true if run version differs from current version', () => {
      expect(
        needsRecheck(
          { current_version_id: 'v-2' },
          { id: 'v-2' },
          { content_version_id: 'v-1', status: 'complete' }
        )
      ).toBe(true);
    });

    it('returns false when current version matches complete run', () => {
      expect(
        needsRecheck(
          { current_version_id: 'v-1' },
          { id: 'v-1' },
          { content_version_id: 'v-1', status: 'complete' }
        )
      ).toBe(false);
    });
  });
});

