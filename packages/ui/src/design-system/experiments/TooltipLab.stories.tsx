'use client';

/**
 * TooltipLab - Tooltip Experiments
 *
 * Testing: surface treatment, arrow styles, positioning, delay
 * Aligning with: Card (Apple Glass Dark), Modal (surfaces)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Tooltip Lab',
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

// Simple tooltip wrapper for demos
const TooltipDemo = ({
  children,
  content,
  surface,
  arrow = true,
  side = 'top',
}: {
  children: React.ReactNode;
  content: string;
  surface: React.CSSProperties;
  arrow?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) => {
  const [show, setShow] = useState(false);

  const positions = {
    top: { tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2', arrow: 'top-full left-1/2 -translate-x-1/2 border-t-current border-x-transparent border-b-transparent' },
    bottom: { tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2', arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-current border-x-transparent border-t-transparent' },
    left: { tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2', arrow: 'left-full top-1/2 -translate-y-1/2 border-l-current border-y-transparent border-r-transparent' },
    right: { tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2', arrow: 'right-full top-1/2 -translate-y-1/2 border-r-current border-y-transparent border-l-transparent' },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap ${positions[side].tooltip}`}
            style={surface}
          >
            {content}
            {arrow && (
              <div
                className={`absolute w-0 h-0 border-4 ${positions[side].arrow}`}
                style={{ color: 'rgba(28,28,28,0.98)' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// SURFACE OPTIONS
// ============================================
export const Surface_Options = () => {
  // A: Apple Glass Dark (matches Card)
  const glassDark = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
  };

  // B: Solid Dark
  const solidDark = {
    background: '#1a1a1a',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    borderRadius: '8px',
    color: 'white',
  };

  // C: Glass Light (inverted)
  const glassLight = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.92) 100%)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
    borderRadius: '8px',
    color: '#1a1a1a',
  };

  // D: Gold Accent (special)
  const goldAccent = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,215,0,0.3), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,0,0.1)',
    borderRadius: '8px',
    color: 'white',
  };

  const Button = ({ children }: { children: React.ReactNode }) => (
    <button
      className="px-4 py-2 rounded-full text-sm font-medium text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Surface Options</h2>
        <p className="text-sm text-white/50">Hover each button to see tooltip</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Apple Glass Dark">
          <TooltipDemo content="Glass dark tooltip" surface={glassDark}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="B: Solid Dark">
          <TooltipDemo content="Solid dark tooltip" surface={solidDark}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="C: Glass Light (Inverted)">
          <TooltipDemo content="Light tooltip" surface={glassLight}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="D: Gold Accent (Special)">
          <TooltipDemo content="Premium feature" surface={goldAccent}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RADIUS OPTIONS
// ============================================
export const Radius_Options = () => {
  const baseSurface = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    color: 'white',
  };

  const Button = ({ children }: { children: React.ReactNode }) => (
    <button
      className="px-4 py-2 rounded-full text-sm font-medium text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Radius Options</h2>
        <p className="text-sm text-white/50">Pick corner radius</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: rounded (4px)">
          <TooltipDemo content="Small radius" surface={{ ...baseSurface, borderRadius: '4px' }}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="B: rounded-md (6px)">
          <TooltipDemo content="Medium radius" surface={{ ...baseSurface, borderRadius: '6px' }}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="C: rounded-lg (8px)">
          <TooltipDemo content="Large radius" surface={{ ...baseSurface, borderRadius: '8px' }}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="D: rounded-xl (12px)">
          <TooltipDemo content="Extra large radius" surface={{ ...baseSurface, borderRadius: '12px' }}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ARROW OPTIONS
// ============================================
export const Arrow_Options = () => {
  const surface = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
  };

  const Button = ({ children }: { children: React.ReactNode }) => (
    <button
      className="px-4 py-2 rounded-full text-sm font-medium text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Arrow Options</h2>
        <p className="text-sm text-white/50">Arrow or no arrow</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: With Arrow">
          <TooltipDemo content="Has arrow pointer" surface={surface} arrow={true}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="B: No Arrow">
          <TooltipDemo content="No arrow pointer" surface={surface} arrow={false}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="C: Arrow Bottom">
          <TooltipDemo content="Arrow on bottom" surface={surface} arrow={true} side="bottom">
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="D: Arrow Right">
          <TooltipDemo content="Arrow on right" surface={surface} arrow={true} side="right">
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDATIONS
// ============================================
export const Recommendations = () => {
  const surface = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
  };

  const Button = ({ children }: { children: React.ReactNode }) => (
    <button
      className="px-4 py-2 rounded-full text-sm font-medium text-white"
      style={{
        background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="SURFACE: A - Apple Glass Dark">
          <TooltipDemo content="Matches Card surface" surface={surface}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="RADIUS: C - rounded-lg (8px)">
          <TooltipDemo content="Compact but soft" surface={surface}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="ARROW: B - No Arrow">
          <TooltipDemo content="Cleaner, more minimal" surface={surface} arrow={false}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>

        <CardWrapper label="MOTION: Scale+Fade 150ms">
          <TooltipDemo content="Smooth entrance" surface={surface} arrow={false}>
            <Button>Hover me</Button>
          </TooltipDemo>
        </CardWrapper>
      </div>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2 text-left w-full">
          <p className="text-amber-400">Surface: A - Apple Glass Dark (matches Card)</p>
          <p className="text-amber-400">Radius: C - rounded-lg (8px)</p>
          <p className="text-amber-400">Arrow: B - No arrow (cleaner)</p>
          <p className="text-amber-400">Motion: Scale 0.95→1 + Fade, 150ms</p>
          <p className="text-amber-400">Delay: 300ms before show</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Premium, minimal tooltip</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
