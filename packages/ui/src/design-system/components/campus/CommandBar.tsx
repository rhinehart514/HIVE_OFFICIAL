'use client';

/**
 * CommandBar - Top navigation bar for Campus system
 *
 * 48px height, contains:
 * - HIVE logo (left)
 * - Spotlight search input (center-left, prominent)
 * - Quick Create button (center-right)
 * - Notification bell (right)
 * - User pill (far right)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '../../../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const BAR_HEIGHT = 48;

// ============================================
// TYPES
// ============================================

export interface CommandBarUser {
  name?: string;
  handle?: string;
  avatarUrl?: string;
}

export interface CommandBarNotification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface CommandBarProps {
  // User
  user: CommandBarUser;

  // Notifications
  notificationCount: number;
  notifications?: CommandBarNotification[];
  onNotificationClick?: () => void;

  // Search
  onSearchClick: () => void;
  searchPlaceholder?: string;

  // Quick Create
  onCreatePost?: () => void;
  onCreateEvent?: () => void;
  onCreateTool?: () => void;
  onCreateSpace?: () => void;
  isBuilder?: boolean;
  isQuickCreateOpen?: boolean;
  onQuickCreateOpenChange?: (open: boolean) => void;

  // Profile
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onSignOut?: () => void;

  className?: string;
}

// ============================================
// ICONS
// ============================================

function HiveLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost?: () => void;
  onCreateEvent?: () => void;
  onCreateTool?: () => void;
  onCreateSpace?: () => void;
  isBuilder?: boolean;
}

function QuickCreateMenu({
  isOpen,
  onClose,
  onCreatePost,
  onCreateEvent,
  onCreateTool,
  onCreateSpace,
  isBuilder,
}: QuickCreateMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const items = [
    { label: 'Post', onClick: onCreatePost, icon: '📝' },
    { label: 'Event', onClick: onCreateEvent, icon: '📅' },
    ...(isBuilder
      ? [{ label: 'App', onClick: onCreateTool, icon: '🛠' }]
      : []),
    { label: 'Space', onClick: onCreateSpace, icon: '✨' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute top-full right-0 mt-2',
            'min-w-[160px] py-1',
            'bg-[var(--bg-elevated)]',
            'border border-[var(--border-default)]',
            'rounded-lg',
            'shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
            'z-50'
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              className={cn(
                'w-full px-3 py-2',
                'flex items-center gap-2',
                'text-sm text-[var(--text-secondary)]',
                'hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
                'transition-colors duration-100'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CommandBar({
  user,
  notificationCount,
  notifications,
  onNotificationClick,
  onSearchClick,
  searchPlaceholder = 'Search or type a command...',
  onCreatePost,
  onCreateEvent,
  onCreateTool,
  onCreateSpace,
  isBuilder = false,
  isQuickCreateOpen = false,
  onQuickCreateOpenChange,
  onProfileClick,
  onSettingsClick,
  onSignOut,
  className,
}: CommandBarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40',
        'flex items-center gap-4 px-4',
        'bg-[var(--bg-ground)]/95 backdrop-blur-md',
        'border-b border-[var(--border-subtle)]',
        className
      )}
      style={{ height: BAR_HEIGHT }}
    >
      {/* Logo */}
      <Link
        href="/spaces/browse"
        className={cn(
          'flex-shrink-0',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:rounded'
        )}
        aria-label="HIVE Home"
      >
        <HiveLogo size={28} />
      </Link>

      {/* Search Input (Prominent) */}
      <button
        onClick={onSearchClick}
        className={cn(
          'flex-1 max-w-md',
          'flex items-center gap-2 px-3 py-1.5',
          'bg-[var(--bg-surface)]',
          'border border-[var(--border-default)]',
          'rounded-lg',
          'text-sm text-[var(--text-muted)]',
          'hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'transition-all duration-150',
          'cursor-text'
        )}
      >
        <SearchIcon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{searchPlaceholder}</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-label-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Create */}
      <div className="relative">
        <button
          onClick={() => onQuickCreateOpenChange?.(!isQuickCreateOpen)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5',
            'bg-[var(--life-gold)] text-black',
            'rounded-lg',
            'text-sm font-medium',
            'hover:bg-[var(--life-gold-hover)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-ground)]',
            'transition-colors duration-150'
          )}
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
          <ChevronDownIcon
            className={cn(
              'w-3 h-3 transition-transform duration-150',
              isQuickCreateOpen && 'rotate-180'
            )}
          />
        </button>

        <QuickCreateMenu
          isOpen={isQuickCreateOpen}
          onClose={() => onQuickCreateOpenChange?.(false)}
          onCreatePost={onCreatePost}
          onCreateEvent={onCreateEvent}
          onCreateTool={onCreateTool}
          onCreateSpace={onCreateSpace}
          isBuilder={isBuilder}
        />
      </div>

      {/* Notification Bell */}
      <button
        onClick={onNotificationClick}
        className={cn(
          'relative p-2',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'rounded-lg',
          'hover:bg-[var(--bg-surface-hover)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'transition-colors duration-150'
        )}
        aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
      >
        <BellIcon className="w-5 h-5" />
        {notificationCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5',
              'min-w-[18px] h-[18px] px-1',
              'flex items-center justify-center',
              'text-label-xs font-semibold',
              'bg-[var(--life-gold)] text-black',
              'rounded-full'
            )}
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </button>

      {/* User Pill */}
      <button
        onClick={onProfileClick}
        className={cn(
          'flex items-center gap-2 p-1 pr-2',
          'rounded-full',
          'hover:bg-[var(--bg-surface-hover)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'transition-colors duration-150'
        )}
        aria-label="Profile menu"
      >
        <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
              {user.name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <span className="hidden lg:block text-sm text-[var(--text-secondary)] max-w-[100px] truncate">
          {user.name || user.handle || 'User'}
        </span>
      </button>
    </header>
  );
}

export default CommandBar;
