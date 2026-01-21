/**
 * @hive/eslint-plugin-hive
 *
 * Custom ESLint rules for HIVE design system enforcement
 *
 * Rules:
 * - no-hardcoded-spacing: Block hardcoded Tailwind spacing (py-, px-, gap-, etc.)
 * - no-hardcoded-colors: Block hardcoded hex colors (#xxx)
 * - enforce-hive-query: Block useState + fetch patterns, enforce useHiveQuery
 * - require-loading-state: Require loading.tsx in app router pages
 * - require-error-state: Require error.tsx in app router pages
 */

const noHardcodedSpacing = require('./rules/no-hardcoded-spacing');
const noHardcodedColors = require('./rules/no-hardcoded-colors');
const enforceHiveQuery = require('./rules/enforce-hive-query');
const requireLoadingState = require('./rules/require-loading-state');
const requireErrorState = require('./rules/require-error-state');

module.exports = {
  meta: {
    name: '@hive/eslint-plugin-hive',
    version: '1.0.0',
  },
  rules: {
    'no-hardcoded-spacing': noHardcodedSpacing,
    'no-hardcoded-colors': noHardcodedColors,
    'enforce-hive-query': enforceHiveQuery,
    'require-loading-state': requireLoadingState,
    'require-error-state': requireErrorState,
  },
  configs: {
    recommended: {
      plugins: ['@hive/hive'],
      rules: {
        '@hive/hive/no-hardcoded-spacing': 'error',
        '@hive/hive/no-hardcoded-colors': 'error',
        '@hive/hive/enforce-hive-query': 'warn',
        '@hive/hive/require-loading-state': 'warn',
        '@hive/hive/require-error-state': 'warn',
      },
    },
  },
};
