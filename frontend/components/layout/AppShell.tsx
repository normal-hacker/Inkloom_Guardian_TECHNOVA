'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/demo-report',
  '/about-ai',
  '/build-notes',
  '/selftest',
  '/rules',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public standalone pages render without app sidebar or dual-header wrapper
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="h-dvh flex flex-col md:flex-row overflow-hidden bg-paper text-ink">
      {/* Skip Link (A11y landmark) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink focus:text-surface focus:font-mono focus:font-bold focus:border-2 focus:border-ink focus:shadow-hard focus:outline-none focus:ring-3 focus:ring-focus"
      >
        Skip to main content
      </a>

      {/* Desktop Rail / Collapsible Sidebar & Mobile Drawer */}
      <AppSidebar />

      {/* Content Column: square surface panel with 2px left border */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <main
          id="main"
          className="flex-1 min-h-0 overflow-y-auto bg-surface md:border-l-2 border-ink rounded-none shadow-none flex flex-col"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
