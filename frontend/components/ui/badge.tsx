import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  OctagonX,
  TriangleAlert,
  CircleAlert,
  Info,
  CircleCheck,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Severity, ContentStatus, FindingOrigin } from '@/lib/domain/types';

// Generic Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'surface' | 'ink' | 'accent' | 'rule' | 'neutral' | 'major' | 'blocker' | 'approved';
}

export function Badge({
  className,
  variant = 'surface',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    surface: 'bg-surface text-ink border-2 border-ink',
    ink: 'bg-ink text-surface border-2 border-ink',
    accent: 'bg-accent text-accent-ink border-2 border-ink',
    rule: 'bg-surface-2 text-ink-2 border-2 border-rule',
    neutral: 'bg-surface-2 text-ink border-2 border-ink',
    major: 'bg-severity-major text-ink border-2 border-ink',
    blocker: 'bg-severity-blocker text-ink border-2 border-ink',
    approved: 'bg-status-approved text-ink border-2 border-ink',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-none select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// SeverityBadge: Blocker, Major, Minor, Info
export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  showIcon?: boolean;
  count?: number;
}

export function SeverityBadge({
  severity,
  showIcon = true,
  count,
  className,
  ...props
}: SeverityBadgeProps) {
  const configs = {
    blocker: {
      label: 'BLOCKER',
      bg: 'bg-severity-blocker',
      icon: OctagonX,
    },
    major: {
      label: 'MAJOR',
      bg: 'bg-severity-major',
      icon: TriangleAlert,
    },
    minor: {
      label: 'MINOR',
      bg: 'bg-severity-minor',
      icon: CircleAlert,
    },
    info: {
      label: 'INFO',
      bg: 'bg-severity-info',
      icon: Info,
    },
  };

  const { label, bg, icon: Icon } = configs[severity] || configs.info;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-ink text-ink font-mono text-xs font-bold uppercase rounded-none select-none',
        bg,
        className
      )}
      aria-label={`Severity: ${label}${count !== undefined ? ` (${count})` : ''}`}
      {...props}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 px-1 py-0.2 bg-ink text-white text-[10px]">{count}</span>
      )}
    </span>
  );
}

// StatusPill: draft, checked, in_review, changes_requested, approved, rejected
export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ContentStatus;
  showIcon?: boolean;
}

export function StatusPill({
  status,
  showIcon = true,
  className,
  ...props
}: StatusPillProps) {
  const configs: Record<
    ContentStatus,
    { label: string; bg: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    draft: {
      label: 'Draft',
      bg: 'bg-status-draft',
      icon: Clock,
    },
    checked: {
      label: 'Checked',
      bg: 'bg-status-checked',
      icon: ShieldCheck,
    },
    in_review: {
      label: 'In Review',
      bg: 'bg-status-in-review',
      icon: Clock,
    },
    changes_requested: {
      label: 'Changes Requested',
      bg: 'bg-status-changes-requested',
      icon: TriangleAlert,
    },
    approved: {
      label: 'Approved',
      bg: 'bg-status-approved',
      icon: CircleCheck,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-status-rejected',
      icon: OctagonX,
    },
    needs_review: {
      label: 'Needs re-review',
      bg: 'bg-status-changes-requested',
      icon: TriangleAlert,
    },
  };

  const { label, bg, icon: Icon } = configs[status] || configs.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-ink text-ink font-mono text-xs font-bold rounded-none select-none',
        bg,
        className
      )}
      aria-label={`Status: ${label}`}
      {...props}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

// RuleChip: mono font, uppercase, 2px border
export interface RuleChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  ruleKey?: string;
  code?: string;
}

export function RuleChip({ ruleKey, code, className, ...props }: RuleChipProps) {
  const displayCode = ruleKey || code || 'RULE';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 bg-surface-2 text-ink border-2 border-ink font-mono text-xs font-bold uppercase rounded-none select-none tracking-wider',
        className
      )}
      {...props}
    >
      {displayCode}
    </span>
  );
}

// OriginChip: RULE or AI
export interface OriginChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  origin: FindingOrigin;
  confidence?: number;
}

export function OriginChip({
  origin,
  confidence,
  className,
  ...props
}: OriginChipProps) {
  const isRule = origin === 'rule';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 border-2 border-ink font-mono text-xs font-bold uppercase rounded-none select-none',
        isRule ? 'bg-surface-2 text-ink' : 'bg-accent text-accent-ink',
        className
      )}
      {...props}
    >
      {isRule ? (
        <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
      ) : (
        <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
      )}
      <span>{isRule ? 'RULE' : 'AI'}</span>
      {confidence !== undefined && (
        <span className="opacity-80 text-[10px]">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </span>
  );
}
