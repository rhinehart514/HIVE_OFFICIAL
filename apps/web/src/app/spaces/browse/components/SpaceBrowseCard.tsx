'use client';

/**
 * SpaceBrowseCard
 * Card component for browse results with emotional resonance
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  motion,
  MOTION,
} from '@hive/ui/design-system/primitives';

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

  return (
    <motion.button
      onClick={() => router.push(`/s/${handle}`)}
      className={cn(
        'group relative text-left w-full rounded-2xl overflow-hidden transition-all duration-300',
        isFeatured
          ? 'p-6 md:p-8'
          : 'p-4',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.03,
        ease: MOTION.ease.premium,
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
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
                  isFeatured ? 'text-[18px] md:text-[20px]' : 'text-[15px]'
                )}
              >
                {space.name}
              </h3>
              {space.isVerified && (
                <span className="text-blue-400 text-[12px]">✓</span>
              )}
            </div>

            {space.description && (
              <p
                className={cn(
                  'text-white/40 line-clamp-2 mt-1',
                  isFeatured ? 'text-[14px]' : 'text-[13px]'
                )}
              >
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-4 text-[12px] text-white/30">
          {/* Member count */}
          {(space.memberCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              <span>{space.memberCount} members</span>
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
                      className="w-4 h-4 rounded-full ring-1 ring-[#0A0A0A]"
                    />
                  ))}
                </div>
              )}
              <span>{space.mutualCount} friends</span>
            </div>
          )}
        </div>

        {/* Member badge */}
        {space.isMember && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-white/40 font-medium">
            Joined
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
      transition={{ duration: 0.6, ease: MOTION.ease.premium }}
    >
      {/* Gold border animation */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold,#C9A227)]/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'left' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold,#C9A227)]/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'right' }}
        />
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--color-gold,#C9A227)]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: MOTION.ease.premium }}
          style={{ transformOrigin: 'top' }}
        />
        <motion.div
          className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--color-gold,#C9A227)]/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
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
        transition={{ duration: 0.5, delay: 0.6, ease: MOTION.ease.premium }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Label */}
        {label && (
          <div className="mb-4">
            <span className="text-[11px] font-medium text-[var(--color-gold,#C9A227)]/60 uppercase tracking-wider">
              {label}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar size="xl" className="ring-2 ring-[var(--color-gold,#C9A227)]/20">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback className="text-xl bg-[var(--color-gold,#C9A227)]/10 text-[var(--color-gold,#C9A227)]">
              {getInitials(space.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-[22px] md:text-[26px] font-medium text-white/95 mb-2">
              {space.name}
            </h3>
            {space.description && (
              <p className="text-[14px] text-white/40 line-clamp-2">
                {space.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[13px] text-white/30">
          {(space.memberCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{space.memberCount} members</span>
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
          <span className="text-[var(--color-gold,#C9A227)]/40 text-xl">→</span>
        </div>
      </motion.button>
    </motion.div>
  );
}
