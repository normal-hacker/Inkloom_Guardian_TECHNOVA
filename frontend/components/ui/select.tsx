import * as React from 'react';
import { cn } from '@/lib/utils';
import { OctagonX, ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, required, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full flex flex-col items-start gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-mono font-bold tracking-wider uppercase text-ink flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-severity-blocker">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <select
            id={selectId}
            ref={ref}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'w-full min-h-[44px] appearance-none pl-3.5 pr-10 py-2.5 bg-surface text-ink text-sm font-sans rounded-none border-2 border-ink transition-all duration-120 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3 focus-visible:shadow-[4px_4px_0_var(--accent)] disabled:bg-surface-2 disabled:cursor-not-allowed',
              error && 'border-ink bg-surface shadow-[4px_4px_0_var(--severity-blocker)]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-2 font-mono">
            {hint}
          </p>
        )}
        {error && (
          <div
            id={errorId}
            role="alert"
            className="w-full px-2.5 py-1.5 bg-severity-blocker border-2 border-ink text-ink text-xs font-mono font-medium flex items-center gap-2"
          >
            <OctagonX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

