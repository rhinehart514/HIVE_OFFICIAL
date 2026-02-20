'use client';

/**
 * useConnectionResolver
 *
 * Resolves intra-tool element connections at render time.
 *
 * Connections define data flow between elements in a tool composition:
 *   poll-element.results → chart-display.data
 *   rsvp-button.attendees → leaderboard.entries
 *
 * This hook reads sharedState for each connection's source element,
 * extracts the correct value for the requested output port, formats it
 * for the target element's input port, and returns a map of resolved values.
 *
 * Usage (in ToolCanvas):
 *   const resolvedInputs = useConnectionResolver(connections, sharedState, allElementStates, elementDefs);
 *   // resolvedInputs["chart_001"]["data"] = [{name: "Option A", value: 5}, ...]
 */

import { useMemo } from 'react';
import type {
  ElementConnectionRef,
  ElementSharedState,
  ElementInstanceRef,
} from './element-system';

// ============================================================================
// Types
// ============================================================================

/** Map of elementInstanceId → { inputPort → resolved value } */
export type ResolvedInputs = Record<string, Record<string, unknown>>;

// ============================================================================
// Source Extraction
// ============================================================================

/**
 * Extract a source element's output value from shared state.
 * The output port name determines which slice of sharedState to read.
 */
function resolveOutputValue(
  elementType: string,
  instanceId: string,
  port: string,
  sharedState: ElementSharedState,
  allElementStates: Record<string, unknown>
): unknown {
  const normalPort = port.toLowerCase();
  const counters = sharedState.counters ?? {};
  const collections = sharedState.collections ?? {};
  const prefix = `${instanceId}:`;

  switch (elementType) {
    // ── Poll ──────────────────────────────────────────────────
    case 'poll-element':
    case 'poll': {
      if (normalPort === 'results') {
        // Each vote option is stored as counters["instanceId:optionId"] = count
        const results: Array<{ name: string; value: number }> = [];
        for (const [key, val] of Object.entries(counters)) {
          if (key.startsWith(prefix)) {
            results.push({ name: key.slice(prefix.length), value: val });
          }
        }
        return results.length > 0 ? results : null;
      }
      if (normalPort === 'totalvotes') {
        return Object.entries(counters)
          .filter(([k]) => k.startsWith(prefix))
          .reduce((sum, [, v]) => sum + v, 0);
      }
      break;
    }

    // ── RSVP ──────────────────────────────────────────────────
    case 'rsvp-button':
    case 'rsvp_button': {
      if (normalPort === 'attendees') {
        return Object.values(collections[`${instanceId}:attendees`] ?? {});
      }
      if (normalPort === 'count' || normalPort === 'attendeecount') {
        return counters[`${instanceId}:attendees`] ?? 0;
      }
      if (normalPort === 'waitlist') {
        return Object.values(collections[`${instanceId}:waitlist`] ?? {});
      }
      break;
    }

    // ── Counter ───────────────────────────────────────────────
    case 'counter': {
      if (normalPort === 'value') {
        return counters[`${instanceId}:value`] ?? 0;
      }
      break;
    }

    // ── Form Builder ──────────────────────────────────────────
    case 'form-builder':
    case 'form_builder': {
      if (normalPort === 'submitteddata' || normalPort === 'submissions') {
        return Object.values(collections[`${instanceId}:submissions`] ?? {});
      }
      if (normalPort === 'submissioncount') {
        return counters[`${instanceId}:submissionCount`] ?? 0;
      }
      break;
    }

    // ── Leaderboard ───────────────────────────────────────────
    case 'leaderboard': {
      if (normalPort === 'rankings' || normalPort === 'topscorer') {
        const scores = Object.values(collections[`${instanceId}:scores`] ?? {});
        return [...scores].sort(
          (a, b) =>
            ((b as { data?: { score?: number } }).data?.score ?? 0) -
            ((a as { data?: { score?: number } }).data?.score ?? 0)
        );
      }
      break;
    }

    // ── Signup Sheet ──────────────────────────────────────────
    case 'signup-sheet':
    case 'signup_sheet': {
      if (normalPort === 'signups') {
        return Object.values(collections[`${instanceId}:signups`] ?? {});
      }
      break;
    }

    // ── Checklist ─────────────────────────────────────────────
    case 'checklist-tracker':
    case 'checklist_tracker': {
      if (normalPort === 'completions') {
        return Object.values(collections[`${instanceId}:completions`] ?? {});
      }
      break;
    }
  }

  // Generic fallback: counter → collection → element state
  const counterVal = counters[`${instanceId}:${port}`];
  if (counterVal !== undefined) return counterVal;

  const collectionMap = collections[`${instanceId}:${port}`];
  if (collectionMap) return Object.values(collectionMap);

  return (allElementStates[instanceId] as unknown) ?? null;
}

// ============================================================================
// Target Formatting
// ============================================================================

/**
 * Format a resolved value for consumption by the target element.
 *
 * Different elements expect data in different shapes, so we adapt
 * the resolved value to what the target's `data` prop expects.
 */
function formatForTarget(
  value: unknown,
  targetPort: string,
  targetElementType: string
): unknown {
  if (value === null || value === undefined) return value;

  const port = targetPort.toLowerCase();

  // ── Chart: needs { chartData: [{name, value}] } ────────────
  if (targetElementType === 'chart-display' && port === 'data') {
    if (Array.isArray(value)) {
      // Already [{name, value}] format?
      const first = value[0] as Record<string, unknown> | undefined;
      if (first && 'name' in first && 'value' in first) {
        return { chartData: value };
      }
      // Array of collection entries — count them
      return { chartData: [{ name: 'Total', value: value.length }] };
    }
    if (typeof value === 'object' && value !== null) {
      // Object like { optionA: 5, optionB: 3 }
      const chartData = Object.entries(value as Record<string, unknown>).map(
        ([name, val]) => ({
          name,
          value: typeof val === 'number' ? val : (Number(val) || 0),
        })
      );
      return { chartData };
    }
    if (typeof value === 'number') {
      return { chartData: [{ name: 'Value', value }] };
    }
  }

  // ── Leaderboard: needs { entries: [{id, name, score}] } ────
  if (targetElementType === 'leaderboard' && port === 'entries') {
    if (Array.isArray(value)) {
      return {
        entries: value
          .map((entry, i) => {
            const e = entry as Record<string, unknown> & {
              data?: Record<string, unknown>;
              id?: string;
              createdBy?: string;
            };
            return {
              id: e.id ?? e.createdBy ?? String(i),
              name:
                (e.data?.displayName as string) ??
                (e.data?.name as string) ??
                e.createdBy ??
                `Entry ${i + 1}`,
              score: (e.data?.score as number) ?? 1,
            };
          })
          .sort((a, b) => b.score - a.score),
      };
    }
  }

  // ── Result list: needs { items: [...] } ────────────────────
  if (port === 'items') {
    return Array.isArray(value) ? { items: value } : value;
  }

  // ── Counter value ───────────────────────────────────────────
  if (port === 'value' && targetElementType === 'counter') {
    return { value: typeof value === 'number' ? value : Number(value) || 0 };
  }

  // Default: pass as-is
  return value;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Resolve all element-to-element connections in a tool composition.
 *
 * @param connections - Array of ElementConnectionRef from tool composition
 * @param sharedState - Aggregate shared state (all users' votes, RSVPs, etc.)
 * @param allElementStates - Per-element local state map
 * @param elementDefinitions - Array of {instanceId, elementId} for type lookup
 *
 * @returns ResolvedInputs — map of instanceId → { port → value }
 *
 * Memoized — only recomputes when connections or sharedState change.
 */
export function useConnectionResolver(
  connections: ElementConnectionRef[] | undefined,
  sharedState: ElementSharedState | undefined,
  allElementStates: Record<string, unknown>,
  elementDefinitions: ElementInstanceRef[] | undefined
): ResolvedInputs {
  return useMemo(() => {
    if (!connections?.length || !sharedState) return {};

    const safeState: ElementSharedState = {
      counters: sharedState.counters ?? {},
      collections: sharedState.collections ?? {},
      timeline: sharedState.timeline ?? [],
      computed: sharedState.computed ?? {},
      version: sharedState.version ?? 0,
      lastModified: sharedState.lastModified ?? '',
    };

    // Build instanceId → elementId lookup
    const typeByInstance: Record<string, string> = {};
    for (const def of elementDefinitions ?? []) {
      typeByInstance[def.instanceId] = def.elementId;
    }

    const result: ResolvedInputs = {};

    for (const conn of connections) {
      const sourceId = conn.from.instanceId;
      const sourcePort = conn.from.output ?? conn.from.port ?? 'output';
      const targetId = conn.to.instanceId;
      const targetPort = conn.to.input ?? conn.to.port ?? 'input';

      const sourceType = typeByInstance[sourceId] ?? '';
      const targetType = typeByInstance[targetId] ?? '';

      const rawValue = resolveOutputValue(
        sourceType,
        sourceId,
        sourcePort,
        safeState,
        allElementStates
      );

      if (rawValue === null || rawValue === undefined) continue;

      const formatted = formatForTarget(rawValue, targetPort, targetType);
      if (formatted === null || formatted === undefined) continue;

      if (!result[targetId]) result[targetId] = {};
      result[targetId][targetPort] = formatted;
    }

    return result;
  }, [connections, sharedState, allElementStates, elementDefinitions]);
}
