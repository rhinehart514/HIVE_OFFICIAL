'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SpaceModeNav,
  SpaceModeIcons,
  createSpaceModes,
  BottomNav,
  BottomNavSpacer,
  type SpaceModeItem,
  type BottomNavItem,
} from '@hive/ui/design-system/primitives';

// Mobile detection hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

interface SpaceSubnavProps {
  spaceId: string;
  isLeader?: boolean;
  unreadModes?: string[];
}

// Convert SpaceModeItem to BottomNavItem for mobile
function createBottomNavItems(
  basePath: string,
  unreadModes: string[],
  isLeader: boolean
): BottomNavItem[] {
  // Mobile shows: Hub, Chat, Events, Tools, More
  // More opens Members (and Settings for leaders)
  const items: BottomNavItem[] = [
    {
      value: 'hub',
      label: 'Hub',
      icon: SpaceModeIcons.hub,
      href: basePath,
      hasUnread: unreadModes.includes('hub'),
    },
    {
      value: 'chat',
      label: 'Chat',
      icon: SpaceModeIcons.chat,
      href: `${basePath}/chat`,
      hasUnread: unreadModes.includes('chat'),
    },
    {
      value: 'events',
      label: 'Events',
      icon: SpaceModeIcons.events,
      href: `${basePath}/events`,
      hasUnread: unreadModes.includes('events'),
    },
    {
      value: 'apps',
      label: 'Apps',
      icon: SpaceModeIcons.apps,
      href: `${basePath}/apps`,
      hasUnread: unreadModes.includes('apps'),
    },
    {
      value: 'members',
      label: 'Members',
      icon: SpaceModeIcons.members,
      href: `${basePath}/members`,
      hasUnread: unreadModes.includes('members'),
    },
  ];

  return items;
}

// Detect current mode from pathname
function detectCurrentMode(pathname: string, basePath: string): string {
  if (pathname === basePath) return 'hub';
  if (pathname.startsWith(`${basePath}/chat`)) return 'chat';
  if (pathname.startsWith(`${basePath}/events`)) return 'events';
  if (pathname.startsWith(`${basePath}/apps`)) return 'apps';
  if (pathname.startsWith(`${basePath}/members`)) return 'members';
  if (pathname.startsWith(`${basePath}/settings`)) return 'settings';
  return 'hub';
}

export function SpaceSubnav({ spaceId, isLeader = false, unreadModes = [] }: SpaceSubnavProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const basePath = `/spaces/${spaceId}`;
  const isMobile = useIsMobile();

  // Create mode items for desktop SpaceModeNav
  const desktopItems: SpaceModeItem[] = createSpaceModes(basePath).map((item) => ({
    ...item,
    hasUnread: unreadModes.includes(item.value),
  }));

  // Create items for mobile BottomNav
  const mobileItems = createBottomNavItems(basePath, unreadModes, isLeader);

  // Current mode for bottom nav
  const currentMode = detectCurrentMode(pathname, basePath);

  // Handle bottom nav value change
  const handleMobileNavChange = React.useCallback(
    (value: string) => {
      const item = mobileItems.find((i) => i.value === value);
      if (item?.href) {
        router.push(item.href);
      }
    },
    [mobileItems, router]
  );

  // Mobile: Show BottomNav
  if (isMobile) {
    return (
      <>
        <BottomNav
          items={mobileItems}
          value={currentMode}
          onValueChange={handleMobileNavChange}
          renderItem={(item, props) => (
            <Link
              href={item.href || '#'}
              className={props.className}
              style={props.style}
              aria-current={props.isActive ? 'page' : undefined}
            >
              {props.children}
            </Link>
          )}
        />
      </>
    );
  }

  // Desktop: Show SpaceModeNav in sticky header
  return (
    <div className="sticky top-16 z-30 bg-[#0A0A09]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <SpaceModeNav
          items={desktopItems}
          basePath={basePath}
          pathname={pathname}
          isLeader={isLeader}
          size="default"
        />
      </div>
    </div>
  );
}

// Export spacer for mobile layout padding
export { BottomNavSpacer as SpaceBottomNavSpacer };
