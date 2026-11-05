'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export type Role = 'creator' | 'reviewer' | 'manager';

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  blurb: string;
}

export interface Providers {
  demo: boolean;
  password: boolean;
  google: boolean;
}

export interface Status {
  state: 'idle' | 'loading' | 'success' | 'error';
  step?: string;
  message?: string;
  retryAfter?: number;
}

export interface AuthComponentProps {
  providers?: Providers;
  demoUsers?: DemoUser[];
  status?: Status;
  onDemoLogin?: (user: DemoUser) => void;
  onPasswordLogin?: (email: string, pass: string) => void;
  onGoogle?: () => void;
  onDismissError?: () => void;
}

export function AuthComponent({
  providers = { demo: true, password: true, google: false },
  demoUsers = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Asha Patel',
      role: 'creator',
      blurb: 'Submit content and fix flagged issues',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Ben Torres',
      role: 'creator',
      blurb: 'A second creator, for approval tests',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Priya Sharma',
      role: 'reviewer',
      blurb: 'Review findings, approve or request changes',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Marcus Vance',
      role: 'manager',
      blurb: 'Rules, insights and audit trail',
    },
  ],
  status = { state: 'idle' },
  onDemoLogin,
  onPasswordLogin,
  onGoogle,
  onDismissError,
}: AuthComponentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'choose' | 'password'>('choose');

  const isLoading = status.state === 'loading';

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStep('password');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onPasswordLogin?.(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center font-serif">
          Inkloom Guardian
        </h1>
        <p className="mt-2 text-sm text-slate-600 text-center max-w-sm">
          Check before you publish. A human always makes the final decision.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Status Messages */}
        <div aria-live="polite" className="mb-6">
          {status.state === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold">{status.message || 'Authentication failed.'}</p>
                {status.retryAfter && (
                  <p className="mt-1 text-xs">Please retry after {status.retryAfter} seconds.</p>
                )}
                {onDismissError && (
                  <button
                    onClick={onDismissError}
                    className="mt-2 text-xs font-bold underline hover:text-red-950"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {status.state === 'loading' && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-indigo-900 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>{status.step || 'Signing you in…'}</span>
            </div>
          )}

          {status.state === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{status.message || 'Signed in successfully! Preparing workspace…'}</span>
            </div>
          )}
        </div>

        {/* Section 1: One-Click Demo Accounts */}
        {providers.demo && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Try the Demo — No Sign-Up Needed
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {demoUsers.map((user) => {
                const firstName = user.name.split(' ')[0];
                const testId = `demo-${user.role}-${firstName}`;
                return (
                  <button
                    key={user.id}
                    data-testid={testId}
                    disabled={isLoading}
                    onClick={() => onDemoLogin?.(user)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 flex items-center justify-between group disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-950">
                          {user.name}
                        </span>
                        <span
                          className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            user.role === 'creator'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'reviewer'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.blurb}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-slate-500 italic">
              Tip: Submit content as Asha, then approve as Priya.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold">Or</span>
          </div>
        </div>

        {/* Section 2: Google Sign-in (Optional) */}
        <div className="mb-6">
          <button
            type="button"
            disabled={!providers.google || isLoading}
            onClick={onGoogle}
            className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-3 text-sm font-semibold transition-all ${
              providers.google
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          {!providers.google && (
            <p className="mt-1 text-center text-[11px] text-slate-400">
              Not configured on this deployment — demo accounts work without it.
            </p>
          )}
        </div>

        {/* Section 3: Password Sign-in */}
        {providers.password && (
          <div>
            {step === 'choose' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sign in with email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@brightway.example"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Signing in as {email}</span>
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="relative">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-7 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50"
                >
                  Sign in
                </button>
              </form>
            )}

            {/* Collapsible Demo Credentials */}
            <details className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 cursor-pointer">
              <summary className="font-semibold text-slate-600 hover:text-slate-800">
                View demo account credentials
              </summary>
              <div className="mt-2 space-y-1 font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p>asha@brightway.example / Asha2026!</p>
                <p>ben@brightway.example / Ben2026!</p>
                <p>priya@brightway.example / Priya2026!</p>
                <p>marcus@brightway.example / Marcus2026!</p>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <footer className="mt-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap justify-center gap-4 text-slate-600 font-medium">
          <a href="/demo-report" className="hover:text-indigo-600 underline">
            View Sample Report
          </a>
          <span>·</span>
          <a href="/about-ai" className="hover:text-indigo-600 underline">
            About AI & Privacy
          </a>
          <span>·</span>
          <a href="/build-notes" className="hover:text-indigo-600 underline">
            Build Notes
          </a>
          <span>·</span>
          <a href="/selftest" className="hover:text-indigo-600 underline">
            Engine Self-Test
          </a>
        </div>
        <p className="text-[11px] text-slate-400">
          Demo mode uses fictional data. Do not enter confidential production assets.
        </p>
      </footer>
    </div>
  );
}
