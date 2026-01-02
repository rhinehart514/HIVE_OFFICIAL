'use client';

/**
 * PremiumHeader - ChatGPT-style minimal space header
 *
 * Design Philosophy:
 * - Minimal chrome - content is king
 * - Glass morphism for floating feel
 * - Compact but breathable (not cramped)
 * - Gold accents for key moments
 * - Space info at a glance, actions accessible
 *
 * Inspired by: ChatGPT sidebar, Linear project headers, Superhuman
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Users,
  Check,
  Loader2,
  Share2,
  Settings,
  BadgeCheck,
  ChevronDown,
  Hash,
  Info,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../00-Global/molecules/dropdown-menu';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

// ============================================================
// Types
// ============================================================

export type MembershipState =
  | 'not_joined'
  | 'joined'
  | 'pending'
  | 'loading'
  | 'owner'
  | 'admin';

export interface PremiumHeaderProps {
  /** Space data */
  space: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    category?: string;
    isVerified?: boolean;
    memberCount: number;
    onlineCount?: number;
  };
  /** Current membership state */
  membershipState: MembershipState;
  /** Is current user a leader? */
  isLeader?: boolean;
  /** Current board name (if viewing a board) */
  currentBoardName?: string;

  // Callbacks
  onJoin?: () => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
  onShare?: () => void;
  onSettings?: () => void;
  onSpaceMenuOpen?: () => void;
  /** Opens the context panel with space info, events, members, tools */
  onInfo?: () => void;

  /** Additional className */
  className?: string;
}

// ============================================================
// Motion Variants
// ============================================================

const headerVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
};

const celebrationVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: [0.8, 1.1, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      times: [0, 0.5, 1],
    },
  },
  exit: { scale: 0.9, opacity: 0 },
};

// ============================================================
// Component
// ============================================================

export function PremiumHeader({
  space,
  membershipState,
  isLeader = false,
  currentBoardName,
  onJoin,
  onLeave,
  onShare,
  onSettings,
  onSpaceMenuOpen,
  onInfo,
  className,
}: PremiumHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [isJoinLoading, setIsJoinLoading] = React.useState(false);

  const { name, iconUrl, isVerified, memberCount, onlineCount, category } = space;

  const isJoined = ['joined', 'owner', 'admin'].includes(membershipState);
  const isPending = membershipState === 'pending';
  const isLoading = membershipState === 'loading' || isJoinLoading;
  const isJoinable = membershipState === 'not_joined' && Boolean(onJoin);
  const isLeavable = isJoined && Boolean(onLeave) && membershipState !== 'owner';

  const getButtonLabel = () => {
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
        return 'Loading';
      default:
        return 'Join';
    }
  };

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsJoinLoading(true);
    try {
      await onJoin();
      setShowCelebration(true);
      // Reduced from 1500ms to 500ms - enough to acknowledge, not block
      setTimeout(() => setShowCelebration(false), 500);
    } finally {
      setIsJoinLoading(false);
    }
  };

  return (
    <motion.header
      variants={shouldReduceMotion ? {} : headerVariants}
      initial="initial"
      animate="animate"
      transition={premium.motion.spring.default}
      className={cn(
        // Glass morphism
        'relative',
        'bg-[rgba(10,10,10,0.80)]',
        'backdrop-blur-[20px]',
        'border-b border-white/[0.06]',
        // Layout
        'px-5 py-3',
        className
      )}
    >
      <div className="flex items-center gap-4 max-w-full">
        {/* Space Avatar */}
        <button
          onClick={onSpaceMenuOpen}
          className={cn(
            'flex-shrink-0 relative group',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-xl'
          )}
          aria-label="Open space menu"
        >
          <Avatar className="w-11 h-11 ring-2 ring-white/[0.08] group-hover:ring-white/[0.15] transition-all duration-150">
            {iconUrl ? (
              <AvatarImage src={iconUrl} alt={name} />
            ) : (
              <AvatarFallback
                className={cn(
                  'bg-gradient-to-br from-white/[0.12] to-white/[0.04]',
                  'text-white font-bold text-lg'
                )}
              >
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Verified badge */}
          {isVerified && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={premium.motion.spring.bouncy}
              className="absolute -bottom-0.5 -right-0.5 bg-[#FFD700] rounded-full p-0.5"
            >
              <BadgeCheck className="w-3 h-3 text-black" />
            </motion.div>
          )}
        </button>

        {/* Space Info */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <button
            onClick={onSpaceMenuOpen}
            className={cn(
              'flex items-center gap-2 group',
              'focus:outline-none'
            )}
          >
            <h1 className="text-[17px] font-semibold text-[#FAFAFA] truncate group-hover:text-white transition-colors">
              {name}
            </h1>
            <ChevronDown className="w-4 h-4 text-[#6B6B70] group-hover:text-[#9A9A9F] transition-colors flex-shrink-0" />
          </button>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-0.5">
            {/* Board indicator */}
            {currentBoardName && (
              <>
                <span className="flex items-center gap-1 text-[13px] text-[#9A9A9F]">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{currentBoardName}</span>
                </span>
                <span className="text-[#4A4A4F]">•</span>
              </>
            )}

            {/* Member count */}
            <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B70]">
              <Users className="w-3.5 h-3.5" />
              <span>{memberCount.toLocaleString()}</span>
            </span>

            {/* Online count */}
            {onlineCount !== undefined && onlineCount > 0 && (
              <>
                <span className="text-[#4A4A4F]">•</span>
                <span className="flex items-center gap-1.5 text-[13px] text-[#FFD700]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                  <span>{onlineCount} online</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions - Simplified hierarchy: One primary action + overflow menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Primary Action - Contextual by role */}

          {/* Non-members: Gold Join CTA */}
          {!isJoined && (
            <div className="relative">
              <motion.button
                whileHover={isJoinable && !isLoading ? { scale: 1.02 } : {}}
                whileTap={isJoinable && !isLoading ? { scale: 0.98 } : {}}
                onClick={handleJoin}
                disabled={isLoading || isPending || !isJoinable}
                className={cn(
                  'h-9 px-5 rounded-lg',
                  'flex items-center justify-center gap-2',
                  'text-[14px] font-medium',
                  'transition-all duration-200',
                  'bg-[#FFD700] hover:bg-[#E6C200]',
                  'text-black',
                  (isLoading || isPending) && 'opacity-60 cursor-not-allowed'
                )}
                aria-label="Join space"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>{isLoading ? 'Joining...' : 'Join'}</span>
              </motion.button>

              {/* Join celebration */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    variants={celebrationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      'absolute inset-0 pointer-events-none',
                      'flex items-center justify-center',
                      'bg-[#FFD700]/20 rounded-lg'
                    )}
                  >
                    <Check className="w-5 h-5 text-[#FFD700]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Members (non-leaders): Online count button → opens context panel */}
          {isJoined && !isLeader && onInfo && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onInfo}
              className={cn(
                'h-9 px-3 rounded-lg',
                'flex items-center justify-center gap-2',
                'text-[13px] font-medium',
                'transition-all duration-200',
                'bg-white/[0.04] hover:bg-white/[0.08]',
                'border border-white/[0.06]',
                onlineCount && onlineCount > 0 ? 'text-[#FFD700]' : 'text-[#9A9A9F]'
              )}
              aria-label="View space info"
            >
              {onlineCount !== undefined && onlineCount > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                  <span>{onlineCount} online</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>{memberCount.toLocaleString()}</span>
                </>
              )}
            </motion.button>
          )}

          {/* Leaders: Settings button as primary */}
          {isLeader && onSettings && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettings}
              className={cn(
                'w-9 h-9 rounded-lg',
                'flex items-center justify-center',
                'text-[#9A9A9F] hover:text-white',
                'bg-white/[0.04] hover:bg-white/[0.08]',
                'border border-white/[0.06]',
                'transition-colors duration-150'
              )}
              aria-label="Space settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          )}

          {/* Overflow Menu - Secondary actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-9 h-9 rounded-lg',
                  'flex items-center justify-center',
                  'text-[#6B6B70] hover:text-white',
                  'hover:bg-white/[0.06]',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#141414] border border-white/[0.08] rounded-lg shadow-xl"
            >
              {/* Share */}
              {onShare && (
                <DropdownMenuItem
                  onClick={onShare}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#FAFAFA] hover:bg-white/[0.06] cursor-pointer rounded-md"
                >
                  <Share2 className="w-4 h-4 text-[#6B6B70]" />
                  Share space
                </DropdownMenuItem>
              )}

              {/* Space info */}
              {onInfo && (
                <DropdownMenuItem
                  onClick={onInfo}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#FAFAFA] hover:bg-white/[0.06] cursor-pointer rounded-md"
                >
                  <Info className="w-4 h-4 text-[#6B6B70]" />
                  Space info
                </DropdownMenuItem>
              )}

              {/* Settings (for members, leaders already have button) */}
              {!isLeader && isJoined && onSettings && (
                <DropdownMenuItem
                  onClick={onSettings}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#FAFAFA] hover:bg-white/[0.06] cursor-pointer rounded-md"
                >
                  <Settings className="w-4 h-4 text-[#6B6B70]" />
                  Settings
                </DropdownMenuItem>
              )}

              {/* Leave space (for members only, not owners) */}
              {isLeavable && (
                <>
                  <DropdownMenuSeparator className="bg-white/[0.06]" />
                  <DropdownMenuItem
                    onClick={onLeave}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 cursor-pointer rounded-md"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave space
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}

export default PremiumHeader;
