import {
  LayoutDashboard,
  FilePlus2,
  BookOpenCheck,
  ChartColumn,
  ScrollText,
  Info,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export type UserRole = 'creator' | 'reviewer' | 'manager';

export interface NavRouteConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  roles: UserRole[] | 'all';
  type?: 'tab';
}

export type NavItemConfig = NavRouteConfig | { type: 'separator'; id: string };

export const NAV_CONFIG: NavItemConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'What needs your attention and the status of your content',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: 'all',
  },
  {
    id: 'guided-demo',
    title: 'Guided Demo',
    description: '7-step interactive walkthrough: checks, blocker gates & audit ledger',
    icon: Sparkles,
    href: '/demo/guided',
    roles: 'all',
  },
  {
    id: 'new-content',
    title: 'New content',
    description: 'Paste or upload content and run a brand check',
    icon: FilePlus2,
    href: '/content/new',
    roles: 'all',
  },
  {
    id: 'guidelines',
    title: 'Guidelines',
    description: 'Approved rules, terminology and facts the checks use',
    icon: BookOpenCheck,
    href: '/guidelines',
    roles: 'all',
  },
  {
    id: 'insights',
    title: 'Insights',
    description: 'Recurring issues and rules reviewers keep overriding',
    icon: ChartColumn,
    href: '/insights',
    roles: ['reviewer', 'manager'],
  },
  {
    id: 'audit',
    title: 'Audit',
    description: 'Who decided what, on which exact version',
    icon: ScrollText,
    href: '/audit',
    roles: ['reviewer', 'manager'],
  },
  {
    type: 'separator',
    id: 'nav-separator-about',
  },
  {
    id: 'about-ai',
    title: 'About AI',
    description: 'What the AI does, what data leaves the system, limits',
    icon: Info,
    href: '/about-ai',
    roles: 'all',
  },
];

export function getVisibleNavForRole(role?: UserRole | null): NavItemConfig[] {
  if (!role) {
    return NAV_CONFIG.filter((item) => item.type === 'separator' || item.roles === 'all');
  }
  return NAV_CONFIG.filter(
    (item) => item.type === 'separator' || item.roles === 'all' || item.roles.includes(role)
  );
}

