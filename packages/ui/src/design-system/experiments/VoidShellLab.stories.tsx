'use client';

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * VoidShell Lab
 * STATUS: IN LAB — Awaiting selection
 *
 * Variables to test:
 * 1. Content Width — 400px / 480px / 560px
 * 2. Background Style — plain / gradient / animated orb
 * 3. Content Position — centered / top-third
 *
 * Context: Auth, onboarding, verification flows
 * Feel: "You are the focus. Nothing else matters."
 */

const meta: Meta = {
  title: 'Experiments/VoidShell Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK CONTENT
// ============================================

function MockAuthContent() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p className="text-sm text-neutral-400">Enter your email to continue</p>
      </div>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="you@buffalo.edu"
          className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/[0.24]"
        />
        <button className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-[#FFD700]/30 text-[#FFD700] font-medium hover:bg-white/[0.10] transition-all">
          Continue
        </button>
      </div>
    </div>
  );
}

// ============================================
// SHELL VARIANTS (for testing)
// ============================================

interface VoidShellVariantProps {
  children: React.ReactNode;
  maxWidth?: string;
  background?: 'plain' | 'gradient' | 'orb' | 'gold-orb' | 'subtle';
  position?: 'centered' | 'top-third' | 'top-quarter';
}

function VoidShellVariant({
  children,
  maxWidth = '400px',
  background = 'plain',
  position = 'centered',
}: VoidShellVariantProps) {
  const positionClass = {
    'centered': 'items-center justify-center',
    'top-third': 'items-start justify-center pt-[20vh]',
    'top-quarter': 'items-start justify-center pt-[15vh]',
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A09]">
      {/* Background variants */}
      {background === 'gradient' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
          }}
        />
      )}

      {background === 'orb' && (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white rounded-full blur-[120px] pointer-events-none"
        />
      )}

      {background === 'gold-orb' && (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FFD700] rounded-full blur-[120px] pointer-events-none"
        />
      )}

      {background === 'subtle' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(255, 255, 255, 0.02) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 min-h-screen flex flex-col px-6 py-8`}>
        {/* Logo */}
        <header className="p-6">
          <div className="w-6 h-6 text-white">
            <svg viewBox="0 0 1200 1200" fill="currentColor">
              <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z" />
            </svg>
          </div>
        </header>

        {/* Centered content */}
        <main className={`flex-1 flex ${positionClass[position]}`}>
          <div style={{ width: '100%', maxWidth }}>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-xs text-neutral-500">University at Buffalo</p>
        </footer>
      </div>
    </div>
  );
}

// ============================================
// VARIABLE 1: Content Width
// ============================================

/**
 * 4 options for content container width.
 * Which feels right for auth/onboarding forms?
 *
 * A: 360px — Tight, mobile-first
 * B: 400px — Standard form width
 * C: 480px — Comfortable, more breathing room
 * D: 560px — Wide, spacious feeling
 */
export const Variable1_ContentWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare widths. Which feels right for HIVE auth flows?
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">A: 360px (Tight)</span>
          <div className="h-[400px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="360px" background="subtle">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">B: 400px (Standard)</span>
          <div className="h-[400px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="subtle">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">C: 480px (Comfortable)</span>
          <div className="h-[400px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="480px" background="subtle">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">D: 560px (Spacious)</span>
          <div className="h-[400px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="560px" background="subtle">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Background Style
// ============================================

/**
 * 5 options for ambient background treatment.
 *
 * A: Plain — Pure black, no effects
 * B: Subtle gradient — Barely visible radial glow
 * C: White orb — Animated breathing white orb
 * D: Gold orb — Animated breathing gold orb (current)
 * E: Static gradient — Non-animated radial
 */
export const Variable2_BackgroundStyle: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare backgrounds. Which creates the right mood?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">A: Plain (Pure black)</span>
          <div className="h-[350px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="plain">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">B: Subtle gradient</span>
          <div className="h-[350px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="subtle">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">C: Static gradient</span>
          <div className="h-[350px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="gradient">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">D: White orb (animated)</span>
          <div className="h-[350px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="orb">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">E: Gold orb (animated)</span>
          <div className="h-[350px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="gold-orb">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Content Position
// ============================================

/**
 * 3 options for vertical content placement.
 *
 * A: Centered — True vertical center
 * B: Top third — Lifted higher (20vh from top)
 * C: Top quarter — Even higher (15vh from top)
 */
export const Variable3_ContentPosition: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-[#0A0A09]">
      <div className="text-sm text-neutral-500 mb-4">
        Compare positions. True center or lifted content?
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">A: Centered (true center)</span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="subtle" position="centered">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">B: Top third (20vh)</span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="subtle" position="top-third">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-400 uppercase tracking-wider">C: Top quarter (15vh)</span>
          <div className="h-[500px] relative rounded-xl overflow-hidden border border-white/[0.06]">
            <VoidShellVariant maxWidth="400px" background="subtle" position="top-quarter">
              <MockAuthContent />
            </VoidShellVariant>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// FULL SCREEN PREVIEW
// ============================================

/**
 * Full-screen preview with controls to test combinations
 */
export const FullScreenPreview: Story = {
  render: () => (
    <VoidShellVariant maxWidth="400px" background="gold-orb" position="centered">
      <MockAuthContent />
    </VoidShellVariant>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
