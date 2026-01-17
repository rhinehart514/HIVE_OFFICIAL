'use client';

/**
 * SpaceHub - Orientation Archetype (Isomorphic Clone of Profile)
 *
 * Identity + Navigation + Action. No dashboards. No previews.
 *
 * Structure (exactly 3 blocks):
 * - Block 1: Identity (space icon, name, category, description)
 * - Block 2: Action (primary CTA)
 * - Block 3: Navigation (mode cards - chat, events, tools)
 *
 * @version 2.0.0 - Rebuilt as Orientation archetype
 */

import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Card, Button, Badge, Text } from '../../primitives';

// LOCKED: Premium easing from design system
const EASE = [0.22, 1, 0.36, 1] as const;

// Layer 3: Micro-motion - entrance only, subtle
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

export type SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members';

interface SpaceIdentity {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  iconUrl?: string;
  category?: string;
}

// Category accent colors (domain-based, not interest-based)
const CATEGORY_COLORS: Record<string, string> = {
  university: '#3B82F6',
  student_org: '#F59E0B',
  residential: '#10B981',
  greek: '#8B5CF6',
};

interface SpaceHubProps {
  space: SpaceIdentity;

  // Membership state
  isMember?: boolean;

  // Actions
  onModeChange: (mode: SpaceMode) => void;
  onJoin?: () => void;

  className?: string;
}

export function SpaceHub({
  space,
  isMember = true,
  onModeChange,
  onJoin,
  className,
}: SpaceHubProps) {
  const initials = space.name.charAt(0).toUpperCase();
  const categoryColor = CATEGORY_COLORS[space.category || ''] || CATEGORY_COLORS.student_org;

  return (
    <div className={cn('min-h-screen w-full overflow-y-auto relative', className)}>
      {/* Category accent line - domain-based color */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Layer 1: Spatial - generous vertical padding */}
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">

        {/* ============================================
            IDENTITY BLOCK
            Layer 1: Vertical dominance through spacing
            Layer 2: Tight tracking on name
            Layer 5: Icon signature treatment
            ============================================ */}
        <motion.section
          className="flex flex-col md:flex-row gap-10 mb-20"
          {...fadeIn(0)}
        >
          {/* Space Icon - Layer 5: Signature detail (inner glow + category accent) */}
          <div className="relative shrink-0 self-start">
            <div
              className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden"
              style={{
                boxShadow: `
                  0 0 0 2px ${categoryColor}40,
                  0 0 0 1px rgba(255,255,255,0.06),
                  0 24px 48px -12px rgba(0,0,0,0.5),
                  inset 0 1px 1px rgba(255,255,255,0.04)
                `,
              }}
            >
              {space.iconUrl ? (
                <img
                  src={space.iconUrl}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  }}
                >
                  <span className="text-4xl font-semibold text-white/30">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Identity Details - Layer 2: Typography enhancement */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Name - tight tracking, weight contrast */}
            <h1
              className="text-[28px] md:text-[32px] font-semibold text-white mb-1"
              style={{ letterSpacing: '-0.02em' }}
            >
              {space.name}
            </h1>

            {/* Category - softer contrast */}
            {space.category && (
              <p className="text-base text-white/40 mb-5">
                {space.category}
              </p>
            )}

            {/* Description - readable, secondary */}
            {space.description && (
              <p className="text-[15px] leading-relaxed text-white/60 max-w-md">
                {space.description}
              </p>
            )}
          </div>
        </motion.section>

        {/* ============================================
            ACTION BLOCK
            Layer 1: Spatial separation
            ============================================ */}
        <motion.section className="mb-16" {...fadeIn(0.08)}>
          {isMember ? (
            <Button
              variant="cta"
              size="lg"
              onClick={() => onModeChange('chat')}
            >
              Open Chat
            </Button>
          ) : (
            <Button
              variant="cta"
              size="lg"
              onClick={onJoin}
            >
              Join Space
            </Button>
          )}
        </motion.section>

        {/* ============================================
            NAVIGATION BLOCK
            Layer 4: Subtle surface separation
            ============================================ */}
        <motion.section {...fadeIn(0.12)}>
          {/* Layer 4: Faint background separation */}
          <div
            className="grid gap-3 md:grid-cols-3 p-4 -mx-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            {/* Chat */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('chat')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Chat
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Conversations
              </Text>
            </Card>

            {/* Events */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('events')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Events
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Upcoming
              </Text>
            </Card>

            {/* Tools */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('tools')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Tools
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Resources
              </Text>
            </Card>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

export type { SpaceIdentity, SpaceHubProps };
