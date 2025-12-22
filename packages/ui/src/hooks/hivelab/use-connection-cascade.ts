/**
 * useConnectionCascade Hook
 *
 * Client-side cascade engine for HiveLab tool preview.
 * When an element fires an action, this hook finds all connected elements
 * and triggers them with the output value as input.
 *
 * This mirrors the backend cascade engine for instant preview feedback.
 */

'use client';

import { useCallback, useRef } from 'react';
import type { CanvasElement, Connection } from '../../components/hivelab/ide/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface CascadeContext {
  /** All elements in the composition */
  elements: CanvasElement[];
  /** All connections between elements */
  connections: Connection[];
  /** Current state of each element (keyed by instanceId) */
  elementStates: Record<string, Record<string, unknown>>;
  /** Callback to update element state */
  onStateUpdate: (instanceId: string, newState: Record<string, unknown>) => void;
  /** Optional callback when cascade completes */
  onCascadeComplete?: (updatedElements: string[]) => void;
}

export interface CascadeResult {
  /** Elements that were updated */
  updatedElements: string[];
  /** Any errors that occurred */
  errors: Array<{ elementId: string; error: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// OUTPUT EXTRACTORS (mirrors backend)
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete output mappings for all 27 element types
 * Maps output port names to state property names
 */
const OUTPUT_MAPPINGS: Record<string, Record<string, string>> = {
  // Universal elements
  'poll-element': { results: 'responses', votes: 'totalVotes', winner: 'topChoice', data: 'responses' },
  'form-builder': { submissions: 'submissions', data: 'lastSubmission', count: 'submissionCount' },
  'leaderboard': { entries: 'entries', data: 'entries', top: 'topEntries', rankings: 'entries' },
  'counter': { value: 'value', count: 'value', data: 'value' },
  'timer': { elapsed: 'elapsed', running: 'isRunning', time: 'elapsed', data: 'elapsed' },
  'countdown-timer': { finished: 'finished', complete: 'finished', timeLeft: 'timeLeft', data: 'timeLeft' },
  'search-input': { query: 'query', searchTerm: 'query', text: 'query', data: 'query' },
  'filter-selector': { filters: 'selectedFilters', selectedFilters: 'selectedFilters', data: 'selectedFilters' },
  'result-list': { items: 'items', selection: 'selectedItem', data: 'items' },
  'date-picker': { date: 'selectedDate', selectedDate: 'selectedDate', data: 'selectedDate' },
  'tag-cloud': { tags: 'tags', selected: 'selectedTags', selectedTags: 'selectedTags', data: 'selectedTags' },
  'map-view': { location: 'selectedLocation', markers: 'markers', data: 'markers' },
  'chart-display': { chartData: 'chartData', selection: 'selectedPoint', data: 'chartData' },
  'notification-display': { notifications: 'notifications', count: 'notificationCount', data: 'notifications' },

  // Connected elements
  'event-picker': { event: 'selectedEvent', eventId: 'selectedEventId', events: 'events', data: 'selectedEvent' },
  'space-picker': { space: 'selectedSpace', spaceId: 'selectedSpaceId', spaces: 'spaces', data: 'selectedSpace' },
  'user-selector': { user: 'selectedUser', userId: 'selectedUserId', users: 'users', data: 'selectedUser' },
  'rsvp-button': { attendees: 'attendees', count: 'count', waitlist: 'waitlist', data: 'attendees' },
  'connection-list': { connections: 'connections', selected: 'selectedConnection', data: 'connections' },

  // Space elements
  'member-list': { members: 'members', selected: 'selectedMember', data: 'members' },
  'member-selector': { member: 'selectedMember', members: 'selectedMembers', data: 'selectedMember' },
  'space-events': { events: 'events', upcoming: 'upcomingEvents', data: 'events' },
  'space-feed': { posts: 'posts', feed: 'posts', data: 'posts' },
  'space-stats': { stats: 'stats', metrics: 'stats', data: 'stats' },
  'announcement': { sent: 'announcementSent', recipients: 'recipients', data: 'announcementSent' },
  'role-gate': { allowed: 'isAllowed', role: 'currentRole', isAllowed: 'isAllowed', data: 'isAllowed' },
};

/**
 * Action to output mappings
 * Maps action names to the output ports they affect
 */
const ACTION_OUTPUT_MAPPINGS: Record<string, Record<string, string[]>> = {
  'poll-element': { vote: ['results', 'votes', 'data'], submit: ['results', 'votes', 'data'] },
  'form-builder': { submit: ['submissions', 'data', 'count'] },
  'leaderboard': { update_score: ['entries', 'data'], increment: ['entries', 'data'] },
  'counter': { increment: ['value', 'data'], decrement: ['value', 'data'], update: ['value', 'data'] },
  'timer': { start: ['running', 'data'], stop: ['elapsed', 'time', 'data'], reset: ['elapsed', 'running', 'data'] },
  'countdown-timer': { start: ['timeLeft', 'data'], finished: ['finished', 'complete', 'data'] },
  'search-input': { search: ['query', 'data'], change: ['query', 'data'] },
  'filter-selector': { select: ['selectedFilters', 'data'], change: ['selectedFilters', 'data'] },
  'result-list': { select: ['selectedItem', 'data'] },
  'date-picker': { select: ['selectedDate', 'data'], change: ['selectedDate', 'data'] },
  'tag-cloud': { select: ['selectedTags', 'data'], toggle: ['selectedTags', 'data'] },
  'event-picker': { select: ['selectedEvent', 'data'], change: ['selectedEvent', 'data'] },
  'space-picker': { select: ['selectedSpace', 'data'], change: ['selectedSpace', 'data'] },
  'user-selector': { select: ['selectedUser', 'data'], change: ['selectedUser', 'data'] },
  'rsvp-button': { rsvp: ['attendees', 'count', 'data'], cancel_rsvp: ['attendees', 'count', 'data'] },
  'member-list': { select: ['selectedMember', 'data'] },
  'member-selector': { select: ['selectedMember', 'data'], change: ['selectedMember', 'data'] },
  'space-events': { select: ['selectedEvent', 'data'] },
  'space-feed': { post: ['posts', 'data'] },
  'announcement': { send: ['sent', 'recipients', 'data'] },
};

/**
 * Extract output value from element state
 */
function extractOutputValue(
  elementState: Record<string, unknown>,
  outputName: string,
  elementId: string
): unknown {
  // Direct property match
  if (elementState[outputName] !== undefined) {
    return elementState[outputName];
  }

  // Try element-specific mapping
  const mapping = OUTPUT_MAPPINGS[elementId];
  if (mapping && mapping[outputName]) {
    return elementState[mapping[outputName]];
  }

  // Default: return entire state if 'data' output
  if (outputName === 'data') {
    return elementState;
  }

  return undefined;
}

/**
 * Get outputs affected by an action
 */
function getAffectedOutputs(action: string, elementId: string): string[] {
  const elementOutputs = ACTION_OUTPUT_MAPPINGS[elementId];
  if (elementOutputs && elementOutputs[action]) {
    return elementOutputs[action];
  }
  // Default: action name is the output
  return [action, 'data'];
}

/**
 * Apply transform to data
 */
function applyTransform(data: unknown, transform?: string): unknown {
  if (!transform) return data;

  switch (transform) {
    case 'toArray':
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return Object.entries(data).map(([id, value]) => ({
          id,
          ...(typeof value === 'object' ? value : { value }),
        }));
      }
      return data;

    case 'toCount':
      if (Array.isArray(data)) return data.length;
      if (typeof data === 'object' && data !== null) return Object.keys(data).length;
      return 0;

    case 'toSorted':
      if (Array.isArray(data)) {
        return [...data].sort((a, b) => {
          const scoreA = typeof a === 'object' && a !== null ? (a as { score?: number }).score || 0 : 0;
          const scoreB = typeof b === 'object' && b !== null ? (b as { score?: number }).score || 0 : 0;
          return scoreB - scoreA;
        });
      }
      return data;

    case 'toTop5':
      if (Array.isArray(data)) {
        return [...data]
          .sort((a, b) => ((b as { score?: number }).score || 0) - ((a as { score?: number }).score || 0))
          .slice(0, 5);
      }
      return data;

    default:
      return data;
  }
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

const MAX_CASCADE_DEPTH = 5;

export function useConnectionCascade(ctx: CascadeContext) {
  const cascadeDepthRef = useRef(0);
  const executedInCascadeRef = useRef<Set<string>>(new Set());

  /**
   * Trigger cascade from a specific element and output
   */
  const triggerCascade = useCallback(
    (
      sourceInstanceId: string,
      outputPort: string,
      outputValue: unknown,
      transform?: string
    ): CascadeResult => {
      const { connections, elements, elementStates, onStateUpdate, onCascadeComplete } = ctx;
      const updatedElements: string[] = [];
      const errors: Array<{ elementId: string; error: string }> = [];

      // Prevent infinite loops
      if (cascadeDepthRef.current >= MAX_CASCADE_DEPTH) {
        return { updatedElements, errors: [{ elementId: sourceInstanceId, error: 'Max cascade depth reached' }] };
      }

      cascadeDepthRef.current++;

      try {
        // Find all connections FROM this element's output
        const outgoingConnections = connections.filter(
          (conn) =>
            conn.from.instanceId === sourceInstanceId &&
            conn.from.port === outputPort
        );

        for (const connection of outgoingConnections) {
          const targetInstanceId = connection.to.instanceId;

          // Prevent duplicate execution in same cascade chain
          if (executedInCascadeRef.current.has(targetInstanceId)) {
            continue;
          }

          const targetElement = elements.find((el) => el.instanceId === targetInstanceId);
          if (!targetElement) {
            errors.push({ elementId: targetInstanceId, error: 'Target element not found' });
            continue;
          }

          // Apply transform if specified
          const transformedValue = applyTransform(outputValue, transform);

          // Update target element's state with input data
          const currentState = elementStates[targetInstanceId] || {};
          const newState = {
            ...currentState,
            [connection.to.port]: transformedValue,
            _cascadeSource: sourceInstanceId,
            _cascadeOutput: outputPort,
            _lastCascadeAt: new Date().toISOString(),
          };

          executedInCascadeRef.current.add(targetInstanceId);
          onStateUpdate(targetInstanceId, newState);
          updatedElements.push(targetInstanceId);

          // Recursive cascade from target element (using 'data' as default output)
          const nestedResult = triggerCascade(targetInstanceId, 'data', newState);
          updatedElements.push(...nestedResult.updatedElements);
          errors.push(...nestedResult.errors);
        }
      } finally {
        cascadeDepthRef.current--;

        // Reset executed set when cascade chain completes
        if (cascadeDepthRef.current === 0) {
          executedInCascadeRef.current.clear();
          if (updatedElements.length > 0) {
            onCascadeComplete?.(updatedElements);
          }
        }
      }

      return { updatedElements, errors };
    },
    [ctx]
  );

  /**
   * Handle element action and trigger cascades for affected outputs
   */
  const handleElementAction = useCallback(
    (
      instanceId: string,
      elementId: string,
      actionName: string,
      newState: Record<string, unknown>
    ): CascadeResult => {
      const affectedOutputs = getAffectedOutputs(actionName, elementId);
      const allUpdatedElements: string[] = [];
      const allErrors: Array<{ elementId: string; error: string }> = [];

      for (const output of affectedOutputs) {
        const outputValue = extractOutputValue(newState, output, elementId);
        const result = triggerCascade(instanceId, output, outputValue);
        allUpdatedElements.push(...result.updatedElements);
        allErrors.push(...result.errors);
      }

      // Remove duplicates
      const uniqueUpdated = [...new Set(allUpdatedElements)];

      return { updatedElements: uniqueUpdated, errors: allErrors };
    },
    [triggerCascade]
  );

  return {
    /** Trigger cascade from specific output port */
    triggerCascade,
    /** Handle element action and cascade affected outputs */
    handleElementAction,
  };
}
