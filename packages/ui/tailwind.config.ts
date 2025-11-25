import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
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
          success: '#00D46A',
          warning: '#FFB800',
          error: '#FF3B30',
          info: '#0A84FF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
