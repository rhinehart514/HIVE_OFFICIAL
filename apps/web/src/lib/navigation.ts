/**
 * Shared Navigation Config
 *
 * 4-Pillar IA (Feb 2026):
 * - Create: Creator dashboard + builder (HIVE is a creation platform)
 * - Spaces: Distribution surfaces where tools live
 * - Explore: Discover tools, spaces, people
 * - You: Own profile + settings
 */

import { BeakerIcon, SpacesIcon, CompassIcon, UserIcon } from '@hive/ui';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  matchPattern?: RegExp;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'create',
    label: 'Create',
    href: '/lab',
    icon: BeakerIcon,
    matchPattern: /^\/lab(\/|$)/,
  },
  {
    id: 'spaces',
    label: 'Spaces',
    href: '/spaces',
    icon: SpacesIcon,
    matchPattern: /^\/spaces(\/|$)|^\/s\//,
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: CompassIcon,
    matchPattern: /^\/explore(\/|$)/,
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
