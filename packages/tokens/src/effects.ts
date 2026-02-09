/**
 * HIVE Effects Tokens
 * Box shadows, backdrop blur, and visual effects
 */

export const effects = {
  /**
   * Box Shadow Scale
   * Based on layered elevation system for dark theme
   */
  boxShadow: {
    none: 'none',
    level1: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    level2: '0 2px 4px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    level3: '0 4px 8px -2px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    level4: '0 8px 16px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -4px rgba(0, 0, 0, 0.3)',
    level5: '0 16px 32px -8px rgba(0, 0, 0, 0.5), 0 8px 16px -8px rgba(0, 0, 0, 0.4)',
    // Legacy aliases - glow removed
    goldGlow: 'none',
    goldGlowStrong: 'none',
    // Inset shadows
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    // Ring focus (white)
    ring: '0 0 0 2px rgba(255, 255, 255, 0.5)',
    ringOffset: '0 0 0 2px #000000, 0 0 0 4px rgba(255, 255, 255, 0.5)',
  },

  /**
   * Backdrop Blur Scale
   */
  backdropBlur: {
    none: '0',
    sm: '0',
    DEFAULT: '0',
    md: '0',
    lg: '0',
    xl: '0',
    '2xl': '0',
    '3xl': '0',
  },

  /**
   * Opacity Scale
   */
  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
  },
};

export default effects;
