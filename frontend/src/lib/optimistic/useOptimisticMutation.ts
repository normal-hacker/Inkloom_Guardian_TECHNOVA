import { useState, useRef, useEffect, useCallback } from 'react';
import { assertActionOptimistic, AllowedOptimisticAction } from './allowlist';
import { parseHttpError, formatNetworkOrTimeoutError, OptimisticError } from './errors';

export type OptimisticStatus = 'idle' | 'pending' | 'error' | 'offline';

export interface UseOptimisticMutationOptions<TState, TInput, TResult> {
  action: AllowedOptimisticAction;
  initialState: TState;
  apply: (currentState: TState, input: TInput, clientRequestId: string) => TState;
  mutate: (
    input: TInput,
    context: { signal: AbortSignal; idempotencyKey: string; clientRequestId: string }
  ) => Promise<{ ok: boolean; status: number; data?: TResult; errorJson?: unknown; headers?: Headers }>;
  reconcile: (currentState: TState, serverData: TResult, clientRequestId: string) => TState;
  onSuccess?: (result: TResult) => void;
  onError?: (err: OptimisticError, restoredInput: TInput) => void;
  timeoutMs?: number; // default 10000ms
}

export function useOptimisticMutation<TState, TInput, TResult>(
  options: UseOptimisticMutationOptions<TState, TInput, TResult>
) {
  const {
    action,
    initialState,
    apply,
    mutate: executeMutation,
    reconcile,
    onSuccess,
    onError,
    timeoutMs = 10000,
  } = options;

  // Runtime guard: Throws immediately if an unpermitted action attempts optimistic UI
  assertActionOptimistic(action);

  const [state, setState] = useState<TState>(initialState);
  const [status, setStatus] = useState<OptimisticStatus>('idle');
  const [error, setError] = useState<OptimisticError | null>(null);
  const [lastInput, setLastInput] = useState<TInput | null>(null);

  // References for state management across async lifecycles
  const committedStateRef = useRef<TState>(initialState);
  committedStateRef.current = state;

  const inFlightRef = useRef(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const activeClientRequestIdRef = useRef<string | null>(null);
  const currentSeqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

  const discard = useCallback(() => {
    setError(null);
    setStatus('idle');
    setLastInput(null);
    activeKeyRef.current = null;
    activeClientRequestIdRef.current = null;
    inFlightRef.current = false;
  }, []);

  const runMutation = useCallback(
    async (input: TInput, isRetry = false): Promise<TResult | null> => {
      // Dedupe: ignore trigger if mutation is already in-flight
      if (inFlightRef.current && !isRetry) {
        return null;
      }

      // Check online status
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline) {
        const offErr = formatNetworkOrTimeoutError(false, true);
        setStatus('offline');
        setError(offErr);
        setLastInput(input);
        onError?.(offErr, input);
        return null;
      }

      inFlightRef.current = true;
      setStatus('pending');
      setError(null);
      setLastInput(input);

      // Increment per-entity mutation sequence
      const seq = ++currentSeqRef.current;

      // Maintain or generate idempotency key & client request id
      if (!isRetry || !activeKeyRef.current) {
        activeKeyRef.current = crypto.randomUUID();
        activeClientRequestIdRef.current = crypto.randomUUID();
      }

      const idempotencyKey = activeKeyRef.current;
      const clientRequestId = activeClientRequestIdRef.current!;

      // 1. Snapshot previous state and apply optimistic mutation immediately
      const snapshot = committedStateRef.current;
      const optimisticState = apply(snapshot, input, clientRequestId);
      setState(optimisticState);

      // Setup abort controller and timeout
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      const performFetch = async (signal: AbortSignal) => {
        return await executeMutation(input, {
          signal,
          idempotencyKey,
          clientRequestId,
        });
      };

      try {
        const response = await performFetch(controller.signal);
        clearTimeout(timeoutId);

        // Out-of-order check: If a newer mutation started, ignore this older response
        if (seq < currentSeqRef.current) {
          return null;
        }

        if (response.ok && response.data !== undefined) {
          // 4. Reconcile: replace temp item with server truth
          setState((latestState) => reconcile(latestState, response.data!, clientRequestId));
          setStatus('idle');
          setError(null);
          setLastInput(null);
          activeKeyRef.current = null;
          activeClientRequestIdRef.current = null;
          inFlightRef.current = false;
          onSuccess?.(response.data!);
          return response.data;
        }

        // Server error or non-2xx
        throw { isHttp: true, status: response.status, body: response.errorJson, headers: response.headers };
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (!isMountedRef.current || seq < currentSeqRef.current) {
          inFlightRef.current = false;
          return null;
        }

        const errObj = err as { isHttp?: boolean; status?: number; body?: unknown; headers?: Headers; name?: string } | null;

        // Auto-retry once on timeout / network break if outcome was unknown
        if ((timedOut || errObj?.name === 'AbortError') && !isRetry) {
          try {
            await new Promise((res) => setTimeout(res, 1000));
            const retryController = new AbortController();
            activeAbortControllerRef.current = retryController;
            const res = await performFetch(retryController.signal);
            if (res.ok && res.data !== undefined) {
              setState((latestState) => reconcile(latestState, res.data!, clientRequestId));
              setStatus('idle');
              setError(null);
              setLastInput(null);
              activeKeyRef.current = null;
              activeClientRequestIdRef.current = null;
              inFlightRef.current = false;
              onSuccess?.(res.data!);
              return res.data;
            }
          } catch {
            // Second attempt failed, proceed to rollback
          }
        }

        // 5. Rollback on failure: restore snapshot and show plain language error
        setState(snapshot);
        inFlightRef.current = false;

        let parsedError: OptimisticError;
        if (errObj?.isHttp && typeof errObj.status === 'number') {
          parsedError = parseHttpError(errObj.status, errObj.body as Parameters<typeof parseHttpError>[1], errObj.headers);
        } else {
          const isOff = typeof navigator !== 'undefined' ? !navigator.onLine : false;
          parsedError = formatNetworkOrTimeoutError(timedOut, isOff);
        }

        setStatus(parsedError.kind === 'offline' ? 'offline' : 'error');
        setError(parsedError);
        onError?.(parsedError, input);
        return null;
      }
    },
    [apply, executeMutation, reconcile, onSuccess, onError, timeoutMs]
  );

  const mutate = useCallback((input: TInput) => runMutation(input, false), [runMutation]);

  const retry = useCallback(() => {
    if (lastInput !== null) {
      return runMutation(lastInput, true);
    }
    return Promise.resolve(null);
  }, [runMutation, lastInput]);

  return {
    state,
    setState,
    status,
    error,
    lastInput,
    isBusy: status === 'pending',
    mutate,
    retry,
    discard,
  };
}
