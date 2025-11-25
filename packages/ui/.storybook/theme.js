import { create } from '@storybook/theming/create';

export default create({
  base: 'dark',
  
  // HIVE Branding
  brandTitle: 'HIVE Component Library',
  brandUrl: 'https://hive.dev',
  
  // Colors - YC/SF Ultra-Minimal (only #000000, #FFFFFF, #FFD700)
  colorPrimary: '#FFD700', // HIVE gold (canonical)
  colorSecondary: '#FFD700', // Unified gold accent
  
  // UI - Pure black for YC/SF aesthetic
  appBg: '#000000',
  appContentBg: '#111113',
  appBorderColor: 'rgba(255, 255, 255, 0.1)',
  appBorderRadius: 12,
  
  // Text
  textColor: '#FFFFFF',
  textInverseColor: '#000000',
  textMutedColor: 'rgba(255, 255, 255, 0.6)',
  
  // Toolbar
  barTextColor: 'rgba(255, 255, 255, 0.8)',
  barSelectedColor: '#FFD700', // HIVE gold (canonical)
  barBg: 'rgba(0, 0, 0, 0.2)',
  
  // Form
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputTextColor: '#FFFFFF',
  inputBorderRadius: 8,
  
  // Typography
  fontBase: '"Inter", sans-serif',
  fontCode: '"Fira Code", monospace',
});