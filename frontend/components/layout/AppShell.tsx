'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login screen must render without sidebar or shell frame
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="h-dvh flex flex-col md:flex-row overflow-hidden bg-[#F8F9FA] text-slate-900">
      {/* 12. Skip Link (A11y landmark) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:font-bold focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Desktop Rail / Collapsible Sidebar & Mobile Drawer */}
      <AppSidebar />

      {/* Content Column: rounded-tl-2xl white panel with soft border */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <main
          id="main"
          className="flex-1 overflow-y-auto bg-white md:rounded-tl-2xl md:border-t md:border-l border-slate-200 shadow-2xs flex flex-col"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
