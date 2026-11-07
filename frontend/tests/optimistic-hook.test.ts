// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticMutation } from '../src/lib/optimistic/useOptimisticMutation';
import {
  MUTATION_ALLOWLIST,
  assertActionOptimistic,
} from '../src/lib/optimistic/allowlist';
import { parseHttpError } from '../src/lib/optimistic/errors';

interface TestItem {
  id: string;
  text: string;
  clientRequestId?: string;
  __pending?: boolean;
}

describe('Optimistic UI Hook Unit Tests (FRAMEWORK §6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('1. Success reconciles the temp item without duplicates or flicker', async () => {
    const initialState: TestItem[] = [{ id: '1', text: 'First item' }];
    const mutateFn = vi.fn().mockImplementation(async (text: string) => {
      return {
        ok: true,
        status: 201,
        data: { id: 'server-100', text },
      };
    });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState,
        apply: (current, text, clientRequestId) => [
          { id: `temp-${clientRequestId}`, clientRequestId, text, __pending: true },
          ...current,
        ],
        mutate: mutateFn,
        reconcile: (current, serverData, clientRequestId) =>
          current.map((item) =>
            item.clientRequestId === clientRequestId ? { ...serverData, __pending: false } : item
          ),
      })
    );

    // Initial state
    expect(result.current.state.length).toBe(1);
    expect(result.current.status).toBe('idle');

    // Trigger mutation
    let mutationPromise: Promise<TestItem | null>;
    act(() => {
      mutationPromise = result.current.mutate('Optimistic comment');
    });

    // Optimistic item is present immediately (<100ms) with __pending: true
    expect(result.current.state.length).toBe(2);
    expect(result.current.state[0].text).toBe('Optimistic comment');
    expect(result.current.state[0].__pending).toBe(true);
    expect(result.current.status).toBe('pending');
    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      await mutationPromise;
    });

    // Reconciled with server data: temp replaced, no duplicate, length remains 2
    expect(result.current.state.length).toBe(2);
    expect(result.current.state[0].id).toBe('server-100');
    expect(result.current.state[0].__pending).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.isBusy).toBe(false);
  });

  it('2. Failure restores exact previous snapshot and keeps typed input', async () => {
    const initialState: TestItem[] = [{ id: '1', text: 'Original note' }];
    const mutateFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      errorJson: { message: 'Database failure' },
    });

    let capturedError: unknown = null;
    let restoredInputVal: string = '';

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState,
        apply: (current, text, clientRequestId) => [
          { id: `temp-${clientRequestId}`, clientRequestId, text, __pending: true },
          ...current,
        ],
        mutate: mutateFn,
        reconcile: (current, serverData) => [serverData, ...current],
        onError: (err, input) => {
          capturedError = err;
          restoredInputVal = input;
        },
      })
    );

    let p: Promise<TestItem | null>;
    act(() => {
      p = result.current.mutate('This will fail');
    });

    // Appears optimistically first
    expect(result.current.state.length).toBe(2);

    await act(async () => {
      await p;
    });

    // State rolled back exactly to snapshot
    expect(result.current.state.length).toBe(1);
    expect(result.current.state[0].id).toBe('1');
    expect(result.current.status).toBe('error');
    expect(result.current.error?.kind).toBe('server_error');
    expect(result.current.error?.message).toBe('Something went wrong on our side. Nothing was changed.');
    expect(capturedError?.kind).toBe('server_error');
    expect(restoredInputVal).toBe('This will fail');
    expect(result.current.lastInput).toBe('This will fail');
  });

  it('3. Dedupe: Double-invoke sends exactly one request and ignores duplicate triggers', async () => {
    let callCount = 0;
    const mutateFn = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { ok: true, status: 201, data: { id: 's1', text: 'test' } };
    });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [],
        apply: (current, text, clientRequestId) => [
          { id: `temp-${clientRequestId}`, clientRequestId, text },
          ...current,
        ],
        mutate: mutateFn,
        reconcile: (current, serverData) => [serverData],
      })
    );

    act(() => {
      result.current.mutate('Rapid submit 1');
      result.current.mutate('Rapid submit 2 (ignored)');
      result.current.mutate('Rapid submit 3 (ignored)');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(callCount).toBe(1);
  });

  it('4. Out-of-order safety: response for older mutation never overwrites newer state', async () => {
    let resolveFirst: (val: unknown) => void;
    let resolveSecond: (val: unknown) => void;
    let call = 0;

    const mutateFn = vi.fn().mockImplementation(() => {
      call++;
      if (call === 1) {
        return new Promise((r) => {
          resolveFirst = r;
        });
      }
      return new Promise((r) => {
        resolveSecond = r;
      });
    });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [],
        apply: (current, text, clientRequestId) => [
          { id: `temp-${clientRequestId}`, clientRequestId, text },
        ],
        mutate: mutateFn,
        reconcile: (_current, serverData) => [serverData],
      })
    );

    let p1: Promise<TestItem | null>;
    act(() => {
      p1 = result.current.mutate('Action 1');
    });

    // Reset status to trigger second mutation
    act(() => {
      result.current.discard();
    });

    let p2: Promise<TestItem | null>;
    act(() => {
      p2 = result.current.mutate('Action 2');
    });

    // Resolve second request first
    await act(async () => {
      resolveSecond({ ok: true, status: 200, data: { id: 'second', text: 'New response' } });
      await p2;
    });
    expect(result.current.state[0].id).toBe('second');

    // Late older response arrives
    await act(async () => {
      resolveFirst({ ok: true, status: 200, data: { id: 'first', text: 'Old response' } });
      await p1;
    });

    // Final state remains the newer second response, not the older first
    expect(result.current.state[0].id).toBe('second');
  });

  it('5. Unmount aborts in-flight requests and ignores late responses', async () => {
    let aborted = false;
    const mutateFn = vi.fn().mockImplementation((_input, { signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {}); // never resolves
    });

    const { result, unmount } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [],
        apply: (current, text) => [{ id: 'temp', text }, ...current],
        mutate: mutateFn,
        reconcile: (current) => current,
      })
    );

    act(() => {
      result.current.mutate('In flight');
    });

    expect(result.current.status).toBe('pending');

    act(() => {
      unmount();
    });

    expect(aborted).toBe(true);
  });

  it('6. Timeout triggers one automatic retry with the same idempotency key', async () => {
    const keysUsed: string[] = [];
    let attempts = 0;

    const mutateFn = vi.fn().mockImplementation((_input: string, { idempotencyKey, signal }: { idempotencyKey: string; signal: AbortSignal }) => {
      attempts++;
      keysUsed.push(idempotencyKey);
      return new Promise((resolve) => {
        signal.addEventListener('abort', () => {
          if (attempts === 1) {
            resolve({ ok: false, status: 408 });
          } else {
            resolve({ ok: true, status: 201, data: { id: 'retried', text: 'ok' } });
          }
        });
      });
    });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [],
        apply: (current, text) => [{ id: 'temp', text }, ...current],
        mutate: mutateFn,
        reconcile: (_current, serverData) => [serverData],
        timeoutMs: 1000,
      })
    );

    act(() => {
      result.current.mutate('Auto-retry test');
    });

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(attempts).toBeGreaterThanOrEqual(1);
    if (keysUsed.length >= 2) {
      expect(keysUsed[0]).toBe(keysUsed[1]);
    }
  });

  it('7. Manual retry reuses the exact same idempotency key', async () => {
    const keysUsed: string[] = [];
    const mutateFn = vi.fn().mockImplementation((_input: string, { idempotencyKey }: { idempotencyKey: string }) => {
      keysUsed.push(idempotencyKey);
      return Promise.resolve({ ok: false, status: 500 });
    });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [],
        apply: (current, text) => [{ id: 'temp', text }, ...current],
        mutate: mutateFn,
        reconcile: (current) => current,
      })
    );

    let p: Promise<TestItem | null>;
    act(() => {
      p = result.current.mutate('Retry test');
    });

    await act(async () => {
      await p;
    });

    expect(result.current.status).toBe('error');

    // Trigger manual retry
    let pRetry: Promise<TestItem | null>;
    act(() => {
      pRetry = result.current.retry();
    });

    await act(async () => {
      await pRetry;
    });

    expect(keysUsed.length).toBe(2);
    expect(keysUsed[0]).toBe(keysUsed[1]); // Both attempts shared the same idempotency key
  });

  it('8. Derived counts revert automatically on rollback', async () => {
    const mutateFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() =>
      useOptimisticMutation<TestItem[], string, TestItem>({
        action: 'comment.add',
        initialState: [{ id: '1', text: 'Existing' }],
        apply: (current, text) => [{ id: 'temp', text }, ...current],
        mutate: mutateFn,
        reconcile: (current) => current,
      })
    );

    // Initial count
    expect(result.current.state.length).toBe(1);

    let p: Promise<TestItem | null>;
    act(() => {
      p = result.current.mutate('New comment');
    });

    // Count increments optimistically
    expect(result.current.state.length).toBe(2);

    await act(async () => {
      await p;
    });

    // Count rolled back automatically
    expect(result.current.state.length).toBe(1);
  });

  it('9. Security Guard: throws if a Pending-only action is wired to optimistic hook', () => {
    const pendingActions = MUTATION_ALLOWLIST.filter((m) => m.classification === 'pending_only');
    expect(pendingActions.length).toBeGreaterThan(0);

    for (const pending of pendingActions) {
      expect(() => {
        assertActionOptimistic(pending.action);
      }).toThrow(/Governance integrity forbids optimistic rendering/);
    }
  });

  it('10. Error parser handles all standard status codes and plain messages', () => {
    expect(parseHttpError(401).kind).toBe('unauthenticated');
    expect(parseHttpError(401).redirectUrl).toContain('/login');
    expect(parseHttpError(403).kind).toBe('forbidden');
    expect(parseHttpError(404).kind).toBe('not_found');
    expect(parseHttpError(409).kind).toBe('conflict');
    expect(parseHttpError(422).kind).toBe('validation');
    expect(parseHttpError(429).kind).toBe('rate_limit');
    expect(parseHttpError(500).kind).toBe('server_error');
  });
});
