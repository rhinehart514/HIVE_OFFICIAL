import type { Config } from 'tailwindcss';

/**
 * HIVE Design System Tailwind Configuration
 * Aligned with design-system/LANGUAGE.md
 *
 * THE PHILOSOPHY:
 * - 95% grayscale, 5% gold (the campfire)
 * - Warm darks, not cold tech
 * - Motion answers questions, not decoration
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // TYPOGRAPHY (from LANGUAGE.md Part 1)
      // ============================================
      fontFamily: {
        // Primary fonts
        display: ['Clash Display', 'SF Pro Display', 'system-ui', 'sans-serif'],
        body: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'ui-monospace', 'monospace'],
        // Legacy alias
        sans: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display Scale (Clash Display at 32px+)
        'hero': ['72px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-xl': ['56px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        // Interface Scale (Geist)
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
      // COLORS (from LANGUAGE.md Part 2)
      // ============================================
      colors: {
        // Foundation Surfaces - Warm darks
        void: '#050504',
        ground: '#0A0A09',
        surface: {
          DEFAULT: '#141312',
          hover: '#1A1917',
          active: '#252521',
        },
        elevated: '#1E1D1B',

        // Text Hierarchy - Slightly warm whites
        'text-primary': '#FAF9F7',
        'text-secondary': '#A3A19E',
        'text-tertiary': '#6B6B70',
        'text-muted': '#3D3D42',
        'text-ghost': '#2A2A2E',
        'text-inverse': '#0A0A09',

        // Interactive Surfaces
        interactive: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.10)',
          active: 'rgba(255, 255, 255, 0.15)',
        },

        // Life Colors (Gold) - THE CAMPFIRE
        life: {
          gold: '#FFD700',
          'gold-hover': '#FFDF33',
          'gold-active': '#E5C200',
          pulse: 'rgba(255, 215, 0, 0.60)',
          glow: 'rgba(255, 215, 0, 0.15)',
          subtle: 'rgba(255, 215, 0, 0.08)',
          edge: 'rgba(255, 215, 0, 0.15)',
        },

        // Status (ultra-rare)
        status: {
          error: '#EF4444',
          'error-subtle': 'rgba(239, 68, 68, 0.15)',
          warning: '#F59E0B',
          'warning-subtle': 'rgba(245, 158, 11, 0.15)',
          success: '#22C55E',
          'success-subtle': 'rgba(34, 197, 94, 0.15)',
        },

        // Borders
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.10)',
          emphasis: 'rgba(255, 255, 255, 0.15)',
        },

        // Focus (WHITE, never gold)
        focus: {
          ring: 'rgba(255, 255, 255, 0.50)',
        },

        // Legacy aliases
        hive: {
          page: '#0A0A09',
          card: '#141312',
          hover: '#1A1917',
          elevated: '#1E1D1B',
          border: 'rgba(255, 255, 255, 0.10)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          gold: '#FFD700',
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
      // ============================================
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.6)',
        // Gold glows (for life elements)
        'glow-sm': '0 0 20px rgba(255, 215, 0, 0.15)',
        'glow-md': '0 0 40px rgba(255, 215, 0, 0.20)',
        'glow-lg': '0 0 60px rgba(255, 215, 0, 0.25)',
        // White glow (for focus/hover)
        'glow-white': '0 0 30px rgba(255, 255, 255, 0.10)',
        // Focus ring
        'focus': '0 0 0 2px rgba(255, 255, 255, 0.5)',
      },
      backdropBlur: {
        'subtle': '4px',
        'glass': '8px',
        'medium': '12px',
        'heavy': '16px',
        'atmosphere': '40px',
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
        'quick': '200ms',
        'smooth': '300ms',
        'gentle': '400ms',
        'slow': '500ms',
        'dramatic': '700ms',
        'breathe': '3000ms',
        'drift': '20000ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        // Life animations (from LANGUAGE.md)
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, 5px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 215, 0, 0)' },
        },
      },
      animation: {
        // Design system animations
        'breathe': 'breathe 4s ease-in-out infinite',
        'pulse-life': 'pulse 3s ease-in-out infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        // Legacy animations
        'shine-rotate': 'shine-rotate var(--shine-duration, 14s) linear infinite',
        'border-beam': 'border-beam var(--beam-duration, 12s) linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
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
