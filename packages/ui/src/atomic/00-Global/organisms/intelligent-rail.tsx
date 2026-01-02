'use client';

/**
 * Intelligent Rail Navigation — HIVE Identity Refresh
 *
 * HIVE-native navigation rail that transforms from a minimal 56px icon rail
 * to a 240px contextual sidebar on hover. Distinctly HIVE, not generic SaaS.
 *
 * HIVE IDENTITY ELEMENTS:
 * - Hex-based icons: StreamMark, ClusterMark, BuildMark, PulseMark
 * - SNAP motion: 500 stiffness springs, 80ms transitions (not buttery Apple)
 * - Lowercase labels: "now", "saved", "builds" (student voice)
 * - Punchy gold: 40-60% opacity, overshoot animations
 *
 * Motion Philosophy (SNAP→HOLD→SNAP):
 * - SPRING_SNAP_NAV: stiffness 500, damping 25, mass 0.5
 * - PUNCH_TRANSITION: 120ms with premium ease
 * - SNAP_TRANSITION: 80ms micro-impact
 * - Hover delay: 150ms (not 300ms macOS Dock)
 * - Stagger: 80ms (not 150ms gentle cascade)
 *
 * Gold Usage:
 * - Active indicator (SNAP transition)
 * - Notification badge (punch overshoot: scale 0→1.3→1)
 * - HiveLab breathing glow (0.4 opacity, SNAP on hover)
 *
 * @author HIVE Design System
 */

import * as React from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { StreamMark, ClusterMark, BuildMark, PulseMark } from '../atoms/hive-marks';
import { SPRING_SNAP_NAV, PUNCH_TRANSITION, SNAP_TRANSITION } from '@hive/tokens';

// ============================================
// TYPES
// ============================================

export type NavSection = 'feed' | 'spaces' | 'hivelab';

export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread?: boolean;
}

export interface RefinedRailProps {
  activeSection?: NavSection;
  onSectionChange?: (section: NavSection) => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  notificationCount?: number;
  spaces?: SpaceItem[];
  recentActivity?: ActivityItem[];
  userStats?: UserStats;
  onSpaceSelect?: (spaceId: string) => void;
  /** Enable hover-to-expand behavior */
  hoverExpand?: boolean;
  /** User profile info for bottom card */
  user?: {
    name: string;
    handle?: string;
    avatarUrl?: string;
  };
  /** Callback for notification click */
  onNotificationClick?: () => void;
  /** Callback for settings click */
  onSettingsClick?: () => void;
  /** Callback for profile click */
  onProfileClick?: () => void;
  /** Notification dropdown state */
  notificationDropdownOpen?: boolean;
  /** Profile dropdown state */
  profileDropdownOpen?: boolean;
  /** Notifications data */
  notifications?: NotificationItem[];
  /** Sign out callback */
  onSignOut?: () => void;
  /** Mark all notifications read */
  onMarkAllRead?: () => void;
  /** First-time user - triggers staggered reveal animation */
  isFirstVisit?: boolean;
  /** Callback when first-time reveal completes */
  onFirstVisitComplete?: () => void;
  /** Locked sections - shown as "Coming Soon" */
  lockedSections?: NavSection[];
  /** Callback for HiveLab click */
  onHiveLabClick?: () => void;
}

interface SpaceItem {
  id: string;
  name: string;
  avatar?: string;
  memberCount: number;
  activeNow: number;
  isPinned?: boolean;
  unreadCount?: number;
  lastActivity?: string;
}

interface ActivityItem {
  id: string;
  type: 'message' | 'event' | 'mention' | 'reaction';
  title: string;
  subtitle?: string;
  timestamp: string;
  spaceId?: string;
  spaceName?: string;
}

interface UserStats {
  spacesJoined: number;
  connections: number;
  eventsThisWeek?: number;
  streak?: number;
}

// ============================================
// CONSTANTS
// ============================================

// Phase 4 Navigation Polish: More minimal dimensions
const REFINED_WIDTH_COLLAPSED = 56;  // Was 72px, now tighter
const REFINED_WIDTH_EXPANDED = 240;  // Was 300px, now more compact

// HIVE SNAP motion - decisive, not buttery
// Replaces Apple-like springs with HIVE signature rhythm
const SPRING_REFINED = SPRING_SNAP_NAV;

// Hover delay for expand - faster for SNAP feel
const HOVER_EXPAND_DELAY = 150; // Was 300ms - snappier response

// First-visit reveal animation config
const FIRST_VISIT_STAGGER_DELAY = 80; // Was 150ms - tighter cascade
const FIRST_VISIT_INITIAL_DELAY = 300; // ms before first item appears

// Spring for first-visit reveal - SNAP energy
const SPRING_REVEAL = {
  stiffness: 400, // Was 150 - more decisive
  damping: 25,    // Was 20 - less bouncy
  mass: 0.6,      // Was 1 - lighter, quicker
};

// ============================================
// HIVE MARK
// ============================================

const HIVE_LOGO_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

function HiveMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1500 1500" className={className} fill="currentColor">
      <path d={HIVE_LOGO_PATH} />
    </svg>
  );
}

// ============================================
// ICONS
// ============================================

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function SpacesIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function ChevronIcon({ className, direction = 'right' }: { className?: string; direction?: 'left' | 'right' }) {
  return (
    <svg
      className={cn('w-4 h-4', direction === 'left' && 'rotate-180', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarNavIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function HiveLabIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.25 48.25 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  );
}

// ============================================
// HIVE MARK WRAPPERS (for nav items)
// ============================================
// Wrap HIVE marks to match icon interface (className prop)

function StreamIcon({ className }: { className?: string }) {
  return <StreamMark size={20} className={cn('w-5 h-5', className)} />;
}

function ClusterIcon({ className }: { className?: string }) {
  return <ClusterMark size={20} className={cn('w-5 h-5', className)} />;
}

function BuildIcon({ className }: { className?: string }) {
  return <BuildMark size={20} className={cn('w-5 h-5', className)} />;
}

function PulseIcon({ className }: { className?: string }) {
  return <PulseMark size={20} className={cn('w-5 h-5', className)} animate={true} />;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_SPACES: SpaceItem[] = [
  { id: '1', name: 'CS Club', memberCount: 847, activeNow: 12, isPinned: true, unreadCount: 3 },
  { id: '2', name: 'Design Society', memberCount: 234, activeNow: 5, isPinned: true },
  { id: '3', name: 'Hackathon 2025', memberCount: 156, activeNow: 23, unreadCount: 7 },
  { id: '4', name: 'ML Research', memberCount: 89, activeNow: 2, lastActivity: '5m ago' },
  { id: '5', name: 'Startup Club', memberCount: 312, activeNow: 8, lastActivity: '1h ago' },
  { id: '6', name: 'Photography', memberCount: 178, activeNow: 0, lastActivity: '3h ago' },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'mention', title: '@sarah mentioned you', subtitle: 'in CS Club', timestamp: '2m ago', spaceName: 'CS Club' },
  { id: '2', type: 'event', title: 'Workshop starts in 1h', subtitle: 'Intro to ML', timestamp: '1h', spaceName: 'ML Research' },
  { id: '3', type: 'message', title: 'New messages', subtitle: '5 unread in Hackathon', timestamp: '15m ago', spaceName: 'Hackathon 2025' },
  { id: '4', type: 'reaction', title: 'Alex reacted', subtitle: 'to your post', timestamp: '30m ago', spaceName: 'Design Society' },
];

const MOCK_STATS: UserStats = {
  spacesJoined: 6,
  connections: 127,
  eventsThisWeek: 3,
  streak: 7,
};

// ============================================
// CONTEXTUAL PANELS
// ============================================

// Feed Panel — minimal, just recent activity
function RefinedFeedPanel({ recentActivity = MOCK_ACTIVITY.slice(0, 4) }: { recentActivity?: ActivityItem[] }) {
  const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'mention':
        return <span className="text-white/40">@</span>;
      case 'event':
        return <CalendarIcon className="text-white/40" />;
      case 'message':
        return <MessageIcon className="text-white/40" />;
      case 'reaction':
        return <HeartIcon className="text-white/40" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section label - lowercase student voice */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] font-medium text-white/30 lowercase tracking-[0.08em]">
          now
        </span>
      </div>

      {/* Activity list — minimal */}
      <div className="flex-1 px-3">
        {recentActivity.map((item) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={PUNCH_TRANSITION}
            className="w-full flex items-center gap-3 px-2 py-3 rounded-lg text-left hover:bg-white/[0.03] transition-colors duration-150"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {getTypeIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white/60 truncate">{item.title}</div>
            </div>
            <div className="text-[11px] text-white/20 flex-shrink-0">{item.timestamp}</div>
          </motion.button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard hint — very subtle */}
      <div className="px-5 py-3 flex items-center gap-1.5 text-[10px] text-white/20">
        <span className="px-1 py-0.5 rounded bg-white/[0.04] font-mono">⌘K</span>
        <span>search</span>
      </div>
    </div>
  );
}

// Spaces Panel — pinned + recent
function RefinedSpacesPanel({
  spaces = MOCK_SPACES,
  onSpaceSelect,
}: {
  spaces?: SpaceItem[];
  onSpaceSelect?: (id: string) => void;
}) {
  const pinnedSpaces = spaces.filter((s) => s.isPinned).slice(0, 3);
  const recentSpaces = spaces.filter((s) => !s.isPinned).slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Saved section - lowercase student voice */}
      {pinnedSpaces.length > 0 && (
        <>
          <div className="px-5 pt-4 pb-2">
            <span className="text-[10px] font-medium text-white/30 lowercase tracking-[0.08em]">
              saved
            </span>
          </div>
          <div className="px-3">
            {pinnedSpaces.map((space) => (
              <RefinedSpaceRow
                key={space.id}
                space={space}
                onSelect={onSpaceSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Recent section - lowercase student voice */}
      {recentSpaces.length > 0 && (
        <>
          <div className="px-5 pt-4 pb-2">
            <span className="text-[10px] font-medium text-white/30 lowercase tracking-[0.08em]">
              recent
            </span>
          </div>
          <div className="px-3">
            {recentSpaces.map((space) => (
              <RefinedSpaceRow
                key={space.id}
                space={space}
                onSelect={onSpaceSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Start a space — lowercase, inviting */}
      <div className="px-3 pb-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-150">
          <PlusIcon className="w-4 h-4" />
          <span>start a space</span>
        </button>
      </div>
    </div>
  );
}

function RefinedSpaceRow({
  space,
  onSelect,
}: {
  space: SpaceItem;
  onSelect?: (id: string) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelect?.(space.id)}
      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-white/[0.03] transition-colors duration-150 group"
    >
      {/* Avatar — very subtle */}
      <div className="relative w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 text-[13px] font-medium flex-shrink-0">
        {space.name.charAt(0)}
        {/* Tiny presence dot */}
        {space.activeNow > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500/80" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-white/60 group-hover:text-white/80 truncate transition-colors">
          {space.name}
        </span>
      </div>

      {/* Unread — gold badge, one of few gold uses */}
      {space.unreadCount && space.unreadCount > 0 && (
        <span className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-[#FFD700] text-black text-[10px] font-semibold flex items-center justify-center">
          {space.unreadCount > 9 ? '9' : space.unreadCount}
        </span>
      )}
    </motion.button>
  );
}

// Profile Panel — minimal stats + quick actions
function RefinedProfilePanel({ userStats = MOCK_STATS }: { userStats?: UserStats }) {
  return (
    <div className="flex flex-col h-full">
      {/* User header — minimal */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
            <ProfileIcon className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white/80">Your Profile</div>
            <div className="text-[12px] text-white/30">@username</div>
          </div>
        </div>
      </div>

      {/* Stats — just two, inline */}
      <div className="px-5 py-3 flex gap-6">
        <div>
          <div className="text-[18px] font-medium text-white/80">{userStats.spacesJoined}</div>
          <div className="text-[11px] text-white/30 uppercase tracking-[0.05em]">Spaces</div>
        </div>
        <div>
          <div className="text-[18px] font-medium text-white/80">{userStats.connections}</div>
          <div className="text-[11px] text-white/30 uppercase tracking-[0.05em]">Connections</div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick actions — just 3, very subtle */}
      <div className="px-3 pb-3 space-y-0.5">
        <RefinedActionButton icon={ProfileIcon} label="Edit Profile" />
        <RefinedActionButton icon={CalendarIcon} label="Calendar" />
        <RefinedActionButton icon={SettingsIcon} label="Settings" shortcut="⌘," />
      </div>
    </div>
  );
}

function RefinedActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-150 group"
    >
      <Icon className="w-4 h-4" />
      <span className="text-[13px] flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-white/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </span>
      )}
    </button>
  );
}

// Calendar Panel — upcoming events + quick actions
function RefinedCalendarPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-2">
        <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.05em]">
          Today
        </span>
      </div>

      <div className="flex-1 px-3">
        <div className="text-center py-8">
          <CalendarIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-[13px] text-white/40">No events today</p>
          <p className="text-[11px] text-white/20 mt-1">Your schedule is clear</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="px-5 py-3 flex items-center gap-1.5 text-[10px] text-white/20">
        <span className="px-1 py-0.5 rounded bg-white/[0.04] font-mono">G C</span>
        <span>calendar</span>
      </div>
    </div>
  );
}

// HiveLab Panel — recent tools + create action
function RefinedHiveLabPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Section label - lowercase student voice */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] font-medium text-[#FFD700]/50 lowercase tracking-[0.08em]">
          builds
        </span>
      </div>

      <div className="flex-1 px-3">
        <div className="text-center py-8">
          <BuildMark size={32} className="text-[#FFD700]/30 mx-auto mb-3" />
          <p className="text-[13px] text-white/40">Build something</p>
          <p className="text-[11px] text-white/20 mt-1">Tools for your spaces</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="px-3 pb-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#FFD700]/60 hover:text-[#FFD700]/80 hover:bg-[#FFD700]/[0.04] transition-all duration-150">
          <PlusIcon className="w-4 h-4" />
          <span>start building</span>
        </button>
      </div>
    </div>
  );
}

// User Profile Card — bottom of rail
function UserProfileCard({
  user,
  isExpanded,
  onClick,
}: {
  user?: { name: string; handle?: string; avatarUrl?: string };
  isExpanded: boolean;
  onClick?: () => void;
}) {
  if (!user) return null;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 w-full rounded-lg transition-all duration-150 min-h-[52px]',
        isExpanded ? 'px-3 py-2' : 'px-3 justify-center',
        'text-white/60 hover:text-white/80 hover:bg-white/[0.03]'
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white/50 text-[13px] font-medium flex-shrink-0 overflow-hidden">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0A0A0A]" />
      </div>

      {/* Name + handle (when expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0 text-left"
          >
            <div className="text-[13px] font-medium text-white/80 truncate">{user.name}</div>
            {user.handle && (
              <div className="text-[11px] text-white/40 truncate">@{user.handle}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// DROPDOWN PANELS (OpenAI/Apple aesthetic)
// ============================================

// Icons for dropdown menus
function UserMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

// Dropdown menu item
function DropdownMenuItem({
  icon: Icon,
  label,
  variant,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: 'default' | 'destructive';
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors duration-150',
        'text-[13px] hover:bg-white/[0.03]',
        variant === 'destructive' ? 'text-red-400/80' : 'text-white/70'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Notification Dropdown Panel
function NotificationDropdownPanel({
  notifications = [],
  onMarkAllRead,
  onClose,
}: {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Backdrop to close on click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ ...SPRING_REFINED }}
        className="absolute left-full top-0 ml-2 w-80 rounded-lg z-50"
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-[0.05em]">
            Notifications
          </span>
          {notifications.some(n => n.unread) && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Items */}
        <div className="px-2 pb-2 space-y-0.5 max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <BellIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-[13px] text-white/40">No notifications</p>
              <p className="text-[11px] text-white/20 mt-1">You're all caught up</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                {n.unread && (
                  <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#FFD700] flex-shrink-0" />
                )}
                {!n.unread && <div className="w-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/70 line-clamp-2">{n.text}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-white/[0.04]">
            <button className="w-full text-center text-[11px] text-white/40 hover:text-white/60 transition-colors">
              View all notifications
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// Profile Dropdown Panel
function ProfileDropdownPanel({
  user,
  onSignOut,
  onClose,
  onProfileClick,
  onSettingsClick,
}: {
  user: { name: string; handle?: string; avatarUrl?: string };
  onSignOut?: () => void;
  onClose?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}) {
  return (
    <>
      {/* Backdrop to close on click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ ...SPRING_REFINED }}
        className="absolute left-full bottom-0 ml-2 w-56 rounded-lg z-50"
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* User info */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[13px] font-medium text-white/70 ring-2 ring-transparent hover:ring-[#FFD700]/30 transition-all overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{user.name}</p>
              {user.handle && (
                <p className="text-[11px] text-white/40 truncate">@{user.handle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="px-2 py-2 space-y-0.5">
          <DropdownMenuItem
            icon={UserMenuIcon}
            label="Your Profile"
            onClick={() => { onProfileClick?.(); onClose?.(); }}
          />
          <DropdownMenuItem
            icon={SettingsIcon}
            label="Settings"
            onClick={() => { onSettingsClick?.(); onClose?.(); }}
          />
          <DropdownMenuItem icon={MoonIcon} label="Appearance" />
        </div>

        <div className="px-2 pb-2 pt-1 border-t border-white/[0.04]">
          <DropdownMenuItem
            icon={LogOutIcon}
            label="Sign out"
            variant="destructive"
            onClick={() => { onSignOut?.(); onClose?.(); }}
          />
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// NAV ITEM
// ============================================

function RefinedNavItem({
  icon: Icon,
  label,
  isActive,
  isExpanded,
  onClick,
  badge,
  isLocked = false,
  isGold = false,
  revealDelay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  badge?: number;
  /** Shows as "Coming Soon" and disabled */
  isLocked?: boolean;
  /** Always renders with gold accent (for HiveLab) */
  isGold?: boolean;
  /** Delay for first-visit reveal animation (ms) */
  revealDelay?: number;
}) {
  const hasRevealAnimation = typeof revealDelay === 'number';

  return (
    <motion.button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      initial={hasRevealAnimation ? { opacity: 0, x: -20 } : undefined}
      animate={hasRevealAnimation ? { opacity: 1, x: 0 } : undefined}
      transition={hasRevealAnimation ? {
        type: 'spring',
        ...SPRING_REVEAL,
        delay: revealDelay / 1000
      } : undefined}
      className={cn(
        'relative flex items-center gap-3 w-full rounded-lg transition-all duration-150 min-h-[44px]',
        isExpanded ? 'pl-4 pr-3' : 'pl-4 justify-center',
        isLocked
          ? 'text-white/20 cursor-not-allowed'
          : isGold
            ? 'text-[#FFD700]/80 hover:text-[#FFD700]'
            : isActive
              ? 'text-white/70 bg-white/[0.04]'
              : 'text-white/40 hover:text-white/60'
      )}
      whileHover={
        isLocked
          ? { scale: 1.02 } // Subtle feedback for locked items
          : !isActive
            ? { backgroundColor: 'rgba(255,255,255,0.04)', scale: 1.02 }  // SNAP hover
            : { scale: 1.02 }
      }
      whileTap={!isLocked ? { scale: 0.96 } : undefined}  // SNAP tap
      aria-label={isLocked ? `${label} - Coming Soon` : label}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={isLocked}
    >
      {/* Active indicator — at button left edge, centered vertically */}
      {/* SNAP in, don't float */}
      {isActive && !isLocked && (
        <motion.div
          layoutId="refined-active-indicator"
          className={cn(
            "absolute left-0 w-[2px] h-4 rounded-full",
            isGold ? "bg-[#FFD700]" : "bg-[#FFD700]"
          )}
          style={{ top: 'calc(50% - 8px)' }}
          transition={SNAP_TRANSITION}
        />
      )}

      {/* Breathing gold glow for HiveLab - the differentiator */}
      {isGold && !isLocked && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ boxShadow: '0 0 8px rgba(255,215,0,0.25)' }}
          animate={{
            boxShadow: [
              '0 0 8px rgba(255,215,0,0.25)',
              '0 0 16px rgba(255,215,0,0.4)',  // Was 12px/0.35 - punchier
              '0 0 8px rgba(255,215,0,0.25)',
            ],
          }}
          whileHover={{
            boxShadow: '0 0 20px rgba(255,215,0,0.6)', // SNAP to bright on hover
          }}
          transition={{
            boxShadow: {
              duration: 2.5,
              ease: 'easeInOut',
              repeat: Infinity,
            },
          }}
          style={{ background: 'radial-gradient(ellipse at left, rgba(255,215,0,0.18) 0%, transparent 70%)' }}
        />
      )}

      {/* Icon with badge wrapper */}
      <span className={cn(
        "relative z-10 flex-shrink-0",
        isGold && !isLocked && "drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]"
      )}>
        <Icon className={isGold && !isLocked ? 'text-[#FFD700]' : undefined} />
        {/* Badge — small dot when collapsed, punch animation */}
        {badge && badge > 0 && !isExpanded && !isLocked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}  // Overshoot then settle
            transition={{ duration: 0.2, ease: [0.22, 0, 0.36, 1] }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFD700]"
          />
        )}
      </span>

      {/* Label (when expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative z-10 text-[13px] truncate",
              isGold && !isLocked && "text-[#FFD700]"
            )}
            style={{ fontWeight: isActive ? 500 : 400 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Gold pulsing "Soon" badge for locked items */}
      {isLocked && isExpanded && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: [1, 1.05, 1],
          }}
          transition={{
            opacity: { duration: 0.15 },
            scale: {
              duration: 2.5,
              ease: 'easeInOut',
              repeat: Infinity,
            },
          }}
          className="absolute right-3 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded bg-[#FFD700]/15 text-[#FFD700]/80"
        >
          Soon
        </motion.span>
      )}

      {/* Badge when expanded — at right edge, punch animation */}
      {badge && badge > 0 && isExpanded && !isLocked && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}  // Overshoot then settle
          transition={{ duration: 0.2, ease: [0.22, 0, 0.36, 1] }}
          className="absolute right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-[#FFD700] text-black"
        >
          {badge > 9 ? '9+' : badge}
        </motion.span>
      )}
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function RefinedRail({
  activeSection = 'spaces',
  onSectionChange,
  isExpanded: controlledExpanded,
  onExpandedChange,
  notificationCount = 0,
  spaces,
  recentActivity,
  userStats,
  onSpaceSelect,
  hoverExpand = true,
  user,
  onNotificationClick,
  onSettingsClick,
  onProfileClick,
  notificationDropdownOpen = false,
  profileDropdownOpen = false,
  notifications = [],
  onSignOut,
  onMarkAllRead,
  isFirstVisit = false,
  onFirstVisitComplete,
  lockedSections = [],
  onHiveLabClick,
}: RefinedRailProps) {
  // State
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const [revealComplete, setRevealComplete] = React.useState(!isFirstVisit);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const shouldReduceMotion = useReducedMotion();
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const railRef = React.useRef<HTMLElement>(null);

  // First-visit reveal completion
  React.useEffect(() => {
    if (isFirstVisit && !revealComplete) {
      // Total animation time: initial delay + (3 nav items * stagger delay) + buffer
      const totalTime = FIRST_VISIT_INITIAL_DELAY + (3 * FIRST_VISIT_STAGGER_DELAY) + 500;
      const timer = setTimeout(() => {
        setRevealComplete(true);
        onFirstVisitComplete?.();
      }, totalTime);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, revealComplete, onFirstVisitComplete]);

  // Calculate reveal delays for each nav item
  const getRevealDelay = (index: number) => {
    if (!isFirstVisit || revealComplete || shouldReduceMotion) return undefined;
    return FIRST_VISIT_INITIAL_DELAY + (index * FIRST_VISIT_STAGGER_DELAY);
  };

  const handleExpandToggle = (newValue: boolean) => {
    setInternalExpanded(newValue);
    onExpandedChange?.(newValue);
  };

  // Hover-to-expand handlers
  const handleMouseEnter = () => {
    if (!hoverExpand || isExpanded) return;
    hoverTimeoutRef.current = setTimeout(() => {
      handleExpandToggle(true);
    }, HOVER_EXPAND_DELAY);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Click outside to collapse
  React.useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(event.target as Node)) {
        handleExpandToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const railWidth = isExpanded ? REFINED_WIDTH_EXPANDED : REFINED_WIDTH_COLLAPSED;

  return (
    <LayoutGroup id="refined-rail">
      <motion.nav
        ref={railRef}
        layout
        initial={false}
        animate={{ width: railWidth }}
        transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING_REFINED }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        style={{ background: '#0A0A0A' }}
      >
        {/* Very subtle edge gradient — no hard border */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.04) 70%, transparent 100%)',
          }}
        />

        {/* Frosted panel overlay when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.008) 0%, transparent 50%)',
                backdropFilter: 'blur(16px)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Header — HIVE mark */}
        <motion.div
          layout
          className={cn('relative z-10 flex items-center py-5', isExpanded ? 'pl-4 pr-5' : 'pl-4')}
          transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING_REFINED }}
        >
          <motion.div
            layout
            className="text-white/50"
            whileHover={{ opacity: 0.8 }}
            transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING_REFINED }}
          >
            <HiveMark size={22} />
          </motion.div>

          {/* Collapse button when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => handleExpandToggle(false)}
                className="ml-auto p-1.5 rounded-md text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-150"
              >
                <ChevronIcon direction="left" className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation items — HIVE marks, staggered reveal on first visit */}
        <div className={cn('relative z-10 space-y-1 overflow-visible', isExpanded ? 'pl-0 pr-3' : 'px-0')}>
          <RefinedNavItem
            icon={StreamIcon}
            label="Feed"
            isActive={activeSection === 'feed'}
            isExpanded={isExpanded}
            onClick={() => onSectionChange?.('feed')}
            isLocked={lockedSections.includes('feed')}
            revealDelay={getRevealDelay(0)}
          />
          <RefinedNavItem
            icon={ClusterIcon}
            label="Spaces"
            isActive={activeSection === 'spaces'}
            isExpanded={isExpanded}
            onClick={() => onSectionChange?.('spaces')}
            badge={spaces?.reduce((acc, s) => acc + (s.unreadCount || 0), 0)}
            revealDelay={getRevealDelay(1)}
          />
          <RefinedNavItem
            icon={BuildIcon}
            label="HiveLab"
            isActive={activeSection === 'hivelab'}
            isExpanded={isExpanded}
            onClick={() => onHiveLabClick ? onHiveLabClick() : onSectionChange?.('hivelab')}
            isGold={true}
            revealDelay={getRevealDelay(2)}
          />
        </div>

        {/* 24px gap before contextual panel */}
        <div className="h-6" />

        {/* Contextual panel (when expanded) - PUNCH reveal */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={PUNCH_TRANSITION}
              className="relative z-10 flex-1 overflow-hidden"
            >
              {activeSection === 'feed' && <RefinedFeedPanel recentActivity={recentActivity} />}
              {activeSection === 'spaces' && (
                <RefinedSpacesPanel spaces={spaces} onSpaceSelect={onSpaceSelect} />
              )}
              {activeSection === 'hivelab' && <RefinedHiveLabPanel />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer when collapsed */}
        {!isExpanded && <div className="flex-1" />}

        {/* Bottom section — notifications + user profile */}
        <div className={cn('relative z-10 py-4 overflow-visible', isExpanded ? 'pl-0 pr-3' : 'px-0')}>
          {/* Notifications with dropdown - PulseMark for live feel */}
          <div className="relative">
            <RefinedNavItem
              icon={PulseIcon}
              label="Notifications"
              isActive={notificationDropdownOpen}
              isExpanded={isExpanded}
              onClick={() => onNotificationClick?.()}
              badge={notificationCount}
            />

            {/* Notification dropdown panel */}
            <AnimatePresence>
              {notificationDropdownOpen && (
                <NotificationDropdownPanel
                  notifications={notifications}
                  onMarkAllRead={onMarkAllRead}
                  onClose={() => onNotificationClick?.()}
                />
              )}
            </AnimatePresence>
          </div>

          {/* User profile card with dropdown */}
          <div className="relative mt-2">
            <UserProfileCard
              user={user}
              isExpanded={isExpanded}
              onClick={onProfileClick}
            />

            {/* Profile dropdown panel */}
            <AnimatePresence>
              {profileDropdownOpen && user && (
                <ProfileDropdownPanel
                  user={user}
                  onSignOut={onSignOut}
                  onClose={() => onProfileClick?.()}
                  onProfileClick={onProfileClick}
                  onSettingsClick={onSettingsClick}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Expand button when collapsed */}
          {!isExpanded && !user && (
            <motion.button
              onClick={() => handleExpandToggle(true)}
              className="w-full flex items-center justify-center h-10 mt-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-150"
              whileTap={{ scale: 0.95 }}
              aria-label="Expand sidebar"
            >
              <ChevronIcon direction="right" className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </motion.nav>
    </LayoutGroup>
  );
}

// ============================================
// DEMO
// ============================================

// Mock notifications
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', text: 'New ritual starting in 10 minutes', time: '2m ago', unread: true },
  { id: '2', text: 'Alex commented on your post in CS Club', time: '1h ago', unread: true },
  { id: '3', text: 'Design Society posted a new event', time: '3h ago', unread: false },
  { id: '4', text: 'You were mentioned in Hackathon 2025', time: '5h ago', unread: false },
];

export function RefinedRailDemo() {
  const [activeSection, setActiveSection] = React.useState<NavSection>('spaces');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const [isFirstVisit, setIsFirstVisit] = React.useState(true);

  const handleNotificationClick = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setProfileDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    setNotificationDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <RefinedRail
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isExpanded={isExpanded}
        onExpandedChange={setIsExpanded}
        notificationCount={3}
        spaces={MOCK_SPACES}
        recentActivity={MOCK_ACTIVITY}
        userStats={MOCK_STATS}
        onSpaceSelect={(id) => console.log('Selected space:', id)}
        hoverExpand={true}
        user={{
          name: 'Sarah Chen',
          handle: 'sarahc',
          avatarUrl: undefined,
        }}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        notificationDropdownOpen={notificationDropdownOpen}
        profileDropdownOpen={profileDropdownOpen}
        notifications={MOCK_NOTIFICATIONS}
        onSignOut={() => console.log('Sign out clicked')}
        onMarkAllRead={() => console.log('Mark all read clicked')}
        // New soft launch features
        isFirstVisit={isFirstVisit}
        onFirstVisitComplete={() => {
          console.log('First visit reveal complete');
          setIsFirstVisit(false);
        }}
        lockedSections={['feed']} // Feed locked for soft launch
        onHiveLabClick={() => console.log('HiveLab clicked - go to tools')}
      />

      {/* Main content area */}
      <motion.main
        initial={false}
        animate={{ marginLeft: isExpanded ? REFINED_WIDTH_EXPANDED : REFINED_WIDTH_COLLAPSED }}
        transition={{ ...SPRING_REFINED }}
        className="min-h-screen p-12"
      >
        <div className="max-w-xl">
          <h1 className="text-[28px] font-medium text-white/90 mb-1 tracking-tight">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>
          <p className="text-[14px] text-white/40 mb-4">
            Hover the rail to expand. Click elsewhere to collapse.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="px-2 py-1 rounded-md bg-[#FFD700]/10 text-[#FFD700] text-[11px] font-medium">
              HiveLab = Breathing Glow
            </span>
            <span className="px-2 py-1 rounded-md bg-[#FFD700]/10 text-[#FFD700]/60 text-[11px] font-medium">
              Feed = Pulsing "Soon"
            </span>
            <span className="px-2 py-1 rounded-md bg-white/5 text-white/50 text-[11px] font-medium">
              3-Item Nav (No Profile)
            </span>
            {isFirstVisit && (
              <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                First Visit Reveal Active
              </span>
            )}
          </div>

          {/* Minimal placeholder content */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="h-3 w-48 rounded bg-white/[0.04] mb-2" />
                <div className="h-2.5 w-32 rounded bg-white/[0.02]" />
              </div>
            ))}
          </div>
        </div>
      </motion.main>
    </div>
  );
}

// Legacy alias for backwards compatibility
export const IntelligentRail = RefinedRail;

export default RefinedRail;
