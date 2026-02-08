/**
 * Shared Navigation Config
 *
 * 4-Pillar IA (Feb 2026):
 * - Home: Dashboard + discovery (merged Feed + Explore)
 * - Spaces: Your communities + residences
 * - Lab: Build tools for your spaces
 * - You: Own profile + settings
 */

import { HomeIcon, SpacesIcon, BeakerIcon, UserIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/home',
    icon: HomeIcon,
    matchPattern: /^\/home(\/|$)|^\/feed(\/|$)|^\/explore(\/|$)/,
  },
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: SpacesIcon,
    matchPattern: /^\/spaces(\/|$)|^\/s\//,
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
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/settings(\/|$)|^\/u\//,
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
