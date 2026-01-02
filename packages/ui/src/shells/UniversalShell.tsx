'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, LayoutGroup } from 'framer-motion';
import { CommandPalette, type CommandPaletteItem } from '../atomic/00-Global/organisms/command-palette';
import { SpaceSwitcher, type SpaceSwitcherSpace } from '../atomic/00-Global/organisms/space-switcher';
import { SpaceRail, type SpaceItem, type NotificationItem } from '../atomic/00-Global/organisms/space-rail';
import { useMediaQuery } from '../hooks/use-media-query';
import { easingArrays } from '@hive/tokens';

// Silk easing - smooth, confident (from design tokens)
const SILK_EASE = easingArrays.silk;

// Spring config for OpenAI-style fluid motion
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// CONTEXTUAL PANEL TYPES
// ============================================

export interface ActivityItem {
  id: string;
  type: 'message' | 'event' | 'mention' | 'reaction';
  title: string;
  subtitle?: string;
  timestamp: string;
  spaceId?: string;
  spaceName?: string;
}

export interface PresenceSpaceItem {
  id: string;
  name: string;
  avatar?: string;
  memberCount: number;
  activeNow: number;
  isPinned?: boolean;
  unreadCount?: number;
  lastActivity?: string;
}

export interface UserStats {
  spacesJoined: number;
  connections: number;
  eventsThisWeek?: number;
  streak?: number;
}

// Smooth transition for content reveals
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

// Staggered nav item variants
const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING_CONFIG,
  },
};

// HIVE Logo SVG Component - Actual brand mark
const HiveLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 1500 1500"
    className={className}
    aria-label="HIVE"
    fill="currentColor"
  >
    <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"/>
  </svg>
);

// Minimal icons - thinner strokes for OpenAI feel
const HomeIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const SidebarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const NAV_ICONS: Record<string, React.FC> = {
  feed: HomeIcon,
  spaces: UsersIcon,
  profile: UserIcon,
  hivelab: BeakerIcon,
  notifications: BellIcon,
  schedules: CalendarIcon,
};

// ============================================
// CONTEXTUAL PANEL COMPONENTS
// ============================================

// Icons for contextual panels
const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const SmallCalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// Feed Panel — Recent activity
const FeedContextPanel: React.FC<{ recentActivity?: ActivityItem[] }> = ({ recentActivity = [] }) => {
  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'mention':
        return <span className="text-neutral-400">@</span>;
      case 'event':
        return <SmallCalendarIcon />;
      case 'message':
        return <MessageIcon />;
      case 'reaction':
        return <HeartIcon />;
    }
  };

  if (recentActivity.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[13px] text-neutral-500">No recent activity</p>
        <p className="text-[11px] text-neutral-600 mt-1">Activity from your spaces will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="px-3 py-2">
        <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
          Recent
        </span>
      </div>
      {recentActivity.slice(0, 5).map((item) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neutral-800/50 transition-colors duration-150"
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-neutral-400">
            {getTypeIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-neutral-300 truncate">{item.title}</div>
          </div>
          <div className="text-[11px] text-neutral-600 flex-shrink-0">{item.timestamp}</div>
        </motion.button>
      ))}
      <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] text-neutral-600">
        <span className="px-1 py-0.5 rounded bg-neutral-800 font-mono">⌘K</span>
        <span>search</span>
      </div>
    </div>
  );
};

// Spaces Panel — Pinned + Recent with presence
const SpacesContextPanel: React.FC<{
  spaces?: PresenceSpaceItem[];
  onSpaceSelect?: (id: string) => void;
  onCreateSpace?: () => void;
}> = ({ spaces = [], onSpaceSelect, onCreateSpace }) => {
  const pinnedSpaces = spaces.filter((s) => s.isPinned).slice(0, 3);
  const recentSpaces = spaces.filter((s) => !s.isPinned).slice(0, 5);

  if (spaces.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[13px] text-neutral-500">No spaces yet</p>
        <button
          onClick={onCreateSpace}
          className="mt-2 text-[12px] text-[#FFD700] hover:underline"
        >
          Create your first space
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Pinned */}
      {pinnedSpaces.length > 0 && (
        <>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Pinned
            </span>
          </div>
          {pinnedSpaces.map((space) => (
            <SpaceContextRow key={space.id} space={space} onSelect={onSpaceSelect} />
          ))}
        </>
      )}

      {/* Recent */}
      {recentSpaces.length > 0 && (
        <>
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Recent
            </span>
          </div>
          {recentSpaces.map((space) => (
            <SpaceContextRow key={space.id} space={space} onSelect={onSpaceSelect} />
          ))}
        </>
      )}

      {/* Create space */}
      {onCreateSpace && (
        <button
          onClick={onCreateSpace}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-all duration-150"
        >
          <PlusIcon />
          <span>Create space</span>
        </button>
      )}
    </div>
  );
};

// Space row with presence indicator
const SpaceContextRow: React.FC<{
  space: PresenceSpaceItem;
  onSelect?: (id: string) => void;
}> = ({ space, onSelect }) => (
  <motion.button
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    onClick={() => onSelect?.(space.id)}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neutral-800/50 transition-colors duration-150 group"
  >
    {/* Avatar with presence dot */}
    <div className="relative w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 text-[13px] font-medium flex-shrink-0">
      {space.avatar ? (
        <img src={space.avatar} alt={space.name} className="w-full h-full rounded-lg object-cover" />
      ) : (
        space.name.charAt(0)
      )}
      {space.activeNow > 0 && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
      )}
    </div>

    {/* Name */}
    <span className="flex-1 min-w-0 text-[13px] text-neutral-400 group-hover:text-neutral-200 truncate transition-colors">
      {space.name}
    </span>

    {/* Unread badge — gold */}
    {space.unreadCount && space.unreadCount > 0 && (
      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFD700] text-black text-[10px] font-semibold flex items-center justify-center">
        {space.unreadCount > 9 ? '9+' : space.unreadCount}
      </span>
    )}
  </motion.button>
);

// Profile Panel — Stats + quick actions
const ProfileContextPanel: React.FC<{
  userStats?: UserStats;
  userName?: string;
  userHandle?: string;
  onAction?: (action: string) => void;
}> = ({ userStats, userName, userHandle, onAction }) => {
  return (
    <div className="space-y-4">
      {/* User header */}
      <div className="px-3 py-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
          <UserIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-neutral-200">{userName || 'Your Profile'}</div>
          <div className="text-[12px] text-neutral-500">{userHandle ? `@${userHandle}` : ''}</div>
        </div>
      </div>

      {/* Stats — inline */}
      {userStats && (
        <div className="px-3 flex gap-6">
          <div>
            <div className="text-[18px] font-medium text-neutral-200">{userStats.spacesJoined}</div>
            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Spaces</div>
          </div>
          <div>
            <div className="text-[18px] font-medium text-neutral-200">{userStats.connections}</div>
            <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Connections</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-1 space-y-0.5">
        <ProfileActionButton icon={UserIcon} label="Edit Profile" onClick={() => onAction?.('edit-profile')} />
        <ProfileActionButton icon={SmallCalendarIcon} label="Calendar" onClick={() => onAction?.('calendar')} />
        <ProfileActionButton icon={SettingsIcon} label="Settings" shortcut="⌘," onClick={() => onAction?.('settings')} />
      </div>
    </div>
  );
};

const ProfileActionButton: React.FC<{
  icon: React.FC;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, shortcut, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 transition-all duration-150 group"
  >
    <Icon />
    <span className="text-[13px] flex-1">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-neutral-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
        {shortcut}
      </span>
    )}
  </button>
);

// Collapsible Section Component - like Income > Earnings/Refunds in reference
interface CollapsibleSectionProps {
  id: string;
  label: string;
  icon?: React.FC;
  badge?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsed?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  label,
  icon: Icon,
  badge,
  children,
  defaultOpen = false,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-0.5">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
          text-neutral-400 hover:text-neutral-200
          hover:bg-neutral-900/50
          transition-colors duration-150
        `}
        whileTap={{ scale: 0.98 }}
      >
        {Icon && <Icon />}
        <span className="flex-1 text-left text-[14px] font-medium">{label}</span>
        {badge && badge > 0 && (
          <span className="px-1.5 py-0.5 text-[11px] font-medium bg-white/10 text-white rounded-md">
            {badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: SILK_EASE }}
          className="text-neutral-500"
        >
          <ChevronDownIcon />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: SILK_EASE }}
            className="overflow-hidden"
          >
            <div className="pl-4 border-l border-neutral-800/50 ml-5 space-y-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface ShellNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ElementType;
  badge?: number;
  children?: ShellNavItem[];
  comingSoon?: boolean;
}

// Coming soon badge tooltip
const ComingSoonTooltip = ({ children, show }: { children: React.ReactNode; show: boolean }) => {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="
        absolute left-full top-1/2 -translate-y-1/2 ml-3
        px-2.5 py-1.5 rounded-lg bg-neutral-800
        text-[13px] text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        pointer-events-none
        transition-opacity duration-100
        z-50 shadow-lg
      ">
        Launching soon
      </div>
    </div>
  );
}

export interface ShellMobileNavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: number;
  onClick?: () => void;
  comingSoon?: boolean;
}

export interface ShellSpaceLink {
  id: string;
  label: string;
  href: string;
  status?: 'new' | 'live' | 'quiet';
  meta?: string;
}

export interface ShellSpaceSection {
  id: string;
  label: string;
  description?: string;
  spaces: ShellSpaceLink[];
  actionLabel?: string;
  actionHref?: string;
  emptyCopy?: string;
}

export interface UniversalShellProps {
  children: React.ReactNode;
  variant?: 'full' | 'minimal';
  sidebarStyle?: string;
  headerStyle?: string;
  navItems?: ShellNavItem[];
  secondaryNavItems?: ShellNavItem[];
  mobileNavItems?: ShellMobileNavItem[];
  notificationCount?: number;
  messageCount?: number;
  /** Typed notifications for the dropdown */
  notifications?: Array<{
    id: string;
    text: string;
    time: string;
    unread?: boolean;
  }>;
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  mySpaces?: ShellSpaceSection[];
  showContextRail?: boolean;
  showBreadcrumbs?: boolean;
  onNotificationNavigate?: (url: string) => void;
  // User profile card props
  userAvatarUrl?: string;
  userName?: string;
  userHandle?: string;
  userEmail?: string;
  userMajor?: string;
  userGradYear?: string;
  userCampus?: string;
  /** Sign out handler */
  onSignOut?: () => void;
  // Command palette props
  commandPaletteItems?: CommandPaletteItem[];
  onCommandPaletteSearch?: (query: string) => void;
  commandPaletteLoading?: boolean;
  onCommandPaletteSelect?: (item: CommandPaletteItem) => void;
  // Contextual panel props (OpenAI/Apple-style contextual sidebar)
  /** Enable contextual panels that change based on active section */
  enableContextualPanels?: boolean;
  /** Recent activity for Feed panel */
  recentActivity?: ActivityItem[];
  /** Spaces with presence for Spaces panel */
  presenceSpaces?: PresenceSpaceItem[];
  /** User stats for Profile panel */
  userStats?: UserStats;
  /** Handler when space is selected from contextual panel */
  onSpaceSelect?: (spaceId: string) => void;
  /** Handler for create space action */
  onCreateSpace?: () => void;
  /** Handler for profile quick actions */
  onProfileAction?: (action: string) => void;
  // SpaceSwitcher props (⌘. to open)
  /** Spaces for the SpaceSwitcher modal */
  switcherSpaces?: SpaceSwitcherSpace[];
  /** Handler when space is selected from SpaceSwitcher */
  onSwitcherSpaceSelect?: (space: SpaceSwitcherSpace) => void;
  // SpaceRail props (Phase 1: Space-first navigation)
  /** Whether user has builder access (HiveLab) */
  isBuilder?: boolean;
}

export const DEFAULT_SIDEBAR_NAV_ITEMS: ShellNavItem[] = [
  { id: 'feed', label: 'Feed', href: '/feed', comingSoon: true },
  { id: 'spaces', label: 'Spaces', href: '/spaces' },
  { id: 'hivelab', label: 'HiveLab', href: '/tools' },
];

// Secondary nav items (bottom section)
export const DEFAULT_SECONDARY_NAV_ITEMS: ShellNavItem[] = [
  { id: 'notifications', label: 'Notifications', href: '/notifications' },
];

export const DEFAULT_MOBILE_NAV_ITEMS: ShellMobileNavItem[] = [
  { id: 'spaces', icon: UsersIcon, label: 'Spaces', path: '/spaces' },
  { id: 'hivelab', icon: BeakerIcon, label: 'Lab', path: '/tools' },
  { id: 'profile', icon: UserIcon, label: 'Profile', path: '/profile' },
];

// Tooltip component - minimal style
const Tooltip = ({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) => {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="
        absolute left-full top-1/2 -translate-y-1/2 ml-3
        px-2.5 py-1.5 rounded-lg bg-neutral-800
        text-[13px] text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        pointer-events-none
        transition-opacity duration-100
        z-50 shadow-lg
      ">
        {label}
      </div>
    </div>
  );
};

// Default command palette items for navigation
const DEFAULT_COMMAND_PALETTE_ITEMS: CommandPaletteItem[] = [
  { id: 'nav-feed', label: 'Go to Feed', description: 'View your personalized feed', category: 'Navigation', shortcut: ['G', 'F'] },
  { id: 'nav-spaces', label: 'Browse Spaces', description: 'Discover and join communities', category: 'Navigation', shortcut: ['G', 'S'] },
  { id: 'nav-calendar', label: 'Open Calendar', description: 'View upcoming events', category: 'Navigation', shortcut: ['G', 'C'] },
  { id: 'nav-hivelab', label: 'HiveLab', description: 'Build and deploy tools', category: 'Navigation', shortcut: ['G', 'H'] },
  { id: 'nav-profile', label: 'My Profile', description: 'View and edit your profile', category: 'Navigation', shortcut: ['G', 'P'] },
  { id: 'nav-notifications', label: 'Notifications', description: 'View your notifications', category: 'Navigation', shortcut: ['G', 'N'] },
  { id: 'nav-settings', label: 'Settings', description: 'Manage your preferences', category: 'Settings', shortcut: ['G', ','] },
  { id: 'action-create-space', label: 'Create Space', description: 'Start a new community', category: 'Actions', featured: true },
  { id: 'action-create-event', label: 'Create Event', description: 'Schedule a new event', category: 'Actions' },
  { id: 'action-create-tool', label: 'Create Tool', description: 'Build a new HiveLab tool', category: 'Actions' },
];

export const UniversalShell: React.FC<UniversalShellProps> = ({
  children,
  variant = 'full',
  navItems = DEFAULT_SIDEBAR_NAV_ITEMS,
  secondaryNavItems = DEFAULT_SECONDARY_NAV_ITEMS,
  mobileNavItems = DEFAULT_MOBILE_NAV_ITEMS,
  notificationCount = 0,
  notifications,
  mySpaces = [],
  userAvatarUrl,
  userName,
  userHandle,
  userEmail,
  userMajor,
  userGradYear,
  userCampus,
  onSignOut,
  commandPaletteItems,
  onCommandPaletteSearch,
  commandPaletteLoading = false,
  onCommandPaletteSelect,
  // Contextual panel props
  enableContextualPanels = false,
  recentActivity,
  presenceSpaces,
  userStats,
  onSpaceSelect,
  onCreateSpace,
  onProfileAction,
  // SpaceSwitcher props
  switcherSpaces,
  onSwitcherSpaceSelect,
  // SpaceRail props
  isBuilder = false,
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isFirstNavVisit, setIsFirstNavVisit] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Check if this is user's first time seeing the nav (only on mount)
  useEffect(() => {
    try {
      const hasSeenNav = localStorage.getItem('hive-has-seen-nav');
      if (!hasSeenNav) {
        setIsFirstNavVisit(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Mark nav as seen when first visit reveal completes
  const handleFirstVisitComplete = useCallback(() => {
    setIsFirstNavVisit(false);
    try {
      localStorage.setItem('hive-has-seen-nav', 'true');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Toggle handlers for dropdowns (mutual exclusivity)
  const handleNotificationClick = useCallback(() => {
    setNotificationDropdownOpen(prev => !prev);
    setProfileDropdownOpen(false);
  }, []);

  const handleProfileClick = useCallback(() => {
    setProfileDropdownOpen(prev => !prev);
    setNotificationDropdownOpen(false);
  }, []);

  // Convert notifications prop to NotificationItem format for RefinedRail
  const railNotifications: NotificationItem[] = React.useMemo(() => {
    return (notifications || []).map(n => ({
      id: n.id,
      text: n.text,
      time: n.time,
      unread: n.unread,
    }));
  }, [notifications]);

  // Determine active section for contextual panels (3-item nav: feed, spaces, hivelab)
  const activeSection = React.useMemo(() => {
    if (!pathname) return 'spaces';
    if (pathname === '/' || pathname.startsWith('/feed')) return 'feed';
    if (pathname.startsWith('/spaces')) return 'spaces';
    if (pathname.startsWith('/tools')) return 'hivelab';
    // Profile and Calendar handled via user card dropdown, not main nav
    return 'spaces'; // Default to spaces for soft launch
  }, [pathname]);

  // Build command palette items from spaces and default navigation
  const allCommandPaletteItems = React.useMemo(() => {
    const items: CommandPaletteItem[] = [...(commandPaletteItems || DEFAULT_COMMAND_PALETTE_ITEMS)];

    // Add user's spaces to command palette
    const allSpaces = mySpaces.flatMap(section => section.spaces);
    allSpaces.slice(0, 10).forEach(space => {
      items.push({
        id: `space-${space.id}`,
        label: space.label,
        description: space.meta || 'Go to space',
        category: 'Your Spaces',
        onSelect: () => {
          if (typeof window !== 'undefined') {
            window.location.href = space.href;
          }
        },
      });
    });

    return items;
  }, [commandPaletteItems, mySpaces]);

  // Handle command palette selection with navigation
  const handleCommandPaletteSelect = useCallback((item: CommandPaletteItem) => {
    if (onCommandPaletteSelect) {
      onCommandPaletteSelect(item);
      return;
    }

    // Default navigation handling
    const navigationMap: Record<string, string> = {
      'nav-feed': '/feed',
      'nav-spaces': '/spaces',
      'nav-calendar': '/calendar',
      'nav-hivelab': '/tools',
      'nav-profile': '/profile',
      'nav-notifications': '/notifications',
      'nav-settings': '/profile/settings',
      'action-create-space': '/spaces/create',
      'action-create-event': '/events/create',
      'action-create-tool': '/tools/create',
    };

    const path = navigationMap[item.id];
    if (path && typeof window !== 'undefined') {
      window.location.href = path;
    }
  }, [onCommandPaletteSelect]);

  // Toggle a space section's expanded state
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Check if section is expanded (default to true for sections with spaces)
  const isSectionExpanded = (sectionId: string, hasSpaces: boolean) => {
    if (expandedSections[sectionId] !== undefined) {
      return expandedSections[sectionId];
    }
    return hasSpaces; // Default: expanded if has spaces
  };

  // Accessibility: simplified animations for reduced motion
  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : SPRING_CONFIG;

  const contentTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : CONTENT_TRANSITION;

  // Load sidebar state from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('hive-sidebar-collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      const savedSections = localStorage.getItem('hive-sidebar-sections');
      if (savedSections !== null) {
        setExpandedSections(JSON.parse(savedSections));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist expanded sections when they change
  useEffect(() => {
    if (Object.keys(expandedSections).length > 0) {
      try {
        localStorage.setItem('hive-sidebar-sections', JSON.stringify(expandedSections));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [expandedSections]);

  // Save collapse state
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem('hive-sidebar-collapsed', JSON.stringify(newState));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Global keyboard shortcuts (G + key for navigation)
  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Handle G prefix for navigation shortcuts
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed = true;
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000); // Reset after 1 second
        return;
      }

      if (gPressed && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const keyLower = e.key.toLowerCase();
        const shortcuts: Record<string, string> = {
          'f': '/feed',
          's': '/spaces',
          'c': '/calendar',
          'h': '/tools',
          'p': '/profile',
          'n': '/notifications',
          ',': '/profile/settings',
        };

        const path = shortcuts[keyLower];
        if (path && typeof window !== 'undefined') {
          e.preventDefault();
          window.location.href = path;
          gPressed = false;
          clearTimeout(gTimeout);
        }
      }

      // Escape key to close command palette (backup)
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }

      // ⌘. (Cmd/Ctrl + period) to open SpaceSwitcher
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSpaceSwitcherOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [isCommandPaletteOpen]);

  if (variant === 'minimal') {
    return <>{children}</>;
  }

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/feed' && pathname === '/') return true;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Flatten all spaces from sections
  const allSpaces = mySpaces.flatMap(section => section.spaces);
  const hasSpaces = allSpaces.length > 0;

  // Convert isCollapsed to isExpanded for RefinedRail
  const isExpanded = !isCollapsed;
  const handleExpandedChange = (expanded: boolean) => {
    const newCollapsed = !expanded;
    setIsCollapsed(newCollapsed);
    try {
      localStorage.setItem('hive-sidebar-collapsed', JSON.stringify(newCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Convert mySpaces (ShellSpaceSection[]) to SpaceRail format (SpaceItem[])
  // Flatten sections and map ShellSpaceLink → SpaceItem
  const railSpaces: SpaceItem[] = React.useMemo(() => {
    const spaces: SpaceItem[] = [];

    (mySpaces ?? []).forEach(section => {
      (section.spaces ?? []).forEach(space => {
        spaces.push({
          id: space.id,
          name: space.label,
          slug: space.id, // Use ID as slug for now
          category: section.id as SpaceItem['category'],
          // Map status to activeNow (live = many active, quiet = few)
          activeNow: space.status === 'live' ? 5 : space.status === 'new' ? 2 : 0,
          isPinned: false, // Could derive from meta if needed
          unreadCount: space.status === 'new' ? 1 : 0, // Show dot for new spaces
        });
      });
    });

    return spaces;
  }, [mySpaces]);

  // Determine which space is active based on URL
  const activeSpaceId = React.useMemo(() => {
    if (!pathname || !pathname.startsWith('/spaces/')) return undefined;
    // Extract space ID from /spaces/[spaceId]/...
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    return match?.[1];
  }, [pathname]);

  // Navigation handlers for SpaceRail
  const handleBrowseClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/spaces/browse';
    }
  }, []);

  const handleBuildClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/tools';
    }
  }, []);

  const handleJoinOrCreate = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/spaces/browse';
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop Sidebar - SpaceRail (Space-first navigation) visible at 1024px+ */}
      <div className="hidden lg:block">
        <SpaceRail
          spaces={railSpaces}
          activeSpaceId={activeSpaceId}
          onSpaceSelect={(spaceId) => {
            if (onSpaceSelect) {
              onSpaceSelect(spaceId);
            } else if (typeof window !== 'undefined') {
              window.location.href = `/spaces/${spaceId}`;
            }
          }}
          isExpanded={isExpanded}
          onExpandedChange={handleExpandedChange}
          hoverExpand={true}
          // Quick access
          onBrowseClick={handleBrowseClick}
          onBuildClick={handleBuildClick}
          onJoinOrCreate={handleJoinOrCreate}
          isBuilder={isBuilder}
          showFeedComingSoon={true}
          // Notifications
          notificationCount={notificationCount}
          notifications={railNotifications}
          notificationDropdownOpen={notificationDropdownOpen}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={() => {
            setNotificationDropdownOpen(false);
          }}
          // Profile
          user={userName ? {
            name: userName,
            handle: userHandle,
            avatarUrl: userAvatarUrl,
          } : undefined}
          profileDropdownOpen={profileDropdownOpen}
          onProfileClick={handleProfileClick}
          onSettingsClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/profile/settings';
            }
          }}
          onSignOut={onSignOut}
        />
      </div>

      {/* Main Content - Animated margin on desktop, full-width on mobile */}
      <motion.main
        className="flex-1 pb-14 lg:pb-0 flex flex-col"
        initial={false}
        animate={{
          marginLeft: isDesktop ? (isExpanded ? 260 : 56) : 0,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      >
        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </motion.main>

      {/* Mobile Bottom Nav - Enhanced with search (visible below 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/50 z-50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex justify-around items-center h-14 px-2">
          {mobileNavItems.slice(0, 4).map((item) => {
            const Icon = NAV_ICONS[item.id];
            const active = isActive(item.path);
            const isComingSoon = item.comingSoon;

            const baseClassName = `
              relative flex flex-col items-center justify-center gap-1
              flex-1 py-2 min-w-0
              transition-colors duration-100
              ${isComingSoon
                ? 'text-neutral-700 cursor-not-allowed'
                : active ? 'text-white' : 'text-neutral-500'
              }
            `;

            const content = (
              <>
                <div className="relative">
                  {Icon && <Icon />}
                  {/* Active indicator - gold dot (Phase 4 polish) */}
                  {active && !isComingSoon && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFD700]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>

                {/* Badge indicator */}
                {!isComingSoon && item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-2 h-2 bg-white rounded-full border-2 border-neutral-950" />
                )}
              </>
            );

            if (isComingSoon) {
              return (
                <span key={item.id} className={baseClassName} aria-disabled="true">
                  {content}
                </span>
              );
            }

            return (
              <a key={item.id} href={item.path} className={baseClassName} aria-current={active ? 'page' : undefined}>
                {content}
              </a>
            );
          })}

          {/* Search button for mobile - opens command palette */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0 text-neutral-500 hover:text-white transition-colors"
            aria-label="Search (opens command palette)"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </div>
      </nav>

      {/* Notification indicator (accessibility) */}
      {notificationCount > 0 && (
        <div className="sr-only" role="status">
          {notificationCount} unread notifications
        </div>
      )}

      {/* Global Command Palette - ⌘K */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        items={allCommandPaletteItems}
        onSelect={handleCommandPaletteSelect}
        onSearch={onCommandPaletteSearch}
        loading={commandPaletteLoading}
        placeholder="Search spaces, tools, or type a command..."
        emptyMessage="No results found. Try a different search."
      />

      {/* Space Switcher - ⌘. (Spotlight-style space navigation) */}
      <SpaceSwitcher
        isOpen={isSpaceSwitcherOpen}
        onClose={() => setIsSpaceSwitcherOpen(false)}
        spaces={switcherSpaces}
        onSelectSpace={(space) => {
          onSwitcherSpaceSelect?.(space);
          setIsSpaceSwitcherOpen(false);
        }}
        onCreateSpace={onCreateSpace}
        placeholder="Jump to a space..."
      />
    </div>
  );
};

export default UniversalShell;
