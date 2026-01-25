'use client';

/**
 * AppShell Template — Command-First Navigation
 *
 * The lean, command-first frame for browse pages (Campus, etc.):
 * - No sidebar (⌘K handles navigation)
 * - Minimal header with logo, search hint, profile
 * - Full-width content area
 * - Mobile: bottom nav
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYOUT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  🔶  HIVE        [⌘K to navigate...]            ●47 at UB    🔔    👤   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │                         FULL WIDTH CONTENT                              │
 * │                         (scrollable)                                    │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Mobile:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  🔶  HIVE                                        🔔    👤               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                         CONTENT                                         │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  [🏠 Campus]  [📦 Spaces]  [🔧 Tools]  [👤 Profile]                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Command } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Button,
  Text,
} from '../primitives';

// ============================================
// CONSTANTS
// ============================================

const HEADER_HEIGHT = 56;
const MOBILE_NAV_HEIGHT = 64;
const MOBILE_BREAKPOINT = 768;

// LOCKED: Spring animation config (same as Shell)
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// HIVE LOGO (from Shell.tsx)
// ============================================

const HIVE_LOGO_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

interface LogoProps {
  size?: number;
  className?: string;
}

function HiveLogo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1500 1500"
      fill="currentColor"
      className={className}
    >
      <path d={HIVE_LOGO_PATH} />
    </svg>
  );
}

// ============================================
// TYPES
// ============================================

export interface AppShellUser {
  id?: string;
  name?: string;
  handle?: string;
  avatarUrl?: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  /** User profile data */
  user?: AppShellUser;
  /** Campus name for pulse indicator */
  campusName?: string;
  /** Online count for campus pulse */
  onlineCount?: number;
  /** Notification count */
  notificationCount?: number;
  /** Current pathname for active state detection */
  pathname?: string;
  /** Callback for command palette open (⌘K) */
  onCommandOpen?: () => void;
  /** Callback for notifications click */
  onNotificationsClick?: () => void;
  /** Callback for profile click */
  onProfileClick?: () => void;
  /** Callback for logo click */
  onLogoClick?: () => void;
  /** Command palette component (render when open) */
  commandPalette?: React.ReactNode;
  /** Custom mobile navigation */
  mobileNav?: React.ReactNode;
  /** Mobile nav handlers */
  onCampusClick?: () => void;
  onSpacesClick?: () => void;
  onToolsClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONTEXT
// ============================================

interface AppShellContextValue {
  isMobile: boolean;
  headerHeight: number;
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const context = React.useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within an AppShell');
  }
  return context;
}

// ============================================
// RESPONSIVE HOOK
// ============================================

function useResponsive() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
}

// ============================================
// HEADER COMPONENT
// ============================================

interface AppShellHeaderProps {
  user?: AppShellUser;
  campusName?: string;
  onlineCount?: number;
  notificationCount?: number;
  onCommandOpen?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  isMobile: boolean;
}

function AppShellHeader({
  user,
  campusName = 'UB',
  onlineCount,
  notificationCount = 0,
  onCommandOpen,
  onNotificationsClick,
  onProfileClick,
  onLogoClick,
  isMobile,
}: AppShellHeaderProps) {
  // Keyboard shortcut for command palette
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandOpen?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-between gap-4',
        'px-4 lg:px-6',
        'border-b border-white/[0.06]'
      )}
      style={{
        height: HEADER_HEIGHT,
        background: 'rgba(5, 5, 4, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Logo */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
      >
        <HiveLogo size={24} />
        <span className="font-semibold text-sm hidden sm:block">HIVE</span>
      </button>

      {/* Center: Command Hint (desktop only) */}
      {!isMobile && (
        <button
          onClick={onCommandOpen}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-white/[0.04] hover:bg-white/[0.08]',
            'border border-white/[0.06]',
            'transition-all duration-150',
            'text-white/40 hover:text-white/60',
            'min-w-[240px]'
          )}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm flex-1 text-left">Navigate...</span>
          <span className="flex items-center gap-0.5 text-label-xs font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">
            <Command className="h-3 w-3" />K
          </span>
        </button>
      )}

      {/* Right: Campus pulse, notifications, profile */}
      <div className="flex items-center gap-3">
        {/* Campus Pulse (desktop only) */}
        {!isMobile && onlineCount !== undefined && (
          <div className="flex items-center gap-2 text-white/50">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
            <Text size="xs" tone="muted">
              {onlineCount} at {campusName}
            </Text>
          </div>
        )}

        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className={cn(
            'relative p-2 rounded-lg',
            'text-white/60 hover:text-white',
            'hover:bg-white/[0.06]',
            'transition-colors'
          )}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'min-w-[18px] h-[18px] px-1',
                'flex items-center justify-center',
                'text-label-xs font-medium',
                'bg-[var(--color-accent-gold)] text-black',
                'rounded-full'
              )}
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Avatar size="sm">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback>
              {getInitials(user?.name || user?.handle || 'U')}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}

// ============================================
// MOBILE BOTTOM NAV
// ============================================

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const CampusIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>
);

const SpacesIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const ToolsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

function DefaultMobileNav({
  pathname,
  onCampusClick,
  onSpacesClick,
  onToolsClick,
  onProfileClick,
}: {
  pathname?: string;
  onCampusClick?: () => void;
  onSpacesClick?: () => void;
  onToolsClick?: () => void;
  onProfileClick?: () => void;
}) {
  const items: MobileNavItem[] = [
    {
      id: 'campus',
      label: 'Campus',
      icon: <CampusIcon />,
      isActive: pathname === '/spaces/browse' || pathname?.startsWith('/spaces/browse'),
      onClick: onCampusClick,
    },
    {
      id: 'spaces',
      label: 'Spaces',
      icon: <SpacesIcon />,
      isActive: pathname?.startsWith('/s/') || pathname?.startsWith('/spaces'),
      onClick: onSpacesClick,
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: <ToolsIcon />,
      isActive: pathname?.startsWith('/tools'),
      onClick: onToolsClick,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <ProfileIcon />,
      isActive: pathname?.startsWith('/profile'),
      onClick: onProfileClick,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        height: MOBILE_NAV_HEIGHT,
        background: 'rgba(5, 5, 4, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <ul className="flex items-center justify-around h-full px-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={item.onClick}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5',
                'transition-colors',
                item.isActive ? 'text-white' : 'text-white/40'
              )}
            >
              {item.icon}
              <span className="text-label-xs font-medium uppercase tracking-wide">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AppShell Template - Command-first navigation frame
 *
 * Lean shell for browse pages with ⌘K as primary navigation.
 * No sidebar, full-width content area.
 *
 * @example
 * ```tsx
 * <AppShell
 *   user={{ name: 'John', handle: 'john', avatarUrl: '...' }}
 *   campusName="UB"
 *   onlineCount={47}
 *   onCommandOpen={() => setCommandOpen(true)}
 *   pathname="/spaces/browse"
 * >
 *   <CampusPage />
 * </AppShell>
 * ```
 */
export function AppShell({
  children,
  user,
  campusName = 'UB',
  onlineCount,
  notificationCount = 0,
  pathname = '',
  onCommandOpen,
  onNotificationsClick,
  onProfileClick,
  onLogoClick,
  commandPalette,
  mobileNav,
  onCampusClick,
  onSpacesClick,
  onToolsClick,
  className,
}: AppShellProps) {
  const { isMobile } = useResponsive();

  const contextValue: AppShellContextValue = React.useMemo(
    () => ({
      isMobile,
      headerHeight: HEADER_HEIGHT,
    }),
    [isMobile]
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div
        className={cn('relative min-h-screen', className)}
        style={{ backgroundColor: '#050504' }}
      >
        {/* Header */}
        <AppShellHeader
          user={user}
          campusName={campusName}
          onlineCount={onlineCount}
          notificationCount={notificationCount}
          onCommandOpen={onCommandOpen}
          onNotificationsClick={onNotificationsClick}
          onProfileClick={onProfileClick}
          onLogoClick={onLogoClick}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main
          className="min-h-screen"
          style={{
            paddingTop: HEADER_HEIGHT,
            paddingBottom: isMobile ? MOBILE_NAV_HEIGHT : 0,
          }}
        >
          {children}
        </main>

        {/* Mobile Navigation */}
        {isMobile &&
          (mobileNav ?? (
            <DefaultMobileNav
              pathname={pathname}
              onCampusClick={onCampusClick}
              onSpacesClick={onSpacesClick}
              onToolsClick={onToolsClick}
              onProfileClick={onProfileClick}
            />
          ))}

        {/* Command Palette */}
        {commandPalette}
      </div>
    </AppShellContext.Provider>
  );
}

// ============================================
// SKELETON
// ============================================

interface AppShellSkeletonProps {
  className?: string;
}

export function AppShellSkeleton({ className }: AppShellSkeletonProps) {
  return (
    <div className={cn('relative min-h-screen', className)} style={{ backgroundColor: '#050504' }}>
      {/* Header skeleton */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06]"
        style={{
          height: HEADER_HEIGHT,
          background: 'rgba(5, 5, 4, 0.95)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-12 rounded bg-white/[0.06] animate-pulse hidden sm:block" />
        </div>
        <div className="h-8 w-60 rounded-lg bg-white/[0.04] animate-pulse hidden md:block" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div style={{ paddingTop: HEADER_HEIGHT }} className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-48 rounded bg-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

AppShell.displayName = 'AppShell';
AppShellSkeleton.displayName = 'AppShellSkeleton';

export { HEADER_HEIGHT as APP_SHELL_HEADER_HEIGHT, MOBILE_NAV_HEIGHT as APP_SHELL_MOBILE_NAV_HEIGHT };
