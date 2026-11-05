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
        'border-b border-border/70 bg-white/80 backdrop-blur-xs py-3 px-4 sm:px-6 lg:px-8 transition-colors',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-w-0"
          >
            {title && (
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">
                {description}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {(chips || actions) && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {chips}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

