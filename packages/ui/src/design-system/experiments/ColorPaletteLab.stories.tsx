'use client';

/**
 * Color Palette Decision Lab
 *
 * DECISION: Warm (#0A0A09) vs Neutral (#0A0A0A) palette
 *
 * This lab surfaces the unresolved decision between warm-tinted
 * and purely neutral gray backgrounds.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Color Palette Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// COLOR OPTIONS
// =============================================================================

const palettes = {
  warm: {
    name: 'Warm Tint',
    void: '#0A0A09',
    ground: '#121210',
    surface: '#1A1A17',
    elevated: '#242420',
    description: 'Subtle warm undertone - feels organic, cozy',
  },
  neutral: {
    name: 'Pure Neutral',
    void: '#0A0A0A',
    ground: '#141414',
    surface: '#1A1A1A',
    elevated: '#242424',
    description: 'True gray - feels technical, precise',
  },
};

// =============================================================================
// DECISION 1: Background Comparison
// =============================================================================

export const Decision_BackgroundTiers: Story = {
  name: '1. Decision: Warm or Neutral Backgrounds?',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#000' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Background Tier Comparison
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Do we want subtle warmth (organic, cozy) or pure neutrals (technical, precise)?
            Look at the four tiers: void → ground → surface → elevated.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Warm Palette */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">Option A: Warm Tint</h3>
              <span className="text-xs text-white/30">Subtle gold undertone</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Void (page)', color: palettes.warm.void },
                { label: 'Ground (sections)', color: palettes.warm.ground },
                { label: 'Surface (cards)', color: palettes.warm.surface },
                { label: 'Elevated (hover)', color: palettes.warm.elevated },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="h-20 rounded-xl flex items-end p-4"
                  style={{ background: color }}
                >
                  <div className="flex justify-between w-full">
                    <span className="text-xs text-white/70">{label}</span>
                    <span className="text-xs text-white/40 font-mono">{color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Palette */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">Option B: Pure Neutral</h3>
              <span className="text-xs text-white/30">No color bias</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Void (page)', color: palettes.neutral.void },
                { label: 'Ground (sections)', color: palettes.neutral.ground },
                { label: 'Surface (cards)', color: palettes.neutral.surface },
                { label: 'Elevated (hover)', color: palettes.neutral.elevated },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="h-20 rounded-xl flex items-end p-4"
                  style={{ background: color }}
                >
                  <div className="flex justify-between w-full">
                    <span className="text-xs text-white/70">{label}</span>
                    <span className="text-xs text-white/40 font-mono">{color}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Card Surfaces
// =============================================================================

const DemoCard: React.FC<{ bg: string; border: string }> = ({ bg, border }) => (
  <div
    className="rounded-2xl p-5"
    style={{
      background: bg,
      boxShadow: `0 0 0 1px ${border}`,
    }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
      <div>
        <div className="text-sm font-medium text-white">Design Club</div>
        <div className="text-xs text-white/50">127 members</div>
      </div>
    </div>
    <div className="text-xs text-white/60 line-clamp-2">
      A community for designers exploring new ideas and sharing work.
    </div>
  </div>
);

export const Decision_CardSurfaces: Story = {
  name: '2. Card Surfaces on Each Palette',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#000' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Cards on Different Backgrounds
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Same card rendered on warm vs neutral palette. Which has better contrast
            and visual separation?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Warm */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Warm Palette</h3>
            <div className="p-6 rounded-2xl" style={{ background: palettes.warm.void }}>
              <DemoCard bg={palettes.warm.surface} border="rgba(255,255,255,0.06)" />
            </div>
          </div>

          {/* Neutral */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Neutral Palette</h3>
            <div className="p-6 rounded-2xl" style={{ background: palettes.neutral.void }}>
              <DemoCard bg={palettes.neutral.surface} border="rgba(255,255,255,0.06)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 3: Text Contrast (WCAG)
// =============================================================================

export const Decision_TextContrast: Story = {
  name: '3. Text Contrast (WCAG Check)',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#000' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Text Contrast Comparison
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            WCAG AA requires 4.5:1 for normal text, 3:1 for large text.
            Does one palette offer better readability?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {Object.entries(palettes).map(([key, palette]) => (
            <div key={key} className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">{palette.name}</h3>
              <div className="p-6 rounded-2xl space-y-4" style={{ background: palette.void }}>
                {/* Primary text */}
                <div>
                  <p className="text-white" style={{ color: '#FAFAFA' }}>
                    Primary text (#FAFAFA)
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    High contrast - headings, body
                  </p>
                </div>

                {/* Secondary text */}
                <div>
                  <p style={{ color: '#A1A1A6' }}>
                    Secondary text (#A1A1A6)
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Medium contrast - descriptions
                  </p>
                </div>

                {/* Subtle text */}
                <div>
                  <p style={{ color: '#818187' }}>
                    Subtle text (#818187)
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Low contrast - timestamps, metadata
                  </p>
                </div>

                {/* Disabled text */}
                <div>
                  <p style={{ color: '#52525B' }}>
                    Disabled text (#52525B)
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Very low - disabled states
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 4: Full Component Stack
// =============================================================================

export const Decision_ComponentStack: Story = {
  name: '4. Full Component Stack',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#000' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Full Component Stack
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Button + Input + Card together. Which palette feels more cohesive?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {Object.entries(palettes).map(([key, palette]) => (
            <div key={key} className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">{palette.name}</h3>
              <div
                className="p-8 rounded-2xl space-y-6"
                style={{ background: palette.void }}
              >
                {/* Card */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: palette.surface,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-sm font-medium text-white mb-2">Create a space</p>
                  <p className="text-xs text-white/50">
                    Give your community a home on HIVE.
                  </p>
                </div>

                {/* Input */}
                <input
                  type="text"
                  placeholder="Space name..."
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                />

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 h-11 rounded-full text-sm font-medium"
                    style={{
                      background: 'transparent',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 h-11 rounded-full text-sm font-medium"
                    style={{
                      background: '#FAFAFA',
                      color: palette.void,
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decision Summary */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 mt-12">
          <p className="text-sm font-medium text-white mb-2">Decision Required</p>
          <p className="text-xs text-white/60">
            <strong>Warm:</strong> Organic, cozy, matches gold brand accent.
            <br />
            <strong>Neutral:</strong> Technical, precise, no color contamination.
          </p>
        </div>
      </div>
    </div>
  ),
};
