const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const prettierConfig = require("eslint-config-prettier");

/**
 * Base ESLint configuration for all packages
 */
const baseConfig = {
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    "@typescript-eslint": tseslint,
  },
  rules: {
    ...js.configs.recommended.rules,
    ...tseslint.configs.recommended.rules,
    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    // General rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
  },
};

/**
 * React configuration for UI packages and apps
 */
const reactConfig = {
  plugins: {
    react: reactPlugin,
    "react-hooks": reactHooksPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

/**
 * Next.js specific configuration
 */
const nextjsConfig = {
  rules: {
    // Next.js specific overrides
    "@next/next/no-img-element": "off",
  },
};

module.exports = {
  baseConfig,
  reactConfig,
  nextjsConfig,
  prettierConfig,
};
