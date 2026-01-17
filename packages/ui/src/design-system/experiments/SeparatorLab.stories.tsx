'use client';

/**
 * SeparatorLab - Divider Style Experiments
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Separator Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

const CardWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="space-y-3">
    <div className="text-xs text-white/50 font-mono">{label}</div>
    <div
      className="rounded-2xl p-8 backdrop-blur-xl min-w-[300px]"
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </div>
  </div>
);

// ============================================
// STYLE OPTIONS
// ============================================
export const Style_Options = () => {
  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Separator Style Options</h2>
        <p className="text-sm text-white/50">Divider line treatment</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Solid">
          <div className="space-y-4">
            <div className="text-sm text-white/60">Item above</div>
            <div className="w-full h-px bg-white/[0.08]" />
            <div className="text-sm text-white/60">Item below</div>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Gradient Fade (current)">
          <div className="space-y-4">
            <div className="text-sm text-white/60">Item above</div>
            <div
              className="w-full h-px"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
              }}
            />
            <div className="text-sm text-white/60">Item below</div>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Subtle (50% opacity)">
          <div className="space-y-4">
            <div className="text-sm text-white/60">Item above</div>
            <div className="w-full h-px bg-white/[0.04]" />
            <div className="text-sm text-white/60">Item below</div>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Inset Shadow">
          <div className="space-y-4">
            <div className="text-sm text-white/60">Item above</div>
            <div
              className="w-full h-px"
              style={{
                background: 'rgba(0,0,0,0.4)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
              }}
            />
            <div className="text-sm text-white/60">Item below</div>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDATIONS
// ============================================
export const Recommendations = () => {
  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My pick for separator</p>
      </div>

      <CardWrapper label="B: Gradient Fade">
        <div className="space-y-4">
          <div className="text-sm text-white/60">Content above</div>
          <div
            className="w-full h-px"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
            }}
          />
          <div className="text-sm text-white/60">Content below</div>
        </div>
      </CardWrapper>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Style: B - Gradient fade (elegant, not harsh)</p>
          <p className="text-amber-400">Height: 1px</p>
          <p className="text-amber-400">Color: rgba(255,255,255,0.08)</p>
          <p className="text-amber-400">Fade: 20% to 80% visible range</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Subtle divider that doesn't cut the design</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
