'use client';

/**
 * ToggleLab - Checkbox, Radio, Switch Experiments
 *
 * Testing: control styles, checked states, motion
 * Aligning with: Glass surfaces, shadow-based focus, gold sparingly
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Toggle Lab',
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
// CHECKBOX STYLES
// ============================================
export const Checkbox_Styles = () => {
  const [checkedA, setCheckedA] = useState(true);
  const [checkedB, setCheckedB] = useState(true);
  const [checkedC, setCheckedC] = useState(true);
  const [checkedD, setCheckedD] = useState(true);

  const CheckIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Checkbox Styles</h2>
        <p className="text-sm text-white/50">Checkbox appearance when checked/unchecked</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Glass + White Check">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setCheckedA(!checkedA)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checkedA ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checkedA && <span className="text-white"><CheckIcon /></span>}
              </button>
              <span className="text-sm text-white/80">Enable notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              />
              <span className="text-sm text-white/80">Unchecked state</span>
            </label>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Solid White Check">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setCheckedB(!checkedB)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checkedB ? {
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checkedB && <span className="text-black"><CheckIcon /></span>}
              </button>
              <span className="text-sm text-white/80">Enable notifications</span>
            </label>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Gold Check (Special)">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setCheckedC(!checkedC)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checkedC ? {
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.9) 0%, rgba(255,180,0,0.85) 100%)',
                  boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checkedC && <span className="text-black"><CheckIcon /></span>}
              </button>
              <span className="text-sm text-white/80">Premium feature</span>
            </label>
            <p className="text-xs text-amber-400/60">Use sparingly - gold budget</p>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Glass + Gold Check Icon">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setCheckedD(!checkedD)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checkedD ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checkedD && <span className="text-[#FFD700]"><CheckIcon /></span>}
              </button>
              <span className="text-sm text-white/80">Enable feature</span>
            </label>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RADIO STYLES
// ============================================
export const Radio_Styles = () => {
  const [valueA, setValueA] = useState('option1');
  const [valueB, setValueB] = useState('option1');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Radio Styles</h2>
        <p className="text-sm text-white/50">Radio button appearance</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Glass + White Dot">
          <div className="space-y-3">
            {['option1', 'option2', 'option3'].map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setValueA(opt)}
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
                  style={valueA === opt ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                  } : {
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {valueA === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </button>
                <span className="text-sm text-white/80 capitalize">{opt.replace('option', 'Option ')}</span>
              </label>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Ring Indicator">
          <div className="space-y-3">
            {['option1', 'option2', 'option3'].map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setValueB(opt)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 ${
                    valueB === opt ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1c]' : ''
                  }`}
                  style={{
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {valueB === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </button>
                <span className="text-sm text-white/80 capitalize">{opt.replace('option', 'Option ')}</span>
              </label>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SWITCH STYLES
// ============================================
export const Switch_Styles = () => {
  const [onA, setOnA] = useState(false);
  const [onB, setOnB] = useState(false);
  const [onC, setOnC] = useState(false);
  const [onD, setOnD] = useState(false);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Switch Styles</h2>
        <p className="text-sm text-white/50">Click each switch to toggle</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* A: iOS White */}
        <CardWrapper label="A: iOS White (Clean)">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Click to toggle</span>
              <button
                onClick={() => setOnA(!onA)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: onA
                    ? 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: onA
                    ? '0 2px 8px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.8)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: onA ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: onA ? '#1a1a1a' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
            <p className="text-xs text-white/40">State: {onA ? 'ON' : 'OFF'}</p>
          </div>
        </CardWrapper>

        {/* B: Green Classic */}
        <CardWrapper label="B: Green Classic">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Click to toggle</span>
              <button
                onClick={() => setOnB(!onB)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: onB
                    ? 'linear-gradient(180deg, #34d399 0%, #22c55e 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: onB
                    ? '0 2px 8px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full bg-white"
                  animate={{ left: onB ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                />
              </button>
            </div>
            <p className="text-xs text-white/40">State: {onB ? 'ON' : 'OFF'}</p>
          </div>
        </CardWrapper>

        {/* C: Glass Subtle */}
        <CardWrapper label="C: Glass Subtle">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Click to toggle</span>
              <button
                onClick={() => setOnC(!onC)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: onC
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: onC
                    ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.2)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: onC ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: onC ? '#ffffff' : '#888888',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
            <p className="text-xs text-white/40">State: {onC ? 'ON' : 'OFF'}</p>
          </div>
        </CardWrapper>

        {/* D: Gold Premium */}
        <CardWrapper label="D: Gold Premium">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Click to toggle</span>
              <button
                onClick={() => setOnD(!onD)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: onD
                    ? 'linear-gradient(180deg, #ffd700 0%, #e6c200 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: onD
                    ? '0 2px 8px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: onD ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: onD ? '#1a1a1a' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
            <p className="text-xs text-amber-400/60">Reserve for premium</p>
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
  const [checked, setChecked] = useState(true);

  const CheckIcon = ({ size }: { size: string }) => (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Toggle Sizes</h2>
        <p className="text-sm text-white/50">Size variations</p>
      </div>

      <CardWrapper label="Size Scale">
        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <div className="text-xs text-white/40 w-16">Small</div>
            <button
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <CheckIcon size="w-2.5 h-2.5 text-white" />
            </button>
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div className="relative w-9 h-5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow-md" />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-xs text-white/40 w-16">Default</div>
            <button
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <CheckIcon size="w-3 h-3 text-white" />
            </button>
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="relative w-11 h-6 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow-md" />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-xs text-white/40 w-16">Large</div>
            <button
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <CheckIcon size="w-4 h-4 text-white" />
            </button>
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div className="relative w-14 h-7 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white shadow-md" />
            </div>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  const [checked4, setChecked4] = useState(false);
  const [radio, setRadio] = useState('option1');
  const [switch1, setSwitch1] = useState(false);
  const [switch2, setSwitch2] = useState(false);
  const [switch3, setSwitch3] = useState(false);
  const [switch4, setSwitch4] = useState(false);

  const CheckIcon = ({ color = 'currentColor' }: { color?: string }) => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Final Candidates</h2>
        <p className="text-sm text-white/50">4 checkbox + 4 switch options</p>
      </div>

      {/* CHECKBOXES */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-4">CHECKBOX OPTIONS</h3>
        <div className="grid grid-cols-2 gap-6">
          <CardWrapper label="A: Glass + White Check">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setChecked1(!checked1)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checked1 ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checked1 && <CheckIcon color="#ffffff" />}
              </button>
              <span className="text-sm text-white/80">Click to toggle</span>
            </label>
          </CardWrapper>

          <CardWrapper label="B: Solid White">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setChecked2(!checked2)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checked2 ? {
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checked2 && <CheckIcon color="#000000" />}
              </button>
              <span className="text-sm text-white/80">Click to toggle</span>
            </label>
          </CardWrapper>

          <CardWrapper label="C: Gold Background (Premium)">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setChecked3(!checked3)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checked3 ? {
                  background: 'linear-gradient(135deg, #ffd700 0%, #e6c200 100%)',
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checked3 && <CheckIcon color="#000000" />}
              </button>
              <span className="text-sm text-white/80">Click to toggle</span>
            </label>
          </CardWrapper>

          <CardWrapper label="D: Glass + Gold Check (SELECTED)">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                onClick={() => setChecked4(!checked4)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={checked4 ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                } : {
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {checked4 && <CheckIcon color="#FFD700" />}
              </button>
              <span className="text-sm text-white/80">Click to toggle</span>
            </label>
            <p className="text-xs text-amber-400/60 mt-2">Your pick</p>
          </CardWrapper>
        </div>
      </div>

      {/* SWITCHES */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-4">SWITCH OPTIONS</h3>
        <div className="grid grid-cols-2 gap-6">
          <CardWrapper label="A: iOS White">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Toggle</span>
              <button
                onClick={() => setSwitch1(!switch1)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: switch1
                    ? 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: switch1
                    ? '0 2px 8px rgba(255,255,255,0.3)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: switch1 ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: switch1 ? '#1a1a1a' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </CardWrapper>

          <CardWrapper label="B: Green Classic">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Toggle</span>
              <button
                onClick={() => setSwitch2(!switch2)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: switch2
                    ? 'linear-gradient(180deg, #34d399 0%, #22c55e 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: switch2
                    ? '0 2px 8px rgba(34,197,94,0.5)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full bg-white"
                  animate={{ left: switch2 ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                />
              </button>
            </div>
          </CardWrapper>

          <CardWrapper label="C: Glass Subtle">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Toggle</span>
              <button
                onClick={() => setSwitch3(!switch3)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: switch3
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: switch3
                    ? 'inset 0 1px 0 rgba(255,255,255,0.4)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: switch3 ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: switch3 ? '#ffffff' : '#888888',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </CardWrapper>

          <CardWrapper label="D: Gold Premium">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Toggle</span>
              <button
                onClick={() => setSwitch4(!switch4)}
                className="relative w-[52px] h-[32px] rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: switch4
                    ? 'linear-gradient(180deg, #ffd700 0%, #e6c200 100%)'
                    : 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(40,40,40,1) 100%)',
                  boxShadow: switch4
                    ? '0 2px 8px rgba(255,215,0,0.5)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }}
              >
                <motion.div
                  className="absolute top-[4px] w-[24px] h-[24px] rounded-full"
                  animate={{ left: switch4 ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: switch4 ? '#1a1a1a' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </CardWrapper>
        </div>
      </div>

      <CardWrapper label="YOUR SELECTIONS">
        <div className="text-xs text-white/40 space-y-1">
          <p className="text-amber-400">Checkbox: D - Glass + Gold Check</p>
          <p>Radio: Pick your preference above</p>
          <p>Switch: Pick your preference above</p>
        </div>
      </CardWrapper>
    </div>
  );
};
