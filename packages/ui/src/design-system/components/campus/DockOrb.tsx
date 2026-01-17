'use client';

/**
 * DockOrb - Individual orb in the Campus Dock
 *
 * Represents a space or tool with:
 * - Avatar/icon display
 * - Online count badge (spaces)
 * - Active users badge (tools)
 * - Warmth glow based on activity
 * - Gold ring when active
 * - Hover animation (scale + lift)
 * - Drag support for reordering
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================
// CONSTANTS
// ============================================

const ORB_SIZE = 44;

const orbVariants = {
  idle: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.15,
    y: -8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
};

// ============================================
// TYPES
// ============================================

export type WarmthLevel = 'none' | 'low' | 'medium' | 'high';

export interface DockOrbProps {
  id: string;
  type: 'space' | 'tool';

  // Display
  name: string;
  avatar?: string;
  icon?: React.ReactNode;

  // Badges
  onlineCount?: number;
  activeUsers?: number;
  unreadCount?: number;

  // State
  isActive?: boolean;
  warmth?: WarmthLevel;

  // Interactions
  onClick?: () => void;
  onHover?: (position: { x: number; y: number }) => void;
  onHoverEnd?: () => void;

  // Drag (future)
  isDraggable?: boolean;
  dragIndex?: number;

  className?: string;
}

// ============================================
// HELPERS
// ============================================

function getWarmthStyle(warmth: WarmthLevel): string {
  switch (warmth) {
    case 'low':
      return 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.04)]';
    case 'medium':
      return 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.08)]';
    case 'high':
      return 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.12)]';
    default:
      return '';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// COMPONENT
// ============================================

export function DockOrb({
  id,
  type,
  name,
  avatar,
  icon,
  onlineCount,
  activeUsers,
  unreadCount,
  isActive = false,
  warmth = 'none',
  onClick,
  onHover,
  onHoverEnd,
  isDraggable = false,
  className,
}: DockOrbProps) {
  const orbRef = React.useRef<HTMLButtonElement>(null);

  const handleHover = React.useCallback(() => {
    if (onHover && orbRef.current) {
      const rect = orbRef.current.getBoundingClientRect();
      onHover({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, [onHover]);

  // Determine badge content
  const badgeValue = type === 'space' ? onlineCount : activeUsers;
  const showBadge = badgeValue !== undefined && badgeValue > 0;
  const showUnread = unreadCount !== undefined && unreadCount > 0;

  return (
    <motion.button
      ref={orbRef}
      variants={orbVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      onMouseEnter={handleHover}
      onMouseLeave={onHoverEnd}
      className={cn(
        'relative flex-shrink-0',
        'rounded-xl',
        'bg-[var(--bg-surface)]',
        'border border-[var(--border-default)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-ground)]',
        'transition-shadow duration-150',
        // Warmth glow
        getWarmthStyle(warmth),
        // Active state - gold ring
        isActive && [
          'ring-2 ring-[var(--life-gold)]',
          'shadow-[0_0_12px_rgba(255,215,0,0.3)]',
        ],
        className
      )}
      style={{ width: ORB_SIZE, height: ORB_SIZE }}
      aria-label={name}
      data-orb-id={id}
      data-orb-type={type}
    >
      {/* Avatar/Icon */}
      <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : icon ? (
          <span className="text-[var(--text-secondary)]">{icon}</span>
        ) : (
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {getInitials(name)}
          </span>
        )}
      </div>

      {/* Online/Active Badge */}
      {showBadge && (
        <motion.span
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'absolute -top-1 -right-1',
            'min-w-[18px] h-[18px] px-1',
            'flex items-center justify-center',
            'text-[10px] font-semibold',
            'rounded-full',
            // Gold for presence (allowed by budget)
            'bg-[var(--life-gold)] text-black'
          )}
        >
          {badgeValue > 99 ? '99+' : badgeValue}
        </motion.span>
      )}

      {/* Unread Indicator */}
      {showUnread && !showBadge && (
        <motion.span
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'absolute -top-0.5 -right-0.5',
            'w-3 h-3',
            'rounded-full',
            'bg-[var(--life-gold)]'
          )}
        />
      )}

      {/* Tooltip (shown on hover via CSS) */}
      <span className="sr-only">{name}</span>
    </motion.button>
  );
}

export default DockOrb;
