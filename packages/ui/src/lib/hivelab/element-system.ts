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

// Import context types for Sprint 2
import type {
  SpaceContext,
  MemberContext,
  TemporalContext,
  CapabilityContext,
  VisibilityCondition,
  ConditionGroup,
  ContextRequirements,
} from '@hive/core';

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

  // ============================================================================
  // Sprint 2: Runtime Context (Contextual Intelligence)
  // ============================================================================

  /**
   * Runtime context for data access and personalization
   * Provides space, member, and temporal information for conditional rendering
   */
  context?: {
    userId?: string;
    campusId?: string;
    spaceId?: string;      // Only set if user is a leader of this space
    isSpaceLeader?: boolean;
    // Sprint 2: Full context objects
    temporal?: TemporalContext;
    space?: SpaceContext;
    member?: MemberContext;
    capabilities?: CapabilityContext;
  };

  /**
   * Visibility conditions for conditional rendering (Sprint 2)
   * If conditions evaluate to false, the element is hidden
   */
  visibilityConditions?: VisibilityCondition[] | ConditionGroup;

  /**
   * Context requirements declaring what context fields this element needs
   */
  contextRequirements?: ContextRequirements;

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
    description: 'Data visualization charts (bar, line, pie)',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'BarChart',
    configSchema: {
      chartType: { type: 'string', default: 'bar', enum: ['bar', 'line', 'pie'] },
      title: { type: 'string', default: 'Analytics' },
      height: { type: 'number', default: 280 },
      showLegend: { type: 'boolean', default: true },
      dataKey: { type: 'string', default: 'value' },
      secondaryKey: { type: 'string', default: '' },
      data: { type: 'array', default: [] }
    },
    defaultConfig: {
      chartType: 'bar',
      title: 'Analytics',
      height: 280,
      showLegend: true,
      dataKey: 'value',
      secondaryKey: '',
      data: []
    },
    render: (props) => renderElement('chart-display', props)
  },

  {
    id: 'progress-indicator',
    name: 'Progress Indicator',
    description: 'Visual progress bar or circular indicator for tracking progress',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Loader',
    configSchema: {
      value: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      showLabel: { type: 'boolean', default: true },
      variant: { type: 'string', default: 'bar', enum: ['bar', 'circular'] },
      label: { type: 'string', default: '' },
      color: { type: 'string', default: 'primary' }
    },
    defaultConfig: {
      value: 0,
      max: 100,
      showLabel: true,
      variant: 'bar',
      label: '',
      color: 'primary'
    },
    render: (props) => renderElement('progress-indicator', props)
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

  {
    id: 'timer',
    name: 'Timer',
    description: 'Stopwatch-style timer with start/stop/reset controls',
    category: 'action',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Timer',
    configSchema: {
      label: { type: 'string', default: 'Timer' },
      showControls: { type: 'boolean', default: true },
      countUp: { type: 'boolean', default: true },
      initialSeconds: { type: 'number', default: 0 }
    },
    defaultConfig: {
      label: 'Timer',
      showControls: true,
      countUp: true,
      initialSeconds: 0
    },
    render: (props) => renderElement('timer', props)
  },

  {
    id: 'counter',
    name: 'Counter',
    description: 'Interactive counter with increment/decrement controls',
    category: 'action',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Hash',
    configSchema: {
      label: { type: 'string', default: 'Count' },
      initialValue: { type: 'number', default: 0 },
      step: { type: 'number', default: 1 },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 999 },
      showControls: { type: 'boolean', default: true }
    },
    defaultConfig: {
      label: 'Count',
      initialValue: 0,
      step: 1,
      min: 0,
      max: 999,
      showControls: true
    },
    render: (props) => renderElement('counter', props)
  },

  {
    id: 'availability-heatmap',
    name: 'Availability Heatmap',
    description: 'Visual heatmap showing member availability by time slots',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Grid3x3',
    configSchema: {
      startHour: { type: 'number', default: 8 },
      endHour: { type: 'number', default: 22 },
      timeFormat: { type: 'string', default: '12h' },
      highlightThreshold: { type: 'number', default: 0.7 }
    },
    defaultConfig: {
      startHour: 8,
      endHour: 22,
      timeFormat: '12h',
      highlightThreshold: 0.7
    },
    render: (props) => renderElement('availability-heatmap', props)
  },

  // Photo Gallery - For Event Series and general photo sharing
  {
    id: 'photo-gallery',
    name: 'Photo Gallery',
    description: 'Upload and display photos in a masonry grid with lightbox',
    category: 'display',
    tier: 'universal',
    dataSource: 'none',
    icon: 'Images',
    configSchema: {
      maxPhotos: { type: 'number', default: 50 },
      allowUpload: { type: 'boolean', default: true },
      columns: { type: 'number', default: 3 },
      showCaptions: { type: 'boolean', default: true },
      moderationEnabled: { type: 'boolean', default: false },
      allowedUploaders: { type: 'array', default: [] }, // Empty = anyone, or list of userIds
      uploadLabel: { type: 'string', default: 'Add Photo' },
      emptyMessage: { type: 'string', default: 'No photos yet. Be the first to share!' }
    },
    defaultConfig: {
      maxPhotos: 50,
      allowUpload: true,
      columns: 3,
      showCaptions: true,
      moderationEnabled: false,
      allowedUploaders: [],
      uploadLabel: 'Add Photo',
      emptyMessage: 'No photos yet. Be the first to share!'
    },
    render: (props) => renderElement('photo-gallery', props)
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

  {
    id: 'personalized-event-feed',
    name: 'Personalized Event Feed',
    description: 'Events ranked by relevance based on interests, friends, and space membership',
    category: 'display',
    tier: 'connected',
    dataSource: 'campus-events',
    icon: 'Sparkles',
    configSchema: {
      timeRange: { type: 'enum', options: ['tonight', 'today', 'this-week', 'this-month'], default: 'tonight' },
      maxItems: { type: 'number', default: 8 },
      showFriendCount: { type: 'boolean', default: true },
      showMatchReasons: { type: 'boolean', default: true },
      title: { type: 'string', default: '' }
    },
    defaultConfig: {
      timeRange: 'tonight',
      maxItems: 8,
      showFriendCount: true,
      showMatchReasons: true,
      title: ''
    },
    render: (props) => renderElement('personalized-event-feed', props)
  },

  {
    id: 'dining-picker',
    name: 'Dining Picker',
    description: 'Browse campus dining locations with real-time status and recommendations',
    category: 'display',
    tier: 'connected',
    dataSource: 'campus-events', // Using campus data
    icon: 'BuildingStorefront',
    configSchema: {
      title: { type: 'string', default: 'Campus Dining' },
      showRecommendation: { type: 'boolean', default: true },
      showFilters: { type: 'boolean', default: true },
      maxItems: { type: 'number', default: 8 },
      sortBy: { type: 'enum', options: ['name', 'distance', 'closing-soon'], default: 'closing-soon' }
    },
    defaultConfig: {
      title: 'Campus Dining',
      showRecommendation: true,
      showFilters: true,
      maxItems: 8,
      sortBy: 'closing-soon'
    },
    render: (props) => renderElement('dining-picker', props)
  },

  {
    id: 'study-spot-finder',
    name: 'Study Spot Finder',
    description: 'Find the perfect study spot based on noise level, power outlets, and distance',
    category: 'display',
    tier: 'connected',
    dataSource: 'campus-events', // Using campus data
    icon: 'BookOpen',
    configSchema: {
      title: { type: 'string', default: 'Find a Study Spot' },
      showFilters: { type: 'boolean', default: true },
      showRecommendation: { type: 'boolean', default: true },
      defaultNoiseLevel: { type: 'enum', options: ['silent', 'quiet', 'moderate', 'social'], default: null },
      defaultNeedsPower: { type: 'boolean', default: false },
      maxItems: { type: 'number', default: 8 }
    },
    defaultConfig: {
      title: 'Find a Study Spot',
      showFilters: true,
      showRecommendation: true,
      defaultNoiseLevel: null,
      defaultNeedsPower: false,
      maxItems: 8
    },
    render: (props) => renderElement('study-spot-finder', props)
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
  // ============================================================================
  // QUICK ACTION TEMPLATES
  // ============================================================================
  {
    id: 'quick-poll',
    name: 'Quick Poll',
    description: 'Create a poll and see live results',
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'poll-main',
        config: {
          question: 'What do you think?',
          options: ['Option A', 'Option B', 'Option C'],
          showResults: true,
          allowMultipleVotes: false
        },
        position: { x: 100, y: 100 },
        size: { width: 320, height: 280 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'poll-results',
        config: {
          chartType: 'bar',
          title: 'Results',
          height: 200,
          showLegend: false
        },
        position: { x: 460, y: 100 },
        size: { width: 320, height: 240 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'poll-main', output: 'results' },
        to: { instanceId: 'poll-results', input: 'data' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'event-rsvp',
    name: 'Event RSVP',
    description: 'Event signup with attendee list and capacity tracking',
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'rsvp-main',
        config: {
          eventName: 'My Event',
          maxAttendees: 50,
          showCount: true,
          allowWaitlist: true
        },
        position: { x: 100, y: 100 },
        size: { width: 280, height: 180 }
      },
      {
        elementId: 'counter',
        instanceId: 'attendee-count',
        config: {
          label: 'Attending',
          showControls: false
        },
        position: { x: 420, y: 100 },
        size: { width: 200, height: 120 }
      },
      {
        elementId: 'result-list',
        instanceId: 'attendee-list',
        config: {
          itemsPerPage: 10,
          showPagination: true,
          cardStyle: 'compact'
        },
        position: { x: 100, y: 320 },
        size: { width: 520, height: 300 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'rsvp-main', output: 'attendeeCount' },
        to: { instanceId: 'attendee-count', input: 'value' }
      },
      {
        from: { instanceId: 'rsvp-main', output: 'attendeeList' },
        to: { instanceId: 'attendee-list', input: 'items' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'weekly-checkin',
    name: 'Weekly Check-in',
    description: 'Team mood check and weekly reflection',
    elements: [
      {
        elementId: 'poll-element',
        instanceId: 'mood-poll',
        config: {
          question: 'How was your week?',
          options: ['Great', 'Good', 'Okay', 'Tough'],
          showResults: true,
          anonymousVoting: true
        },
        position: { x: 100, y: 100 },
        size: { width: 300, height: 240 }
      },
      {
        elementId: 'form-builder',
        instanceId: 'reflection-form',
        config: {
          fields: [
            { name: 'wins', type: 'textarea', label: 'What went well?', required: false },
            { name: 'challenges', type: 'textarea', label: 'Any challenges?', required: false },
            { name: 'goals', type: 'textarea', label: 'Goals for next week?', required: false }
          ],
          validateOnChange: false
        },
        position: { x: 440, y: 100 },
        size: { width: 340, height: 320 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'mood-trends',
        config: {
          chartType: 'line',
          title: 'Team Mood Over Time',
          height: 180,
          showLegend: true
        },
        position: { x: 100, y: 380 },
        size: { width: 680, height: 220 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'mood-poll', output: 'results' },
        to: { instanceId: 'mood-trends', input: 'data' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'competition-leaderboard',
    name: 'Competition Leaderboard',
    description: 'Track scores and rankings for competitions',
    elements: [
      {
        elementId: 'leaderboard',
        instanceId: 'main-board',
        config: {
          maxEntries: 10,
          showRank: true,
          showScore: true,
          scoreLabel: 'Points',
          highlightTop: 3
        },
        position: { x: 100, y: 100 },
        size: { width: 360, height: 400 }
      },
      {
        elementId: 'counter',
        instanceId: 'score-input',
        config: {
          label: 'Add Points',
          step: 10,
          min: 0,
          max: 1000,
          showControls: true
        },
        position: { x: 500, y: 100 },
        size: { width: 220, height: 140 }
      },
      {
        elementId: 'user-selector',
        instanceId: 'player-select',
        config: {
          allowMultiple: false,
          showAvatars: true
        },
        position: { x: 500, y: 280 },
        size: { width: 220, height: 160 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'score-input', output: 'value' },
        to: { instanceId: 'main-board', input: 'scoreUpdate' }
      },
      {
        from: { instanceId: 'player-select', output: 'selected' },
        to: { instanceId: 'main-board', input: 'targetPlayer' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    description: 'Find the best time for everyone to meet',
    elements: [
      {
        elementId: 'availability-heatmap',
        instanceId: 'availability-grid',
        config: {
          startHour: 9,
          endHour: 18,
          timeFormat: '12h',
          highlightThreshold: 0.7
        },
        position: { x: 100, y: 100 },
        size: { width: 500, height: 340 }
      },
      {
        elementId: 'date-picker',
        instanceId: 'date-select',
        config: {
          includeTime: false,
          allowRange: true
        },
        position: { x: 640, y: 100 },
        size: { width: 240, height: 200 }
      },
      {
        elementId: 'user-selector',
        instanceId: 'attendee-select',
        config: {
          allowMultiple: true,
          showAvatars: true
        },
        position: { x: 640, y: 340 },
        size: { width: 240, height: 180 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'date-select', output: 'selectedDates' },
        to: { instanceId: 'availability-grid', input: 'dateRange' }
      },
      {
        from: { instanceId: 'attendee-select', output: 'selectedUsers' },
        to: { instanceId: 'availability-grid', input: 'participants' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'feedback-form',
    name: 'Feedback Form',
    description: 'Collect and visualize feedback',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'feedback-input',
        config: {
          fields: [
            { name: 'rating', type: 'rating', label: 'Overall Rating', required: true },
            { name: 'liked', type: 'textarea', label: 'What did you like?', required: false },
            { name: 'improve', type: 'textarea', label: 'What could be improved?', required: false },
            { name: 'recommend', type: 'select', label: 'Would you recommend?', options: ['Yes', 'Maybe', 'No'], required: true }
          ],
          showProgress: true
        },
        position: { x: 100, y: 100 },
        size: { width: 380, height: 380 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'rating-chart',
        config: {
          chartType: 'bar',
          title: 'Ratings Distribution',
          height: 180,
          showLegend: false
        },
        position: { x: 520, y: 100 },
        size: { width: 320, height: 220 }
      },
      {
        elementId: 'counter',
        instanceId: 'response-count',
        config: {
          label: 'Responses',
          showControls: false
        },
        position: { x: 520, y: 360 },
        size: { width: 160, height: 100 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'feedback-input', output: 'submissions' },
        to: { instanceId: 'rating-chart', input: 'data' }
      },
      {
        from: { instanceId: 'feedback-input', output: 'submissionCount' },
        to: { instanceId: 'response-count', input: 'value' }
      }
    ],
    layout: 'flow'
  },

  {
    id: 'study-timer',
    name: 'Study Timer',
    description: 'Pomodoro-style study timer with session tracking',
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: 'pomodoro-timer',
        config: {
          seconds: 1500, // 25 minutes
          label: 'Focus Time',
          showDays: false
        },
        position: { x: 100, y: 100 },
        size: { width: 280, height: 200 }
      },
      {
        elementId: 'counter',
        instanceId: 'session-count',
        config: {
          label: 'Sessions Completed',
          initialValue: 0,
          step: 1,
          min: 0,
          max: 99,
          showControls: false
        },
        position: { x: 420, y: 100 },
        size: { width: 200, height: 120 }
      },
      {
        elementId: 'timer',
        instanceId: 'total-time',
        config: {
          label: 'Total Study Time',
          countUp: true,
          showControls: false
        },
        position: { x: 420, y: 260 },
        size: { width: 200, height: 120 }
      },
      {
        elementId: 'chart-display',
        instanceId: 'study-chart',
        config: {
          chartType: 'bar',
          title: 'This Week',
          height: 160,
          showLegend: false
        },
        position: { x: 100, y: 340 },
        size: { width: 520, height: 200 }
      }
    ],
    connections: [
      {
        from: { instanceId: 'pomodoro-timer', output: 'complete' },
        to: { instanceId: 'session-count', input: 'increment' }
      },
      {
        from: { instanceId: 'session-count', output: 'value' },
        to: { instanceId: 'study-chart', input: 'todayValue' }
      }
    ],
    layout: 'flow'
  },

  // ============================================================================
  // ORIGINAL TEMPLATES (PRESERVED)
  // ============================================================================
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
