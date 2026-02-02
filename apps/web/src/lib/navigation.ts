/**
 * Shared Navigation Config
 *
 * 4-Pillar IA (Jan 2026):
 * - Home: Unified dashboard (merged Feed + Spaces)
 * - Explore: Discovery hub
 * - Lab: Builder dashboard
 * - You: Own profile + settings
 */

import type { LucideIcon } from 'lucide-react';
import { Compass } from 'lucide-react';
import { HomeIcon, BeakerIcon, UserIcon, SettingsIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon | React.ElementType;
  matchPattern?: RegExp;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    icon: HomeIcon,
    matchPattern: /^\/home(\/|$)|^\/feed(\/|$)|^\/spaces(\/|$)/,
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: Compass,
    matchPattern: /^\/explore(\/|$)/,
  },
  {
    id: 'lab',
    label: 'Lab',
    href: '/lab',
    icon: BeakerIcon,
    matchPattern: /^\/lab(\/|$)/,
  },
  {
    id: 'you',
    label: 'You',
    href: '/me',
    icon: UserIcon,
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/u\//,
  },
];

export const BOTTOM_ITEMS: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    href: '/me/settings',
    icon: SettingsIcon,
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
