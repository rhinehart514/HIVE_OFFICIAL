// HIVE master Tailwind configuration
// Single canonical source: tailwind-config-unified + minimal compatibility aliases.

import type { Config } from 'tailwindcss';
import { hiveTailwindConfig } from './src/tailwind-config-unified';

const masterConfig: Config = {
  darkMode: 'class',
  content: [
    './apps/web/src/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/admin/src/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/.storybook/**/*.{js,ts,jsx,tsx}',
    './packages/*/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      ...hiveTailwindConfig,

      // shadcn/ui compatibility aliases
      colors: {
        ...hiveTailwindConfig.colors,
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      fontFamily: {
        sans: ['var(--hive-font-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        display: ['var(--hive-font-display)', 'Clash Display', 'system-ui', 'sans-serif'],
        mono: ['var(--hive-font-mono)', 'Geist Mono', 'monospace'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: any) {
      addUtilities({
        '.hive-glass': {
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        },
        '.hive-glass-strong': {
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-emphasis)',
        },
        '.hive-interactive': {
          transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
        '.hive-interactive:hover': {
          background: 'var(--interactive-hover)',
        },
        '.hive-interactive:active': {
          background: 'var(--interactive-active)',
        },
      });
    },
  ],
};

export default masterConfig;
