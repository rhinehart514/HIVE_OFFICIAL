/**
 * Tool Surface Components
 *
 * Sprint 5: Surface-Specific UI
 *
 * Provides different rendering contexts for tools:
 * - CompactSurface: Sidebar placement, single metric view
 * - ModalSurface: Dialog wrapper with proper accessibility
 * - EmbeddedSurface: Seamless in-content embedding
 */

export { CompactSurface, type CompactSurfaceProps } from './compact-surface';
export { ModalSurface, type ModalSurfaceProps } from './modal-surface';
export { EmbeddedSurface, type EmbeddedSurfaceProps } from './embedded-surface';

/**
 * Surface type for tool rendering context
 */
export type SurfaceType = 'compact' | 'modal' | 'embedded' | 'full';

/**
 * Determine recommended surface type based on placement
 */
export function getSurfaceForPlacement(placement: string): SurfaceType {
  switch (placement) {
    case 'sidebar':
    case 'sidebar-widget':
    case 'quick-action':
      return 'compact';
    case 'modal':
    case 'dialog':
    case 'popup':
      return 'modal';
    case 'post':
    case 'feed':
    case 'inline':
    case 'embedded':
      return 'embedded';
    case 'tab':
    case 'page':
    case 'full':
    default:
      return 'full';
  }
}
