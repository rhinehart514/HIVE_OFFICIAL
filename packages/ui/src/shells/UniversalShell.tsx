'use client';

/**
 * UniversalShell — HIVE Navigation Frame
 *
 * Floating sidebar with card-based sections:
 * - Identity Card: User avatar + name
 * - Spaces Card: Your communities (scrollable)
 * - Nav Card: Feed, Browse, HiveLab, Settings (2x2 grid)
 *
 * @version 9.0.0 — Floating cards redesign
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  TopBar,
  TopBarBreadcrumbs,
  TopBarActions,
  TopBarSearch,
  TopBarNotifications,
  TOPBAR_TOKENS,
  type BreadcrumbItem,
} from '../design-system/primitives/TopBar';
import {
  GlobalSidebar,
  IdentityCard,
  SpacesCard,
  SpaceItem,
  NavCard,
  NavItem,
  SidebarSpacer,
  SidebarCollapseToggle,
  FeedIcon,
  BrowseIcon,
  ToolsIcon,
  SettingsIcon,
  SIDEBAR_TOKENS,
} from '../design-system/primitives/GlobalSidebar';
import { CommandPalette, type CommandPaletteItem } from '../design-system/components/CommandPalette';
import { cn } from '../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const MOBILE_BREAKPOINT = 768;

export const SHELL_TOKENS = {
  topbarHeight: TOPBAR_TOKENS.height,
  sidebarWidth: SIDEBAR_TOKENS.width,
  sidebarCollapsedWidth: SIDEBAR_TOKENS.collapsedWidth,
  sidebarMargin: SIDEBAR_TOKENS.margin,
  mobileNavHeight: 72,
  safeAreaBottom: 'env(safe-area-inset-bottom, 0)',
} as const;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]';

// ============================================
// TYPES
// ============================================

export type ShellMode = 'full' | 'compact' | 'hidden';

export interface SpaceData {
  id: string;
  name: string;
  emoji?: string;
  avatarUrl?: string;
  unreadCount?: number;
}

export interface ToolData {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

export interface UniversalShellProps {
  children: React.ReactNode;
  spaces?: SpaceData[];
  tools?: ToolData[];
  isBuilder?: boolean;
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string;
  notificationCount?: number;
  commandPaletteItems?: CommandPaletteItem[];
  onSpaceSelect?: (spaceId: string) => void;
  onToolSelect?: (toolId: string) => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onSearchClick?: () => void;
  mode?: ShellMode;
  variant?: 'full' | 'minimal';
}

// ============================================
// HOOKS
// ============================================

function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
}

function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return useMemo(() => {
    if (!pathname || pathname === '/') return [];

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    if (segments[0] === 'spaces') {
      if (segments[1] === 'browse') {
        items.push({ label: 'Campus' });
      } else if (segments[1]) {
        items.push({ label: 'Space' });
      }
    } else if (segments[0] === 'tools') {
      items.push({ label: 'HiveLab' });
    } else if (segments[0] === 'feed') {
      items.push({ label: 'Feed' });
    } else if (segments[0] === 'profile') {
      items.push({ label: 'Profile' });
    } else if (segments[0] === 'settings') {
      items.push({ label: 'Settings' });
    }

    return items;
  }, [pathname]);
}

// ============================================
// DEFAULT COMMAND PALETTE ITEMS
// ============================================

const DEFAULT_COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  { id: 'nav-spaces', label: 'Spaces', description: 'Your campus, organized', category: 'Navigation' },
  { id: 'nav-feed', label: 'Feed', description: 'See what\'s happening', category: 'Navigation' },
  { id: 'nav-hivelab', label: 'HiveLab', description: 'Build tools', category: 'Navigation' },
  { id: 'nav-settings', label: 'Settings', description: 'Preferences', category: 'Navigation' },
];

// ============================================
// MOBILE BOTTOM NAV
// ============================================

interface MobileNavProps {
  pathname: string;
  onNavigate: (path: string) => void;
  notificationCount?: number;
}

function MobileNav({ pathname, onNavigate, notificationCount = 0 }: MobileNavProps) {
  const navItems = [
    { id: 'feed', icon: <FeedIcon className="w-6 h-6" />, label: 'Feed', path: '/feed', badge: notificationCount },
    { id: 'spaces', icon: <BrowseIcon className="w-6 h-6" />, label: 'Spaces', path: '/spaces' },
    { id: 'hivelab', icon: <ToolsIcon className="w-6 h-6" />, label: 'HiveLab', path: '/tools' },
    { id: 'settings', icon: <SettingsIcon className="w-6 h-6" />, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden"
      style={{
        height: SHELL_TOKENS.mobileNavHeight,
        paddingBottom: SHELL_TOKENS.safeAreaBottom,
        background: '#0A0A0A',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <ul className="flex items-center justify-around h-full px-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => onNavigate(item.path)}
                className={cn('w-full flex flex-col items-center gap-1 py-2', FOCUS_RING)}
              >
                <span
                  className="relative"
                  style={{ color: isActive ? '#FAFAFA' : '#71717A' }}
                >
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-[#FFD700] text-black">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? '#FAFAFA' : '#71717A' }}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const SIDEBAR_COLLAPSED_KEY = 'hive-sidebar-collapsed';

export function UniversalShell({
  children,
  spaces = [],
  tools = [],
  isBuilder = false,
  userName,
  userHandle,
  userAvatarUrl,
  notificationCount = 0,
  commandPaletteItems,
  onSpaceSelect,
  onToolSelect,
  onNotificationsClick,
  onProfileClick,
  onSearchClick,
  mode = 'full',
  variant,
}: UniversalShellProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { isMobile } = useResponsive();
  const breadcrumbs = useBreadcrumbs(pathname);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const effectiveMode = variant === 'minimal' ? 'hidden' : mode;

  if (effectiveMode === 'hidden') {
    return <>{children}</>;
  }

  const isCompact = effectiveMode === 'compact';
  const effectiveCollapsed = isCompact || sidebarCollapsed;

  // Navigation handlers
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleSpaceSelect = useCallback((id: string) => {
    if (onSpaceSelect) {
      onSpaceSelect(id);
    } else {
      router.push(`/spaces/${id}`);
    }
  }, [onSpaceSelect, router]);

  const handleProfileClick = useCallback(() => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      router.push('/profile');
    }
  }, [onProfileClick, router]);

  const handleSearchClick = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      setCommandPaletteOpen(true);
    }
  }, [onSearchClick]);

  // Command palette
  const allCommandPaletteItems = useMemo(() => {
    const items: CommandPaletteItem[] = [...(commandPaletteItems || DEFAULT_COMMAND_PALETTE_ITEMS)];
    spaces.slice(0, 10).forEach((space) => {
      items.push({
        id: `space-${space.id}`,
        label: space.name,
        description: 'Go to space',
        category: 'Your Spaces',
        onSelect: () => handleSpaceSelect(space.id),
      });
    });
    return items;
  }, [commandPaletteItems, spaces, handleSpaceSelect]);

  const handleCommandPaletteSelect = useCallback((item: CommandPaletteItem) => {
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    const navigationMap: Record<string, string> = {
      'nav-spaces': '/spaces',
      'nav-feed': '/feed',
      'nav-hivelab': '/tools',
      'nav-settings': '/settings',
    };
    const path = navigationMap[item.id];
    if (path) router.push(path);
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (isInput || isCompact) return;

      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompact]);

  // Layout calculations - account for floating sidebar margin
  const sidebarOffset = isMobile
    ? 0
    : (effectiveCollapsed ? SIDEBAR_TOKENS.collapsedWidth : SIDEBAR_TOKENS.width) + (SIDEBAR_TOKENS.margin * 2);

  // Active states
  const isOnFeed = pathname.startsWith('/feed');
  const isOnBrowse = pathname.startsWith('/spaces/browse') || pathname === '/spaces';
  const isOnTools = pathname.startsWith('/tools');
  const isOnSettings = pathname.startsWith('/settings');

  const currentSpaceId = useMemo(() => {
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    if (match && !['browse', 'create', 'claim'].includes(match[1])) {
      return match[1];
    }
    return null;
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* FLOATING SIDEBAR (desktop only) */}
      {!isMobile && (
        <GlobalSidebar
          defaultCollapsed={effectiveCollapsed}
          onCollapsedChange={isCompact ? undefined : setSidebarCollapsed}
        >
          {/* Identity */}
          <IdentityCard
            name={userName}
            handle={userHandle}
            avatarUrl={userAvatarUrl}
            onProfileClick={handleProfileClick}
          />

          <SidebarSpacer />

          {/* Navigation - prominent at top */}
          <NavCard>
            <NavItem
              icon={<FeedIcon className="w-5 h-5" />}
              label="Feed"
              isActive={isOnFeed}
              badge={notificationCount}
              onClick={() => handleNavigate('/feed')}
            />
            <NavItem
              icon={<BrowseIcon className="w-5 h-5" />}
              label="Spaces"
              isActive={isOnBrowse}
              onClick={() => handleNavigate('/spaces')}
            />
            <NavItem
              icon={<ToolsIcon className="w-5 h-5" />}
              label="HiveLab"
              isActive={isOnTools}
              onClick={() => handleNavigate('/tools')}
            />
            <NavItem
              icon={<SettingsIcon className="w-5 h-5" />}
              label="Settings"
              isActive={isOnSettings}
              onClick={() => handleNavigate('/settings')}
            />
          </NavCard>

          <SidebarSpacer />

          {/* Spaces - scrollable section */}
          <SpacesCard onBrowseClick={() => handleNavigate('/spaces')}>
            {spaces.map((space) => (
              <SpaceItem
                key={space.id}
                name={space.name}
                emoji={space.emoji}
                avatarUrl={space.avatarUrl}
                isActive={currentSpaceId === space.id}
                hasUnread={(space.unreadCount || 0) > 0}
                onClick={() => handleSpaceSelect(space.id)}
              />
            ))}
          </SpacesCard>

          {/* Collapse Toggle */}
          {!isCompact && <SidebarCollapseToggle />}
        </GlobalSidebar>
      )}

      {/* TOP BAR */}
      <TopBar leftOffset={sidebarOffset}>
        <TopBarBreadcrumbs items={breadcrumbs} />
        <TopBarActions>
          <TopBarSearch onClick={handleSearchClick} />
          <TopBarNotifications
            count={notificationCount}
            onClick={onNotificationsClick || (() => handleNavigate('/notifications'))}
          />
        </TopBarActions>
      </TopBar>

      {/* MAIN CONTENT */}
      <main
        style={{
          marginLeft: sidebarOffset,
          paddingTop: SHELL_TOKENS.topbarHeight,
          paddingBottom: isMobile ? SHELL_TOKENS.mobileNavHeight : 0,
          minHeight: '100vh',
        }}
      >
        {children}
      </main>

      {/* MOBILE NAV */}
      {isMobile && (
        <MobileNav pathname={pathname} onNavigate={handleNavigate} notificationCount={notificationCount} />
      )}

      {/* COMMAND PALETTE */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        items={allCommandPaletteItems}
        onSelect={handleCommandPaletteSelect}
        placeholder="Search spaces or commands..."
        emptyMessage="No results found."
      />
    </div>
  );
}

export default UniversalShell;
