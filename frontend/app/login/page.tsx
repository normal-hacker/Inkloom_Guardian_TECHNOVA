'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthComponent, DemoUser, Providers, Status } from '@/components/ui/sign-up';
import { sanitizeNextUrl } from '@/lib/auth/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = sanitizeNextUrl(searchParams.get('next'));
  const errorParam = searchParams.get('error');

  const [providers, setProviders] = useState<Providers>({
    demo: true,
    password: true,
    google: false,
  });
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  // Handle URL errors (e.g. from Google OAuth callback)
  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        google_failed: 'Google sign-in was cancelled or encountered an error. Demo accounts work without it.',
        google_denied: 'Google access was denied. You can sign in instantly using any demo account.',
        google_not_configured: 'Google sign-in is not configured on this deployment. Please use a demo account.',
        google_state_mismatch: 'Security check failed during Google sign-in. Please try again.',
        session_expired: 'Your session has expired. Please sign in again.',
      };
      setStatus({
        state: 'error',
        message: messages[errorParam] || 'Sign-in failed. Please try again.',
      });
    }
  }, [errorParam]);

  // Check if session already exists on mount
  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          router.replace(nextUrl);
        }
      })
      .catch(() => {});
  }, [router, nextUrl]);

  // Load configured providers
  useEffect(() => {
    fetch('/api/v1/auth/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProviders({
            demo: Boolean(data.demo),
            password: Boolean(data.password),
            google: Boolean(data.google),
          });
          if (data.demoUsers && Array.isArray(data.demoUsers)) {
            setDemoUsers(data.demoUsers);
          }
        }
      })
      .catch(() => {
        // Fall back to default local configuration
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

      setStatus({ state: 'success', message: `Welcome back, ${user.name}!` });

      setTimeout(() => {
        router.push(nextUrl);
      }, 600);
    } catch {
      setStatus({ state: 'error', message: 'Network offline or server unreachable. Please try again.' });
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
          retryAfter: data.retryAfter || (res.status === 429 ? 60 : undefined),
        });
        return;
      }

      setStatus({ state: 'success', message: 'Signed in successfully!' });
      setTimeout(() => {
        router.push(nextUrl);
      }, 600);
    } catch {
      setStatus({ state: 'error', message: 'Network offline or server unreachable. Please try again.' });
    }
  };

  const handleGoogleLogin = () => {
    if (!providers.google) return;
    setStatus({ state: 'loading', step: 'Redirecting to Google…' });
    window.location.href = `/api/v1/auth/google/start?next=${encodeURIComponent(nextUrl)}`;
  };

  return (
    <AuthComponent
      providers={providers}
      demoUsers={demoUsers.length ? demoUsers : undefined}
      status={status}
      onDemoLogin={handleDemoLogin}
      onPasswordLogin={handlePasswordLogin}
      onGoogle={handleGoogleLogin}
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
