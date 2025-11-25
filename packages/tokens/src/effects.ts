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
    // Gold glow variants
    goldGlow: '0 0 20px rgba(255, 215, 0, 0.3)',
    goldGlowStrong: '0 0 40px rgba(255, 215, 0, 0.4)',
    // Inset shadows
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    // Ring focus
    ring: '0 0 0 2px rgba(255, 215, 0, 0.5)',
    ringOffset: '0 0 0 2px #0a0a0a, 0 0 0 4px rgba(255, 215, 0, 0.5)',
  },

  /**
   * Backdrop Blur Scale
   */
  backdropBlur: {
    none: '0',
    sm: '4px',
    DEFAULT: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
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
