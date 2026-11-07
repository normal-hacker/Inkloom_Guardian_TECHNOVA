import * as React from 'react';
import { cn } from '@/lib/utils';
import { OctagonX, RefreshCw, X } from 'lucide-react';
import { OptimisticError } from '@/lib/optimistic/errors';

export interface InlineRetryProps extends React.HTMLAttributes<HTMLDivElement> {
  error: OptimisticError;
  onRetry: () => void;
  onDiscard: () => void;
  isRetrying?: boolean;
}

/**
 * InlineRetry: Paper Brutalist error and recovery component.
 * Displays plain-language error message, accessible role="alert",
 * and retry/discard recovery actions.
 */
export function InlineRetry({
  error,
  onRetry,
  onDiscard,
  isRetrying = false,
  className,
  ...props
}: InlineRetryProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'border-2 border-ink bg-surface-2 p-3 text-xs font-sans text-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-hard select-none',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2.5">
        <span className="p-1 bg-severity-blocker text-ink border border-ink shrink-0 mt-0.5">
          <OctagonX className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <div className="space-y-0.5">
          <p className="font-mono font-bold text-ink">Not saved: {error.message}</p>
          {error.requestId && (
            <p className="font-mono text-[10px] text-ink-3">Request ID: {error.requestId}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
        {error.canRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase bg-surface border-2 border-ink text-ink hover:bg-ink hover:text-surface transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} aria-hidden="true" />
            <span>{isRetrying ? 'Retrying…' : 'Retry'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase border-2 border-rule text-ink-2 hover:border-ink hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        >
          <X className="w-3 h-3" aria-hidden="true" />
          <span>Discard</span>
        </button>
      </div>
    </div>
  );
}

