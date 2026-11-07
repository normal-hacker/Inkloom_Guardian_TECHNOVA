import * as React from 'react';
import { cn } from '@/lib/utils';
import { OctagonX } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, hint, error, id, required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full flex flex-col items-start gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-mono font-bold tracking-wider uppercase text-ink flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-severity-blocker">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full min-h-[44px] px-3.5 py-2.5 bg-surface text-ink text-sm font-sans rounded-none border-2 border-ink transition-all duration-120 placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3 focus-visible:shadow-[4px_4px_0_var(--accent)] disabled:bg-surface-2 disabled:cursor-not-allowed',
            error && 'border-ink bg-surface shadow-[4px_4px_0_var(--severity-blocker)]',
            className
          )}
          {...props}
        />
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

Input.displayName = 'Input';

