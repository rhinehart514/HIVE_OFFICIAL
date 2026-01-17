'use client';

/**
 * PresenceDotLab - Breathing Animation Experiments
 *
 * Testing: breathing animation for online status (gold dot must feel alive)
 * Key constraint: Gold is sacred - only appears on life/activity indicators
 */

import type { Meta } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/PresenceDot Lab',
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
      className="rounded-2xl p-8 backdrop-blur-xl min-h-[200px] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </div>
  </div>
);

// Mock Avatar for context
const MockAvatar = ({ children, size = 48 }: { children?: React.ReactNode; size?: number }) => (
  <div className="relative inline-flex">
    <div
      className="rounded-lg overflow-hidden flex items-center justify-center text-white/60 font-medium"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      JD
    </div>
    {children}
  </div>
);

// ============================================
// BREATHING ANIMATION OPTIONS
// ============================================
export const Breathing_Options = () => {
  // A: CSS Pulse (Tailwind default)
  const PulseDot = () => (
    <span
      className="w-3 h-3 rounded-full bg-[#FFD700] animate-pulse"
    />
  );

  // B: Opacity Breathe (subtle, premium)
  const OpacityBreatheDot = () => (
    <motion.span
      className="w-3 h-3 rounded-full bg-[#FFD700]"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  // C: Scale Breathe (feels alive)
  const ScaleBreatheDot = () => (
    <motion.span
      className="w-3 h-3 rounded-full bg-[#FFD700]"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  // D: Glow Pulse (ring glow effect)
  const GlowPulseDot = () => (
    <motion.span
      className="w-3 h-3 rounded-full bg-[#FFD700]"
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(255,215,0,0.4)',
          '0 0 0 4px rgba(255,215,0,0)',
          '0 0 0 0 rgba(255,215,0,0.4)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Breathing Animation Options</h2>
        <p className="text-sm text-white/50">Gold dot must feel alive for online users</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: CSS Pulse (default)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c]">
                <PulseDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Tailwind animate-pulse</div>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Opacity Breathe">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <OpacityBreatheDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Subtle, premium feel</div>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Scale Breathe">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <ScaleBreatheDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Feels organically alive</div>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Glow Pulse">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <GlowPulseDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Expanding ring glow</div>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// BREATHING SPEED OPTIONS
// ============================================
export const Speed_Options = () => {
  const BreatheDot = ({ duration }: { duration: number }) => (
    <motion.span
      className="w-3 h-3 rounded-full bg-[#FFD700]"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Breathing Speed Options</h2>
        <p className="text-sm text-white/50">How fast should the dot breathe?</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Fast (1.5s)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <BreatheDot duration={1.5} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Energetic, alert</div>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Normal (2.5s)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <BreatheDot duration={2.5} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Calm, natural</div>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Slow (4s)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <BreatheDot duration={4} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Zen, meditative</div>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Very Slow (6s)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <BreatheDot duration={6} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Almost static</div>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SIZE OPTIONS
// ============================================
export const Size_Options = () => {
  const Dot = ({ size }: { size: number }) => (
    <motion.span
      className="rounded-full bg-[#FFD700]"
      style={{ width: size, height: size }}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Size Options</h2>
        <p className="text-sm text-white/50">Dot size relative to avatar</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: XS (6px)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0 -right-0 ring-2 ring-[#1c1c1c] rounded-full">
                <Dot size={6} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Subtle, minimal</div>
          </div>
        </CardWrapper>

        <CardWrapper label="B: SM (8px)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <Dot size={8} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Balanced</div>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Default (10px)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <Dot size={10} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Noticeable</div>
          </div>
        </CardWrapper>

        <CardWrapper label="D: LG (12px)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <Dot size={12} />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Prominent</div>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ALL STATUSES
// ============================================
export const Status_Options = () => {
  const statusColors = {
    online: '#FFD700',
    away: 'rgba(255,215,0,0.5)',
    offline: 'rgba(255,255,255,0.3)',
    dnd: '#EF4444',
  };

  const StatusDot = ({ status, animate = false }: { status: keyof typeof statusColors; animate?: boolean }) => (
    <motion.span
      className="w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: statusColors[status] }}
      animate={animate && status === 'online' ? { opacity: [1, 0.6, 1] } : undefined}
      transition={animate ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    />
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Status Colors</h2>
        <p className="text-sm text-white/50">All presence states with breathing on online</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="Online (Gold + Breathing)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <StatusDot status="online" animate />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Gold is life</div>
          </div>
        </CardWrapper>

        <CardWrapper label="Away (Dimmed Gold)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <StatusDot status="away" />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">No breathing</div>
          </div>
        </CardWrapper>

        <CardWrapper label="Offline (Gray)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <StatusDot status="offline" />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Static, muted</div>
          </div>
        </CardWrapper>

        <CardWrapper label="DND (Red)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <StatusDot status="dnd" />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Static, alert</div>
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
  // Recommended: Opacity breathe, 2.5s, 10px, ring offset
  const RecommendedDot = () => (
    <motion.span
      className="w-2.5 h-2.5 rounded-full bg-[#FFD700]"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks for presence dot</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="ANIMATION: B - Opacity Breathe">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <RecommendedDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Subtle, premium</div>
          </div>
        </CardWrapper>

        <CardWrapper label="SPEED: B - Normal (2.5s)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <RecommendedDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Natural rhythm</div>
          </div>
        </CardWrapper>

        <CardWrapper label="SIZE: C - Default (10px)">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <RecommendedDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Noticeable but not loud</div>
          </div>
        </CardWrapper>

        <CardWrapper label="RING: Dark offset ring">
          <div className="flex flex-col items-center gap-4">
            <MockAvatar>
              <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-[#1c1c1c] rounded-full">
                <RecommendedDot />
              </span>
            </MockAvatar>
            <div className="text-xs text-white/40">Separates from avatar</div>
          </div>
        </CardWrapper>
      </div>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Animation: B - Opacity Breathe (1 → 0.6 → 1)</p>
          <p className="text-amber-400">Speed: B - 2.5s (natural breathing rhythm)</p>
          <p className="text-amber-400">Size: C - 10px default (w-2.5 h-2.5)</p>
          <p className="text-amber-400">Ring: Dark offset ring-2 ring-[bg-color]</p>
          <p className="text-amber-400">Colors: Gold online, dimmed away, gray offline, red dnd</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Alive but not distracting presence indicator</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
