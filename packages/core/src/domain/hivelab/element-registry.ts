/**
 * HiveLab Element Registry
 *
 * Centralized registry for all HiveLab elements with their definitions,
 * default configurations, and action mappings.
 */

import type { ElementCategory, ElementDefinition } from './tool-composition.types';

// ═══════════════════════════════════════════════════════════════════
// EXTENDED TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Full element specification with runtime metadata
 */
export interface ElementSpec extends ElementDefinition {
  /** Supported actions this element can handle */
  actions: string[];

  /** Output fields this element produces */
  outputs: string[];

  /** Input fields this element consumes */
  inputs: string[];

  /** Example use cases for AI context */
  useCases: string[];

  /** Default size on canvas */
  defaultSize: { width: number; height: number };

  /** Whether this element persists state */
  stateful: boolean;

  /** Whether element supports real-time updates */
  realtime: boolean;
}

/**
 * Registry of all available elements
 */
const elementRegistry = new Map<string, ElementSpec>();

// ═══════════════════════════════════════════════════════════════════
// BUILT-IN ELEMENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Input Elements - Collect user input
 */
const INPUT_ELEMENTS: ElementSpec[] = [
  {
    id: 'search-input',
    name: 'Search Input',
    description: 'Text search input with autocomplete suggestions. Use for finding content, filtering by keywords, or querying data.',
    category: 'input',
    icon: '🔍',
    configSchema: {
      placeholder: { type: 'string', default: 'Search...' },
      showSuggestions: { type: 'boolean', default: false },
      debounceMs: { type: 'number', default: 300 },
    },
    defaultConfig: {
      placeholder: 'Search...',
      showSuggestions: false,
      debounceMs: 300,
    },
    actions: ['search', 'clear'],
    outputs: ['query', 'searchTerm'],
    inputs: [],
    useCases: ['search events', 'find users', 'filter content', 'lookup data'],
    defaultSize: { width: 280, height: 60 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'date-picker',
    name: 'Date Picker',
    description: 'Date and time selection calendar. Use for scheduling events, setting deadlines, or picking dates.',
    category: 'input',
    icon: '📅',
    configSchema: {
      mode: { type: 'string', enum: ['single', 'range'], default: 'single' },
      showTime: { type: 'boolean', default: false },
      minDate: { type: 'string', format: 'date' },
      maxDate: { type: 'string', format: 'date' },
    },
    defaultConfig: {
      mode: 'single',
      showTime: false,
    },
    actions: ['select_date', 'clear'],
    outputs: ['selectedDate', 'dateRange'],
    inputs: [],
    useCases: ['event scheduling', 'deadline picker', 'date range selection', 'availability calendar'],
    defaultSize: { width: 280, height: 140 },
    stateful: false,
    realtime: false,
  },
  {
    id: 'user-selector',
    name: 'User Selector',
    description: 'Campus user picker with search and multi-select. Use for inviting members, assigning people, or building teams.',
    category: 'input',
    icon: '👥',
    configSchema: {
      allowMultiple: { type: 'boolean', default: true },
      maxSelections: { type: 'number' },
      filterByRole: { type: 'array', items: { type: 'string' } },
      placeholder: { type: 'string', default: 'Select users...' },
    },
    defaultConfig: {
      allowMultiple: true,
      placeholder: 'Select users...',
    },
    actions: ['select', 'deselect', 'clear'],
    outputs: ['selectedUsers', 'userIds'],
    inputs: [],
    useCases: ['invite attendees', 'assign tasks', 'build team', 'select members', 'RSVP list'],
    defaultSize: { width: 280, height: 100 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Dynamic form with custom fields. Use for collecting structured data, surveys, or sign-ups.',
    category: 'input',
    icon: '📝',
    configSchema: {
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['text', 'email', 'number', 'select', 'textarea', 'checkbox'] },
            label: { type: 'string' },
            required: { type: 'boolean' },
            options: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      submitButtonText: { type: 'string', default: 'Submit' },
      showValidation: { type: 'boolean', default: true },
    },
    defaultConfig: {
      fields: [],
      submitButtonText: 'Submit',
      showValidation: true,
    },
    actions: ['submit', 'submit_form', 'validate', 'reset'],
    outputs: ['formData', 'submittedData'],
    inputs: [],
    useCases: ['event RSVP', 'feedback form', 'registration', 'survey', 'data collection'],
    defaultSize: { width: 280, height: 200 },
    stateful: true,
    realtime: false,
  },
];

/**
 * Filter Elements - Filter and categorize content
 */
const FILTER_ELEMENTS: ElementSpec[] = [
  {
    id: 'filter-selector',
    name: 'Filter Selector',
    description: 'Multi-select filter buttons with badges. Use for categorizing, tagging, or filtering by multiple criteria.',
    category: 'filter',
    icon: '🏷️',
    configSchema: {
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            count: { type: 'number' },
          },
        },
      },
      allowMultiple: { type: 'boolean', default: true },
      showCounts: { type: 'boolean', default: false },
    },
    defaultConfig: {
      options: [],
      allowMultiple: true,
      showCounts: false,
    },
    actions: ['select', 'deselect', 'clear'],
    outputs: ['selectedFilters', 'filters'],
    inputs: [],
    useCases: ['filter by category', 'select tags', 'choose preferences', 'multi-select options'],
    defaultSize: { width: 280, height: 80 },
    stateful: false,
    realtime: true,
  },
];

/**
 * Display Elements - Show data and visualizations
 */
const DISPLAY_ELEMENTS: ElementSpec[] = [
  {
    id: 'result-list',
    name: 'Result List',
    description: 'Paginated list view for displaying results. Use for showing search results, filtered items, or collections.',
    category: 'display',
    icon: '📋',
    configSchema: {
      itemsPerPage: { type: 'number', default: 10 },
      showPagination: { type: 'boolean', default: true },
    },
    defaultConfig: {
      itemsPerPage: 10,
      showPagination: true,
    },
    actions: ['refresh', 'load_more'],
    outputs: [],
    inputs: ['items'],
    useCases: ['display search results', 'show filtered items', 'list events', 'member directory'],
    defaultSize: { width: 280, height: 300 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'chart-display',
    name: 'Chart Display',
    description: 'Data visualization charts (bar, line, pie). Use for showing poll results, voting statistics, or attendance data.',
    category: 'display',
    icon: '📊',
    configSchema: {
      chartType: { type: 'string', enum: ['bar', 'line', 'pie'], required: true },
      title: { type: 'string' },
      showLegend: { type: 'boolean', default: true },
    },
    defaultConfig: {
      chartType: 'bar',
      showLegend: true,
    },
    actions: ['refresh'],
    outputs: [],
    inputs: ['data'],
    useCases: ['voting results', 'poll statistics', 'attendance tracking', 'RSVP breakdown'],
    defaultSize: { width: 320, height: 240 },
    stateful: false,
    realtime: true,
  },
];

/**
 * Action Elements - Interactive engagement
 */
const ACTION_ELEMENTS: ElementSpec[] = [
  {
    id: 'poll-element',
    name: 'Poll',
    description: 'Interactive poll with voting options and results visualization.',
    category: 'action',
    icon: '📊',
    configSchema: {
      question: { type: 'string', required: true },
      options: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        required: true,
      },
      allowMultipleVotes: { type: 'boolean', default: false },
      showResults: { type: 'boolean', default: true },
      showVoterCount: { type: 'boolean', default: true },
      closesAt: { type: 'string', format: 'date-time' },
    },
    defaultConfig: {
      question: 'What do you think?',
      options: ['Option A', 'Option B'],
      allowMultipleVotes: false,
      showResults: true,
      showVoterCount: true,
    },
    actions: ['submit', 'vote', 'submit_poll', 'get_results'],
    outputs: ['results', 'totalVotes'],
    inputs: [],
    useCases: ['quick polls', 'voting', 'decision making', 'feedback collection'],
    defaultSize: { width: 300, height: 200 },
    stateful: true,
    realtime: true,
  },
  {
    id: 'rsvp-button',
    name: 'RSVP Button',
    description: 'Event RSVP button with attendance tracking and waitlist support.',
    category: 'action',
    icon: '✅',
    configSchema: {
      eventName: { type: 'string', required: true },
      maxAttendees: { type: 'number' },
      showAttendeeCount: { type: 'boolean', default: true },
      enableWaitlist: { type: 'boolean', default: true },
      options: {
        type: 'array',
        items: { type: 'string' },
        default: ['Going', 'Maybe', 'Not Going'],
      },
    },
    defaultConfig: {
      eventName: 'Event',
      showAttendeeCount: true,
      enableWaitlist: true,
      options: ['Going', 'Maybe', 'Not Going'],
    },
    actions: ['submit', 'rsvp', 'cancel_rsvp', 'join_waitlist'],
    outputs: ['attendees', 'waitlist', 'count'],
    inputs: [],
    useCases: ['event RSVPs', 'attendance tracking', 'sign-ups', 'capacity management'],
    defaultSize: { width: 240, height: 120 },
    stateful: true,
    realtime: true,
  },
  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Visual countdown to a target date/time with milestone alerts.',
    category: 'action',
    icon: '⏱️',
    configSchema: {
      targetDate: { type: 'string', format: 'date-time', required: true },
      title: { type: 'string' },
      showDays: { type: 'boolean', default: true },
      showHours: { type: 'boolean', default: true },
      showMinutes: { type: 'boolean', default: true },
      showSeconds: { type: 'boolean', default: true },
      completedMessage: { type: 'string', default: "Time's up!" },
    },
    defaultConfig: {
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      completedMessage: "Time's up!",
    },
    actions: ['check', 'get_status', 'reset'],
    outputs: ['remaining', 'isComplete'],
    inputs: [],
    useCases: ['event countdowns', 'deadline tracking', 'launch timers', 'limited-time offers'],
    defaultSize: { width: 280, height: 140 },
    stateful: true,
    realtime: true,
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Competitive ranking display with scores and positions.',
    category: 'action',
    icon: '🏆',
    configSchema: {
      title: { type: 'string', default: 'Leaderboard' },
      maxEntries: { type: 'number', default: 10 },
      showRankChange: { type: 'boolean', default: true },
      refreshInterval: { type: 'number', default: 30000 },
    },
    defaultConfig: {
      title: 'Leaderboard',
      maxEntries: 10,
      showRankChange: true,
      refreshInterval: 30000,
    },
    actions: ['update_score', 'increment', 'refresh', 'reset'],
    outputs: ['rankings', 'topScorer'],
    inputs: ['entries'],
    useCases: ['gamification', 'competitions', 'engagement tracking', 'activity rankings'],
    defaultSize: { width: 280, height: 320 },
    stateful: true,
    realtime: true,
  },
  {
    id: 'counter',
    name: 'Counter',
    description: 'Simple increment/decrement counter with optional limits.',
    category: 'action',
    icon: '🔢',
    configSchema: {
      initialValue: { type: 'number', default: 0 },
      minValue: { type: 'number' },
      maxValue: { type: 'number' },
      step: { type: 'number', default: 1 },
      label: { type: 'string' },
    },
    defaultConfig: {
      initialValue: 0,
      step: 1,
    },
    actions: ['update', 'update_counter', 'increment', 'decrement', 'reset'],
    outputs: ['value'],
    inputs: [],
    useCases: ['attendance tracking', 'inventory', 'click counters', 'progress tracking'],
    defaultSize: { width: 160, height: 100 },
    stateful: true,
    realtime: true,
  },
  {
    id: 'timer',
    name: 'Timer',
    description: 'Stopwatch timer with start/stop/reset controls.',
    category: 'action',
    icon: '⏲️',
    configSchema: {
      autoStart: { type: 'boolean', default: false },
      showMilliseconds: { type: 'boolean', default: false },
      targetDuration: { type: 'number' },
    },
    defaultConfig: {
      autoStart: false,
      showMilliseconds: false,
    },
    actions: ['start', 'start_timer', 'stop', 'stop_timer', 'reset', 'reset_timer', 'lap'],
    outputs: ['elapsed', 'isRunning', 'laps'],
    inputs: [],
    useCases: ['time tracking', 'study sessions', 'pomodoro', 'meeting timers'],
    defaultSize: { width: 200, height: 120 },
    stateful: true,
    realtime: true,
  },
];

/**
 * Layout Elements - Structure and organization
 */
const LAYOUT_ELEMENTS: ElementSpec[] = [
  {
    id: 'role-gate',
    name: 'Role Gate',
    description: 'Show/hide content based on member role. Use for restricting access to specific features or content.',
    category: 'layout',
    icon: '🛡️',
    configSchema: {
      allowedRoles: { type: 'array', items: { type: 'string' }, default: ['admin', 'moderator'] },
      fallbackMessage: { type: 'string', default: 'This content is restricted.' },
    },
    defaultConfig: {
      allowedRoles: ['admin', 'moderator'],
      fallbackMessage: 'This content is restricted.',
    },
    actions: ['check_access'],
    outputs: ['hasAccess', 'userRole'],
    inputs: ['content'],
    useCases: ['role-based content', 'admin-only features', 'member restrictions', 'permission gating'],
    defaultSize: { width: 300, height: 150 },
    stateful: false,
    realtime: false,
  },
];

/**
 * Connected Elements - Pull from public HIVE data
 */
const CONNECTED_ELEMENTS: ElementSpec[] = [
  {
    id: 'event-picker',
    name: 'Event Picker',
    description: 'Browse and select from campus events. Use for event selection, linking, or scheduling.',
    category: 'input',
    icon: '📆',
    configSchema: {
      showPastEvents: { type: 'boolean', default: false },
      filterByCategory: { type: 'string' },
      maxEvents: { type: 'number', default: 20 },
    },
    defaultConfig: {
      showPastEvents: false,
      maxEvents: 20,
    },
    actions: ['select', 'filter', 'search'],
    outputs: ['selectedEvent', 'eventId'],
    inputs: [],
    useCases: ['event selection', 'event linking', 'calendar integration', 'RSVP tools'],
    defaultSize: { width: 300, height: 200 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'space-picker',
    name: 'Space Picker',
    description: 'Browse and select from campus spaces. Use for space selection or cross-space tools.',
    category: 'input',
    icon: '🏠',
    configSchema: {
      filterByCategory: { type: 'string' },
      showMemberCount: { type: 'boolean', default: true },
    },
    defaultConfig: {
      showMemberCount: true,
    },
    actions: ['select', 'filter', 'search'],
    outputs: ['selectedSpace', 'spaceId'],
    inputs: [],
    useCases: ['space selection', 'cross-posting', 'space directory', 'collaboration tools'],
    defaultSize: { width: 300, height: 200 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'connection-list',
    name: 'Connection List',
    description: 'Display user connections and mutual contacts. Use for networking features.',
    category: 'display',
    icon: '🔗',
    configSchema: {
      maxConnections: { type: 'number', default: 10 },
      showMutual: { type: 'boolean', default: true },
    },
    defaultConfig: {
      maxConnections: 10,
      showMutual: true,
    },
    actions: ['refresh', 'filter'],
    outputs: ['connections'],
    inputs: ['userId'],
    useCases: ['networking', 'mutual friends', 'connection suggestions', 'social features'],
    defaultSize: { width: 280, height: 300 },
    stateful: false,
    realtime: true,
  },
];

/**
 * Space Elements - Leaders only, private space data
 */
const SPACE_ELEMENTS: ElementSpec[] = [
  {
    id: 'member-list',
    name: 'Member List',
    description: 'Display space members with roles. Use for member directories and management.',
    category: 'display',
    icon: '👥',
    configSchema: {
      maxMembers: { type: 'number', default: 20 },
      showRole: { type: 'boolean', default: true },
      showJoinDate: { type: 'boolean', default: false },
    },
    defaultConfig: {
      maxMembers: 20,
      showRole: true,
      showJoinDate: false,
    },
    actions: ['refresh', 'filter', 'select'],
    outputs: ['members', 'selectedMember'],
    inputs: ['spaceId'],
    useCases: ['member directory', 'team roster', 'role management', 'attendance tracking'],
    defaultSize: { width: 280, height: 350 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'member-selector',
    name: 'Member Selector',
    description: 'Select members from your space. Use for task assignment or team selection.',
    category: 'input',
    icon: '✓👤',
    configSchema: {
      allowMultiple: { type: 'boolean', default: true },
      filterByRole: { type: 'string' },
      showAvatars: { type: 'boolean', default: true },
    },
    defaultConfig: {
      allowMultiple: true,
      showAvatars: true,
    },
    actions: ['select', 'deselect', 'clear', 'filter'],
    outputs: ['selectedMembers', 'memberIds'],
    inputs: ['spaceId'],
    useCases: ['task assignment', 'team selection', 'group messaging', 'committee formation'],
    defaultSize: { width: 280, height: 150 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'space-events',
    name: 'Space Events',
    description: 'Display events specific to your space. Use for event calendars and scheduling.',
    category: 'display',
    icon: '📅',
    configSchema: {
      showPast: { type: 'boolean', default: false },
      maxEvents: { type: 'number', default: 5 },
      showRsvpCount: { type: 'boolean', default: true },
    },
    defaultConfig: {
      showPast: false,
      maxEvents: 5,
      showRsvpCount: true,
    },
    actions: ['refresh', 'filter'],
    outputs: ['events', 'upcomingCount'],
    inputs: ['spaceId'],
    useCases: ['space calendar', 'upcoming events', 'event management', 'attendance preview'],
    defaultSize: { width: 300, height: 280 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'space-feed',
    name: 'Space Feed',
    description: 'Display recent posts from your space. Use for activity feeds and announcements.',
    category: 'display',
    icon: '📰',
    configSchema: {
      maxPosts: { type: 'number', default: 5 },
      showEngagement: { type: 'boolean', default: true },
    },
    defaultConfig: {
      maxPosts: 5,
      showEngagement: true,
    },
    actions: ['refresh', 'load_more'],
    outputs: ['posts', 'hasMore'],
    inputs: ['spaceId'],
    useCases: ['activity feed', 'announcements', 'recent posts', 'engagement tracking'],
    defaultSize: { width: 300, height: 350 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'space-stats',
    name: 'Space Stats',
    description: 'Display engagement metrics for your space. Use for analytics dashboards.',
    category: 'display',
    icon: '📈',
    configSchema: {
      metrics: { type: 'array', items: { type: 'string' }, default: ['members', 'posts', 'events'] },
      showTrends: { type: 'boolean', default: true },
    },
    defaultConfig: {
      metrics: ['members', 'posts', 'events'],
      showTrends: true,
    },
    actions: ['refresh'],
    outputs: ['stats', 'trends'],
    inputs: ['spaceId'],
    useCases: ['space analytics', 'engagement metrics', 'growth tracking', 'leader dashboard'],
    defaultSize: { width: 300, height: 200 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Create and display announcements for space members. Use for important updates.',
    category: 'action',
    icon: '📢',
    configSchema: {
      pinned: { type: 'boolean', default: false },
      sendNotification: { type: 'boolean', default: true },
      expiresAt: { type: 'string', format: 'date-time' },
    },
    defaultConfig: {
      pinned: false,
      sendNotification: true,
    },
    actions: ['create', 'pin', 'unpin', 'delete'],
    outputs: ['announcementId', 'viewCount'],
    inputs: ['content', 'spaceId'],
    useCases: ['important updates', 'pinned messages', 'member alerts', 'broadcast messages'],
    defaultSize: { width: 320, height: 180 },
    stateful: true,
    realtime: true,
  },
];

/**
 * Additional Universal Elements - Pure primitives
 */
const ADDITIONAL_UNIVERSAL_ELEMENTS: ElementSpec[] = [
  {
    id: 'tag-cloud',
    name: 'Tag Cloud',
    description: 'Visual display of tags with frequency weighting. Use for topic exploration or filtering.',
    category: 'display',
    icon: '🏷️',
    configSchema: {
      maxTags: { type: 'number', default: 50 },
      sortBy: { type: 'string', enum: ['frequency', 'alphabetical'], default: 'frequency' },
      showCounts: { type: 'boolean', default: true },
    },
    defaultConfig: {
      maxTags: 50,
      sortBy: 'frequency',
      showCounts: true,
    },
    actions: ['select', 'filter'],
    outputs: ['selectedTag', 'tags'],
    inputs: ['tags'],
    useCases: ['topic exploration', 'tag filtering', 'keyword visualization', 'content discovery'],
    defaultSize: { width: 300, height: 200 },
    stateful: false,
    realtime: false,
  },
  {
    id: 'map-view',
    name: 'Map View',
    description: 'Geographic map for location-based features. Use for event locations or campus navigation.',
    category: 'display',
    icon: '🗺️',
    configSchema: {
      defaultZoom: { type: 'number', default: 10 },
      allowMarkers: { type: 'boolean', default: true },
      showControls: { type: 'boolean', default: true },
    },
    defaultConfig: {
      defaultZoom: 10,
      allowMarkers: true,
      showControls: true,
    },
    actions: ['add_marker', 'remove_marker', 'zoom', 'pan'],
    outputs: ['selectedLocation', 'markers'],
    inputs: ['locations'],
    useCases: ['event locations', 'campus map', 'meeting points', 'location picker'],
    defaultSize: { width: 400, height: 300 },
    stateful: false,
    realtime: false,
  },
  {
    id: 'notification-center',
    name: 'Notification Center',
    description: 'Display and manage notifications. Use for alerts and updates.',
    category: 'display',
    icon: '🔔',
    configSchema: {
      maxNotifications: { type: 'number', default: 10 },
      groupByType: { type: 'boolean', default: true },
      autoMarkRead: { type: 'boolean', default: false },
    },
    defaultConfig: {
      maxNotifications: 10,
      groupByType: true,
      autoMarkRead: false,
    },
    actions: ['mark_read', 'mark_all_read', 'dismiss', 'refresh'],
    outputs: ['unreadCount', 'notifications'],
    inputs: [],
    useCases: ['notification display', 'alert center', 'update feed', 'activity alerts'],
    defaultSize: { width: 320, height: 400 },
    stateful: true,
    realtime: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// REGISTRY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Register an element in the registry
 */
export function registerElement(element: ElementSpec): void {
  elementRegistry.set(element.id, element);
}

/**
 * Get an element by ID
 */
export function getElementById(id: string): ElementSpec | undefined {
  return elementRegistry.get(id);
}

/**
 * Get all elements
 */
export function getAllElements(): ElementSpec[] {
  return Array.from(elementRegistry.values());
}

/**
 * Get elements by category
 */
export function getElementsByCategory(category: ElementCategory): ElementSpec[] {
  return getAllElements().filter((el) => el.category === category);
}

/**
 * Get elements that support a specific action
 */
export function getElementsByAction(action: string): ElementSpec[] {
  return getAllElements().filter((el) => el.actions.includes(action));
}

/**
 * Check if an element supports a specific action
 */
export function elementSupportsAction(elementId: string, action: string): boolean {
  const element = getElementById(elementId);
  return element ? element.actions.includes(action) : false;
}

/**
 * Get default config for an element
 */
export function getElementDefaultConfig(elementId: string): Record<string, unknown> {
  const element = getElementById(elementId);
  return element ? { ...element.defaultConfig } : {};
}

/**
 * Get all stateful elements
 */
export function getStatefulElements(): ElementSpec[] {
  return getAllElements().filter((el) => el.stateful);
}

/**
 * Get all real-time capable elements
 */
export function getRealtimeElements(): ElementSpec[] {
  return getAllElements().filter((el) => el.realtime);
}

/**
 * Search elements by use case or description
 */
export function searchElements(query: string): ElementSpec[] {
  const lowerQuery = query.toLowerCase();
  return getAllElements().filter(
    (el) =>
      el.name.toLowerCase().includes(lowerQuery) ||
      el.description.toLowerCase().includes(lowerQuery) ||
      el.useCases.some((uc) => uc.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Generate element catalog for AI prompts
 */
export function generateElementCatalog(): Record<string, object> {
  const catalog: Record<string, object> = {};

  for (const element of getAllElements()) {
    catalog[element.id] = {
      category: element.category,
      description: element.description,
      config: element.configSchema,
      outputs: element.outputs,
      inputs: element.inputs,
      useCases: element.useCases,
    };
  }

  return catalog;
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE REGISTRY
// ═══════════════════════════════════════════════════════════════════

// Register all built-in elements
[
  ...INPUT_ELEMENTS,
  ...FILTER_ELEMENTS,
  ...DISPLAY_ELEMENTS,
  ...ACTION_ELEMENTS,
  ...LAYOUT_ELEMENTS,
  ...CONNECTED_ELEMENTS,
  ...SPACE_ELEMENTS,
  ...ADDITIONAL_UNIVERSAL_ELEMENTS,
].forEach(registerElement);

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  INPUT_ELEMENTS,
  FILTER_ELEMENTS,
  DISPLAY_ELEMENTS,
  ACTION_ELEMENTS,
  LAYOUT_ELEMENTS,
  CONNECTED_ELEMENTS,
  SPACE_ELEMENTS,
  ADDITIONAL_UNIVERSAL_ELEMENTS,
};

/** Total count of registered elements */
export const ELEMENT_COUNT = elementRegistry.size;

/** All element IDs */
export const ELEMENT_IDS = Array.from(elementRegistry.keys());

/** Category counts - includes all element tiers */
export const CATEGORY_COUNTS: Record<ElementCategory, number> = {
  input: INPUT_ELEMENTS.length + CONNECTED_ELEMENTS.filter(e => e.category === 'input').length + SPACE_ELEMENTS.filter(e => e.category === 'input').length,
  filter: FILTER_ELEMENTS.length,
  display: DISPLAY_ELEMENTS.length + CONNECTED_ELEMENTS.filter(e => e.category === 'display').length + SPACE_ELEMENTS.filter(e => e.category === 'display').length + ADDITIONAL_UNIVERSAL_ELEMENTS.length,
  action: ACTION_ELEMENTS.length + SPACE_ELEMENTS.filter(e => e.category === 'action').length,
  layout: LAYOUT_ELEMENTS.length,
};

/** Element tier counts */
export const TIER_COUNTS = {
  universal: INPUT_ELEMENTS.length + FILTER_ELEMENTS.length + DISPLAY_ELEMENTS.length + ACTION_ELEMENTS.length + ADDITIONAL_UNIVERSAL_ELEMENTS.length,
  connected: CONNECTED_ELEMENTS.length,
  space: SPACE_ELEMENTS.length,
  layout: LAYOUT_ELEMENTS.length,
};
