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
    id: 'tag-cloud',
    name: 'Tag Cloud',
    description: 'Weighted tag visualization showing popular topics or categories.',
    category: 'display',
    icon: '☁️',
    configSchema: {
      maxTags: { type: 'number', default: 20 },
      minWeight: { type: 'number', default: 1 },
      colorScheme: { type: 'string', enum: ['default', 'rainbow'], default: 'default' },
    },
    defaultConfig: {
      maxTags: 20,
      minWeight: 1,
      colorScheme: 'default',
    },
    actions: ['refresh'],
    outputs: [],
    inputs: ['tags'],
    useCases: ['trending topics', 'popular tags', 'keyword visualization', 'category frequency'],
    defaultSize: { width: 280, height: 160 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'chart-display',
    name: 'Chart Display',
    description: 'Data visualization charts (bar, line, pie). Use for showing statistics, trends, or analytics.',
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
    useCases: ['analytics dashboard', 'voting results', 'poll statistics', 'attendance tracking'],
    defaultSize: { width: 320, height: 240 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'map-view',
    name: 'Map View',
    description: 'Geographic map visualization for location-based features.',
    category: 'display',
    icon: '🗺️',
    configSchema: {
      center: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
      zoom: { type: 'number', default: 15 },
      markers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            label: { type: 'string' },
          },
        },
      },
    },
    defaultConfig: {
      zoom: 15,
      markers: [],
    },
    actions: ['refresh', 'add_marker', 'remove_marker'],
    outputs: ['selectedLocation'],
    inputs: ['locations'],
    useCases: ['campus map', 'event locations', 'building finder', 'location picker'],
    defaultSize: { width: 400, height: 300 },
    stateful: false,
    realtime: true,
  },
  {
    id: 'notification-center',
    name: 'Notification Center',
    description: 'Real-time notifications feed for updates, alerts, or activity streams.',
    category: 'display',
    icon: '🔔',
    configSchema: {
      maxItems: { type: 'number', default: 20 },
      showUnreadOnly: { type: 'boolean', default: false },
      enableRealtime: { type: 'boolean', default: true },
    },
    defaultConfig: {
      maxItems: 20,
      showUnreadOnly: false,
      enableRealtime: true,
    },
    actions: ['mark_read', 'mark_all_read', 'dismiss'],
    outputs: [],
    inputs: ['notifications'],
    useCases: ['activity feed', 'updates stream', 'announcements', 'alerts'],
    defaultSize: { width: 300, height: 400 },
    stateful: true,
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
    id: 'tabs-container',
    name: 'Tabs Container',
    description: 'Tabbed interface for organizing multiple views.',
    category: 'layout',
    icon: '📑',
    configSchema: {
      tabs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            icon: { type: 'string' },
          },
        },
      },
      defaultTab: { type: 'string' },
    },
    defaultConfig: {
      tabs: [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
      ],
      defaultTab: 'tab1',
    },
    actions: ['switch_tab'],
    outputs: ['activeTab'],
    inputs: [],
    useCases: ['multi-view tools', 'organized content', 'dashboard sections'],
    defaultSize: { width: 400, height: 300 },
    stateful: false,
    realtime: false,
  },
  {
    id: 'card-container',
    name: 'Card Container',
    description: 'Styled card wrapper for grouping related elements.',
    category: 'layout',
    icon: '🗂️',
    configSchema: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      collapsible: { type: 'boolean', default: false },
      padding: { type: 'string', enum: ['none', 'sm', 'md', 'lg'], default: 'md' },
    },
    defaultConfig: {
      collapsible: false,
      padding: 'md',
    },
    actions: ['toggle_collapse'],
    outputs: ['isCollapsed'],
    inputs: [],
    useCases: ['grouped content', 'sections', 'visual hierarchy'],
    defaultSize: { width: 320, height: 200 },
    stateful: false,
    realtime: false,
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
[...INPUT_ELEMENTS, ...FILTER_ELEMENTS, ...DISPLAY_ELEMENTS, ...ACTION_ELEMENTS, ...LAYOUT_ELEMENTS].forEach(
  registerElement
);

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  INPUT_ELEMENTS,
  FILTER_ELEMENTS,
  DISPLAY_ELEMENTS,
  ACTION_ELEMENTS,
  LAYOUT_ELEMENTS,
};

/** Total count of registered elements */
export const ELEMENT_COUNT = elementRegistry.size;

/** All element IDs */
export const ELEMENT_IDS = Array.from(elementRegistry.keys());

/** Category counts */
export const CATEGORY_COUNTS: Record<ElementCategory, number> = {
  input: INPUT_ELEMENTS.length,
  filter: FILTER_ELEMENTS.length,
  display: DISPLAY_ELEMENTS.length,
  action: ACTION_ELEMENTS.length,
  layout: LAYOUT_ELEMENTS.length,
};
