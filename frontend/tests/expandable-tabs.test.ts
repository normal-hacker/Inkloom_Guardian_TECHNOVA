// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ExpandableTabs, TabItem } from '../components/ui/expandable-tabs';
import { getVisibleNavForRole } from '../src/lib/nav/config';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

const sampleTabs: TabItem[] = [
  {
    id: 'tab-dash',
    title: 'Dashboard',
    icon: LayoutDashboard,
    badge: 3,
    badgeLabel: 'Dashboard, 3 need your action',
  },
  {
    id: 'tab-docs',
    title: 'Documents',
    icon: FileText,
  },
  {
    type: 'separator',
    id: 'sep-1',
  },
  {
    id: 'tab-settings',
    title: 'Settings',
    icon: Settings,
    disabled: true,
  },
];

describe('ExpandableTabs Component & Nav Suite (§8 Acceptance)', () => {
  describe('1. Role-based Nav Configuration Filtering', () => {
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

    it('Unauthenticated/guest role falls back to public items only', () => {
      const items = getVisibleNavForRole(null);
      const ids = items.map((i) => i.id);
      expect(ids).not.toContain('insights');
      expect(ids).not.toContain('audit');
    });
  });

  describe('2. Accessible Names & Badge Inclusion', () => {
    it('Renders accessible name including badge count when present', () => {
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          ariaLabel: 'Test tabs',
        })
      );

      const dashTab = screen.getByRole('tab', { name: /Dashboard, 3 need your action/i });
      expect(dashTab).toBeDefined();

      const docsTab = screen.getByRole('tab', { name: 'Documents' });
      expect(docsTab).toBeDefined();
    });

    it('Hides badge when badge is 0 or undefined', () => {
      const zeroBadgeTabs: TabItem[] = [
        {
          id: 'zero',
          title: 'ZeroBadge',
          icon: LayoutDashboard,
          badge: 0,
        },
      ];

      const { container } = render(
        React.createElement(ExpandableTabs, {
          tabs: zeroBadgeTabs,
          variant: 'tabs',
        })
      );

      expect(container.querySelector('.rounded-full.bg-primary')).toBeNull();
    });
  });

  describe('3. Tab Interactions & Event Double-Handling Prevention', () => {
    it('Calls onChange exactly once per click', () => {
      const onChange = vi.fn();
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          onChange,
        })
      );

      const docsTab = screen.getByRole('tab', { name: 'Documents' });
      fireEvent.click(docsTab);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('Does not activate disabled tabs', () => {
      const onChange = vi.fn();
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          onChange,
        })
      );

      const settingsTab = screen.getByRole('tab', { name: 'Settings' });
      fireEvent.click(settingsTab);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('4. Controlled vs Uncontrolled & Outside Click Behavior', () => {
    it('Controlled value takes precedence over internal state', () => {
      const { rerender } = render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          value: 0,
        })
      );

      expect(screen.getByRole('tab', { name: /Dashboard/i }).getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('tab', { name: 'Documents' }).getAttribute('aria-selected')).toBe('false');

      rerender(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          value: 1,
        })
      );

      expect(screen.getByRole('tab', { name: /Dashboard/i }).getAttribute('aria-selected')).toBe('false');
      expect(screen.getByRole('tab', { name: 'Documents' }).getAttribute('aria-selected')).toBe('true');
    });

    it('Does NOT collapse active tab on outside click when collapseOnOutsideClick=false (default)', () => {
      const onChange = vi.fn();
      render(
        React.createElement(
          'div',
          null,
          React.createElement(ExpandableTabs, {
            tabs: sampleTabs,
            variant: 'tabs',
            defaultValue: 1,
            collapseOnOutsideClick: false,
            onChange,
          }),
          React.createElement('button', { 'data-testid': 'outside-btn' }, 'Outside')
        )
      );

      const outsideBtn = screen.getByTestId('outside-btn');
      fireEvent.mouseDown(outsideBtn);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('Collapses active tab on outside click when collapseOnOutsideClick=true', () => {
      const onChange = vi.fn();
      render(
        React.createElement(
          'div',
          null,
          React.createElement(ExpandableTabs, {
            tabs: sampleTabs,
            variant: 'tabs',
            defaultValue: 1,
            collapseOnOutsideClick: true,
            onChange,
          }),
          React.createElement('button', { 'data-testid': 'outside-btn' }, 'Outside')
        )
      );

      const outsideBtn = screen.getByTestId('outside-btn');
      fireEvent.mouseDown(outsideBtn);

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('5. Keyboard Roving Focus Navigation', () => {
    it('Navigates forward with ArrowRight and wraps around', () => {
      const onChange = vi.fn();
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          value: 0,
          onChange,
        })
      );

      const dashTab = screen.getByRole('tab', { name: /Dashboard/i });
      fireEvent.keyDown(dashTab, { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('Navigates backward with ArrowLeft and wraps around', () => {
      const onChange = vi.fn();
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          value: 0,
          onChange,
        })
      );

      const dashTab = screen.getByRole('tab', { name: /Dashboard/i });
      fireEvent.keyDown(dashTab, { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('Home and End jump to first and last enabled tabs', () => {
      const onChange = vi.fn();
      render(
        React.createElement(ExpandableTabs, {
          tabs: sampleTabs,
          variant: 'tabs',
          value: 0,
          onChange,
        })
      );

      const dashTab = screen.getByRole('tab', { name: /Dashboard/i });
      fireEvent.keyDown(dashTab, { key: 'End' });
      expect(onChange).toHaveBeenCalledWith(1);

      fireEvent.keyDown(dashTab, { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('6. Nav Variant Semantics', () => {
    it('Renders semantic <nav> and <a> links with aria-current="page"', () => {
      const navTabs: TabItem[] = [
        {
          id: 'nav-dash',
          title: 'Dashboard',
          icon: LayoutDashboard,
          href: '/dashboard',
        },
        {
          id: 'nav-new',
          title: 'New Content',
          icon: FileText,
          href: '/content/new',
        },
      ];

      render(
        React.createElement(ExpandableTabs, {
          tabs: navTabs,
          variant: 'nav',
          value: 0,
          ariaLabel: 'Main Nav',
        })
      );

      const navEl = screen.getByRole('navigation', { name: 'Main Nav' });
      expect(navEl).toBeDefined();

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(2);
      expect(links[0].getAttribute('href')).toBe('/dashboard');
      expect(links[0].getAttribute('aria-current')).toBe('page');
      expect(links[1].getAttribute('href')).toBe('/content/new');
      expect(links[1].getAttribute('aria-current')).toBeNull();
    });
  });
});
