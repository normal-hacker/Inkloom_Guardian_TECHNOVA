'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Plus, LogOut, ChevronDown, Check, Sparkles } from 'lucide-react';
import { AppNav } from '@/components/layout/AppNav';

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

  return (
    <header className="border-b border-border bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 group-hover:bg-indigo-700 transition-colors rounded-xl flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Inkloom Guardian
            </span>
          </Link>
        </div>

        {/* Right Actions: AI Disclosure + New Content + User Menu */}
        <div className="flex items-center gap-2.5">
          {/* AI Disclosure Link */}
          <Link
            href="/about-ai"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Read how our AI and deterministic checks work"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Disclosure</span>
          </Link>

          {/* New Content CTA */}
          <Link
            href="/content/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Content</span>
          </Link>

          {/* Role Switcher Persona Pill */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs text-left transition-colors"
                title="Switch demo persona"
                aria-expanded={roleMenuOpen}
                aria-haspopup="true"
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

      {/* Sticky Expandable Navigation Bar */}
      <div className="border-t border-border/60 bg-slate-50/70 backdrop-blur-xs">
        <AppNav userRole={user?.role} />
      </div>
    </header>
  );
}
