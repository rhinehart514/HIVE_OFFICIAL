'use client';

/**
 * ToggleGroupLab - Focused Experiments
 *
 * Testing: variant styles, selection indicator, hover state, gold usage
 * Aligning with: Glass highlight (Button), Apple Glass Dark (Dropdown)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Experiments/ToggleGroup Lab',
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

const options = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// ============================================
// VARIANT STYLES
// ============================================
export const Variant_Styles = () => {
  const [valueA, setValueA] = useState('weekly');
  const [valueB, setValueB] = useState('weekly');
  const [valueC, setValueC] = useState('weekly');
  const [valueD, setValueD] = useState('weekly');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Variant Styles</h2>
        <p className="text-sm text-white/50">How the container and items look</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Outline Contained (Recommended)">
          <div
            className="inline-flex items-center rounded-xl p-1 gap-1"
            style={{
              background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueA(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueA === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-green-400 mt-3">Matches Button/Input container feel</p>
        </CardWrapper>

        <CardWrapper label="B: Pills Separated">
          <div className="inline-flex items-center gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueB(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-full transition-all duration-150 border ${
                  valueB === opt.value
                    ? 'bg-white/10 text-white border-white/15'
                    : 'text-white/50 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="C: Ghost Minimal">
          <div className="inline-flex items-center gap-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueC(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueC === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="D: Underline Tabs">
          <div className="inline-flex items-center border-b border-white/10">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueD(opt.value)}
                className={`h-10 px-4 text-sm font-medium transition-all duration-150 relative ${
                  valueD === opt.value
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
                {valueD === opt.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
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
// SELECTION INDICATOR
// ============================================
export const Selection_Indicator = () => {
  const [valueA, setValueA] = useState('weekly');
  const [valueB, setValueB] = useState('weekly');
  const [valueC, setValueC] = useState('weekly');
  const [valueD, setValueD] = useState('weekly');

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className="inline-flex items-center rounded-xl p-1 gap-1"
      style={{
        background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Selection Indicator</h2>
        <p className="text-sm text-white/50">How we show which option is selected</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Glass Highlight (Recommended)">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueA(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueA === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
          <p className="text-xs text-green-400 mt-3">Matches hover states system-wide</p>
        </CardWrapper>

        <CardWrapper label="B: Border Highlight">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueB(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 border ${
                  valueB === opt.value
                    ? 'border-white/30 text-white'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>

        <CardWrapper label="C: Solid Fill (Inverted)">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueC(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueC === opt.value
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>

        <CardWrapper label="D: Elevated Float">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueD(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueD === opt.value
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                }`}
                style={valueD === opt.value ? {
                  background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                } : {}}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// HOVER STATE
// ============================================
export const Hover_State = () => {
  const [valueA, setValueA] = useState('weekly');
  const [valueB, setValueB] = useState('weekly');
  const [valueC, setValueC] = useState('weekly');

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className="inline-flex items-center rounded-xl p-1 gap-1"
      style={{
        background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Hover State</h2>
        <p className="text-sm text-white/50">How unselected items respond to hover (test by hovering)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Glass Hover (Recommended)">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueA(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueA === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
          <p className="text-xs text-green-400 mt-3">Consistent with all hover states</p>
        </CardWrapper>

        <CardWrapper label="B: Text Brighten Only">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueB(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueB === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>

        <CardWrapper label="C: Border Appear">
          <Container>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueC(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 border ${
                  valueC === opt.value
                    ? 'bg-white/10 text-white border-transparent'
                    : 'text-white/50 border-transparent hover:text-white hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// GOLD VARIANT (CTA)
// ============================================
export const Gold_Variant = () => {
  const [valueA, setValueA] = useState('pro');
  const [valueB, setValueB] = useState('pro');
  const [valueC, setValueC] = useState('pro');

  const pricingOptions = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
  ];

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className="inline-flex items-center rounded-xl p-1 gap-1"
      style={{
        background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Gold Variant (CTA)</h2>
        <p className="text-sm text-white/50">When to use gold for selection (pricing, upgrades)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Standard (No Gold)">
          <Container>
            {pricingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueA(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueA === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>

        <CardWrapper label="B: Gold Fill">
          <Container>
            {pricingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueB(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueB === opt.value
                    ? 'bg-[#FFD700] text-black'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
        </CardWrapper>

        <CardWrapper label="C: Gold Text Only (Recommended)">
          <Container>
            {pricingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueC(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueC === opt.value
                    ? 'bg-white/10 text-[#FFD700]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Container>
          <p className="text-xs text-green-400 mt-3">Gold-as-light rule</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SIZE VARIATIONS
// ============================================
export const Size_Variations = () => {
  const [valueSm, setValueSm] = useState('weekly');
  const [valueMd, setValueMd] = useState('weekly');
  const [valueLg, setValueLg] = useState('weekly');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Size Variations</h2>
        <p className="text-sm text-white/50">Height options for different contexts</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Small (28px)">
          <div
            className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
            style={{
              background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueSm(opt.value)}
                className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  valueSm === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Default (36px) (Recommended)">
          <div
            className="inline-flex items-center rounded-xl p-1 gap-1"
            style={{
              background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueMd(opt.value)}
                className={`h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                  valueMd === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-green-400 mt-3">Balanced, most contexts</p>
        </CardWrapper>

        <CardWrapper label="C: Large (44px)">
          <div
            className="inline-flex items-center rounded-xl p-1.5 gap-1"
            style={{
              background: 'linear-gradient(180deg, rgba(38,38,38,1) 0%, rgba(28,28,28,1) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValueLg(opt.value)}
                className={`h-11 px-6 text-base font-medium rounded-lg transition-all duration-150 ${
                  valueLg === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};
