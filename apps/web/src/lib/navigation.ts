/**
 * Shared Navigation Config
 *
 * 4-tab model: Feed · Spaces · Lab · Profile
 *
 * Feed   — campus discover, events, activity
 * Spaces — your communities, browse, /s/[handle]
 * Lab    — creation home, your tools, templates
 * Profile — you, settings, account
 */

import { CompassIcon, SpacesIcon, UserIcon, BeakerIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'feed',
    label: 'Feed',
    href: '/discover',
    icon: CompassIcon,
    // Events and feed both live under this tab
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
    id: 'lab',
    label: 'Lab',
    href: '/lab',
    icon: BeakerIcon,
    matchPattern: /^\/lab(\/|$)/,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/me',
    icon: UserIcon,
    matchPattern: /^\/me(\/|$)|^\/profile(\/|$)|^\/settings(\/|$)|^\/u\//,
  },
];

export function getNavItems(_hasCampus: boolean): NavItem[] {
  return NAV_ITEMS;
}

export function getMobileNavItems(hasCampus: boolean): NavItem[] {
  return getNavItems(hasCampus);
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPattern) {
    return item.matchPattern.test(pathname);
  }
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
