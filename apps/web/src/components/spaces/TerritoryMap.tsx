'use client';

/**
 * TerritoryMap - Identity-based space navigation
 *
 * Shows four personalized quadrants:
 * - Your Major: Academic identity
 * - Your Interests: What you love
 * - Your Home: Where you live
 * - Your Community: Who you belong to
 *
 * Features:
 * - Scroll-triggered reveals (like /about page)
 * - Staggered entrance animations
 * - Premium easing
 * - Personalized content based on user identity
 */

import { motion, useInView } from '@hive/ui/design-system/primitives';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

// Premium easing (matches /about page)
const EASE = [0.22, 1, 0.36, 1] as const;

interface UserIdentity {
  major?: string;
  majorSpaceId?: string;
  majorSpaceUnlocked?: boolean;
  homeSpaceId?: string;
  residenceType?: 'on-campus' | 'off-campus' | 'commuter';
  interests: string[];
  communitySpaceIds: string[];
}

interface TerritoryMapProps {
  userIdentity: UserIdentity;
  onQuadrantClick: (type: 'major' | 'interests' | 'home' | 'community') => void;
}

const quadrants = [
  {
    id: 'major' as const,
    emoji: '📚',
    title: 'YOUR MAJOR',
    color: 'from-blue-500/10 to-purple-500/10',
    borderColor: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-500/40',
  },
  {
    id: 'interests' as const,
    emoji: '⚡',
    title: 'YOUR INTERESTS',
    color: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/40',
  },
  {
    id: 'home' as const,
    emoji: '🏠',
    title: 'YOUR HOME',
    color: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    hoverBorder: 'hover:border-green-500/40',
  },
  {
    id: 'community' as const,
    emoji: '🤝',
    title: 'YOUR COMMUNITY',
    color: 'from-pink-500/10 to-rose-500/10',
    borderColor: 'border-pink-500/20',
    hoverBorder: 'hover:border-pink-500/40',
  },
];

export function TerritoryMap({ userIdentity, onQuadrantClick }: TerritoryMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-8"
      >
        <h2
          className="text-[28px] font-semibold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your Territory
        </h2>
        <p className="text-[15px] text-white/50">
          Spaces tailored to who you are
        </p>
      </motion.div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((quadrant, index) => (
          <motion.button
            key={quadrant.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isInView
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.95 }
            }
            transition={{
              duration: 0.5,
              ease: EASE,
              delay: index * 0.15, // Staggered entrance
            }}
            onClick={() => onQuadrantClick(quadrant.id)}
            className={cn(
              'group relative overflow-hidden',
              'h-48 rounded-2xl border transition-all duration-300',
              'bg-gradient-to-br',
              quadrant.color,
              quadrant.borderColor,
              quadrant.hoverBorder,
              'hover:scale-[1.02]'
            )}
          >
            {/* Content */}
            <div className="relative z-10 h-full p-6 flex flex-col">
              {/* Icon */}
              <motion.div
                className="text-[40px] mb-3"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {quadrant.emoji}
              </motion.div>

              {/* Title */}
              <div className="flex-1">
                <h3 className="text-[11px] font-semibold tracking-wider text-white/40 mb-2">
                  {quadrant.title}
                </h3>

                {/* Quadrant-specific content */}
                {quadrant.id === 'major' && (
                  <div className="space-y-1">
                    <p className="text-[16px] font-medium text-white">
                      {userIdentity.major || 'Set your major'}
                    </p>
                    {userIdentity.majorSpaceUnlocked ? (
                      <p className="text-[12px] text-green-400/80">✓ Active</p>
                    ) : (
                      <p className="text-[12px] text-white/40">Coming Soon</p>
                    )}
                  </div>
                )}

                {quadrant.id === 'interests' && (
                  <div className="space-y-1">
                    {userIdentity.interests.length > 0 ? (
                      <p className="text-[14px] text-white/80">
                        {userIdentity.interests.join(', ')}
                      </p>
                    ) : (
                      <p className="text-[14px] text-white/50">
                        Add your interests
                      </p>
                    )}
                  </div>
                )}

                {quadrant.id === 'home' && (
                  <div className="space-y-1">
                    {userIdentity.homeSpaceId ? (
                      <p className="text-[14px] text-white/80">
                        {userIdentity.residenceType === 'on-campus'
                          ? 'On Campus'
                          : userIdentity.residenceType === 'off-campus'
                          ? 'Off Campus'
                          : 'Commuter'}
                      </p>
                    ) : (
                      <p className="text-[14px] text-white/50">
                        Add your residence
                      </p>
                    )}
                  </div>
                )}

                {quadrant.id === 'community' && (
                  <div className="space-y-1">
                    <p className="text-[14px] text-white/80">
                      {userIdentity.communitySpaceIds.length > 0
                        ? `${userIdentity.communitySpaceIds.length} communities`
                        : 'Join communities'}
                    </p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-[12px] text-white/50 group-hover:text-white/80 transition-colors">
                <span>Explore</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path
                    d="M2 6H10M10 6L6 2M10 6L6 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
