/**
 * Element Spec Registry
 *
 * Drop-in replacement for element-manifest.ts helpers.
 * Imports all 33 element specs and provides lookup, filtering, and validation.
 */

import type { ElementSpec, ConnectionLevel, ConnectionSpec } from '../element-spec';
import { CONNECTION_LEVEL_RANK } from '../element-spec';

// ── Import all manifests ────────────────────────────────────────

import { pollElementSpec } from './poll-element/manifest';
import { counterSpec } from './counter/manifest';
import { timerSpec } from './timer/manifest';
import { signupSheetSpec } from './signup-sheet/manifest';
import { checklistTrackerSpec } from './checklist-tracker/manifest';
import { countdownTimerSpec } from './countdown-timer/manifest';
import { leaderboardSpec } from './leaderboard/manifest';
import { progressIndicatorSpec } from './progress-indicator/manifest';
import { chartDisplaySpec } from './chart-display/manifest';
import { photoGallerySpec } from './photo-gallery/manifest';
import { directoryListSpec } from './directory-list/manifest';
import { qrCodeGeneratorSpec } from './qr-code-generator/manifest';
import { tagCloudSpec } from './tag-cloud/manifest';
import { mapViewSpec } from './map-view/manifest';
import { notificationDisplaySpec } from './notification-display/manifest';
import { resultListSpec } from './result-list/manifest';
import { availabilityHeatmapSpec } from './availability-heatmap/manifest';
import { formBuilderSpec } from './form-builder/manifest';
import { searchInputSpec } from './search-input/manifest';
import { datePickerSpec } from './date-picker/manifest';
import { filterSelectorSpec } from './filter-selector/manifest';
import { rsvpButtonSpec } from './rsvp-button/manifest';
import { eventPickerSpec } from './event-picker/manifest';
import { userSelectorSpec } from './user-selector/manifest';
import { connectionListSpec } from './connection-list/manifest';
import { personalizedEventFeedSpec } from './personalized-event-feed/manifest';
import { diningPickerSpec } from './dining-picker/manifest';
import { studySpotFinderSpec } from './study-spot-finder/manifest';
import { memberListSpec } from './member-list/manifest';
import { memberSelectorSpec } from './member-selector/manifest';
import { spaceEventsSpec } from './space-events/manifest';
import { spaceFeedSpec } from './space-feed/manifest';
import { spaceStatsSpec } from './space-stats/manifest';
import { announcementSpec } from './announcement/manifest';
import { roleGateSpec } from './role-gate/manifest';
import { customBlockSpec } from './custom-block/manifest';

// ── All Specs ───────────────────────────────────────────────────

const ALL_SPECS: ElementSpec[] = [
  pollElementSpec,
  counterSpec,
  timerSpec,
  signupSheetSpec,
  checklistTrackerSpec,
  countdownTimerSpec,
  leaderboardSpec,
  progressIndicatorSpec,
  chartDisplaySpec,
  photoGallerySpec,
  directoryListSpec,
  qrCodeGeneratorSpec,
  tagCloudSpec,
  mapViewSpec,
  notificationDisplaySpec,
  resultListSpec,
  availabilityHeatmapSpec,
  formBuilderSpec,
  searchInputSpec,
  datePickerSpec,
  filterSelectorSpec,
  rsvpButtonSpec,
  eventPickerSpec,
  userSelectorSpec,
  connectionListSpec,
  personalizedEventFeedSpec,
  diningPickerSpec,
  studySpotFinderSpec,
  memberListSpec,
  memberSelectorSpec,
  spaceEventsSpec,
  spaceFeedSpec,
  spaceStatsSpec,
  announcementSpec,
  roleGateSpec,
  customBlockSpec,
];

// ── Internal Indexes ────────────────────────────────────────────

const _specMap = new Map<string, ElementSpec>();
const _aliasMap = new Map<string, string>();

for (const spec of ALL_SPECS) {
  _specMap.set(spec.elementId, spec);
  if (spec.aliases) {
    for (const alias of spec.aliases) {
      _aliasMap.set(alias, spec.elementId);
    }
  }
}

// ── Public API ──────────────────────────────────────────────────

/** Get spec by elementId (resolves aliases). Replaces getElementManifest() */
export function getElementSpec(elementId: string): ElementSpec | undefined {
  const canonical = _aliasMap.get(elementId) ?? elementId;
  return _specMap.get(canonical);
}

/** Get all specs. Replaces ELEMENT_MANIFEST */
export function getAllSpecs(): ElementSpec[] {
  return ALL_SPECS;
}

/** Get specs filtered by minimum depth. Replaces getElementsByTier() */
export function getSpecsByMinDepth(depth: ConnectionLevel): ElementSpec[] {
  return ALL_SPECS.filter(s => s.connection.minDepth === depth);
}

/** Get all standalone-capable specs. Replaces getStandaloneElements() */
export function getStandaloneSpecs(): ElementSpec[] {
  return ALL_SPECS.filter(s => s.connection.minDepth === 'standalone');
}

/** Get the deepest connection level an element supports */
export function getMaxDepth(elementId: string): ConnectionLevel | undefined {
  const spec = getElementSpec(elementId);
  if (!spec) return undefined;
  const levels = spec.connection.levels;
  if (levels.length === 0) return spec.connection.minDepth;
  return levels.reduce((max, level) =>
    CONNECTION_LEVEL_RANK[level.depth] > CONNECTION_LEVEL_RANK[max] ? level.depth : max,
    levels[0].depth,
  );
}

/** Validate that a config has all required fields. Same signature as old validateRequiredConfig */
export function validateRequiredConfig(
  elementId: string,
  config: Record<string, unknown>,
): { valid: boolean; missingFields: string[] } {
  const spec = getElementSpec(elementId);
  if (!spec) return { valid: false, missingFields: ['UNKNOWN_ELEMENT'] };

  const missing: string[] = [];
  for (const [key, field] of Object.entries(spec.config)) {
    if (!field.required) continue;
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      // Skip if field has a default
      if (field.default !== undefined) continue;
      missing.push(key);
    }
  }
  return { valid: missing.length === 0, missingFields: missing };
}

/** Get connection requirements. Returns ConnectionSpec or null */
export function getConnectionRequirements(elementId: string): ConnectionSpec | null {
  const spec = getElementSpec(elementId);
  if (!spec) return null;
  // Elements with only standalone depth have no connection requirements
  if (spec.connection.minDepth === 'standalone' && spec.connection.levels.length <= 1) {
    return null;
  }
  return spec.connection;
}

/** Get all element IDs the generator should know about (standalone-capable) */
export function getGeneratableElementIds(): string[] {
  return ALL_SPECS
    .filter(s => s.connection.minDepth === 'standalone')
    .map(s => s.elementId);
}

/** Check if an element can be used without context */
export function canBeStandalone(elementId: string): boolean {
  const spec = getElementSpec(elementId);
  return spec?.connection.minDepth === 'standalone';
}
