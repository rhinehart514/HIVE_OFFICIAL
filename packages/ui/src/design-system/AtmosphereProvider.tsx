'use client';

/**
 * HIVE Atmosphere Provider
 * Generated from: docs/design-system/SYSTEMS.md
 *
 * The Atmosphere System controls the emotional density of HIVE.
 * Three atmosphere levels map to user journey:
 *
 * LANDING  → First impression, rich and spacious (Apple-level polish)
 * SPACES   → Home base, comfortable and familiar (where you live)
 * WORKSHOP → Creation mode, compact and utilitarian (where you build)
 *
 * Key Philosophy from SYSTEMS.md:
 * "Atmosphere is a modifier, not an alternative structure."
 * Same components, different emotional weight based on context.
 */

import * as React from 'react';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

// ============================================
// TYPES - From SYSTEMS.md Atmosphere Spectrum
// ============================================

/**
 * Atmosphere Level (from SYSTEMS.md lines 50-90)
 *
 * Landing  - Maximum breathing room, glass effects, ambient motion
 * Spaces   - Standard density, no glass, comfortable spacing
 * Workshop - Tight density, utilitarian, focus entirely on work
 */
export type AtmosphereLevel = 'landing' | 'spaces' | 'workshop';

/**
 * Density (from SYSTEMS.md lines 95-110)
 * Controls spacing multipliers within an atmosphere
 */
export type Density = 'spacious' | 'comfortable' | 'compact';

/**
 * Warmth Level (from SYSTEMS.md lines 280-320)
 *
 * CRITICAL: Warmth is EDGE-BASED (box-shadow inset), never background tint.
 * Warmth indicates activity level - denser activity = warmer edges.
 */
export type WarmthLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Full atmosphere context state
 */
export interface AtmosphereState {
  /** Current atmosphere level */
  atmosphere: AtmosphereLevel;
  /** Density within the atmosphere */
  density: Density;
  /** Whether effects are enabled (glass, blur, gradients) */
  effectsEnabled: boolean;
  /** Whether ambient animations are enabled */
  ambientEnabled: boolean;
}

/**
 * Context value including state and setters
 */
export interface AtmosphereContextValue extends AtmosphereState {
  /** Update atmosphere level */
  setAtmosphere: (level: AtmosphereLevel) => void;
  /** Update density */
  setDensity: (density: Density) => void;
  /** Toggle effects */
  setEffectsEnabled: (enabled: boolean) => void;
  /** Toggle ambient animations */
  setAmbientEnabled: (enabled: boolean) => void;
}

// ============================================
// ATMOSPHERE PRESETS - From SYSTEMS.md
// ============================================

/**
 * Atmosphere presets with CSS variable overrides
 * These map to the three atmosphere contexts defined in SYSTEMS.md
 */
export const atmospherePresets: Record<AtmosphereLevel, {
  density: Density;
  effectsEnabled: boolean;
  ambientEnabled: boolean;
  cssVariables: Record<string, string>;
}> = {
  /**
   * LANDING Atmosphere (SYSTEMS.md lines 60-75)
   *
 * Character: Apple-level polish, first impressions
 * - Maximum breathing room
 * - No glass effects
 * - No ambient motion
 * - Gold only on primary CTA
 */
  landing: {
    density: 'spacious',
    effectsEnabled: false,
    ambientEnabled: false,
    cssVariables: {
      '--atm-gap': 'var(--space-8)',           // 32px
      '--atm-padding': 'var(--space-12)',       // 48px
      '--atm-blur': '0',
      '--atm-glass-opacity': '0',
      '--atm-gradient': 'none',
      '--atm-ambient': '0',
      '--atm-gold-budget': 'cta-only',
    },
  },

  /**
   * SPACES Atmosphere (SYSTEMS.md lines 78-95)
   *
   * Character: Home base, comfortable, familiar
   * - Standard density
   * - No glass effects (except modals/rails)
   * - No ambient gradients
   * - Gold on presence, CTAs, active counts
   */
  spaces: {
    density: 'comfortable',
    effectsEnabled: false,
    ambientEnabled: false,
    cssVariables: {
      '--atm-gap': 'var(--space-4)',            // 16px
      '--atm-padding': 'var(--space-6)',        // 24px
      '--atm-blur': '0',
      '--atm-glass-opacity': '0',
      '--atm-gradient': 'none',
      '--atm-ambient': '0',                     // Ambient effects off
      '--atm-gold-budget': 'presence-cta-counts',
    },
  },

  /**
   * WORKSHOP Atmosphere (SYSTEMS.md lines 98-115)
   *
   * Character: Creation mode, utilitarian, focused
   * - Tight density everywhere
   * - No decorative effects
   * - Focus entirely on the work
   * - Gold only on status/success states
   */
  workshop: {
    density: 'compact',
    effectsEnabled: false,
    ambientEnabled: false,
    cssVariables: {
      '--atm-gap': 'var(--space-2)',            // 8px
      '--atm-padding': 'var(--space-3)',        // 12px
      '--atm-blur': '0',
      '--atm-glass-opacity': '0',
      '--atm-gradient': 'none',
      '--atm-ambient': '0',                     // Ambient effects off
      '--atm-gold-budget': 'status-success-only',
    },
  },
};

/**
 * Density multipliers for spacing
 * Applied to base spacing tokens
 */
export const densityMultipliers: Record<Density, number> = {
  spacious: 1.5,
  comfortable: 1.0,
  compact: 0.75,
};

// ============================================
// CONTEXT
// ============================================

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export interface AtmosphereProviderProps {
  children: ReactNode;
  /** Initial atmosphere level */
  defaultAtmosphere?: AtmosphereLevel;
  /** Initial density (overrides atmosphere default) */
  defaultDensity?: Density;
  /** Initial effects state (overrides atmosphere default) */
  defaultEffectsEnabled?: boolean;
  /** Initial ambient state (overrides atmosphere default) */
  defaultAmbientEnabled?: boolean;
}

export function AtmosphereProvider({
  children,
  defaultAtmosphere = 'spaces',
  defaultDensity,
  defaultEffectsEnabled,
  defaultAmbientEnabled,
}: AtmosphereProviderProps) {
  const [atmosphere, setAtmosphere] = React.useState<AtmosphereLevel>(defaultAtmosphere);
  const [density, setDensity] = React.useState<Density>(
    defaultDensity ?? atmospherePresets[defaultAtmosphere].density
  );
  const [effectsEnabled, setEffectsEnabled] = React.useState<boolean>(
    defaultEffectsEnabled ?? atmospherePresets[defaultAtmosphere].effectsEnabled
  );
  const [ambientEnabled, setAmbientEnabled] = React.useState<boolean>(
    defaultAmbientEnabled ?? atmospherePresets[defaultAtmosphere].ambientEnabled
  );

  // Apply CSS variables when atmosphere changes
  React.useEffect(() => {
    const preset = atmospherePresets[atmosphere];
    const root = document.documentElement;

    // Apply atmosphere-specific variables
    Object.entries(preset.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply density multiplier
    root.style.setProperty('--atm-density-multiplier', String(densityMultipliers[density]));

    // Apply data attributes for CSS selectors
    root.dataset.atmosphere = atmosphere;
    root.dataset.density = density;
    root.dataset.effects = String(effectsEnabled);
    root.dataset.ambient = String(ambientEnabled);

    return () => {
      // Cleanup is handled by next effect run
    };
  }, [atmosphere, density, effectsEnabled, ambientEnabled]);

  const value = useMemo<AtmosphereContextValue>(() => ({
    atmosphere,
    density,
    effectsEnabled,
    ambientEnabled,
    setAtmosphere: (level: AtmosphereLevel) => {
      setAtmosphere(level);
      // Reset to preset defaults when switching atmospheres
      const preset = atmospherePresets[level];
      setDensity(preset.density);
      setEffectsEnabled(preset.effectsEnabled);
      setAmbientEnabled(preset.ambientEnabled);
    },
    setDensity,
    setEffectsEnabled,
    setAmbientEnabled,
  }), [atmosphere, density, effectsEnabled, ambientEnabled]);

  return (
    <AtmosphereContext.Provider value={value}>
      {children}
    </AtmosphereContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Access the current atmosphere context
 * @throws If used outside of AtmosphereProvider
 */
export function useAtmosphere(): AtmosphereContextValue {
  const context = useContext(AtmosphereContext);
  if (!context) {
    throw new Error('useAtmosphere must be used within an AtmosphereProvider');
  }
  return context;
}

/**
 * Access atmosphere with a fallback for non-provider contexts
 * Useful for components that should work both in and out of provider
 */
export function useAtmosphereOptional(): AtmosphereContextValue | null {
  return useContext(AtmosphereContext);
}

/**
 * Get the current atmosphere level only
 * Convenience hook for components that just need to know the level
 */
export function useAtmosphereLevel(): AtmosphereLevel {
  const context = useContext(AtmosphereContext);
  return context?.atmosphere ?? 'spaces';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get warmth CSS from level
 * From SYSTEMS.md: Warmth is ALWAYS edge-based (box-shadow inset)
 *
 * @param level - Warmth level
 * @returns CSS box-shadow value for edge warmth
 */
export function getWarmthCSS(level: WarmthLevel): string {
  switch (level) {
    case 'none':
      return 'none';
    case 'low':
      return 'none';
    case 'medium':
      return 'none';
    case 'high':
      return 'none';
  }
}

/**
 * Get warmth level from activity count
 * More activity = warmer edges (SYSTEMS.md warmth rules)
 *
 * @param activityCount - Number of active participants/items
 * @returns Appropriate warmth level
 */
export function getWarmthFromActivity(activityCount: number): WarmthLevel {
  void activityCount;
  return 'none';
}

/**
 * Check if gold is allowed in current atmosphere context
 * From SYSTEMS.md gold budget rules
 *
 * @param atmosphere - Current atmosphere level
 * @param usage - What gold is being used for
 * @returns Whether gold is allowed
 */
export function isGoldAllowed(
  atmosphere: AtmosphereLevel,
  usage: 'cta' | 'presence' | 'counter' | 'achievement' | 'decoration'
): boolean {
  // NEVER allow decorative gold (PRINCIPLES.md)
  if (usage === 'decoration') return false;

  switch (atmosphere) {
    case 'landing':
      // Landing: Gold only on CTA
      return usage === 'cta';
    case 'spaces':
      // Spaces: Gold on presence, CTAs, active counts
      return usage === 'cta' || usage === 'presence' || usage === 'counter';
    case 'workshop':
      // Workshop: Minimal gold (status/success only - mapped to achievement)
      return usage === 'achievement';
  }
}

// ============================================
// CSS HELPERS
// ============================================

/**
 * Get atmosphere-aware CSS classes
 * Use with Tailwind or custom CSS
 */
export function getAtmosphereClasses(atmosphere: AtmosphereLevel): string {
  return `atm-${atmosphere}`;
}

/**
 * Get density-aware CSS classes
 */
export function getDensityClasses(density: Density): string {
  return `density-${density}`;
}

// ============================================
// EXPORTS
// ============================================

export { AtmosphereContext };
