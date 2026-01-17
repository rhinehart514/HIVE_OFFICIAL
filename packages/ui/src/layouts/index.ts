/**
 * Layout Archetypes
 *
 * Four locked behavioral layout types. Every route maps to exactly one.
 * Shell visibility is controlled by archetype, not by route.
 *
 * Orientation: identity + navigation + capability (Shell ON)
 * Discovery: browsing collections (Shell ON)
 * Immersion: doing, full viewport (Shell OFF)
 * FocusFlow: wizards/forms, sequential (Shell OFF)
 */

export { OrientationLayout } from './OrientationLayout';
export { DiscoveryLayout } from './DiscoveryLayout';
export { ImmersionLayout } from './ImmersionLayout';
export { FocusFlowLayout } from './FocusFlowLayout';

// Layout context for shell visibility control
export { LayoutProvider, useLayout, type LayoutArchetype } from './LayoutContext';
