'use client';

/**
 * Typography Font Decision Lab
 *
 * DECISION: Clash Display vs Geist for headlines
 *
 * This lab surfaces the unresolved decision between display fonts
 * for headings and titles.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Typography Font Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// DECISION 1: Display Text Comparison
// =============================================================================

export const Decision_DisplayText: Story = {
  name: '1. Decision: Clash Display or Geist?',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Display Font Comparison
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Which font captures HIVE's voice? "Your Spaces" rendered in both.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Clash Display */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">Option A: Clash Display</h3>
              <span className="text-xs text-white/30">Geometric, bold</span>
            </div>
            <div
              className="p-8 rounded-2xl"
              style={{ background: '#141414' }}
            >
              <p
                className="text-4xl tracking-tight"
                style={{
                  fontFamily: '"Clash Display", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                Your Spaces
              </p>
              <p className="text-xs text-white/40 mt-4 font-mono">
                font-family: "Clash Display"
                <br />
                font-weight: 600
              </p>
            </div>
          </div>

          {/* Geist */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">Option B: Geist Sans</h3>
              <span className="text-xs text-white/30">Clean, system-like</span>
            </div>
            <div
              className="p-8 rounded-2xl"
              style={{ background: '#141414' }}
            >
              <p
                className="text-4xl tracking-tight"
                style={{
                  fontFamily: '"Geist Sans", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                Your Spaces
              </p>
              <p className="text-xs text-white/40 mt-4 font-mono">
                font-family: "Geist Sans"
                <br />
                font-weight: 600
              </p>
            </div>
          </div>
        </div>

        {/* Context */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Clash Display:</strong> Distinctive, brand-forward, stands out.
            <br />
            <strong className="text-white">Geist Sans:</strong> Consistent with body, minimal, Vercel-aligned.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Heading Hierarchy
// =============================================================================

export const Decision_HeadingHierarchy: Story = {
  name: '2. Heading Hierarchy (H1-H4)',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Heading Hierarchy
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Full heading scale in both fonts. Does hierarchy feel clear?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Clash Display */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-white/70">Clash Display</h3>
            <div
              className="p-8 rounded-2xl space-y-6"
              style={{ background: '#141414' }}
            >
              {[
                { level: 'H1', size: '40px', weight: 600 },
                { level: 'H2', size: '32px', weight: 500 },
                { level: 'H3', size: '24px', weight: 500 },
                { level: 'H4', size: '20px', weight: 500 },
              ].map(({ level, size, weight }) => (
                <div key={level}>
                  <p
                    style={{
                      fontFamily: '"Clash Display", system-ui, sans-serif',
                      fontSize: size,
                      fontWeight: weight,
                      color: '#FAFAFA',
                      lineHeight: 1.2,
                    }}
                  >
                    {level}: Welcome to HIVE
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {size} / {weight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Geist */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-white/70">Geist Sans</h3>
            <div
              className="p-8 rounded-2xl space-y-6"
              style={{ background: '#141414' }}
            >
              {[
                { level: 'H1', size: '40px', weight: 600 },
                { level: 'H2', size: '32px', weight: 500 },
                { level: 'H3', size: '24px', weight: 500 },
                { level: 'H4', size: '20px', weight: 500 },
              ].map(({ level, size, weight }) => (
                <div key={level}>
                  <p
                    style={{
                      fontFamily: '"Geist Sans", system-ui, sans-serif',
                      fontSize: size,
                      fontWeight: weight,
                      color: '#FAFAFA',
                      lineHeight: 1.2,
                    }}
                  >
                    {level}: Welcome to HIVE
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {size} / {weight}
                  </p>
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
// DECISION 3: Mixed Context
// =============================================================================

export const Decision_MixedContext: Story = {
  name: '3. Headlines with Body Text',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Headlines with Body Text
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            How do headlines pair with Geist body text (which is fixed)?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Clash Display Headlines + Geist Body */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Clash Display + Geist Body</h3>
            <div
              className="p-8 rounded-2xl"
              style={{ background: '#141414' }}
            >
              <p
                className="mb-4"
                style={{
                  fontFamily: '"Clash Display", system-ui, sans-serif',
                  fontSize: '32px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: 1.2,
                }}
              >
                Your Spaces
              </p>
              <p
                style={{
                  fontFamily: '"Geist Sans", system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                }}
              >
                Communities you belong to. Quick access to your favorite spaces,
                recent conversations, and upcoming events.
              </p>
            </div>
          </div>

          {/* All Geist */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">All Geist</h3>
            <div
              className="p-8 rounded-2xl"
              style={{ background: '#141414' }}
            >
              <p
                className="mb-4"
                style={{
                  fontFamily: '"Geist Sans", system-ui, sans-serif',
                  fontSize: '32px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: 1.2,
                }}
              >
                Your Spaces
              </p>
              <p
                style={{
                  fontFamily: '"Geist Sans", system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                }}
              >
                Communities you belong to. Quick access to your favorite spaces,
                recent conversations, and upcoming events.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Mixed fonts:</strong> Creates visual hierarchy but requires font loading.
            <br />
            <strong className="text-white">Single font:</strong> Cleaner, lighter, more consistent.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 4: Scale Matrix
// =============================================================================

export const Decision_ScaleMatrix: Story = {
  name: '4. Full Type Scale Matrix',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Full Type Scale
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Every size in the system, both fonts. Comprehensive comparison.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {['Clash Display', 'Geist Sans'].map((font) => (
            <div key={font} className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">{font}</h3>
              <div
                className="p-6 rounded-2xl space-y-3"
                style={{ background: '#141414' }}
              >
                {[
                  { name: 'display', size: '40px', weight: 600 },
                  { name: 'title-xl', size: '32px', weight: 400 },
                  { name: 'title-lg', size: '24px', weight: 500 },
                  { name: 'title', size: '20px', weight: 500 },
                  { name: 'body-lg', size: '17px', weight: 400 },
                  { name: 'body', size: '15px', weight: 400 },
                  { name: 'body-sm', size: '13px', weight: 400 },
                  { name: 'label', size: '12px', weight: 500 },
                  { name: 'caption', size: '11px', weight: 400 },
                ].map(({ name, size, weight }) => (
                  <div key={name} className="flex items-baseline gap-4">
                    <span className="text-xs text-white/30 w-16 font-mono">{name}</span>
                    <span
                      style={{
                        fontFamily: font === 'Clash Display'
                          ? '"Clash Display", system-ui, sans-serif'
                          : '"Geist Sans", system-ui, sans-serif',
                        fontSize: size,
                        fontWeight: weight,
                        color: '#FAFAFA',
                      }}
                    >
                      HIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 5: Font Loading Fallback
// =============================================================================

export const Decision_FontFallback: Story = {
  name: '5. Fallback Behavior',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Font Fallback Behavior
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            What happens when fonts fail to load? System fallbacks shown.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Clash Display */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Clash Display</h3>
            <div className="p-6 rounded-2xl" style={{ background: '#141414' }}>
              <p
                className="text-2xl"
                style={{
                  fontFamily: '"Clash Display", system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                Your Spaces
              </p>
              <p className="text-xs text-white/30 mt-2">Loaded</p>
            </div>
          </div>

          {/* System UI Fallback */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">System UI</h3>
            <div className="p-6 rounded-2xl" style={{ background: '#141414' }}>
              <p
                className="text-2xl"
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                Your Spaces
              </p>
              <p className="text-xs text-white/30 mt-2">Fallback</p>
            </div>
          </div>

          {/* Arial Fallback */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Arial</h3>
            <div className="p-6 rounded-2xl" style={{ background: '#141414' }}>
              <p
                className="text-2xl"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                Your Spaces
              </p>
              <p className="text-xs text-white/30 mt-2">Worst case</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Risk:</strong> Clash Display requires font loading.
            If it fails, fallback may feel inconsistent.
            <br />
            <strong className="text-white">Geist advantage:</strong> Closer to system fonts, graceful degradation.
          </p>
        </div>
      </div>
    </div>
  ),
};
