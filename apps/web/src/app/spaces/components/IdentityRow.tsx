'use client';

/**
 * IdentityRow — Three identity cards (Major, Home, Greek)
 *
 * Each card shows:
 * - Avatar with ring
 * - Category label
 * - Space name
 * - Online indicator
 * - Unread badge
 * - Hover reveals arrow
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import type { IdentityClaim } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface IdentityRowProps {
  majorSpace: IdentityClaim | null;
  homeSpace: IdentityClaim | null;
  greekSpace: IdentityClaim | null;
}

interface IdentityCardProps {
  type: 'major' | 'home' | 'greek';
  claim: IdentityClaim | null;
  index: number;
}

// ============================================================
// Constants
// ============================================================

const IDENTITY_CONFIG = {
  major: {
    label: 'Major',
    emptyText: 'Choose your major',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
    browseUrl: '/spaces/browse?category=major',
  },
  home: {
    label: 'Home',
    emptyText: 'Find your residence',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    browseUrl: '/spaces/browse?category=residential',
  },
  greek: {
    label: 'Greek',
    emptyText: 'Join your letters',
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    browseUrl: '/spaces/browse?category=greek',
  },
};

// ============================================================
// Identity Card
// ============================================================

function IdentityCard({ type, claim, index }: IdentityCardProps) {
  const router = useRouter();
  const config = IDENTITY_CONFIG[type];
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (claim) {
      router.push(`/s/${claim.spaceId}`);
    } else {
      router.push(config.browseUrl);
    }
  };

  // Mock online count (would come from presence API)
  const onlineCount = claim ? Math.floor(Math.random() * 30) + 5 : 0;
  const unreadCount = 0; // Would come from notifications

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex-1 rounded-2xl p-5 text-left overflow-hidden',
        'transition-all duration-300',
        'bg-gradient-to-br',
        config.gradient,
        'hover:scale-[1.01]'
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500',
          config.gradient,
          isHovered && 'opacity-100'
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Category label */}
        <span className={cn('text-[11px] font-medium uppercase tracking-wider mb-3', config.accent)}>
          {config.label}
        </span>

        {/* Middle: Avatar + Name */}
        <div className="flex items-center gap-3 flex-1">
          {claim ? (
            <>
              <Avatar size="default" className={cn('ring-2', config.ring)}>
                {claim.spaceAvatarUrl && <AvatarImage src={claim.spaceAvatarUrl} />}
                <AvatarFallback className="text-[13px] bg-white/[0.06]">
                  {getInitials(claim.spaceName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-white/90 truncate">
                  {claim.spaceName}
                </p>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-white/40 italic">
              {config.emptyText}
            </p>
          )}
        </div>

        {/* Bottom: Stats */}
        {claim && (
          <div className="flex items-center gap-3 mt-3">
            {/* Online indicator */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] text-white/30">
                {onlineCount} online
              </span>
            </div>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
        )}

        {/* Hover arrow */}
        <motion.div
          className="absolute bottom-5 right-5"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={18} className="text-white/40" />
        </motion.div>
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function IdentityRow({ majorSpace, homeSpace, greekSpace }: IdentityRowProps) {
  return (
    <div className="flex gap-4 shrink-0">
      <IdentityCard type="major" claim={majorSpace} index={0} />
      <IdentityCard type="home" claim={homeSpace} index={1} />
      <IdentityCard type="greek" claim={greekSpace} index={2} />
    </div>
  );
}
