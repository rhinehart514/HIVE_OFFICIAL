'use client';

/**
 * ScrollAreaLab - Focused Experiments
 *
 * Testing: thumb opacity, scrollbar width, visibility behavior
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/ScrollArea Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

const CardWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="space-y-3">
    <div className="text-xs text-white/50 font-mono">{label}</div>
    <div
      className="rounded-2xl p-6 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </div>
  </div>
);

const ScrollContent = () => (
  <div className="space-y-2 p-2">
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="h-8 rounded bg-white/5 flex items-center px-3 text-xs text-white/50">
        Item {i + 1}
      </div>
    ))}
  </div>
);

// ============================================
// THUMB OPACITY
// ============================================
export const Thumb_Opacity = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Thumb Opacity</h2>
      <p className="text-sm text-white/50">How visible the scrollbar thumb should be</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Subtle (Recommended)">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-2.5">
            <ScrollContent />
          </div>
          {/* Simulated scrollbar */}
          <div className="absolute right-0 top-0 bottom-0 w-2.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20 hover:bg-white/40 transition-colors" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Minimal, doesn't distract from content</p>
      </CardWrapper>

      <CardWrapper label="B: Light">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-2.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/30 hover:bg-white/50 transition-colors" />
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Bold">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-2.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/40 hover:bg-white/60 transition-colors" />
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// SCROLLBAR WIDTH
// ============================================
export const Scrollbar_Width = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Scrollbar Width</h2>
      <p className="text-sm text-white/50">How wide the scrollbar track should be</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Thin 6px (Recommended)">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Minimal footprint, modern feel</p>
      </CardWrapper>

      <CardWrapper label="B: Default 10px">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-2.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-2.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Wide 14px">
        <div className="relative h-48 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-3.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-3.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// VISIBILITY BEHAVIOR
// ============================================
export const Visibility_Behavior = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Visibility Behavior</h2>
      <p className="text-sm text-white/50">When the scrollbar should appear</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Auto (Recommended)">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Shows when content overflows</p>
      </CardWrapper>

      <CardWrapper label="B: Hover Only">
        <div className="group relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">Hidden until hover (cleaner but less discoverable)</p>
      </CardWrapper>

      <CardWrapper label="C: Always Visible">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-white/5 flex items-center px-3 text-xs text-white/50">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-full w-full rounded-full bg-white/10" />
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">Always shows track even without overflow</p>
      </CardWrapper>

      <CardWrapper label="D: Scroll Only">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px] opacity-0">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">Only visible while actively scrolling</p>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// THUMB SHAPE
// ============================================
export const Thumb_Shape = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Thumb Shape</h2>
      <p className="text-sm text-white/50">Corner rounding of the thumb</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Fully Rounded (Recommended)">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-1/3 w-full rounded-full bg-white/20" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Pill shape, soft and modern</p>
      </CardWrapper>

      <CardWrapper label="B: Rounded-lg">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-1/3 w-full rounded-lg bg-white/20" />
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Square">
        <div className="relative h-40 w-full rounded-lg border border-white/10 bg-[#0a0a09] overflow-hidden">
          <div className="h-full overflow-y-auto pr-1.5">
            <ScrollContent />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1.5 p-[1px]">
            <div className="h-1/3 w-full rounded-none bg-white/20" />
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);
