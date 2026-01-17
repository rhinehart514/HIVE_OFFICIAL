'use client';

/**
 * TypingIndicatorLab - Dot Animation Experiments
 *
 * Testing: bounce vs pulse vs wave for typing dots
 * Gold for multiple users is locked (part of gold budget)
 */

import type { Meta } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/TypingIndicator Lab',
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
      className="rounded-2xl p-8 backdrop-blur-xl min-w-[280px] flex items-center justify-center"
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
// ANIMATION OPTIONS
// ============================================
export const Animation_Options = () => {
  // A: Bounce (current)
  const BounceDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'bounce-dot 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );

  // B: Pulse (opacity only)
  const PulseDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'pulse-dot 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );

  // C: Scale (grow/shrink)
  const ScaleDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'scale-dot 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes scale-dot {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </span>
  );

  // D: Wave (side to side)
  const WaveDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'wave-dot 1s ease-in-out infinite',
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave-dot {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(3px); }
        }
      `}</style>
    </span>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Animation Options</h2>
        <p className="text-sm text-white/50">Dot animation style</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Bounce (current)">
          <div className="flex items-center gap-2">
            <BounceDots />
            <span className="text-sm text-white/40">Someone is typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Pulse (opacity)">
          <div className="flex items-center gap-2">
            <PulseDots />
            <span className="text-sm text-white/40">Someone is typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Scale (grow)">
          <div className="flex items-center gap-2">
            <ScaleDots />
            <span className="text-sm text-white/40">Someone is typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Wave (side)">
          <div className="flex items-center gap-2">
            <WaveDots />
            <span className="text-sm text-white/40">Someone is typing</span>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// GOLD VS GRAY
// ============================================
export const Color_Options = () => {
  const BounceDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'bounce-dot-2 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce-dot-2 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Color by Context</h2>
        <p className="text-sm text-white/50">Gold for multiple users (activity = life)</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="Single user (gray)">
          <div className="flex items-center gap-2">
            <BounceDots gold={false} />
            <span className="text-sm text-white/40">Alex is typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="Multiple users (GOLD)">
          <div className="flex items-center gap-2">
            <BounceDots gold={true} />
            <span className="text-sm text-white/60">Alex and 2 others are typing</span>
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
  const Dots = ({ size }: { size: number }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: 'rgba(255,255,255,0.4)',
            animation: 'bounce-dot-3 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce-dot-3 {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Size Options</h2>
        <p className="text-sm text-white/50">Dot size</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: 4px (tiny)">
          <div className="flex items-center gap-2">
            <Dots size={4} />
            <span className="text-xs text-white/40">Typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="B: 6px (default)">
          <div className="flex items-center gap-2">
            <Dots size={6} />
            <span className="text-sm text-white/40">Typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="C: 8px (visible)">
          <div className="flex items-center gap-2">
            <Dots size={8} />
            <span className="text-sm text-white/40">Typing</span>
          </div>
        </CardWrapper>

        <CardWrapper label="D: 10px (large)">
          <div className="flex items-center gap-2">
            <Dots size={10} />
            <span className="text-base text-white/40">Typing</span>
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
  const RecommendedDots = ({ gold }: { gold?: boolean }) => (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: gold ? '#FFD700' : 'rgba(255,255,255,0.4)',
            animation: 'bounce-rec 1.2s ease-in-out infinite',
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce-rec {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks for typing indicator</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="ANIMATION: A - Bounce">
          <div className="flex items-center gap-2">
            <RecommendedDots />
            <span className="text-sm text-white/40">Classic, recognizable</span>
          </div>
        </CardWrapper>

        <CardWrapper label="COLOR: Gray single, Gold multiple">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RecommendedDots gold={false} />
              <span className="text-xs text-white/40">1 user</span>
            </div>
            <div className="flex items-center gap-2">
              <RecommendedDots gold={true} />
              <span className="text-xs text-white/60">2+ users</span>
            </div>
          </div>
        </CardWrapper>

        <CardWrapper label="SIZE: B - 6px">
          <div className="flex items-center gap-2">
            <RecommendedDots />
            <span className="text-sm text-white/40">Balanced</span>
          </div>
        </CardWrapper>

        <CardWrapper label="TIMING: 1.2s cycle, 150ms stagger">
          <div className="flex items-center gap-2">
            <RecommendedDots />
            <span className="text-sm text-white/40">Natural rhythm</span>
          </div>
        </CardWrapper>
      </div>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Animation: A - Bounce (translateY -4px)</p>
          <p className="text-amber-400">Color: Gray for single, GOLD for multiple (activity = life)</p>
          <p className="text-amber-400">Size: B - 6px (w-1.5 h-1.5)</p>
          <p className="text-amber-400">Timing: 1.2s cycle, 150ms stagger between dots</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Familiar, subtle typing indicator with gold reward for activity</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
