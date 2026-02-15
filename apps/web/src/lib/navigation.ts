/**
 * Shared Navigation Config
 */

import { CompassIcon, SpacesIcon, UserIcon, CalendarIcon, BeakerIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
  /** Hide this item from the mobile bottom bar (shown only on desktop top bar). */
  desktopOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/discover',
    icon: CompassIcon,
    matchPattern: /^\/discover(\/|$)|^\/feed(\/|$)/,
  },
  {
    id: 'events',
    label: 'Events',
    href: '/events',
    icon: CalendarIcon,
    matchPattern: /^\/events(\/|$)/,
  },
  {
    id: 'lab',
    label: 'Lab',
    href: '/lab',
    icon: BeakerIcon,
    matchPattern: /^\/lab(\/|$)/,
    desktopOnly: true,
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

export function getNavItems(hasCampus: boolean): NavItem[] {
  void hasCampus;
  return NAV_ITEMS;
}

/** Return only the items suitable for the mobile bottom bar (excludes desktopOnly). */
export function getMobileNavItems(hasCampus: boolean): NavItem[] {
  return getNavItems(hasCampus).filter((item) => !item.desktopOnly);
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
