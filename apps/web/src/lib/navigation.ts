/**
 * Shared Navigation Config
 *
 * Campus-aware IA (Feb 2026):
 * - Campus mode: Discover | Spaces | You (Create is a dedicated FAB/button)
 * - Non-campus mode: Spaces | Create | You
 */

import { BeakerIcon, SpacesIcon, CompassIcon, UserIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

export const CAMPUS_NAV_ITEMS: NavItem[] = [
  {
    id: 'discover',
    label: 'Discover',
    href: '/discover',
    icon: CompassIcon,
    matchPattern: /^\/discover(\/|$)|^\/explore(\/|$)/,
  },
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: SpacesIcon,
    matchPattern: /^\/spaces(\/|$)|^\/s\//,
  },
  {
    id: 'you',
    label: 'You',
    href: '/me',
    icon: UserIcon,
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/settings(\/|$)|^\/u\//,
  },
];

export const NON_CAMPUS_NAV_ITEMS: NavItem[] = [
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: SpacesIcon,
    matchPattern: /^\/spaces(\/|$)|^\/s\//,
  },
  {
    id: 'create',
    label: 'Create',
    href: '/lab/new',
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

/**
 * Backwards-compatible default for existing imports.
 * Campus users are the default IA.
 */
export const NAV_ITEMS: NavItem[] = CAMPUS_NAV_ITEMS;

export function getNavItems(hasCampus: boolean): NavItem[] {
  return hasCampus ? CAMPUS_NAV_ITEMS : NON_CAMPUS_NAV_ITEMS;
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
