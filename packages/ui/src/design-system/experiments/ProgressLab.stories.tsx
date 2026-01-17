'use client';

/**
 * ProgressLab - Progress Bar Experiments
 *
 * Testing: track surface, indicator glow, circular variants
 * Gold is allowed here for achievement progress
 */

import type { Meta } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Progress Lab',
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
      className="rounded-2xl p-8 backdrop-blur-xl min-w-[300px] flex items-center justify-center"
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
// TRACK SURFACE OPTIONS
// ============================================
export const Track_Options = () => {
  const value = 65;

  // A: Flat (current)
  const FlatTrack = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  // B: Glass
  const GlassTrack = () => (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  // C: Inset
  const InsetTrack = () => (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.4)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
      }}
    >
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  // D: Gradient
  const GradientTrack = () => (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%)',
      }}
    >
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Track Surface Options</h2>
        <p className="text-sm text-white/50">Background track treatment</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Flat (current)">
          <div className="w-full"><FlatTrack /></div>
        </CardWrapper>

        <CardWrapper label="B: Glass">
          <div className="w-full"><GlassTrack /></div>
        </CardWrapper>

        <CardWrapper label="C: Inset">
          <div className="w-full"><InsetTrack /></div>
        </CardWrapper>

        <CardWrapper label="D: Gradient">
          <div className="w-full"><GradientTrack /></div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// INDICATOR OPTIONS
// ============================================
export const Indicator_Options = () => {
  const value = 65;

  // A: Solid white
  const SolidIndicator = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  // B: Gradient white
  const GradientIndicator = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 100%)',
        }}
      />
    </div>
  );

  // C: Glow
  const GlowIndicator = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div
        className="h-full rounded-full bg-white"
        style={{
          width: `${value}%`,
          boxShadow: '0 0 8px rgba(255,255,255,0.5)',
        }}
      />
    </div>
  );

  // D: Gold gradient (for achievements)
  const GoldIndicator = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 50%, #FFF8DC 100%)',
          boxShadow: '0 0 8px rgba(255,215,0,0.4)',
        }}
      />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Indicator Options</h2>
        <p className="text-sm text-white/50">Progress fill treatment</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Solid white">
          <div className="w-full"><SolidIndicator /></div>
        </CardWrapper>

        <CardWrapper label="B: Gradient white">
          <div className="w-full"><GradientIndicator /></div>
        </CardWrapper>

        <CardWrapper label="C: Glow">
          <div className="w-full"><GlowIndicator /></div>
        </CardWrapper>

        <CardWrapper label="D: Gold gradient (achievement)">
          <div className="w-full"><GoldIndicator /></div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SIZE OPTIONS
// ============================================
export const Size_Options = () => {
  const value = 65;

  const ProgressBar = ({ height }: { height: number }) => (
    <div
      className="w-full rounded-full bg-white/[0.08] overflow-hidden"
      style={{ height }}
    >
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Size Options</h2>
        <p className="text-sm text-white/50">Progress bar height</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: XS (2px)">
          <div className="w-full"><ProgressBar height={2} /></div>
        </CardWrapper>

        <CardWrapper label="B: SM (4px)">
          <div className="w-full"><ProgressBar height={4} /></div>
        </CardWrapper>

        <CardWrapper label="C: Default (8px)">
          <div className="w-full"><ProgressBar height={8} /></div>
        </CardWrapper>

        <CardWrapper label="D: LG (12px)">
          <div className="w-full"><ProgressBar height={12} /></div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ANIMATION OPTIONS
// ============================================
export const Animation_Options = () => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((v) => (v >= 100 ? 0 : v + 10));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  // A: CSS transition
  const CSSTransition = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div
        className="h-full rounded-full bg-white transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );

  // B: Spring
  const SpringTransition = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-white"
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );

  // C: Smooth ease
  const SmoothTransition = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-white"
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );

  // D: Instant
  const InstantTransition = () => (
    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
      <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Animation Options</h2>
        <p className="text-sm text-white/50">Progress transition (auto-incrementing)</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: CSS Transition (300ms)">
          <div className="w-full"><CSSTransition /></div>
        </CardWrapper>

        <CardWrapper label="B: Spring">
          <div className="w-full"><SpringTransition /></div>
        </CardWrapper>

        <CardWrapper label="C: Smooth ease">
          <div className="w-full"><SmoothTransition /></div>
        </CardWrapper>

        <CardWrapper label="D: Instant">
          <div className="w-full"><InstantTransition /></div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// CIRCULAR OPTIONS
// ============================================
export const Circular_Options = () => {
  const value = 65;
  const size = 64;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // A: Simple white
  const SimpleCircle = () => (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle
        strokeWidth={strokeWidth}
        stroke="rgba(255,255,255,0.08)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="white"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );

  // B: With glow
  const GlowCircle = () => (
    <svg className="transform -rotate-90" width={size} height={size}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        strokeWidth={strokeWidth}
        stroke="rgba(255,255,255,0.08)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="white"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        filter="url(#glow)"
      />
    </svg>
  );

  // C: Gold gradient
  const GoldCircle = () => (
    <svg className="transform -rotate-90" width={size} height={size}>
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFF8DC" />
        </linearGradient>
      </defs>
      <circle
        strokeWidth={strokeWidth}
        stroke="rgba(255,255,255,0.08)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="url(#goldGrad)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );

  // D: Thick stroke
  const ThickCircle = () => {
    const thickStroke = 6;
    const thickRadius = (size - thickStroke) / 2;
    const thickCircumference = thickRadius * 2 * Math.PI;
    const thickOffset = thickCircumference - (value / 100) * thickCircumference;

    return (
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          strokeWidth={thickStroke}
          stroke="rgba(255,255,255,0.08)"
          fill="transparent"
          r={thickRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          strokeWidth={thickStroke}
          strokeDasharray={thickCircumference}
          strokeDashoffset={thickOffset}
          strokeLinecap="round"
          stroke="white"
          fill="transparent"
          r={thickRadius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Circular Options</h2>
        <p className="text-sm text-white/50">Circle progress variants</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Simple white">
          <SimpleCircle />
        </CardWrapper>

        <CardWrapper label="B: With glow">
          <GlowCircle />
        </CardWrapper>

        <CardWrapper label="C: Gold gradient">
          <GoldCircle />
        </CardWrapper>

        <CardWrapper label="D: Thick stroke">
          <ThickCircle />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDATIONS
// ============================================
export const Recommendations = () => {
  const value = 65;

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks for progress</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="TRACK: C - Inset">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.4)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
          </div>
        </CardWrapper>

        <CardWrapper label="INDICATOR: A - Solid (default), D - Gold (achievement)">
          <div className="w-full space-y-4">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${value}%`,
                  background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 50%, #FFF8DC 100%)',
                  boxShadow: '0 0 8px rgba(255,215,0,0.4)',
                }}
              />
            </div>
          </div>
        </CardWrapper>

        <CardWrapper label="SIZE: B - SM (4px)">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{
              height: 4,
              background: 'rgba(0,0,0,0.4)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
          </div>
        </CardWrapper>

        <CardWrapper label="ANIMATION: C - Smooth ease">
          <div className="text-xs text-white/40 text-center">
            duration: 0.5s, ease: [0.22, 1, 0.36, 1]
          </div>
        </CardWrapper>
      </div>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Track: C - Inset (carved into surface)</p>
          <p className="text-amber-400">Indicator: Solid white default, Gold gradient for achievements</p>
          <p className="text-amber-400">Size: B - SM (4px) default, 8px for emphasis</p>
          <p className="text-amber-400">Animation: C - Smooth ease 0.5s</p>
          <p className="text-amber-400">Circular: A - Simple for default, C - Gold for achievements</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Subtle progress that feels premium</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
