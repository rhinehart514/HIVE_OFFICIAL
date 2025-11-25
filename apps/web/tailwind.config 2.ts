import type { Config } from 'tailwindcss';
import { hiveTailwindConfig } from '@hive/tokens/src/tailwind-config-unified';

const config: Config = {
  darkMode: 'class',

  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },

    extend: {
      // === HIVE UNIFIED DESIGN TOKENS ===
      // All tokens from @hive/tokens (Foundation → Semantic → Component)
      ...hiveTailwindConfig,

      // === SHADCN/UI COMPATIBILITY ===
      // Colors use CSS custom properties for runtime theming
      colors: {
        // shadcn/ui base colors
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        // Sidebar (shadcn sidebar pattern)
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },

        // Chart colors (data visualization)
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },

        // Status colors
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },

        // === HIVE UNIFIED TOKENS ===
        // Import all HIVE colors from unified system
        ...hiveTailwindConfig.colors,
      },

      // Override borderRadius to keep shadcn patterns + HIVE tokens
      borderRadius: {
        ...hiveTailwindConfig.borderRadius,
        // shadcn/ui shortcuts
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },

      // Font family with Next.js font variables
      fontFamily: {
        ...hiveTailwindConfig.fontFamily,
        sans: ['var(--font-geist-sans)', ...hiveTailwindConfig.fontFamily!.sans],
        mono: ['var(--font-geist-mono)', ...hiveTailwindConfig.fontFamily!.mono],
        display: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },

      // Custom spacing additions
      spacing: {
        ...hiveTailwindConfig.spacing,
        '18': '4.5rem',
        '88': '22rem',
      },

      // Keyframes (merge HIVE + shadcn)
      keyframes: {
        ...hiveTailwindConfig.keyframes,
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      // Animations (merge HIVE + shadcn)
      animation: {
        ...hiveTailwindConfig.animation,
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },

  // Tailwind plugins for better form styling
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Use class-based strategy for better control
    }),
  ],

  // Content purging configuration - ensure unused styles are removed
  safelist: [
    // Only safelist dynamic classes that can't be detected at build time
    // Status colors for dynamic status badges
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-blue-500',
    // Role colors
    'text-gold-500',
    'text-gold-600',
  ],
};

export default config;
