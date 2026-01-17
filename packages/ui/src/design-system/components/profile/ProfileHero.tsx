'use client';

/**
 * ProfileHero - Tinder-inspired visual identity card
 *
 * Design Philosophy:
 * - Tinder: Full-bleed photo dominates, info overlaid via gradient
 * - Apple: Premium rounded corners (28px), subtle depth, SF-style typography
 * - HIVE: Gold as light (glow, border), 95% grayscale
 *
 * @version 5.0.0 - Tinder + Apple aesthetic fusion
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface ProfileHeroUser {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  classYear?: string;
  major?: string;
  campusName?: string;
}

export interface ProfileHeroPresence {
  isOnline: boolean;
  lastSeen?: Date;
}

export interface ProfileHeroBadges {
  streak?: number;
  isBuilder?: boolean;
  isLeader?: boolean;
}

export interface ProfileHeroProps {
  user: ProfileHeroUser;
  presence: ProfileHeroPresence;
  badges: ProfileHeroBadges;
  isOwnProfile: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onMore?: () => void;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileHero({
  user,
  presence,
  badges,
  isOwnProfile,
  onConnect,
  onMessage,
  onEdit,
  onMore,
  className,
}: ProfileHeroProps) {
  const initials = getInitials(user.fullName);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Build badge items
  const badgeItems: { icon: string; label: string }[] = [];
  if (badges.streak && badges.streak > 0) {
    badgeItems.push({ icon: '🔥', label: `${badges.streak}` });
  }
  if (badges.isBuilder) {
    badgeItems.push({ icon: '🛠️', label: 'Builder' });
  }
  if (badges.isLeader) {
    badgeItems.push({ icon: '👑', label: 'Leader' });
  }

  return (
    <motion.div
      className={cn('relative w-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card - Tinder-style full photo with overlay */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '28px',
          backgroundColor: 'var(--bg-elevated)',
          boxShadow: isHovered
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >
        {/* Photo Area - 16:10 aspect ratio for premium feel */}
        <div className="relative aspect-[16/10] sm:aspect-[16/8] overflow-hidden">
          {/* Background Image or Initials */}
          {user.avatarUrl ? (
            <>
              <motion.img
                src={user.avatarUrl}
                alt={user.fullName}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: imageLoaded ? 1 : 1.1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                onLoad={() => setImageLoaded(true)}
              />
              {/* Premium Ken Burns effect on hover */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{ scale: isHovered ? 1.02 : 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
              }}
            >
              <span
                className="text-7xl sm:text-8xl font-bold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {initials}
              </span>
            </div>
          )}

          {/* Gradient Overlay - Bottom fade for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)',
            }}
          />

          {/* Online Status - Top right corner pill */}
          <AnimatePresence>
            {presence.isOnline && (
              <motion.div
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                }}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--life-gold)' }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(255, 215, 0, 0.4)',
                      '0 0 0 4px rgba(255, 215, 0, 0)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--life-gold)' }}
                >
                  Online
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Overlay - Tinder-style bottom text */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            {/* Name + Badges Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                style={{
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {user.fullName}
              </h1>

              {/* Badges */}
              {badgeItems.map((badge, i) => (
                <motion.span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {badge.icon}
                  <span className="hidden sm:inline">{badge.label}</span>
                </motion.span>
              ))}
            </div>

            {/* Handle + Meta */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-base sm:text-lg"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                @{user.handle}
              </span>
              {user.major && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
                  <span
                    className="text-base"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {user.major}
                  </span>
                </>
              )}
              {user.classYear && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
                  <span
                    className="text-base"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    '{user.classYear.slice(-2)}
                  </span>
                </>
              )}
            </div>

            {/* Bio - Max 2 lines */}
            {user.bio && (
              <p
                className="text-sm sm:text-base mt-3 line-clamp-2 max-w-2xl"
                style={{ color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Action Bar - Apple-style bottom section */}
        <div
          className="flex items-center justify-between px-6 sm:px-8 py-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          {/* Campus Info */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {user.campusName || 'University at Buffalo'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <motion.button
                onClick={onEdit}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
                whileHover={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
              >
                Edit Profile
              </motion.button>
            ) : (
              <>
                {/* Connect - Primary action with gold accent */}
                <motion.button
                  onClick={onConnect}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: 'var(--life-gold)',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.15)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255, 215, 0, 0.15)',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.25)',
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Connect
                </motion.button>

                {/* Message - Secondary */}
                <motion.button
                  onClick={onMessage}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Message
                </motion.button>
              </>
            )}

            {/* More Menu */}
            <motion.button
              onClick={onMore}
              className="p-2 rounded-full transition-all"
              style={{
                color: 'var(--text-tertiary)',
                backgroundColor: 'transparent',
              }}
              whileHover={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
              }}
              whileTap={{ scale: 0.95 }}
              aria-label="More options"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileHero;
