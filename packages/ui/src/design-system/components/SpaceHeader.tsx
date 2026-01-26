'use client';

/**
 * SpaceHeader — Core space header component
 *
 * Displays the essential identity of a space:
 * - Avatar with verification badge
 * - Name and member stats
 * - Join/Leave action
 * - Share action
 *
 * Design Philosophy:
 * - Dark-first with gold for verified/online indicators only
 * - Minimal motion (spring on verification badge)
 * - Clean composition for embedding in layouts
 *
 * For full-featured headers with Ken Burns, parallax, and tabs,
 * see SpaceDetailHeader in atomic/03-Spaces/organisms.
 *
 * @see Spaces Vertical Slice
 * @author HIVE Frontend Team
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export type MembershipState =
  | 'not_joined'
  | 'joined'
  | 'pending'
  | 'loading'
  | 'owner'
  | 'admin';

export interface SpaceHeaderProps {
  /** Space name */
  name: string;
  /** Space icon URL (optional, falls back to monogram) */
  iconUrl?: string;
  /** Whether space is verified */
  isVerified?: boolean;
  /** Total member count */
  memberCount: number;
  /** Currently online count (optional) */
  onlineCount?: number;
  /** Current user's membership state */
  membershipState: MembershipState;
  /** Join handler */
  onJoin?: () => void;
  /** Leave handler */
  onLeave?: () => void;
  /** Share handler */
  onShare?: () => void;
  /** Settings handler (leaders only) */
  onSettings?: () => void;
  /** Whether current user is a leader */
  isLeader?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// ICONS (Inline for self-containment)
// ============================================

const UsersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.59 13.51l6.83 3.98M8.59 6.51l6.83-3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.107-1.204-.165-.397-.505-.71-.93-.78l-.893-.15c-.543-.09-.94-.56-.94-1.109v-1.094c0-.55.397-1.02.94-1.11l.893-.149c.425-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.774-.773a1.125 1.125 0 011.449-.12l.738.527c.35.25.806.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn(className, 'animate-spin')}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.25} />
    <path d="M12 3a9 9 0 019 9" />
  </svg>
);

const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      clipRule="evenodd"
    />
  </svg>
);

// ============================================
// SUB-COMPONENTS
// ============================================

interface SpaceAvatarProps {
  name: string;
  iconUrl?: string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function SpaceAvatar({ name, iconUrl, isVerified, size = 'md' }: SpaceAvatarProps) {
  const monogram = name.charAt(0).toUpperCase() || 'H';

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          sizeClasses[size],
          'rounded-xl overflow-hidden',
          'border border-white/10',
          'bg-neutral-800'
        )}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800">
            <span className={cn('font-bold text-white', textSizes[size])}>{monogram}</span>
          </div>
        )}
      </div>

      {/* Verified badge */}
      <AnimatePresence>
        {isVerified && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -bottom-1 -right-1 bg-[var(--life-gold)] rounded-full p-0.5"
          >
            <VerifiedIcon className="w-3.5 h-3.5 text-black" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SpaceHeader({
  name,
  iconUrl,
  isVerified,
  memberCount,
  onlineCount,
  membershipState,
  onJoin,
  onLeave,
  onShare,
  onSettings,
  isLeader = false,
  className,
}: SpaceHeaderProps) {
  const isJoined = ['joined', 'owner', 'admin'].includes(membershipState);
  const isPending = membershipState === 'pending';
  const isLoading = membershipState === 'loading';
  const canJoin = membershipState === 'not_joined' && Boolean(onJoin);
  const canLeave = isJoined && Boolean(onLeave) && membershipState !== 'owner';

  const buttonLabel = (() => {
    switch (membershipState) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'joined':
        return 'Joined';
      case 'pending':
        return 'Pending';
      case 'loading':
        return 'Loading...';
      default:
        return 'Join';
    }
  })();

  return (
    <header
      className={cn(
        'flex items-center gap-4 p-4',
        'bg-[var(--bg-surface)]',
        'border-b border-white/[0.06]',
        className
      )}
    >
      {/* Avatar */}
      <SpaceAvatar name={name} iconUrl={iconUrl} isVerified={isVerified} size="md" />

      {/* Name + Stats */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white truncate">{name}</h1>

        <div className="flex items-center gap-3 mt-0.5">
          {/* Member count */}
          <span className="flex items-center gap-1 text-body-sm text-neutral-400">
            <UsersIcon className="w-3.5 h-3.5" />
            <span>{memberCount.toLocaleString()}</span>
          </span>

          {/* Online count */}
          {onlineCount !== undefined && onlineCount > 0 && (
            <span className="flex items-center gap-1 text-body-sm text-[var(--life-gold)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)] animate-pulse" />
              <span>{onlineCount} online</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className={cn(
              'p-2.5 rounded-lg',
              'text-neutral-400 hover:text-white',
              'hover:bg-white/[0.06]',
              'transition-colors duration-100'
            )}
            aria-label="Share space"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
        )}

        {/* Settings (leader only) */}
        {isLeader && onSettings && (
          <button
            onClick={onSettings}
            className={cn(
              'p-2.5 rounded-lg',
              'text-neutral-400 hover:text-white',
              'hover:bg-white/[0.06]',
              'transition-colors duration-100'
            )}
            aria-label="Space settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        )}

        {/* Join/Leave button */}
        <button
          onClick={isJoined ? onLeave : onJoin}
          disabled={isLoading || isPending || (!canJoin && !canLeave)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg',
            'text-body font-medium',
            'transition-all duration-150',
            // Not joined - gold CTA
            !isJoined && !isLoading && [
              'bg-[var(--life-gold)] text-black',
              'hover:brightness-110',
            ],
            // Joined - subtle outline
            isJoined && !isLoading && [
              'bg-transparent text-white',
              'border border-white/20',
              'hover:border-red-500/50 hover:text-red-400',
            ],
            // Pending - dimmed
            isPending && 'opacity-50 cursor-not-allowed',
            // Loading - keep visible with cursor change only
            isLoading && 'cursor-wait'
          )}
          aria-label={isJoined ? 'Leave this space' : 'Join this space'}
        >
          {isLoading ? (
            <LoaderIcon className="w-4 h-4" />
          ) : (
            <>
              {isJoined && <CheckIcon className="w-4 h-4" />}
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

// ============================================
// COMPACT VARIANT
// ============================================

export interface SpaceHeaderCompactProps {
  name: string;
  iconUrl?: string;
  isVerified?: boolean;
  memberCount?: number;
  onlineCount?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * SpaceHeaderCompact — Minimal space header for lists/navigation
 */
export function SpaceHeaderCompact({
  name,
  iconUrl,
  isVerified,
  memberCount,
  onlineCount,
  onClick,
  className,
}: SpaceHeaderCompactProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg',
        onClick && 'hover:bg-white/[0.04] transition-colors duration-100 w-full text-left',
        className
      )}
    >
      <SpaceAvatar name={name} iconUrl={iconUrl} isVerified={isVerified} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-white truncate">{name}</p>
        {(memberCount !== undefined || onlineCount !== undefined) && (
          <div className="flex items-center gap-2 text-label text-neutral-500">
            {memberCount !== undefined && <span>{memberCount.toLocaleString()} members</span>}
            {onlineCount !== undefined && onlineCount > 0 && (
              <span className="text-[var(--life-gold)]">{onlineCount} online</span>
            )}
          </div>
        )}
      </div>
    </Component>
  );
}

export default SpaceHeader;
