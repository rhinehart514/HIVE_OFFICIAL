'use client';

import * as React from 'react';

/**
 * Layout Archetypes
 *
 * orientation: identity + navigation + capability (calm, structured)
 * discovery: browsing collections (filter/search at top, uniform grid/list)
 * immersion: doing (full viewport, no shell, content owns scroll)
 * focus-flow: wizards/forms (sequential, no distractions)
 */
export type LayoutArchetype = 'orientation' | 'discovery' | 'immersion' | 'focus-flow';

interface LayoutContextValue {
  archetype: LayoutArchetype;
  shellVisible: boolean;
}

const LayoutContext = React.createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  archetype: LayoutArchetype;
  children: React.ReactNode;
}

/**
 * LayoutProvider
 *
 * Wraps content with archetype context.
 * Shell visibility is derived from archetype:
 * - orientation, discovery: shell ON
 * - immersion, focus-flow: shell OFF
 */
export function LayoutProvider({ archetype, children }: LayoutProviderProps) {
  const shellVisible = archetype === 'orientation' || archetype === 'discovery';

  const value = React.useMemo(
    () => ({ archetype, shellVisible }),
    [archetype, shellVisible]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * useLayout
 *
 * Access current layout archetype and shell visibility.
 */
export function useLayout(): LayoutContextValue {
  const context = React.useContext(LayoutContext);
  if (!context) {
    // Default to orientation if no provider (shell ON)
    return { archetype: 'orientation', shellVisible: true };
  }
  return context;
}
