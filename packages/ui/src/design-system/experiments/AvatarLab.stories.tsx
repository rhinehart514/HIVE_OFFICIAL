'use client';

/**
 * AvatarLab - Focused Experiments
 *
 * LOCKED from DECISIONS.md: Rounded squares, never circles
 * Testing: radius, sizes, fallbacks, status indicators
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Avatar Lab',
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
// RADIUS OPTIONS
// ============================================
export const Radius = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Avatar Radius</h2>
      <p className="text-sm text-white/50">LOCKED: Rounded squares, never circles</p>
    </div>

    <div className="grid grid-cols-4 gap-6">
      <CardWrapper label="A: rounded-lg (8px)">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500" />
        </div>
      </CardWrapper>

      <CardWrapper label="B: rounded-xl (12px)">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500" />
        </div>
      </CardWrapper>

      <CardWrapper label="C: rounded-2xl (16px)">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500" />
        </div>
      </CardWrapper>

      <CardWrapper label="D: rounded-full (circle) ❌">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-30" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-30" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-30" />
        </div>
        <p className="text-xs text-red-400 mt-2">Rejected: too generic</p>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// SIZES
// ============================================
export const Sizes = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Avatar Sizes</h2>
      <p className="text-sm text-white/50">Size scale with consistent radius</p>
    </div>

    <CardWrapper label="Size Scale (rounded-xl)">
      <div className="flex items-end gap-4">
        <div className="text-center">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">xs</span>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">sm</span>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">md</span>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">lg</span>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">xl</span>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2" />
          <span className="text-xs text-white/40">2xl</span>
        </div>
      </div>
    </CardWrapper>
  </div>
);

// ============================================
// FALLBACKS
// ============================================
export const Fallbacks = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Avatar Fallbacks</h2>
      <p className="text-sm text-white/50">When no image is available</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Initials (Glass)">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium text-white/80"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >JD</div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-medium text-white/80"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >AB</div>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Initials (Solid)">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-medium text-white/70">JD</div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-base font-medium text-white/70">AB</div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Initials (Colored)">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-sm font-medium text-purple-300">JD</div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-base font-medium text-blue-300">AB</div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// STATUS INDICATORS
// ============================================
export const Status = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Status Indicators</h2>
      <p className="text-sm text-white/50">Online, away, busy, offline</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Corner Dot">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1c1c1c]" />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#1c1c1c]" />
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white/30 border-2 border-[#1c1c1c]" />
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Ring Indicator">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-green-500 ring-offset-2 ring-offset-[#1c1c1c]" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-amber-500 ring-offset-2 ring-offset-[#1c1c1c]" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-white/20 ring-offset-2 ring-offset-[#1c1c1c]" />
        </div>
      </CardWrapper>

      <CardWrapper label="C: Gold Ring (Active/Special)">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-[#FFD700]/50 ring-offset-2 ring-offset-[#1c1c1c]" />
          <div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500"
            style={{
              boxShadow: '0 0 0 2px #1c1c1c, 0 0 0 4px rgba(255,215,0,0.4), 0 0 12px rgba(255,215,0,0.2)',
            }}
          />
        </div>
      </CardWrapper>

      <CardWrapper label="D: Breathing Dot (Online)">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1c1c1c] animate-pulse" />
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// AVATAR GROUPS
// ============================================
export const Groups = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Avatar Groups</h2>
      <p className="text-sm text-white/50">Stacked avatars for members</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Overlap Stack">
        <div className="flex -space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-10 h-10 rounded-xl bg-white/10 ring-2 ring-[#1c1c1c] flex items-center justify-center text-xs font-medium text-white/60">+5</div>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Tight Stack">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-[#1c1c1c]" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 ring-2 ring-[#1c1c1c]" />
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Final Candidates</h2>
      <p className="text-sm text-white/50">Recommended avatar style</p>
    </div>

    <CardWrapper label="RECOMMENDED: rounded-xl + corner dot + glass fallback">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="relative mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1c1c1c]" />
          </div>
          <span className="text-xs text-white/40">with image</span>
        </div>
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium text-white/80 mb-2"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >JD</div>
          <span className="text-xs text-white/40">fallback</span>
        </div>
        <div className="text-center">
          <div className="flex -space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-[#1c1c1c]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-[#1c1c1c]" />
            <div className="w-8 h-8 rounded-lg bg-white/10 ring-2 ring-[#1c1c1c] flex items-center justify-center text-label-xs font-medium text-white/60">+3</div>
          </div>
          <span className="text-xs text-white/40">group</span>
        </div>
      </div>
    </CardWrapper>
  </div>
);
