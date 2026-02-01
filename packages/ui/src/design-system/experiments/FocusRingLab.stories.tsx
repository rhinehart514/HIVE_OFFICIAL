'use client';

/**
 * Focus Ring Decision Lab
 *
 * DECISION: Focus ring visibility and color
 * - white/50% vs white/70%
 * - gold vs white
 * - offset and width
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Focus Ring Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

const GOLD = '#FFD700';

// =============================================================================
// DECISION 1: Input Focus States
// =============================================================================

const FocusInput: React.FC<{
  ringColor: string;
  ringWidth: string;
  ringOffset: string;
  label: string;
}> = ({ ringColor, ringWidth, ringOffset, label }) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50">{label}</label>
      <input
        type="text"
        placeholder="Focus me..."
        className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          boxShadow: focused
            ? `0 0 0 ${ringOffset} #0A0A0A, 0 0 0 calc(${ringOffset} + ${ringWidth}) ${ringColor}`
            : '0 0 0 1px rgba(255,255,255,0.08)',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p className="text-xs text-white/30 font-mono">
        {ringWidth} / {ringColor}
      </p>
    </div>
  );
};

export const Decision_InputFocus: Story = {
  name: '1. Decision: Input Focus Visibility',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Input Focus Ring Visibility
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Tab through or click each input. Which focus ring is visible enough
            for accessibility without being too prominent?
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <FocusInput
            ringColor="rgba(255,255,255,0.30)"
            ringWidth="2px"
            ringOffset="2px"
            label="30% White (Subtle)"
          />
          <FocusInput
            ringColor="rgba(255,255,255,0.50)"
            ringWidth="2px"
            ringOffset="2px"
            label="50% White (Current)"
          />
          <FocusInput
            ringColor="rgba(255,255,255,0.70)"
            ringWidth="2px"
            ringOffset="2px"
            label="70% White (Enhanced)"
          />
          <FocusInput
            ringColor="rgba(255,255,255,0.50)"
            ringWidth="1px"
            ringOffset="2px"
            label="1px Width"
          />
          <FocusInput
            ringColor="rgba(255,255,255,0.50)"
            ringWidth="2px"
            ringOffset="2px"
            label="2px Width (Current)"
          />
          <FocusInput
            ringColor="rgba(255,255,255,0.50)"
            ringWidth="3px"
            ringOffset="2px"
            label="3px Width"
          />
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">WCAG 2.2:</strong> Focus indicators must have 3:1 contrast ratio.
            <br />
            <strong className="text-white">Current:</strong> white/50% at 2px width with 2px offset.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Button Focus States
// =============================================================================

const FocusButton: React.FC<{
  ringColor: string;
  variant: 'primary' | 'secondary' | 'ghost';
  label: string;
}> = ({ ringColor, variant, label }) => {
  const [focused, setFocused] = React.useState(false);

  const baseStyles = {
    primary: {
      background: '#FAFAFA',
      color: '#0A0A0A',
    },
    secondary: {
      background: 'transparent',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.7)',
    },
    ghost: {
      background: 'transparent',
      color: 'rgba(255,255,255,0.6)',
    },
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="h-11 px-6 rounded-full text-sm font-medium outline-none"
        style={{
          ...baseStyles[variant],
          boxShadow: focused
            ? `${baseStyles[variant].boxShadow || ''}, 0 0 0 2px #0A0A0A, 0 0 0 4px ${ringColor}`.replace(/^, /, '')
            : baseStyles[variant].boxShadow,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {variant === 'primary' ? 'Continue' : variant === 'secondary' ? 'Cancel' : 'Skip'}
      </button>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  );
};

export const Decision_ButtonFocus: Story = {
  name: '2. Button Focus States',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Button Focus Rings
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Tab through buttons. Does the focus ring work across all variants?
          </p>
        </div>

        <div className="space-y-8">
          {/* White Rings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">White Focus Ring (50%)</h3>
            <div className="flex gap-6">
              <FocusButton ringColor="rgba(255,255,255,0.5)" variant="primary" label="Primary" />
              <FocusButton ringColor="rgba(255,255,255,0.5)" variant="secondary" label="Secondary" />
              <FocusButton ringColor="rgba(255,255,255,0.5)" variant="ghost" label="Ghost" />
            </div>
          </div>

          {/* Gold Rings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Gold Focus Ring</h3>
            <div className="flex gap-6">
              <FocusButton ringColor={GOLD} variant="primary" label="Primary" />
              <FocusButton ringColor={GOLD} variant="secondary" label="Secondary" />
              <FocusButton ringColor={GOLD} variant="ghost" label="Ghost" />
            </div>
          </div>

          {/* Enhanced White */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">White Focus Ring (70%)</h3>
            <div className="flex gap-6">
              <FocusButton ringColor="rgba(255,255,255,0.7)" variant="primary" label="Primary" />
              <FocusButton ringColor="rgba(255,255,255,0.7)" variant="secondary" label="Secondary" />
              <FocusButton ringColor="rgba(255,255,255,0.7)" variant="ghost" label="Ghost" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 3: Focus on Different Backgrounds
// =============================================================================

export const Decision_BackgroundContext: Story = {
  name: '3. Focus on Different Backgrounds',
  render: () => {
    const FocusDemo: React.FC<{ bg: string; label: string }> = ({ bg, label }) => {
      const [focused, setFocused] = React.useState(false);
      return (
        <div className="p-6 rounded-xl" style={{ background: bg }}>
          <p className="text-xs text-white/50 mb-3">{label}</p>
          <input
            type="text"
            placeholder="Focus me..."
            className="w-full h-10 px-4 rounded-lg text-sm text-white placeholder:text-white/30 outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              boxShadow: focused
                ? '0 0 0 2px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.5)'
                : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
      );
    };

    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Focus on Different Backgrounds
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              Does the same focus ring work on void, surface, and card backgrounds?
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <FocusDemo bg="#0A0A0A" label="Void (#0A0A0A)" />
            <FocusDemo bg="#141414" label="Surface (#141414)" />
            <FocusDemo bg="#1A1A1A" label="Card (#1A1A1A)" />
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <p className="text-sm text-white/60">
              <strong className="text-white">Challenge:</strong> Focus must be visible on all backgrounds.
              <br />
              <strong className="text-white">Solution:</strong> Use offset to create contrast buffer.
            </p>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// DECISION 4: WCAG Contrast Check
// =============================================================================

export const Decision_WCAGContrast: Story = {
  name: '4. WCAG Contrast Validation',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            WCAG Focus Indicator Requirements
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            WCAG 2.2 requires 3:1 minimum contrast for focus indicators.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Contrast Ratios */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Contrast Ratios</h3>
            <div className="space-y-3">
              {[
                { color: 'rgba(255,255,255,0.30)', ratio: '~1.5:1', pass: false },
                { color: 'rgba(255,255,255,0.50)', ratio: '~2.5:1', pass: false },
                { color: 'rgba(255,255,255,0.70)', ratio: '~4:1', pass: true },
                { color: '#FFD700', ratio: '~8:1', pass: true },
                { color: '#FFFFFF', ratio: '~12:1', pass: true },
              ].map(({ color, ratio, pass }) => (
                <div
                  key={color}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
                >
                  <div
                    className="w-8 h-8 rounded"
                    style={{ background: color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">{color}</p>
                    <p className="text-xs text-white/50">{ratio}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      pass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Demo */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Visual Comparison</h3>
            <div className="p-6 rounded-xl bg-[#0A0A0A] space-y-4">
              {[
                { label: '30% (fails)', color: 'rgba(255,255,255,0.3)' },
                { label: '50% (borderline)', color: 'rgba(255,255,255,0.5)' },
                { label: '70% (passes)', color: 'rgba(255,255,255,0.7)' },
                { label: 'Gold (passes)', color: GOLD },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <div
                    className="w-32 h-10 rounded-lg"
                    style={{
                      background: '#141414',
                      boxShadow: `0 0 0 2px ${color}`,
                    }}
                  />
                  <span className="text-xs text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-200/80">
            <strong>Recommendation:</strong> Increase focus ring to 70% white for WCAG compliance,
            or use gold (which has higher contrast) for accessibility-first approach.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 5: Focus Ring Style Variations
// =============================================================================

export const Decision_RingStyles: Story = {
  name: '5. Ring Style Variations',
  render: () => {
    const StyleDemo: React.FC<{
      style: React.CSSProperties;
      label: string;
      description: string;
    }> = ({ style, label, description }) => (
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-full h-12 rounded-xl bg-[#141414]"
          style={style}
        />
        <div className="text-center">
          <p className="text-xs text-white/70">{label}</p>
          <p className="text-xs text-white/30">{description}</p>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Ring Style Variations
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              Different approaches to focus indicators.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <StyleDemo
              style={{
                boxShadow: '0 0 0 2px #0A0A0A, 0 0 0 4px rgba(255,255,255,0.5)',
              }}
              label="Offset Ring"
              description="Current approach"
            />
            <StyleDemo
              style={{
                boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
              }}
              label="Direct Ring"
              description="No offset"
            />
            <StyleDemo
              style={{
                outline: '2px solid rgba(255,255,255,0.5)',
                outlineOffset: '2px',
              }}
              label="Outline"
              description="CSS outline"
            />
            <StyleDemo
              style={{
                boxShadow: '0 0 0 4px rgba(255,255,255,0.2)',
              }}
              label="Thick Soft"
              description="Wide, subtle"
            />
          </div>
        </div>
      </div>
    );
  },
};
