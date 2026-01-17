'use client';

/**
 * Element Renderers - Main Entry Point
 *
 * This is the public API for HiveLab element rendering.
 * All elements are registered in the elements/registry.tsx file.
 *
 * Usage:
 * - renderElementSafe(elementId, props) - Production use with error boundary
 * - renderElement(elementId, props) - Raw rendering without boundary
 * - isElementSupported(elementId) - Check if element is supported
 * - getSupportedElementTypes() - Get all supported element IDs
 * - getElementsByCategory() - Get elements organized by category
 *
 * For direct component imports:
 * import { SearchInputElement, FilterSelectorElement } from './elements/universal';
 */

// Re-export everything from the registry (the new pattern)
export {
  ELEMENT_RENDERERS,
  renderElement,
  renderElementSafe,
  isElementSupported,
  getSupportedElementTypes,
  getElementsByCategory,
} from './elements/registry';

// Re-export element components for direct imports
// Universal tier
export { SearchInputElement, FilterSelectorElement, PhotoGalleryElement } from './elements/universal';

// Connected tier
export { EventPickerElement, SpacePickerElement, ConnectionListElement } from './elements/connected';

// Space tier
export {
  MemberListElement,
  MemberSelectorElement,
  SpaceEventsElement,
  SpaceFeedElement,
  SpaceStatsElement,
  AnnouncementElement,
  RoleGateElement,
  AvailabilityHeatmapElement,
} from './elements/space';

// Universal elements (now extracted)
export {
  ResultListElement,
  DatePickerElement,
  UserSelectorElement,
  TagCloudElement,
  MapViewElement,
  ChartDisplayElement,
  FormBuilderElement,
  NotificationCenterElement,
} from './elements/universal';

// Interactive elements (now extracted)
export {
  CountdownTimerElement,
  PollElement,
  LeaderboardElement,
  RsvpButtonElement,
  TimerElement,
  CounterElement,
} from './elements/interactive';

// Re-export error boundary
export { ElementErrorBoundary } from './elements/shared';

// Re-export types
export type { ElementProps, ElementRenderer, ElementRegistryEntry } from './elements/shared/types';
