'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { AuthComponent, DemoUser, Providers, Status } from '@/../components/ui/sign-up';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';

  const [providers, setProviders] = useState<Providers>({
    demo: true,
    password: true,
    google: false,
  });
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  // Load configured providers on mount
  useEffect(() => {
    fetch('/api/v1/auth/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProviders({
            demo: data.demo,
            password: data.password,
            google: data.google,
          });
          if (data.demoUsers) {
            setDemoUsers(data.demoUsers);
          }
        }
      })
      .catch(() => {
        // Fall back to default demo accounts
      });
  }, []);

  const handleDemoLogin = async (user: DemoUser) => {
    setStatus({ state: 'loading', step: `Signing you in as ${user.name}…` });

    try {
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, userId: user.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          state: 'error',
          message: data.message || 'Demo login failed.',
          retryAfter: res.status === 429 ? 60 : undefined,
        });
        return;
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setStatus({ state: 'success', message: `Welcome back, ${user.name}!` });

      setTimeout(() => {
        router.push(nextUrl);
      }, 500);
    } catch {
      setStatus({ state: 'error', message: 'Unable to reach the server. Please try again.' });
    }
  };

  const handlePasswordLogin = async (email: string, pass: string) => {
    setStatus({ state: 'loading', step: 'Verifying credentials…' });

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({
          state: 'error',
          message: data.message || 'Email or password is incorrect.',
        });
        return;
      }

      setStatus({ state: 'success', message: 'Signed in successfully!' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch {
      setStatus({ state: 'error', message: 'Network error. Please try again.' });
    }
  };

  return (
    <AuthComponent
      providers={providers}
      demoUsers={demoUsers.length ? demoUsers : undefined}
      status={status}
      onDemoLogin={handleDemoLogin}
      onPasswordLogin={handlePasswordLogin}
      onDismissError={() => setStatus({ state: 'idle' })}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
