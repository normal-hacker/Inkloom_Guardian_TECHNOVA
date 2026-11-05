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
import { LogOut, Users, Check } from 'lucide-react';
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

    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/v1/auth/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) {
          setDemoEnabled(Boolean(data.demo));
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
}: {
  user: { id: string; email: string; name: string; role: UserRole } | null;
  demoEnabled: boolean;
  demoMenuOpen: boolean;
  setDemoMenuOpen: (open: boolean) => void;
  onSwitchRole: (role: string) => void;
  onLogout: () => void;
}) {
  const { open } = useSidebar();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const roleColor =
    user?.role === 'creator'
      ? 'bg-blue-600'
      : user?.role === 'reviewer'
        ? 'bg-amber-600'
        : 'bg-purple-600';

  const accessibleUserLabel = user
    ? `Signed in as ${user.name}, ${user.role}`
    : 'Signed in as guest';

  return (
    <div className="pt-3 border-t border-slate-200/80 space-y-2 mt-auto shrink-0">
      {/* User Card */}
      <div
        className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-xl transition-colors select-none',
          open ? 'bg-slate-200/50' : 'justify-center'
        )}
        title={accessibleUserLabel}
        aria-label={accessibleUserLabel}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0',
            roleColor
          )}
          aria-hidden="true"
        >
          {userInitial}
        </div>
        {open && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="font-bold text-xs text-slate-900 truncate leading-tight">
              {user?.name || 'Demo Persona'}
            </p>
            <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5 tracking-wider">
              {user?.role || 'Guest'}
            </p>
          </div>
        )}
      </div>

      {/* Switch Demo Persona Action */}
      {demoEnabled && (
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
                'absolute bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 text-xs z-50 w-56',
                open ? 'left-0' : 'left-12'
              )}
              role="menu"
              aria-label="Switch demo persona"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Select Persona
              </div>
              {DEMO_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="menuitem"
                  onClick={() => onSwitchRole(p.role)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:bg-slate-100"
                >
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.desc}</p>
                  </div>
                  {user?.name?.startsWith(p.name.split(' ')[0]) && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
