import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-120 select-none rounded-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        secondary:
          'bg-surface text-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        ghost:
          'bg-transparent text-ink border-2 border-transparent hover:underline hover:bg-surface-2/40 active:translate-x-0.5 active:translate-y-0.5',
        destructive:
          'bg-severity-blocker text-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-5 text-sm min-h-[44px]',
        lg: 'h-14 px-7 text-base min-h-[44px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  disabledReason?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabledReason,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading || Boolean(disabledReason);

    return (
      <div className="inline-flex flex-col items-start gap-1">
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            buttonVariants({ variant, size }),
            isDisabled &&
              'bg-surface-2 text-ink-3 border-2 border-dashed border-ink-3 shadow-none cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none',
            className
          )}
          aria-disabled={isDisabled}
          title={disabledReason || props.title}
          {...props}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span>{typeof children === 'string' ? 'Loading…' : children}</span>
            </span>
          ) : (
            children
          )}
        </button>
        {disabledReason && (
          <span
            className="text-xs text-ink-3 font-mono"
            role="status"
            aria-live="polite"
          >
            {disabledReason}
          </span>
        )}
      </div>
    );
  }
);

Button.displayName = 'Button';

