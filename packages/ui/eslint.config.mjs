import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybookPlugin from 'eslint-plugin-storybook';
import globals from 'globals';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import noHardcodedColors from '../config-eslint/no-hardcoded-colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'storybook-static/**',
      '.turbo/**',
      'coverage/**',
      '.cache/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'tsconfig.tsbuildinfo',
      '.storybook/**',
      'apps/**',
      'packages/**',
      'scripts/**',
      'fix-imports.cjs',
      'index-full.js',
      'index-full.ts',
      'index.build.js',
      'index.build.ts',
      'index.js',
      'index.ts',
      'rebuild-storybook.js',
      'rebuild-storybook.ts',
      'src/**/*.stories.tsx',
      'src/pages/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    ...js.configs.recommended,
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
      storybook: storybookPlugin,
      hive: {
        rules: {
          'no-hardcoded-colors': noHardcodedColors,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      ...reactPlugin.configs['recommended'].rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'import/order': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',

      // HIVE Design System Rules
      'hive/no-hardcoded-colors': 'warn',  // Enable as warning for gradual migration
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    plugins: {
      storybook: storybookPlugin,
    },
    rules: {
      ...storybookPlugin.configs.recommended.rules,
    },
  },
];
