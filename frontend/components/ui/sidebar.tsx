'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Menu, X, Pin, PinOff, ShieldCheck } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface SidebarButtonItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
}

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  pinned: boolean;
  setPinned: (pinned: boolean) => void;
  animate: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

const LOCAL_STORAGE_PIN_KEY = 'inkloom_sidebar_pinned';

export function SidebarProvider({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [pinned, setPinnedState] = React.useState(false);

  // Read initial pinned state safely
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PIN_KEY);
      if (stored === 'true') {
        setPinnedState(true);
        setInternalOpen(true);
      }
    } catch {}
  }, []);

  const setPinned = React.useCallback((nextPinned: boolean) => {
    setPinnedState(nextPinned);
    try {
      localStorage.setItem(LOCAL_STORAGE_PIN_KEY, String(nextPinned));
    } catch {}
    if (nextPinned) {
      setInternalOpen(true);
    }
  }, []);

  const open = openProp !== undefined ? openProp : internalOpen || pinned;
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (pinned && !nextOpen) return; // stay open if pinned
      if (setOpenProp) {
        setOpenProp(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }
    },
    [pinned, setOpenProp]
  );

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        pinned,
        setPinned,
        animate,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  open,
  setOpen,
  animate = true,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}) {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
}

export function BrandMark({ expanded, className }: { expanded?: boolean; className?: string }) {
  const { open } = useSidebar();
  const isExpanded = expanded !== undefined ? expanded : open;

  return (
    <div className={cn('flex items-center gap-3 select-none h-10', className)}>
      <div className="w-9 h-9 border-2 border-ink bg-ink flex items-center justify-center text-surface shadow-hard-sm shrink-0 rounded-none">
        <ShieldCheck className="w-5 h-5 text-surface" aria-hidden="true" />
      </div>
      <div
        className={cn(
          'transition-all duration-200 overflow-hidden whitespace-nowrap',
          isExpanded ? 'opacity-100 max-w-48' : 'opacity-0 max-w-0'
        )}
      >
        <span className="font-bold text-sm text-ink tracking-tight font-mono uppercase block">
          Inkloom Guardian
        </span>
        <span className="text-[10px] uppercase font-bold text-ink-3 tracking-wider font-mono block">
          Brand Integrity
        </span>
      </div>
    </div>
  );
}

export function SidebarBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen, pinned, setPinned } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Check if device supports hover
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none)').matches
    ) {
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!pinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 150);
    }
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!pinned && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'relative hidden md:block shrink-0 transition-all duration-300',
        pinned ? 'w-[280px]' : 'w-16'
      )}
    >
      <motion.nav
        aria-label="Main"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        initial={false}
        animate={{
          width: pinned || open ? 280 : 64,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', bounce: 0, duration: 0.3 }
        }
        className={cn(
          'h-full z-40 flex flex-col justify-between py-4 px-2.5 bg-surface-2 border-r-2 border-ink text-ink select-none overflow-hidden rounded-none',
          pinned ? 'relative' : 'absolute top-0 left-0 bottom-0 shadow-hard-lg',
          className
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Row: Logo + Pin button */}
          <div className="flex items-center justify-between px-1.5 mb-6 shrink-0 h-10">
            <BrandMark />
            {(open || pinned) && (
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                aria-pressed={pinned}
                aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                className={cn(
                  'w-8 h-8 rounded-none border-2 border-ink bg-surface flex items-center justify-center text-ink hover:bg-surface-2 shadow-hard-sm transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                  pinned && 'bg-ink text-surface'
                )}
              >
                {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Nav Items Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
            {children}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}

export function MobileSidebar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useSidebar();
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape & trap focus
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, setOpen]);

  return (
    <div className="md:hidden w-full bg-surface border-b-2 border-ink px-4 py-2.5 flex items-center justify-between z-30 shrink-0 text-ink">
      <BrandMark expanded={true} />

      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="mobile-sidebar-drawer"
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-none border-2 border-ink bg-surface flex items-center justify-center text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="fixed inset-0 bg-ink/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-out Drawer */}
            <motion.div
              ref={drawerRef}
              id="mobile-sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', bounce: 0, duration: 0.3 }
              }
              className={cn(
                'relative w-[min(85vw,320px)] h-full bg-surface-2 border-r-2 border-ink p-5 flex flex-col justify-between shadow-hard-lg z-10 text-ink',
                className
              )}
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between pb-4 border-b-2 border-ink mb-4 shrink-0">
                  <BrandMark expanded={true} />
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => {
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className="w-8 h-8 rounded-none border-2 border-ink bg-surface flex items-center justify-center text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <nav aria-label="Main" className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
                  {children}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarLink({
  link,
  active,
  className,
  onClick,
}: {
  link: SidebarItem;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const { open, setOpen } = useSidebar();

  const handleClick = () => {
    onClick?.();
    // On mobile, close drawer automatically after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <Link
      href={link.href}
      onClick={handleClick}
      aria-label={link.label}
      aria-current={active ? 'page' : undefined}
      title={link.label}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-none text-xs font-mono font-bold transition-all duration-120 min-h-11 relative select-none',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3',
        active
          ? 'bg-ink text-surface border-2 border-ink shadow-hard-sm'
          : 'text-ink-2 hover:text-ink hover:bg-surface border-2 border-transparent',
        className
      )}
    >
      <span className={cn('shrink-0 flex items-center justify-center', active ? 'text-surface' : 'text-ink')}>
        {link.icon}
      </span>
      <span
        className={cn(
          'transition-all duration-200 overflow-hidden whitespace-nowrap text-xs group-hover:translate-x-0.5',
          open ? 'opacity-100 max-w-48' : 'opacity-0 max-w-0'
        )}
      >
        {link.label}
      </span>
      {link.badge !== undefined && link.badge > 0 && (
        <span
          className={cn(
            'ml-auto flex h-4 min-w-4 items-center justify-center rounded-none border border-ink bg-severity-blocker px-1 text-[10px] font-mono font-bold text-ink transition-opacity',
            open ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          {link.badge > 99 ? '99+' : link.badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarButton({
  item,
  active,
  className,
}: {
  item: SidebarButtonItem;
  active?: boolean;
  className?: string;
}) {
  const { open } = useSidebar();

  return (
    <button
      type="button"
      onClick={item.onClick}
      disabled={item.disabled}
      aria-label={item.label}
      title={item.label}
      className={cn(
        'w-full group flex items-center gap-3 px-3 py-2.5 rounded-none text-xs font-mono font-bold transition-all duration-120 min-h-11 relative select-none text-left',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-3',
        active
          ? 'bg-ink text-surface border-2 border-ink shadow-hard-sm'
          : 'text-ink-2 hover:text-ink hover:bg-surface border-2 border-transparent',
        item.disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="shrink-0 flex items-center justify-center text-ink">{item.icon}</span>
      <span
        className={cn(
          'transition-all duration-200 overflow-hidden whitespace-nowrap text-xs group-hover:translate-x-0.5',
          open ? 'opacity-100 max-w-48' : 'opacity-0 max-w-0'
        )}
      >
        {item.label}
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className={cn(
            'ml-auto flex h-4 min-w-4 items-center justify-center rounded-none border border-ink bg-severity-blocker px-1 text-[10px] font-mono font-bold text-ink transition-opacity',
            open ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </button>
  );
}
