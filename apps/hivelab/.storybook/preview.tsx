import React from 'react';
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// Import HIVE design tokens (the actual generated CSS file)
import '@hive/tokens/hive-tokens-generated.css';

/**
 * HiveLab Storybook Preview
 *
 * Visual Identity: "The Workshop"
 * - Cool navy-black backgrounds (vs HIVE's warm black)
 * - Sharper corners (4-8px vs 14-22px)
 * - Monospace for technical labels
 * - More visible grid
 * - Precise, snappy animations
 */
const preview: Preview = {
  parameters: {
    // HiveLab backgrounds - cool, technical tones
    backgrounds: {
      default: 'lab-canvas',
      values: [
        // HiveLab (Workshop - cool, technical)
        { name: 'lab-canvas', value: '#0A0A12' },      // Deep navy-black
        { name: 'lab-panel', value: '#15151F' },       // Cool gray panel
        { name: 'lab-card', value: '#24242F' },        // Cool gray card
        { name: 'lab-elevated', value: '#2D2D3A' },    // Elevated element
        // HIVE (Campus - warm, social) for comparison
        { name: 'hive-dark', value: '#0a0a0a' },
        { name: 'hive-surface', value: '#171717' },
        { name: 'hive-card', value: '#262626' },
      ],
    },

    // Layout configuration
    layout: 'centered',

    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Viewport configuration for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        wide: {
          name: 'Wide Desktop',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },
  },

  // Global decorators
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],

  // Tags for autodocs
  tags: ['autodocs'],
};

export default preview;
