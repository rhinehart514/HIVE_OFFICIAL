'use client';

/**
 * DrawerLab - Focused Experiments
 *
 * Testing: overlay opacity, panel surface, handle style, slide timing
 * Aligning with: Sheet (60% overlay, Apple Glass Dark, 300ms)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Experiments/Drawer Lab',
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

// ============================================
// OVERLAY OPACITY (Should match Sheet)
// ============================================
export const Overlay_Opacity = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Overlay Opacity</h2>
      <p className="text-sm text-white/50">Should match Sheet for consistency</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: 60% (Recommended)">
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/10 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 top-0 bottom-0 w-28 border-r border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
        <p className="text-xs text-green-400 mt-3">Matches Sheet/Modal (LOCKED)</p>
      </CardWrapper>

      <CardWrapper label="B: 80% (Current)">
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/10 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/80" />
          <div
            className="absolute left-0 top-0 bottom-0 w-28 border-r border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// PANEL SURFACE
// ============================================
export const Panel_Surface = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Panel Surface</h2>
      <p className="text-sm text-white/50">Should match Sheet for consistency</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Apple Glass Dark (Recommended)">
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 top-0 bottom-0 w-32 p-3 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '8px 0 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Matches Sheet (LOCKED)</p>
      </CardWrapper>

      <CardWrapper label="B: Solid Surface (Current)">
        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 top-0 bottom-0 w-32 p-3 bg-[#1a1a1a] border-r border-white/10"
          >
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded" />
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// HANDLE STYLE (Bottom Drawer)
// ============================================
export const Handle_Style = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Handle Style (Bottom Drawer)</h2>
      <p className="text-sm text-white/50">Visual indicator for draggable bottom sheets</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Pill Handle (Recommended)">
        <div
          className="relative w-full h-32 rounded-t-xl border border-white/10 backdrop-blur-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>
          <div className="text-xs text-white/50">Bottom drawer content</div>
        </div>
        <p className="text-xs text-green-400 mt-3">Clear, familiar iOS/Android pattern</p>
      </CardWrapper>

      <CardWrapper label="B: Thin Line">
        <div
          className="relative w-full h-32 rounded-t-xl border border-white/10 backdrop-blur-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-12 h-0.5 rounded-full bg-white/20" />
          </div>
          <div className="text-xs text-white/50">Bottom drawer content</div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Wide Bar">
        <div
          className="relative w-full h-32 rounded-t-xl border border-white/10 backdrop-blur-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="w-16 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="text-xs text-white/50">Bottom drawer content</div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// SLIDE TIMING
// ============================================
export const Slide_Timing = () => {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Slide Timing</h2>
        <p className="text-sm text-white/50">Should match Sheet for consistency</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: 300ms (Recommended)">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
            <div
              className="absolute left-0 top-0 bottom-0 w-20 border-r border-white/10 transition-transform ease-out"
              style={{
                background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                transitionDuration: '300ms',
                transform: openA ? 'translateX(0)' : 'translateX(-100%)',
              }}
            />
          </div>
          <button
            onClick={() => setOpenA(!openA)}
            className="mt-3 h-8 px-3 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {openA ? 'Close' : 'Open'} 300ms
          </button>
          <p className="text-xs text-green-400 mt-2">Matches Sheet (LOCKED)</p>
        </CardWrapper>

        <CardWrapper label="B: 200ms (Current)">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
            <div
              className="absolute left-0 top-0 bottom-0 w-20 border-r border-white/10 transition-transform ease-out"
              style={{
                background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                transitionDuration: '200ms',
                transform: openB ? 'translateX(0)' : 'translateX(-100%)',
              }}
            />
          </div>
          <button
            onClick={() => setOpenB(!openB)}
            className="mt-3 h-8 px-3 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {openB ? 'Close' : 'Open'} 200ms
          </button>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ALL SIDES PREVIEW
// ============================================
export const All_Sides = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">All Sides Preview</h2>
      <p className="text-sm text-white/50">Drawer can slide from any edge</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="From Right (Default)">
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
          <div
            className="absolute right-0 top-0 bottom-0 w-24 border-l border-white/10 rounded-l-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
      </CardWrapper>

      <CardWrapper label="From Left">
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
          <div
            className="absolute left-0 top-0 bottom-0 w-24 border-r border-white/10 rounded-r-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
      </CardWrapper>

      <CardWrapper label="From Bottom (Mobile Sheet)">
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
          <div
            className="absolute bottom-0 left-0 right-0 h-16 border-t border-white/10 rounded-t-xl p-2"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          >
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="From Top">
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
          <div
            className="absolute top-0 left-0 right-0 h-16 border-b border-white/10 rounded-b-xl p-2"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
      </CardWrapper>
    </div>
  </div>
);
