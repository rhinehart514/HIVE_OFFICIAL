'use client';

/**
 * Motion Timing Decision Lab
 *
 * DECISIONS:
 * - 250ms vs 300ms for standard transitions
 * - Easing curve selection
 * - Reduced motion behavior
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Motion Timing Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// INTERACTIVE BUTTON FOR TIMING TESTS
// =============================================================================

const TimingButton: React.FC<{
  duration: string;
  easing: string;
  label: string;
}> = ({ duration, easing, label }) => {
  const [pressed, setPressed] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className="h-11 px-6 rounded-full text-sm font-medium"
        style={{
          background: pressed ? 'rgba(255,255,255,0.9)' : '#FAFAFA',
          color: '#0A0A0A',
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
          transition: `all ${duration} ${easing}`,
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
      >
        Press Me
      </button>
      <div className="text-center">
        <p className="text-xs text-white/70">{label}</p>
        <p className="text-xs text-white/30">{duration}</p>
      </div>
    </div>
  );
};

// =============================================================================
// DECISION 1: Button Press Timing
// =============================================================================

export const Decision_ButtonPress: Story = {
  name: '1. Decision: Button Press Timing',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Button Press Timing
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Press each button. Which timing feels most responsive without being jarring?
          </p>
        </div>

        <div className="flex gap-8 items-start">
          <TimingButton duration="150ms" easing="ease-out" label="Fast" />
          <TimingButton duration="200ms" easing="ease-out" label="Quick" />
          <TimingButton duration="250ms" easing="ease-out" label="Smooth" />
          <TimingButton duration="300ms" easing="ease-out" label="Slow" />
          <TimingButton duration="400ms" easing="ease-out" label="Dramatic" />
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Current system:</strong> Mixed (150ms fast, 200ms normal, 300ms slow)
            <br />
            <strong className="text-white">Question:</strong> Should "smooth" be 250ms or 300ms?
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Card Entrance Animation
// =============================================================================

const EntranceCard: React.FC<{
  duration: string;
  easing: string;
  label: string;
  delay?: number;
}> = ({ duration, easing, label, delay = 0 }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-48 h-32 rounded-2xl p-4 flex flex-col justify-between"
        style={{
          background: '#1A1A1A',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: `opacity ${duration} ${easing}, transform ${duration} ${easing}`,
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
        <div>
          <div className="text-sm font-medium text-white">Space Name</div>
          <div className="text-xs text-white/50">24 members</div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-white/70">{label}</p>
        <p className="text-xs text-white/30">{duration}</p>
      </div>
    </div>
  );
};

export const Decision_CardEntrance: Story = {
  name: '2. Card Entrance Animation',
  render: () => {
    const [key, setKey] = React.useState(0);

    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Card Entrance Animation
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              How should cards fade in? Click replay to restart animations.
            </p>
          </div>

          <button
            onClick={() => setKey((k) => k + 1)}
            className="px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Replay Animation
          </button>

          <div key={key} className="flex gap-8 items-start">
            <EntranceCard duration="150ms" easing="ease-out" label="Instant" />
            <EntranceCard duration="200ms" easing="ease-out" label="Quick" delay={100} />
            <EntranceCard duration="300ms" easing="ease-out" label="Smooth" delay={200} />
            <EntranceCard duration="400ms" easing="ease-out" label="Slow" delay={300} />
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// DECISION 3: Easing Curves
// =============================================================================

const EasingDemo: React.FC<{
  easing: string;
  label: string;
  description: string;
}> = ({ easing, label, description }) => {
  const [animated, setAnimated] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAnimated((a) => !a)}
          className="text-xs text-white/50 hover:text-white/70"
        >
          Toggle
        </button>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <div className="h-12 rounded-xl bg-white/5 relative overflow-hidden">
        <div
          className="absolute top-2 bottom-2 w-8 rounded-lg bg-[#FFD700]"
          style={{
            left: animated ? 'calc(100% - 40px)' : '8px',
            transition: `left 500ms ${easing}`,
          }}
        />
      </div>
      <div>
        <p className="text-xs text-white/30 font-mono">{easing}</p>
        <p className="text-xs text-white/50 mt-1">{description}</p>
      </div>
    </div>
  );
};

export const Decision_EasingCurves: Story = {
  name: '3. Easing Curve Comparison',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Easing Curves
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Click toggle to animate. Which curve feels right for HIVE?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <EasingDemo
            easing="ease-out"
            label="Ease Out"
            description="Quick start, gentle stop. Standard for exits."
          />
          <EasingDemo
            easing="ease-in-out"
            label="Ease In-Out"
            description="Gentle start and stop. Classic motion."
          />
          <EasingDemo
            easing="cubic-bezier(0.25, 0.1, 0.25, 1)"
            label="Smooth"
            description="Vercel/Linear style. Refined ease-out."
          />
          <EasingDemo
            easing="cubic-bezier(0.4, 0, 0.2, 1)"
            label="Snappy"
            description="Material Design. Quick settle."
          />
          <EasingDemo
            easing="cubic-bezier(0.34, 1.56, 0.64, 1)"
            label="Spring"
            description="Overshoot and settle. Playful."
          />
          <EasingDemo
            easing="linear"
            label="Linear"
            description="No acceleration. Robotic (avoid)."
          />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 4: Hover Micro-interactions
// =============================================================================

const HoverCard: React.FC<{
  duration: string;
  scale: string;
  label: string;
}> = ({ duration, scale, label }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className="w-40 h-24 rounded-xl p-4 cursor-pointer"
      style={{
        background: '#1A1A1A',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        transition: `transform ${duration} ease-out, box-shadow ${duration} ease-out`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `scale(${scale})`;
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.06)';
      }}
    >
      <div className="text-sm font-medium text-white">Hover me</div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
    <p className="text-xs text-white/30">{duration} / {scale}</p>
  </div>
);

export const Decision_HoverMicro: Story = {
  name: '4. Hover Micro-interactions',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Hover State Timing
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            T3 (150ms) micro-interaction timing. How much scale? How fast?
          </p>
        </div>

        <div className="flex gap-8 items-start">
          <HoverCard duration="100ms" scale="1.01" label="Subtle" />
          <HoverCard duration="150ms" scale="1.02" label="Standard" />
          <HoverCard duration="200ms" scale="1.02" label="Smooth" />
          <HoverCard duration="150ms" scale="1.03" label="Bouncy" />
          <HoverCard duration="200ms" scale="1.05" label="Dramatic" />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 5: Reduced Motion
// =============================================================================

export const Decision_ReducedMotion: Story = {
  name: '5. Reduced Motion Behavior',
  render: () => {
    const [reducedMotion, setReducedMotion] = React.useState(false);
    const [animated, setAnimated] = React.useState(false);

    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Reduced Motion Mode
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              How should we handle prefers-reduced-motion? Toggle to compare.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setReducedMotion((r) => !r)}
              className={`px-4 py-2 rounded-lg text-sm ${
                reducedMotion
                  ? 'bg-[#FFD700] text-black'
                  : 'border border-white/10 text-white/70'
              }`}
            >
              {reducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}
            </button>
            <button
              onClick={() => setAnimated((a) => !a)}
              className="px-4 py-2 rounded-lg text-sm border border-white/10 text-white/70"
            >
              Trigger Animation
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Fade only */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">
                Option A: Fade only (no motion)
              </h3>
              <div
                className="w-full h-32 rounded-2xl p-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                  opacity: animated ? 1 : 0.3,
                  transition: reducedMotion
                    ? 'opacity 0ms'
                    : 'opacity 300ms ease-out',
                }}
              >
                <div className="text-sm font-medium text-white">Card Content</div>
                <div className="text-xs text-white/50 mt-1">
                  Only opacity changes, no transform
                </div>
              </div>
            </div>

            {/* Instant */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">
                Option B: Instant (0ms)
              </h3>
              <div
                className="w-full h-32 rounded-2xl p-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                  opacity: animated ? 1 : 0.3,
                  transform: animated ? 'translateY(0)' : 'translateY(16px)',
                  transition: reducedMotion
                    ? 'all 0ms'
                    : 'all 300ms ease-out',
                }}
              >
                <div className="text-sm font-medium text-white">Card Content</div>
                <div className="text-xs text-white/50 mt-1">
                  Transitions happen instantly
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <p className="text-sm text-white/60">
              <strong className="text-white">WCAG guideline:</strong> Respect user preference.
              <br />
              <strong className="text-white">Options:</strong> Disable all motion, reduce to fade-only, or instant transitions.
            </p>
          </div>
        </div>
      </div>
    );
  },
};
