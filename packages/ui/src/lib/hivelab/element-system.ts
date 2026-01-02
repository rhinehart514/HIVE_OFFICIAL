// HIVE Element System - Composable building blocks for tools
//
// ARCHITECTURE PRINCIPLES:
// 1. Elements are platform primitives, not "tool templates"
// 2. Anyone can CREATE anything - tiers restrict DATA ACCESS, not imagination
// 3. Like ChatGPT: describe what you want, get a composition, decide what to do with it
// 4. The system doesn't assume intent - user decides where to deploy/share
//
import * as React from 'react';
import { renderElement } from '../../components/hivelab/element-renderers';

// Element access tiers - determines what DATA an element can access
export type ElementTier =
  | 'universal'   // Everyone - no HIVE data needed
  | 'connected'   // Everyone - pulls from public HIVE data (events, spaces, users)
  | 'space';      // Leaders only - pulls from their space's private data

// Data source types for connected/space elements
export type DataSource =
  | 'none'           // Universal elements - user provides data
  | 'campus-events'  // UBLinked imported events
  | 'campus-spaces'  // Space directory
  | 'campus-users'   // User search/directory
  | 'user-connections' // Current user's connections
  | 'space-members'  // Specific space's members (leader only)
  | 'space-events'   // Specific space's events (leader only)
  | 'space-feed'     // Specific space's posts (leader only)
  | 'space-stats';   // Specific space's metrics (leader only)

/**
 * Shared state structure for aggregate data visible to all users.
 * Used for polls, RSVPs, leaderboards, etc.
 */
export interface ElementSharedState {
  /** Atomic counters (e.g., vote counts) - key format: "{instanceId}:{counterId}" */
  counters: Record<string, number>;
  /** Collections of entities - key format: "{instanceId}:{collectionName}" */
  collections: Record<string, Record<string, { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> }>>;
  /** Timeline of events */
  timeline: Array<{ id: string; type: string; timestamp: string; userId: string; action: string; data?: Record<string, unknown> }>;
  /** Computed/derived values */
  computed: Record<string, unknown>;
  /** Version for optimistic concurrency */
  version: number;
  /** Last modification timestamp */
  lastModified: string;
}

/**
 * User state for per-user data.
 * All properties optional for backward compatibility with legacy flat data.
 */
export interface ElementUserState {
  /** User's selections per element */
  selections?: Record<string, unknown>;
  /** User's participation flags per element */
  participation?: Record<string, boolean>;
  /** User's personal data */
  personal?: Record<string, unknown>;
  /** UI state (collapsed, scroll positions, etc.) */
  ui?: Record<string, unknown>;
  /** Allow additional properties for legacy/flat data */
  [key: string]: unknown;
}

export interface ElementProps {
  id: string;
  config: Record<string, any>;
  /** @deprecated Use sharedState for aggregate data, userState for per-user data */
  data?: any;
  onChange?: (data: any) => void;
  onAction?: (action: string, payload: any) => void;
  // New: context for data access
  context?: {
    userId?: string;
    campusId?: string;
    spaceId?: string;      // Only set if user is a leader of this space
    isSpaceLeader?: boolean;
  };

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Shared state visible to all users (aggregate data like vote counts, RSVP lists)
   * Read from: deployedTools/{deploymentId}/sharedState/current
   */
  sharedState?: ElementSharedState;

  /**
   * Per-user state (personal selections, participation, UI state)
   * Read from: toolStates/{deploymentId}_{userId}
   */
  userState?: ElementUserState;
}

export interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'display' | 'filter' | 'action' | 'layout';
  tier: ElementTier;           // NEW: access tier
  dataSource: DataSource;      // NEW: what data this element can pull
  icon: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  render: (props: ElementProps) => React.JSX.Element;
}

export interface ToolComposition {
  id: string;
  name: string;
  description: string;
  elements: {
    elementId: string;
    instanceId: string;
    config: Record<string, any>;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }[];
  connections: {
    from: { instanceId: string; output: string };
    to: { instanceId: string; input: string };
  }[];
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

// Core Element Registry
export class ElementRegistry {
  private static instance: ElementRegistry;
  private elements: Map<string, ElementDefinition> = new Map();

  static getInstance(): ElementRegistry {
    if (!ElementRegistry.instance) {
      ElementRegistry.instance = new ElementRegistry();
    }
    return ElementRegistry.instance;
  }

  registerElement(element: ElementDefinition) {
    this.elements.set(element.id, element);
  }

  getElement(id: string): ElementDefinition | undefined {
    return this.elements.get(id);
  }

  getElementsByCategory(category: string): ElementDefinition[] {
    return Array.from(this.elements.values()).filter(el => el.category === category);
  }

  getAllElements(): ElementDefinition[] {
    return Array.from(this.elements.values());
  }
}

// Element Execution Engine
export class ElementEngine {
  private compositions: Map<string, ToolComposition> = new Map();
  private elementStates: Map<string, any> = new Map();

  executeComposition(composition: ToolComposition) {
    // Initialize element states
    for (const element of composition.elements) {
      this.elementStates.set(element.instanceId, {});
    }

    // Process connections and data flow
    this.processDataFlow(composition);
  }

  private processDataFlow(composition: ToolComposition) {
    const processed = new Set<string>();
    const processing = new Set<string>();

    const processElement = (instanceId: string) => {
      if (processed.has(instanceId)) return;
      if (processing.has(instanceId)) {
        throw new Error(`Circular dependency detected involving ${instanceId}`);
      }

      processing.add(instanceId);

      // Find all inputs for this element
      const inputs = composition.connections.filter(conn => conn.to.instanceId === instanceId);
      
      // Process all input dependencies first
      for (const input of inputs) {
        processElement(input.from.instanceId);
      }

      // Now process this element
      const elementConfig = composition.elements.find(el => el.instanceId === instanceId);
      if (elementConfig) {
        const elementDef = ElementRegistry.getInstance().getElement(elementConfig.elementId);
        if (elementDef) {
          // Execute element logic here
        }
      }

      processing.delete(instanceId);
      processed.add(instanceId);
    };

    // Process all elements
    for (const element of composition.elements) {
      processElement(element.instanceId);
    }
  }
}

// =============================================================================
// TIER 1: UNIVERSAL ELEMENTS
// Everyone can use these. No HIVE data access required.
// These are pure primitives - user provides all data through config or forms.
// =============================================================================

const UNIVERSAL_ELEMENTS: ElementDefinition[] = [
  {
    id: 'search-input',
    name: 'Search Input',
    description: 'Text input for search queries with autocomplete',
    category: 'input',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Search',
    configSchema: {
      placeholder: { type: 'string', default: 'Search...' },
      showSuggestions: { type: 'boolean', default: true },
      debounceMs: { type: 'number', default: 300 }
    },
    defaultConfig: {
      placeholder: 'Search...',
      showSuggestions: true,
      debounceMs: 300
    },
    render: (props) => renderElement('search-input', props)
  },

  {
    id: 'filter-selector',
    name: 'Filter Selector',
    description: 'Multi-select filter with categories',
    category: 'filter',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Filter',
    configSchema: {
      options: { type: 'array', default: [] },
      allowMultiple: { type: 'boolean', default: true },
      showCounts: { type: 'boolean', default: false }
    },
    defaultConfig: {
      options: [],
      allowMultiple: true,
      showCounts: false
    },
    render: (props) => renderElement('filter-selector', props)
  },

  {
    id: 'result-list',
    name: 'Result List',
    description: 'Displays items in a list format',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'List',
    configSchema: {
      itemsPerPage: { type: 'number', default: 10 },
      showPagination: { type: 'boolean', default: true },
      cardStyle: { type: 'string', default: 'standard' }
    },
    defaultConfig: {
      itemsPerPage: 10,
      showPagination: true,
      cardStyle: 'standard'
    },
    render: (props) => renderElement('result-list', props)
  },

  {
    id: 'date-picker',
    name: 'Date Picker',
    description: 'Date and time selection component',
    category: 'input',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Calendar',
    configSchema: {
      includeTime: { type: 'boolean', default: false },
      allowRange: { type: 'boolean', default: false },
      minDate: { type: 'string', default: '' },
      maxDate: { type: 'string', default: '' }
    },
    defaultConfig: {
      includeTime: false,
      allowRange: false,
      minDate: '',
      maxDate: ''
    },
    render: (props) => renderElement('date-picker', props)
  },

  {
    id: 'tag-cloud',
    name: 'Tag Cloud',
    description: 'Visual display of tags with frequency weighting',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Tag',
    configSchema: {
      maxTags: { type: 'number', default: 50 },
      sortBy: { type: 'string', default: 'frequency' },
      showCounts: { type: 'boolean', default: true }
    },
    defaultConfig: {
      maxTags: 50,
      sortBy: 'frequency',
      showCounts: true
    },
    render: (props) => renderElement('tag-cloud', props)
  },

  {
    id: 'map-view',
    name: 'Map View',
    description: 'Geographic map for location-based features',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Map',
    configSchema: {
      defaultZoom: { type: 'number', default: 10 },
      allowMarkers: { type: 'boolean', default: true },
      showControls: { type: 'boolean', default: true }
    },
    defaultConfig: {
      defaultZoom: 10,
      allowMarkers: true,
      showControls: true
    },
    render: (props) => renderElement('map-view', props)
  },

  {
    id: 'chart-display',
    name: 'Chart Display',
    description: 'Data visualization charts',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'BarChart',
    configSchema: {
      chartType: { type: 'string', default: 'bar' },
      showLegend: { type: 'boolean', default: true },
      animate: { type: 'boolean', default: true }
    },
    defaultConfig: {
      chartType: 'bar',
      showLegend: true,
      animate: true
    },
    render: (props) => renderElement('chart-display', props)
  },

  {
    id: 'form-builder',
    name: 'Form Builder',
    description: 'Dynamic form creation and validation',
    category: 'input',
    tier: 'universal',
    dataSource: 'none',
    icon: 'FileText',
    configSchema: {
      fields: { type: 'array', default: [] },
      validateOnChange: { type: 'boolean', default: true },
      showProgress: { type: 'boolean', default: false }
    },
    defaultConfig: {
      fields: [],
      validateOnChange: true,
      showProgress: false
    },
    render: (props) => renderElement('form-builder', props)
  },

  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Live countdown to any date/time',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Timer',
    configSchema: {
      seconds: { type: 'number', default: 3600 },
      label: { type: 'string', default: 'Time Remaining' },
      showDays: { type: 'boolean', default: true },
      onComplete: { type: 'string', default: '' }
    },
    defaultConfig: {
      seconds: 3600,
      label: 'Time Remaining',
      showDays: true,
      onComplete: ''
    },
    render: (props) => renderElement('countdown-timer', props)
  },

  {
    id: 'poll-element',
    name: 'Poll / Voting',
    description: 'Create polls and collect votes from anyone',
    category: 'action',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Vote',
    configSchema: {
      question: { type: 'string', default: 'What do you think?' },
      options: { type: 'array', default: ['Option 1', 'Option 2'] },
      allowMultipleVotes: { type: 'boolean', default: false },
      showResults: { type: 'boolean', default: true },
      anonymousVoting: { type: 'boolean', default: false }
    },
    defaultConfig: {
      question: 'What do you think?',
      options: ['Option 1', 'Option 2'],
      allowMultipleVotes: false,
      showResults: true,
      anonymousVoting: false
    },
    render: (props) => renderElement('poll-element', props)
  },

  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Display ranked standings with scores',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Trophy',
    configSchema: {
      maxEntries: { type: 'number', default: 10 },
      showRank: { type: 'boolean', default: true },
      showScore: { type: 'boolean', default: true },
      scoreLabel: { type: 'string', default: 'Points' },
      highlightTop: { type: 'number', default: 3 }
    },
    defaultConfig: {
      maxEntries: 10,
      showRank: true,
      showScore: true,
      scoreLabel: 'Points',
      highlightTop: 3
    },
    render: (props) => renderElement('leaderboard', props)
  },

  {
    id: 'notification-display',
    name: 'Notification Display',
    description: 'Display notifications or alerts',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Bell',
    configSchema: {
      maxNotifications: { type: 'number', default: 10 },
      groupByType: { type: 'boolean', default: true },
      autoMarkRead: { type: 'boolean', default: false }
    },
    defaultConfig: {
      maxNotifications: 10,
      groupByType: true,
      autoMarkRead: false
    },
    render: (props) => renderElement('notification-display', props)
  },
];

// =============================================================================
// TIER 2: CONNECTED ELEMENTS
// Everyone can use these. They connect to PUBLIC HIVE data.
// Campus events, space directory, user search - all public.
// =============================================================================

const CONNECTED_ELEMENTS: ElementDefinition[] = [
  {
    id: 'event-picker',
    name: 'Event Picker',
    description: 'Browse and select from campus events',
    category: 'input',
    tier: 'connected',
    dataSource: 'campus-events',
    icon: 'CalendarDays',
    configSchema: {
      showPastEvents: { type: 'boolean', default: false },
      filterByCategory: { type: 'string', default: '' },
      maxEvents: { type: 'number', default: 20 }
    },
    defaultConfig: {
      showPastEvents: false,
      filterByCategory: '',
      maxEvents: 20
    },
    render: (props) => renderElement('event-picker', props)
  },

  {
    id: 'space-picker',
    name: 'Space Picker',
    description: 'Browse and select from campus spaces',
    category: 'input',
    tier: 'connected',
    dataSource: 'campus-spaces',
    icon: 'Building',
    configSchema: {
      filterByCategory: { type: 'string', default: '' },
      showMemberCount: { type: 'boolean', default: true }
    },
    defaultConfig: {
      filterByCategory: '',
      showMemberCount: true
    },
    render: (props) => renderElement('space-picker', props)
  },

  {
    id: 'user-selector',
    name: 'User Selector',
    description: 'Search and select campus users',
    category: 'input',
    tier: 'connected',
    dataSource: 'campus-users',
    icon: 'Users',
    configSchema: {
      allowMultiple: { type: 'boolean', default: false },
      showAvatars: { type: 'boolean', default: true }
    },
    defaultConfig: {
      allowMultiple: false,
      showAvatars: true
    },
    render: (props) => renderElement('user-selector', props)
  },

  {
    id: 'rsvp-button',
    name: 'RSVP Button',
    description: 'Event signup with capacity tracking',
    category: 'action',
    tier: 'connected',
    dataSource: 'campus-events',
    icon: 'UserPlus',
    configSchema: {
      eventName: { type: 'string', default: 'Event' },
      maxAttendees: { type: 'number', default: 100 },
      showCount: { type: 'boolean', default: true },
      requireConfirmation: { type: 'boolean', default: false },
      allowWaitlist: { type: 'boolean', default: true }
    },
    defaultConfig: {
      eventName: 'Event',
      maxAttendees: 100,
      showCount: true,
      requireConfirmation: false,
      allowWaitlist: true
    },
    render: (props) => renderElement('rsvp-button', props)
  },

  {
    id: 'connection-list',
    name: 'Connection List',
    description: 'Display your connections',
    category: 'display',
    tier: 'connected',
    dataSource: 'user-connections',
    icon: 'Network',
    configSchema: {
      maxConnections: { type: 'number', default: 10 },
      showMutual: { type: 'boolean', default: true }
    },
    defaultConfig: {
      maxConnections: 10,
      showMutual: true
    },
    render: (props) => renderElement('connection-list', props)
  },
];

// =============================================================================
// TIER 3: SPACE ELEMENTS
// Only space leaders can use these. They access PRIVATE space data.
// Members, space-specific events, feed, metrics.
// =============================================================================

const SPACE_ELEMENTS: ElementDefinition[] = [
  {
    id: 'member-list',
    name: 'Member List',
    description: 'Display your space\'s members',
    category: 'display',
    tier: 'space',
    dataSource: 'space-members',
    icon: 'UsersRound',
    configSchema: {
      maxMembers: { type: 'number', default: 20 },
      showRole: { type: 'boolean', default: true },
      showJoinDate: { type: 'boolean', default: false }
    },
    defaultConfig: {
      maxMembers: 20,
      showRole: true,
      showJoinDate: false
    },
    render: (props) => renderElement('member-list', props)
  },

  {
    id: 'member-selector',
    name: 'Member Selector',
    description: 'Select from your space\'s members',
    category: 'input',
    tier: 'space',
    dataSource: 'space-members',
    icon: 'UserCheck',
    configSchema: {
      allowMultiple: { type: 'boolean', default: true },
      filterByRole: { type: 'string', default: '' },
      showAvatars: { type: 'boolean', default: true }
    },
    defaultConfig: {
      allowMultiple: true,
      filterByRole: '',
      showAvatars: true
    },
    render: (props) => renderElement('member-selector', props)
  },

  {
    id: 'space-events',
    name: 'Space Events',
    description: 'Display your space\'s events',
    category: 'display',
    tier: 'space',
    dataSource: 'space-events',
    icon: 'CalendarRange',
    configSchema: {
      showPast: { type: 'boolean', default: false },
      maxEvents: { type: 'number', default: 5 },
      showRsvpCount: { type: 'boolean', default: true }
    },
    defaultConfig: {
      showPast: false,
      maxEvents: 5,
      showRsvpCount: true
    },
    render: (props) => renderElement('space-events', props)
  },

  {
    id: 'space-feed',
    name: 'Space Feed',
    description: 'Display your space\'s recent posts',
    category: 'display',
    tier: 'space',
    dataSource: 'space-feed',
    icon: 'Newspaper',
    configSchema: {
      maxPosts: { type: 'number', default: 5 },
      showEngagement: { type: 'boolean', default: true }
    },
    defaultConfig: {
      maxPosts: 5,
      showEngagement: true
    },
    render: (props) => renderElement('space-feed', props)
  },

  {
    id: 'space-stats',
    name: 'Space Stats',
    description: 'Display your space\'s engagement metrics',
    category: 'display',
    tier: 'space',
    dataSource: 'space-stats',
    icon: 'TrendingUp',
    configSchema: {
      metrics: { type: 'array', default: ['members', 'posts', 'events'] },
      showTrends: { type: 'boolean', default: true }
    },
    defaultConfig: {
      metrics: ['members', 'posts', 'events'],
      showTrends: true
    },
    render: (props) => renderElement('space-stats', props)
  },

  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Create announcements for your space members',
    category: 'action',
    tier: 'space',
    dataSource: 'space-members',
    icon: 'Megaphone',
    configSchema: {
      pinned: { type: 'boolean', default: false },
      sendNotification: { type: 'boolean', default: true },
      expiresAt: { type: 'string', default: '' }
    },
    defaultConfig: {
      pinned: false,
      sendNotification: true,
      expiresAt: ''
    },
    render: (props) => renderElement('announcement', props)
  },

  {
    id: 'role-gate',
    name: 'Role Gate',
    description: 'Show/hide content based on member role',
    category: 'layout',
    tier: 'space',
    dataSource: 'space-members',
    icon: 'Shield',
    configSchema: {
      allowedRoles: { type: 'array', default: ['admin', 'moderator'] },
      fallbackMessage: { type: 'string', default: 'This content is restricted.' }
    },
    defaultConfig: {
      allowedRoles: ['admin', 'moderator'],
      fallbackMessage: 'This content is restricted.'
    },
    render: (props) => renderElement('role-gate', props)
  },
];

// Combine all elements
export const CORE_ELEMENTS: ElementDefinition[] = [
  ...UNIVERSAL_ELEMENTS,
  ...CONNECTED_ELEMENTS,
  ...SPACE_ELEMENTS,
];

// =============================================================================
// ACCESS CONTROL UTILITIES
// These determine what elements a user can use based on their context.
// Key insight: This restricts DATA ACCESS, not what they can CREATE.
// =============================================================================

export interface UserContext {
  userId: string;
  campusId: string;
  isSpaceLeader: boolean;
  leadingSpaceIds?: string[]; // IDs of spaces they lead
}

/**
 * Get all elements available to a user based on their context.
 * - Everyone gets universal + connected elements
 * - Space leaders also get space elements
 */
export function getAvailableElements(context: UserContext): ElementDefinition[] {
  const available: ElementDefinition[] = [
    ...UNIVERSAL_ELEMENTS,
    ...CONNECTED_ELEMENTS,
  ];

  if (context.isSpaceLeader) {
    available.push(...SPACE_ELEMENTS);
  }

  return available;
}

/**
 * Check if a user can use a specific element.
 */
export function canUseElement(element: ElementDefinition, context: UserContext): boolean {
  if (element.tier === 'universal') return true;
  if (element.tier === 'connected') return true;
  if (element.tier === 'space') return context.isSpaceLeader;
  return false;
}

/**
 * Get elements by tier (for UI grouping).
 */
export function getElementsByTier(tier: ElementTier): ElementDefinition[] {
  switch (tier) {
    case 'universal':
      return UNIVERSAL_ELEMENTS;
    case 'connected':
      return CONNECTED_ELEMENTS;
    case 'space':
      return SPACE_ELEMENTS;
    default:
      return [];
  }
}

/**
 * Check if a tool composition is valid for a user.
 * A composition is valid if the user has access to ALL elements in it.
 */
export function canUseComposition(
  composition: ToolComposition,
  context: UserContext
): { valid: boolean; blockedElements: string[] } {
  const blockedElements: string[] = [];

  for (const instance of composition.elements) {
    const elementDef = CORE_ELEMENTS.find(e => e.id === instance.elementId);
    if (elementDef && !canUseElement(elementDef, context)) {
      blockedElements.push(elementDef.name);
    }
  }

  return {
    valid: blockedElements.length === 0,
    blockedElements,
  };
}

/**
 * Validate element data source access.
 * Returns the required context for an element to function.
 */
export function getRequiredContext(element: ElementDefinition): string[] {
  const required: string[] = ['userId', 'campusId'];

  if (element.tier === 'space') {
    required.push('spaceId');
  }

  return required;
}

// Tool Templates built from elements
export const TOOL_TEMPLATES: ToolComposition[] = [
  {
    id: 'basic-search-tool',
    name: 'Basic Search Tool',
    description: 'Simple search with filters and results',
    elements: [
      {
        elementId: 'search-input',
        instanceId: 'search-1',
        config: { placeholder: 'Search posts, people, and spaces...' },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 1 }
      },
      {
        elementId: 'filter-selector',
        instanceId: 'filter-1',
        config: { 
          options: [
            { value: 'posts', label: 'Posts' },
            { value: 'users', label: 'Users' },
            { value: 'spaces', label: 'Spaces' }
          ]
        },
        position: { x: 0, y: 1 },
        size: { width: 4, height: 2 }
      },
      {
        elementId: 'result-list',
        instanceId: 'results-1',
        config: { itemsPerPage: 20 },
        position: { x: 4, y: 1 },
        size: { width: 8, height: 6 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'search-1', output: 'query' },
        to: { instanceId: 'results-1', input: 'searchQuery' }
      },
      {
        from: { instanceId: 'filter-1', output: 'selectedFilters' },
        to: { instanceId: 'results-1', input: 'filters' }
      }
    ],
    layout: 'grid'
  },

  {
    id: 'event-manager-tool',
    name: 'Event Manager Tool',
    description: 'Create and manage events with RSVP',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'event-form',
        config: {
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea', required: false },
            { name: 'location', type: 'text', required: false }
          ]
        },
        position: { x: 0, y: 0 },
        size: { width: 6, height: 4 }
      },
      {
        elementId: 'date-picker',
        instanceId: 'date-picker',
        config: { includeTime: true, allowRange: true },
        position: { x: 6, y: 0 },
        size: { width: 6, height: 2 }
      },
      {
        elementId: 'user-selector',
        instanceId: 'invitee-selector',
        config: { allowMultiple: true, showAvatars: true },
        position: { x: 6, y: 2 },
        size: { width: 6, height: 2 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'event-form', output: 'submittedData' },
        to: { instanceId: 'notification-center', input: 'pendingNotifications' }
      },
      {
        from: { instanceId: 'date-picker', output: 'selectedDate' },
        to: { instanceId: 'event-form', input: 'date' }
      },
      {
        from: { instanceId: 'invitee-selector', output: 'selectedUsers' },
        to: { instanceId: 'event-form', input: 'invitees' }
      }
    ],
    layout: 'grid'
  },

  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Monitor performance metrics and trends',
    elements: [
      {
        elementId: 'chart-display',
        instanceId: 'chart-traffic',
        config: { chartType: 'line', showLegend: true },
        position: { x: 0, y: 0 },
        size: { width: 6, height: 3 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'chart-engagement',
        config: { chartType: 'area', showLegend: false },
        position: { x: 6, y: 0 },
        size: { width: 6, height: 3 }
      },
      {
        elementId: 'result-list',
        instanceId: 'top-performers',
        config: { itemsPerPage: 10 },
        position: { x: 0, y: 3 },
        size: { width: 12, height: 3 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'chart-traffic', output: 'data' },
        to: { instanceId: 'chart-engagement', input: 'comparisonData' }
      },
      {
        from: { instanceId: 'top-performers', output: 'selection' },
        to: { instanceId: 'chart-traffic', input: 'filter' }
      }
    ],
    layout: 'grid'
  }
];

// Initialize the registry with core elements
export function initializeElementSystem() {
  const registry = ElementRegistry.getInstance();
  const existingElements = registry.getAllElements();
  
  if (existingElements.length === 0) {
    for (const element of CORE_ELEMENTS) {
      registry.registerElement(element);
    }
  }
  
  return registry;
}
