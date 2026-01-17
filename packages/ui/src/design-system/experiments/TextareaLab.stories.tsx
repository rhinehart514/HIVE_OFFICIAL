'use client';

/**
 * TextareaLab - Textarea Experiments
 *
 * Testing: surface treatment, focus states, resize behavior
 * Aligning with: Input (Pure Float), shadow-based focus
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Experiments/Textarea Lab',
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

// LOCKED: Pure Float surfaces (from Input)
const surfaces = {
  resting: {
    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  focused: {
    background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  error: {
    background: 'linear-gradient(180deg, rgba(48,38,38,1) 0%, rgba(38,28,28,1) 100%)',
    boxShadow: '0 4px 16px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
};

// ============================================
// SURFACE STYLES
// ============================================
export const Surface_Styles = () => {
  const [focused1, setFocused1] = useState(false);
  const [focused2, setFocused2] = useState(false);
  const [focused3, setFocused3] = useState(false);
  const [focused4, setFocused4] = useState(false);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Textarea Surface Styles</h2>
        <p className="text-sm text-white/50">Should match Input - Pure Float, shadow focus</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Pure Float (Matches Input)">
          <textarea
            placeholder="Write something..."
            className="w-full h-32 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused1 ? surfaces.focused : surfaces.resting}
            onFocus={() => setFocused1(true)}
            onBlur={() => setFocused1(false)}
          />
        </CardWrapper>

        <CardWrapper label="B: Pure Float + Resize Handle">
          <textarea
            placeholder="Write something..."
            className="w-full h-32 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-y outline-none transition-all duration-150"
            style={focused2 ? surfaces.focused : surfaces.resting}
            onFocus={() => setFocused2(true)}
            onBlur={() => setFocused2(false)}
          />
          <p className="text-xs text-white/40 mt-2">Vertical resize enabled</p>
        </CardWrapper>

        <CardWrapper label="C: With Character Count">
          <div className="relative">
            <textarea
              placeholder="Write something..."
              className="w-full h-32 rounded-xl px-4 py-3 pb-8 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
              style={focused3 ? surfaces.focused : surfaces.resting}
              onFocus={() => setFocused3(true)}
              onBlur={() => setFocused3(false)}
              maxLength={280}
            />
            <span className="absolute bottom-3 right-4 text-xs text-white/30">0/280</span>
          </div>
        </CardWrapper>

        <CardWrapper label="D: Error State">
          <textarea
            placeholder="Write something..."
            className="w-full h-32 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={surfaces.error}
            defaultValue="Invalid content..."
          />
          <p className="text-xs text-red-400 mt-2">This field has an error</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// SIZES
// ============================================
export const Sizes = () => {
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Textarea Sizes</h2>
        <p className="text-sm text-white/50">Height variations</p>
      </div>

      <div className="space-y-6">
        <CardWrapper label="Small (2 rows)">
          <textarea
            placeholder="Short message..."
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'sm' ? surfaces.focused : surfaces.resting}
            onFocus={() => setFocused('sm')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>

        <CardWrapper label="Default (4 rows)">
          <textarea
            placeholder="Write your message..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'default' ? surfaces.focused : surfaces.resting}
            onFocus={() => setFocused('default')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>

        <CardWrapper label="Large (8 rows)">
          <textarea
            placeholder="Write a longer message..."
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'lg' ? surfaces.focused : surfaces.resting}
            onFocus={() => setFocused('lg')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// AUTO-RESIZE (Smooth)
// ============================================
export const Auto_Resize = () => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize with smooth transition
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Auto-Resize Textarea</h2>
        <p className="text-sm text-white/50">Grows smoothly with content</p>
      </div>

      <CardWrapper label="Smooth Auto-expanding">
        <textarea
          ref={textareaRef}
          placeholder="Start typing... textarea will grow smoothly"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-[80px] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none"
          style={{
            ...(focused ? surfaces.focused : surfaces.resting),
            transition: 'height 150ms ease-out, background 150ms ease, box-shadow 150ms ease',
            overflow: 'hidden',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <p className="text-xs text-white/40 mt-2">Characters: {value.length}</p>
      </CardWrapper>
    </div>
  );
};

// ============================================
// SURFACE OPTIONS (Pick One)
// ============================================
export const Surface_Options = () => {
  const [focused, setFocused] = useState<string | null>(null);

  // A: Pure Float (matches Input)
  const pureFloat = {
    resting: {
      background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    focused: {
      background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
  };

  // B: Glass Surface (matches Badge/Tabs)
  const glass = {
    resting: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)',
    },
    focused: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 20px rgba(0,0,0,0.35)',
    },
  };

  // C: Recessed/Inset (carved into surface)
  const recessed = {
    resting: {
      background: 'linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(28,28,28,1) 100%)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,0,0,0.3)',
    },
    focused: {
      background: 'linear-gradient(180deg, rgba(25,25,25,1) 0%, rgba(32,32,32,1) 100%)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
    },
  };

  // D: Minimal (almost flat, very subtle)
  const minimal = {
    resting: {
      background: 'rgba(255,255,255,0.05)',
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    focused: {
      background: 'rgba(255,255,255,0.08)',
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.2)',
    },
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Surface Options</h2>
        <p className="text-sm text-white/50">Pick one surface treatment</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Pure Float (Matches Input)">
          <textarea
            placeholder="Write something..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'a' ? pureFloat.focused : pureFloat.resting}
            onFocus={() => setFocused('a')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Elevated, shadow-based focus</p>
        </CardWrapper>

        <CardWrapper label="B: Glass Surface">
          <textarea
            placeholder="Write something..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'b' ? glass.focused : glass.resting}
            onFocus={() => setFocused('b')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Transparent, matches Badge</p>
        </CardWrapper>

        <CardWrapper label="C: Recessed/Inset">
          <textarea
            placeholder="Write something..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'c' ? recessed.focused : recessed.resting}
            onFocus={() => setFocused('c')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Carved into card surface</p>
        </CardWrapper>

        <CardWrapper label="D: Minimal Flat">
          <textarea
            placeholder="Write something..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'd' ? minimal.focused : minimal.resting}
            onFocus={() => setFocused('d')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Nearly invisible, border only</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// FOCUS OPTIONS (Pick One)
// ============================================
export const Focus_Options = () => {
  const [focused, setFocused] = useState<string | null>(null);

  const baseSurface = {
    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Focus Options</h2>
        <p className="text-sm text-white/50">Pick one focus treatment</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: Shadow Deepen (Matches Input)">
          <textarea
            placeholder="Click to focus..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              ...baseSurface,
              boxShadow: focused === 'a'
                ? '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused('a')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Shadow gets deeper</p>
        </CardWrapper>

        <CardWrapper label="B: White Glow">
          <textarea
            placeholder="Click to focus..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              ...baseSurface,
              boxShadow: focused === 'b'
                ? '0 0 0 2px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.4)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused('b')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Subtle white outline</p>
        </CardWrapper>

        <CardWrapper label="C: Gold Glow (Premium)">
          <textarea
            placeholder="Click to focus..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              ...baseSurface,
              boxShadow: focused === 'c'
                ? '0 0 0 2px rgba(255,215,0,0.2), 0 0 20px rgba(255,215,0,0.1), 0 4px 16px rgba(0,0,0,0.4)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused('c')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-amber-400/60 mt-2">Gold glow (may violate budget)</p>
        </CardWrapper>

        <CardWrapper label="D: Brighten Surface">
          <textarea
            placeholder="Click to focus..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              background: focused === 'd'
                ? 'linear-gradient(180deg, rgba(60,60,60,1) 0%, rgba(50,50,50,1) 100%)'
                : 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused('d')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Surface gets lighter</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RADIUS OPTIONS (Pick One)
// ============================================
export const Radius_Options = () => {
  const [focused, setFocused] = useState<string | null>(null);

  const surface = {
    resting: {
      background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    focused: {
      background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Radius Options</h2>
        <p className="text-sm text-white/50">Pick corner radius</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: rounded-lg (8px)">
          <textarea
            placeholder="Write something..."
            rows={3}
            className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'a' ? surface.focused : surface.resting}
            onFocus={() => setFocused('a')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>

        <CardWrapper label="B: rounded-xl (12px) - Matches Input">
          <textarea
            placeholder="Write something..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'b' ? surface.focused : surface.resting}
            onFocus={() => setFocused('b')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>

        <CardWrapper label="C: rounded-2xl (16px)">
          <textarea
            placeholder="Write something..."
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'c' ? surface.focused : surface.resting}
            onFocus={() => setFocused('c')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>

        <CardWrapper label="D: rounded-3xl (24px)">
          <textarea
            placeholder="Write something..."
            rows={3}
            className="w-full rounded-3xl px-5 py-4 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'd' ? surface.focused : surface.resting}
            onFocus={() => setFocused('d')}
            onBlur={() => setFocused(null)}
          />
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RESIZE OPTIONS (Pick One)
// ============================================
export const Resize_Options = () => {
  const [focused, setFocused] = useState<string | null>(null);

  const surface = {
    resting: {
      background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    focused: {
      background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Resize Options</h2>
        <p className="text-sm text-white/50">Pick resize behavior</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="A: No Resize (Fixed)">
          <textarea
            placeholder="Cannot resize..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'a' ? surface.focused : surface.resting}
            onFocus={() => setFocused('a')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Clean, predictable layout</p>
        </CardWrapper>

        <CardWrapper label="B: Vertical Resize">
          <textarea
            placeholder="Drag corner to resize height..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-y outline-none transition-all duration-150"
            style={focused === 'b' ? surface.focused : surface.resting}
            onFocus={() => setFocused('b')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">User can expand height</p>
        </CardWrapper>

        <CardWrapper label="C: Both Directions">
          <textarea
            placeholder="Resize any direction..."
            rows={4}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize outline-none transition-all duration-150"
            style={focused === 'c' ? surface.focused : surface.resting}
            onFocus={() => setFocused('c')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Full control (can break layout)</p>
        </CardWrapper>

        <CardWrapper label="D: Auto-grow (No handle)">
          <textarea
            placeholder="Grows as you type..."
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              ...(focused === 'd' ? surface.focused : surface.resting),
              minHeight: '80px',
            }}
            onFocus={() => setFocused('d')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-white/40 mt-2">Auto-expands with content</p>
        </CardWrapper>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDATIONS (My Picks)
// ============================================
export const Recommendations = () => {
  const [focused, setFocused] = useState<string | null>(null);
  const [autoValue, setAutoValue] = useState('');
  const autoRef = React.useRef<HTMLTextAreaElement>(null);

  // Smooth auto-resize
  React.useEffect(() => {
    const textarea = autoRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [autoValue]);

  // Recommended: Pure Float surface
  const surface = {
    resting: {
      background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    },
    focused: {
      background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    },
  };

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Recommendations</h2>
        <p className="text-sm text-white/50">My picks for each category</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <CardWrapper label="SURFACE: A - Pure Float">
          <textarea
            placeholder="Matches Input exactly..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'surface' ? surface.focused : surface.resting}
            onFocus={() => setFocused('surface')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-amber-400/60 mt-2">Consistency with Input/Select</p>
        </CardWrapper>

        <CardWrapper label="FOCUS: A - Shadow Deepen">
          <textarea
            placeholder="Click to see shadow deepen..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: focused === 'focus'
                ? '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onFocus={() => setFocused('focus')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-amber-400/60 mt-2">No ring, shadow-based like Input</p>
        </CardWrapper>

        <CardWrapper label="RADIUS: B - rounded-xl">
          <textarea
            placeholder="12px radius..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'radius' ? surface.focused : surface.resting}
            onFocus={() => setFocused('radius')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-amber-400/60 mt-2">Matches Input exactly</p>
        </CardWrapper>

        <CardWrapper label="RESIZE: A - No Resize (default)">
          <textarea
            placeholder="Fixed height, clean layout..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none transition-all duration-150"
            style={focused === 'resize' ? surface.focused : surface.resting}
            onFocus={() => setFocused('resize')}
            onBlur={() => setFocused(null)}
          />
          <p className="text-xs text-amber-400/60 mt-2">Optional prop for resize/auto-grow</p>
        </CardWrapper>
      </div>

      <CardWrapper label="BONUS: Smooth Auto-Grow Variant">
        <textarea
          ref={autoRef}
          placeholder="Type to see smooth expansion..."
          value={autoValue}
          onChange={(e) => setAutoValue(e.target.value)}
          className="w-full min-h-[80px] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 resize-none outline-none"
          style={{
            ...(focused === 'auto' ? surface.focused : surface.resting),
            transition: 'height 150ms ease-out, background 150ms ease, box-shadow 150ms ease',
            overflow: 'hidden',
          }}
          onFocus={() => setFocused('auto')}
          onBlur={() => setFocused(null)}
        />
        <p className="text-xs text-white/40 mt-2">Available as autoGrow prop</p>
      </CardWrapper>

      <CardWrapper label="SUMMARY">
        <div className="text-xs space-y-2">
          <p className="text-amber-400">Surface: A - Pure Float (matches Input)</p>
          <p className="text-amber-400">Focus: A - Shadow Deepen (no ring)</p>
          <p className="text-amber-400">Radius: B - rounded-xl (12px)</p>
          <p className="text-amber-400">Resize: A - None (with optional prop)</p>
          <div className="border-t border-white/10 pt-2 mt-2">
            <p className="text-white/50">Result: Textarea identical to Input in every way</p>
            <p className="text-white/50">Props: rows, autoGrow, resize, error</p>
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};
