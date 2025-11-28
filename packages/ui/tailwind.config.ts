import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Premium UI Animations (Billion-Dollar Patterns)
      keyframes: {
        'shine-rotate': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        'border-beam': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
        'sparkle-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(180deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
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
        'shine-rotate': 'shine-rotate var(--shine-duration, 14s) linear infinite',
        'border-beam': 'border-beam var(--beam-duration, 12s) linear infinite',
        'sparkle-spin': 'sparkle-spin 2s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      colors: {
        foundation: {
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            1000: '#0A0A0A',
            900: '#171717',
            800: '#262626',
            700: '#404040',
            600: '#525252',
            500: '#737373',
            400: '#A3A3A3',
            300: '#D4D4D4',
            200: '#E5E5E5',
            100: '#F5F5F5',
            50: '#FAFAFA',
          },
          gold: { 500: '#FFD700' },
        },
        background: {
          primary: 'var(--hive-background-primary)',
          secondary: 'var(--hive-background-secondary)',
          tertiary: 'var(--hive-background-tertiary)',
        },
        text: {
          primary: 'var(--hive-text-primary)',
          secondary: 'var(--hive-text-secondary)',
          tertiary: 'var(--hive-text-tertiary)',
        },
        brand: {
          primary: 'var(--hive-brand-primary)',
          hover: 'var(--hive-brand-hover)',
        },
        status: {
          success: 'var(--hive-status-success)',
          warning: 'var(--hive-status-warning)',
          error: 'var(--hive-status-error)',
          info: 'var(--hive-status-info)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
