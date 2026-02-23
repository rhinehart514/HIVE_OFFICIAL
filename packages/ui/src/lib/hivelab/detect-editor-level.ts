/**
 * Editor Level Detection
 *
 * Detects the appropriate editor complexity level for a tool composition.
 * Routes simple tools to lightweight editors instead of the full IDE.
 */

export type EditorLevel = 'embed' | 'configure' | 'compose' | 'flow';

/** Space/campus primitive element IDs — these are embed-level when standalone */
const EMBED_ELEMENT_IDS = new Set([
  'member-list',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'role-gate',
  'event-picker',
  'connection-list',
  'personalized-event-feed',
  'dining-picker',
  'study-spot-finder',
  'member-selector',
  'user-selector',
]);

interface DetectEditorLevelInput {
  elements: Array<{ elementId: string }>;
  connections: Array<unknown>;
  pages?: Array<unknown>;
}

/**
 * Detect which editor level fits this composition.
 *
 * Priority order:
 * 1. Multi-page → flow (full IDE)
 * 2. Has connections → flow
 * 3. Empty canvas → flow (needs IDE to build from scratch)
 * 4. 1 element, space/campus primitive → embed
 * 5. 1 element, standalone → configure
 * 6. 2–6 elements → compose
 * 7. 7+ elements → flow
 */
export function detectEditorLevel(input: DetectEditorLevelInput): EditorLevel {
  const { elements, connections, pages } = input;

  // Multi-page → full IDE
  if (pages && pages.length > 1) return 'flow';

  // Has connections → full IDE
  if (connections.length > 0) return 'flow';

  // Empty canvas → full IDE (user needs the blank canvas experience)
  if (elements.length === 0) return 'flow';

  // Single element
  if (elements.length === 1) {
    const elementId = elements[0].elementId;
    return EMBED_ELEMENT_IDS.has(elementId) ? 'embed' : 'configure';
  }

  // 2–6 elements → compose (stacked cards)
  if (elements.length <= 6) return 'compose';

  // 7+ elements → full IDE
  return 'flow';
}

/** Check if an element ID is a space/campus primitive */
export function isEmbedElement(elementId: string): boolean {
  return EMBED_ELEMENT_IDS.has(elementId);
}
