import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // Include stories from @hive/ui package
    '../../../packages/ui/src/components/hivelab/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],

  // Vite configuration
  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@hive/ui': path.resolve(__dirname, '../../../packages/ui/src'),
          '@hive/tokens': path.resolve(__dirname, '../../../packages/tokens/src'),
          '@hive/hooks': path.resolve(__dirname, '../../../packages/hooks/src'),
          '@hive/core': path.resolve(__dirname, '../../../packages/core/src'),
          '@hive/firebase': path.resolve(__dirname, '../../../packages/firebase/src'),
          '@hive/validation': path.resolve(__dirname, '../../../packages/validation/src'),
          '@': path.resolve(__dirname, '../src'),
        },
      },
    };
  },

  docs: {
    autodocs: 'tag',
  },
};

export default config;
