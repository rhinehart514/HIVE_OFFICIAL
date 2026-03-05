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

// OrientationLayout - REMOVED (dead export, zero imports from apps/web)
export { DiscoveryLayout } from './DiscoveryLayout';
// ImmersionLayout - REMOVED (dead export, zero imports from apps/web)
// FocusFlowLayout - REMOVED (dead export, zero imports from apps/web)

// Layout context for shell visibility control
export { LayoutProvider, useLayout, type LayoutArchetype } from './LayoutContext';
