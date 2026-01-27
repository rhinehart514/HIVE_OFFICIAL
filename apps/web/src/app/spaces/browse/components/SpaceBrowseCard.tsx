'use client';

/**
 * SpaceBrowseCard
 * Card component for browse results with emotional resonance
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  motion,
  MOTION,
} from '@hive/ui/design-system/primitives';

// Format last active timestamp to human-readable
function formatLastActive(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface SpaceBrowseCardProps {
  space: {
    id: string;
    name: string;
    slug?: string;
    handle?: string;
    description?: string;
    avatarUrl?: string;
    memberCount?: number;
    isMember?: boolean;
    isVerified?: boolean;
    category?: string;
    // Cold start signals
    upcomingEventCount?: number;
    nextEvent?: { title: string; startAt: string };
    mutualCount?: number;
    mutualAvatars?: string[];
    // CampusLabs imported metadata
    orgTypeName?: string;
    email?: string;
    source?: 'ublinked' | 'user-created';
    hasLeader?: boolean;
    // Card state signals
    isInvited?: boolean;
    isLocked?: boolean;
    lockReason?: string;
    onlineCount?: number;
    recentMessageCount?: number;
    lastActiveAt?: string;
  };
  index?: number;
  variant?: 'default' | 'featured';
  className?: string;
}

export function SpaceBrowseCard({
  space,
  index = 0,
  variant = 'default',
  className,
}: SpaceBrowseCardProps) {
  const router = useRouter();
  const handle = space.handle || space.slug || space.id;

  const isFeatured = variant === 'featured';
  const isLocked = space.isLocked;
  const isInvited = space.isInvited;
  const hasOnline = (space.onlineCount ?? 0) > 0;

  return (
    <motion.button
      onClick={() => !isLocked && router.push(`/s/${handle}`)}
      disabled={isLocked}
      className={cn(
        'group relative text-left w-full rounded-2xl overflow-hidden transition-all duration-300',
        isFeatured
          ? 'p-6 md:p-8'
          : 'p-4',
        isLocked && 'opacity-50 cursor-not-allowed',
        isInvited && 'border border-dashed border-white/20',
        space.isMember && 'ring-1 ring-[var(--life-gold)]/30',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: isInvited
          ? 'none'
          : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isLocked ? 0.5 : 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
      whileHover={!isLocked ? {
        scale: 1.01,
        transition: { duration: MOTION.duration.instant },
      } : undefined}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar
            size={isFeatured ? 'lg' : 'default'}
            className="ring-1 ring-white/[0.06] flex-shrink-0"
          >
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback className={cn(isFeatured ? 'text-lg' : 'text-sm')}>
              {getInitials(space.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-medium text-white/90 truncate',
                  isFeatured ? 'text-title-sm md:text-title' : 'text-body'
                )}
              >
                {space.name}
              </h3>
              {space.isVerified && (
                <span className="text-blue-400 text-label">✓</span>
              )}
            </div>

            {/* Org type badge - visible and prominent (P1.2) */}
            {space.orgTypeName && (
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-white/60 px-2 py-0.5 rounded-full bg-white/[0.06]">
                  {space.orgTypeName}
                </span>
              </div>
            )}

            {space.description && (
              <p
                className={cn(
                  'text-white/40 line-clamp-2 mt-1',
                  isFeatured ? 'text-body' : 'text-body-sm'
                )}
              >
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-4 text-label text-white/30">
          {/* Member count - show "Be the first" for empty spaces */}
          {(space.memberCount ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--life-gold)]/70">
              <Users size={12} />
              <span className="font-medium">Be the first to join</span>
            </div>
          )}

          {/* Upcoming event */}
          {space.nextEvent && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span className="truncate max-w-[120px]">{space.nextEvent.title}</span>
            </div>
          )}

          {/* Mutual friends indicator */}
          {space.mutualCount && space.mutualCount > 0 && (
            <div className="flex items-center gap-1.5">
              {space.mutualAvatars && space.mutualAvatars.length > 0 && (
                <div className="flex -space-x-1.5">
                  {space.mutualAvatars.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-4 h-4 rounded-full ring-1 ring-black"
                    />
                  ))}
                </div>
              )}
              <span>{space.mutualCount} friends</span>
            </div>
          )}

          {/* Contact email (P2.1) */}
          {space.email && (
            <a
              href={`mailto:${space.email}`}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={12} />
              <span>Contact</span>
            </a>
          )}

          {/* Last active - for quiet spaces without online members */}
          {!hasOnline && space.lastActiveAt && (
            <div className="flex items-center gap-1.5 text-white/20">
              <span>Last active: {formatLastActive(space.lastActiveAt)}</span>
            </div>
          )}
        </div>

        {/* Status badges - priority order */}
        {isLocked ? (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/[0.04] text-label-xs text-white/40 font-medium flex items-center gap-1.5">
            <Lock size={10} />
            {space.lockReason || 'Locked'}
          </div>
        ) : isInvited ? (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[var(--life-gold)]/10 text-label-xs text-[var(--life-gold)] font-medium">
            Invited
          </div>
        ) : space.isMember ? (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[var(--life-gold)]/10 text-label-xs text-[var(--life-gold)]/70 font-medium">
            Joined
          </div>
        ) : space.source === 'ublinked' && ((space.memberCount ?? 0) === 0 || space.hasLeader === false) ? (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-blue-500/10 text-xs text-blue-300 font-medium">
            Ready to claim
          </div>
        ) : null}

        {/* Online indicator - bottom right for active spaces */}
        {hasOnline && !isLocked && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-label-xs text-emerald-400/70">{space.onlineCount} online</span>
          </div>
        )}

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white/20 text-lg">→</span>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Featured card with gold border animation
 */
export function FeaturedSpaceCard({
  space,
  label,
  className,
}: SpaceBrowseCardProps & { label?: string }) {
  const router = useRouter();
  const handle = space.handle || space.slug || space.id;

  return (
    <motion.div
      className={cn('relative', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      {/* Gold border animation */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--life-gold)]/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: MOTION.duration.slow, delay: 0.2, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'left' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--life-gold)]/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: MOTION.duration.slow, delay: 0.3, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'right' }}
        />
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--life-gold)]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: MOTION.duration.slow, delay: 0.4, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'top' }}
        />
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--life-gold)]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: MOTION.duration.slow, delay: 0.5, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'bottom' }}
        />
      </div>

      {/* Content */}
      <motion.button
        onClick={() => router.push(`/s/${handle}`)}
        className="group relative w-full text-left p-6 md:p-8 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(201,162,39,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.base, delay: MOTION.duration.base, ease: MOTION.ease.premium }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Label */}
        {label && (
          <div className="mb-4">
            <span className="text-label-sm font-medium text-[var(--life-gold)]/60 uppercase tracking-wider">
              {label}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar size="xl" className="ring-2 ring-[var(--life-gold)]/20">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback className="text-xl bg-[var(--life-gold)]/10 text-[var(--life-gold)]">
              {getInitials(space.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-title-lg md:text-title-lg font-medium text-white/95 mb-2">
              {space.name}
            </h3>
            {space.description && (
              <p className="text-body text-white/40 line-clamp-2">
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-body-sm text-white/30">
          {(space.memberCount ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[var(--life-gold)]/70">
              <Users size={14} />
              <span className="font-medium">Be the first to join</span>
            </div>
          )}
          {space.nextEvent && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{space.nextEvent.title}</span>
            </div>
          )}
        </div>

        {/* Hover arrow */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[var(--life-gold)]/40 text-xl">→</span>
        </div>
      </motion.button>
    </motion.div>
  );
}
