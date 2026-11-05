'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Plus, LogOut, ChevronDown, Check } from 'lucide-react';

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'reviewer' | 'manager';
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleSwitchRole = async (newRole: string) => {
    setRoleMenuOpen(false);
    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
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
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/guidelines', label: 'Guidelines' },
    { href: '/insights', label: 'Insights' },
    { href: '/audit', label: 'Audit Trail' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight">Inkloom Guardian</span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/content/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Content</span>
          </Link>

          {/* Role Switcher Pill */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs text-left transition-colors"
                title="Switch demo persona"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px] ${
                    user.role === 'creator'
                      ? 'bg-blue-600'
                      : user.role === 'reviewer'
                        ? 'bg-amber-600'
                        : 'bg-purple-600'
                  }`}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="font-bold text-slate-800 leading-none">{user.name}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{user.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-100 text-[11px] text-slate-400 font-semibold uppercase">
                    Switch Demo Persona
                  </div>
                  {[
                    { role: 'creator', name: 'Asha Patel', desc: 'Creator' },
                    { role: 'creator', name: 'Ben Torres', desc: 'Creator (2nd)' },
                    { role: 'reviewer', name: 'Priya Sharma', desc: 'Reviewer' },
                    { role: 'manager', name: 'Marcus Vance', desc: 'Manager' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSwitchRole(p.role)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.desc}</p>
                      </div>
                      {user.name.startsWith(p.name.split(' ')[0]) && (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
