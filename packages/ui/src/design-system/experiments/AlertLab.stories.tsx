'use client';

/**
 * AlertLab - Focused Experiments
 *
 * Testing: border style, background tint, icon style
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Alert Lab',
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
// BORDER STYLE
// ============================================
export const Border_Style = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Border Style</h2>
      <p className="text-sm text-white/50">How to frame the alert</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Full Border (Recommended)">
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Error</h5>
              <p className="text-sm text-white/50">Something went wrong.</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Consistent with Card border pattern</p>
      </CardWrapper>

      <CardWrapper label="B: Left Accent">
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-500">
          <div className="flex items-start gap-3">
            <span className="text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Error</h5>
              <p className="text-sm text-white/50">Something went wrong.</p>
            </div>
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// COLOR VARIANTS
// ============================================
export const Color_Variants = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Color Variants</h2>
      <p className="text-sm text-white/50">Semantic colors for different states</p>
    </div>

    <div className="space-y-4">
      <CardWrapper label="Default (Neutral)">
        <div className="rounded-xl p-4 bg-[#1a1a1a] border border-white/10">
          <div className="flex items-start gap-3">
            <span className="text-white/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Information</h5>
              <p className="text-sm text-white/50">Some informational message.</p>
            </div>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="Success (Green)">
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <span className="text-green-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Success</h5>
              <p className="text-sm text-white/50">Operation completed successfully.</p>
            </div>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="Warning (Amber)">
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <span className="text-amber-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Warning</h5>
              <p className="text-sm text-white/50">Please review before continuing.</p>
            </div>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="Error (Red)">
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Error</h5>
              <p className="text-sm text-white/50">Something went wrong.</p>
            </div>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="Gold (Achievement - Recommended for special)">
        <div className="rounded-xl p-4 bg-[#FFD700]/10 border border-[#FFD700]/20">
          <div className="flex items-start gap-3">
            <span className="text-[#FFD700]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </span>
            <div>
              <h5 className="text-sm font-medium text-white mb-1">Achievement Unlocked</h5>
              <p className="text-sm text-white/50">You've unlocked something special!</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Gold reserved for achievements/special moments</p>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// BACKGROUND TINT OPACITY
// ============================================
export const Background_Tint = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Background Tint Opacity</h2>
      <p className="text-sm text-white/50">How strong the colored background should be</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: 10% (Recommended)">
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-sm">Success message</span>
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Subtle, doesn't overwhelm</p>
      </CardWrapper>

      <CardWrapper label="B: 5%">
        <div className="rounded-xl p-4 bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-sm">Success message</span>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: 15%">
        <div className="rounded-xl p-4 bg-green-500/15 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-sm">Success message</span>
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);
