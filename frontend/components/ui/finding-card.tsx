import * as React from 'react';
import { cn } from '@/lib/utils';
import { SeverityBadge, RuleChip, OriginChip } from './badge';
import { Button } from './button';
import { FindingView, Finding } from '@/lib/domain/types';
import { BookOpen, Check } from 'lucide-react';

export interface FindingCardProps {
  finding: Finding | FindingView;
  selected?: boolean;
  onSelect?: () => void;
  onApply?: (suggestion: string) => void;
  onDismiss?: () => void;
  onOverride?: () => void;
  className?: string;
  readOnly?: boolean;
}

export function FindingCard({
  finding,
  selected = false,
  onSelect,
  onApply,
  onDismiss,
  onOverride,
  className,
  readOnly = false,
}: FindingCardProps) {
  const anyFinding = finding as any;
  const ruleKey = finding.rule?.key || anyFinding.ruleKey || anyFinding.rule_key || 'RULE';
  const ruleTitle = finding.rule?.title || anyFinding.ruleTitle || anyFinding.rule_title || 'Brand Guideline Rule';
  const sourceDoc = finding.source?.title || anyFinding.sourceDoc || anyFinding.source_doc || 'Brand Voice Guide';
  const sourceSection = finding.source?.section || anyFinding.sourceSection || anyFinding.source_section || '§3.1';
  const suggestion = finding.suggestion;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'w-full bg-surface border-2 border-ink rounded-none transition-all duration-120 text-ink cursor-pointer',
        selected ? 'shadow-hard-lg -translate-x-0.5 -translate-y-0.5' : 'shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover',
        className
      )}
    >
      {/* Top Severity Band */}
      <div className="px-4 py-2.5 border-b-2 border-ink flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <RuleChip ruleKey={ruleKey} />
        </div>
        <OriginChip
          origin={finding.origin}
          confidence={typeof finding.confidence === 'number' ? finding.confidence : undefined}
        />
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div>
          <h4 className="font-bold text-sm text-ink">{ruleTitle}</h4>
          <p className="mt-1 text-xs text-ink-2 font-mono flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-ink-3" />
            <span className="underline underline-offset-2">{sourceDoc} · {sourceSection}</span>
          </p>
        </div>

        {/* Quoted Span */}
        <div className="p-2.5 bg-surface-2 border-2 border-ink font-mono text-xs text-ink">
          <span className="text-[10px] uppercase font-bold text-ink-3 block mb-1">
            Flagged Content:
          </span>
          <span className="font-semibold">&ldquo;{finding.quote}&rdquo;</span>
        </div>

        {/* Why / Explanation */}
        <p className="text-xs text-ink leading-relaxed">
          {finding.explanation}
        </p>

        {/* Suggestion Box */}
        {suggestion && (
          <div className="p-3 border-2 border-ink bg-surface flex flex-col gap-2">
            <span className="text-[10px] uppercase font-mono font-bold text-accent block">
              Suggested Alternative:
            </span>
            <p className="text-xs font-mono text-ink font-semibold">
              &ldquo;{suggestion}&rdquo;
            </p>
            {!readOnly && onApply && (
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply(suggestion);
                  }}
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Apply Suggestion
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Actions for human review */}
        {!readOnly && (onDismiss || onOverride) && (
          <div className="pt-2 border-t border-rule flex items-center gap-2 justify-end">
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
              >
                Dismiss with Reason
              </Button>
            )}
            {onOverride && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onOverride();
                }}
              >
                Override
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
