import * as React from 'react';
import { cn } from '@/lib/utils';
import { OctagonX, Inbox } from 'lucide-react';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full p-8 md:p-12 bg-surface text-ink border-2 border-ink rounded-none flex flex-col items-start gap-4',
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 border-2 border-ink bg-surface-2 flex items-center justify-center text-ink">
        {icon || <Inbox className="w-5 h-5" aria-hidden="true" />}
      </div>
      <div>
        <h3 className="text-lg md:text-xl font-bold tracking-tight text-ink">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-ink-2 max-w-md">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  requestId?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  requestId,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'w-full p-6 md:p-8 bg-surface text-ink border-2 border-ink rounded-none shadow-hard flex flex-col items-start gap-4',
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 border-2 border-ink bg-severity-blocker flex items-center justify-center text-ink">
        <OctagonX className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-2 max-w-lg">{message}</p>
        {requestId && (
          <p className="mt-2 text-xs font-mono text-ink-3">
            Request ID: <span className="font-bold text-ink">{requestId}</span>
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-2 rounded-none animate-pulse select-none',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
