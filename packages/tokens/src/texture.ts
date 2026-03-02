/**
 * HIVE Texture Tokens
 *
 * Subtle noise, grain, and scanline effects to break sterility.
 * Underground print zine energy — the platform feels handmade, not corporate.
 *
 * Usage: Apply grain overlays on hero sections, cards, and surfaces
 * to add visual warmth and texture to the dark base.
 */

// Grain overlay — CSS background-image using SVG noise
// Renders a subtle film grain effect over surfaces
export const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;

export const texture = {
  // Grain overlays — use as ::after pseudo-element background
  grain: {
    /** Barely visible grain — for page backgrounds */
    subtle: {
      backgroundImage: GRAIN_SVG,
      opacity: 0.03,
      mixBlendMode: 'overlay' as const,
    },
    /** Standard grain — for cards, hero sections */
    default: {
      backgroundImage: GRAIN_SVG,
      opacity: 0.05,
      mixBlendMode: 'overlay' as const,
    },
    /** Heavy grain — for featured sections, genesis mode prompts */
    heavy: {
      backgroundImage: GRAIN_SVG,
      opacity: 0.08,
      mixBlendMode: 'overlay' as const,
    },
  },

  // Scanline effect — horizontal lines for retro/underground feel
  scanlines: {
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
    backgroundSize: '100% 4px',
  },

  // Noise pattern — for input backgrounds and subtle surface variation
  noise: {
    backgroundImage: GRAIN_SVG,
    backgroundSize: '256px 256px',
  },
} as const;

// Tailwind-compatible CSS class utilities
export const textureClasses = {
  /** Apply grain overlay to a container. Container needs position: relative. */
  grain: 'before:absolute before:inset-0 before:pointer-events-none before:opacity-[0.04] before:mix-blend-overlay before:bg-[length:256px_256px]',
  /** Scanline effect for retro surfaces */
  scanlines: 'after:absolute after:inset-0 after:pointer-events-none after:bg-[length:100%_4px] after:opacity-[0.5]',
} as const;

// CSS custom properties for texture tokens
export const textureCSSVariables = {
  '--hive-grain-opacity-subtle': '0.03',
  '--hive-grain-opacity-default': '0.05',
  '--hive-grain-opacity-heavy': '0.08',
} as const;

export type TextureLevel = keyof typeof texture.grain;
