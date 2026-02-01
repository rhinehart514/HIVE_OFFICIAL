'use client';

/**
 * Gold Accent Decision Lab
 *
 * DECISION: When does gold appear?
 * - CTA buttons only?
 * - Celebrations/achievements?
 * - Leader status indicators?
 * - Brand elements only?
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Gold Accent Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

const GOLD = '#FFD700';
const GOLD_DIM = '#CC9900';

// =============================================================================
// DECISION 1: Button Variants
// =============================================================================

export const Decision_ButtonVariants: Story = {
  name: '1. Decision: Gold CTA vs White Primary',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Primary Button: Gold or White?
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Current decision says gold is for brand/leader status only,
            white is for CTAs. Is this correct?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* White Primary */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option A: White Primary</h3>
            <p className="text-xs text-white/40">
              Clean, minimal, lets gold stay rare
            </p>
            <div
              className="p-8 rounded-2xl space-y-4"
              style={{ background: '#141414' }}
            >
              <button
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{ background: '#FAFAFA', color: '#0A0A0A' }}
              >
                Continue
              </button>
              <button
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{
                  background: 'transparent',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Gold Primary */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option B: Gold Primary</h3>
            <p className="text-xs text-white/40">
              Brand-forward, distinctive, but dilutes rarity
            </p>
            <div
              className="p-8 rounded-2xl space-y-4"
              style={{ background: '#141414' }}
            >
              <button
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{ background: GOLD, color: '#0A0A0A' }}
              >
                Continue
              </button>
              <button
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{
                  background: 'transparent',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Current guideline:</strong> Gold only for logo, brand mark, and leader status indicators.
            <br />
            <strong className="text-white">Question:</strong> Should special CTAs (Enter HIVE, Deploy, Claim) be gold?
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Gold Usage Contexts
// =============================================================================

export const Decision_GoldContexts: Story = {
  name: '2. When Should Gold Appear?',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Gold Usage Contexts
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            When does gold feel earned? When does it feel cheap?
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Logo/Brand */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  H
                </div>
                <span className="text-sm font-medium text-white">HIVE</span>
              </div>
              <span className="text-xs text-green-400">Allowed</span>
            </div>
            <p className="text-xs text-white/50">Logo & brand mark</p>
          </div>

          {/* Leader Status */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Alex Chen
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: GOLD, color: '#0A0A0A' }}
                    >
                      Leader
                    </span>
                  </div>
                  <div className="text-xs text-white/50">Space Admin</div>
                </div>
              </div>
              <span className="text-xs text-green-400">Allowed</span>
            </div>
            <p className="text-xs text-white/50">Leader status badges</p>
          </div>

          {/* Achievement Moment */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-center py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
                  style={{ background: `${GOLD}20`, color: GOLD }}
                >
                  🎉
                </div>
                <div className="text-sm font-medium text-white mb-1">Space Created!</div>
                <div className="text-xs text-white/50">Your community is live</div>
              </div>
              <span className="text-xs text-yellow-400">Questionable</span>
            </div>
            <p className="text-xs text-white/50">Celebrations</p>
          </div>

          {/* Special CTA */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <button
                className="w-full h-11 rounded-full text-sm font-medium mb-4"
                style={{ background: GOLD, color: '#0A0A0A' }}
              >
                Enter HIVE
              </button>
              <span className="text-xs text-yellow-400">Questionable</span>
            </div>
            <p className="text-xs text-white/50">Entry CTA</p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-white/70 mb-4">
                Check out our{' '}
                <a href="#" style={{ color: GOLD }}>
                  features
                </a>{' '}
                and get started.
              </p>
              <span className="text-xs text-red-400">Avoid</span>
            </div>
            <p className="text-xs text-white/50">Text links</p>
          </div>

          {/* Borders */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5">
              <div
                className="p-4 rounded-xl mb-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: `0 0 0 1px ${GOLD}40`,
                }}
              >
                <div className="text-sm text-white">Featured Space</div>
              </div>
              <span className="text-xs text-red-400">Avoid</span>
            </div>
            <p className="text-xs text-white/50">Card borders</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 3: Gold Intensity
// =============================================================================

export const Decision_GoldIntensity: Story = {
  name: '3. Gold Intensity Levels',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Gold Intensity
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Fill vs border vs text. How intense should gold be?
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Solid Fill */}
          <div className="space-y-3">
            <div
              className="h-20 rounded-xl flex items-center justify-center"
              style={{ background: GOLD }}
            >
              <span className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
                Solid Fill
              </span>
            </div>
            <p className="text-xs text-white/50">100% - Maximum presence</p>
          </div>

          {/* Soft Fill */}
          <div className="space-y-3">
            <div
              className="h-20 rounded-xl flex items-center justify-center"
              style={{ background: `${GOLD}30` }}
            >
              <span className="text-sm font-medium" style={{ color: GOLD }}>
                Soft Fill
              </span>
            </div>
            <p className="text-xs text-white/50">30% - Subtle background</p>
          </div>

          {/* Border Only */}
          <div className="space-y-3">
            <div
              className="h-20 rounded-xl flex items-center justify-center"
              style={{
                background: 'transparent',
                boxShadow: `0 0 0 1px ${GOLD}`,
              }}
            >
              <span className="text-sm font-medium" style={{ color: GOLD }}>
                Border
              </span>
            </div>
            <p className="text-xs text-white/50">Border only - Outline style</p>
          </div>

          {/* Text Only */}
          <div className="space-y-3">
            <div
              className="h-20 rounded-xl flex items-center justify-center bg-white/5"
            >
              <span className="text-sm font-medium" style={{ color: GOLD }}>
                Gold Text
              </span>
            </div>
            <p className="text-xs text-white/50">Text only - Most subtle</p>
          </div>
        </div>

        {/* In Context */}
        <h3 className="text-sm font-medium text-white mt-8">In Context: Badge</h3>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              Leader
            </span>
            <span className="text-xs text-white/30">Solid</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: `${GOLD}20`, color: GOLD }}
            >
              Leader
            </span>
            <span className="text-xs text-white/30">Soft</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'transparent',
                boxShadow: `0 0 0 1px ${GOLD}`,
                color: GOLD,
              }}
            >
              Leader
            </span>
            <span className="text-xs text-white/30">Outline</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 4: Card Footer Actions
// =============================================================================

export const Decision_CardFooterCTA: Story = {
  name: '4. Card Footer CTA Placement',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Card Footer CTA
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            When a card has a primary action, should the CTA be gold?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* White CTA */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">White CTA</h3>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#1A1A1A',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="h-24 bg-gradient-to-br from-indigo-600 to-purple-700" />
              <div className="p-5">
                <div className="text-xs text-white/50 font-medium mb-1">TOMORROW</div>
                <div className="text-sm font-medium text-white mb-1">Design System Workshop</div>
                <div className="text-xs text-white/50 mb-4">Student Union • 6:00 PM</div>
                <button
                  className="w-full h-10 rounded-full text-sm font-medium"
                  style={{ background: '#FAFAFA', color: '#0A0A0A' }}
                >
                  Join Event
                </button>
              </div>
            </div>
          </div>

          {/* Gold CTA */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Gold CTA</h3>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#1A1A1A',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="h-24 bg-gradient-to-br from-indigo-600 to-purple-700" />
              <div className="p-5">
                <div className="text-xs text-white/50 font-medium mb-1">TOMORROW</div>
                <div className="text-sm font-medium text-white mb-1">Design System Workshop</div>
                <div className="text-xs text-white/50 mb-4">Student Union • 6:00 PM</div>
                <button
                  className="w-full h-10 rounded-full text-sm font-medium"
                  style={{ background: GOLD, color: '#0A0A0A' }}
                >
                  Join Event
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">If gold is rare:</strong> Reserve for "claim" actions only (claim space, claim role).
            <br />
            <strong className="text-white">If gold is CTA:</strong> Use for all primary card actions.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 5: Gold with Glow
// =============================================================================

export const Decision_GoldGlow: Story = {
  name: '5. Gold Glow Effects',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Gold Glow Effects
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Should gold elements have a subtle glow? When?
          </p>
        </div>

        <div className="flex gap-8">
          {/* No Glow */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="h-11 px-8 rounded-full text-sm font-medium"
              style={{ background: GOLD, color: '#0A0A0A' }}
            >
              No Glow
            </button>
            <span className="text-xs text-white/30">Flat</span>
          </div>

          {/* Subtle Glow */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="h-11 px-8 rounded-full text-sm font-medium"
              style={{
                background: GOLD,
                color: '#0A0A0A',
                boxShadow: `0 0 20px ${GOLD}30`,
              }}
            >
              Subtle Glow
            </button>
            <span className="text-xs text-white/30">30% opacity</span>
          </div>

          {/* Medium Glow */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="h-11 px-8 rounded-full text-sm font-medium"
              style={{
                background: GOLD,
                color: '#0A0A0A',
                boxShadow: `0 0 30px ${GOLD}50`,
              }}
            >
              Medium Glow
            </button>
            <span className="text-xs text-white/30">50% opacity</span>
          </div>

          {/* Strong Glow */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="h-11 px-8 rounded-full text-sm font-medium"
              style={{
                background: GOLD,
                color: '#0A0A0A',
                boxShadow: `0 0 40px ${GOLD}70`,
              }}
            >
              Strong Glow
            </button>
            <span className="text-xs text-white/30">70% opacity</span>
          </div>
        </div>

        {/* Hover Glow */}
        <h3 className="text-sm font-medium text-white mt-8">Hover Glow (hover to see)</h3>
        <div className="flex gap-8">
          <button
            className="h-11 px-8 rounded-full text-sm font-medium transition-shadow duration-200"
            style={{ background: GOLD, color: '#0A0A0A' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 30px ${GOLD}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Glow on Hover
          </button>
        </div>
      </div>
    </div>
  ),
};
