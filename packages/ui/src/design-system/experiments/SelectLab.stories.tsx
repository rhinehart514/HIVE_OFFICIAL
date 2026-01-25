'use client';

/**
 * SelectLab - Focused Experiments
 *
 * Testing: trigger styles, dropdown styles, option hover/selected
 * Aligning with: Pure Float (Input), Apple Glass Dark (Modal)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Select Lab',
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

const options = ['Overview', 'Members', 'Settings', 'Analytics'];

// Chevron icon
const ChevronIcon = ({ open }: { open?: boolean }) => (
  <svg
    className={`w-4 h-4 text-white/50 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// ============================================
// TRIGGER STYLES
// ============================================
export const Trigger_Styles = () => {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [valueA, setValueA] = useState('Overview');
  const [valueB, setValueB] = useState('Overview');
  const [valueC, setValueC] = useState('Overview');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Trigger Styles</h2>
        <p className="text-sm text-white/50">How the select trigger looks (aligning with Input)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Pure Float (Like Input)">
          <div className="relative">
            <button
              onClick={() => setOpenA(!openA)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150"
              style={{
                background: openA
                  ? 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)'
                  : 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                boxShadow: openA
                  ? '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {valueA}
              <ChevronIcon open={openA} />
            </button>
            {openA && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setValueA(opt); setOpenA(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      valueA === opt ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt}
                    {valueA === opt && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Glass Pill (Like Tabs)">
          <div className="relative">
            <button
              onClick={() => setOpenB(!openB)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: openB
                  ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {valueB}
              <ChevronIcon open={openB} />
            </button>
            {openB && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setValueB(opt); setOpenB(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      valueB === opt ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt}
                    {valueB === opt && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardWrapper>

        <CardWrapper label="C: Bordered (Generic)">
          <div className="relative">
            <button
              onClick={() => setOpenC(!openC)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border ${
                openC
                  ? 'border-white/30 text-white bg-white/5'
                  : 'border-white/10 text-white/80 bg-transparent hover:border-white/20'
              }`}
            >
              {valueC}
              <ChevronIcon open={openC} />
            </button>
            {openC && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 border border-white/10 bg-[#1c1c1c]">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setValueC(opt); setOpenC(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      valueC === opt ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt}
                    {valueC === opt && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-red-400 mt-2">Feels generic</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// OPTION STYLES
// ============================================
export const Option_Styles = () => {
  const [openA, setOpenA] = useState(true);
  const [openB, setOpenB] = useState(true);
  const [openC, setOpenC] = useState(true);
  const [valueA, setValueA] = useState('Members');
  const [valueB, setValueB] = useState('Members');
  const [valueC, setValueC] = useState('Members');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Option Styles</h2>
        <p className="text-sm text-white/50">How options look on hover and when selected</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Glass Highlight + Check">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setValueA(opt)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={valueA === opt ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  color: 'white',
                } : { color: 'rgba(255,255,255,0.6)' }}
              >
                {opt}
                {valueA === opt && <CheckIcon />}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="B: Subtle BG + Gold Check">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setValueB(opt)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  valueB === opt
                    ? 'bg-white/5 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt}
                {valueB === opt && (
                  <span className="text-[#FFD700]"><CheckIcon /></span>
                )}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="C: Pill Selected">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setValueC(opt)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-all duration-150 ${
                  valueC === opt
                    ? 'rounded-full text-white'
                    : 'rounded-lg text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={valueC === opt ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                } : undefined}
              >
                {opt}
                {valueC === opt && <CheckIcon />}
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
  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Select Sizes</h2>
        <p className="text-sm text-white/50">Size variations</p>
      </div>

      <CardWrapper label="Size Scale (Pure Float style)">
        <div className="space-y-4">
          <div>
            <span className="text-xs text-white/40 mb-2 block">Small</span>
            <button
              className="w-48 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white"
              style={{
                background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              Select option...
              <ChevronIcon />
            </button>
          </div>

          <div>
            <span className="text-xs text-white/40 mb-2 block">Default</span>
            <button
              className="w-48 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white"
              style={{
                background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              Select option...
              <ChevronIcon />
            </button>
          </div>

          <div>
            <span className="text-xs text-white/40 mb-2 block">Large</span>
            <button
              className="w-48 flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium text-white"
              style={{
                background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              Select option...
              <ChevronIcon />
            </button>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};

// ============================================
// WITH LABELS & GROUPS
// ============================================
export const With_Groups = () => {
  const [value, setValue] = useState('members');

  const groups = [
    { label: 'Views', items: ['overview', 'members', 'analytics'] },
    { label: 'Actions', items: ['settings', 'export', 'archive'] },
  ];

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Grouped Options</h2>
        <p className="text-sm text-white/50">Options organized by category</p>
      </div>

      <CardWrapper label="With Section Labels">
        <div
          className="rounded-xl p-1 w-64"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {groups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="h-px bg-white/10 mx-2 my-1" />}
              <div className="px-3 py-1.5 text-label-xs font-medium text-white/40 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item}
                  onClick={() => setValue(item)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 capitalize"
                  style={value === item ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                    color: 'white',
                  } : { color: 'rgba(255,255,255,0.6)' }}
                >
                  {item}
                  {value === item && <CheckIcon />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </CardWrapper>
    </div>
  );
};

// ============================================
// SPECIAL VARIANTS
// ============================================
export const Special_Variants = () => {
  const [value, setValue] = useState('monthly');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Special Variants</h2>
        <p className="text-sm text-white/50">For specific use cases</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="With Icons">
          <div
            className="rounded-xl p-1 w-64"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {[
              { value: 'daily', icon: '📅', label: 'Daily' },
              { value: 'weekly', icon: '📆', label: 'Weekly' },
              { value: 'monthly', icon: '🗓️', label: 'Monthly' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setValue(item.value)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={value === item.value ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  color: 'white',
                } : { color: 'rgba(255,255,255,0.6)' }}
              >
                <span>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {value === item.value && <CheckIcon />}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="With Descriptions">
          <div
            className="rounded-xl p-1 w-72"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {[
              { value: 'public', label: 'Public', desc: 'Anyone can see this' },
              { value: 'members', label: 'Members Only', desc: 'Only space members' },
              { value: 'private', label: 'Private', desc: 'Only you can see this' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setValue(item.value)}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                style={value === item.value ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                } : {}}
              >
                <div className="flex-1">
                  <div className={`text-sm font-medium ${value === item.value ? 'text-white' : 'text-white/70'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-white/40">{item.desc}</div>
                </div>
                {value === item.value && <span className="text-white mt-0.5"><CheckIcon /></span>}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// DROPDOWN MOTION
// ============================================
export const Dropdown_Motion = () => {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [openD, setOpenD] = useState(false);
  const [value, setValue] = useState('Overview');

  const dropdownBase = {
    background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  const TriggerButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150"
      style={{
        background: open
          ? 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)'
          : 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
        boxShadow: open
          ? '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {value}
      <ChevronIcon open={open} />
    </button>
  );

  const OptionsList = ({ onSelect }: { onSelect: () => void }) => (
    <>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { setValue(opt); onSelect(); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150"
          style={value === opt ? {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            color: 'white',
          } : { color: 'rgba(255,255,255,0.6)' }}
        >
          {opt}
          {value === opt && <CheckIcon />}
        </button>
      ))}
    </>
  );

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Dropdown Motion</h2>
        <p className="text-sm text-white/50">Animation when dropdown opens</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Scale + Fade (Like Modal - 150ms)">
          <div className="relative w-56">
            <TriggerButton open={openA} onClick={() => setOpenA(!openA)} />
            <motion.div
              initial={false}
              animate={openA ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 origin-top"
              style={{
                ...dropdownBase,
                pointerEvents: openA ? 'auto' : 'none',
              }}
            >
              <OptionsList onSelect={() => setOpenA(false)} />
            </motion.div>
          </div>
        </CardWrapper>

        <CardWrapper label="B: Slide Down + Fade (200ms)">
          <div className="relative w-56">
            <TriggerButton open={openB} onClick={() => setOpenB(!openB)} />
            <motion.div
              initial={false}
              animate={openB ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50"
              style={{
                ...dropdownBase,
                pointerEvents: openB ? 'auto' : 'none',
              }}
            >
              <OptionsList onSelect={() => setOpenB(false)} />
            </motion.div>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Spring Scale (Bouncy)">
          <div className="relative w-56">
            <TriggerButton open={openC} onClick={() => setOpenC(!openC)} />
            <motion.div
              initial={false}
              animate={openC ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 origin-top"
              style={{
                ...dropdownBase,
                pointerEvents: openC ? 'auto' : 'none',
              }}
            >
              <OptionsList onSelect={() => setOpenC(false)} />
            </motion.div>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Scale + Slide (Combined)">
          <div className="relative w-56">
            <TriggerButton open={openD} onClick={() => setOpenD(!openD)} />
            <motion.div
              initial={false}
              animate={openD ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 origin-top"
              style={{
                ...dropdownBase,
                pointerEvents: openD ? 'auto' : 'none',
              }}
            >
              <OptionsList onSelect={() => setOpenD(false)} />
            </motion.div>
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
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('Overview');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Final Candidates</h2>
        <p className="text-sm text-white/50">Recommended select style</p>
      </div>

      <CardWrapper label="RECOMMENDED: Pure Float + Scale/Fade motion (150ms)">
        <div className="relative w-64">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150"
            style={{
              background: open
                ? 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)'
                : 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: open
                ? '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {value}
            <ChevronIcon open={open} />
          </button>
          <motion.div
            initial={false}
            animate={open ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 origin-top"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { setValue(opt); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={value === opt ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                  color: 'white',
                } : { color: 'rgba(255,255,255,0.6)' }}
              >
                {opt}
                {value === opt && <CheckIcon />}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-white/40 space-y-1">
            <p>Trigger: Pure Float (matches Input)</p>
            <p>Dropdown: Apple Glass Dark (matches Modal)</p>
            <p>Motion: Scale 0.96→1 + Fade, 150ms ease-smooth</p>
            <p>Options: Glass highlight on selected</p>
            <p>Indicator: White checkmark</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
