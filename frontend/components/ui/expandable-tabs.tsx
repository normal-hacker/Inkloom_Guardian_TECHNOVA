'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOnClickOutside } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type TabDef = {
  id: string;
  title: string;
  icon: LucideIcon;
  href?: string;
  badge?: number;
  badgeLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  type?: 'tab';
};

export type SeparatorItem = {
  type: 'separator';
  id: string;
};

export type TabItem = TabDef | SeparatorItem;

export function isSeparator(item: TabItem): item is SeparatorItem {
  return 'type' in item && item.type === 'separator';
}

export interface ExpandableTabsProps {
  tabs: TabItem[];
  variant?: 'nav' | 'tabs';
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (index: number | null) => void;
  collapseOnOutsideClick?: boolean;
  activeColor?: string;
  className?: string;
  ariaLabel?: string;
  idPrefix?: string;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '0.625rem',
    paddingRight: '0.625rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '0.5rem' : 0,
    paddingLeft: isSelected ? '1rem' : '0.625rem',
    paddingRight: isSelected ? '1rem' : '0.625rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const springTransition = { type: 'spring' as const, bounce: 0, duration: 0.4 };
const instantTransition = { duration: 0 };

const Separator = React.memo(function Separator({ id }: { id: string }) {
  return (
    <div
      key={id}
      className="mx-1 h-5 w-[1.5px] bg-border shrink-0 self-center"
      role="separator"
      aria-orientation="vertical"
      aria-hidden="true"
    />
  );
});

const MotionLink = motion.create(Link);

export function ExpandableTabs({
  tabs,
  variant = 'tabs',
  value,
  defaultValue = null,
  onChange,
  collapseOnOutsideClick = false,
  activeColor = 'text-primary',
  className,
  ariaLabel,
  idPrefix,
}: ExpandableTabsProps) {
  const [internalSelected, setInternalSelected] = React.useState<number | null>(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : internalSelected;

  const outsideClickRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLElement>>(new Map());
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion ? instantTransition : springTransition;

  // Handle outside click only when explicit collapseOnOutsideClick is true
  useOnClickOutside(outsideClickRef as React.RefObject<HTMLDivElement>, () => {
    if (collapseOnOutsideClick) {
      if (!isControlled) {
        setInternalSelected(null);
      }
      onChange?.(null);
    }
  });

  const handleSelect = React.useCallback(
    (index: number) => {
      const item = tabs[index];
      if (!item || isSeparator(item) || item.disabled) return;
      if (!isControlled) {
        setInternalSelected(index);
      }
      onChange?.(index);
    },
    [tabs, isControlled, onChange]
  );

  // Scroll active tab into view horizontally inside container only (never scroll the page vertically)
  React.useEffect(() => {
    if (selected !== null && selected !== undefined) {
      const el = itemRefs.current.get(selected);
      const container = outsideClickRef.current;
      if (el && container) {
        try {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          if (elRect.left < containerRect.left) {
            container.scrollLeft += elRect.left - containerRect.left;
          } else if (elRect.right > containerRect.right) {
            container.scrollLeft += elRect.right - containerRect.right;
          }
        } catch {}
      }
    }
  }, [selected]);

  // Tablist roving focus & arrow keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (variant !== 'tabs') return;

    const interactiveIndices = tabs
      .map((tab, idx) => (!isSeparator(tab) && !tab.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (interactiveIndices.length === 0) return;

    const currentPos = interactiveIndices.indexOf(index);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      const nextPos = (currentPos + 1) % interactiveIndices.length;
      nextIndex = interactiveIndices[nextPos];
    } else if (e.key === 'ArrowLeft') {
      const prevPos = (currentPos - 1 + interactiveIndices.length) % interactiveIndices.length;
      nextIndex = interactiveIndices[prevPos];
    } else if (e.key === 'Home') {
      nextIndex = interactiveIndices[0];
    } else if (e.key === 'End') {
      nextIndex = interactiveIndices[interactiveIndices.length - 1];
    }

    if (nextIndex !== null && nextIndex !== undefined) {
      e.preventDefault();
      handleSelect(nextIndex);
      const targetEl = itemRefs.current.get(nextIndex);
      targetEl?.focus();
    }
  };

  const interactiveIndices = React.useMemo(
    () =>
      tabs
        .map((tab, idx) => (!isSeparator(tab) && !tab.disabled ? idx : -1))
        .filter((idx) => idx !== -1),
    [tabs]
  );

  const containerContent = (
    <div
      ref={outsideClickRef}
      className={cn(
        className
      )}
      {...(variant === 'tabs'
        ? {
            role: 'tablist',
            'aria-orientation': 'horizontal',
            'aria-label': ariaLabel || 'Navigation tabs',
          }
        : {})}
    >
      {tabs.map((tab, index) => {
        if (isSeparator(tab)) {
          return <Separator key={tab.id || `sep-${index}`} id={tab.id || `sep-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;
        const hasBadge = typeof tab.badge === 'number' && tab.badge > 0;
        const accessibleName = hasBadge
          ? tab.badgeLabel || `${tab.title}, ${tab.badge} awaiting attention`
          : tab.title;

        // Roving tabindex for tabs variant
        const tabIndex =
          variant === 'tabs'
            ? isSelected || (selected === null && interactiveIndices[0] === index)
              ? 0
              : -1
            : undefined;

        const commonProps = {
          ref: (node: HTMLElement | null) => {
            if (node) {
              itemRefs.current.set(index, node);
            } else {
              itemRefs.current.delete(index);
            }
          },
          variants: buttonVariants,
          initial: false,
          animate: 'animate',
          custom: isSelected,
          transition,
          title: tab.title,
          'aria-label': accessibleName,
          className: cn(
            'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-sm font-medium transition-colors duration-200 select-none shrink-0',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3',
            isSelected
              ? cn('bg-muted font-semibold shadow-xs', activeColor)
              : 'text-ink-2 hover:bg-surface-2 hover:text-ink border-2 border-transparent',
            tab.disabled && 'cursor-not-allowed opacity-50'
          ),
          onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
        };

        const innerContent = (
          <>
            <span className="relative inline-flex items-center justify-center">
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              {hasBadge && (
                <span
                  className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-xs"
                  aria-hidden="true"
                >
                  {tab.badge! > 99 ? '99+' : tab.badge}
                </span>
              )}
            </span>
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap leading-none"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        );

        if (variant === 'nav' && tab.href && !tab.disabled) {
          return (
            <MotionLink
              key={tab.id}
              href={tab.href}
              onClick={() => handleSelect(index)}
              aria-current={isSelected ? 'page' : undefined}
              {...commonProps}
            >
              {innerContent}
            </MotionLink>
          );
        }

        return (
          <motion.button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => handleSelect(index)}
            {...(variant === 'tabs'
              ? {
                  role: 'tab',
                  'aria-selected': isSelected,
                  'aria-controls': idPrefix ? `${idPrefix}-panel-${tab.id}` : undefined,
                  id: idPrefix ? `${idPrefix}-tab-${tab.id}` : undefined,
                  tabIndex,
                }
              : {
                  'aria-current': isSelected ? 'page' : undefined,
                })}
            {...commonProps}
          >
            {innerContent}
          </motion.button>
        );
      })}
    </div>
  );

  if (variant === 'nav') {
    return <nav aria-label={ariaLabel || 'Main'}>{containerContent}</nav>;
  }

  return containerContent;
}
