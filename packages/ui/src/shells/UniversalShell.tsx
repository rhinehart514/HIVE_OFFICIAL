'use client';

/**
 * UniversalShell — HIVE Navigation Frame
 *
 * Floating sidebar with card-based sections:
 * - Identity Card: User avatar + name
 * - Nav Card: Home, Spaces, Lab, You (4-pillar IA)
 * - Spaces Card: Your communities (scrollable)
 *
 * @version 12.0.0 — Spaces pillar navigation (Explore folded into Home)
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { springPresets } from '@hive/tokens';
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
  HomeNavIcon,
  SpacesNavIcon,
  LabNavIcon,
  YouNavIcon,
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

    if (segments[0] === 'home' || segments[0] === 'feed') {
      items.push({ label: 'Home' });
    } else if (segments[0] === 'spaces') {
      if (segments[1] === 'browse') {
        items.push({ label: 'Spaces' });
      } else if (segments[1]) {
        items.push({ label: 'Space' });
      } else {
        items.push({ label: 'Spaces' });
      }
    } else if (segments[0] === 'explore') {
      items.push({ label: 'Explore' });
    } else if (segments[0] === 'me' || segments[0] === 'profile') {
      items.push({ label: 'You' });
    } else if (segments[0] === 'settings') {
      items.push({ label: 'Settings' });
    } else if (segments[0] === 'lab' || segments[0] === 'tools') {
      items.push({ label: 'Lab' });
    }

    return items;
  }, [pathname]);
}

// ============================================
// DEFAULT COMMAND PALETTE ITEMS
// ============================================

const DEFAULT_COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  { id: 'nav-home', label: 'Home', description: 'Your dashboard', category: 'Navigation' },
  { id: 'nav-spaces', label: 'Spaces', description: 'Your communities and residences', category: 'Navigation' },
  { id: 'nav-lab', label: 'Lab', description: 'Build tools for your spaces', category: 'Navigation' },
  { id: 'nav-you', label: 'You', description: 'Your profile and settings', category: 'Navigation' },
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
    { id: 'home', icon: <HomeNavIcon className="w-6 h-6" />, label: 'Home', path: '/home', badge: notificationCount },
    { id: 'spaces', icon: <SpacesNavIcon className="w-6 h-6" />, label: 'Spaces', path: '/spaces' },
    { id: 'lab', icon: <LabNavIcon className="w-6 h-6" />, label: 'Lab', path: '/lab' },
    { id: 'you', icon: <YouNavIcon className="w-6 h-6" />, label: 'You', path: '/me' },
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
          const isActive = item.id === 'home'
            ? /^\/(home|feed|explore)(\/|$)/.test(pathname)
            : item.id === 'spaces'
              ? /^\/spaces(\/|$)|^\/s\//.test(pathname)
              : item.id === 'you'
                ? /^\/(me|profile|settings)(\/|$)/.test(pathname) || /^\/u\//.test(pathname)
                : item.id === 'lab'
                  ? /^\/lab(\/|$)/.test(pathname)
                  : pathname.startsWith(item.path);

          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => onNavigate(item.path)}
                className={cn('relative w-full flex flex-col items-center gap-1 py-2', FOCUS_RING)}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(255, 255, 255, 0.06)' }}
                    transition={springPresets.snappy}
                  />
                )}
                <span
                  className="relative z-10"
                  style={{ color: isActive ? '#FAFAFA' : '#71717A' }}
                >
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-label-xs font-bold rounded-full bg-[#FFD700] text-black">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span
                  className="relative z-10 text-label-xs font-medium"
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
      router.push('/me');
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
      'nav-home': '/home',
      'nav-spaces': '/spaces',
      'nav-lab': '/lab',
      'nav-you': '/me',
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

  const isOnHome = /^\/(home|feed|explore)(\/|$)/.test(pathname);
  const isOnSpaces = /^\/spaces(\/|$)|^\/s\//.test(pathname);
  const isOnLab = /^\/lab(\/|$)/.test(pathname);
  const isOnYou = /^\/(me|profile|settings)(\/|$)/.test(pathname) || /^\/u\//.test(pathname);

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
              icon={<HomeNavIcon className="w-5 h-5" />}
              label="Home"
              isActive={isOnHome}
              badge={notificationCount}
              onClick={() => handleNavigate('/home')}
            />
            <NavItem
              icon={<SpacesNavIcon className="w-5 h-5" />}
              label="Spaces"
              isActive={isOnSpaces}
              onClick={() => handleNavigate('/spaces')}
            />
            <NavItem
              icon={<LabNavIcon className="w-5 h-5" />}
              label="Lab"
              isActive={isOnLab}
              onClick={() => handleNavigate('/lab')}
            />
            <NavItem
              icon={<YouNavIcon className="w-5 h-5" />}
              label="You"
              isActive={isOnYou}
              onClick={() => handleNavigate('/me')}
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
