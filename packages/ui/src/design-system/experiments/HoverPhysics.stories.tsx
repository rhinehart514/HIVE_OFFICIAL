'use client';

/**
 * Hover Physics Laboratory
 *
 * Experiment: What makes a button feel premium?
 *
 * Testing 5 divergent approaches:
 * 1. MINIMAL - Apple-style subtle elevation
 * 2. CONFIDENT - Linear-style transform with shadow
 * 3. TACTILE - Physical press simulation with spring
 * 4. LUMINOUS - Vercel-style glow and light
 * 5. ATMOSPHERIC - HIVE signature warmth edge
 *
 * Each approach is dramatically different to find the right feel.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const meta: Meta = {
  title: 'Experiments/Hover Physics/Button',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// SHARED BASE STYLES
// =============================================================================

const baseButton = cn(
  'inline-flex items-center justify-center',
  'h-11 px-6',
  'font-medium text-sm',
  'rounded-lg',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
  'disabled:pointer-events-none disabled:opacity-50'
);

// =============================================================================
// APPROACH 1: MINIMAL (Apple-style)
// =============================================================================

/**
 * MINIMAL
 *
 * Philosophy: Less is more. Trust the content.
 * - No scale transform (feels cheap at Apple's level)
 * - Only opacity shift on hover
 * - Subtle shadow depth change
 * - 200ms duration with ease-out
 *
 * Inspiration: Apple.com buttons, macOS controls
 */
const MinimalButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta';
}> = ({ children, variant = 'default' }) => (
  <button
    className={cn(
      baseButton,
      'transition-all duration-200 ease-out',
      variant === 'cta'
        ? [
            'bg-[var(--color-accent-gold)]',
            'text-[var(--color-bg-page)]',
            'hover:opacity-90',
            'active:opacity-80',
          ].join(' ')
        : [
            'bg-[var(--color-text-primary)]',
            'text-[var(--color-bg-page)]',
            'hover:opacity-90',
            'active:opacity-80',
          ].join(' ')
    )}
  >
    {children}
  </button>
);

// =============================================================================
// APPROACH 2: CONFIDENT (Linear-style)
// =============================================================================

/**
 * CONFIDENT
 *
 * Philosophy: Assertive micro-movement creates confidence.
 * - Subtle scale 1.02 on hover
 * - Shadow expands on hover
 * - Fast 150ms with custom ease
 * - Scale 0.98 on press
 *
 * Inspiration: Linear.app, Stripe dashboard buttons
 */
const ConfidentButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta';
}> = ({ children, variant = 'default' }) => (
  <button
    className={cn(
      baseButton,
      'transition-all duration-150',
      '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      variant === 'cta'
        ? [
            'bg-[var(--color-accent-gold)]',
            'text-[var(--color-bg-page)]',
            'shadow-sm',
            'hover:shadow-lg hover:shadow-[rgba(255,215,0,0.15)]',
          ].join(' ')
        : [
            'bg-[var(--color-text-primary)]',
            'text-[var(--color-bg-page)]',
            'shadow-sm',
            'hover:shadow-lg hover:shadow-white/10',
          ].join(' ')
    )}
  >
    {children}
  </button>
);

// =============================================================================
// APPROACH 3: TACTILE (Physical simulation)
// =============================================================================

/**
 * TACTILE
 *
 * Philosophy: Digital should feel physical.
 * - Framer Motion spring physics
 * - Lift on hover (translateY -2px)
 * - Depth via layered shadows
 * - Bounce on press with spring
 *
 * Inspiration: iOS buttons, Figma hover states
 */
const TactileButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta';
}> = ({ children, variant = 'default' }) => (
  <motion.button
    className={cn(
      baseButton,
      variant === 'cta'
        ? [
            'bg-[var(--color-accent-gold)]',
            'text-[var(--color-bg-page)]',
          ].join(' ')
        : [
            'bg-[var(--color-text-primary)]',
            'text-[var(--color-bg-page)]',
          ].join(' ')
    )}
    whileHover={{
      y: -2,
      boxShadow:
        variant === 'cta'
          ? '0 8px 30px rgba(255, 215, 0, 0.2)'
          : '0 8px 30px rgba(255, 255, 255, 0.1)',
    }}
    whileTap={{
      scale: 0.97,
      y: 0,
    }}
    transition={{
      type: 'spring',
      stiffness: 400,
      damping: 25,
    }}
  >
    {children}
  </motion.button>
);

// =============================================================================
// APPROACH 4: LUMINOUS (Vercel-style)
// =============================================================================

/**
 * LUMINOUS
 *
 * Philosophy: Light as feedback.
 * - Outer glow expands on hover
 * - Inner brightness increases
 * - Gradient shift for CTA
 * - 300ms smooth transition
 *
 * Inspiration: Vercel, Raycast, modern SaaS
 */
const LuminousButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta';
}> = ({ children, variant = 'default' }) => (
  <button
    className={cn(
      baseButton,
      'relative overflow-hidden',
      'transition-all duration-300',
      '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
      variant === 'cta'
        ? [
            'bg-gradient-to-r from-[var(--color-accent-gold)] to-[#FFC700]',
            'text-[var(--color-bg-page)]',
            'shadow-[0_0_0_1px_rgba(255,215,0,0.3)]',
            'hover:shadow-[0_0_30px_rgba(255,215,0,0.4),0_0_0_1px_rgba(255,215,0,0.5)]',
            'hover:brightness-110',
            'active:brightness-95',
          ].join(' ')
        : [
            'bg-[var(--color-text-primary)]',
            'text-[var(--color-bg-page)]',
            'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]',
            'hover:shadow-[0_0_20px_rgba(255,255,255,0.15),0_0_0_1px_rgba(255,255,255,0.2)]',
            'hover:brightness-110',
            'active:brightness-95',
          ].join(' ')
    )}
  >
    {/* Shimmer effect on hover */}
    <span
      className={cn(
        'absolute inset-0 opacity-0 hover:opacity-100',
        'bg-gradient-to-r from-transparent via-white/10 to-transparent',
        'translate-x-[-100%] hover:translate-x-[100%]',
        'transition-all duration-700'
      )}
    />
    <span className="relative z-10">{children}</span>
  </button>
);

// =============================================================================
// APPROACH 5: ATMOSPHERIC (HIVE signature)
// =============================================================================

/**
 * ATMOSPHERIC
 *
 * Philosophy: Warmth as interaction language.
 * - Edge glow intensifies on hover (HIVE warmth system)
 * - Gold edge for CTA, white edge for default
 * - Subtle scale + Y translation combo
 * - Breathing pulse on active CTA
 *
 * Inspiration: HIVE design language, activity edges
 */
const AtmosphericButton: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'cta';
}> = ({ children, variant = 'default' }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      className={cn(
        baseButton,
        'relative',
        variant === 'cta'
          ? [
              'bg-[var(--color-accent-gold)]',
              'text-[var(--color-bg-page)]',
            ].join(' ')
          : [
              'bg-[var(--color-text-primary)]',
              'text-[var(--color-bg-page)]',
            ].join(' ')
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -1 : 0,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      style={{
        boxShadow: isHovered
          ? variant === 'cta'
            ? 'inset 0 0 0 1px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.3)'
            : 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 15px rgba(255, 255, 255, 0.1)'
          : 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {children}
    </motion.button>
  );
};

// =============================================================================
// STORIES
// =============================================================================

/**
 * Side-by-side comparison of all 5 approaches.
 * Hover each button to feel the difference.
 */
export const AllApproaches: Story = {
  render: () => (
    <div className="flex flex-col gap-12 p-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Hover Physics Experiment
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Hover each button. Which feels most premium?
        </p>
      </div>

      {/* Default Buttons */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Default Variant
        </h3>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <MinimalButton>Minimal</MinimalButton>
            <span className="text-xs text-[var(--color-text-muted)]">Apple</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ConfidentButton>Confident</ConfidentButton>
            <span className="text-xs text-[var(--color-text-muted)]">Linear</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TactileButton>Tactile</TactileButton>
            <span className="text-xs text-[var(--color-text-muted)]">iOS/Figma</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LuminousButton>Luminous</LuminousButton>
            <span className="text-xs text-[var(--color-text-muted)]">Vercel</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AtmosphericButton>Atmospheric</AtmosphericButton>
            <span className="text-xs text-[var(--color-text-muted)]">HIVE</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          CTA Variant (Gold)
        </h3>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <MinimalButton variant="cta">Minimal</MinimalButton>
            <span className="text-xs text-[var(--color-text-muted)]">Apple</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ConfidentButton variant="cta">Confident</ConfidentButton>
            <span className="text-xs text-[var(--color-text-muted)]">Linear</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TactileButton variant="cta">Tactile</TactileButton>
            <span className="text-xs text-[var(--color-text-muted)]">iOS/Figma</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LuminousButton variant="cta">Luminous</LuminousButton>
            <span className="text-xs text-[var(--color-text-muted)]">Vercel</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AtmosphericButton variant="cta">Atmospheric</AtmosphericButton>
            <span className="text-xs text-[var(--color-text-muted)]">HIVE</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * MINIMAL - Apple-style
 * Pure opacity, no scale, trust the content.
 */
export const Minimal: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Approach 1: MINIMAL
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Apple-style. Only opacity changes. No scale, no shadows.
          The content IS the button. Less is more.
        </p>
      </div>
      <div className="flex gap-4">
        <MinimalButton>Continue</MinimalButton>
        <MinimalButton variant="cta">Enter HIVE</MinimalButton>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>Hover: opacity 90%</p>
        <p>Press: opacity 80%</p>
        <p>Duration: 200ms ease-out</p>
      </div>
    </div>
  ),
};

/**
 * CONFIDENT - Linear-style
 * Scale transform with shadow expansion.
 */
export const Confident: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Approach 2: CONFIDENT
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Linear-style. Subtle scale (1.02) with shadow expansion.
          Assertive micro-movement creates confidence.
        </p>
      </div>
      <div className="flex gap-4">
        <ConfidentButton>Continue</ConfidentButton>
        <ConfidentButton variant="cta">Enter HIVE</ConfidentButton>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>Hover: scale 1.02, shadow expands</p>
        <p>Press: scale 0.98</p>
        <p>Duration: 150ms cubic-bezier(0.22, 1, 0.36, 1)</p>
      </div>
    </div>
  ),
};

/**
 * TACTILE - Physical simulation
 * Spring physics with Y-translation.
 */
export const Tactile: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Approach 3: TACTILE
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          iOS/Figma-style. Spring physics with lift (-2px Y).
          Digital should feel physical. Bounce on press.
        </p>
      </div>
      <div className="flex gap-4">
        <TactileButton>Continue</TactileButton>
        <TactileButton variant="cta">Enter HIVE</TactileButton>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>Hover: Y -2px, shadow expands</p>
        <p>Press: scale 0.97, Y 0, spring bounce</p>
        <p>Spring: stiffness 400, damping 25</p>
      </div>
    </div>
  ),
};

/**
 * LUMINOUS - Vercel-style
 * Light as feedback, glow expansion.
 */
export const Luminous: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Approach 4: LUMINOUS
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Vercel-style. Outer glow expands, brightness increases.
          Light is the feedback language. Shimmer on interaction.
        </p>
      </div>
      <div className="flex gap-4">
        <LuminousButton>Continue</LuminousButton>
        <LuminousButton variant="cta">Enter HIVE</LuminousButton>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>Hover: glow expands, brightness +10%</p>
        <p>Press: brightness -5%</p>
        <p>Duration: 300ms with shimmer</p>
      </div>
    </div>
  ),
};

/**
 * ATMOSPHERIC - HIVE signature
 * Edge warmth intensifies, HIVE's unique feel.
 */
export const Atmospheric: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Approach 5: ATMOSPHERIC
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          HIVE signature. Edge glow intensifies (warmth system).
          Gold edge for CTA, white edge for default. Unique to HIVE.
        </p>
      </div>
      <div className="flex gap-4">
        <AtmosphericButton>Continue</AtmosphericButton>
        <AtmosphericButton variant="cta">Enter HIVE</AtmosphericButton>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>Hover: inset glow, scale 1.02, Y -1px</p>
        <p>Press: scale 0.98, spring</p>
        <p>Edge glow: gold (CTA) / white (default)</p>
      </div>
    </div>
  ),
};

/**
 * SCALE COMPARISON
 * Test different scale values side-by-side.
 */
export const ScaleComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Scale Amount Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Testing scale amounts: 1.01 vs 1.02 vs 1.03 vs 1.05
          Which feels premium without being cartoonish?
        </p>
      </div>
      <div className="flex gap-6">
        {[1.01, 1.02, 1.03, 1.05].map((scale) => (
          <div key={scale} className="flex flex-col items-center gap-2">
            <button
              className={cn(
                baseButton,
                'bg-[var(--color-text-primary)]',
                'text-[var(--color-bg-page)]',
                'transition-transform duration-150',
                '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]'
              )}
              style={{
                // @ts-expect-error CSS custom property for hover
                '--hover-scale': scale,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(${scale})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Scale {scale}
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              {scale === 1.01 && 'Barely noticeable'}
              {scale === 1.02 && 'Subtle'}
              {scale === 1.03 && 'Visible'}
              {scale === 1.05 && 'Obvious'}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * PRESS STATE COMPARISON
 * Test different press (active) scale values.
 */
export const PressComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Press State Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Testing press scales: 0.99 vs 0.98 vs 0.97 vs 0.95
          Which gives the best tactile feedback?
        </p>
      </div>
      <div className="flex gap-6">
        {[0.99, 0.98, 0.97, 0.95].map((scale) => (
          <div key={scale} className="flex flex-col items-center gap-2">
            <button
              className={cn(
                baseButton,
                'bg-[var(--color-text-primary)]',
                'text-[var(--color-bg-page)]',
                'transition-transform duration-100'
              )}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = `scale(${scale})`;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Press {scale}
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              {scale === 0.99 && 'Barely'}
              {scale === 0.98 && 'Subtle'}
              {scale === 0.97 && 'Visible'}
              {scale === 0.95 && 'Obvious'}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * TIMING COMPARISON
 * Test different durations with same easing.
 */
export const TimingComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Timing Comparison
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-md">
          Testing durations: 100ms vs 150ms vs 200ms vs 300ms
          Same scale (1.02), different speeds.
        </p>
      </div>
      <div className="flex gap-6">
        {[100, 150, 200, 300].map((duration) => (
          <div key={duration} className="flex flex-col items-center gap-2">
            <button
              className={cn(
                baseButton,
                'bg-[var(--color-text-primary)]',
                'text-[var(--color-bg-page)]',
                'hover:scale-[1.02]',
                'active:scale-[0.98]',
                '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]'
              )}
              style={{
                transitionDuration: `${duration}ms`,
              }}
            >
              {duration}ms
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              {duration === 100 && 'Snappy'}
              {duration === 150 && 'Quick'}
              {duration === 200 && 'Smooth'}
              {duration === 300 && 'Relaxed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * IN CONTEXT - Real usage
 * How do these feel in actual UI patterns?
 */
export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 max-w-md">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          In Context
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Real UI patterns. Which approach feels right here?
        </p>
      </div>

      {/* Modal footer pattern */}
      <div className="bg-[var(--color-bg-surface)] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Join Space
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You're about to join Developer Community. You'll have access to all
          channels and resources.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className={cn(
              baseButton,
              'bg-transparent',
              'border border-[var(--color-border)]',
              'text-[var(--color-text-secondary)]',
              'transition-all duration-150',
              'hover:bg-[var(--color-bg-elevated)]',
              'hover:border-[var(--color-text-muted)]'
            )}
          >
            Cancel
          </button>
          <AtmosphericButton variant="cta">Join Space</AtmosphericButton>
        </div>
      </div>

      {/* Form submit pattern */}
      <div className="bg-[var(--color-bg-surface)] rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Create Event
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Event name"
            className={cn(
              'w-full h-10 px-3',
              'bg-[var(--color-bg-elevated)]',
              'border border-[var(--color-border)]',
              'rounded-lg',
              'text-sm text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          />
          <input
            type="text"
            placeholder="Location"
            className={cn(
              'w-full h-10 px-3',
              'bg-[var(--color-bg-elevated)]',
              'border border-[var(--color-border)]',
              'rounded-lg',
              'text-sm text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          />
        </div>
        <div className="pt-2">
          <LuminousButton variant="cta">Create Event</LuminousButton>
        </div>
      </div>
    </div>
  ),
};
