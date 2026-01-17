'use client';

/**
 * ComboboxLab - Focused Experiments
 *
 * Testing: search input styling, option styling, create CTA
 * Aligning with: Pure Float (Input), Apple Glass Dark (Dropdown)
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Experiments/Combobox Lab',
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

const options = ['Overview', 'Members', 'Settings', 'Analytics', 'Events', 'Resources'];

const SearchIcon = () => (
  <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ChevronIcon = ({ open }: { open?: boolean }) => (
  <svg
    className={`w-4 h-4 text-white/40 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

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
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Trigger Styles</h2>
        <p className="text-sm text-white/50">How the combobox trigger looks (aligning with Input)</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Pure Float (Recommended)">
          <div className="relative">
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer"
              onClick={() => setOpenA(!openA)}
              style={{
                background: openA
                  ? 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)'
                  : 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                boxShadow: openA
                  ? '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <SearchIcon />
              <input
                type="text"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
                placeholder="Search options..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
              />
              <ChevronIcon open={openA} />
            </div>
            {openA && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {options.filter(o => o.toLowerCase().includes(searchA.toLowerCase())).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSearchA(opt); setOpenA(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-green-400 mt-3">Matches Input Pure Float treatment</p>
        </CardWrapper>

        <CardWrapper label="B: Bordered">
          <div className="relative">
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer border transition-all ${
                openB ? 'border-white/30 bg-white/5' : 'border-white/10 bg-transparent'
              }`}
              onClick={() => setOpenB(!openB)}
            >
              <SearchIcon />
              <input
                type="text"
                value={searchB}
                onChange={(e) => setSearchB(e.target.value)}
                placeholder="Search options..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
              />
              <ChevronIcon open={openB} />
            </div>
            {openB && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-1 z-50 border border-white/10 bg-[#1c1c1c]">
                {options.filter(o => o.toLowerCase().includes(searchB.toLowerCase())).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSearchB(opt); setOpenB(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// OPTION STYLES
// ============================================
export const Option_Styles = () => {
  const [selectedA, setSelectedA] = useState('Overview');
  const [selectedB, setSelectedB] = useState('Overview');
  const [selectedC, setSelectedC] = useState('Overview');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Option Styles</h2>
        <p className="text-sm text-white/50">How dropdown options look (aligning with Dropdown)</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Glass Hover + Check (Recommended)">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {options.slice(0, 4).map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedA(opt)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedA === opt ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt}
                {selectedA === opt && <CheckIcon />}
              </button>
            ))}
          </div>
          <p className="text-xs text-green-400 mt-3">Matches Dropdown pattern</p>
        </CardWrapper>

        <CardWrapper label="B: Glass Hover + Highlight Bar">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {options.slice(0, 4).map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedB(opt)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedB === opt
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper label="C: Border Highlight">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {options.slice(0, 4).map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedC(opt)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors border ${
                  selectedC === opt
                    ? 'text-white border-white/20'
                    : 'text-white/60 border-transparent hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// CREATE CTA
// ============================================
export const Create_CTA = () => {
  const [searchA, setSearchA] = useState('newtag');
  const [searchB, setSearchB] = useState('newtag');
  const [searchC, setSearchC] = useState('newtag');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Create CTA</h2>
        <p className="text-sm text-white/50">How the "Create new" option looks</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <CardWrapper label="A: Gold Text (Recommended)">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-3 py-2 text-xs text-white/40">No results</div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FFD700] hover:bg-white/[0.06] transition-colors">
              <span className="text-[#FFD700]">+</span>
              Create "{searchA}"
            </button>
          </div>
          <p className="text-xs text-green-400 mt-3">Gold-as-light for CTA</p>
        </CardWrapper>

        <CardWrapper label="B: White Text">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-3 py-2 text-xs text-white/40">No results</div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/[0.06] transition-colors">
              <span>+</span>
              Create "{searchB}"
            </button>
          </div>
        </CardWrapper>

        <CardWrapper label="C: Gold Background">
          <div
            className="rounded-xl p-1"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-3 py-2 text-xs text-white/40">No results</div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#FFD700] text-black transition-colors">
              <span>+</span>
              Create "{searchC}"
            </button>
          </div>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE
// ============================================
export const Empty_State = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Empty State</h2>
      <p className="text-sm text-white/50">How "no results" looks</p>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <CardWrapper label="A: Simple Text (Recommended)">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <p className="text-sm text-white/40 text-center">No results found</p>
        </div>
        <p className="text-xs text-green-400 mt-3">Minimal, unobtrusive</p>
      </CardWrapper>

      <CardWrapper label="B: With Icon">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <SearchIcon />
            <p className="text-sm text-white/40">No results found</p>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: With Suggestion">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <p className="text-sm text-white/40 text-center">No results found</p>
          <p className="text-xs text-white/30 text-center mt-1">Try a different search term</p>
        </div>
      </CardWrapper>
    </div>
  </div>
);

// ============================================
// LOADING STATE
// ============================================
export const Loading_State = () => (
  <div className="space-y-8 p-4">
    <div>
      <h2 className="text-lg font-semibold text-white mb-2">Loading State</h2>
      <p className="text-sm text-white/50">How loading looks for async search</p>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <CardWrapper label="A: Spinner (Recommended)">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-sm text-white/40">Loading...</p>
          </div>
        </div>
        <p className="text-xs text-green-400 mt-3">Matches Button loading</p>
      </CardWrapper>

      <CardWrapper label="B: Skeleton">
        <div
          className="rounded-xl p-2"
          style={{
            background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6)',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 px-3 py-2 rounded-lg">
              <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
            </div>
          ))}
        </div>
      </CardWrapper>
    </div>
  </div>
);
