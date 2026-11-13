'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { getVisibleNavForRole, UserRole } from '@/lib/nav/config';
import { LogOut, Users, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = React.useState<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
  } | null>(null);

  const [demoEnabled, setDemoEnabled] = React.useState(true);
  const [demoMenuOpen, setDemoMenuOpen] = React.useState(false);
  const [pendingReviews, setPendingReviews] = React.useState<number | undefined>(undefined);

  // Fetch session & providers
  React.useEffect(() => {
    let mounted = true;
    const hasSession = typeof document !== 'undefined' && document.cookie.includes('inkloom_has_session=1');

    if (hasSession) {
      fetch('/api/v1/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (mounted && data?.user) {
            setUser(data.user);
          }
        })
        .catch(() => {});

      fetch('/api/v1/content')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (mounted && Array.isArray(data?.items)) {
            const count = data.items.filter(
              (item: { status: string }) =>
                item.status === 'in_review' || item.status === 'changes_requested'
            ).length;
            setPendingReviews(count > 0 ? count : undefined);
          }
        })
        .catch(() => {});
    }

    fetch('/api/v1/auth/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setDemoEnabled(Boolean(data.demo));
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const visibleNav = React.useMemo(() => getVisibleNavForRole(user?.role), [user?.role]);

  const handleSwitchRole = async (targetRole: string) => {
    setDemoMenuOpen(false);
    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        router.refresh();
      }
    } catch {}
  };

  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetDemo = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Reset demo dataset to initial clean state?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/v1/auth/reset-demo', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to reset demo dataset.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarBody>
        {/* Navigation Section */}
        <div className="space-y-1">
          {visibleNav.map((item, idx) => {
            if (item.type === 'separator') {
              return (
                <div
                  key={item.id || `sep-${idx}`}
                  className="my-3 border-t border-slate-200/80 mx-2"
                  role="separator"
                  aria-orientation="horizontal"
                />
              );
            }

            const Icon = item.icon;
            const isDashboard = item.id === 'dashboard';
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

            return (
              <SidebarLink
                key={item.id}
                link={{
                  id: item.id,
                  label: item.title,
                  href: item.href,
                  icon: <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />,
                  badge: isDashboard ? pendingReviews : undefined,
                }}
                active={isActive}
              />
            );
          })}
        </div>

        {/* Footer Section */}
        <SidebarFooter
          user={user}
          demoEnabled={demoEnabled}
          demoMenuOpen={demoMenuOpen}
          setDemoMenuOpen={setDemoMenuOpen}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />
      </SidebarBody>
    </Sidebar>
  );
}

const DEMO_PERSONAS = [
  { role: 'creator', name: 'Asha Patel', desc: 'Creator' },
  { role: 'creator', name: 'Ben Torres', desc: 'Creator (2nd)' },
  { role: 'reviewer', name: 'Priya Sharma', desc: 'Reviewer' },
  { role: 'manager', name: 'Marcus Vance', desc: 'Manager' },
];

function SidebarFooter({
  user,
  demoEnabled,
  demoMenuOpen,
  setDemoMenuOpen,
  onSwitchRole,
  onLogout,
  onResetDemo,
  isResetting,
}: {
  user: { id: string; email: string; name: string; role: UserRole } | null;
  demoEnabled: boolean;
  demoMenuOpen: boolean;
  setDemoMenuOpen: (open: boolean) => void;
  onSwitchRole: (role: string) => void;
  onLogout: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}) {
  const { open } = useSidebar();

  if (!user) {
    return null;
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const accessibleUserLabel = `Signed in as ${user.name}, ${user.role}`;

  return (
    <div className="pt-3 border-t-2 border-ink space-y-2 mt-auto shrink-0">
      {/* User Card */}
      <div
        className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-none transition-colors select-none',
          open ? 'bg-surface border-2 border-ink' : 'justify-center'
        )}
        title={accessibleUserLabel}
        aria-label={accessibleUserLabel}
      >
        <div
          className="w-8 h-8 rounded-none border-2 border-ink bg-ink flex items-center justify-center text-surface font-mono font-bold text-xs shrink-0"
          aria-hidden="true"
        >
          {userInitial}
        </div>
        {open && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-bold text-xs text-ink truncate leading-tight font-mono">
              {user?.name || 'Demo Persona'}
            </p>
            <p className="text-[10px] uppercase font-bold text-ink-3 mt-0.5 tracking-wider font-mono">
              {user?.role || 'Guest'}
            </p>
          </div>
        )}
      </div>

      {/* Switch Demo Persona Action */}
      {demoEnabled && (
        <>
          <SidebarButton
            item={{
              id: 'reset-demo',
              label: isResetting ? 'Resetting dataset…' : 'Reset demo data',
              icon: <RotateCcw className={cn('w-5 h-5', isResetting && 'animate-spin')} aria-hidden="true" />,
              onClick: onResetDemo,
              disabled: isResetting,
            }}
          />
          <div className="relative">
            <SidebarButton
              item={{
                id: 'switch-persona',
                label: 'Switch demo persona',
                icon: <Users className="w-5 h-5" aria-hidden="true" />,
                onClick: () => setDemoMenuOpen(!demoMenuOpen),
              }}
            />

          {demoMenuOpen && (
            <div
              className={cn(
                'absolute bottom-full mb-2 bg-surface border-2 border-ink rounded-none shadow-hard-lg p-2 text-xs z-50 w-56 font-mono',
                open ? 'left-0' : 'left-12'
              )}
              role="menu"
              aria-label="Switch demo persona"
            >
              <div className="px-2 py-1 border-b-2 border-ink text-[10px] text-ink-3 font-bold uppercase tracking-wider mb-1">
                Select Persona
              </div>
              {DEMO_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="menuitem"
                  onClick={() => onSwitchRole(p.role)}
                  className="w-full text-left px-2 py-2 rounded-none hover:bg-surface-2 flex items-center justify-between transition-colors border border-transparent hover:border-ink mb-1"
                >
                  <div>
                    <p className="font-bold text-ink">{p.name}</p>
                    <p className="text-[10px] text-ink-2 uppercase">{p.desc}</p>
                  </div>
                  {user?.name?.startsWith(p.name.split(' ')[0]) && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {/* Logout Action */}
      <SidebarButton
        item={{
          id: 'logout',
          label: 'Log out',
          icon: <LogOut className="w-5 h-5 text-red-600" aria-hidden="true" />,
          onClick: onLogout,
        }}
        className="hover:bg-red-50 hover:text-red-700"
      />
    </div>
  );
}
