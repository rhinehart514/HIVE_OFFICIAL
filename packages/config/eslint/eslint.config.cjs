const js = require("@eslint/js");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];
