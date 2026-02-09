/**
 * Spaces Hub Components
 *
 * Narrative architecture for the Spaces vertical slice.
 *
 * Primary API:
 * - SpacesHub: Main entry point, orchestrates all states
 *
 * Internal Components (used by SpacesHub):
 * - HubActive, SpaceOrbit, OrganizationsGrid
 */

// Main Components (use these)
export { SpacesHub } from './spaces-hub';

// Shell & State Views
export { HubActive } from './hub-active';

// Core Components
export { SpaceOrbit, OrganizationsGrid } from './space-orbit';

// ============================================================
// DEPRECATED - Use SpacesHub instead
// Kept for backward compatibility, will be removed in v19
// ============================================================
export { IdentityRow } from './IdentityRow';
export { OrganizationsPanel } from './OrganizationsPanel';
export { SpacesHQ } from './SpacesHQ';
