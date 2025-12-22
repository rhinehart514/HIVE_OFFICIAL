import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark-only mode - no light theme toggle needed
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--hive-font-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        display: ['var(--hive-font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--hive-font-mono)', 'JetBrains Mono', 'monospace'],
        manifesto: ['var(--hive-font-manifesto)', 'Clash Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Gold - primary brand accent
        gold: {
          500: '#FFD700',
          400: '#FFE033',
          600: '#E6C200',
        },
        // Foundation colors - Neutral gray scale (Apple-inspired)
        foundation: {
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            1000: '#0A0A0A',  // bgBase
            900: '#141414',   // bgSurface
            800: '#1A1A1A',   // bgElevated
            750: '#242424',   // bgActive
            700: '#2A2A2A',   // borderDefault
            600: '#3A3A3A',   // borderHover
            500: '#4A4A4A',   // borderStrong
            400: '#52525B',   // textDisabled
            350: '#71717A',   // textPlaceholder
            300: '#818187',   // textSubtle
            200: '#A1A1A6',   // textSecondary
            100: '#D4D4D8',
            50: '#FAFAFA',    // textPrimary
          },
          gold: {
            500: '#FFD700',
          },
        },
        // Semantic colors using CSS variables
        background: {
          base: 'var(--hive-bg-base)',
          surface: 'var(--hive-bg-surface)',
          elevated: 'var(--hive-bg-elevated)',
          active: 'var(--hive-bg-active)',
          // Legacy aliases
          primary: 'var(--hive-background-primary)',
          secondary: 'var(--hive-background-secondary)',
          tertiary: 'var(--hive-background-tertiary)',
        },
        text: {
          primary: 'var(--hive-text-primary)',
          secondary: 'var(--hive-text-secondary)',
          subtle: 'var(--hive-text-subtle)',
          placeholder: 'var(--hive-text-placeholder)',
          disabled: 'var(--hive-text-disabled)',
          inverse: 'var(--hive-text-inverse)',
        },
        border: {
          default: 'var(--hive-border-default)',
          hover: 'var(--hive-border-hover)',
          strong: 'var(--hive-border-strong)',
          focus: 'var(--hive-border-focus)',
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
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        'hive-sm': 'var(--hive-shadow-sm)',
        'hive-md': 'var(--hive-shadow-md)',
        'hive-lg': 'var(--hive-shadow-lg)',
        'hive-xl': 'var(--hive-shadow-xl)',
        'hive-gold': 'var(--hive-shadow-gold)',
        'hive-gold-lg': 'var(--hive-shadow-gold-lg)',
        'hive-level1': 'var(--hive-shadow-level1)',
        'hive-level2': 'var(--hive-shadow-level2)',
        'hive-level3': 'var(--hive-shadow-level3)',
      },
      blur: {
        'hive-sm': 'var(--hive-blur-sm)',
        'hive-md': 'var(--hive-blur-md)',
        'hive-lg': 'var(--hive-blur-lg)',
        'hive-xl': 'var(--hive-blur-xl)',
      },
    },
  },
  plugins: [],
};

export default config;
