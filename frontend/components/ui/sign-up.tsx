'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface DemoUser {
  id: string;
  name: string;
  role: 'creator' | 'reviewer' | 'manager';
  blurb: string;
}

export interface Providers {
  demo: boolean;
  password: boolean;
  google: boolean;
}

export type Status =
  | { state: 'idle' }
  | { state: 'loading'; step?: string }
  | { state: 'success'; message?: string }
  | { state: 'error'; message: string; retryAfter?: number };

export interface AuthComponentProps {
  providers?: Providers;
  demoUsers?: DemoUser[];
  status?: Status;
  onDemoLogin?: (user: DemoUser) => void;
  onPasswordLogin?: (email: string, pass: string) => void;
  onGoogle?: () => void;
  onDismissError?: () => void;
  brandName?: string;
}

const DEFAULT_DEMO_USERS: DemoUser[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Asha Patel (Author)',
    role: 'creator',
    blurb: 'Author: submits drafts, runs checks, applies suggestions. Cannot approve own work.',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Ben Torres (Author)',
    role: 'creator',
    blurb: 'Author: prepares social copy and blog drafts. Peer collaborator.',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Priya Sharma (Reviewer)',
    role: 'reviewer',
    blurb: 'Reviewer: inspects citations, overrides with reason, approves content.',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Marcus Vance (Admin)',
    role: 'manager',
    blurb: 'Admin: edits guidelines & facts, reviews audit trail and friction insights.',
  },
];

export const AuthComponent: React.FC<AuthComponentProps> = ({
  providers = { demo: true, password: true, google: false },
  demoUsers = DEFAULT_DEMO_USERS,
  status = { state: 'idle' },
  onDemoLogin,
  onPasswordLogin,
  onGoogle,
  onDismissError,
}) => {
  const [authStep, setAuthStep] = useState<'choose' | 'email' | 'password'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authStep === 'email') emailInputRef.current?.focus();
    if (authStep === 'password') passwordInputRef.current?.focus();
  }, [authStep]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;

  const handleEmailSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isEmailValid) setAuthStep('password');
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isPasswordValid || isSubmitting) return;
    setIsSubmitting(true);
    onPasswordLogin?.(email, password);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleDemoClick = (u: DemoUser) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onDemoLogin?.(u);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const isBusy = status.state === 'loading' || status.state === 'success' || isSubmitting;

  return (
    <div className="bg-paper min-h-screen w-full flex flex-col justify-between text-ink">
      {/* Brand Header */}
      <header className="w-full border-b-2 border-ink bg-surface px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-ink bg-ink text-surface flex items-center justify-center shadow-hard-sm">
            <ShieldCheck className="w-5 h-5 text-surface" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-sm font-bold uppercase tracking-tight block">
              Inkloom Guardian
            </span>
            <span className="text-[10px] uppercase font-bold text-ink-3 font-mono tracking-wider block">
              Brand Integrity Platform
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 font-mono text-xs font-bold uppercase">
          <Link href="/demo-report" className="text-ink-2 hover:text-ink underline">
            Sample Report
          </Link>
          <Link href="/about-ai" className="text-ink-2 hover:text-ink underline">
            About AI
          </Link>
          <Link href="/build-notes" className="text-ink-2 hover:text-ink underline">
            Build Notes
          </Link>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center flex-1">
        {/* Left Column: Headline & Rules */}
        <div className="md:col-span-7 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard-sm">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Hackathon Demo Mode · No Sign-Up Needed</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink font-sans leading-[1.05]">
              Check before you publish.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-ink-2 font-sans max-w-xl leading-relaxed">
              Brand compliance checks that cite the exact rule, explain the issue with source rationale, and leave the final approval to a human reviewer.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            {[
              { num: '01', title: 'Real guidelines', desc: 'Checks against active brand guidelines, terminology, and verified facts.' },
              { num: '02', title: 'Cited findings', desc: 'Every blocker or suggestion cites rule key, section number, and excerpt.' },
              { num: '03', title: 'Human decisions', desc: 'The AI never approves. Human reviewers dismiss with reason or approve.' },
            ].map((rule) => (
              <div
                key={rule.num}
                className="p-3.5 border-2 border-ink bg-surface flex items-start gap-3.5 shadow-hard-sm"
              >
                <span className="px-2 py-0.5 bg-ink text-surface font-mono text-xs font-bold">
                  {rule.num}
                </span>
                <div>
                  <p className="font-bold text-sm text-ink">{rule.title}</p>
                  <p className="text-xs text-ink-2 font-mono mt-0.5">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Persona Roles & Governance Table (R1.3) */}
          <div className="w-full border-2 border-ink bg-surface p-4 shadow-hard-sm mt-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-rule">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Demo Personas & Governance Matrix
              </span>
              <span className="font-mono text-[10px] text-ink-3 uppercase">
                RBAC & Blocker Gate Enforced
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b-2 border-ink font-mono text-[11px] uppercase text-ink-2">
                    <th className="py-1.5 pr-2 font-bold">Persona</th>
                    <th className="py-1.5 px-2 font-bold">Role</th>
                    <th className="py-1.5 pl-2 font-bold">Capabilities & Boundary Rules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Asha Patel</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-ink text-[10px] uppercase font-bold text-ink">
                        Author
                      </span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">
                      Creates drafts, runs checks, applies suggestions. <strong className="text-ink">Blocked by gate:</strong> cannot self-approve own drafts.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Ben Torres</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-ink text-[10px] uppercase font-bold text-ink">
                        Author
                      </span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">
                      Prepares social & web copy. Acts as peer author for cross-approval tests.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Priya Sharma</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-accent text-accent-ink border border-ink text-[10px] uppercase font-bold">
                        Reviewer
                      </span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">
                      Reviews citations, overrides/dismisses with mandatory reason, <strong className="text-ink">can approve</strong> (when 0 blockers).
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Marcus Vance</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-ink text-surface border border-ink text-[10px] uppercase font-bold">
                        Admin
                      </span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">
                      Edits brand guidelines & facts, inspects friction insights, views immutable audit ledger.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Boxed Auth Panel */}
        <div className="md:col-span-5 w-full">
          <div className="w-full border-2 border-ink bg-surface p-6 sm:p-8 shadow-hard rounded-none">
            {/* Status alerts */}
            {status.state === 'error' && (
              <div
                role="alert"
                className="mb-6 p-3 border-2 border-ink bg-severity-blocker text-ink text-xs font-mono font-medium flex items-start justify-between gap-2"
              >
                <span>{status.message}</span>
                {onDismissError && (
                  <button type="button" onClick={onDismissError} aria-label="Dismiss error">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {status.state === 'loading' && (
              <div className="mb-6 p-3 border-2 border-ink bg-surface-2 text-ink text-xs font-mono font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>{status.step || 'Signing you in…'}</span>
              </div>
            )}

            {status.state === 'success' && (
              <div className="mb-6 p-4 border-2 border-ink bg-status-approved text-ink text-sm font-mono font-bold flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-ink" />
                <span>{status.message || 'Signed in! Redirecting…'}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {authStep === 'choose' ? (
                <motion.div
                  key="choose-step"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Demo Accounts */}
                  {providers.demo && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-ink">
                        <span>One-Click Demo Access</span>
                        <span className="text-ink-3">Instant Login</span>
                      </div>

                      <div className="space-y-2">
                        {demoUsers.map((u) => {
                          const testId = `demo-${u.role}-${u.name.toLowerCase().split(' ')[0]}`;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              data-testid={testId}
                              disabled={isBusy}
                              onClick={() => handleDemoClick(u)}
                              className="w-full text-left p-3.5 border-2 border-ink bg-surface hover:bg-surface-2 transition-all duration-120 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                            >
                              <div>
                                <p className="font-bold text-sm text-ink">{u.name}</p>
                                <p className="text-xs font-mono text-ink-2 mt-0.5 line-clamp-1">
                                  {u.blurb}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-ink bg-surface-2 text-ink">
                                  {u.role}
                                </span>
                                <ArrowRight className="w-4 h-4 text-ink" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-rule" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface px-2 font-mono text-ink-3 font-bold">
                        OR SIGN IN MANUALLY
                      </span>
                    </div>
                  </div>

                  {/* Secondary Auth Options */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setAuthStep('email')}
                      className="w-full min-h-11 px-4 py-2.5 border-2 border-ink bg-surface text-ink font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-surface-2 shadow-hard transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Continue with Email & Password</span>
                    </button>

                    <button
                      type="button"
                      disabled={!providers.google || isBusy}
                      onClick={onGoogle}
                      className={cn(
                        'w-full min-h-11 px-4 py-2.5 border-2 border-ink bg-surface text-ink font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                        !providers.google
                          ? 'border-dashed border-ink-3 text-ink-3 cursor-not-allowed bg-surface-2'
                          : 'hover:bg-surface-2 shadow-hard'
                      )}
                      title={!providers.google ? 'Google OAuth not configured in this environment' : undefined}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {providers.google ? 'Sign in with Google' : 'Google (Not Configured)'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              ) : authStep === 'email' ? (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
                    <h3 className="font-bold text-base text-ink">Enter your email</h3>
                    <button
                      type="button"
                      onClick={() => setAuthStep('choose')}
                      className="text-xs font-mono text-ink-2 hover:text-ink flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-ink">Email Address</label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      placeholder="asha@brightway-solar.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isBusy}
                      className="w-full min-h-11 px-3.5 py-2.5 bg-surface text-ink text-sm border-2 border-ink font-sans focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isEmailValid || isBusy}
                    className="w-full min-h-11 px-4 py-2.5 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-hard hover:bg-accent/90 disabled:bg-surface-2 disabled:text-ink-3 disabled:border-dashed"
                  >
                    <span>Next: Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="password-step"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
                    <h3 className="font-bold text-base text-ink">Enter password</h3>
                    <button
                      type="button"
                      onClick={() => setAuthStep('email')}
                      className="text-xs font-mono text-ink-2 hover:text-ink flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-ink">
                      Password for {email}
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isBusy}
                        className="w-full min-h-11 pl-3.5 pr-10 py-2.5 bg-surface text-ink text-sm border-2 border-ink font-sans focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isPasswordValid || isBusy}
                    className="w-full min-h-11 px-4 py-2.5 bg-accent text-accent-ink border-2 border-ink font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 shadow-hard hover:bg-accent/90 disabled:bg-surface-2 disabled:text-ink-3 disabled:border-dashed"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t-2 border-ink bg-surface px-6 md:px-8 py-5">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-2">
          <p>Demo mode uses fictional data. Decisions require human confirmation.</p>
          <div className="flex items-center gap-6 font-bold uppercase">
            <Link href="/demo-report" className="hover:text-ink underline">
              Sample Report
            </Link>
            <Link href="/about-ai" className="hover:text-ink underline">
              About AI
            </Link>
            <Link href="/build-notes" className="hover:text-ink underline">
              Build Notes
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const AuthShellFallback: React.FC = () => {
  return (
    <div className="bg-paper min-h-screen w-full flex flex-col justify-between text-ink">
      {/* Brand Header */}
      <header className="w-full border-b-2 border-ink bg-surface px-6 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-ink bg-ink text-surface flex items-center justify-center shadow-hard-sm">
            <ShieldCheck className="w-5 h-5 text-surface" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-sm font-bold uppercase tracking-tight block">
              Inkloom Guardian
            </span>
            <span className="text-[10px] uppercase font-bold text-ink-3 font-mono tracking-wider block">
              Brand Integrity Platform
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 font-mono text-xs font-bold uppercase">
          <Link href="/demo-report" className="text-ink-2 hover:text-ink underline">
            Sample Report
          </Link>
          <Link href="/about-ai" className="text-ink-2 hover:text-ink underline">
            About AI
          </Link>
          <Link href="/build-notes" className="text-ink-2 hover:text-ink underline">
            Build Notes
          </Link>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center flex-1">
        {/* Left Column: Headline & Rules */}
        <div className="md:col-span-7 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface border-2 border-ink font-mono text-xs font-bold uppercase shadow-hard-sm">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Hackathon Demo Mode · No Sign-Up Needed</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink font-sans leading-[1.05]">
              Check before you publish.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-ink-2 font-sans max-w-xl leading-relaxed">
              Brand compliance checks that cite the exact rule, explain the issue with source rationale, and leave the final approval to a human reviewer.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            {[
              { num: '01', title: 'Real guidelines', desc: 'Checks against active brand guidelines, terminology, and verified facts.' },
              { num: '02', title: 'Cited findings', desc: 'Every blocker or suggestion cites rule key, section number, and excerpt.' },
              { num: '03', title: 'Human decisions', desc: 'The AI never approves. Human reviewers dismiss with reason or approve.' },
            ].map((rule) => (
              <div
                key={rule.num}
                className="p-3.5 border-2 border-ink bg-surface flex items-start gap-3.5 shadow-hard-sm"
              >
                <span className="px-2 py-0.5 bg-ink text-surface font-mono text-xs font-bold">
                  {rule.num}
                </span>
                <div>
                  <p className="font-bold text-sm text-ink">{rule.title}</p>
                  <p className="text-xs text-ink-2 font-mono mt-0.5">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Persona Roles & Governance Table */}
          <div className="w-full border-2 border-ink bg-surface p-4 shadow-hard-sm mt-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-rule">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Demo Personas & Governance Matrix
              </span>
              <span className="font-mono text-[10px] text-ink-3 uppercase">
                RBAC & Blocker Gate Enforced
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b-2 border-ink font-mono text-[11px] uppercase text-ink-2">
                    <th className="py-1.5 pr-2 font-bold">Persona</th>
                    <th className="py-1.5 px-2 font-bold">Role</th>
                    <th className="py-1.5 pl-2 font-bold">Capabilities & Boundary Rules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Asha Patel</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-ink text-[10px] uppercase font-bold text-ink">Author</span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">Creates drafts, runs checks, applies suggestions. Blocked by gate from self-approving.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Ben Torres</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-ink text-[10px] uppercase font-bold text-ink">Author</span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">Prepares social & web copy. Peer author for cross-approval tests.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Priya Sharma</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-accent text-accent-ink border border-ink text-[10px] uppercase font-bold">Reviewer</span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">Reviews citations, overrides with reason, can approve (when 0 blockers).</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-2 font-bold text-ink whitespace-nowrap">Marcus Vance</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-ink text-surface border border-ink text-[10px] uppercase font-bold">Admin</span>
                    </td>
                    <td className="py-2 pl-2 font-sans text-xs text-ink-2">Edits brand guidelines & facts, inspects friction insights, views immutable audit ledger.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-rendered Boxed Auth Panel */}
        <div className="md:col-span-5 w-full">
          <div className="w-full border-2 border-ink bg-surface p-6 sm:p-8 shadow-hard rounded-none">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-ink">
                  <span>One-Click Demo Access</span>
                  <span className="text-ink-3">Instant Login</span>
                </div>

                <div className="space-y-2">
                  {DEFAULT_DEMO_USERS.map((u) => (
                    <div
                      key={u.id}
                      className="w-full p-3.5 border-2 border-ink bg-surface flex items-center justify-between gap-3 shadow-hard-sm"
                    >
                      <div>
                        <p className="font-bold text-sm text-ink">{u.name}</p>
                        <p className="text-xs font-mono text-ink-2 mt-0.5 line-clamp-1">{u.blurb}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-ink bg-surface-2 text-ink">
                          {u.role}
                        </span>
                        <ArrowRight className="w-4 h-4 text-ink" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t-2 border-ink bg-surface px-6 md:px-8 py-5">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-ink-2">
          <p>Demo mode uses fictional data. Decisions require human confirmation.</p>
          <div className="flex items-center gap-6 font-bold uppercase">
            <Link href="/demo-report" className="hover:text-ink underline">Sample Report</Link>
            <Link href="/about-ai" className="hover:text-ink underline">About AI</Link>
            <Link href="/build-notes" className="hover:text-ink underline">Build Notes</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
