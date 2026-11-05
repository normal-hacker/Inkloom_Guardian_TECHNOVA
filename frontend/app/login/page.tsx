'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { AuthComponent, DemoUser, Providers, Status } from '@/../components/ui/sign-up';

export default function LoginPage() {
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

      setStatus({ state: 'success', message: `Welcome, ${user.name}!` });

      // Subtle confetti if reduced motion is not preferred
      if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        // Only allow relative URLs to prevent open redirects
        const safeNext = nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/dashboard';
        router.push(safeNext);
      }, 600);
    } catch {
      setStatus({ state: 'error', message: 'Network error. Please check your connection.' });
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
