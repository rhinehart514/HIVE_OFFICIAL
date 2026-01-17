import type { StorybookConfig } from '@storybook/react-vite';
import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  // ============================================
  // HIVE Design System: Only show new primitives & components
  // Old atomic stories are excluded
  // ============================================
  stories: [
    // Design System stories ONLY
    '../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/design-system/**/*.mdx',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  core: {
    disableTelemetry: true,
  },

  typescript: {
    check: false, // Type checking done separately via npm run typecheck
    reactDocgen: false, // Disable to avoid path resolution issues
  },

  // Vite configuration for Storybook
  async viteFinal(config) {
    // Filter out react-docgen-typescript plugin to avoid path resolution issues
    const filteredPlugins = config.plugins?.filter((plugin: any) => {
      return plugin && plugin.name !== 'react-docgen-typescript';
    });

    return {
      ...config,
      plugins: filteredPlugins,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': join(__dirname, '../src'),
          '@hive/tokens': join(__dirname, '../../tokens/src'),
          '@hive/core': join(__dirname, '../../core/src'),
        },
      },
    };
  },
};

export default config;
