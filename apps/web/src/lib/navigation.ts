/**
 * Shared Navigation Config
 *
 * 4-tab model: Home · Spaces · Make · You
 *
 * Home    — campus pulse, events, trending apps, activity
 * Spaces  — your communities, /s/[handle]
 * Make    — creation hub + campus app marketplace
 * You     — portfolio, settings
 */

import { HomeIcon, SpacesIcon, UserIcon, BuildIcon } from '@hive/ui';

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
    href: '/discover',
    icon: HomeIcon,
    matchPattern: /^\/discover(\/|$)|^\/feed(\/|$)|^\/events(\/|$)/,
  },
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: SpacesIcon,
    matchPattern: /^\/spaces(\/|$)|^\/s\//,
  },
  {
    id: 'build',
    label: 'Make',
    href: '/build',
    icon: BuildIcon,
    matchPattern: /^\/build(\/|$)|^\/lab(\/|$)/,
  },
  {
    id: 'you',
    label: 'You',
    href: '/me',
    icon: UserIcon,
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/settings(\/|$)|^\/u\//,
  },
];

export function getNavItems(): NavItem[] {
  return NAV_ITEMS;
}

export function getMobileNavItems(): NavItem[] {
  return getNavItems();
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
