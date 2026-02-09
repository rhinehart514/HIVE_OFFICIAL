import type { Config } from 'tailwindcss';
import { foundation, semantic, components } from '@hive/tokens';

/**
 * HIVE Design System Tailwind Configuration
 * Single source of truth: @hive/tokens/design-system-v2
 *
 * THE PHILOSOPHY:
 * - 95% grayscale, 5% gold (the campfire)
 * - Neutral grays, gold brings warmth
 * - Motion answers questions, not decoration
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        display: ['Clash Display', 'SF Pro Display', 'system-ui', 'sans-serif'],
        body: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'ui-monospace', 'monospace'],
        sans: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['72px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-xl': ['56px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'title-lg': ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        'title': ['20px', { lineHeight: '1.25', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.25', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'fine': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },

      // ============================================
      // COLORS - From @hive/tokens (unified source)
      // ============================================
      colors: {
        // Foundation Surfaces - Neutral grays from tokens
        void: '#000000',
        ground: foundation.gray[1000],       // #0A0A0A
        surface: {
          DEFAULT: foundation.gray[900],     // #141414
          hover: foundation.gray[800],       // #1A1A1A
          active: foundation.gray[750],      // #242424
        },
        elevated: foundation.gray[800],      // #1A1A1A

        // Text Hierarchy - From semantic tokens
        'text-primary': foundation.gray[50],   // #FAFAFA
        'text-secondary': foundation.gray[200], // #A1A1A6
        'text-tertiary': foundation.gray[300],  // #818187
        'text-muted': foundation.gray[350],     // #71717A
        'text-ghost': foundation.gray[400],     // #52525B
        'text-inverse': foundation.black,       // #000000

        // Interactive Surfaces
        interactive: {
          DEFAULT: semantic.interactive.hover,  // rgba(255, 255, 255, 0.04)
          hover: semantic.interactive.active,   // rgba(255, 255, 255, 0.08)
          active: 'rgba(255, 255, 255, 0.12)',
        },

        // Gold - THE CAMPFIRE (from tokens)
        life: {
          gold: foundation.gold[500],          // #FFD700
          'gold-hover': foundation.gold.hover, // #E6C200
          'gold-active': foundation.gold.dim,  // #CC9900
          pulse: foundation.gold[500],
          glow: 'transparent',
          subtle: foundation.gold.subtle,      // rgba(255, 215, 0, 0.1)
          edge: foundation.gold.border,
        },

        // Status - From semantic tokens
        status: {
          error: semantic.status.error,        // #FF3737
          'error-subtle': semantic.status.errorDim,
          warning: semantic.status.warning,    // #FFB800
          'warning-subtle': semantic.status.warningDim,
          success: semantic.status.success,    // #00D46A
          'success-subtle': semantic.status.successDim,
        },

        // Borders - From semantic tokens
        border: {
          subtle: semantic.border.subtle,      // rgba(255, 255, 255, 0.04)
          DEFAULT: semantic.border.medium,     // rgba(255, 255, 255, 0.08)
          emphasis: semantic.border.visible,   // rgba(255, 255, 255, 0.16)
        },

        // Focus (WHITE, never gold)
        focus: {
          ring: semantic.interactive.focus,    // rgba(255, 255, 255, 0.5)
        },

        // Legacy aliases - Map to token values
        hive: {
          page: foundation.gray[1000],
          card: foundation.gray[900],
          hover: foundation.gray[800],
          elevated: foundation.gray[800],
          border: semantic.border.medium,
          'border-subtle': semantic.border.subtle,
          gold: foundation.gold[500],
        },
      },

      // ============================================
      // SPACING (from LANGUAGE.md Part 3)
      // ============================================
      spacing: {
        // The scale (4px base)
        'px': '1px',
        '0': '0',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
      },

      // ============================================
      // DEPTH (from LANGUAGE.md Part 5)
      // Updated 2026-01-29 to match Visual Direction spec (round 16px+)
      // ============================================
      borderRadius: {
        'none': '0',
        'sm': '8px',       // was 4px - bumped for rounder feel
        'DEFAULT': '12px', // was 8px - standard cards/inputs
        'md': '12px',      // was 8px - same as default
        'lg': '16px',      // was 12px - larger cards
        'xl': '20px',      // was 16px - modals, hero elements
        '2xl': '24px',     // unchanged - extra large
        '3xl': '32px',     // new - for special cases
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.6)',
        // Legacy aliases with no glow behavior
        'glow-sm': 'none',
        'glow-md': 'none',
        'glow-lg': 'none',
        // White glow (for focus/hover)
        'glow-white': 'none',
        // Focus ring
        'focus': '0 0 0 2px rgba(255, 255, 255, 0.5)',
      },
      backdropBlur: {
        'subtle': '0px',
        'glass': '0px',
        'medium': '0px',
        'heavy': '0px',
        'atmosphere': '0px',
      },
      zIndex: {
        'base': '0',
        'raised': '10',
        'dropdown': '20',
        'sticky': '30',
        'modal': '40',
        'overlay': '50',
        'toast': '60',
        'tooltip': '70',
        'max': '100',
      },

      // ============================================
      // MOTION (from LANGUAGE.md Part 4)
      // ============================================
      transitionDuration: {
        'instant': '0ms',
        'snap': '100ms',
        'fast': '150ms',
        'quick': '150ms',
        'smooth': '150ms',
        'gentle': '200ms',
        'slow': '250ms',
        'dramatic': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        // Error feedback animation
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        // Legacy animations (preserved)
        'shine-rotate': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        'border-beam': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
      },
      animation: {
        // Error feedback
        'shake': 'shake 0.5s ease-in-out',
        // Legacy animations
        'shine-rotate': 'shine-rotate var(--shine-duration, 14s) linear infinite',
        'border-beam': 'border-beam var(--beam-duration, 12s) linear infinite',
      },

      // ============================================
      // CONTAINERS (from SYSTEMS.md Layout)
      // ============================================
      maxWidth: {
        'narrow': '640px',
        'standard': '960px',
        'wide': '1200px',
      },
      // Perspective utilities for 3D transforms (motion primitives)
      perspective: {
        none: 'none',
        500: '500px',
        1000: '1000px',
        2000: '2000px',
      },
    },
  },
  plugins: [
    // Custom perspective utility plugin
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.perspective-none': { perspective: 'none' },
        '.perspective-500': { perspective: '500px' },
        '.perspective-1000': { perspective: '1000px' },
        '.perspective-2000': { perspective: '2000px' },
        '.transform-style-flat': { transformStyle: 'flat' },
        '.transform-style-3d': { transformStyle: 'preserve-3d' },
        '.backface-visible': { backfaceVisibility: 'visible' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
      });
    },
  ],
};

export default config;
