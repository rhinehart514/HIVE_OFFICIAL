'use client';

/**
 * Life Indicators Laboratory
 *
 * Experiment: How does HIVE show "life" and presence?
 *
 * Testing divergent approaches for:
 * 1. PresenceDot breathing animation
 * 2. Warmth edge intensity
 * 3. Activity indication
 *
 * This is HIVE's signature - what makes it feel alive.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const meta: Meta = {
  title: 'Experiments/Life Indicators/PresenceDot',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// PRESENCE DOT APPROACHES
// =============================================================================

/**
 * APPROACH 1: SUBTLE BREATHE
 *
 * Philosophy: Life is quiet, constant.
 * - Very subtle opacity pulse (0.7 - 1.0)
 * - Slow 4s duration
 * - No scale, no glow
 * - Feels calm, always-on
 */
const SubtleBreatheDot: React.FC = () => (
  <motion.div
    className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]"
    animate={{
      opacity: [0.7, 1, 0.7],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

/**
 * APPROACH 2: RADIANT PULSE
 *
 * Philosophy: Presence should radiate.
 * - Expanding glow ring
 * - Solid core, ethereal edge
 * - 3s duration, overlapping rings
 * - Feels warm, inviting
 */
const RadiantPulseDot: React.FC = () => (
  <div className="relative">
    {/* Core dot - always solid */}
    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]" />
    {/* Radiating ring 1 */}
    <motion.div
      className="absolute inset-0 rounded-full border border-[var(--color-status-success)]"
      animate={{
        scale: [1, 2.5],
        opacity: [0.6, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
    {/* Radiating ring 2 - offset */}
    <motion.div
      className="absolute inset-0 rounded-full border border-[var(--color-status-success)]"
      animate={{
        scale: [1, 2.5],
        opacity: [0.6, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeOut',
        delay: 1,
      }}
    />
  </div>
);

/**
 * APPROACH 3: HEARTBEAT
 *
 * Philosophy: Presence has rhythm.
 * - Scale pulse like a heartbeat
 * - Quick double-beat pattern
 * - Glow expands with beat
 * - Feels alive, organic
 */
const HeartbeatDot: React.FC = () => (
  <motion.div
    className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]"
    animate={{
      scale: [1, 1.15, 1, 1.1, 1],
      boxShadow: [
        '0 0 0 0 rgba(52, 211, 153, 0.4)',
        '0 0 8px 2px rgba(52, 211, 153, 0.6)',
        '0 0 0 0 rgba(52, 211, 153, 0.4)',
        '0 0 6px 1px rgba(52, 211, 153, 0.5)',
        '0 0 0 0 rgba(52, 211, 153, 0.4)',
      ],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      times: [0, 0.15, 0.3, 0.45, 1],
      ease: 'easeInOut',
    }}
  />
);

/**
 * APPROACH 4: GOLD WARMTH
 *
 * Philosophy: HIVE's gold as life.
 * - Gold glow instead of green glow
 * - Green core, gold aura
 * - Ties into HIVE's warmth system
 * - Feels premium, distinct
 */
const GoldWarmthDot: React.FC = () => (
  <motion.div
    className="relative w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]"
    animate={{
      boxShadow: [
        '0 0 4px 0 rgba(255, 215, 0, 0.2)',
        '0 0 8px 2px rgba(255, 215, 0, 0.4)',
        '0 0 4px 0 rgba(255, 215, 0, 0.2)',
      ],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

/**
 * APPROACH 5: ETHEREAL GLOW
 *
 * Philosophy: Presence is ambient, not attention-seeking.
 * - Soft constant glow
 * - Blur-based outer ring
 * - Very subtle pulse
 * - Feels ambient, sophisticated
 */
const EtherealGlowDot: React.FC = () => (
  <div className="relative">
    {/* Outer glow - blurred */}
    <motion.div
      className="absolute -inset-1 rounded-full bg-[var(--color-status-success)] blur-[4px]"
      animate={{
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    {/* Core dot */}
    <div className="relative w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]" />
  </div>
);

// =============================================================================
// STATUS VARIANTS
// =============================================================================

const StatusDot: React.FC<{
  status: 'online' | 'away' | 'busy' | 'offline';
  approach: 'subtle' | 'radiant' | 'heartbeat' | 'gold' | 'ethereal';
}> = ({ status, approach }) => {
  const colors = {
    online: 'var(--color-status-success)',
    away: 'var(--color-accent-gold)',
    busy: 'var(--color-status-error)',
    offline: 'var(--color-text-muted)',
  };

  const color = colors[status];
  const isActive = status === 'online' || status === 'away';

  if (!isActive) {
    return (
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  }

  switch (approach) {
    case 'subtle':
      return (
        <motion.div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    case 'radiant':
      return (
        <div className="relative">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: color }}
            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>
      );
    case 'heartbeat':
      return (
        <motion.div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.15, 1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            times: [0, 0.15, 0.3, 0.45, 1],
          }}
        />
      );
    case 'gold':
      return (
        <motion.div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            boxShadow: [
              '0 0 4px 0 rgba(255, 215, 0, 0.2)',
              '0 0 8px 2px rgba(255, 215, 0, 0.4)',
              '0 0 4px 0 rgba(255, 215, 0, 0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    case 'ethereal':
      return (
        <div className="relative">
          <motion.div
            className="absolute -inset-1 rounded-full blur-[4px]"
            style={{ backgroundColor: color }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="relative w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      );
  }
};

// =============================================================================
// STORIES
// =============================================================================

/**
 * All 5 breathing approaches side-by-side.
 */
export const AllApproaches: Story = {
  render: () => (
    <div className="flex flex-col gap-12 p-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Presence Dot Breathing Experiment
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Watch each dot. Which feels most "alive" without being distracting?
        </p>
      </div>

      <div className="flex flex-wrap gap-12 justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 flex items-center justify-center">
            <SubtleBreatheDot />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Subtle Breathe
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Opacity pulse, 4s
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-12 flex items-center justify-center">
            <RadiantPulseDot />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Radiant Pulse
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Expanding rings
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-12 flex items-center justify-center">
            <HeartbeatDot />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Heartbeat
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Double-beat rhythm
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-12 flex items-center justify-center">
            <GoldWarmthDot />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Gold Warmth
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              HIVE gold aura
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="h-12 flex items-center justify-center">
            <EtherealGlowDot />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Ethereal Glow
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Soft ambient
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Duration comparison - same animation, different speeds.
 */
export const DurationComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Breathing Duration Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Testing: 2s vs 3s vs 4s vs 5s
          Which feels natural, not rushed or sluggish?
        </p>
      </div>

      <div className="flex gap-12 justify-center">
        {[2, 3, 4, 5].map((duration) => (
          <div key={duration} className="flex flex-col items-center gap-4">
            <div className="h-12 flex items-center justify-center">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-success)]"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {duration}s
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {duration === 2 && 'Quick'}
                {duration === 3 && 'Natural'}
                {duration === 4 && 'Relaxed'}
                {duration === 5 && 'Slow'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Status transitions - how statuses change.
 */
export const StatusTransitions: Story = {
  render: () => {
    const [status, setStatus] = React.useState<'online' | 'away' | 'busy' | 'offline'>('online');

    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Status Transitions
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            Click buttons to change status. Watch how smoothly colors morph.
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {(['online', 'away', 'busy', 'offline'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm capitalize',
                status === s
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Dot display */}
        <div className="flex gap-12 justify-center py-8">
          {(['subtle', 'radiant', 'heartbeat', 'gold', 'ethereal'] as const).map((approach) => (
            <div key={approach} className="flex flex-col items-center gap-4">
              <div className="h-12 flex items-center justify-center">
                <StatusDot status={status} approach={approach} />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">
                {approach}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * In context - presence in avatar, sidebar, chat.
 */
export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 max-w-md">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          In Context
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          How does the presence dot feel in real UI patterns?
        </p>
      </div>

      {/* Avatar with presence */}
      <div className="bg-[var(--color-bg-surface)] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Avatar
        </h3>
        <div className="flex gap-6">
          {/* Using Ethereal Glow */}
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <EtherealGlowDot />
            </div>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <GoldWarmthDot />
            </div>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <SubtleBreatheDot />
            </div>
          </div>
        </div>
      </div>

      {/* Member list item */}
      <div className="bg-[var(--color-bg-surface)] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Member List
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Sarah Chen', avatar: 'from-purple-500 to-blue-500' },
            { name: 'James Wilson', avatar: 'from-green-500 to-teal-500' },
            { name: 'Emily Davis', avatar: 'from-orange-500 to-red-500' },
          ].map((member) => (
            <div key={member.name} className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg bg-gradient-to-br',
                    member.avatar
                  )}
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <EtherealGlowDot />
                </div>
              </div>
              <span className="text-sm text-[var(--color-text-primary)]">
                {member.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Typing indicator context */}
      <div className="bg-[var(--color-bg-surface)] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Typing Indicator
        </h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <div className="flex gap-1">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </div>
          <span>Sarah is typing...</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Warmth edge experiment.
 */
export const WarmthEdges: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Warmth Edge Intensity
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Cards with different warmth levels. Higher activity = warmer edge.
          Testing: Low, Medium, High, Critical
        </p>
      </div>

      <div className="flex gap-6">
        {[
          { label: 'Low', intensity: 0.1 },
          { label: 'Medium', intensity: 0.3 },
          { label: 'High', intensity: 0.5 },
          { label: 'Critical', intensity: 0.8 },
        ].map(({ label, intensity }) => (
          <motion.div
            key={label}
            className="w-48 h-32 rounded-xl bg-[var(--color-bg-surface)] p-4 flex flex-col justify-between"
            animate={{
              boxShadow: [
                `inset 0 0 0 1px rgba(255, 215, 0, ${intensity * 0.5})`,
                `inset 0 0 0 1px rgba(255, 215, 0, ${intensity})`,
                `inset 0 0 0 1px rgba(255, 215, 0, ${intensity * 0.5})`,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {label} Activity
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Intensity: {Math.round(intensity * 100)}%
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Live counter animation.
 */
export const LiveCounter: Story = {
  render: () => {
    const [count, setCount] = React.useState(127);

    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Live Counter Animation
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            Click + or - to test number transitions.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <button
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
          >
            -
          </button>

          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-4xl font-semibold text-[var(--color-text-primary)] tabular-nums"
              >
                {count}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-[var(--color-text-muted)]">
              members online
            </span>
          </div>

          <button
            onClick={() => setCount((c) => c + 1)}
            className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
          >
            +
          </button>
        </div>
      </div>
    );
  },
};
