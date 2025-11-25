/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './apps/web/tailwind.config.ts',
  tailwindFunctions: ['cn', 'cva', 'clsx'],
};
