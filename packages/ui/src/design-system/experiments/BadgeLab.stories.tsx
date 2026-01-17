'use client';

/**
 * BadgeLab - Focused Experiments
 *
 * Aligning with locked styles:
 * - Floating/pop (like Input, Card)
 * - Gold for special only
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Badge Lab',
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
// STYLE OPTIONS
// ============================================
export const Styles = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Badge Styles</h2>
      <p className="text-sm text-white/50">Flat vs floating vs glass</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Flat (bg only)">
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white/70 bg-white/10">Default</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-green-400 bg-green-500/20">Success</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-red-400 bg-red-500/20">Error</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-amber-400 bg-amber-500/20">Warning</span>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Floating (Pop)">
        <div className="flex flex-wrap gap-2">
          {['Default', 'New', 'Beta', 'Pro'].map((text) => (
            <span
              key={text}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
              style={{
                background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >{text}</span>
          ))}
        </div>
      </CardWrapper>

      <CardWrapper label="C: Glass">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-white/70 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Glass</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-white/70 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >Subtle</span>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// SHAPES
// ============================================
export const Shapes = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Badge Shapes</h2>
      <p className="text-sm text-white/50">Pill vs rounded</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Pill (rounded-full)">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
            style={{
              background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Pill Badge</span>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Rounded (rounded-lg)">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/80"
            style={{
              background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Rounded Badge</span>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Square (rounded-md)">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-medium text-white/80"
            style={{
              background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Square Badge</span>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// STATUS VARIANTS
// ============================================
export const Status_Variants = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Status Variants</h2>
      <p className="text-sm text-white/50">Success, error, warning, info</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Tinted Background">
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-green-400 bg-green-500/20">Success</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-red-400 bg-red-500/20">Error</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-amber-400 bg-amber-500/20">Warning</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-blue-400 bg-blue-500/20">Info</span>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Floating + Tinted">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-green-300"
            style={{
              background: 'linear-gradient(180deg, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.15) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Success</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-red-300"
            style={{
              background: 'linear-gradient(180deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.15) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Error</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-amber-300"
            style={{
              background: 'linear-gradient(180deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.15) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Warning</span>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Dot + Label">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Away
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            Offline
          </span>
        </div>
      </CardWrapper>

      <CardWrapper label="D: Solid Colors">
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white bg-green-500">Success</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white bg-red-500">Error</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white bg-amber-500">Warning</span>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// SPECIAL BADGES
// ============================================
export const Special_Badges = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Special Badges</h2>
      <p className="text-sm text-white/50">Gold, featured, premium</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Gold Badge">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold text-black"
            style={{
              background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
              boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >Featured</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold text-black"
            style={{
              background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
              boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >Pro</span>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Gold Outline">
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10">Featured</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10">Pro</span>
        </div>
      </CardWrapper>

      <CardWrapper label="C: New / Beta">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white/90"
            style={{
              background: 'linear-gradient(180deg, rgba(80,80,80,1) 0%, rgba(60,60,60,1) 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >New</span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-300"
            style={{
              background: 'linear-gradient(180deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.2) 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >Beta</span>
        </div>
      </CardWrapper>

      <CardWrapper label="D: Verified">
        <div className="flex flex-wrap gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1"
            style={{
              background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// COUNT BADGES
// ============================================
export const Count_Badges = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Count Badges</h2>
      <p className="text-sm text-white/50">Notification counts, member counts</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Red Notification">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">3</span>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">99+</span>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Gold Count">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-black flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
              }}
            >5</span>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Subtle Count">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium text-white/80 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >12</span>
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// TAG BADGES
// ============================================
export const Tag_Badges = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Tag Badges</h2>
      <p className="text-sm text-white/50">Hashtags, categories, labels</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Subtle Border">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10">#design</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10">#startup</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10">#tech</span>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Floating Tags">
        <div className="flex flex-wrap gap-2">
          {['#design', '#startup', '#tech'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70"
              style={{
                background: 'linear-gradient(180deg, rgba(50,50,50,1) 0%, rgba(40,40,40,1) 100%)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >{tag}</span>
          ))}
        </div>
      </CardWrapper>

      <CardWrapper label="C: Gold Featured Tag">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10">#design</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#FFD700]/80 bg-[#FFD700]/10 border border-[#FFD700]/20">#featured</span>
        </div>
      </CardWrapper>

      <CardWrapper label="D: Removable">
        <div className="flex flex-wrap gap-2">
          <span
            className="pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium text-white/70 flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(180deg, rgba(50,50,50,1) 0%, rgba(40,40,40,1) 100%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            #design
            <button className="w-4 h-4 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">×</button>
          </span>
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
      <p className="text-sm text-white/50">Recommended badge styles</p>
    </div>

    <div className="space-y-6">
      <CardWrapper label="RECOMMENDED: Floating pill + tinted status + gold special">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Default</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
                style={{
                  background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >Default</span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
                style={{
                  background: 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(45,45,45,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >New</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Status</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium text-green-400 bg-green-500/20">Success</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium text-red-400 bg-red-500/20">Error</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium text-amber-400 bg-amber-500/20">Warning</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Special (Gold)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold text-black"
                style={{
                  background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                  boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >Featured</span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold text-black"
                style={{
                  background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                  boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >Pro</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Count</span>
            <div className="flex items-center gap-4 mt-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">3</span>
              </div>
            </div>
          </div>
        </div>
      </CardWrapper>
    </div>
  </div>
);
