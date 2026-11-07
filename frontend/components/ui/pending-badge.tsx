import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface PendingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

/**
 * PendingBadge: Paper Brutalist pending state indicator.
 * Visual spec: 2px dashed ink border, surface-2 background, mono uppercase text.
 * Respects prefers-reduced-motion. Never relies on colour alone.
 */
export function PendingBadge({
  label = 'Saving…',
  className,
  ...props
}: PendingBadgeProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium uppercase',
        'border-2 border-dashed border-ink bg-surface-2 text-ink select-none',
        className
      )}
      {...props}
    >
      <Loader2 className="w-3 h-3 text-ink motion-safe:animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

