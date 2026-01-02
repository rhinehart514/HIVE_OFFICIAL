'use client';

/**
 * MobileActionBar - Enhanced bottom navigation with quick actions
 *
 * A fixed bottom action bar with gesture support:
 * - Tap: Opens corresponding drawer
 * - Long-press on [+]: Shows quick action menu (Poll, Event, Announcement)
 * - Badge indicators for unread/urgent content
 *
 * Features:
 * - 44px minimum touch targets (HIVE accessibility requirement)
 * - Gold accents for active states
 * - Haptic feedback ready (via callbacks)
 * - Long-press popover for quick actions
 * - Pulsing animation for urgent badges
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Enhanced with long-press and improved badges
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import {
  Info,
  Calendar,
  Wrench,
  Users,
  Plus,
  Vote,
  Megaphone,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { tinderSprings } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

export type MobileDrawerType = 'info' | 'events' | 'tools' | 'members' | 'automations';

export type QuickActionType = 'poll' | 'event' | 'announcement';

export type BadgeVariant = 'default' | 'presence' | 'accent';

export interface BadgeConfig {
  count: number;
  /** Whether this badge represents urgent content */
  isUrgent?: boolean;
  /** Visual variant: default (white), presence (gold pulsing dot), accent (gold badge) */
  variant?: BadgeVariant;
  /** Custom label for screen readers */
  ariaLabel?: string;
}

export interface MobileActionBarProps {
  /** Currently open drawer (if any) */
  activeDrawer?: MobileDrawerType | null;
  /** Callback when an action is clicked */
  onAction: (drawerType: MobileDrawerType) => void;
  /** Badge configurations for notifications */
  badges?: Partial<Record<MobileDrawerType, number | BadgeConfig>>;
  /** Whether to show the + button for quick actions */
  showQuickActions?: boolean;
  /** Whether user is a leader (affects quick action availability) */
  isLeader?: boolean;
  /** Callback when quick action is selected */
  onQuickAction?: (action: QuickActionType) => void;
  /** Callback for haptic feedback */
  onHaptic?: (type: 'light' | 'medium' | 'heavy') => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Action Configuration
// ============================================================

const ACTIONS: Array<{
  type: MobileDrawerType;
  icon: typeof Info;
  label: string;
  ariaLabel: string;
  leaderOnly?: boolean;
}> = [
  { type: 'info', icon: Info, label: 'Info', ariaLabel: 'View space info' },
  { type: 'events', icon: Calendar, label: 'Events', ariaLabel: 'View upcoming events' },
  { type: 'tools', icon: Wrench, label: 'Tools', ariaLabel: 'View space tools' },
  { type: 'members', icon: Users, label: 'Members', ariaLabel: 'View space members' },
  { type: 'automations', icon: Zap, label: 'Auto', ariaLabel: 'Manage automations', leaderOnly: true },
];

const QUICK_ACTIONS: Array<{
  type: QuickActionType;
  icon: typeof Vote;
  label: string;
  description: string;
  color: string;
}> = [
  {
    type: 'poll',
    icon: Vote,
    label: 'Create Poll',
    description: 'Ask the group a question',
    color: 'text-blue-400',
  },
  {
    type: 'event',
    icon: Calendar,
    label: 'Create Event',
    description: 'Schedule a meetup',
    color: 'text-green-400',
  },
  {
    type: 'announcement',
    icon: Megaphone,
    label: 'Announcement',
    description: 'Notify all members',
    color: 'text-orange-400',
  },
];

// Long press duration in ms
const LONG_PRESS_DURATION = 500;

// ============================================================
// Badge Component
// ============================================================

interface ActionBadgeProps {
  config: number | BadgeConfig;
  shouldReduceMotion: boolean | null;
}

function ActionBadge({ config, shouldReduceMotion }: ActionBadgeProps) {
  const badgeCount = typeof config === 'number' ? config : config.count;
  const isUrgent = typeof config === 'object' && config.isUrgent;
  const variant = typeof config === 'object' ? (config.variant ?? 'default') : 'default';
  const ariaLabel = typeof config === 'object' ? config.ariaLabel : undefined;

  if (badgeCount <= 0) return null;

  // Presence variant: gold pulsing dot (no count)
  if (variant === 'presence') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : springPresets.snappy}
        className={cn(
          'absolute -top-0.5 -right-0.5',
          'w-2.5 h-2.5 rounded-full',
          'bg-[#FFD700]',
          'shadow-[0_0_6px_rgba(255,215,0,0.5)]',
          !shouldReduceMotion && 'animate-pulse'
        )}
        role="status"
        aria-label={ariaLabel || `${badgeCount} online`}
      />
    );
  }

  // Accent variant: gold badge with count
  if (variant === 'accent') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : springPresets.snappy}
        className={cn(
          'absolute -top-1 -right-1.5 min-w-[16px] h-4',
          'flex items-center justify-center px-1',
          'text-[10px] font-bold rounded-full',
          'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30',
          isUrgent && !shouldReduceMotion && 'animate-pulse'
        )}
        role="status"
        aria-label={ariaLabel || `${badgeCount} items`}
      >
        {badgeCount > 99 ? '99+' : badgeCount}
      </motion.span>
    );
  }

  // Default variant: white badge with count
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : springPresets.snappy}
      className={cn(
        'absolute -top-1 -right-1.5 min-w-[16px] h-4',
        'flex items-center justify-center px-1',
        'text-[10px] font-bold rounded-full',
        'bg-white text-black',
        isUrgent && !shouldReduceMotion && 'animate-pulse'
      )}
      role="status"
      aria-label={ariaLabel || `${badgeCount} notifications`}
    >
      {badgeCount > 99 ? '99+' : badgeCount}
    </motion.span>
  );
}

// ============================================================
// Quick Action Popover
// ============================================================

interface QuickActionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (action: QuickActionType) => void;
  isLeader: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

function QuickActionPopover({
  isOpen,
  onClose,
  onSelect,
  isLeader,
  anchorRef,
}: QuickActionPopoverProps) {
  const shouldReduceMotion = useReducedMotion();
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const availableActions = isLeader
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter((a) => a.type === 'poll');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Popover */}
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.1 }
                : tinderSprings.settle
            }
            className={cn(
              'fixed z-50 bottom-20 left-1/2 -translate-x-1/2',
              'bg-neutral-900 border border-white/10 rounded-2xl',
              'shadow-2xl shadow-black/50',
              'overflow-hidden',
              'w-[calc(100%-32px)] max-w-xs'
            )}
            role="menu"
            aria-label="Quick actions"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">
                Quick Actions
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="p-2">
              {availableActions.map((action, index) => (
                <motion.button
                  key={action.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelect(action.type);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                    'text-left transition-colors',
                    'hover:bg-white/5 active:bg-white/10',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                  )}
                  role="menuitem"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      'bg-white/5'
                    )}
                  >
                    <action.icon className={cn('w-5 h-5', action.color)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {action.label}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {action.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Leader hint */}
            {!isLeader && (
              <div className="px-4 py-2 bg-neutral-800/50 text-xs text-neutral-500 text-center">
                Leaders can create events and announcements
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MobileActionBar({
  activeDrawer,
  onAction,
  badges = {},
  showQuickActions = true,
  isLeader = false,
  onQuickAction,
  onHaptic,
  className,
}: MobileActionBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [quickActionsOpen, setQuickActionsOpen] = React.useState(false);
  const quickActionsButtonRef = React.useRef<HTMLButtonElement>(null);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = React.useState(false);

  // Handle long press start
  const handleLongPressStart = React.useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setQuickActionsOpen(true);
      onHaptic?.('medium');
    }, LONG_PRESS_DURATION);
  }, [onHaptic]);

  // Handle long press end
  const handleLongPressEnd = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If wasn't a long press, treat as tap
    if (!isLongPressing) {
      setQuickActionsOpen(true);
      onHaptic?.('light');
    }
    setIsLongPressing(false);
  }, [isLongPressing, onHaptic]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleQuickActionSelect = React.useCallback(
    (action: QuickActionType) => {
      onQuickAction?.(action);
      onHaptic?.('light');
    },
    [onQuickAction, onHaptic]
  );

  return (
    <>
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-neutral-900/95 backdrop-blur-md',
          'border-t border-neutral-800',
          'pb-safe', // Safe area for notched devices
          className
        )}
        role="navigation"
        aria-label="Space quick actions"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {ACTIONS.filter(action => !action.leaderOnly || isLeader).map(({ type, icon: Icon, label, ariaLabel }) => {
            const isActive = activeDrawer === type;
            const badgeConfig = badges[type];

            return (
              <motion.button
                key={type}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => {
                  onAction(type);
                  onHaptic?.('light');
                }}
                className={cn(
                  // Base styles - 44px minimum touch target
                  'relative flex flex-col items-center justify-center',
                  'min-w-[56px] min-h-[44px] py-2 px-2',
                  'rounded-lg transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  // Active/inactive states
                  isActive
                    ? 'text-white'
                    : 'text-neutral-400 active:text-neutral-200 active:bg-white/5'
                )}
                aria-label={ariaLabel}
                aria-pressed={isActive}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />

                  {/* Badge indicator */}
                  <AnimatePresence>
                    {badgeConfig !== undefined && (
                      <ActionBadge
                        config={badgeConfig}
                        shouldReduceMotion={shouldReduceMotion}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <span className="mt-1 text-[10px] font-medium">{label}</span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-action-indicator"
                    className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : springPresets.snappy
                    }
                  />
                )}
              </motion.button>
            );
          })}

          {/* Quick Actions Button */}
          {showQuickActions && (
            <motion.button
              ref={quickActionsButtonRef}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[56px] min-h-[44px] py-2 px-2',
                'rounded-lg transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                quickActionsOpen
                  ? 'text-white bg-white/[0.08]'
                  : 'text-neutral-400 active:text-neutral-200 active:bg-white/5',
                isLongPressing && 'scale-110'
              )}
              aria-label="Quick actions"
              aria-expanded={quickActionsOpen}
              aria-haspopup="menu"
            >
              <div className="relative">
                <motion.div
                  animate={quickActionsOpen ? { rotate: 45 } : { rotate: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : springPresets.bouncy
                  }
                >
                  <Plus
                    className="w-5 h-5"
                    strokeWidth={quickActionsOpen ? 2 : 1.5}
                  />
                </motion.div>
              </div>

              <span className="mt-1 text-[10px] font-medium">Create</span>

              {/* Hint for long press */}
              <AnimatePresence>
                {isLongPressing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/50"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </nav>

      {/* Quick Actions Popover */}
      <QuickActionPopover
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onSelect={handleQuickActionSelect}
        isLeader={isLeader}
        anchorRef={quickActionsButtonRef}
      />
    </>
  );
}

export default MobileActionBar;
