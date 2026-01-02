/**
 * Mock AI Generator - Ambiguous Creation System
 *
 * ARCHITECTURE PRINCIPLES:
 * 1. Like ChatGPT: user describes intent, we compose elements to achieve it
 * 2. No prescribed templates - dynamically compose based on detected INTENT
 * 3. Don't assume use case - the tool exists, user decides what to do with it
 * 4. Respect tier access - only compose with elements user can access
 *
 * The magic: turn ambiguous descriptions into functional compositions.
 */

import type { ElementTier, UserContext } from '@hive/ui';

export interface StreamingChunk {
  type: 'thinking' | 'element' | 'connection' | 'complete' | 'error';
  data: Record<string, unknown>;
}

export interface SpaceContext {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
  category?: string;
  memberCount?: number;
  description?: string;
}

export interface GenerateToolRequest {
  prompt: string;
  templateId?: string;
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };
  spaceContext?: SpaceContext;
  userContext?: UserContext; // NEW: determines element access
  existingComposition?: {
    elements: ElementSpec[];
    name?: string;
  };
  isIteration?: boolean;
}

// =============================================================================
// INTENT DETECTION
// Rather than matching to templates, detect WHAT THE USER WANTS TO ACHIEVE
// =============================================================================

type Intent =
  | 'collect-input'      // gather information from people
  | 'show-results'       // display aggregated data
  | 'track-time'         // countdown, deadline, timer
  | 'rank-items'         // leaderboard, standings
  | 'enable-voting'      // poll, decision-making
  | 'search-filter'      // find, browse, filter
  | 'coordinate-people'  // rsvp, match, connect
  | 'broadcast'          // announce, notify
  | 'visualize-data';    // chart, graph, metrics

interface DetectedIntent {
  primary: Intent;
  secondary: Intent[];
  confidence: number;
  keywords: string[];
}

// Intent signal keywords - not templates, just signals
const INTENT_SIGNALS: Record<Intent, string[]> = {
  'collect-input': ['form', 'collect', 'gather', 'get', 'ask', 'submit', 'fill', 'enter', 'sign up', 'signup', 'register'],
  'show-results': ['show', 'display', 'list', 'view', 'see', 'results', 'responses', 'submissions'],
  'track-time': ['countdown', 'timer', 'deadline', 'until', 'remaining', 'days', 'hours'],
  'rank-items': ['leaderboard', 'ranking', 'top', 'best', 'score', 'points', 'standings', 'competition'],
  'enable-voting': ['poll', 'vote', 'voting', 'opinion', 'decide', 'choose', 'pick', 'preference'],
  'search-filter': ['search', 'find', 'filter', 'browse', 'look for', 'looking for', 'discover'],
  'coordinate-people': ['rsvp', 'attend', 'join', 'match', 'connect', 'coordinate', 'organize', 'who', 'people'],
  'broadcast': ['announce', 'broadcast', 'notify', 'alert', 'message', 'share', 'tell'],
  'visualize-data': ['chart', 'graph', 'visualize', 'data', 'analytics', 'metrics', 'stats', 'trends'],
};

function detectIntent(prompt: string): DetectedIntent {
  const lower = prompt.toLowerCase();
  const scores: Record<Intent, number> = {
    'collect-input': 0,
    'show-results': 0,
    'track-time': 0,
    'rank-items': 0,
    'enable-voting': 0,
    'search-filter': 0,
    'coordinate-people': 0,
    'broadcast': 0,
    'visualize-data': 0,
  };

  const matchedKeywords: string[] = [];

  // Score each intent based on keyword matches
  for (const [intent, keywords] of Object.entries(INTENT_SIGNALS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[intent as Intent] += keyword.length; // Longer matches = higher confidence
        matchedKeywords.push(keyword);
      }
    }
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    // Default to collect-input + show-results if no clear intent
    return {
      primary: 'collect-input',
      secondary: ['show-results'],
      confidence: 0.5,
      keywords: [],
    };
  }

  const maxScore = sorted[0][1];
  return {
    primary: sorted[0][0] as Intent,
    secondary: sorted.slice(1, 3).map(s => s[0] as Intent),
    confidence: Math.min(maxScore / 20, 1), // Normalize to 0-1
    keywords: matchedKeywords,
  };
}

// =============================================================================
// ELEMENT COMPOSITION
// Map intents to element combinations that achieve them
// =============================================================================

interface ElementSpec {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  tier: ElementTier;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: string;
}

// Elements that achieve each intent
const INTENT_ELEMENTS: Record<Intent, ElementSpec[]> = {
  'collect-input': [{
    elementId: 'form-builder',
    instanceId: 'input-form',
    config: {
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Your name' },
        { name: 'response', type: 'textarea', required: false, label: 'Your response' },
      ],
      submitLabel: 'Submit',
    },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 4 },
    tier: 'universal',
  }],

  'show-results': [{
    elementId: 'result-list',
    instanceId: 'results-display',
    config: { itemsPerPage: 10, showPagination: true },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 5 },
    tier: 'universal',
  }],

  'track-time': [{
    elementId: 'countdown-timer',
    instanceId: 'timer',
    config: {
      label: 'Time remaining',
      showDays: true,
    },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 3 },
    tier: 'universal',
  }],

  'rank-items': [{
    elementId: 'leaderboard',
    instanceId: 'rankings',
    config: {
      showRank: true,
      showScore: true,
      maxEntries: 10,
      highlightTop: 3,
    },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 6 },
    tier: 'universal',
  }],

  'enable-voting': [{
    elementId: 'poll-element',
    instanceId: 'poll',
    config: {
      question: 'What do you think?',
      options: ['Option A', 'Option B', 'Option C'],
      showResults: true,
    },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 4 },
    tier: 'universal',
  }],

  'search-filter': [
    {
      elementId: 'search-input',
      instanceId: 'search',
      config: { placeholder: 'Search...', showSuggestions: true },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 1 },
      tier: 'universal',
    },
    {
      elementId: 'filter-selector',
      instanceId: 'filters',
      config: { options: [], allowMultiple: true },
      position: { x: 0, y: 1 },
      size: { width: 12, height: 1 },
      tier: 'universal',
    },
  ],

  'coordinate-people': [{
    elementId: 'rsvp-button',
    instanceId: 'rsvp',
    config: {
      eventName: 'Event',
      showCount: true,
      maxAttendees: 100,
    },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 3 },
    tier: 'connected',
  }],

  'broadcast': [{
    elementId: 'notification-display',
    instanceId: 'announcements',
    config: { maxNotifications: 5 },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 4 },
    tier: 'universal',
  }],

  'visualize-data': [{
    elementId: 'chart-display',
    instanceId: 'chart',
    config: { chartType: 'bar', showLegend: true, animate: true },
    position: { x: 0, y: 0 },
    size: { width: 12, height: 4 },
    tier: 'universal',
  }],
};

// Complementary elements that enhance compositions
const COMPLEMENTARY_PAIRS: Record<Intent, Intent[]> = {
  'collect-input': ['show-results', 'visualize-data'],
  'enable-voting': ['visualize-data', 'show-results'],
  'search-filter': ['show-results', 'coordinate-people'],
  'coordinate-people': ['track-time', 'show-results'],
  'track-time': ['collect-input', 'broadcast'],
  'rank-items': ['collect-input', 'visualize-data'],
  'broadcast': ['track-time'],
  'show-results': [],
  'visualize-data': [],
};

function composeElements(
  intent: DetectedIntent,
  userContext?: UserContext
): { elements: ElementSpec[]; connections: Connection[] } {
  const elements: ElementSpec[] = [];
  let yOffset = 0;

  // Get primary intent elements
  const primaryElements = INTENT_ELEMENTS[intent.primary];
  for (const el of primaryElements) {
    // Check if user can access this element tier
    if (!canAccessTier(el.tier, userContext)) continue;

    elements.push({
      ...el,
      position: { x: el.position.x, y: yOffset + el.position.y },
    });
    yOffset += el.size.height;
  }

  // Add complementary elements for richer compositions
  const complements = COMPLEMENTARY_PAIRS[intent.primary];
  for (const complement of complements) {
    const complementElements = INTENT_ELEMENTS[complement];
    for (const el of complementElements) {
      if (!canAccessTier(el.tier, userContext)) continue;

      elements.push({
        ...el,
        instanceId: `${el.instanceId}-complement`,
        position: { x: el.position.x, y: yOffset + el.position.y },
      });
      yOffset += el.size.height;
    }
    break; // Only add one complement
  }

  // Generate logical connections
  const connections = generateConnections(elements);

  return { elements, connections };
}

function canAccessTier(tier: ElementTier, context?: UserContext): boolean {
  if (tier === 'universal') return true;
  if (tier === 'connected') return true; // Everyone can use connected elements
  if (tier === 'space') return context?.isSpaceLeader ?? false;
  return false;
}

function generateConnections(elements: ElementSpec[]): Connection[] {
  const connections: Connection[] = [];

  // Define which element types can connect
  const outputTypes = ['search-input', 'filter-selector', 'form-builder', 'poll-element'];
  const inputTypes = ['result-list', 'chart-display', 'leaderboard'];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const from = elements[i];
      const to = elements[j];

      if (outputTypes.includes(from.elementId) && inputTypes.includes(to.elementId)) {
        connections.push({
          id: `conn-${Date.now()}-${i}-${j}`,
          from: from.instanceId,
          to: to.instanceId,
          type: 'data-flow',
        });
      }
    }
  }

  return connections;
}

// =============================================================================
// NAME GENERATION
// Extract meaningful name from user's description
// =============================================================================

function generateToolName(prompt: string, intent: DetectedIntent): string {
  const words = prompt.toLowerCase().split(/\s+/);

  // Remove common verbs and articles
  const stopWords = ['i', 'want', 'to', 'create', 'make', 'build', 'a', 'an', 'the', 'for', 'that', 'which', 'can', 'will'];
  const meaningful = words.filter(w => w.length > 2 && !stopWords.includes(w));

  // Try to find a subject (what this is about)
  const forIndex = words.indexOf('for');
  if (forIndex !== -1 && words[forIndex + 1]) {
    const subject = words.slice(forIndex + 1, forIndex + 3).join(' ');
    return capitalize(subject);
  }

  // Use first 2-3 meaningful words
  if (meaningful.length >= 2) {
    return capitalize(meaningful.slice(0, 3).join(' '));
  }

  // Fall back to intent-based name
  const intentNames: Record<Intent, string> = {
    'collect-input': 'Input Collector',
    'show-results': 'Results Display',
    'track-time': 'Countdown',
    'rank-items': 'Leaderboard',
    'enable-voting': 'Poll',
    'search-filter': 'Finder',
    'coordinate-people': 'Coordinator',
    'broadcast': 'Announcements',
    'visualize-data': 'Data Dashboard',
  };

  return intentNames[intent.primary];
}

function capitalize(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// ITERATION DETECTION
// Detect if user is asking to modify existing tool vs create new
// =============================================================================

const ITERATION_SIGNALS = [
  'add', 'also', 'include', 'plus', 'and also',
  'change', 'modify', 'update', 'edit', 'adjust',
  'remove', 'delete', 'get rid of',
  'make it', 'can you', 'could you',
  'more', 'less', 'bigger', 'smaller',
];

function isIterationRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase().trim();
  return ITERATION_SIGNALS.some(signal => lower.startsWith(signal) || lower.includes(` ${signal} `));
}

// =============================================================================
// STREAMING GENERATOR
// The main interface - takes a description, emits a composition
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function* mockGenerateToolStreaming(
  request: GenerateToolRequest
): AsyncGenerator<StreamingChunk> {
  const isIteration = request.isIteration || isIterationRequest(request.prompt);
  const existingElements = request.existingComposition?.elements || [];

  // Step 1: Detect intent from prompt
  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? `Updating your tool: "${request.prompt.substring(0, 40)}..."`
        : `Understanding: "${request.prompt.substring(0, 50)}..."`
    },
  };
  await delay(300);

  const intent = detectIntent(request.prompt);

  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? `Adding ${intent.primary} capability...`
        : `Detected intent: ${intent.primary} (${Math.round(intent.confidence * 100)}% confident)`,
      keywords: intent.keywords,
    },
  };
  await delay(300);

  // Step 2: Compose elements (new ones only for iteration)
  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? 'Adding new elements to your tool...'
        : 'Composing elements to achieve this...'
    },
  };
  await delay(200);

  const { elements: newElements, connections: newConnections } = composeElements(intent, request.userContext);

  // For iteration: only emit the NEW elements (not existing ones)
  // For new creation: emit all elements
  const elementsToEmit = isIteration
    ? newElements.map(el => ({
        ...el,
        // Offset position to avoid overlap with existing elements
        position: {
          x: el.position.x,
          y: el.position.y + (existingElements.length * 5), // Stack below existing
        },
      }))
    : newElements;

  // Step 3: Emit elements one by one
  // Transform to match the format expected by use-streaming-generation.ts
  // (matches Firebase generator output format: id/type instead of instanceId/elementId)
  for (const element of elementsToEmit) {
    yield {
      type: 'element',
      data: {
        id: element.instanceId,
        type: element.elementId,
        name: element.elementId,
        config: element.config,
        position: element.position,
        size: element.size,
      },
    };
    await delay(150);
  }

  // Step 4: Emit connections
  for (const connection of newConnections) {
    yield {
      type: 'connection',
      data: connection as unknown as Record<string, unknown>,
    };
    await delay(100);
  }

  // Step 5: Complete
  // For iteration, keep the existing name
  const toolName = isIteration && request.existingComposition?.name
    ? request.existingComposition.name
    : generateToolName(request.prompt, intent);

  // Combine existing + new elements for total count
  const totalElements = isIteration
    ? existingElements.length + elementsToEmit.length
    : elementsToEmit.length;

  yield {
    type: 'complete',
    data: {
      toolId: `tool-${Date.now()}`,
      name: toolName,
      description: isIteration
        ? `Updated: ${request.prompt}`
        : `Composed from your description: "${request.prompt}"`,
      elementCount: totalElements,
      connectionCount: newConnections.length,
      intent: intent.primary,
      confidence: intent.confidence,
      isIteration,
      // CRITICAL: The system doesn't assume what you'll do with this
      suggestedActions: [
        'Save to My Creations',
        'Share via link',
        'Iterate on design',
        ...(request.userContext?.isSpaceLeader ? ['Deploy to space'] : []),
      ],
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { detectIntent, composeElements, generateToolName, isIterationRequest };
export type { DetectedIntent, Intent, ElementSpec };
