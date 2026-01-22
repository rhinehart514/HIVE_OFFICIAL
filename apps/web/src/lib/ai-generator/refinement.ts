/**
 * Iteration & Refinement Detection
 *
 * Detects if user is asking to modify, delete, or add to an existing tool.
 * Handles conversational refinement of AI-generated compositions.
 */

import type { ElementSpec } from './element-composition';

export type RefinementAction = 'add' | 'modify' | 'delete';

export interface RefinementRequest {
  action: RefinementAction;
  targetKeyword?: string;      // What element to target (e.g., 'poll', 'timer')
  targetElementId?: string;    // Resolved element ID if found
  change?: string;             // Type of change (e.g., 'size', 'color', 'options')
  newValue?: string | number;  // New value for the change
  confidence: number;
}

// Signals grouped by action type
export const ADD_SIGNALS = ['add', 'also', 'include', 'plus', 'and also', 'with', 'need'];
export const MODIFY_SIGNALS = ['change', 'modify', 'update', 'edit', 'adjust', 'make it', 'make the', 'can you make'];
export const DELETE_SIGNALS = ['remove', 'delete', 'get rid of', 'take out', 'hide', 'no more'];
export const SIZE_SIGNALS = ['bigger', 'larger', 'smaller', 'taller', 'shorter', 'wider'];
export const QUANTITY_SIGNALS = ['more', 'less', 'fewer', 'extra'];

export const ITERATION_SIGNALS = [
  ...ADD_SIGNALS,
  ...MODIFY_SIGNALS,
  ...DELETE_SIGNALS,
  'make it', 'can you', 'could you',
  ...SIZE_SIGNALS,
  ...QUANTITY_SIGNALS,
];

// Element keywords to help identify targets
export const ELEMENT_KEYWORDS: Record<string, string[]> = {
  'poll-element': ['poll', 'vote', 'voting', 'survey'],
  'countdown-timer': ['timer', 'countdown', 'clock', 'deadline'],
  'form-builder': ['form', 'input', 'fields', 'submit'],
  'chart-display': ['chart', 'graph', 'visualization', 'analytics'],
  'result-list': ['list', 'results', 'items', 'display'],
  'leaderboard': ['leaderboard', 'ranking', 'scores', 'standings'],
  'rsvp-button': ['rsvp', 'attend', 'sign up', 'register'],
  'search-input': ['search', 'find', 'filter'],
  'personalized-event-feed': ['events', 'event feed', 'event list', 'happening'],
  'dining-picker': ['dining', 'food', 'eat', 'restaurant', 'cafeteria'],
  'filter-selector': ['filter', 'filters', 'category', 'tags'],
  'event-picker': ['events', 'event', 'calendar'],
  'map-view': ['map', 'location', 'campus'],
  'notification-display': ['notifications', 'announcements', 'alerts'],
};

/**
 * Check if a prompt is asking for iteration on existing tool
 */
export function isIterationRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return ITERATION_SIGNALS.some(signal => lower.includes(signal.toLowerCase()));
}

/**
 * Detect what refinement the user is requesting
 */
export function detectRefinement(prompt: string, existingElements: ElementSpec[] = []): RefinementRequest | null {
  const lower = prompt.toLowerCase();

  // Early exit if not an iteration request
  if (!isIterationRequest(prompt)) {
    return null;
  }

  // Determine action type
  let action: RefinementAction = 'modify';
  let confidence = 0.5;

  if (ADD_SIGNALS.some(s => lower.includes(s))) {
    action = 'add';
    confidence = 0.7;
  } else if (DELETE_SIGNALS.some(s => lower.includes(s))) {
    action = 'delete';
    confidence = 0.8;
  } else if (MODIFY_SIGNALS.some(s => lower.includes(s))) {
    action = 'modify';
    confidence = 0.7;
  }

  // Find target element
  let targetKeyword: string | undefined;
  let targetElementId: string | undefined;

  for (const [elementId, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        targetKeyword = keyword;

        // Try to match with existing elements
        const match = existingElements.find(el => el.elementId === elementId);
        if (match) {
          targetElementId = match.instanceId;
          confidence += 0.2;
        }
        break;
      }
    }
    if (targetKeyword) break;
  }

  // Detect specific changes
  let change: string | undefined;
  let newValue: string | number | undefined;

  // Size changes
  if (SIZE_SIGNALS.some(s => lower.includes(s))) {
    change = 'size';
    if (lower.includes('bigger') || lower.includes('larger')) {
      newValue = 'larger';
    } else if (lower.includes('smaller')) {
      newValue = 'smaller';
    }
  }

  // Quantity changes
  if (QUANTITY_SIGNALS.some(s => lower.includes(s))) {
    change = 'quantity';
    if (lower.includes('more') || lower.includes('extra')) {
      newValue = 'increase';
    } else if (lower.includes('less') || lower.includes('fewer')) {
      newValue = 'decrease';
    }
  }

  // Color changes
  const colorMatch = lower.match(/make it (\w+)|(\w+) color/);
  if (colorMatch) {
    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'gold'];
    const foundColor = colors.find(c => lower.includes(c));
    if (foundColor) {
      change = 'color';
      newValue = foundColor;
    }
  }

  // Option/count changes
  const numberMatch = lower.match(/(\d+)\s*(options?|items?|choices?|entries?)/);
  if (numberMatch) {
    change = 'count';
    newValue = parseInt(numberMatch[1], 10);
  }

  return {
    action,
    targetKeyword,
    targetElementId,
    change,
    newValue,
    confidence,
  };
}
