'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { NAV_CONFIG, NavRouteConfig } from '@/lib/nav/config';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title?: string;
  description?: string;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title: customTitle,
  description: customDescription,
  chips,
  actions,
  className,
}: PageHeaderProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Look up matching default metadata from NAV_CONFIG
  const matchingNav = React.useMemo(() => {
    if (!pathname) return null;
    return NAV_CONFIG.find(
      (item): item is NavRouteConfig =>
        item.type !== 'separator' && (item.href === pathname || (item.href !== '/' && pathname.startsWith(`${item.href}/`)))
    );
  }, [pathname]);

  const title = customTitle || matchingNav?.title || '';
  const description = customDescription || matchingNav?.description || '';

  if (!title && !description && !chips && !actions) {
    return null;
  }

  const animationKey = `${pathname || ''}-${title}`;

  return (
    <div
      className={cn(
        'border-b-2 border-ink bg-surface px-6 md:px-8 py-5 md:py-6 shrink-0',
        className
      )}
    >
      <div className="max-w-[1280px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink font-sans">
                {title}
              </h1>
              {chips && <div className="flex items-center gap-2">{chips}</div>}
            </div>
            {description && (
              <p className="mt-1 text-sm text-ink-2 max-w-2xl font-sans">
                {description}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
