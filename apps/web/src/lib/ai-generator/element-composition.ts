/**
 * Element Composition System
 *
 * Maps detected intents to element combinations that achieve them.
 * Handles tier-based access control and automatic connection generation.
 */

import type { ElementTier, UserContext } from '@hive/ui';
import type { Intent, DetectedIntent } from './intent-detection';

export interface ElementSpec {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  tier: ElementTier;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: string;
}

// Elements that achieve each intent
export const INTENT_ELEMENTS: Record<Intent, ElementSpec[]> = {
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

  // Campus-specific intent compositions
  'discover-events': [
    {
      elementId: 'personalized-event-feed',
      instanceId: 'personalized-events',
      config: {
        title: 'Events For You',
        timeRange: 'tonight',
        maxItems: 8,
        showFriendCount: true,
        showMatchReasons: true,
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 8 },
      tier: 'connected',
    },
    {
      elementId: 'filter-selector',
      instanceId: 'event-filters',
      config: {
        label: 'Filter by type',
        options: ['Social', 'Academic', 'Music', 'Sports', 'Workshop', 'Club'],
        allowMultiple: true,
      },
      position: { x: 0, y: 8 },
      size: { width: 12, height: 1 },
      tier: 'universal',
    },
  ],

  'find-food': [
    {
      elementId: 'dining-picker',
      instanceId: 'campus-dining',
      config: {
        title: "What Should I Eat?",
        showRecommendation: true,
        showFilters: true,
        maxItems: 8,
        sortBy: 'closing-soon',
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 8 },
      tier: 'connected',
    },
  ],

  'find-study-spot': [
    {
      elementId: 'study-spot-finder',
      instanceId: 'study-spots',
      config: {
        title: "Find a Study Spot",
        showRecommendation: true,
        showFilters: true,
        maxItems: 8,
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 8 },
      tier: 'connected',
    },
  ],

  // App-level intent compositions (multi-element)
  'photo-challenge': [
    {
      elementId: 'countdown-timer',
      instanceId: 'deadline',
      config: { title: 'Submissions Close In', style: 'compact' },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'photo-gallery',
      instanceId: 'gallery',
      config: { title: 'Submissions', allowUpload: true, maxPhotos: 50, layout: 'masonry' },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 5 },
      tier: 'connected',
    },
    {
      elementId: 'poll-element',
      instanceId: 'voting',
      config: { question: 'Vote for your favorite!', options: [], showResults: true },
      position: { x: 0, y: 7 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
    {
      elementId: 'leaderboard',
      instanceId: 'winners',
      config: { title: 'Top Photos', metric: 'votes', maxEntries: 5 },
      position: { x: 0, y: 10 },
      size: { width: 12, height: 4 },
      tier: 'universal',
    },
  ],

  'attendance-tracking': [
    {
      elementId: 'rsvp-button',
      instanceId: 'checkin',
      config: { eventTitle: 'Check In Now', showAttendeeCount: true, checkInMode: true },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'connected',
    },
    {
      elementId: 'counter',
      instanceId: 'counter',
      config: { title: 'Total Check-ins Today', value: 0 },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'leaderboard',
      instanceId: 'leaderboard',
      config: { title: 'Top Attendees', metric: 'attendance points', maxEntries: 10 },
      position: { x: 0, y: 4 },
      size: { width: 12, height: 5 },
      tier: 'universal',
    },
    {
      elementId: 'chart-display',
      instanceId: 'trends',
      config: { title: 'Attendance Trends', chartType: 'line', showLegend: false },
      position: { x: 0, y: 9 },
      size: { width: 12, height: 4 },
      tier: 'universal',
    },
  ],

  'resource-management': [
    {
      elementId: 'announcement',
      instanceId: 'policies',
      config: { title: 'Resource Policies', items: [{ title: 'How to Book', content: 'Fill out the form below.' }] },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'counter',
      instanceId: 'availability',
      config: { title: 'Available Now', value: 10 },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'form-builder',
      instanceId: 'request-form',
      config: {
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Your Name' },
          { name: 'resource', type: 'text', required: true, label: 'Resource Needed' },
          { name: 'date', type: 'text', required: true, label: 'Date Needed' },
        ],
        submitLabel: 'Request Resource',
      },
      position: { x: 0, y: 4 },
      size: { width: 12, height: 5 },
      tier: 'universal',
    },
    {
      elementId: 'result-list',
      instanceId: 'reservations',
      config: { title: 'Current Reservations', itemsPerPage: 5 },
      position: { x: 0, y: 9 },
      size: { width: 12, height: 4 },
      tier: 'universal',
    },
  ],

  'multi-vote': [
    {
      elementId: 'announcement',
      instanceId: 'instructions',
      config: { title: 'Voting Session', items: [{ title: 'Instructions', content: 'Vote on all items below.' }] },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'countdown-timer',
      instanceId: 'deadline',
      config: { title: 'Voting Closes In', style: 'prominent' },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'poll-element',
      instanceId: 'vote1',
      config: { question: 'Vote 1: Budget Allocation', options: ['Approve', 'Reject', 'Abstain'], showResults: true },
      position: { x: 0, y: 4 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
    {
      elementId: 'poll-element',
      instanceId: 'vote2',
      config: { question: 'Vote 2: Event Planning', options: ['Approve', 'Reject', 'Abstain'], showResults: true },
      position: { x: 0, y: 7 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
    {
      elementId: 'poll-element',
      instanceId: 'vote3',
      config: { question: 'Vote 3: New Initiative', options: ['Approve', 'Reject', 'Abstain'], showResults: true },
      position: { x: 0, y: 10 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
  ],

  'event-series': [
    {
      elementId: 'countdown-timer',
      instanceId: 'next-event',
      config: { title: 'Next Event In', style: 'prominent' },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'space-events',
      instanceId: 'events',
      config: { title: 'Upcoming in This Series', maxEvents: 3, showRSVP: true },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 5 },
      tier: 'connected',
    },
    {
      elementId: 'photo-gallery',
      instanceId: 'photos',
      config: { title: 'Event Photos', allowUpload: true, layout: 'grid' },
      position: { x: 0, y: 7 },
      size: { width: 12, height: 4 },
      tier: 'connected',
    },
    {
      elementId: 'poll-element',
      instanceId: 'feedback',
      config: { question: 'What should we do next time?', options: ['Same', 'Something new', 'Special theme'] },
      position: { x: 0, y: 11 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
  ],

  'suggestion-triage': [
    {
      elementId: 'form-builder',
      instanceId: 'submit-form',
      config: {
        fields: [
          { name: 'category', type: 'select', required: true, label: 'Category', options: ['Idea', 'Feedback', 'Issue'] },
          { name: 'title', type: 'text', required: true, label: 'Title' },
          { name: 'description', type: 'textarea', required: true, label: 'Details' },
        ],
        submitLabel: 'Submit Suggestion',
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 5 },
      tier: 'universal',
    },
    {
      elementId: 'filter-selector',
      instanceId: 'status-filter',
      config: { title: 'Filter by Status', options: ['All', 'New', 'In Review', 'Planned', 'Done'] },
      position: { x: 0, y: 5 },
      size: { width: 12, height: 1 },
      tier: 'universal',
    },
    {
      elementId: 'result-list',
      instanceId: 'suggestions',
      config: { title: 'Suggestions', itemsPerPage: 5 },
      position: { x: 0, y: 6 },
      size: { width: 12, height: 4 },
      tier: 'universal',
    },
    {
      elementId: 'chart-display',
      instanceId: 'trends',
      config: { title: 'Submission Trends', chartType: 'bar', showLegend: true },
      position: { x: 0, y: 10 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
  ],

  'group-matching': [
    {
      elementId: 'form-builder',
      instanceId: 'availability-form',
      config: {
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Your Name' },
          { name: 'course', type: 'text', required: true, label: 'Course' },
          { name: 'availability', type: 'textarea', required: true, label: 'Available Times' },
        ],
        submitLabel: 'Find Study Partners',
      },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 5 },
      tier: 'universal',
    },
    {
      elementId: 'chart-display',
      instanceId: 'heatmap',
      config: { title: 'Popular Study Times', chartType: 'bar' },
      position: { x: 0, y: 5 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
    {
      elementId: 'result-list',
      instanceId: 'matches',
      config: { title: 'Potential Study Partners', itemsPerPage: 5 },
      position: { x: 0, y: 8 },
      size: { width: 12, height: 4 },
      tier: 'universal',
    },
    {
      elementId: 'member-list',
      instanceId: 'group',
      config: { title: 'My Study Group', displayMode: 'list', maxMembers: 6 },
      position: { x: 0, y: 12 },
      size: { width: 12, height: 3 },
      tier: 'connected',
    },
  ],

  'competition-goals': [
    {
      elementId: 'progress-indicator',
      instanceId: 'progress',
      config: { title: 'Progress to Goal', target: 1000, current: 0, unit: '$' },
      position: { x: 0, y: 0 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'counter',
      instanceId: 'total',
      config: { title: 'Total Raised', value: 0, prefix: '$' },
      position: { x: 0, y: 2 },
      size: { width: 12, height: 2 },
      tier: 'universal',
    },
    {
      elementId: 'leaderboard',
      instanceId: 'leaders',
      config: { title: 'Top Contributors', metric: 'contribution', maxEntries: 10, highlightTop: 3 },
      position: { x: 0, y: 4 },
      size: { width: 12, height: 5 },
      tier: 'universal',
    },
    {
      elementId: 'form-builder',
      instanceId: 'log-form',
      config: {
        fields: [
          { name: 'name', type: 'text', required: true, label: 'Your Name' },
          { name: 'amount', type: 'number', required: true, label: 'Amount' },
        ],
        submitLabel: 'Log Contribution',
      },
      position: { x: 0, y: 9 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
    {
      elementId: 'chart-display',
      instanceId: 'trends',
      config: { title: 'Daily Progress', chartType: 'line' },
      position: { x: 0, y: 12 },
      size: { width: 12, height: 3 },
      tier: 'universal',
    },
  ],
};

// Complementary elements that enhance compositions
export const COMPLEMENTARY_PAIRS: Record<Intent, Intent[]> = {
  'collect-input': ['show-results', 'visualize-data'],
  'enable-voting': ['visualize-data', 'show-results'],
  'search-filter': ['show-results', 'coordinate-people'],
  'coordinate-people': ['track-time', 'show-results'],
  'track-time': ['collect-input', 'broadcast'],
  'rank-items': ['collect-input', 'visualize-data'],
  'broadcast': ['track-time'],
  'show-results': [],
  'visualize-data': [],
  // Campus-specific - already self-contained, but can add RSVP
  'discover-events': ['coordinate-people'], // Add RSVP to events
  'find-food': [], // Self-contained
  'find-study-spot': [], // Self-contained
  // App-level intents are self-contained (already have 4+ elements)
  'photo-challenge': [], // Already complete: gallery + poll + leaderboard + timer
  'attendance-tracking': [], // Already complete: rsvp + counter + leaderboard + chart
  'resource-management': [], // Already complete: form + list + counter + announcement
  'multi-vote': [], // Already complete: multiple polls + timer + announcement
  'event-series': [], // Already complete: events + photos + poll + timer
  'suggestion-triage': [], // Already complete: form + filter + list + chart
  'group-matching': [], // Already complete: form + chart + list + members
  'competition-goals': [], // Already complete: progress + counter + leaderboard + form + chart
};

/**
 * Check if user can access a given element tier
 */
export function canAccessTier(tier: ElementTier, context?: UserContext): boolean {
  if (tier === 'universal') return true;
  if (tier === 'connected') return true; // Everyone can use connected elements
  if (tier === 'space') return context?.isSpaceLeader ?? false;
  return false;
}

/**
 * Generate logical connections between elements
 */
export function generateConnections(elements: ElementSpec[]): Connection[] {
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

/**
 * Compose elements based on detected intent
 */
export function composeElements(
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
