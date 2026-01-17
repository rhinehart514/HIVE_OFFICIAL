/**
 * useConnectionCascade Hook
 *
 * Client-side cascade engine for HiveLab tool preview.
 * When an element fires an action, this hook finds all connected elements
 * and triggers them with the output value as input.
 *
 * Uses DAG-based topological sorting to ensure correct execution order
 * and detect cycles before they cause infinite loops.
 *
 * This mirrors the backend cascade engine for instant preview feedback.
 */

'use client';

import { useCallback, useRef, useMemo } from 'react';
import type { CanvasElement, Connection } from '../../components/hivelab/ide/types';
import {
  buildDAG,
  detectCycles,
  topologicalSort,
  getAffectedNodes,
  analyzeDAG,
  type DAGAnalysis,
} from '../../lib/hivelab/dag-utils';

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
  /** Optional callback for cycle detection */
  onCycleDetected?: (cycleNodes: string[]) => void;
}

export interface CascadeResult {
  /** Elements that were updated */
  updatedElements: string[];
  /** Any errors that occurred */
  errors: Array<{ elementId: string; error: string }>;
  /** Whether a cycle was detected */
  hasCycle?: boolean;
  /** Nodes involved in cycle (if any) */
  cycleNodes?: string[];
}

export interface ConnectionGraphInfo {
  /** Full DAG analysis */
  analysis: DAGAnalysis;
  /** Whether the graph is valid (no cycles) */
  isValid: boolean;
  /** Nodes in cycles (empty if valid) */
  cycleNodes: string[];
  /** Execution order (topologically sorted) */
  executionOrder: string[];
  /** Root nodes (no incoming connections) */
  rootNodes: string[];
  /** Leaf nodes (no outgoing connections) */
  leafNodes: string[];
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

const MAX_CASCADE_DEPTH = 10;

export function useConnectionCascade(ctx: CascadeContext) {
  const cascadeDepthRef = useRef(0);
  const executedInCascadeRef = useRef<Set<string>>(new Set());
  const cachedOutputsRef = useRef<Map<string, Map<string, unknown>>>(new Map());

  /**
   * Memoized DAG analysis - recalculates when connections or elements change
   */
  const graphInfo = useMemo((): ConnectionGraphInfo => {
    const { connections, elements } = ctx;
    const nodeIds = elements.map((el) => el.instanceId);
    const analysis = analyzeDAG(connections, nodeIds);

    return {
      analysis,
      isValid: analysis.isValid,
      cycleNodes: analysis.cycleNodes,
      executionOrder: analysis.executionOrder,
      rootNodes: analysis.rootNodes,
      leafNodes: analysis.leafNodes,
    };
  }, [ctx.connections, ctx.elements]);

  /**
   * Get cached output value for an element
   */
  const getCachedOutput = useCallback(
    (instanceId: string, outputPort: string): unknown | undefined => {
      const elementCache = cachedOutputsRef.current.get(instanceId);
      return elementCache?.get(outputPort);
    },
    []
  );

  /**
   * Cache output value for an element
   */
  const setCachedOutput = useCallback(
    (instanceId: string, outputPort: string, value: unknown): void => {
      let elementCache = cachedOutputsRef.current.get(instanceId);
      if (!elementCache) {
        elementCache = new Map();
        cachedOutputsRef.current.set(instanceId, elementCache);
      }
      elementCache.set(outputPort, value);
    },
    []
  );

  /**
   * Clear cache for downstream elements when source changes
   */
  const invalidateDownstreamCache = useCallback(
    (sourceInstanceId: string): void => {
      const { connections, elements } = ctx;
      const nodeIds = elements.map((el) => el.instanceId);
      const affected = getAffectedNodes(connections, nodeIds, sourceInstanceId);

      for (const nodeId of affected) {
        cachedOutputsRef.current.delete(nodeId);
      }
    },
    [ctx]
  );

  /**
   * Trigger cascade from a specific element and output
   * Uses topological ordering for correct execution sequence
   */
  const triggerCascade = useCallback(
    (
      sourceInstanceId: string,
      outputPort: string,
      outputValue: unknown,
      transform?: string
    ): CascadeResult => {
      const { connections, elements, elementStates, onStateUpdate, onCascadeComplete, onCycleDetected } = ctx;
      const updatedElements: string[] = [];
      const errors: Array<{ elementId: string; error: string }> = [];

      // Check for cycles before cascading
      if (!graphInfo.isValid && graphInfo.cycleNodes.includes(sourceInstanceId)) {
        onCycleDetected?.(graphInfo.cycleNodes);
        return {
          updatedElements: [],
          errors: [{
            elementId: sourceInstanceId,
            error: `Cycle detected involving nodes: ${graphInfo.cycleNodes.join(', ')}`,
          }],
          hasCycle: true,
          cycleNodes: graphInfo.cycleNodes,
        };
      }

      // Prevent infinite loops (fallback safety)
      if (cascadeDepthRef.current >= MAX_CASCADE_DEPTH) {
        return {
          updatedElements,
          errors: [{ elementId: sourceInstanceId, error: 'Max cascade depth reached' }],
        };
      }

      cascadeDepthRef.current++;

      try {
        // Invalidate cache for downstream elements
        invalidateDownstreamCache(sourceInstanceId);

        // Cache the output value
        const transformedValue = applyTransform(outputValue, transform);
        setCachedOutput(sourceInstanceId, outputPort, transformedValue);

        // Get affected nodes in topological order
        const nodeIds = elements.map((el) => el.instanceId);
        const affectedInOrder = getAffectedNodes(connections, nodeIds, sourceInstanceId);

        // Process each affected node in dependency order
        for (const targetInstanceId of affectedInOrder) {
          // Prevent duplicate execution in same cascade chain
          if (executedInCascadeRef.current.has(targetInstanceId)) {
            continue;
          }

          const targetElement = elements.find((el) => el.instanceId === targetInstanceId);
          if (!targetElement) {
            errors.push({ elementId: targetInstanceId, error: 'Target element not found' });
            continue;
          }

          // Gather all inputs for this element from its incoming connections
          const incomingConnections = connections.filter(
            (conn) => conn.to.instanceId === targetInstanceId
          );

          const currentState = elementStates[targetInstanceId] || {};
          let newState = { ...currentState };

          // Apply each incoming connection's data
          for (const conn of incomingConnections) {
            const sourceState = elementStates[conn.from.instanceId] || {};
            const sourceElement = elements.find((el) => el.instanceId === conn.from.instanceId);
            const sourceElementId = sourceElement?.elementId || '';

            // Get value from source element's output
            let value = extractOutputValue(sourceState, conn.from.port, sourceElementId);

            // Check cache if value is undefined
            if (value === undefined) {
              value = getCachedOutput(conn.from.instanceId, conn.from.port);
            }

            // Apply transform from connection if any
            if (conn.transform) {
              value = applyTransform(value, conn.transform);
            }

            // Set the input port value
            if (value !== undefined) {
              newState = {
                ...newState,
                [conn.to.port]: value,
                _cascadeSource: conn.from.instanceId,
                _cascadeOutput: conn.from.port,
                _lastCascadeAt: new Date().toISOString(),
              };
            }
          }

          executedInCascadeRef.current.add(targetInstanceId);
          onStateUpdate(targetInstanceId, newState);
          updatedElements.push(targetInstanceId);

          // Cache this element's output for downstream elements
          const targetElementId = targetElement.elementId;
          const outputs = getAffectedOutputs('update', targetElementId);
          for (const output of outputs) {
            const outputVal = extractOutputValue(newState, output, targetElementId);
            if (outputVal !== undefined) {
              setCachedOutput(targetInstanceId, output, outputVal);
            }
          }
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
    [ctx, graphInfo, invalidateDownstreamCache, getCachedOutput, setCachedOutput]
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
      let hasCycle = false;
      let cycleNodes: string[] = [];

      for (const output of affectedOutputs) {
        const outputValue = extractOutputValue(newState, output, elementId);
        const result = triggerCascade(instanceId, output, outputValue);
        allUpdatedElements.push(...result.updatedElements);
        allErrors.push(...result.errors);
        if (result.hasCycle) {
          hasCycle = true;
          cycleNodes = result.cycleNodes || [];
        }
      }

      // Remove duplicates
      const uniqueUpdated = [...new Set(allUpdatedElements)];

      return { updatedElements: uniqueUpdated, errors: allErrors, hasCycle, cycleNodes };
    },
    [triggerCascade]
  );

  /**
   * Validate the connection graph (detect cycles)
   */
  const validateGraph = useCallback((): { isValid: boolean; cycleNodes: string[] } => {
    return {
      isValid: graphInfo.isValid,
      cycleNodes: graphInfo.cycleNodes,
    };
  }, [graphInfo]);

  /**
   * Get the execution order for all elements
   */
  const getExecutionOrder = useCallback((): string[] => {
    return graphInfo.executionOrder;
  }, [graphInfo]);

  /**
   * Get graph analysis info
   */
  const getGraphInfo = useCallback((): ConnectionGraphInfo => {
    return graphInfo;
  }, [graphInfo]);

  /**
   * Clear all cached outputs (useful when resetting state)
   */
  const clearCache = useCallback((): void => {
    cachedOutputsRef.current.clear();
  }, []);

  return {
    /** Trigger cascade from specific output port */
    triggerCascade,
    /** Handle element action and cascade affected outputs */
    handleElementAction,
    /** Validate the connection graph for cycles */
    validateGraph,
    /** Get topological execution order */
    getExecutionOrder,
    /** Get full graph analysis */
    getGraphInfo,
    /** Clear output cache */
    clearCache,
    /** Whether the current graph is valid (no cycles) */
    isGraphValid: graphInfo.isValid,
    /** Nodes involved in cycles (if any) */
    cycleNodes: graphInfo.cycleNodes,
  };
}
