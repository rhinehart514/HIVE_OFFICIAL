'use client';

/**
 * InputLab - Tech Vibe + Bubbly (No Outlines)
 *
 * Direction: Floating inputs with tech edge
 * NO ring outlines - use shadows and glows instead
 */

import type { Meta } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Experiments/Input Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

const CardWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="space-y-2">
    <div className="text-xs text-white/50">{label}</div>
    <div
      className="rounded-2xl p-5 backdrop-blur-xl"
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
// TECH VIBE STYLES (No outlines)
// ============================================
export const Tech_Vibe = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Tech Vibe (No Outlines)</h2>
    <p className="text-sm text-white/50">Bubbly + technical edge, shadows only</p>

    <div className="grid grid-cols-2 gap-6 max-w-2xl">
      <CardWrapper label="A: Pure Shadow Float">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>

      <CardWrapper label="B: Deep Shadow (Tech)">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(42,42,45,1) 0%, rgba(32,32,35,1) 100%)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>

      <CardWrapper label="C: Subtle Blue Undertone">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(42,44,52,1) 0%, rgba(32,34,42,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>

      <CardWrapper label="D: Sharp Inset Line">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>

      <CardWrapper label="E: Gradient Glow (Techy)">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(50,50,55,1) 0%, rgba(35,35,40,1) 100%)',
            boxShadow: '0 0 24px rgba(80,80,100,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>

      <CardWrapper label="F: Ambient Glow">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
          style={{
            background: 'rgba(44,44,48,1)',
            boxShadow: '0 0 30px rgba(60,60,80,0.12), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
          placeholder="Type something..."
        />
      </CardWrapper>
    </div>
  </div>
);
Tech_Vibe.storyName = '1. Tech Vibe';

// ============================================
// FOCUS WITHOUT OUTLINE
// ============================================
export const Focus_No_Outline = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Focus States (No Outline)</h2>
    <p className="text-sm text-white/50">Click to see - shadow/glow based focus</p>

    <div className="grid grid-cols-2 gap-6 max-w-2xl">
      <CardWrapper label="A: Lift + Brighten">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onFocus={(e) => {
            e.target.style.background = 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)';
            e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onBlur={(e) => {
            e.target.style.background = 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)';
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
            e.target.style.transform = 'translateY(0)';
          }}
          placeholder="Click to focus..."
        />
      </CardWrapper>

      <CardWrapper label="B: Tech Glow Pulse">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(44,44,48,1) 0%, rgba(34,34,38,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 32px rgba(100,100,140,0.15), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)';
          }}
          placeholder="Click to focus..."
        />
      </CardWrapper>

      <CardWrapper label="C: Edge Sharpen">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.08)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
          }}
          placeholder="Click to focus..."
        />
      </CardWrapper>

      <CardWrapper label="D: Subtle Gold Hint (CTA only)">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
          style={{
            background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = '0 0 20px rgba(255,215,0,0.08), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
          }}
          placeholder="Click to focus..."
        />
      </CardWrapper>
    </div>
  </div>
);
Focus_No_Outline.storyName = '2. Focus (No Outline)';

// ============================================
// TECH ACCENTS
// ============================================
export const Tech_Accents = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Tech Accents</h2>
    <p className="text-sm text-white/50">Subtle technical details</p>

    <div className="grid grid-cols-2 gap-6 max-w-2xl">
      <CardWrapper label="A: Corner Accent">
        <div className="relative">
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
            style={{
              background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            placeholder="Type something..."
          />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-xl" />
        </div>
      </CardWrapper>

      <CardWrapper label="B: Mono Placeholder">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/25 placeholder:font-mono placeholder:text-xs rounded-xl outline-none"
          style={{
            background: 'linear-gradient(180deg, rgba(44,44,48,1) 0%, rgba(34,34,38,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
          placeholder="ENTER_VALUE"
        />
      </CardWrapper>

      <CardWrapper label="C: Status Bar">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div className="h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <input
            className="w-full h-10 px-4 text-sm text-white placeholder:text-white/30 bg-transparent outline-none"
            placeholder="Type something..."
          />
        </div>
      </CardWrapper>

      <CardWrapper label="D: Cursor Blink Accent">
        <input
          className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none caret-[#FFD700]"
          style={{
            background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          placeholder="Gold cursor..."
        />
      </CardWrapper>

      <CardWrapper label="E: Gradient Edge">
        <div
          className="rounded-xl p-[1px]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-[11px] outline-none"
            style={{
              background: 'linear-gradient(180deg, rgba(46,46,46,1) 0%, rgba(36,36,36,1) 100%)',
            }}
            placeholder="Type something..."
          />
        </div>
      </CardWrapper>

      <CardWrapper label="F: Scan Line">
        <div className="relative overflow-hidden rounded-xl">
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 outline-none relative z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(44,44,48,1) 0%, rgba(34,34,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
            placeholder="Type something..."
          />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.01)_2px,rgba(255,255,255,0.01)_4px)] pointer-events-none" />
        </div>
      </CardWrapper>
    </div>
  </div>
);
Tech_Accents.storyName = '3. Tech Accents';

// ============================================
// COMPOSER (TECH STYLE)
// ============================================
export const Composer_Tech = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Composer (Tech Style)</h2>

    <div className="max-w-xl space-y-6">
      <CardWrapper label="A: Clean Tech">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(48,48,52,1) 0%, rgba(36,36,40,1) 100%)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <textarea
            className="w-full min-h-[52px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 bg-transparent outline-none resize-none"
            placeholder="Message..."
            rows={1}
          />
        </div>
      </CardWrapper>

      <CardWrapper label="B: With Tech Footer">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(48,48,52,1) 0%, rgba(36,36,40,1) 100%)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <textarea
            className="w-full min-h-[52px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 bg-transparent outline-none resize-none"
            placeholder="Message..."
            rows={1}
          />
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/20">
            <div className="flex gap-2">
              <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors text-xs">+</button>
              <button className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors text-xs">@</button>
            </div>
            <button className="h-7 w-7 rounded-lg bg-[#FFD700] text-black flex items-center justify-center text-xs font-bold">→</button>
          </div>
        </div>
      </CardWrapper>

      <CardWrapper label="C: Floating Pill + CTA">
        <div
          className="rounded-full flex items-center gap-2 pr-1"
          style={{
            background: 'linear-gradient(180deg, rgba(50,50,54,1) 0%, rgba(40,40,44,1) 100%)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <input
            className="flex-1 h-12 pl-5 pr-2 text-sm text-white placeholder:text-white/30 bg-transparent outline-none"
            placeholder="Ask anything..."
          />
          <button className="w-10 h-10 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold shrink-0">→</button>
        </div>
      </CardWrapper>
    </div>
  </div>
);
Composer_Tech.storyName = '4. Composer Tech';

// ============================================
// ERROR STATES
// ============================================
export const Error_Tech = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Error States (Tech)</h2>

    <div className="grid grid-cols-2 gap-6 max-w-2xl">
      <CardWrapper label="A: Red Glow (No border)">
        <div className="space-y-2">
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
            style={{
              background: 'linear-gradient(180deg, rgba(55,40,42,1) 0%, rgba(42,32,34,1) 100%)',
              boxShadow: '0 0 20px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            placeholder="Invalid"
          />
          <p className="text-xs text-red-400/80 font-mono">ERROR: Required field</p>
        </div>
      </CardWrapper>

      <CardWrapper label="B: Subtle Warning">
        <div className="space-y-2">
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(239,68,68,0.3)',
            }}
            placeholder="Invalid"
          />
          <p className="text-xs text-red-400/80">This field is required</p>
        </div>
      </CardWrapper>
    </div>
  </div>
);
Error_Tech.storyName = '5. Error States';

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-semibold text-white">Final Candidates (Tech + Bubbly)</h2>

    <div className="grid grid-cols-2 gap-8 max-w-2xl">
      <CardWrapper label="A: Pure Float (recommended)">
        <div className="space-y-2">
          <label className="text-xs text-white/40">Email</label>
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={(e) => {
              e.target.style.background = 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)';
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            placeholder="you@example.com"
          />
        </div>
      </CardWrapper>

      <CardWrapper label="B: Tech Undertone">
        <div className="space-y-2">
          <label className="text-xs text-white/40">Search</label>
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200"
            style={{
              background: 'linear-gradient(180deg, rgba(44,44,50,1) 0%, rgba(34,34,40,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 24px rgba(80,80,120,0.12), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)';
            }}
            placeholder="Search spaces..."
          />
        </div>
      </CardWrapper>

      <CardWrapper label="C: Gold Cursor Accent">
        <div className="space-y-2">
          <label className="text-xs text-white/40">Message</label>
          <input
            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none transition-all duration-200 caret-[#FFD700]"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 0 16px rgba(255,215,0,0.06), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            placeholder="Type here..."
          />
        </div>
      </CardWrapper>

      <CardWrapper label="D: Pill Search">
        <div className="space-y-2">
          <label className="text-xs text-white/40">Quick find</label>
          <input
            className="w-full h-11 px-5 text-sm text-white placeholder:text-white/30 rounded-full outline-none transition-all duration-200"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
            }}
            placeholder="Search..."
          />
        </div>
      </CardWrapper>
    </div>
  </div>
);
Final_Candidates.storyName = '6. Final Candidates';
