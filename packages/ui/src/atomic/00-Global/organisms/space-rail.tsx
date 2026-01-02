'use client';

/**
 * SpaceRail — ChatGPT/Claude-style Space-First Navigation
 *
 * DESIGN PHILOSOPHY:
 * Spaces ARE the navigation. Like ChatGPT's conversation list, your spaces
 * are the primary thing you see. Everything else is secondary.
 *
 * STRUCTURE:
 * ┌─────────────────────┐
 * │ [HIVE logo]         │
 * ├─────────────────────┤
 * │ YOUR SPACES         │  ← Always visible, not contextual
 * │ [Space 1]           │
 * │ [Space 2]           │
 * │ [Space 3]           │
 * │ [+ Join or Create]  │
 * ├─────────────────────┤
 * │ ○ Browse            │  ← Quick access
 * │ ✦ Build             │  ← Gold glow
 * ├─────────────────────┤
 * │                     │
 * │ [Notifications]     │
 * │ [Profile Card]      │
 * └─────────────────────┘
 *
 * @author HIVE Design System
 * @version 3.0.0 - Space-first paradigm
 */

import * as React from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { StreamMark, ClusterMark, BuildMark, PulseMark } from '../atoms/hive-marks';
import { SPRING_SNAP_NAV, PUNCH_TRANSITION, SNAP_TRANSITION } from '@hive/tokens';

// ============================================
// TYPES
// ============================================

export interface SpaceItem {
  id: string;
  name: string;
  slug?: string;
  avatar?: string;
  memberCount?: number;
  activeNow?: number;
  isPinned?: boolean;
  unreadCount?: number;
  lastActivity?: string;
  category?: 'residential' | 'greek' | 'student_org' | 'university_org';
}

export interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread?: boolean;
}

export interface SpaceRailProps {
  /** User's spaces - the primary content */
  spaces?: SpaceItem[];
  /** Currently active space ID */
  activeSpaceId?: string;
  /** Space select callback */
  onSpaceSelect?: (spaceId: string) => void;
  /** Browse/discover callback */
  onBrowseClick?: () => void;
  /** Build/HiveLab callback */
  onBuildClick?: () => void;
  /** Join or create space callback */
  onJoinOrCreate?: () => void;
  /** Is rail expanded */
  isExpanded?: boolean;
  /** Expansion change callback */
  onExpandedChange?: (expanded: boolean) => void;
  /** Enable hover-to-expand */
  hoverExpand?: boolean;
  /** Notification count */
  notificationCount?: number;
  /** Notification click callback */
  onNotificationClick?: () => void;
  /** Notifications data */
  notifications?: NotificationItem[];
  /** Notification dropdown open */
  notificationDropdownOpen?: boolean;
  /** Mark all notifications read */
  onMarkAllRead?: () => void;
  /** User profile info */
  user?: {
    name: string;
    handle?: string;
    avatarUrl?: string;
  };
  /** Profile click callback */
  onProfileClick?: () => void;
  /** Profile dropdown open */
  profileDropdownOpen?: boolean;
  /** Settings click callback */
  onSettingsClick?: () => void;
  /** Sign out callback */
  onSignOut?: () => void;
  /** Is HiveLab accessible (for leaders only) */
  isBuilder?: boolean;
  /** Show "Coming Soon" badge on Feed */
  showFeedComingSoon?: boolean;
  /** Feed click callback (if enabled) */
  onFeedClick?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const WIDTH_COLLAPSED = 56;
const WIDTH_EXPANDED = 260;
const HOVER_EXPAND_DELAY = 150;

const SPRING_REFINED = SPRING_SNAP_NAV;

// ============================================
// ICONS
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

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

// ============================================
// SPACE ITEM COMPONENT
// ============================================

function SpaceItemRow({
  space,
  isActive,
  isExpanded,
  onSelect,
}: {
  space: SpaceItem;
  isActive?: boolean;
  isExpanded: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onSelect?.(space.id)}
      className={cn(
        'relative w-full flex items-center gap-3 rounded-lg transition-all duration-150',
        isExpanded ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center',
        isActive
          ? 'bg-white/[0.06] text-white/90'
          : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="space-active-indicator"
          className="absolute left-0 w-[2px] h-4 rounded-full bg-[#FFD700]"
          style={{ top: 'calc(50% - 8px)' }}
          transition={SNAP_TRANSITION}
        />
      )}

      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 text-[13px] font-medium flex-shrink-0 overflow-hidden">
        {space.avatar ? (
          <img src={space.avatar} alt={space.name} className="w-full h-full object-cover" />
        ) : (
          space.name.charAt(0).toUpperCase()
        )}
        {/* Activity indicator */}
        {space.activeNow && space.activeNow > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500/80" />
        )}
      </div>

      {/* Name + unread (when expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0 flex items-center gap-2"
          >
            <span className={cn(
              'text-[13px] truncate transition-colors',
              isActive ? 'font-medium' : ''
            )}>
              {space.name}
            </span>
            {/* Unread badge */}
            {space.unreadCount && space.unreadCount > 0 && (
              <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full bg-[#FFD700] text-black">
                {space.unreadCount > 9 ? '9+' : space.unreadCount}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unread dot (when collapsed) */}
      {!isExpanded && space.unreadCount && space.unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FFD700]"
        />
      )}
    </motion.button>
  );
}

// ============================================
// QUICK ACCESS NAV ITEM
// ============================================

function QuickAccessItem({
  icon: Icon,
  label,
  isExpanded,
  onClick,
  isGold = false,
  badge,
  isLocked = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  onClick?: () => void;
  isGold?: boolean;
  badge?: number;
  isLocked?: boolean;
}) {
  return (
    <motion.button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={cn(
        'relative flex items-center gap-3 w-full rounded-lg transition-all duration-150 min-h-[44px]',
        isExpanded ? 'pl-4 pr-3' : 'pl-4 justify-center',
        isLocked
          ? 'text-white/20 cursor-not-allowed'
          : isGold
            ? 'text-[#FFD700]/80 hover:text-[#FFD700]'
            : 'text-white/40 hover:text-white/60'
      )}
      whileHover={!isLocked ? { backgroundColor: 'rgba(255,255,255,0.04)', scale: 1.02 } : undefined}
      whileTap={!isLocked ? { scale: 0.96 } : undefined}
    >
      {/* Gold breathing glow for Build */}
      {isGold && !isLocked && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 8px rgba(255,215,0,0.25)',
              '0 0 16px rgba(255,215,0,0.4)',
              '0 0 8px rgba(255,215,0,0.25)',
            ],
          }}
          whileHover={{
            boxShadow: '0 0 20px rgba(255,215,0,0.6)',
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

      {/* Icon */}
      <span className={cn(
        "relative z-10 flex-shrink-0",
        isGold && !isLocked && "drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]"
      )}>
        <Icon className={isGold && !isLocked ? 'text-[#FFD700]' : undefined} />
        {/* Badge dot when collapsed */}
        {badge && badge > 0 && !isExpanded && !isLocked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFD700]"
          />
        )}
      </span>

      {/* Label */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative z-10 text-[13px]",
              isGold && !isLocked && "text-[#FFD700]"
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Coming Soon badge */}
      {isLocked && isExpanded && (
        <motion.span
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
          className="absolute right-3 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded bg-[#FFD700]/15 text-[#FFD700]/80"
        >
          Soon
        </motion.span>
      )}
    </motion.button>
  );
}

// ============================================
// USER PROFILE CARD
// ============================================

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

      {/* Name + handle */}
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
// DROPDOWN PANELS
// ============================================

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
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-[13px] font-medium text-white/70 overflow-hidden">
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

        <div className="px-2 py-2 space-y-0.5">
          <button
            onClick={() => { onProfileClick?.(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13px] text-white/70 hover:bg-white/[0.03] transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Your Profile
          </button>
          <button
            onClick={() => { onSettingsClick?.(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13px] text-white/70 hover:bg-white/[0.03] transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </div>

        <div className="px-2 pb-2 pt-1 border-t border-white/[0.04]">
          <button
            onClick={() => { onSignOut?.(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13px] text-red-400/80 hover:bg-white/[0.03] transition-colors"
          >
            <LogOutIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SpaceRail({
  spaces = [],
  activeSpaceId,
  onSpaceSelect,
  onBrowseClick,
  onBuildClick,
  onJoinOrCreate,
  isExpanded: controlledExpanded,
  onExpandedChange,
  hoverExpand = true,
  notificationCount = 0,
  onNotificationClick,
  notifications = [],
  notificationDropdownOpen = false,
  onMarkAllRead,
  user,
  onProfileClick,
  profileDropdownOpen = false,
  onSettingsClick,
  onSignOut,
  isBuilder = true,
  showFeedComingSoon = true,
  onFeedClick,
}: SpaceRailProps) {
  // State
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const shouldReduceMotion = useReducedMotion();
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const railRef = React.useRef<HTMLElement>(null);

  // Separate pinned and recent spaces
  const pinnedSpaces = spaces.filter(s => s.isPinned).slice(0, 3);
  const recentSpaces = spaces.filter(s => !s.isPinned).slice(0, 5);
  const maxDisplaySpaces = 8;
  const displaySpaces = [...pinnedSpaces, ...recentSpaces].slice(0, maxDisplaySpaces);

  const handleExpandToggle = (newValue: boolean) => {
    setInternalExpanded(newValue);
    onExpandedChange?.(newValue);
  };

  // Hover handlers
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

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const railWidth = isExpanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED;

  return (
    <LayoutGroup id="space-rail">
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
        {/* Edge gradient */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.04) 70%, transparent 100%)',
          }}
        />

        {/* Frosted panel when expanded */}
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

        {/* Header - HIVE mark */}
        <motion.div
          layout
          className={cn('relative z-10 flex items-center py-5', isExpanded ? 'pl-4 pr-5' : 'pl-4')}
          transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING_REFINED }}
        >
          <motion.div
            layout
            className="text-white/50"
            whileHover={{ opacity: 0.8 }}
          >
            <HiveMark size={22} />
          </motion.div>

          {/* Collapse button */}
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

        {/* Section: Your Spaces (PRIMARY CONTENT) */}
        <div className={cn('relative z-10 flex-1 overflow-hidden', isExpanded ? 'px-3' : 'px-2')}>
          {/* Section label */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1 pt-1 pb-2"
              >
                <span className="text-[10px] font-medium text-white/30 lowercase tracking-[0.08em]">
                  your spaces
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Space list */}
          <div className="space-y-0.5">
            {displaySpaces.map((space) => (
              <SpaceItemRow
                key={space.id}
                space={space}
                isActive={space.id === activeSpaceId}
                isExpanded={isExpanded}
                onSelect={onSpaceSelect}
              />
            ))}
          </div>

          {/* Join or create */}
          <motion.button
            onClick={onJoinOrCreate}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg text-[13px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-150 mt-2',
              isExpanded ? 'px-3 py-2' : 'px-2 py-2 justify-center'
            )}
          >
            <PlusIcon className="w-4 h-4" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  join or create
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Divider */}
        <div className="relative z-10 h-px mx-4 my-3 bg-white/[0.04]" />

        {/* Section: Quick Access */}
        <div className={cn('relative z-10 space-y-1', isExpanded ? 'px-0 pr-3' : 'px-0')}>
          {/* Feed (Coming Soon) */}
          {showFeedComingSoon && (
            <QuickAccessItem
              icon={StreamMark}
              label="Feed"
              isExpanded={isExpanded}
              onClick={onFeedClick}
              isLocked={true}
            />
          )}

          {/* Browse/Discover */}
          <QuickAccessItem
            icon={CompassIcon}
            label="Browse"
            isExpanded={isExpanded}
            onClick={onBrowseClick}
          />

          {/* Build (HiveLab) - only for builders */}
          {isBuilder && (
            <QuickAccessItem
              icon={BuildMark}
              label="Build"
              isExpanded={isExpanded}
              onClick={onBuildClick}
              isGold={true}
            />
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom section: Notifications + Profile */}
        <div className={cn('relative z-10 py-4 overflow-visible', isExpanded ? 'px-0 pr-3' : 'px-0')}>
          {/* Notifications */}
          <div className="relative">
            <QuickAccessItem
              icon={PulseMark}
              label="Notifications"
              isExpanded={isExpanded}
              onClick={onNotificationClick}
              badge={notificationCount}
            />

            <AnimatePresence>
              {notificationDropdownOpen && (
                <NotificationDropdownPanel
                  notifications={notifications}
                  onMarkAllRead={onMarkAllRead}
                  onClose={onNotificationClick}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative mt-2">
            <UserProfileCard
              user={user}
              isExpanded={isExpanded}
              onClick={onProfileClick}
            />

            <AnimatePresence>
              {profileDropdownOpen && user && (
                <ProfileDropdownPanel
                  user={user}
                  onSignOut={onSignOut}
                  onClose={onProfileClick}
                  onProfileClick={onProfileClick}
                  onSettingsClick={onSettingsClick}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Expand button when collapsed and no user */}
          {!isExpanded && !user && (
            <motion.button
              onClick={() => handleExpandToggle(true)}
              className="w-full flex items-center justify-center h-10 mt-2 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-150"
              whileTap={{ scale: 0.95 }}
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

const MOCK_SPACES: SpaceItem[] = [
  { id: '1', name: 'CS Club', memberCount: 847, activeNow: 12, isPinned: true, unreadCount: 3 },
  { id: '2', name: 'Design Society', memberCount: 234, activeNow: 5, isPinned: true },
  { id: '3', name: 'Hackathon 2025', memberCount: 156, activeNow: 23, unreadCount: 7 },
  { id: '4', name: 'ML Research', memberCount: 89, activeNow: 2, lastActivity: '5m ago' },
  { id: '5', name: 'Startup Club', memberCount: 312, activeNow: 8, lastActivity: '1h ago' },
  { id: '6', name: 'Photography', memberCount: 178, activeNow: 0, lastActivity: '3h ago' },
];

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', text: 'New ritual starting in 10 minutes', time: '2m ago', unread: true },
  { id: '2', text: 'Alex commented on your post in CS Club', time: '1h ago', unread: true },
  { id: '3', text: 'Design Society posted a new event', time: '3h ago', unread: false },
];

export function SpaceRailDemo() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string | undefined>('1');
  const [notificationDropdownOpen, setNotificationDropdownOpen] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <SpaceRail
        spaces={MOCK_SPACES}
        activeSpaceId={activeSpaceId}
        onSpaceSelect={setActiveSpaceId}
        isExpanded={isExpanded}
        onExpandedChange={setIsExpanded}
        hoverExpand={true}
        notificationCount={3}
        notifications={MOCK_NOTIFICATIONS}
        notificationDropdownOpen={notificationDropdownOpen}
        onNotificationClick={() => {
          setNotificationDropdownOpen(!notificationDropdownOpen);
          setProfileDropdownOpen(false);
        }}
        profileDropdownOpen={profileDropdownOpen}
        onProfileClick={() => {
          setProfileDropdownOpen(!profileDropdownOpen);
          setNotificationDropdownOpen(false);
        }}
        user={{
          name: 'Sarah Chen',
          handle: 'sarahc',
        }}
        onBrowseClick={() => console.log('Browse clicked')}
        onBuildClick={() => console.log('Build clicked')}
        onJoinOrCreate={() => console.log('Join or create clicked')}
        isBuilder={true}
        showFeedComingSoon={true}
      />

      {/* Main content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: isExpanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
        transition={{ ...SPRING_REFINED }}
        className="min-h-screen p-12"
      >
        <div className="max-w-xl">
          <h1 className="text-[28px] font-medium text-white/90 mb-1 tracking-tight">
            SpaceRail — Space-First Navigation
          </h1>
          <p className="text-[14px] text-white/40 mb-4">
            Your spaces are now the primary navigation. Like ChatGPT's conversations.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="px-2 py-1 rounded-md bg-[#FFD700]/10 text-[#FFD700] text-[11px] font-medium">
              Spaces = Primary
            </span>
            <span className="px-2 py-1 rounded-md bg-white/5 text-white/50 text-[11px] font-medium">
              Browse + Build = Quick Access
            </span>
            <span className="px-2 py-1 rounded-md bg-[#FFD700]/10 text-[#FFD700]/60 text-[11px] font-medium">
              Feed = Coming Soon
            </span>
          </div>

          <p className="text-[13px] text-white/30">
            Active space: {activeSpaceId ? MOCK_SPACES.find(s => s.id === activeSpaceId)?.name : 'None'}
          </p>
        </div>
      </motion.main>
    </div>
  );
}

export default SpaceRail;
