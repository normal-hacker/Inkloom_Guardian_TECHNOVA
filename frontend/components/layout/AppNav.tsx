'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ExpandableTabs, TabItem } from '@/components/ui/expandable-tabs';
import { getVisibleNavForRole, UserRole } from '@/lib/nav/config';

interface AppNavProps {
  userRole?: UserRole | null;
  className?: string;
}

export function AppNav({ userRole: initialRole, className }: AppNavProps) {
  const pathname = usePathname();
  const [role, setRole] = React.useState<UserRole | null>(initialRole ?? null);
  const [pendingCount, setPendingCount] = React.useState<number | undefined>(undefined);

  // Fetch current user and pending action count
  React.useEffect(() => {
    let isMounted = true;

    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user?.role) {
          setRole(data.user.role);
        }
      })
      .catch(() => {});

    fetch('/api/v1/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data?.items)) {
          // Count items that need review/action
          const pending = data.items.filter((item: { status: string }) =>
            item.status === 'in_review' || item.status === 'changes_requested'
          ).length;
          setPendingCount(pending > 0 ? pending : undefined);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Filter navigation items by active user role
  const rawItems = React.useMemo(() => getVisibleNavForRole(role), [role]);

  // Map to TabItem and inject dashboard badge
  const tabs: TabItem[] = React.useMemo(() => {
    return rawItems.map((item) => {
      if (item.type === 'separator') {
        return item;
      }
      if (item.id === 'dashboard' && pendingCount && pendingCount > 0) {
        return {
          ...item,
          badge: pendingCount,
          badgeLabel: `Dashboard, ${pendingCount} items awaiting attention`,
        };
      }
      return item;
    });
  }, [rawItems, pendingCount]);

  // Derive active index from pathname
  // Rule: exact match or prefix match, BUT /content/[id] does NOT falsely highlight /content/new or /dashboard
  const activeIndex = React.useMemo(() => {
    if (!pathname) return null;

    // Specifically avoid false highlight for /content/[id]
    if (pathname.startsWith('/content/') && pathname !== '/content/new') {
      return null;
    }

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (tab.type === 'separator' || !tab.href) continue;

      if (pathname === tab.href) {
        return i;
      }
      if (tab.href !== '/' && tab.href !== '/dashboard' && pathname.startsWith(`${tab.href}/`)) {
        return i;
      }
    }
    return null;
  }, [pathname, tabs]);

  return (
    <div className={`w-full flex justify-center py-2 px-4 ${className || ''}`}>
      <ExpandableTabs
        tabs={tabs}
        variant="nav"
        value={activeIndex}
        collapseOnOutsideClick={false}
        ariaLabel="Main navigation"
        className="shadow-sm"
      />
    </div>
  );
}

