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
  | 'visualize-data'     // chart, graph, metrics
  // Campus-specific intents (higher priority when detected)
  | 'discover-events'    // find events, what's happening
  | 'find-food'          // dining, eating, food decisions
  | 'find-study-spot'    // libraries, study spaces, quiet places
  // App-level intents (multi-element compositions)
  | 'photo-challenge'    // photo contest with voting and winners
  | 'attendance-tracking' // track attendance with points
  | 'resource-management' // equipment, room booking
  | 'multi-vote'         // board meetings, group decisions
  | 'event-series'       // recurring events, series management
  | 'suggestion-triage'  // feedback with filtering and trends
  | 'group-matching'     // study groups, project teams
  | 'competition-goals'; // fundraising, challenges with targets

interface DetectedIntent {
  primary: Intent;
  secondary: Intent[];
  confidence: number;
  keywords: string[];
}

// Intent signal keywords - not templates, just signals
// Campus-specific intents have bonus multiplier (2x) for stronger matching
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
  // Campus-specific intents - higher priority with richer keywords
  'discover-events': [
    'event', 'events', 'happening', 'tonight', 'today', 'this week', 'weekend',
    'party', 'parties', 'concert', 'show', 'talk', 'workshop', 'meeting',
    'go to', 'attend', 'whats happening', "what's happening", 'things to do',
    'should i go', 'fun', 'social', 'club event', 'campus event',
    'for me', 'personalized', 'recommend', 'suggested', 'friends going',
    'friends attending', 'what to do', 'bored', 'hang out', 'hangout',
    'this weekend', 'tomorrow', 'free tonight', 'activities', 'on campus',
  ],
  'find-food': [
    'eat', 'food', 'dining', 'hungry', 'lunch', 'dinner', 'breakfast', 'meal',
    'what should i eat', 'where to eat', 'dining hall', 'cafeteria', 'restaurant',
    'snack', 'coffee', 'cafe', 'grab food', 'open now', 'menu', 'vegan', 'vegetarian',
    'starving', 'craving', 'crossroads', 'c3', 'governors', 'sizzles', 'tikka',
    'moes', 'starbucks', 'tim hortons', 'hubies', 'late night food', 'quick bite',
    'decide for me', 'recommend food', 'whats good', 'what\'s good to eat',
  ],
  'find-study-spot': [
    'study', 'studying', 'library', 'quiet', 'focus', 'work', 'homework',
    'where to study', 'study spot', 'study space', 'study room', 'group study',
    'silent', 'noise', 'outlet', 'outlets', 'power', 'wifi', 'desk', 'seat',
    'lockwood', 'capen', 'silverman', 'student union', 'ellicott', 'nsc',
    'natural sciences', 'open now', 'open late', '24 hour', '24hr', '24/7',
    'good place to study', 'best study spot', 'empty spot', 'not crowded',
    'alone', 'with friends', 'group room', 'reserve room', 'reservable',
    'concentrate', 'cram', 'finals', 'midterms', 'exam', 'exam prep',
    'quiet zone', 'noisy', 'social study', 'reading room', 'computer lab',
  ],
  // App-level intents (higher complexity, 3x weight)
  'photo-challenge': [
    'photo challenge', 'photo contest', 'photo competition', 'picture contest',
    'best photo', 'photography contest', 'submit photos', 'vote on photos',
    'photo voting', 'image contest', 'snapshot challenge', 'pic of the week',
  ],
  'attendance-tracking': [
    'attendance tracker', 'track attendance', 'meeting attendance', 'check-in system',
    'attendance points', 'who showed up', 'attendance leaderboard', 'member engagement',
    'participation tracking', 'attendance record', 'sign-in sheet', 'roll call',
  ],
  'resource-management': [
    'resource signup', 'equipment checkout', 'room booking', 'borrow equipment',
    'reserve room', 'lending system', 'checkout system', 'resource booking',
    'equipment lending', 'item checkout', 'inventory management', 'asset tracking',
  ],
  'multi-vote': [
    'board vote', 'multiple votes', 'voting dashboard', 'decision board',
    'group decisions', 'multi-poll', 'several votes', 'meeting votes',
    'board meeting', 'vote on multiple', 'simultaneous voting', 'batch voting',
  ],
  'event-series': [
    'event series', 'recurring events', 'weekly meetup', 'series hub',
    'event collection', 'semester events', 'regular meetings', 'event program',
    'ongoing series', 'weekly series', 'monthly meetups', 'event lineup',
  ],
  'suggestion-triage': [
    'suggestion box', 'feedback system', 'idea box', 'feedback collection',
    'triage suggestions', 'filter feedback', 'feedback dashboard', 'ideas portal',
    'submit ideas', 'feedback tracker', 'request tracker', 'issue tracker',
  ],
  'group-matching': [
    'study group matcher', 'find study partners', 'group matching', 'partner finder',
    'team matching', 'project partners', 'match availability', 'group formation',
    'study buddy', 'pair up', 'find teammates', 'group finder',
  ],
  'competition-goals': [
    'competition tracker', 'fundraiser', 'challenge tracker', 'goal progress',
    'fundraising goal', 'donation tracker', 'competition leaderboard', 'target tracking',
    'goal tracking', 'challenge progress', 'fundraising tracker', 'donation goal',
  ],
};

// App-level intents get 3x weight for strongest matching (they're specific use cases)
const APP_INTENTS: Intent[] = [
  'photo-challenge', 'attendance-tracking', 'resource-management', 'multi-vote',
  'event-series', 'suggestion-triage', 'group-matching', 'competition-goals',
];

// Campus-specific intents get 2x weight for stronger matching
const CAMPUS_INTENTS: Intent[] = ['discover-events', 'find-food', 'find-study-spot'];

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
    // Campus-specific intents
    'discover-events': 0,
    'find-food': 0,
    'find-study-spot': 0,
    // App-level intents
    'photo-challenge': 0,
    'attendance-tracking': 0,
    'resource-management': 0,
    'multi-vote': 0,
    'event-series': 0,
    'suggestion-triage': 0,
    'group-matching': 0,
    'competition-goals': 0,
  };

  const matchedKeywords: string[] = [];

  // Score each intent based on keyword matches
  for (const [intent, keywords] of Object.entries(INTENT_SIGNALS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Base score = keyword length (longer matches = higher confidence)
        let score = keyword.length;

        // App-level intents get 3x weight (most specific, highest priority)
        if (APP_INTENTS.includes(intent as Intent)) {
          score *= 3;
        }
        // Campus-specific intents get 2x weight for stronger matching
        else if (CAMPUS_INTENTS.includes(intent as Intent)) {
          score *= 2;
        }

        scores[intent as Intent] += score;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
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
      confidence: 0.3, // Lower confidence for default fallback
      keywords: [],
    };
  }

  const maxScore = sorted[0][1];
  // Confidence formula: higher for app/campus intents (more specific)
  const isAppIntent = APP_INTENTS.includes(sorted[0][0] as Intent);
  const isCampusIntent = CAMPUS_INTENTS.includes(sorted[0][0] as Intent);
  const baseConfidence = Math.min(maxScore / 20, 1);
  // App intents get highest confidence boost, then campus intents
  const confidence = isAppIntent
    ? Math.min(baseConfidence * 1.3, 1)
    : isCampusIntent
      ? Math.min(baseConfidence * 1.2, 1)
      : baseConfidence;

  return {
    primary: sorted[0][0] as Intent,
    secondary: sorted.slice(1, 3).map(s => s[0] as Intent),
    confidence,
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
    // Campus-specific
    'discover-events': 'Event Finder',
    'find-food': 'What Should I Eat',
    'find-study-spot': 'Study Spot Finder',
    // App-level
    'photo-challenge': 'Photo Challenge',
    'attendance-tracking': 'Attendance Tracker',
    'resource-management': 'Resource Signup',
    'multi-vote': 'Multi-Poll Dashboard',
    'event-series': 'Event Series Hub',
    'suggestion-triage': 'Suggestion Box',
    'group-matching': 'Study Group Matcher',
    'competition-goals': 'Competition Tracker',
  };

  return intentNames[intent.primary];
}

function capitalize(str: string): string {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// ITERATION & REFINEMENT DETECTION
// Detect if user is asking to modify, delete, or add to existing tool
// =============================================================================

type RefinementAction = 'add' | 'modify' | 'delete';

interface RefinementRequest {
  action: RefinementAction;
  targetKeyword?: string;      // What element to target (e.g., 'poll', 'timer')
  targetElementId?: string;    // Resolved element ID if found
  change?: string;             // Type of change (e.g., 'size', 'color', 'options')
  newValue?: string | number;  // New value for the change
  confidence: number;
}

// Signals grouped by action type
const ADD_SIGNALS = ['add', 'also', 'include', 'plus', 'and also', 'with', 'need'];
const MODIFY_SIGNALS = ['change', 'modify', 'update', 'edit', 'adjust', 'make it', 'make the', 'can you make'];
const DELETE_SIGNALS = ['remove', 'delete', 'get rid of', 'take out', 'hide', 'no more'];
const SIZE_SIGNALS = ['bigger', 'larger', 'smaller', 'taller', 'shorter', 'wider'];
const QUANTITY_SIGNALS = ['more', 'less', 'fewer', 'extra'];

const ITERATION_SIGNALS = [
  ...ADD_SIGNALS,
  ...MODIFY_SIGNALS,
  ...DELETE_SIGNALS,
  'make it', 'can you', 'could you',
  ...SIZE_SIGNALS,
  ...QUANTITY_SIGNALS,
];

// Element keywords to help identify targets
const ELEMENT_KEYWORDS: Record<string, string[]> = {
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

function isIterationRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase().trim();
  return ITERATION_SIGNALS.some(signal => lower.startsWith(signal) || lower.includes(` ${signal} `));
}

/**
 * Detect refinement action from user prompt
 * Returns structured action that can be handled by the client
 */
function detectRefinement(prompt: string, existingElements: ElementSpec[] = []): RefinementRequest | null {
  const lower = prompt.toLowerCase().trim();

  // Determine action type
  let action: RefinementAction = 'add'; // Default
  let confidence = 0.5;

  // Check for delete signals (highest priority)
  if (DELETE_SIGNALS.some(s => lower.includes(s))) {
    action = 'delete';
    confidence = 0.8;
  }
  // Check for modify signals
  else if (MODIFY_SIGNALS.some(s => lower.includes(s)) ||
           SIZE_SIGNALS.some(s => lower.includes(s)) ||
           QUANTITY_SIGNALS.some(s => lower.includes(s))) {
    action = 'modify';
    confidence = 0.75;
  }
  // Check for add signals
  else if (ADD_SIGNALS.some(s => lower.includes(s))) {
    action = 'add';
    confidence = 0.7;
  }

  // Try to identify target element
  let targetKeyword: string | undefined;
  let targetElementId: string | undefined;

  // First check against existing elements
  for (const element of existingElements) {
    const keywords = ELEMENT_KEYWORDS[element.elementId] || [];
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        targetKeyword = keyword;
        targetElementId = element.instanceId;
        confidence += 0.1; // Boost confidence when we find a match
        break;
      }
    }
    if (targetElementId) break;
  }

  // If no match against existing, try general keywords
  if (!targetElementId) {
    for (const [elementId, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          targetKeyword = keyword;
          // Don't set targetElementId since it's not in existing elements
          break;
        }
      }
      if (targetKeyword) break;
    }
  }

  // Detect type of change
  let change: string | undefined;
  let newValue: string | number | undefined;

  if (SIZE_SIGNALS.some(s => lower.includes(s))) {
    change = 'size';
    if (lower.includes('bigger') || lower.includes('larger')) newValue = 'increase';
    if (lower.includes('smaller')) newValue = 'decrease';
    if (lower.includes('taller')) newValue = 'increase-height';
    if (lower.includes('shorter')) newValue = 'decrease-height';
    if (lower.includes('wider')) newValue = 'increase-width';
  }

  if (QUANTITY_SIGNALS.some(s => lower.includes(s))) {
    change = 'quantity';
    if (lower.includes('more') || lower.includes('extra')) newValue = 'increase';
    if (lower.includes('less') || lower.includes('fewer')) newValue = 'decrease';
  }

  // Extract numeric values if present (e.g., "add 3 more options")
  const numberMatch = lower.match(/\b(\d+)\b/);
  if (numberMatch && change === 'quantity') {
    newValue = parseInt(numberMatch[1], 10);
  }

  return {
    action,
    targetKeyword,
    targetElementId,
    change,
    newValue,
    confidence: Math.min(confidence, 1),
  };
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

  // Step 1: Detect intent and refinement action from prompt
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
  const refinement = isIteration ? detectRefinement(request.prompt, existingElements) : null;

  // For delete/modify actions, emit refinement chunk instead of new elements
  if (refinement && (refinement.action === 'delete' || refinement.action === 'modify')) {
    yield {
      type: 'thinking',
      data: {
        message: refinement.action === 'delete'
          ? `Removing ${refinement.targetKeyword || 'element'}...`
          : `Modifying ${refinement.targetKeyword || 'element'}...`,
        action: refinement.action,
        confidence: refinement.confidence,
      },
    };
    await delay(200);

    // Emit refinement action for client to handle
    yield {
      type: 'element' as const,
      data: {
        refinementAction: refinement.action,
        targetKeyword: refinement.targetKeyword,
        targetElementId: refinement.targetElementId,
        change: refinement.change,
        newValue: refinement.newValue,
        confidence: refinement.confidence,
        // For modify, include size delta if applicable
        sizeDelta: refinement.change === 'size' ? (
          refinement.newValue === 'increase' ? { width: 2, height: 1 } :
          refinement.newValue === 'decrease' ? { width: -2, height: -1 } :
          refinement.newValue === 'increase-height' ? { height: 2 } :
          refinement.newValue === 'decrease-height' ? { height: -1 } :
          refinement.newValue === 'increase-width' ? { width: 2 } :
          undefined
        ) : undefined,
      },
    };
    await delay(100);

    // Complete with refinement flag
    yield {
      type: 'complete',
      data: {
        toolId: `tool-${Date.now()}`,
        name: request.existingComposition?.name || 'Updated Tool',
        description: `${refinement.action === 'delete' ? 'Removed' : 'Modified'}: ${request.prompt}`,
        elementCount: refinement.action === 'delete' ? existingElements.length - 1 : existingElements.length,
        connectionCount: 0,
        intent: intent.primary,
        confidence: refinement.confidence,
        isIteration: true,
        refinementAction: refinement.action,
        targetElementId: refinement.targetElementId,
      },
    };
    return;
  }

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

export { detectIntent, composeElements, generateToolName, isIterationRequest, detectRefinement };
export type { DetectedIntent, Intent, ElementSpec, RefinementRequest, RefinementAction };
