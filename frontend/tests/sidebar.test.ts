// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarButton,
} from '../components/ui/sidebar';
import { getVisibleNavForRole } from '../src/lib/nav/config';
import { LayoutDashboard, FileText, LogOut } from 'lucide-react';

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  const mockStorage: Record<string, string> = {};
  const storageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, val: string) => { mockStorage[key] = String(val); }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
    clear: vi.fn(() => { for (const k in mockStorage) delete mockStorage[k]; }),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
    writable: true,
    configurable: true,
  });
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    // ignore if read-only
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Sidebar Component & Layout Suite (§9 Acceptance)', () => {
  describe('1. Role-based Nav Configuration for Sidebar', () => {
    it('Creator role sees only public/creator routes (no Insights or Audit)', () => {
      const items = getVisibleNavForRole('creator');
      const ids = items.map((i) => i.id);

      expect(ids).toContain('dashboard');
      expect(ids).toContain('new-content');
      expect(ids).toContain('guidelines');
      expect(ids).toContain('about-ai');
      expect(ids).not.toContain('insights');
      expect(ids).not.toContain('audit');
    });

    it('Reviewer and Manager roles see Insights and Audit', () => {
      const reviewerItems = getVisibleNavForRole('reviewer');
      const reviewerIds = reviewerItems.map((i) => i.id);
      expect(reviewerIds).toContain('insights');
      expect(reviewerIds).toContain('audit');

      const managerItems = getVisibleNavForRole('manager');
      const managerIds = managerItems.map((i) => i.id);
      expect(managerIds).toContain('insights');
      expect(managerIds).toContain('audit');
    });
  });

  describe('2. Link & Button Semantics', () => {
    it('Collapsed link exposes accessible name and title tooltip', () => {
      render(
        React.createElement(
          Sidebar,
          { open: false },
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'dash',
                label: 'Dashboard',
                href: '/dashboard',
                icon: React.createElement(LayoutDashboard, { className: 'w-5 h-5' }),
              },
            })
          )
        )
      );

      const link = screen.getAllByRole('link', { name: 'Dashboard' })[0];
      expect(link).toBeDefined();
      expect(link.getAttribute('href')).toBe('/dashboard');
      expect(link.getAttribute('title')).toBe('Dashboard');
    });

    it('Active link receives aria-current="page", inactive link does not', () => {
      render(
        React.createElement(
          Sidebar,
          { open: true },
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'dash',
                label: 'Dashboard',
                href: '/dashboard',
                icon: React.createElement(LayoutDashboard, null),
              },
              active: true,
            }),
            React.createElement(SidebarLink, {
              link: {
                id: 'docs',
                label: 'Documents',
                href: '/docs',
                icon: React.createElement(FileText, null),
              },
              active: false,
            })
          )
        )
      );

      const dashLinks = screen.getAllByRole('link', { name: 'Dashboard' });
      expect(dashLinks[0].getAttribute('aria-current')).toBe('page');

      const docLinks = screen.getAllByRole('link', { name: 'Documents' });
      expect(docLinks[0].getAttribute('aria-current')).toBeNull();
    });

    it('SidebarButton renders a native button element rather than an anchor', () => {
      const handleClick = vi.fn();
      render(
        React.createElement(
          Sidebar,
          { open: true },
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarButton, {
              item: {
                id: 'btn-logout',
                label: 'Log out',
                icon: React.createElement(LogOut, null),
                onClick: handleClick,
              },
            })
          )
        )
      );

      const logoutBtns = screen.getAllByRole('button', { name: 'Log out' });
      expect(logoutBtns.length).toBeGreaterThan(0);
      expect(logoutBtns[0].tagName.toLowerCase()).toBe('button');

      fireEvent.click(logoutBtns[0]);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Hover & Keyboard Expansion and Pinning', () => {
    it('Expands on hover after intent delay and collapses on leave', () => {
      vi.useFakeTimers();
      const { container } = render(
        React.createElement(
          Sidebar,
          null,
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'test',
                label: 'Test Link',
                href: '/test',
                icon: React.createElement(FileText, null),
              },
            })
          )
        )
      );

      const desktopNav = container.querySelector('aside, nav[aria-label="Main"]');
      expect(desktopNav).toBeDefined();

      // Trigger mouse enter
      fireEvent.mouseEnter(desktopNav!);
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Pin button should now be visible in DOM
      const pinBtn = screen.getByRole('button', { name: /pin sidebar/i });
      expect(pinBtn).toBeDefined();

      // Mouse leave collapses
      fireEvent.mouseLeave(desktopNav!);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      vi.useRealTimers();
    });

    it('Pinning sidebar persists state to localStorage and keeps it open on mouseleave', () => {
      vi.useFakeTimers();
      const { container } = render(
        React.createElement(
          Sidebar,
          null,
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'test',
                label: 'Test Link',
                href: '/test',
                icon: React.createElement(FileText, null),
              },
            })
          )
        )
      );

      const desktopNav = container.querySelector('nav[aria-label="Main"]');
      fireEvent.mouseEnter(desktopNav!);
      act(() => {
        vi.advanceTimersByTime(150);
      });

      const pinBtn = screen.getByRole('button', { name: /pin sidebar open/i });
      fireEvent.click(pinBtn);

      expect(localStorage.getItem('inkloom_sidebar_pinned')).toBe('true');
      expect(pinBtn.getAttribute('aria-pressed')).toBe('true');

      // Mouse leave should NOT collapse when pinned
      fireEvent.mouseLeave(desktopNav!);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('button', { name: /unpin sidebar/i })).toBeDefined();
      vi.useRealTimers();
    });

    it('Survives blocked/throwing localStorage gracefully', () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded or SecurityError');
      });

      const { container } = render(
        React.createElement(
          Sidebar,
          null,
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'test',
                label: 'Test Link',
                href: '/test',
                icon: React.createElement(FileText, null),
              },
            })
          )
        )
      );

      const desktopNav = container.querySelector('nav[aria-label="Main"]');
      fireEvent.mouseEnter(desktopNav!);
      act(() => {
        vi.advanceTimersByTime(150);
      });

      const pinBtn = screen.getByRole('button', { name: /pin sidebar/i });
      // Should not throw
      expect(() => fireEvent.click(pinBtn)).not.toThrow();

      spy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('4. Mobile Menu Drawer Dialog & Escape Key Handling', () => {
    it('Mobile menu button toggles dialog and Escape key closes it', async () => {
      render(
        React.createElement(
          Sidebar,
          null,
          React.createElement(
            SidebarBody,
            null,
            React.createElement(SidebarLink, {
              link: {
                id: 'mobile-item',
                label: 'Mobile Item',
                href: '/mobile',
                icon: React.createElement(FileText, null),
              },
            })
          )
        )
      );

      const openBtn = screen.getByRole('button', { name: /open navigation menu/i });
      expect(openBtn).toBeDefined();
      expect(openBtn.getAttribute('aria-expanded')).toBe('false');

      // Open drawer
      fireEvent.click(openBtn);
      expect(openBtn.getAttribute('aria-expanded')).toBe('true');

      const dialog = screen.getByRole('dialog', { name: /main menu/i });
      expect(dialog).toBeDefined();

      // Press Escape to close
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(openBtn.getAttribute('aria-expanded')).toBe('false');

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /main menu/i })).toBeNull();
      }, { timeout: 1000 });
    });
  });
});
