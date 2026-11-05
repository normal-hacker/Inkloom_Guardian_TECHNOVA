'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useInView, Variants } from 'framer-motion';
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from 'canvas-confetti';
import confetti from 'canvas-confetti';

// --- CONFETTI CANVAS ---
type Api = { fire: (options?: ConfettiOptions) => void };
export type ConfettiRef = Api | null;

const Confetti = forwardRef<
  ConfettiRef,
  React.ComponentPropsWithRef<'canvas'> & {
    options?: ConfettiOptions;
    globalOptions?: ConfettiGlobalOptions;
    manualstart?: boolean;
  }
>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      }
    },
    [globalOptions]
  );

  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options]);
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) fire();
  }, [manualstart, fire]);

  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = 'Confetti';

// --- BLUR FADE ANIMATION ---
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}
function BlurFade({ children, className, duration = 0.35, delay = 0, yOffset = 6 }: BlurFadeProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: 'blur(4px)' },
    visible: { y: 0, opacity: 1, filter: 'blur(0px)' },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={defaultVariants}
      transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- GLASS BUTTON COMPONENT (WITH DOUBLE-CLICK BUG FIX) ---
const glassButtonVariants = cva(
  'relative isolate all-unset cursor-pointer rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        default: 'text-sm font-semibold',
        sm: 'text-xs font-semibold',
        lg: 'text-base font-semibold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { size: 'default' },
  }
);
const glassButtonTextVariants = cva('glass-button-text relative block select-none tracking-normal', {
  variants: {
    size: {
      default: 'px-5 py-3',
      sm: 'px-3.5 py-2',
      lg: 'px-7 py-3.5',
      icon: 'flex h-10 w-10 items-center justify-center',
    },
  },
  defaultVariants: { size: 'default' },
});

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, onClick, disabled, ...props }, ref) => {
    // FIX 1: Wrapper click check to prevent double click firing
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const button = e.currentTarget.querySelector('button');
      if (!button || button.contains(e.target as Node)) return;
      button.click();
    };

    return (
      <div
        className={cn('glass-button-wrap cursor-pointer rounded-full relative', className)}
        onClick={handleWrapperClick}
      >
        <button
          className={cn(
            'glass-button relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            glassButtonVariants({ size })
          )}
          ref={ref}
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none"></div>
      </div>
    );
  }
);
GlassButton.displayName = 'GlassButton';

// --- THEME-AWARE SVG GRADIENT BACKGROUND ---
// FIX 6: Red destructive blob replaced with --color-chart-5 so background stays on-brand
const GradientBackground = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 800 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    className="absolute top-0 left-0 w-full h-full opacity-65 pointer-events-none"
  >
    <defs>
      <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.7 }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-chart-3)', stopOpacity: 0.5 }} />
      </linearGradient>
      <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--color-chart-4)', stopOpacity: 0.8 }} />
        <stop offset="50%" style={{ stopColor: 'var(--color-secondary)', stopOpacity: 0.6 }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-chart-1)', stopOpacity: 0.5 }} />
      </linearGradient>
      <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: 'var(--color-chart-5)', stopOpacity: 0.7 }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-accent)', stopOpacity: 0.4 }} />
      </radialGradient>
      <filter id="rev_blur1" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="35" />
      </filter>
      <filter id="rev_blur2" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="25" />
      </filter>
      <filter id="rev_blur3" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="45" />
      </filter>
    </defs>
    <g className="login-float-1">
      <ellipse cx="200" cy="500" rx="250" ry="180" fill="url(#rev_grad1)" filter="url(#rev_blur1)" transform="rotate(-30 200 500)" />
      <rect x="500" y="100" width="300" height="250" rx="80" fill="url(#rev_grad2)" filter="url(#rev_blur2)" transform="rotate(15 650 225)" />
    </g>
    <g className="login-float-2">
      <circle cx="650" cy="450" r="150" fill="url(#rev_grad3)" filter="url(#rev_blur3)" opacity="0.7" />
      <ellipse cx="50" cy="150" rx="180" ry="120" fill="var(--color-accent)" filter="url(#rev_blur2)" opacity="0.8" />
    </g>
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-5 h-5 flex-shrink-0">
    <g fillRule="evenodd" fill="none">
      <g fillRule="nonzero" transform="translate(3, 2)">
        <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path>
        <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path>
        <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path>
        <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path>
      </g>
    </g>
  </svg>
);

// --- TOP-LEVEL MODAL COMPONENT (FIX 2: MOVED OUTSIDE PARENT) ---
interface ModalProps {
  status: Status;
  onDismissError?: () => void;
}

function AuthModal({ status, onDismissError }: ModalProps) {
  const tryAgainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status.state === 'error') {
      tryAgainRef.current?.focus();
    }
  }, [status.state]);

  const isOpen = status.state !== 'idle';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-sm flex flex-col items-center gap-4 shadow-2xl text-center"
          >
            {status.state === 'error' && (
              <>
                <button
                  onClick={onDismissError}
                  aria-label="Close error modal"
                  className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-destructive">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 id="auth-modal-title" className="text-base font-bold text-foreground">
                  Authentication Problem
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {status.message || 'Unable to complete sign in. Please verify your credentials and try again.'}
                </p>
                {status.retryAfter && (
                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Retry available in {status.retryAfter} seconds.
                  </p>
                )}
                <GlassButton ref={tryAgainRef} onClick={onDismissError} size="sm" className="mt-2">
                  Try Again
                </GlassButton>
              </>
            )}

            {status.state === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <h2 id="auth-modal-title" className="text-base font-bold text-foreground">
                  {status.step || 'Signing you in…'}
                </h2>
                <p className="text-xs text-muted-foreground">Preparing your brand governance workspace</p>
              </div>
            )}

            {status.state === 'success' && (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 id="auth-modal-title" className="text-base font-bold text-foreground">
                  {status.message || 'Welcome to Inkloom Guardian!'}
                </h2>
                <p className="text-xs text-muted-foreground">Redirecting to your dashboard…</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- COMPONENT API TYPES ---
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
  logo?: React.ReactNode;
  brandName?: string;
  providers?: Providers;
  demoUsers?: DemoUser[];
  status?: Status;
  onDemoLogin?: (user: DemoUser) => void;
  onPasswordLogin?: (email: string, password: string) => void;
  onGoogle?: () => void;
  onDismissError?: () => void;
}

const DEFAULT_DEMO_USERS: DemoUser[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Asha Patel',
    role: 'creator',
    blurb: 'Submit content and fix flagged issues',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Ben Cooper',
    role: 'creator',
    blurb: 'A second creator, for approval tests',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Priya Nair',
    role: 'reviewer',
    blurb: 'Review findings, approve or request changes',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Marcus Vance',
    role: 'manager',
    blurb: 'Rules, insights and audit trail',
  },
];

export const AuthComponent = ({
  logo = (
    <div className="bg-primary text-primary-foreground rounded-xl p-2 shadow-sm">
      <ShieldCheck className="h-5 w-5" />
    </div>
  ),
  brandName = 'Inkloom Guardian',
  providers = { demo: true, password: true, google: false },
  demoUsers = DEFAULT_DEMO_USERS,
  status = { state: 'idle' },
  onDemoLogin,
  onPasswordLogin,
  onGoogle,
  onDismissError,
}: AuthComponentProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<'choose' | 'password'>('choose');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confettiRef = useRef<ConfettiRef>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;

  // FIX 7: Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // FIX 8: Fire subtle confetti once on success
  useEffect(() => {
    if (status.state === 'success' && !prefersReducedMotion) {
      confettiRef.current?.fire({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.65 },
      });
    }
  }, [status.state, prefersReducedMotion]);

  useEffect(() => {
    if (authStep === 'password') {
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    }
  }, [authStep]);

  const handleProgressToPassword = () => {
    if (isEmailValid) {
      setAuthStep('password');
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProgressToPassword();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isPasswordValid && !isSubmitting) {
      e.preventDefault();
      handlePasswordSubmit();
    }
  };

  const handlePasswordSubmit = () => {
    if (!password || isSubmitting) return;
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
    <div className="bg-background min-h-screen w-screen flex flex-col justify-between relative overflow-x-hidden">
      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
      <AuthModal status={status} onDismissError={onDismissError} />

      {/* Brand Header */}
      <header className="fixed top-4 left-4 z-20 flex items-center gap-2.5 md:left-1/2 md:-translate-x-1/2 bg-card/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/40">
        {logo}
        <h1 className="text-sm font-bold text-foreground tracking-tight">{brandName}</h1>
      </header>

      {/* Main Form Center Panel */}
      <main className="flex w-full flex-1 items-center justify-center relative overflow-hidden py-20 px-4">
        <GradientBackground />

        {/* FIX 6: Contrast Backdrop Card */}
        <div className="relative z-10 w-full max-w-[min(92vw,440px)] bg-card/75 backdrop-blur-xl border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {authStep === 'choose' ? (
              <motion.div
                key="choose-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-5 w-full"
              >
                {/* Headline */}
                <BlurFade delay={0.05} className="w-full text-center">
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-foreground break-words leading-tight">
                    Check before you publish.
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Sign in to review content against your approved brand rules. A human always makes the final decision.
                  </p>
                </BlurFade>

                {/* 1. Try the demo section (Primary) */}
                {providers.demo && (
                  <BlurFade delay={0.1} className="w-full flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider px-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Try the demo — no sign-up needed</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      {demoUsers.map((u) => {
                        const testId = `demo-${u.role}-${u.name.toLowerCase().split(' ')[0]}`;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            data-testid={testId}
                            disabled={isBusy}
                            onClick={() => handleDemoClick(u)}
                            className="glass-button text-left p-3 rounded-2xl flex flex-col justify-between gap-1 transition-all hover:scale-[0.98] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground">{u.name}</span>
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border',
                                  u.role === 'creator' && 'bg-blue-50 text-blue-700 border-blue-200',
                                  u.role === 'reviewer' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                  u.role === 'manager' && 'bg-purple-50 text-purple-700 border-purple-200'
                                )}
                              >
                                {u.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">{u.blurb}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic text-center">
                      Tip: submit as Asha, then approve as Priya.
                    </p>
                  </BlurFade>
                )}

                {/* OR Divider */}
                <BlurFade delay={0.15} className="w-full">
                  <div className="flex items-center w-full gap-3 py-1">
                    <hr className="w-full border-border/80" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">OR</span>
                    <hr className="w-full border-border/80" />
                  </div>
                </BlurFade>

                {/* 2. Optional Google Sign-In */}
                <BlurFade delay={0.2} className="w-full flex flex-col gap-1.5">
                  <GlassButton
                    type="button"
                    disabled={!providers.google || isBusy}
                    aria-disabled={!providers.google}
                    aria-describedby={!providers.google ? 'google-disabled-desc' : undefined}
                    onClick={onGoogle}
                    className="w-full"
                    contentClassName="flex items-center justify-center gap-2.5 w-full py-2.5 text-xs font-bold text-foreground"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </GlassButton>
                  {!providers.google && (
                    <span id="google-disabled-desc" className="text-[10px] text-muted-foreground text-center block">
                      Not available on this deployment — demo accounts work without it
                    </span>
                  )}
                </BlurFade>

                {/* 3. Email Input Step */}
                {providers.password && (
                  <BlurFade delay={0.25} className="w-full">
                    <div className="relative w-full">
                      {/* FIX 3 & 4: Accessible inputs with focus rings */}
                      <label htmlFor="auth-email-input" className="sr-only">
                        Email address
                      </label>
                      <div className="glass-input-wrap w-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                        <div className="glass-input flex items-center px-3 py-1.5 rounded-full">
                          <Mail className="h-4 w-4 text-muted-foreground ml-1 mr-2 flex-shrink-0" />
                          <input
                            id="auth-email-input"
                            name="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="Enter your email"
                            value={email}
                            disabled={isBusy}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleEmailKeyDown}
                            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground flex-grow focus:outline-none py-1.5"
                          />
                          {isEmailValid && (
                            <GlassButton
                              type="button"
                              size="icon"
                              disabled={isBusy}
                              onClick={handleProgressToPassword}
                              aria-label="Continue to password"
                              className="h-8 w-8 flex-shrink-0"
                              contentClassName="h-8 w-8 p-0 flex items-center justify-center text-foreground"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </GlassButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </BlurFade>
                )}

                {/* 4. Collapsible Demo Credentials */}
                {providers.demo && (
                  <BlurFade delay={0.3} className="w-full text-left">
                    <details className="text-[11px] text-muted-foreground bg-slate-50/70 border border-border/60 rounded-xl p-2.5 cursor-pointer">
                      <summary className="font-semibold text-foreground/80 select-none">Demo credentials (for password login)</summary>
                      <ul className="mt-2 space-y-1 font-mono text-[10px] text-slate-700 pl-2">
                        <li>• asha@brightwaysolar.com (Creator) / DemoPass123!</li>
                        <li>• ben@brightwaysolar.com (Creator) / DemoPass123!</li>
                        <li>• priya@brightwaysolar.com (Reviewer) / DemoPass123!</li>
                        <li>• marcus@brightwaysolar.com (Manager) / DemoPass123!</li>
                      </ul>
                    </details>
                  </BlurFade>
                )}
              </motion.div>
            ) : (
              /* Password Step */
              <motion.div
                key="password-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-5 w-full"
              >
                <div className="w-full text-center">
                  <h2 className="font-serif font-bold text-2xl tracking-tight text-foreground">Welcome back</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Signing in as <span className="font-bold text-foreground">{email}</span>
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="relative w-full">
                    <label htmlFor="auth-password-input" className="sr-only">
                      Password
                    </label>
                    <div className="glass-input-wrap w-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                      <div className="glass-input flex items-center px-3 py-1.5 rounded-full">
                        <Lock className="h-4 w-4 text-muted-foreground ml-1 mr-2 flex-shrink-0" />
                        <input
                          id="auth-password-input"
                          ref={passwordInputRef}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          disabled={isBusy}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordKeyDown}
                          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground flex-grow focus:outline-none py-1.5"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-full focus:outline-none focus:ring-1 focus:ring-primary mr-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {isPasswordValid && (
                          <GlassButton
                            type="button"
                            size="icon"
                            disabled={isBusy}
                            onClick={handlePasswordSubmit}
                            aria-label="Submit password"
                            className="h-8 w-8 flex-shrink-0"
                            contentClassName="h-8 w-8 p-0 flex items-center justify-center text-foreground"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setAuthStep('choose')}
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-semibold focus:outline-none focus:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Go back</span>
                    </button>
                    <span className="text-[11px] text-muted-foreground/70">Press Enter to sign in</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 w-full py-4 px-4 border-t border-border/40 bg-card/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="text-[11px] text-center sm:text-left">
            Demo mode uses fictional data. Don&apos;t enter real confidential content.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-foreground/80">
            <Link href="/demo-report" className="hover:text-primary transition-colors">
              Sample Report
            </Link>
            <Link href="/about-ai" className="hover:text-primary transition-colors">
              About AI & Privacy
            </Link>
            <Link href="/build-notes" className="hover:text-primary transition-colors">
              Build Notes
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
