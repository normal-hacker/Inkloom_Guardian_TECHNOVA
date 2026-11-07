import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({
  className,
  hoverEffect = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface text-ink border-2 border-ink p-6 rounded-none shadow-hard transition-all duration-120',
        hoverEffect &&
          'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type PanelProps = React.HTMLAttributes<HTMLDivElement>;

export function Panel({ className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'bg-surface text-ink border-2 border-ink p-6 rounded-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  number?: string;
  title?: string;
}

export function SectionLabel({
  number,
  title,
  children,
  className,
  ...props
}: SectionLabelProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-ink select-none',
        className
      )}
      {...props}
    >
      {number && (
        <span className="px-1.5 py-0.5 bg-ink text-surface">{number}</span>
      )}
      <span>{title || children}</span>
    </div>
  );
}
