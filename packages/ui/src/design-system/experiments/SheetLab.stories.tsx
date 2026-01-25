'use client';

/**
 * SheetLab - Focused Experiments
 *
 * Testing: overlay opacity, panel surface, slide timing
 * Aligning with: Apple Glass Dark (Modal), 60% overlay (standard)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Experiments/Sheet Lab',
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
// OVERLAY OPACITY
// ============================================
export const Overlay_Opacity = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Overlay Opacity</h2>
      <p className="text-sm text-white/50">How dark the backdrop should be</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: 60% (Recommended)">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/10 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 border-l border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
        <p className="text-xs text-green-400 mt-3">Matches Modal overlay</p>
      </CardWrapper>

      <CardWrapper label="B: 40%">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/10 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 border-l border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            }}
          />
        </div>
      </CardWrapper>

      <CardWrapper label="C: 80%">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded mb-2" />
            <div className="w-1/2 h-2 bg-white/10 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/80" />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 border-l border-white/10"
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
      <p className="text-sm text-white/50">How the sheet panel looks</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Apple Glass Dark (Recommended)">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute right-0 top-0 bottom-0 w-28 p-3"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded" />
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Matches Modal/Card surface</p>
      </CardWrapper>

      <CardWrapper label="B: Solid Surface">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute right-0 top-0 bottom-0 w-28 p-3 bg-[#1c1c1c] border-l border-white/10"
          >
            <div className="w-full h-2 bg-white/10 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/10 rounded" />
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Glass Blur">
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-[#0a0a09] p-3">
            <div className="w-full h-2 bg-white/20 rounded mb-2" />
            <div className="w-3/4 h-2 bg-white/20 rounded" />
          </div>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 bottom-0 w-28 p-3 backdrop-blur-xl bg-black/40 border-l border-white/10"
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
// SLIDE TIMING
// ============================================
export const Slide_Timing = () => {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Slide Timing</h2>
        <p className="text-sm text-white/50">Animation duration (click to test)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: 200ms (Recommended)">
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
            <div
              className="absolute right-0 top-0 bottom-0 w-16 border-l border-white/10 transition-transform ease-out"
              style={{
                background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                transitionDuration: '200ms',
                transform: openA ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
          </div>
          <button
            onClick={() => setOpenA(!openA)}
            className="mt-3 h-8 px-3 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {openA ? 'Close' : 'Open'} 200ms
          </button>
          <p className="text-xs text-green-400 mt-2">Quick but smooth</p>
        </CardWrapper>

        <CardWrapper label="B: 300ms">
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
            <div
              className="absolute right-0 top-0 bottom-0 w-16 border-l border-white/10 transition-transform ease-out"
              style={{
                background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                transitionDuration: '300ms',
                transform: openB ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
          </div>
          <button
            onClick={() => setOpenB(!openB)}
            className="mt-3 h-8 px-3 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {openB ? 'Close' : 'Open'} 300ms
          </button>
        </CardWrapper>

        <CardWrapper label="C: 150ms">
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a09]">
            <div
              className="absolute right-0 top-0 bottom-0 w-16 border-l border-white/10 transition-transform ease-out"
              style={{
                background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                transitionDuration: '150ms',
                transform: openC ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
          </div>
          <button
            onClick={() => setOpenC(!openC)}
            className="mt-3 h-8 px-3 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {openC ? 'Close' : 'Open'} 150ms
          </button>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// CLOSE BUTTON
// ============================================
export const Close_Button = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Close Button</h2>
      <p className="text-sm text-white/50">How users dismiss the sheet</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: X Icon Top-Right (Recommended)">
        <div
          className="relative w-full h-28 rounded-lg p-3"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <button className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
          <p className="text-xs text-white/40 mt-6">Sheet content</p>
        </div>
        <p className="text-xs text-green-400 mt-3">Clear, accessible</p>
      </CardWrapper>

      <CardWrapper label="B: Text Button">
        <div
          className="relative w-full h-28 rounded-lg p-3"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <button className="absolute top-2 right-2 h-6 px-2 rounded-md text-xs font-medium text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            Close
          </button>
          <p className="text-xs text-white/40 mt-6">Sheet content</p>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Overlay Click Only">
        <div
          className="relative w-full h-28 rounded-lg p-3"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <p className="text-xs text-white/40">Sheet content</p>
          <p className="text-label-xs text-white/30 mt-2 italic">Click overlay to close</p>
        </div>
      </CardWrapper>
    </div>
  </div>
);
