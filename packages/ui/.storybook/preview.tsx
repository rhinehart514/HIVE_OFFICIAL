import React from 'react';
import type { Preview } from '@storybook/react';
import { MotionConfig } from 'framer-motion';

// Import CSS
import "../../tokens/hive-tokens-generated.css";
import "../src/tokens.css";
import "../src/styles.css";
import "../src/design-system/tokens.css";

// Import AtmosphereProvider directly to avoid barrel export issues
import { AtmosphereProvider } from '../src/design-system/AtmosphereProvider';
import type { AtmosphereLevel, Density, WarmthLevel } from '../src/design-system/AtmosphereProvider';

// Use system fonts as fallback
if (typeof document !== 'undefined') {
  const fontStyle = document.getElementById('geist-fonts');
  if (!fontStyle) {
    const style = document.createElement('style');
    style.id = 'geist-fonts';
    style.textContent = `
      :root {
        --font-geist-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
        --font-geist-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
      }
      body {
        font-family: var(--font-geist-sans);
      }
    `;
    document.head.appendChild(style);
  }
}

const preview: Preview = {
  globalTypes: {
    atmosphere: {
      title: 'Atmosphere',
      description: 'Atmosphere level',
      defaultValue: 'spaces',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'landing', title: 'Landing (Apple-rich)' },
          { value: 'spaces', title: 'Spaces (Comfortable)' },
          { value: 'workshop', title: 'Workshop (Utilitarian)' },
        ],
      },
    },
    density: {
      title: 'Density',
      description: 'Spacing density',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'component',
        items: [
          { value: 'spacious', title: 'Spacious' },
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
      },
    },
    warmth: {
      title: 'Warmth',
      description: 'Edge warmth level',
      defaultValue: 'none',
      toolbar: {
        icon: 'sun',
        items: [
          { value: 'none', title: 'None' },
          { value: 'low', title: 'Low' },
          { value: 'medium', title: 'Medium' },
          { value: 'high', title: 'High' },
        ],
      },
    },
    theme: {
      title: 'Theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'hive-dark',
      values: [
        { name: 'hive-dark', value: '#0A0A0B' },
        { name: 'hive-elevated', value: '#111113' },
        { name: 'hive-card', value: '#141414' },
        { name: 'light', value: '#FFFFFF' },
      ],
    },
    docs: {
      theme: {
        base: 'dark',
        brandTitle: 'HIVE Design System',
        colorPrimary: '#FFD700',
        colorSecondary: '#FFD700',
        appBg: '#0A0A0B',
        appContentBg: '#111113',
        appBorderColor: '#2A2A2C',
        appBorderRadius: 8,
        fontBase: 'system-ui, sans-serif',
        fontCode: 'monospace',
        textColor: '#E5E5E7',
        textInverseColor: '#0A0A0B',
        barTextColor: '#E5E5E7',
        barSelectedColor: '#FFD700',
        barBg: '#111113',
        inputBg: '#1A1A1C',
        inputBorder: '#2A2A2C',
        inputTextColor: '#E5E5E7',
        inputBorderRadius: 6,
      },
    },
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const atmosphere = (context.globals.atmosphere ?? 'spaces') as AtmosphereLevel;
      const density = (context.globals.density ?? 'comfortable') as Density;
      const warmth = (context.globals.warmth ?? 'none') as WarmthLevel;
      const theme = context.globals.theme ?? 'dark';

      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.setAttribute('data-atmosphere', atmosphere);
        root.setAttribute('data-density', density);
        root.setAttribute('data-warmth', warmth);
        root.setAttribute('data-theme', theme);
      }

      const isLight = theme === 'light';
      const surface = isLight ? '#FFFFFF' : '#0A0A0B';
      const text = isLight ? '#0A0A0B' : '#E5E5E7';

      // Warmth edge glow
      const warmthStyles: Record<string, string> = {
        none: 'none',
        low: 'inset 0 0 0 1px rgba(255, 215, 0, 0.04)',
        medium: 'inset 0 0 0 1px rgba(255, 215, 0, 0.08)',
        high: 'inset 0 0 0 1px rgba(255, 215, 0, 0.12)',
      };

      return (
        <AtmosphereProvider
          defaultAtmosphere={atmosphere}
          defaultDensity={density}
        >
          <MotionConfig reducedMotion="user">
            <div
              className="min-h-screen antialiased font-sans"
              style={{
                background: surface,
                color: text,
              }}
            >
              <div
                className="p-8"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,245,250,0.9))'
                    : 'linear-gradient(135deg, rgba(10,10,11,0.95), rgba(20,20,22,0.9))',
                  boxShadow: warmthStyles[warmth],
                  borderRadius: '12px',
                }}
              >
                <Story />
              </div>
            </div>
          </MotionConfig>
        </AtmosphereProvider>
      );
    },
  ],
};

export default preview;
