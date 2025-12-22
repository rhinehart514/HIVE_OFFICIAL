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
} from 'lucide-react';
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
      setTimeout(() => setShowCelebration(false), 1500);
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
                  'bg-gradient-to-br from-[#FFD700] to-[#FFD700]/70',
                  'text-black font-bold text-lg'
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
              className="absolute -bottom-0.5 -right-0.5 bg-[#FFD700] rounded-full p-0.5 shadow-lg shadow-[#FFD700]/30"
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse shadow-[0_0_6px_#FFD700]" />
                  <span>{onlineCount} online</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Share */}
          {onShare && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className={cn(
                'w-9 h-9 rounded-lg',
                'flex items-center justify-center',
                'text-[#6B6B70] hover:text-white',
                'hover:bg-white/[0.06]',
                'transition-colors duration-150'
              )}
              aria-label="Share space"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>
          )}

          {/* Settings (leader only) */}
          {isLeader && onSettings && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettings}
              className={cn(
                'w-9 h-9 rounded-lg',
                'flex items-center justify-center',
                'text-[#6B6B70] hover:text-[#FFD700]',
                'hover:bg-white/[0.06]',
                'transition-colors duration-150'
              )}
              aria-label="Space settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          )}

          {/* Join/Status Button */}
          <div className="relative">
            <motion.button
              whileHover={isJoinable ? { scale: 1.02 } : {}}
              whileTap={isJoinable ? { scale: 0.98 } : {}}
              onClick={isJoined ? onLeave : handleJoin}
              disabled={isLoading || isPending || (!isJoinable && !isLeavable)}
              className={cn(
                'h-9 px-4 rounded-lg',
                'flex items-center justify-center gap-2',
                'text-[14px] font-medium',
                'transition-all duration-200',
                // Not joined - gold CTA
                !isJoined &&
                  !isLoading && [
                    'bg-[#FFD700] hover:bg-[#E6C200]',
                    'text-black',
                    'shadow-[0_0_15px_rgba(255,215,0,0.20)]',
                    'hover:shadow-[0_0_20px_rgba(255,215,0,0.30)]',
                  ],
                // Joined states - subtle outline
                isJoined && [
                  'bg-transparent',
                  'border border-white/[0.10]',
                  'text-[#9A9A9F]',
                  'hover:border-red-500/30 hover:text-red-400',
                ],
                // Loading/Pending
                (isLoading || isPending) && 'opacity-60 cursor-not-allowed',
                // Disabled
                !isJoinable && !isLeavable && !isJoined && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={isJoined ? 'Leave space' : 'Join space'}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isJoined && !isLoading && <Check className="w-3.5 h-3.5" />}
              <span>{getButtonLabel()}</span>
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
                    'bg-[#FFD700]/20 rounded-lg',
                    'shadow-[0_0_30px_rgba(255,215,0,0.4)]'
                  )}
                >
                  <Check className="w-5 h-5 text-[#FFD700]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default PremiumHeader;
