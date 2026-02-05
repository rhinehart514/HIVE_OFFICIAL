'use client';

/**
 * SpaceHub - Orientation Archetype (Isomorphic Clone of Profile)
 *
 * Identity + Navigation + Action. Mode cards show REAL data to feel alive.
 *
 * Structure (exactly 3 blocks):
 * - Block 1: Identity (space icon, name, category, description, online count)
 * - Block 2: Action (primary CTA)
 * - Block 3: Navigation (mode cards with live data - chat, events, tools, members)
 *
 * @version 3.0.0 - GTM Launch Ready - Live data on mode cards
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import {
  Card,
  Button,
  Text,
  LiveDotOnly,
  ActivityHeartbeatStrip,
} from '../../primitives';
import { easingArrays } from '@hive/tokens';

// Layer 3: Micro-motion - entrance only, subtle
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: easingArrays.default },
});

export type SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members';

interface SpaceIdentity {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  iconUrl?: string;
  category?: string;
  /** Whether this space is unclaimed (pre-seeded, no owner) */
  isUnclaimed?: boolean;
  /** Whether this space has been verified as official */
  isVerified?: boolean;
}

// Category accent colors (domain-based, not interest-based)
const CATEGORY_COLORS: Record<string, string> = {
  university: '#3B82F6',
  student_org: '#F59E0B',
  residential: '#10B981',
  greek: '#8B5CF6',
};

// ============================================
// Community Stage (Cold Start Framing)
// ============================================

/**
 * Community lifecycle stage - reframe low counts as opportunity
 * - founding: < 10 members - "Founding Team" (gold accent, you're early!)
 * - growing: 10-50 members - "Growing" (momentum building)
 * - established: 50+ members - No label needed, numbers speak
 */
export type CommunityStage = 'founding' | 'growing' | 'established';

export function getCommunityStage(memberCount: number): CommunityStage {
  if (memberCount < 10) return 'founding';
  if (memberCount < 50) return 'growing';
  return 'established';
}

const STAGE_CONFIG: Record<CommunityStage, { label: string; color: string; description: string }> = {
  founding: {
    label: 'Founding Team',
    color: 'var(--color-accent-gold, #FFD700)',
    description: 'Join early, shape the community',
  },
  growing: {
    label: 'Growing',
    color: 'rgba(255, 255, 255, 0.6)',
    description: 'Momentum building',
  },
  established: {
    label: '',
    color: 'rgba(255, 255, 255, 0.5)',
    description: '',
  },
};

// ============================================
// Mode Card Data (for showing "alive" counts)
// ============================================

export interface ModeCardData {
  chat?: {
    /** Messages sent today */
    messagesToday?: number;
    /** Last message preview */
    lastMessagePreview?: string;
    /** Time since last message */
    lastMessageTime?: string;
    /** Number of users typing */
    typingCount?: number;
  };
  events?: {
    /** Upcoming event count */
    upcomingCount?: number;
    /** Next event title */
    nextEventTitle?: string;
    /** Next event date (formatted) */
    nextEventDate?: string;
    /** Total RSVP count for upcoming events */
    totalRsvps?: number;
  };
  tools?: {
    /** Total tool count */
    count?: number;
    /** Tools with high ratings */
    highlyRatedCount?: number;
    /** Most popular tool name */
    popularToolName?: string;
  };
  members?: {
    /** Total member count */
    count?: number;
    /** Currently online */
    onlineCount?: number;
  };
}

interface SpaceHubProps {
  space: SpaceIdentity;

  // Membership state
  isMember?: boolean;

  // Actions
  onModeChange: (mode: SpaceMode) => void;
  onJoin?: () => void;
  /** Called when user wants to claim as leader (for unclaimed spaces) */
  onClaimAsLeader?: () => void;

  // Live data for mode cards
  modeData?: ModeCardData;

  // Online presence
  onlineCount?: number;

  className?: string;
}

export function SpaceHub({
  space,
  isMember = true,
  onModeChange,
  onJoin,
  onClaimAsLeader,
  modeData,
  onlineCount,
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
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-heading-sm md:text-heading font-semibold text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                {space.name}
              </h1>
              {space.isVerified && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#3B82F6',
                  }}
                >
                  Verified
                </span>
              )}
              {space.isUnclaimed && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.12)',
                    color: 'var(--color-accent-gold, #FFD700)',
                  }}
                >
                  Unclaimed
                </span>
              )}
            </div>

            {/* Category - softer contrast */}
            {space.category && (
              <p className="text-base text-white/40 mb-5">
                {space.category}
              </p>
            )}

            {/* Description - readable, secondary */}
            {space.description && (
              <p className="text-body leading-relaxed text-white/60 max-w-md mb-4">
                {space.description}
              </p>
            )}

            {/* Online indicator - gold accent for live presence */}
            {onlineCount !== undefined && onlineCount > 0 && (
              <div className="flex items-center gap-2">
                <LiveDotOnly size="sm" animate glowIntensity="subtle" />
                <span className="text-sm text-white/50">
                  <span className="text-[var(--color-accent-gold,#FFD700)] font-medium">{onlineCount}</span>
                  {' '}online now
                </span>
              </div>
            )}
          </div>
        </motion.section>

        {/* ============================================
            ACTION BLOCK
            Layer 1: Spatial separation
            For unclaimed spaces: Show "Claim as Leader" + "Join"
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
          ) : space.isUnclaimed ? (
            <div className="flex flex-wrap gap-3">
              {onClaimAsLeader && (
                <Button
                  variant="cta"
                  size="lg"
                  onClick={onClaimAsLeader}
                >
                  Claim as Leader
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                onClick={onJoin}
              >
                Join as Member
              </Button>
            </div>
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
            Mode cards with REAL data to feel alive
            ============================================ */}
        <motion.section {...fadeIn(0.12)}>
          {/* Layer 4: Faint background separation */}
          <div
            className="grid gap-3 md:grid-cols-2 p-4 -mx-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            {/* Chat - shows messages today, last message, typing indicator */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('chat')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                    Chat
                  </span>
                  {modeData?.chat?.typingCount && modeData.chat.typingCount > 0 && (
                    <LiveDotOnly size="xs" animate glowIntensity="strong" />
                  )}
                </div>
                <span className="text-white/30">→</span>
              </div>
              {modeData?.chat?.messagesToday ? (
                <div className="space-y-1">
                  <Text size="sm" className="text-white/80">
                    {modeData.chat.messagesToday} message{modeData.chat.messagesToday !== 1 ? 's' : ''} today
                  </Text>
                  {modeData.chat.lastMessagePreview && (
                    <Text size="xs" className="text-white/40 line-clamp-1">
                      {modeData.chat.lastMessagePreview}
                    </Text>
                  )}
                </div>
              ) : (
                <Text size="sm" className="text-white/40 italic">
                  Be the first to say something
                </Text>
              )}
            </Card>

            {/* Events - shows upcoming count, next event */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('events')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Events
                </span>
                <span className="text-white/30">→</span>
              </div>
              {modeData?.events?.upcomingCount ? (
                <div className="space-y-1">
                  <Text size="sm" className="text-white/80">
                    {modeData.events.upcomingCount} upcoming
                  </Text>
                  {modeData.events.nextEventTitle && (
                    <Text size="xs" className="text-white/40 line-clamp-1">
                      {modeData.events.nextEventTitle}
                      {modeData.events.nextEventDate && ` · ${modeData.events.nextEventDate}`}
                    </Text>
                  )}
                </div>
              ) : (
                <Text size="sm" className="text-white/40 italic">
                  No events yet — create one?
                </Text>
              )}
            </Card>

            {/* Tools - shows count, highly rated */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('tools')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Tools
                </span>
                <span className="text-white/30">→</span>
              </div>
              {modeData?.tools?.count ? (
                <div className="space-y-1">
                  <Text size="sm" className="text-white/80">
                    {modeData.tools.count} tool{modeData.tools.count !== 1 ? 's' : ''}
                    {modeData.tools.highlyRatedCount ? `, ${modeData.tools.highlyRatedCount} highly rated` : ''}
                  </Text>
                  {modeData.tools.popularToolName && (
                    <Text size="xs" className="text-white/40 line-clamp-1">
                      Popular: {modeData.tools.popularToolName}
                    </Text>
                  )}
                </div>
              ) : (
                <Text size="sm" className="text-white/40 italic">
                  Build one in HiveLab?
                </Text>
              )}
            </Card>

            {/* Members - shows total with community stage framing */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => onModeChange('members')}
              className="text-left"
            >
              {(() => {
                const memberCount = modeData?.members?.count ?? 0;
                const stage = getCommunityStage(memberCount);
                const stageConfig = STAGE_CONFIG[stage];

                return (
                  <>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                          Members
                        </span>
                        {stage === 'founding' && (
                          <span
                            className="text-label-xs font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(255, 215, 0, 0.12)',
                              color: 'var(--color-accent-gold, #FFD700)',
                            }}
                          >
                            {stageConfig.label}
                          </span>
                        )}
                      </div>
                      <span className="text-white/30">→</span>
                    </div>
                    {memberCount > 0 ? (
                      <div className="space-y-1">
                        <Text size="sm" className="text-white/80">
                          {stage === 'founding' ? (
                            <>
                              <span style={{ color: stageConfig.color }}>{memberCount}</span>
                              {' '}founding member{memberCount !== 1 ? 's' : ''}
                            </>
                          ) : stage === 'growing' ? (
                            <>
                              {stageConfig.label} · {memberCount} member{memberCount !== 1 ? 's' : ''}
                            </>
                          ) : (
                            <>
                              {memberCount} member{memberCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </Text>
                        {modeData?.members?.onlineCount && modeData.members.onlineCount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <LiveDotOnly size="xs" animate glowIntensity="subtle" />
                            <Text size="xs" className="text-[var(--color-accent-gold,#FFD700)]">
                              {modeData.members.onlineCount} online now
                            </Text>
                          </div>
                        )}
                        {stage === 'founding' && (
                          <Text size="xs" className="text-white/40 italic">
                            {stageConfig.description}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Text size="sm" style={{ color: 'var(--color-accent-gold, #FFD700)' }}>
                          Be a founding member
                        </Text>
                        <Text size="xs" className="text-white/40 italic">
                          Shape this community from the start
                        </Text>
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

export type { SpaceIdentity, SpaceHubProps };
