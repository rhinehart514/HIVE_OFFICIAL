'use client';

/**
 * TabsLab - Focused Experiments
 *
 * Testing: container styles, active indicators, motion
 * Aligning with: Glass surfaces, Pill shapes, shadow focus
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Tabs Lab',
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

const tabs = ['Overview', 'Members', 'Settings'];

// ============================================
// CONTAINER STYLES
// ============================================
export const Container_Styles = () => {
  const [activeA, setActiveA] = useState(0);
  const [activeB, setActiveB] = useState(0);
  const [activeC, setActiveC] = useState(0);
  const [activeD, setActiveD] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Container Styles</h2>
        <p className="text-sm text-white/50">How the tab list is contained</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: No Container (Clean)">
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveA(i)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeA === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeA === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Glass Track">
          <div
            className="inline-flex p-1 rounded-full gap-1"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveB(i)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeB === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeB === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="C: Floating Pill Container">
          <div
            className="inline-flex p-1.5 rounded-full gap-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.9) 0%, rgba(18,18,18,0.85) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveC(i)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeC === i
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="D: Underline Track">
          <div className="flex gap-1 border-b border-white/10">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveD(i)}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-150
                  border-b-2 -mb-px
                  ${activeD === i
                    ? 'border-white text-white'
                    : 'border-transparent text-white/50 hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ACTIVE INDICATORS
// ============================================
export const Active_Indicators = () => {
  const [activeA, setActiveA] = useState(0);
  const [activeB, setActiveB] = useState(0);
  const [activeC, setActiveC] = useState(0);
  const [activeD, setActiveD] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Active Indicators</h2>
        <p className="text-sm text-white/50">How the active tab is highlighted</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Glass Pill (Matches Badge)">
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveA(i)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeA === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeA === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Floating Pill (Shadow)">
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveB(i)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeB === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeB === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="C: White Underline (2px)">
          <div className="flex gap-1">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveC(i)}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-150
                  border-b-2
                  ${activeC === i
                    ? 'border-white text-white'
                    : 'border-transparent text-white/50 hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="D: Text Only (Bold)">
          <div className="flex gap-4">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveD(i)}
                className={`
                  text-sm transition-all duration-150
                  ${activeD === i
                    ? 'text-white font-semibold'
                    : 'text-white/50 font-medium hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// ANIMATED INDICATOR (Sliding)
// ============================================
export const Animated_Indicator = () => {
  const [activeA, setActiveA] = useState(0);
  const [activeB, setActiveB] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Animated Indicator</h2>
        <p className="text-sm text-white/50">Sliding indicator between tabs</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Sliding Glass Pill">
          <div className="relative flex gap-1">
            <motion.div
              layoutId="tab-indicator-a"
              className="absolute inset-y-0 rounded-full"
              style={{
                left: activeA * 100,
                width: 96,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveA(i)}
                className={`
                  relative z-10 w-24 py-2 rounded-full text-sm font-medium transition-colors duration-150
                  ${activeA === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Sliding Underline">
          <div className="relative flex gap-1 border-b border-white/10">
            <motion.div
              layoutId="tab-indicator-b"
              className="absolute bottom-0 h-0.5 bg-white rounded-full"
              style={{
                left: activeB * 100,
                width: 96,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveB(i)}
                className={`
                  w-24 py-2 text-sm font-medium transition-colors duration-150
                  ${activeB === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SIZES
// ============================================
export const Sizes = () => {
  const [activeSm, setActiveSm] = useState(0);
  const [activeMd, setActiveMd] = useState(0);
  const [activeLg, setActiveLg] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Tab Sizes</h2>
        <p className="text-sm text-white/50">Size variations</p>
      </div>

      <CardWrapper label="Size Scale">
        <div className="space-y-6">
          <div>
            <span className="text-xs text-white/40 mb-2 block">Small</span>
            <div className="flex gap-0.5">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveSm(i)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-all duration-150
                    ${activeSm === i
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'}
                  `}
                  style={activeSm === i ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  } : undefined}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-white/40 mb-2 block">Default</span>
            <div className="flex gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveMd(i)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                    ${activeMd === i
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'}
                  `}
                  style={activeMd === i ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  } : undefined}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-white/40 mb-2 block">Large</span>
            <div className="flex gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveLg(i)}
                  className={`
                    px-5 py-2.5 rounded-full text-base font-medium transition-all duration-150
                    ${activeLg === i
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/70'}
                  `}
                  style={activeLg === i ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  } : undefined}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};

// ============================================
// WITH ICONS
// ============================================
export const With_Icons = () => {
  const [active, setActive] = useState(0);

  const iconTabs = [
    { label: 'Overview', icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )},
    { label: 'Members', icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="17" cy="11" r="3" />
        <path d="M21 21v-2a3 3 0 0 0-3-3h-1" />
      </svg>
    )},
    { label: 'Settings', icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    )},
  ];

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Tabs with Icons</h2>
        <p className="text-sm text-white/50">Icon + label combinations</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="Icon + Label">
          <div className="flex gap-1">
            {iconTabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActive(i)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${active === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={active === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="Icon Only (Compact)">
          <div className="flex gap-1">
            {iconTabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActive(i)}
                className={`
                  p-2.5 rounded-full transition-all duration-150
                  ${active === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={active === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SPECIAL VARIANTS
// ============================================
export const Special_Variants = () => {
  const [activeA, setActiveA] = useState(0);
  const [activeB, setActiveB] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Special Variants</h2>
        <p className="text-sm text-white/50">For specific use cases</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Segment Control (iOS-style)">
          <div
            className="inline-flex p-1 rounded-xl gap-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {['Day', 'Week', 'Month'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveA(i)}
                className={`
                  px-6 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${activeA === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeA === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: With Badge Count">
          <div className="flex gap-1">
            {[
              { label: 'All', count: null },
              { label: 'Pending', count: 12 },
              { label: 'Approved', count: 3 },
            ].map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveB(i)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                  ${activeB === i
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/70'}
                `}
                style={activeB === i ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {tab.label}
                {tab.count && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-label-xs font-semibold"
                    style={{
                      background: activeB === i
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.9) 0%, rgba(255,180,0,0.85) 100%)'
                        : 'rgba(255,255,255,0.1)',
                      color: activeB === i ? '#0A0A09' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Final Candidates</h2>
        <p className="text-sm text-white/50">Recommended tab style</p>
      </div>

      <CardWrapper label="RECOMMENDED: Glass pill + sliding indicator">
        <div className="relative flex gap-1">
          <motion.div
            layoutId="final-tab-indicator"
            className="absolute inset-y-0 rounded-full"
            style={{
              left: active * 100,
              width: 96,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              className={`
                relative z-10 w-24 py-2 rounded-full text-sm font-medium transition-colors duration-150
                ${active === i
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-white/40 space-y-1">
            <p>Active: Glass pill (matches Badge)</p>
            <p>Shape: rounded-full (matches Button, Badge)</p>
            <p>Motion: Spring slide (stiffness: 400, damping: 30)</p>
            <p>Container: None (clean, no track)</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
