'use client';

/**
 * Card Warmth Decision Lab
 *
 * DECISION: Border warmth levels
 * - Pure white borders (neutral)
 * - Gold-tinted borders (10%, 20%, 30%)
 * - When to use warmth vs neutral
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions/Card Warmth Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

const GOLD = '#FFD700';

// =============================================================================
// HELPER: Demo Card
// =============================================================================

const DemoCard: React.FC<{
  borderColor: string;
  label: string;
  showActivity?: boolean;
}> = ({ borderColor, label, showActivity }) => (
  <div className="space-y-2">
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:brightness-105"
      style={{
        background: '#1A1A1A',
        boxShadow: `0 0 0 1px ${borderColor}`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
        <div>
          <div className="text-sm font-medium text-white flex items-center gap-2">
            Design Club
            {showActivity && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: GOLD }}
              />
            )}
          </div>
          <div className="text-xs text-white/50">127 members</div>
        </div>
      </div>
      <div className="text-xs text-white/60 line-clamp-2">
        A community for designers exploring new ideas.
      </div>
    </div>
    <p className="text-xs text-white/40 text-center">{label}</p>
  </div>
);

// =============================================================================
// DECISION 1: Warmth Levels
// =============================================================================

export const Decision_WarmthLevels: Story = {
  name: '1. Decision: Border Warmth Levels',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Card Border Warmth
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Should card borders be pure white or have subtle gold warmth?
            Compare neutral vs warm tints.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <DemoCard
            borderColor="rgba(255,255,255,0.06)"
            label="Neutral 6%"
          />
          <DemoCard
            borderColor="rgba(255,255,255,0.10)"
            label="Neutral 10%"
          />
          <DemoCard
            borderColor={`rgba(255,215,0,0.10)`}
            label="Gold 10%"
          />
          <DemoCard
            borderColor={`rgba(255,215,0,0.20)`}
            label="Gold 20%"
          />
          <DemoCard
            borderColor={`rgba(255,215,0,0.30)`}
            label="Gold 30%"
          />
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Neutral:</strong> Clean, minimal, no color contamination.
            <br />
            <strong className="text-white">Gold-tinted:</strong> Warm, brand-aligned, but may dilute gold rarity.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 2: Interactive vs Static
// =============================================================================

export const Decision_InteractiveVsStatic: Story = {
  name: '2. Interactive vs Static Cards',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Interactive vs Static Cards
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Should active/interactive cards have warmer borders than static content?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Same treatment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option A: Same Treatment</h3>
            <p className="text-xs text-white/40">All cards use same border style</p>
            <div className="p-6 rounded-xl bg-[#141414] space-y-4">
              <DemoCard
                borderColor="rgba(255,255,255,0.06)"
                label="Interactive (Space)"
              />
              <div
                className="rounded-xl p-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-sm text-white/70">
                  This is a static content card with the same border style.
                </div>
              </div>
            </div>
          </div>

          {/* Different treatment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option B: Differentiated</h3>
            <p className="text-xs text-white/40">Interactive cards warmer than static</p>
            <div className="p-6 rounded-xl bg-[#141414] space-y-4">
              <DemoCard
                borderColor={`rgba(255,215,0,0.15)`}
                label="Interactive (Space)"
                showActivity
              />
              <div
                className="rounded-xl p-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-sm text-white/70">
                  Static content card stays neutral.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 3: Context Application
// =============================================================================

const SpaceCard: React.FC<{ borderColor: string }> = ({ borderColor }) => (
  <div
    className="rounded-2xl p-4 cursor-pointer"
    style={{
      background: '#1A1A1A',
      boxShadow: `0 0 0 1px ${borderColor}`,
    }}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
      <div>
        <div className="text-sm font-medium text-white">Design Club</div>
        <div className="text-xs text-white/50">127 members</div>
      </div>
    </div>
  </div>
);

const EventCard: React.FC<{ borderColor: string }> = ({ borderColor }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      background: '#1A1A1A',
      boxShadow: `0 0 0 1px ${borderColor}`,
    }}
  >
    <div className="h-20 bg-gradient-to-br from-indigo-600 to-purple-700" />
    <div className="p-4">
      <div className="text-xs text-white/50 mb-1">TOMORROW</div>
      <div className="text-sm font-medium text-white">Workshop</div>
    </div>
  </div>
);

const ProfileCard: React.FC<{ borderColor: string }> = ({ borderColor }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      background: '#1A1A1A',
      boxShadow: `0 0 0 1px ${borderColor}`,
    }}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
      <div>
        <div className="text-sm font-medium text-white">Alex Chen</div>
        <div className="text-xs text-white/50">@alexchen</div>
      </div>
    </div>
  </div>
);

export const Decision_ContextApplication: Story = {
  name: '3. Different Card Types',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Warmth Across Card Types
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Same warmth level applied to Space, Event, and Profile cards.
          </p>
        </div>

        <div className="space-y-8">
          {[
            { label: 'Neutral (6%)', color: 'rgba(255,255,255,0.06)' },
            { label: 'Gold 10%', color: 'rgba(255,215,0,0.10)' },
            { label: 'Gold 20%', color: 'rgba(255,215,0,0.20)' },
          ].map(({ label, color }) => (
            <div key={label} className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">{label}</h3>
              <div className="grid grid-cols-3 gap-6">
                <SpaceCard borderColor={color} />
                <EventCard borderColor={color} />
                <ProfileCard borderColor={color} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 4: Hierarchy with Warmth
// =============================================================================

export const Decision_WarmthHierarchy: Story = {
  name: '4. Card Hierarchy with Warmth',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            Warmth as Hierarchy Signal
          </h1>
          <p className="text-sm text-white/50 max-w-lg">
            Can warmth levels create visual hierarchy? Featured vs regular cards.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Uniform */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option A: Uniform Borders</h3>
            <div className="p-6 rounded-xl bg-[#141414] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: '#1A1A1A',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="text-sm font-medium text-white">Space {i}</div>
                    <div className="text-xs text-white/50">Description</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hierarchical */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/70">Option B: Warmth = Importance</h3>
            <div className="p-6 rounded-xl bg-[#141414] space-y-4">
              {/* Featured */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: '#1A1A1A',
                  boxShadow: `0 0 0 1px rgba(255,215,0,0.25), 0 0 20px rgba(255,215,0,0.08)`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFD700] text-black font-medium">
                    Featured
                  </span>
                </div>
                <div className="text-sm font-medium text-white">Top Space</div>
                <div className="text-xs text-white/50">Most active this week</div>
              </div>
              {/* Regular */}
              <div className="grid grid-cols-2 gap-4">
                {[2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: '#1A1A1A',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="text-sm font-medium text-white">Space {i}</div>
                    <div className="text-xs text-white/50">Description</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <p className="text-sm text-white/60">
            <strong className="text-white">Risk:</strong> Using warmth for hierarchy may conflict with activity indicators.
            <br />
            <strong className="text-white">Alternative:</strong> Use glow, not border warmth, for featured items.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// DECISION 5: Hover State Warmth
// =============================================================================

export const Decision_HoverWarmth: Story = {
  name: '5. Hover State Warmth',
  render: () => {
    const HoverCard: React.FC<{
      defaultBorder: string;
      hoverBorder: string;
      label: string;
    }> = ({ defaultBorder, hoverBorder, label }) => {
      const [hovered, setHovered] = React.useState(false);

      return (
        <div className="space-y-2">
          <div
            className="rounded-xl p-4 cursor-pointer transition-all duration-200"
            style={{
              background: hovered ? '#242424' : '#1A1A1A',
              boxShadow: `0 0 0 1px ${hovered ? hoverBorder : defaultBorder}`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="text-sm font-medium text-white">Hover me</div>
            <div className="text-xs text-white/50">See border change</div>
          </div>
          <p className="text-xs text-white/40 text-center">{label}</p>
        </div>
      );
    };

    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-white">
              Hover State Border Changes
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              Should borders warm up on hover, or just become more visible?
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <HoverCard
              defaultBorder="rgba(255,255,255,0.06)"
              hoverBorder="rgba(255,255,255,0.12)"
              label="White → Brighter"
            />
            <HoverCard
              defaultBorder="rgba(255,255,255,0.06)"
              hoverBorder="rgba(255,215,0,0.15)"
              label="White → Gold"
            />
            <HoverCard
              defaultBorder="rgba(255,215,0,0.10)"
              hoverBorder="rgba(255,215,0,0.25)"
              label="Gold → Warmer"
            />
            <HoverCard
              defaultBorder="rgba(255,255,255,0.06)"
              hoverBorder="rgba(255,255,255,0.06)"
              label="No change"
            />
          </div>
        </div>
      </div>
    );
  },
};
