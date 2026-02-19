'use client';

/**
 * Element Registry
 *
 * Central registry for all HiveLab elements.
 * Uses a lookup pattern instead of a giant switch statement.
 *
 * Elements are organized by tier:
 * - Universal: Work in any context (preview, deployed, space)
 * - Connected: Require campus/user data connection
 * - Space: Require space context, leaders only
 */

import * as React from 'react';
import type { ErrorInfo } from 'react';
import type { ElementProps } from '../../../lib/hivelab/element-system';
import { ElementErrorBoundary } from './shared/error-boundary';

// Universal elements - basic UI components
import {
  SearchInputElement,
  FilterSelectorElement,
  PhotoGalleryElement,
  ResultListElement,
  DatePickerElement,
  UserSelectorElement,
  TagCloudElement,
  MapViewElement,
  ChartDisplayElement,
  FormBuilderElement,
  NotificationCenterElement,
} from './universal';

// New elements imported directly to avoid circular dependency through barrel exports
import { DirectoryListElement } from './universal/directory-list-element';
import { QRCodeGeneratorElement } from './universal/qr-code-generator-element';
import { ProgressIndicatorElement } from './universal/progress-indicator-element';

// Interactive elements - engagement components
import {
  CountdownTimerElement,
  PollElement,
  LeaderboardElement,
  RsvpButtonElement,
  TimerElement,
  CounterElement,
  SignupSheetElement,
  ChecklistTrackerElement,
} from './interactive';

// Connected elements - data-bound components
import { EventPickerElement, SpacePickerElement, ConnectionListElement, DiningPickerElement, StudySpotFinderElement } from './connected';
import { PersonalizedEventFeedElement } from './connected/personalized-event-feed';

// Space elements - space-specific components
import {
  MemberListElement,
  MemberSelectorElement,
  SpaceEventsElement,
  SpaceFeedElement,
  SpaceStatsElement,
  AnnouncementElement,
  RoleGateElement,
  AvailabilityHeatmapElement,
} from './space';

// Custom elements - Phase 5 iframe sandboxing
import { CustomBlockElement } from './custom';

// ============================================================
// Element Registry
// ============================================================

type ElementRenderer = (props: ElementProps) => React.JSX.Element;

/**
 * Element renderer registry - maps element IDs to their render functions.
 * Organized by tier for clarity.
 */
export const ELEMENT_RENDERERS: Record<string, ElementRenderer> = {
  // ----------------------------------------
  // Input Elements - Collect user input
  // ----------------------------------------
  'search-input': SearchInputElement,
  'date-picker': DatePickerElement,
  'user-selector': UserSelectorElement,
  'form-builder': FormBuilderElement,

  // ----------------------------------------
  // Filter Elements
  // ----------------------------------------
  'filter-selector': FilterSelectorElement,

  // ----------------------------------------
  // Display Elements - Show data
  // ----------------------------------------
  'result-list': ResultListElement,
  'chart-display': ChartDisplayElement,
  'tag-cloud': TagCloudElement,
  'map-view': MapViewElement,
  'notification-center': NotificationCenterElement,
  'notification-display': NotificationCenterElement, // Alias
  'photo-gallery': PhotoGalleryElement,
  'progress-indicator': ProgressIndicatorElement,

  // ----------------------------------------
  // Action Elements - Interactive engagement
  // ----------------------------------------
  'poll-element': PollElement,
  'rsvp-button': RsvpButtonElement,
  'countdown-timer': CountdownTimerElement,
  'leaderboard': LeaderboardElement,
  'counter': CounterElement,
  'counter-element': CounterElement, // Alias: AI generator emits 'counter-element'
  'timer': TimerElement,
  'signup-sheet': SignupSheetElement,
  'checklist-tracker': ChecklistTrackerElement,

  // ----------------------------------------
  // Display Elements - Universal (continued)
  // ----------------------------------------
  'directory-list': DirectoryListElement,
  'qr-code-generator': QRCodeGeneratorElement,

  // ----------------------------------------
  // Connected tier - Data-bound elements
  // ----------------------------------------
  'event-picker': EventPickerElement,
  'space-picker': SpacePickerElement,
  'connection-list': ConnectionListElement,
  'personalized-event-feed': PersonalizedEventFeedElement,
  'dining-picker': DiningPickerElement,
  'study-spot-finder': StudySpotFinderElement,

  // ----------------------------------------
  // Space tier (leaders only)
  // ----------------------------------------
  'member-list': MemberListElement,
  'member-selector': MemberSelectorElement,
  'space-events': SpaceEventsElement,
  'space-feed': SpaceFeedElement,
  'space-stats': SpaceStatsElement,
  'announcement': AnnouncementElement,
  'role-gate': RoleGateElement,
  'availability-heatmap': AvailabilityHeatmapElement,

  // ----------------------------------------
  // Custom tier - Phase 5 iframe sandboxing
  // ----------------------------------------
  'custom-block': CustomBlockElement as unknown as ElementRenderer,
};

// ============================================================
// Render Functions
// ============================================================

/**
 * Normalize element ID by stripping numeric suffixes.
 * AI generation might add suffixes like "-1", "-2" that we need to strip.
 */
function normalizeElementId(elementId: string): string {
  return elementId.replace(/-\d+$/, '');
}

/**
 * Placeholder for unknown/unimplemented elements.
 */
function UnknownElementPlaceholder({ elementId }: { elementId: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground">
      Unimplemented element: {elementId}
    </div>
  );
}

/**
 * Raw element renderer - use renderElementSafe for production.
 */
export function renderElement(elementId: string, props: ElementProps) {
  const normalizedId = normalizeElementId(elementId);
  const renderer = ELEMENT_RENDERERS[normalizedId];

  if (!renderer) {
    return <UnknownElementPlaceholder elementId={elementId} />;
  }

  return renderer(props);
}

/**
 * Safe element renderer with error boundary.
 * Use this in production to prevent individual element crashes from breaking the tool.
 *
 * @param elementId - The element type ID (e.g., 'poll-element', 'counter')
 * @param props - Element props including config and callbacks
 * @param onError - Optional error handler for logging/analytics
 */
export function renderElementSafe(
  elementId: string,
  props: ElementProps,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const normalizedId = normalizeElementId(elementId);
  const renderer = ELEMENT_RENDERERS[normalizedId];

  if (!renderer) {
    return <UnknownElementPlaceholder elementId={elementId} />;
  }

  return (
    <ElementErrorBoundary elementType={normalizedId} onError={onError}>
      {renderer(props)}
    </ElementErrorBoundary>
  );
}

/**
 * Check if an element type is supported.
 */
export function isElementSupported(elementId: string): boolean {
  const normalizedId = normalizeElementId(elementId);
  return normalizedId in ELEMENT_RENDERERS;
}

/**
 * Get list of all supported element types.
 */
export function getSupportedElementTypes(): string[] {
  return Object.keys(ELEMENT_RENDERERS);
}

/**
 * Get element categories for the palette.
 */
export function getElementsByCategory() {
  return {
    input: ['search-input', 'date-picker', 'user-selector', 'form-builder'],
    filter: ['filter-selector'],
    display: ['result-list', 'chart-display', 'tag-cloud', 'map-view', 'notification-center', 'photo-gallery', 'directory-list', 'qr-code-generator', 'progress-indicator'],
    action: ['poll-element', 'rsvp-button', 'countdown-timer', 'leaderboard', 'counter', 'timer', 'signup-sheet', 'checklist-tracker'],
    connected: ['event-picker', 'space-picker', 'connection-list', 'personalized-event-feed', 'dining-picker', 'study-spot-finder'],
    space: ['member-list', 'member-selector', 'space-events', 'space-feed', 'space-stats', 'announcement', 'role-gate', 'availability-heatmap'],
  };
}
