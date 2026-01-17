'use client';

/**
 * UniversalShell — HIVE Navigation Frame
 *
 * Architecture (Linear/Notion pattern):
 * - Sidebar: Brand + Primary Nav + Contextual Content (full height)
 * - TopBar: Page-level context, starts AFTER sidebar
 * - Main: Content area
 *
 * @version 8.0.0 — Sidebar-first navigation
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  SidebarHeader,
  SidebarSection,
  SidebarSpaceItem,
  SidebarToolItem,
  SidebarAddButton,
  SidebarNavItem,
  SidebarDivider,
  SidebarFooter,
  SidebarCollapseToggle,
  useGlobalSidebar,
  BrowseIcon,
  SettingsIcon,
  ToolsIcon,
  ProfileIcon,
  CalendarIcon,
  EventsIcon,
  LeadersIcon,
  FeedIcon,
  RitualsIcon,
  SIDEBAR_TOKENS,
} from '../design-system/primitives/GlobalSidebar';
import { SimpleAvatar } from '../design-system/primitives/Avatar';
import { CommandPalette, type CommandPaletteItem } from '../design-system/components/CommandPalette';
import { cn } from '../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const MOBILE_BREAKPOINT = 768;

/**
 * Shell Layout Tokens
 */
export const SHELL_TOKENS = {
  topbarHeight: TOPBAR_TOKENS.height,
  sidebarWidth: SIDEBAR_TOKENS.width,
  sidebarCollapsedWidth: SIDEBAR_TOKENS.collapsedWidth,
  mobileNavHeight: 72,
  safeAreaBottom: 'env(safe-area-inset-bottom, 0)',
} as const;

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]';

// ============================================
// TYPES
// ============================================

/**
 * Shell Mode — Controls navigation visibility
 * - full: Sidebar expanded + TopBar
 * - compact: Sidebar collapsed + TopBar
 * - hidden: No shell at all
 */
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
  /** @deprecated Use mode instead */
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

    // Spaces routes
    if (segments[0] === 'spaces') {
      if (segments[1] === 'browse') {
        items.push({ label: 'Campus' });
      } else if (segments[1] === 'create') {
        items.push({ label: 'Create Space' });
      } else if (segments[1] === 'claim') {
        items.push({ label: 'Claim Space' });
      } else if (segments[1]) {
        items.push({ label: 'Space', href: `/spaces/${segments[1]}` });
        if (segments[2]) {
          // Handle space subpages with proper labels
          const subpageLabels: Record<string, string> = {
            chat: 'Chat',
            events: 'Events',
            calendar: 'Calendar',
            members: 'Members',
            resources: 'Resources',
            settings: 'Settings',
            analytics: 'Analytics',
            moderation: 'Moderation',
            apps: 'Apps',
            roles: 'Roles',
          };
          const label = subpageLabels[segments[2]] || segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
          items.push({ label });
        }
      }
    }
    // Tools routes
    else if (segments[0] === 'tools') {
      items.push({ label: 'HiveLab', href: '/tools' });
      if (segments[1] === 'create') {
        items.push({ label: 'Create Tool' });
      } else if (segments[1]) {
        items.push({ label: 'Tool', href: `/tools/${segments[1]}` });
        if (segments[2]) {
          // Handle tool subpages with proper labels
          const subpageLabels: Record<string, string> = {
            edit: 'Editor',
            preview: 'Preview',
            run: 'Run',
            deploy: 'Deploy',
            settings: 'Settings',
            analytics: 'Analytics',
          };
          const label = subpageLabels[segments[2]] || segments[2].charAt(0).toUpperCase() + segments[2].slice(1);
          items.push({ label });
        }
      }
    }
    // Profile routes
    else if (segments[0] === 'profile') {
      items.push({ label: 'Profile', href: '/profile' });
      if (segments[1] === 'edit') {
        items.push({ label: 'Edit' });
      } else if (segments[1] === 'connections') {
        items.push({ label: 'Connections' });
      } else if (segments[1] === 'calendar') {
        items.push({ label: 'Calendar' });
      } else if (segments[1]) {
        // Profile by ID
        items.push({ label: 'View' });
      }
    }
    // Settings
    else if (segments[0] === 'settings') {
      items.push({ label: 'Settings' });
    }
    // Notifications
    else if (segments[0] === 'notifications') {
      items.push({ label: 'Notifications' });
    }
    // Calendar
    else if (segments[0] === 'calendar') {
      items.push({ label: 'Calendar' });
    }
    // Events
    else if (segments[0] === 'events') {
      items.push({ label: 'Events' });
      if (segments[1]) {
        items.push({ label: 'Event' });
      }
    }
    // Leaders
    else if (segments[0] === 'leaders') {
      items.push({ label: 'Leaders' });
    }
    // Resources
    else if (segments[0] === 'resources') {
      items.push({ label: 'Resources' });
    }
    // User profiles by handle
    else if (segments[0] === 'user' || segments[0] === 'u') {
      items.push({ label: 'Profile' });
    }
    // Short space URLs
    else if (segments[0] === 's') {
      items.push({ label: 'Space' });
    }

    return items;
  }, [pathname]);
}

// ============================================
// DEFAULT COMMAND PALETTE ITEMS
// ============================================

const DEFAULT_COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  { id: 'nav-browse', label: 'Browse Campus', description: 'Discover spaces', category: 'Navigation', shortcut: ['G', 'C'] },
  { id: 'nav-profile', label: 'My Profile', description: 'View your profile', category: 'Navigation', shortcut: ['G', 'P'] },
  { id: 'nav-settings', label: 'Settings', description: 'Preferences', category: 'Navigation', shortcut: ['G', ','] },
  { id: 'action-create-space', label: 'Create Space', description: 'Start a new community', category: 'Actions', featured: true },
];

// ============================================
// MOBILE BOTTOM NAV
// ============================================

// Bell icon for notifications
function NotificationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

// Menu icon for "More"
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

interface MobileNavProps {
  pathname: string;
  onNavigate: (path: string) => void;
  notificationCount?: number;
}

function MobileNav({ pathname, onNavigate, notificationCount = 0 }: MobileNavProps) {
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);

  // Mobile nav — GTM order: Spaces > Build > Feed > Calendar > More
  const mainItems = [
    { id: 'browse', icon: <BrowseIcon className="w-6 h-6" />, label: 'Spaces', path: '/spaces/browse' },
    { id: 'tools', icon: <ToolsIcon className="w-6 h-6" />, label: 'Build', path: '/tools' },
    { id: 'feed', icon: <FeedIcon className="w-6 h-6" />, label: 'Feed', path: '/feed' },
    { id: 'notifications', icon: <NotificationIcon className="w-6 h-6" />, label: 'Alerts', path: '/notifications', badge: notificationCount },
    { id: 'more', icon: <MenuIcon className="w-6 h-6" />, label: 'More', path: '', isMore: true },
  ];

  const moreMenuItems = [
    { id: 'calendar', icon: <CalendarIcon className="w-5 h-5" />, label: 'Calendar', path: '/calendar' },
    { id: 'leaders', icon: <LeadersIcon className="w-5 h-5" />, label: 'Leaders', path: '/leaders' },
    { id: 'profile', icon: <ProfileIcon className="w-5 h-5" />, label: 'Profile', path: '/profile' },
    { id: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* More Menu Sheet */}
      {moreMenuOpen && (
        <div
          className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border lg:hidden"
          style={{
            background: 'rgba(20, 20, 20, 0.98)',
            backdropFilter: 'blur(20px)',
            borderColor: SIDEBAR_TOKENS.border,
          }}
        >
          <div className="p-2 space-y-1">
            {moreMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.path);
                    setMoreMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    'hover:bg-white/5 active:bg-white/10',
                    FOCUS_RING
                  )}
                >
                  <span style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted }}>
                    {item.icon}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden"
        style={{
          height: SHELL_TOKENS.mobileNavHeight,
          paddingBottom: SHELL_TOKENS.safeAreaBottom,
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: SIDEBAR_TOKENS.border,
        }}
      >
        <ul className="flex items-center justify-around h-full px-2">
          {mainItems.map((item) => {
            const isActive = item.path ? pathname.startsWith(item.path) : false;
            const isMoreActive = moreMenuOpen && item.isMore;
            const showActive = isActive || isMoreActive;

            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => {
                    if (item.isMore) {
                      setMoreMenuOpen(!moreMenuOpen);
                    } else {
                      onNavigate(item.path);
                      setMoreMenuOpen(false);
                    }
                  }}
                  className={cn('w-full flex flex-col items-center gap-1 py-2 rounded-xl relative', FOCUS_RING)}
                >
                  <span
                    className="relative"
                    style={{ color: showActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted }}
                  >
                    {item.icon}
                    {/* Notification badge */}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-[#FFD700] text-black">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: showActive ? SIDEBAR_TOKENS.textPrimary : SIDEBAR_TOKENS.textMuted }}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

// ============================================
// PROFILE FOOTER
// ============================================

interface ProfileFooterProps {
  userName?: string;
  userHandle?: string;
  userAvatarUrl?: string;
  onClick?: () => void;
}

function ProfileFooterContent({ userName, userHandle, userAvatarUrl, onClick }: ProfileFooterProps) {
  const { collapsed } = useGlobalSidebar();

  // Generate initials for avatar fallback
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Link
      href="/profile"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        'hover:bg-white/5 active:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
      )}
    >
      <SimpleAvatar
        src={userAvatarUrl}
        alt={userName || 'Profile'}
        fallback={initials}
        size="sm"
      />
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {userName || 'Your Profile'}
          </p>
          {userHandle && (
            <p className="text-xs text-white/50 truncate">
              @{userHandle}
            </p>
          )}
        </div>
      )}
    </Link>
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

  // Sidebar collapsed state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Handle deprecated variant prop
  const effectiveMode = variant === 'minimal' ? 'hidden' : mode;

  // Hidden mode = no shell at all
  if (effectiveMode === 'hidden') {
    return <>{children}</>;
  }

  // Compact mode = sidebar forced collapsed
  const isCompact = effectiveMode === 'compact';
  const effectiveCollapsed = isCompact || sidebarCollapsed;

  // Navigation
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

  const handleToolSelect = useCallback((id: string) => {
    if (onToolSelect) {
      onToolSelect(id);
    } else {
      router.push(`/tools/${id}`);
    }
  }, [onToolSelect, router]);

  const handleSearchClick = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      setCommandPaletteOpen(true);
    }
  }, [onSearchClick]);

  // Command palette items
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
      'nav-browse': '/spaces/browse',
      'nav-profile': '/profile',
      'nav-settings': '/settings',
      'action-create-space': '/spaces/create',
    };
    const path = navigationMap[item.id];
    if (path) router.push(path);
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd+K - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (isInput) return;
      if (isCompact) return;

      // [ - Toggle sidebar
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
        return;
      }

      // Cmd+B - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
        return;
      }

      // Cmd+\ - Collapse sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarCollapsed(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompact]);

  // Layout calculations
  const sidebarWidth = isMobile ? 0 : (effectiveCollapsed ? SHELL_TOKENS.sidebarCollapsedWidth : SHELL_TOKENS.sidebarWidth);

  // Active states
  const isOnBrowse = pathname.startsWith('/spaces/browse') || pathname === '/spaces';
  const isOnTools = pathname.startsWith('/tools');
  const isOnFeed = pathname.startsWith('/feed');
  const isOnSettings = pathname.startsWith('/settings');
  const isOnCalendar = pathname.startsWith('/calendar');
  const isOnEvents = pathname.startsWith('/events');
  const isOnLeaders = pathname.startsWith('/leaders');
  const isOnRituals = pathname.startsWith('/rituals');

  const currentSpaceId = useMemo(() => {
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    if (match && !['browse', 'create', 'claim', 'search'].includes(match[1])) {
      return match[1];
    }
    return null;
  }, [pathname]);

  const currentToolId = useMemo(() => {
    const match = pathname.match(/^\/tools\/([^/]+)/);
    if (match && !['create'].includes(match[1])) {
      return match[1];
    }
    return null;
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ background: SIDEBAR_TOKENS.bg }}>
      {/* SIDEBAR (desktop only, full height) */}
      {!isMobile && (
        <GlobalSidebar
          defaultCollapsed={effectiveCollapsed}
          onCollapsedChange={isCompact ? undefined : setSidebarCollapsed}
        >
          {/* Header: HIVE Brand */}
          <SidebarHeader onLogoClick={() => handleNavigate('/')} />

          {/* Primary Navigation — GTM order: Spaces > Build > Feed > Calendar */}
          <div className={effectiveCollapsed ? 'px-2' : 'px-2'}>
            <div className="space-y-0.5">
              <SidebarNavItem
                icon={<BrowseIcon className="w-5 h-5" />}
                label="Spaces"
                isActive={isOnBrowse}
                onClick={() => handleNavigate('/spaces/browse')}
              />
              <SidebarNavItem
                icon={<ToolsIcon className="w-5 h-5" />}
                label="Build"
                isActive={isOnTools}
                onClick={() => handleNavigate('/tools')}
              />
              <SidebarNavItem
                icon={<FeedIcon className="w-5 h-5" />}
                label="Feed"
                isActive={isOnFeed}
                onClick={() => handleNavigate('/feed')}
                badge={<span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Soon</span>}
              />
              <SidebarNavItem
                icon={<CalendarIcon className="w-5 h-5" />}
                label="Calendar"
                isActive={isOnCalendar}
                onClick={() => handleNavigate('/calendar')}
              />
            </div>
          </div>

          {/* Secondary Navigation */}
          <div className={effectiveCollapsed ? 'px-2 mt-2' : 'px-2 mt-2'}>
            <div className="space-y-0.5">
              <SidebarNavItem
                icon={<LeadersIcon className="w-5 h-5" />}
                label="Leaders"
                isActive={isOnLeaders}
                onClick={() => handleNavigate('/leaders')}
              />
              <SidebarNavItem
                icon={<RitualsIcon className="w-5 h-5" />}
                label="Rituals"
                isActive={isOnRituals}
                onClick={() => handleNavigate('/rituals')}
                badge={<span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Soon</span>}
              />
              <SidebarNavItem
                icon={<SettingsIcon className="w-5 h-5" />}
                label="Settings"
                isActive={isOnSettings}
                onClick={() => handleNavigate('/settings')}
              />
            </div>
          </div>

          <SidebarDivider />

          {/* Contextual Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
            {/* Your Spaces */}
            <SidebarSection label="Your Spaces">
              {spaces.length === 0 ? (
                /* Empty State - Welcoming first-time users */
                <div className={cn(
                  'py-3',
                  effectiveCollapsed ? 'px-1' : 'px-2'
                )}>
                  {!effectiveCollapsed && (
                    <p className="text-xs text-white/40 mb-3 leading-relaxed">
                      Join communities that match your interests
                    </p>
                  )}
                  <SidebarAddButton
                    label="Explore campus"
                    onClick={() => handleNavigate('/spaces/browse')}
                  />
                </div>
              ) : (
                <>
                  {spaces.map((space) => (
                    <SidebarSpaceItem
                      key={space.id}
                      name={space.name}
                      emoji={space.emoji}
                      avatarUrl={space.avatarUrl}
                      unreadCount={space.unreadCount}
                      isActive={currentSpaceId === space.id}
                      onClick={() => handleSpaceSelect(space.id)}
                    />
                  ))}
                  <SidebarAddButton
                    label="Join a space"
                    onClick={() => handleNavigate('/spaces/browse')}
                  />
                </>
              )}
            </SidebarSection>

            {/* Your Tools (if builder) */}
            {isBuilder && tools.length > 0 && (
              <SidebarSection label="Your Tools">
                {tools.map((tool) => (
                  <SidebarToolItem
                    key={tool.id}
                    name={tool.name}
                    icon={tool.icon}
                    isActive={currentToolId === tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                  />
                ))}
                <SidebarAddButton
                  label="Build a tool"
                  onClick={() => handleNavigate('/tools/create')}
                />
              </SidebarSection>
            )}
          </div>

          {/* Profile Footer */}
          <SidebarFooter>
            <ProfileFooterContent
              userName={userName}
              userHandle={userHandle}
              userAvatarUrl={userAvatarUrl}
              onClick={onProfileClick}
            />
          </SidebarFooter>

          {/* Collapse Toggle */}
          {!isCompact && <SidebarCollapseToggle />}
        </GlobalSidebar>
      )}

      {/* TOP BAR (starts after sidebar) */}
      <TopBar leftOffset={sidebarWidth}>
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
          marginLeft: sidebarWidth,
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
        placeholder="Search spaces, tools, or commands..."
        emptyMessage="No results found."
      />
    </div>
  );
}

export default UniversalShell;
