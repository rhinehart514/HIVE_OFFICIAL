import type { Config } from 'tailwindcss';
import { hiveTailwindConfig, breakpointValues } from '@hive/tokens';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark-only mode - no light theme toggle needed
  darkMode: 'class',
  theme: {
    // Override default screens with token breakpoints
    screens: breakpointValues,
    extend: {
      // Spread all token-driven config (colors, spacing, fontSize, fontFamily,
      // fontWeight, lineHeight, letterSpacing, borderRadius, boxShadow,
      // backdropBlur, transitionDuration, transitionTimingFunction,
      // animation, keyframes, height, width)
      ...hiveTailwindConfig,

      // Web-specific font family overrides (display + manifesto not in tokens)
      fontFamily: {
        ...hiveTailwindConfig.fontFamily,
        sans: ['var(--hive-font-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        display: ['var(--hive-font-display)', 'Clash Display', 'system-ui', 'sans-serif'],
        mono: ['var(--hive-font-mono)', 'Geist Mono', 'monospace'],
        manifesto: ['var(--hive-font-manifesto)', 'Clash Display', 'system-ui', 'sans-serif'],
      },

      // Web-specific color overrides (compatibility aliases)
      colors: {
        ...hiveTailwindConfig.colors,
        // Gold shorthand for direct usage (e.g. text-gold-500)
        gold: {
          500: '#FFD700',
          400: '#FFE033',
          600: '#E6C200',
        },
        // Legacy glass aliases collapsed into solid cold surfaces
        glass: {
          bg: 'var(--bg-surface)',
          border: 'var(--border-default)',
          hover: 'var(--bg-surface-hover)',
          active: 'var(--bg-elevated)',
        },
        // Semantic opacity-based colors
        overlay: {
          ghost: 'rgba(255, 255, 255, 0.04)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          muted: 'rgba(255, 255, 255, 0.08)',
          soft: 'rgba(255, 255, 255, 0.10)',
          medium: 'rgba(255, 255, 255, 0.12)',
          visible: 'rgba(255, 255, 255, 0.15)',
          strong: 'rgba(255, 255, 255, 0.20)',
          prominent: 'rgba(255, 255, 255, 0.30)',
        },
      },

      // Web-specific shadow aliases (hive-prefixed CSS var references)
      boxShadow: {
        ...hiveTailwindConfig.boxShadow,
        'hive-sm': 'var(--hive-shadow-sm)',
        'hive-md': 'var(--hive-shadow-md)',
        'hive-lg': 'var(--hive-shadow-lg)',
        'hive-xl': 'var(--hive-shadow-xl)',
        'hive-gold': 'none',
        'hive-gold-lg': 'none',
        'hive-level1': 'var(--hive-shadow-level1)',
        'hive-level2': 'var(--hive-shadow-level2)',
        'hive-level3': 'var(--hive-shadow-level3)',
      },

      // Web-specific blur aliases
      blur: {
        'hive-sm': 'var(--hive-blur-sm)',
        'hive-md': 'var(--hive-blur-md)',
        'hive-lg': 'var(--hive-blur-lg)',
        'hive-xl': 'var(--hive-blur-xl)',
      },

      // Perspective utilities for 3D transforms (motion primitives)
      perspective: {
        none: 'none',
        500: '500px',
        1000: '1000px',
        2000: '2000px',
      },
      // Transform style for 3D preservation
      transformStyle: {
        flat: 'flat',
        '3d': 'preserve-3d',
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
    // Safe area inset utilities for mobile viewport handling
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.pb-safe': { 'padding-bottom': 'env(safe-area-inset-bottom, 0px)' },
        '.pt-safe': { 'padding-top': 'env(safe-area-inset-top, 0px)' },
        '.pl-safe': { 'padding-left': 'env(safe-area-inset-left, 0px)' },
        '.pr-safe': { 'padding-right': 'env(safe-area-inset-right, 0px)' },
        '.mb-safe': { 'margin-bottom': 'env(safe-area-inset-bottom, 0px)' },
      });
    },
  ],
};

export default config;
