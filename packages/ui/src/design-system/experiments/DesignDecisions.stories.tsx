'use client';

/**
 * Design Decisions Index
 *
 * Master index of all unresolved design decisions.
 * Use this as a starting point for design review sessions.
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

const meta: Meta = {
  title: 'Experiments/🎯 Decisions Required',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// DECISION CARD COMPONENT
// =============================================================================

interface DecisionCardProps {
  number: number;
  title: string;
  question: string;
  status: 'unresolved' | 'resolved' | 'in-progress';
  options: string[];
  storyPath: string;
  impact: 'high' | 'medium' | 'low';
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  number,
  title,
  question,
  status,
  options,
  storyPath,
  impact,
}) => {
  const statusColors = {
    unresolved: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30', label: 'Unresolved' },
    resolved: { bg: 'rgba(52,199,89,0.15)', text: '#34C759', label: 'Resolved' },
    'in-progress': { bg: 'rgba(255,204,0,0.15)', text: '#FFCC00', label: 'In Progress' },
  };

  const impactColors = {
    high: { bg: 'rgba(255,59,48,0.1)', text: '#FF6B6B' },
    medium: { bg: 'rgba(255,204,0,0.1)', text: '#FFD93D' },
    low: { bg: 'rgba(52,199,89,0.1)', text: '#6BCB77' },
  };

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200 hover:brightness-105 cursor-pointer"
      style={{
        background: '#141414',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
      onClick={() => {
        // Navigate to story - works in Storybook
        const url = new URL(window.location.href);
        url.searchParams.set('path', storyPath);
        window.location.href = url.toString();
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#FAFAFA' }}
          >
            {number}
          </div>
          <h3 className="text-base font-medium text-white">{title}</h3>
        </div>
        <div className="flex gap-2">
          <span
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{
              background: impactColors[impact].bg,
              color: impactColors[impact].text,
            }}
          >
            {impact.toUpperCase()}
          </span>
          <span
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{
              background: statusColors[status].bg,
              color: statusColors[status].text,
            }}
          >
            {statusColors[status].label}
          </span>
        </div>
      </div>

      <p className="text-sm text-white/70 mb-4">{question}</p>

      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">Options</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <span
              key={option}
              className="px-3 py-1 rounded-full text-xs"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {option}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-white/30">
          Click to view comparison →
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN INDEX STORY
// =============================================================================

export const Index: Story = {
  name: '📋 Decision Index',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-white">
            Design Decisions Required
          </h1>
          <p className="text-base text-white/60 max-w-2xl">
            These are unresolved design decisions that need team input.
            Each decision has a lab with visual comparisons to help inform the choice.
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />
              <span className="text-white/50">Unresolved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#FFCC00' }} />
              <span className="text-white/50">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#34C759' }} />
              <span className="text-white/50">Resolved</span>
            </div>
          </div>
        </div>

        {/* Decision Cards Grid */}
        <div className="grid grid-cols-2 gap-6">
          <DecisionCard
            number={1}
            title="Color Palette"
            question="Should backgrounds have warm gold undertones or stay pure neutral gray?"
            status="unresolved"
            options={['Warm (#0A0A09)', 'Neutral (#0A0A0A)']}
            storyPath="/story/experiments-🎯-decisions-color-palette-lab--decision-background-tiers"
            impact="high"
          />

          <DecisionCard
            number={2}
            title="Typography Font"
            question="Which font should we use for headlines and display text?"
            status="unresolved"
            options={['Clash Display', 'Geist Sans']}
            storyPath="/story/experiments-🎯-decisions-typography-font-lab--decision-display-text"
            impact="high"
          />

          <DecisionCard
            number={3}
            title="Motion Timing"
            question="What's the right duration for standard transitions? Which easing curve?"
            status="unresolved"
            options={['200ms', '250ms', '300ms', 'ease-out', 'spring']}
            storyPath="/story/experiments-🎯-decisions-motion-timing-lab--decision-button-press"
            impact="medium"
          />

          <DecisionCard
            number={4}
            title="Gold Accent Usage"
            question="When should gold appear in the UI? CTAs, achievements, or brand only?"
            status="unresolved"
            options={['Brand only', 'Leader status', 'Special CTAs', 'All primary']}
            storyPath="/story/experiments-🎯-decisions-gold-accent-lab--decision-button-variants"
            impact="high"
          />

          <DecisionCard
            number={5}
            title="Focus Ring"
            question="What opacity and color should focus rings have for WCAG compliance?"
            status="unresolved"
            options={['White 50%', 'White 70%', 'Gold']}
            storyPath="/story/experiments-🎯-decisions-focus-ring-lab--decision-input-focus"
            impact="medium"
          />

          <DecisionCard
            number={6}
            title="Card Border Warmth"
            question="Should card borders have subtle gold warmth or stay pure white?"
            status="unresolved"
            options={['Neutral', 'Gold 10%', 'Gold 20%', 'Gold 30%']}
            storyPath="/story/experiments-🎯-decisions-card-warmth-lab--decision-warmth-levels"
            impact="medium"
          />
        </div>

        {/* How to Use */}
        <div
          className="rounded-2xl p-6 mt-8"
          style={{
            background: 'rgba(255,255,255,0.02)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="text-lg font-medium text-white mb-4">How to Use</h2>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-white/70 mb-2">1. Review Comparisons</p>
              <p className="text-white/40">
                Click each decision card to see side-by-side visual comparisons
                of the options in real component contexts.
              </p>
            </div>
            <div>
              <p className="text-white/70 mb-2">2. Make Decision</p>
              <p className="text-white/40">
                Discuss with the team and pick the option that best fits
                HIVE's design direction and technical constraints.
              </p>
            </div>
            <div>
              <p className="text-white/70 mb-2">3. Document & Implement</p>
              <p className="text-white/40">
                Update design-system-v2.ts with canonical values and
                document the decision in LANGUAGE.md.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(255,204,0,0.05)',
            boxShadow: '0 0 0 1px rgba(255,204,0,0.15)',
          }}
        >
          <p className="text-sm text-[#FFCC00]/80">
            <strong>Priority:</strong> Resolve Color Palette, Typography Font, and Gold Accent
            decisions first — these have cascading effects on all other components.
          </p>
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// SUMMARY STORY - All decisions in one view
// =============================================================================

export const QuickSummary: Story = {
  name: '📊 Quick Summary',
  render: () => (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-white">Decision Summary</h1>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-white/40 uppercase tracking-wider">
              <th className="pb-4 pr-4">Decision</th>
              <th className="pb-4 pr-4">Options</th>
              <th className="pb-4 pr-4">Current</th>
              <th className="pb-4">Impact</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {[
              {
                decision: 'Color Palette',
                options: 'Warm vs Neutral',
                current: 'Neutral (#0A0A0A)',
                impact: 'High',
              },
              {
                decision: 'Typography Font',
                options: 'Clash Display vs Geist',
                current: 'Geist Sans',
                impact: 'High',
              },
              {
                decision: 'Motion Timing',
                options: '200ms vs 250ms vs 300ms',
                current: 'Mixed (150-300ms)',
                impact: 'Medium',
              },
              {
                decision: 'Gold Accent',
                options: 'Brand only vs CTAs',
                current: 'Brand + Leader only',
                impact: 'High',
              },
              {
                decision: 'Focus Ring',
                options: '50% vs 70% vs Gold',
                current: 'White 50%',
                impact: 'Medium',
              },
              {
                decision: 'Card Warmth',
                options: 'Neutral vs Gold-tinted',
                current: 'Neutral',
                impact: 'Medium',
              },
            ].map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-3 pr-4 text-white">{row.decision}</td>
                <td className="py-3 pr-4 text-white/60">{row.options}</td>
                <td className="py-3 pr-4 text-white/40">{row.current}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      row.impact === 'High'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {row.impact}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-2">Post-Decision Actions</h3>
          <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
            <li>Update <code className="text-white/40">packages/tokens/src/design-system-v2.ts</code></li>
            <li>Document in <code className="text-white/40">docs/design-system/LANGUAGE.md</code></li>
            <li>Remove conflicting tokens if consolidating</li>
            <li>Update affected components</li>
          </ol>
        </div>
      </div>
    </div>
  ),
};
