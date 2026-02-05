'use client';

/**
 * TopNavBar — Global header navigation
 *
 * Provides the top navigation bar with logo, search trigger, and user actions.
 * This is separate from CommandBar which is the ⌘K command palette modal.
 */

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const TOP_NAV_HEIGHT = 56;

const HIVE_LOGO_PATH = 'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

// ============================================
// TYPES
// ============================================

export interface TopNavBarUser {
  name?: string;
  handle?: string;
  avatarUrl?: string;
}

export interface TopNavBarProps {
  user?: TopNavBarUser;
  campusName?: string;
  onlineCount?: number;
  notificationCount?: number;
  onSearchClick?: () => void;
  onFeedClick?: () => void;
  onRitualsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  className?: string;
}

// ============================================
// ICONS
// ============================================

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const SparklesIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

// ============================================
// SUB-COMPONENTS
// ============================================

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-1 transition-opacity hover:opacity-80"
    >
      <svg
        width={26}
        height={26}
        viewBox="0 0 1500 1500"
        fill="#FFD700"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.15))' }}
      >
        <path d={HIVE_LOGO_PATH} />
      </svg>
      <span className="font-bold tracking-tight text-body-lg hidden sm:block text-[var(--color-text-primary)]">
        HIVE
      </span>
    </button>
  );
}

function SearchTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'min-w-[180px] max-w-[320px] flex-1',
        'bg-white/[0.03] border border-white/[0.06]',
        'text-[var(--color-text-muted)]',
        'transition-all duration-150',
        'hover:bg-white/[0.05] hover:border-white/[0.10]'
      )}
    >
      <SearchIcon className="w-4 h-4 flex-shrink-0" />
      <span className="text-body-sm flex-1 text-left">Search...</span>
      <kbd className={cn(
        'hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm',
        'bg-white/[0.06] text-[var(--color-text-muted)]'
      )}>
        ⌘K
      </kbd>
    </button>
  );
}

interface NavItemProps {
  label: string;
  isTeased?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ label, isTeased = false, isActive = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium',
        'transition-all duration-150',
        isTeased && 'opacity-70 hover:opacity-100',
        isActive ? 'bg-white/[0.06] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
      )}
    >
      {label}
      {isTeased && (
        <SparklesIcon
          className="w-3.5 h-3.5"
          style={{ color: '#FFD700' }}
        />
      )}
    </button>
  );
}

function CampusPulse({ campusName, onlineCount }: { campusName?: string; onlineCount?: number }) {
  if (!onlineCount) return null;

  return (
    <div className={cn(
      'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full',
      'bg-white/[0.03] border border-white/[0.06]'
    )}>
      <motion.span
        className="w-2 h-2 rounded-full bg-green-500"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(34,197,94,0.3)',
            '0 0 0 4px transparent',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      <span className="text-label font-medium tabular-nums text-[var(--color-text-secondary)]">
        {onlineCount} at {campusName || 'campus'}
      </span>
    </div>
  );
}

function NotificationBell({
  count = 0,
  onClick
}: {
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04]"
    >
      <BellIcon className="w-5 h-5" />
      {count > 0 && (
        <span className={cn(
          'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]',
          'flex items-center justify-center px-1 text-label-xs font-bold rounded-full',
          'bg-red-500 text-white'
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function ProfileButton({
  user,
  onClick
}: {
  user?: TopNavBarUser;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-1 rounded-lg transition-colors hover:bg-white/[0.04]"
    >
      <div className={cn(
        'w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center',
        'bg-white/[0.06] border border-white/[0.06]'
      )}>
        {user?.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" width={32} height={32} className="object-cover" sizes="32px" priority />
        ) : (
          <span className="text-label font-medium text-[var(--color-text-muted)]">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TopNavBar({
  user,
  campusName = 'UB',
  onlineCount,
  notificationCount = 0,
  onSearchClick,
  onFeedClick,
  onRitualsClick,
  onNotificationsClick,
  onProfileClick,
  onLogoClick,
  className,
}: TopNavBarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-between px-4 gap-4',
        'bg-[var(--color-bg-ground)] border-b border-white/[0.06]',
        className
      )}
      style={{ height: TOP_NAV_HEIGHT }}
    >
      {/* Left section: Logo + Search trigger */}
      <div className="flex items-center gap-4 flex-1">
        <Logo onClick={onLogoClick} />
        <SearchTrigger onClick={onSearchClick} />
      </div>

      {/* Center section: Nav items */}
      <nav className="hidden lg:flex items-center gap-1">
        <NavItem label="Feed" isTeased onClick={onFeedClick} />
        <NavItem label="Rituals" isTeased onClick={onRitualsClick} />
      </nav>

      {/* Right section: Pulse + Notifications + Profile */}
      <div className="flex items-center gap-2">
        <CampusPulse campusName={campusName} onlineCount={onlineCount} />
        <NotificationBell count={notificationCount} onClick={onNotificationsClick} />
        <ProfileButton user={user} onClick={onProfileClick} />
      </div>
    </header>
  );
}

export default TopNavBar;
