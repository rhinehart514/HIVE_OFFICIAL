/**
 * HiveLab Element Manifest
 *
 * Single source of truth for every element's contract.
 * Used by:
 *   1. Generation system — knows what to emit and what config is required
 *   2. Eval harness — validates generation output against ground truth
 *   3. Runtime — tier checks before rendering
 *
 * If you add an element, add it here first. If it's not in the manifest,
 * the generator won't know about it and the eval will flag it.
 */

// ── Types ──────────────────────────────────────────────────────

export type ElementTier = 'T1' | 'T2' | 'T3';

export type ElementCategory = 'action' | 'display' | 'input' | 'filter' | 'layout';

export type ConnectionType = 'space' | 'event+space' | 'user' | 'campus';

export type DataSource =
  | 'none'
  | 'campus-events'
  | 'campus-spaces'
  | 'campus-users'
  | 'user-connections'
  | 'space-members'
  | 'space-events'
  | 'space-feed'
  | 'space-stats';

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'object[]' | 'string[]|string';
  description: string;
  default?: unknown;
}

export interface ElementManifest {
  elementId: string;
  name: string;
  tier: ElementTier;
  category: ElementCategory;
  dataSource: DataSource;
  requiredConfig: Record<string, ConfigField>;
  optionalConfig: Record<string, ConfigField>;
  connectionRequirements: {
    connectionType: ConnectionType;
    requiredContext: string[];
  } | null;
  executeActions: string[];
  stateShape: {
    shared: string[];
    personal: string[];
  };
  canBeStandalone: boolean;
  aliases?: string[];
}

// ── Manifest ───────────────────────────────────────────────────

export const ELEMENT_MANIFEST: ElementManifest[] = [
  // ─── T1: UNIVERSAL ACTION ELEMENTS ───────────────────────────

  {
    elementId: 'poll-element',
    name: 'Poll / Voting',
    tier: 'T1',
    category: 'action',
    dataSource: 'none',
    requiredConfig: {
      question: { type: 'string', description: 'The poll question', default: 'What do you think?' },
      options: { type: 'string[]', description: 'Answer options (min 2)', default: ['Option A', 'Option B'] },
    },
    optionalConfig: {
      allowMultipleVotes: { type: 'boolean', description: 'Allow selecting multiple options', default: false },
      showResults: { type: 'boolean', description: 'Show live results', default: true },
      showResultsBeforeVoting: { type: 'boolean', description: 'Show results before user votes', default: false },
      anonymousVoting: { type: 'boolean', description: 'Hide voter identity', default: false },
      allowChangeVote: { type: 'boolean', description: 'Allow changing vote after submission', default: false },
      deadline: { type: 'string', description: 'ISO date string for voting deadline' },
    },
    connectionRequirements: null,
    executeActions: ['vote', 'unvote'],
    stateShape: {
      shared: ['counters'],
      personal: ['selections', 'participation'],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'counter',
    name: 'Counter',
    tier: 'T1',
    category: 'action',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      label: { type: 'string', description: 'Counter label', default: 'Count' },
      initialValue: { type: 'number', description: 'Starting value', default: 0 },
      step: { type: 'number', description: 'Increment/decrement step', default: 1 },
      min: { type: 'number', description: 'Minimum value', default: 0 },
      max: { type: 'number', description: 'Maximum value', default: 999 },
      showControls: { type: 'boolean', description: 'Show +/- buttons', default: true },
    },
    connectionRequirements: null,
    executeActions: ['increment', 'decrement', 'reset'],
    stateShape: {
      shared: ['counters'],
      personal: [],
    },
    canBeStandalone: true,
    aliases: ['counter-element'],
  },

  {
    elementId: 'timer',
    name: 'Timer',
    tier: 'T1',
    category: 'action',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      label: { type: 'string', description: 'Timer label', default: 'Timer' },
      showControls: { type: 'boolean', description: 'Show start/stop/reset', default: true },
      countUp: { type: 'boolean', description: 'Count up (true) or down (false)', default: true },
      initialSeconds: { type: 'number', description: 'Starting seconds for countdown', default: 0 },
    },
    connectionRequirements: null,
    executeActions: ['start', 'stop', 'lap', 'reset'],
    stateShape: {
      shared: ['counters'],
      personal: [],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'signup-sheet',
    name: 'Signup Sheet',
    tier: 'T1',
    category: 'action',
    dataSource: 'none',
    requiredConfig: {
      slots: {
        type: 'object[]',
        description: 'Array of {label, maxSignups} slot objects',
        default: [
          { label: 'Slot 1', maxSignups: 5 },
          { label: 'Slot 2', maxSignups: 5 },
          { label: 'Slot 3', maxSignups: 5 },
        ],
      },
    },
    optionalConfig: {
      title: { type: 'string', description: 'Sheet title', default: 'Sign Up Sheet' },
      allowMultipleSignups: { type: 'boolean', description: 'Allow signing up for multiple slots', default: false },
    },
    connectionRequirements: null,
    executeActions: ['signup', 'cancel'],
    stateShape: {
      shared: ['collections'],
      personal: ['participation'],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'checklist-tracker',
    name: 'Checklist Tracker',
    tier: 'T1',
    category: 'action',
    dataSource: 'none',
    requiredConfig: {
      items: {
        type: 'string[]|string',
        description: 'Checklist items — array of strings or objects with {text, completed}',
        default: ['Item 1', 'Item 2', 'Item 3'],
      },
    },
    optionalConfig: {
      title: { type: 'string', description: 'Checklist title', default: 'Checklist' },
      allowMemberAdd: { type: 'boolean', description: 'Allow members to add items', default: false },
    },
    connectionRequirements: null,
    executeActions: ['toggle_complete', 'add_item', 'remove_item'],
    stateShape: {
      shared: ['collections'],
      personal: ['participation'],
    },
    canBeStandalone: true,
  },

  // ─── T1: UNIVERSAL DISPLAY ELEMENTS ─────────────────────────

  {
    elementId: 'countdown-timer',
    name: 'Countdown Timer',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {
      seconds: { type: 'number', description: 'Target seconds from now, OR use targetDate in config' },
    },
    optionalConfig: {
      label: { type: 'string', description: 'Display label' },
      targetDate: { type: 'string', description: 'ISO date string to count down to' },
      showDays: { type: 'boolean', description: 'Show days in display', default: true },
    },
    connectionRequirements: null,
    executeActions: ['finished'],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'leaderboard',
    name: 'Leaderboard',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      title: { type: 'string', description: 'Leaderboard title' },
      maxEntries: { type: 'number', description: 'Max entries shown', default: 10 },
      showRank: { type: 'boolean', description: 'Show rank numbers', default: true },
      showScore: { type: 'boolean', description: 'Show scores', default: true },
      scoreLabel: { type: 'string', description: 'Label for score column', default: 'Points' },
      highlightTop: { type: 'number', description: 'Highlight top N entries', default: 3 },
    },
    connectionRequirements: null,
    executeActions: ['refresh'],
    stateShape: {
      shared: ['collections'],
      personal: [],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'progress-indicator',
    name: 'Progress Indicator',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      value: { type: 'number', description: 'Current value', default: 0 },
      max: { type: 'number', description: 'Max/target value', default: 100 },
      variant: { type: 'string', description: '"bar" or "circular"', default: 'bar' },
      label: { type: 'string', description: 'Label text', default: '' },
      title: { type: 'string', description: 'Title text' },
      showLabel: { type: 'boolean', description: 'Show label', default: true },
      color: { type: 'string', description: 'Color scheme', default: 'primary' },
      unit: { type: 'string', description: 'Unit label (%, $, etc.)' },
    },
    connectionRequirements: null,
    executeActions: ['set', 'increment', 'reset'],
    stateShape: {
      shared: ['counters'],
      personal: [],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'chart-display',
    name: 'Chart Display',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {
      chartType: { type: 'string', description: '"bar", "line", or "pie"', default: 'bar' },
    },
    optionalConfig: {
      title: { type: 'string', description: 'Chart title' },
      data: { type: 'object[]', description: 'Chart data array' },
      height: { type: 'number', description: 'Chart height in px' },
      showLegend: { type: 'boolean', description: 'Show legend', default: true },
      dataKey: { type: 'string', description: 'Primary data key' },
      secondaryKey: { type: 'string', description: 'Secondary data key' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'photo-gallery',
    name: 'Photo Gallery',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      maxPhotos: { type: 'number', description: 'Max photos allowed' },
      allowUpload: { type: 'boolean', description: 'Allow user uploads', default: false },
      columns: { type: 'number', description: 'Grid columns', default: 3 },
      showCaptions: { type: 'boolean', description: 'Show captions', default: true },
      uploadLabel: { type: 'string', description: 'Upload button label' },
      emptyMessage: { type: 'string', description: 'Empty state message' },
    },
    connectionRequirements: null,
    executeActions: ['upload'],
    stateShape: { shared: ['collections'], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'directory-list',
    name: 'Directory List',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      title: { type: 'string', description: 'Directory title' },
      fields: { type: 'string[]', description: 'Fields to display' },
      entries: { type: 'object[]', description: 'Directory entries' },
      useSpaceMembers: { type: 'boolean', description: 'Pull from space members', default: false },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'qr-code-generator',
    name: 'QR Code Generator',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      url: { type: 'string', description: 'URL to encode' },
      size: { type: 'number', description: 'QR code size in px' },
      label: { type: 'string', description: 'Label below QR code' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'tag-cloud',
    name: 'Tag Cloud',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      maxTags: { type: 'number', description: 'Max tags to display' },
      sortBy: { type: 'string', description: 'Sort by frequency or alphabetical' },
      showCounts: { type: 'boolean', description: 'Show counts', default: false },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'map-view',
    name: 'Map View',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      defaultZoom: { type: 'number', description: 'Default zoom level' },
      allowMarkers: { type: 'boolean', description: 'Allow user markers', default: false },
      showControls: { type: 'boolean', description: 'Show zoom controls', default: true },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'notification-display',
    name: 'Notification Display',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      maxNotifications: { type: 'number', description: 'Max notifications shown' },
      groupByType: { type: 'boolean', description: 'Group by type', default: false },
      autoMarkRead: { type: 'boolean', description: 'Auto-mark as read', default: false },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
    aliases: ['notification-center'],
  },

  {
    elementId: 'result-list',
    name: 'Result List',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      itemsPerPage: { type: 'number', description: 'Items per page' },
      showPagination: { type: 'boolean', description: 'Show pagination', default: true },
      cardStyle: { type: 'string', description: 'Card style' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'availability-heatmap',
    name: 'Availability Heatmap',
    tier: 'T1',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      startHour: { type: 'number', description: 'Start hour (0-23)', default: 8 },
      endHour: { type: 'number', description: 'End hour (0-23)', default: 22 },
      timeFormat: { type: 'string', description: '"12h" or "24h"', default: '12h' },
      highlightThreshold: { type: 'number', description: 'Highlight threshold', default: 3 },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: ['collections'], personal: ['selections'] },
    canBeStandalone: true,
  },

  // ─── T1: UNIVERSAL INPUT ELEMENTS ───────────────────────────

  {
    elementId: 'form-builder',
    name: 'Form Builder',
    tier: 'T1',
    category: 'input',
    dataSource: 'none',
    requiredConfig: {
      fields: {
        type: 'object[]',
        description: 'Array of {name, type, label, required?, placeholder?, options?}',
        default: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'email', type: 'email', label: 'Email', required: true },
        ],
      },
    },
    optionalConfig: {
      title: { type: 'string', description: 'Form title' },
      submitLabel: { type: 'string', description: 'Submit button label' },
      submitButtonText: { type: 'string', description: 'Submit button text' },
      validateOnChange: { type: 'boolean', description: 'Validate on change', default: true },
      showProgress: { type: 'boolean', description: 'Show progress', default: false },
      allowMultipleSubmissions: { type: 'boolean', description: 'Allow multiple submissions', default: false },
    },
    connectionRequirements: null,
    executeActions: ['submit'],
    stateShape: {
      shared: ['collections'],
      personal: ['participation'],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'search-input',
    name: 'Search Input',
    tier: 'T1',
    category: 'input',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      placeholder: { type: 'string', description: 'Placeholder text' },
      showSuggestions: { type: 'boolean', description: 'Show suggestions', default: false },
      debounceMs: { type: 'number', description: 'Debounce delay in ms' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  {
    elementId: 'date-picker',
    name: 'Date Picker',
    tier: 'T1',
    category: 'input',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      includeTime: { type: 'boolean', description: 'Include time picker', default: false },
      allowRange: { type: 'boolean', description: 'Allow date range', default: false },
      minDate: { type: 'string', description: 'Min date (ISO)' },
      maxDate: { type: 'string', description: 'Max date (ISO)' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  // ─── T1: UNIVERSAL FILTER ELEMENTS ──────────────────────────

  {
    elementId: 'filter-selector',
    name: 'Filter Selector',
    tier: 'T1',
    category: 'filter',
    dataSource: 'none',
    requiredConfig: {},
    optionalConfig: {
      options: { type: 'string[]', description: 'Filter options' },
      allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: true },
      showCounts: { type: 'boolean', description: 'Show counts per option', default: false },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  // ─── T2: CONNECTED ELEMENTS ─────────────────────────────────

  {
    elementId: 'rsvp-button',
    name: 'RSVP Button',
    tier: 'T2',
    category: 'action',
    dataSource: 'campus-events',
    requiredConfig: {
      eventName: { type: 'string', description: 'Name of the event', default: 'Event' },
    },
    optionalConfig: {
      maxAttendees: { type: 'number', description: 'Max capacity', default: 100 },
      showCount: { type: 'boolean', description: 'Show attendee count', default: true },
      requireConfirmation: { type: 'boolean', description: 'Require confirmation', default: false },
      allowWaitlist: { type: 'boolean', description: 'Allow waitlist', default: true },
    },
    connectionRequirements: {
      connectionType: 'event+space',
      requiredContext: ['eventName'],
    },
    executeActions: ['rsvp', 'cancel'],
    stateShape: {
      shared: ['counters', 'collections'],
      personal: ['participation'],
    },
    canBeStandalone: true,
  },

  {
    elementId: 'event-picker',
    name: 'Event Picker',
    tier: 'T2',
    category: 'input',
    dataSource: 'campus-events',
    requiredConfig: {},
    optionalConfig: {
      showPastEvents: { type: 'boolean', description: 'Show past events', default: false },
      filterByCategory: { type: 'string', description: 'Filter by event category' },
      maxEvents: { type: 'number', description: 'Max events shown' },
    },
    connectionRequirements: {
      connectionType: 'campus',
      requiredContext: ['campusId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  {
    elementId: 'user-selector',
    name: 'User Selector',
    tier: 'T2',
    category: 'input',
    dataSource: 'campus-users',
    requiredConfig: {},
    optionalConfig: {
      allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: false },
      showAvatars: { type: 'boolean', description: 'Show user avatars', default: true },
    },
    connectionRequirements: {
      connectionType: 'campus',
      requiredContext: ['campusId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  {
    elementId: 'connection-list',
    name: 'Connection List',
    tier: 'T2',
    category: 'display',
    dataSource: 'user-connections',
    requiredConfig: {},
    optionalConfig: {
      maxConnections: { type: 'number', description: 'Max connections shown' },
      showMutual: { type: 'boolean', description: 'Show mutual connections', default: false },
    },
    connectionRequirements: {
      connectionType: 'user',
      requiredContext: ['userId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  {
    elementId: 'personalized-event-feed',
    name: 'Personalized Event Feed',
    tier: 'T2',
    category: 'display',
    dataSource: 'campus-events',
    requiredConfig: {},
    optionalConfig: {
      timeRange: { type: 'string', description: 'Time range filter' },
      maxItems: { type: 'number', description: 'Max events shown' },
      showFriendCount: { type: 'boolean', description: 'Show friend attendance', default: true },
      showMatchReasons: { type: 'boolean', description: 'Show why event matches', default: true },
      title: { type: 'string', description: 'Feed title' },
    },
    connectionRequirements: {
      connectionType: 'campus',
      requiredContext: ['campusId', 'userId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'dining-picker',
    name: 'Dining Picker',
    tier: 'T2',
    category: 'display',
    dataSource: 'campus-events',
    requiredConfig: {},
    optionalConfig: {
      title: { type: 'string', description: 'Picker title' },
      showRecommendation: { type: 'boolean', description: 'Show AI recommendation', default: true },
      showFilters: { type: 'boolean', description: 'Show filters', default: true },
      maxItems: { type: 'number', description: 'Max items shown' },
      sortBy: { type: 'string', description: 'Sort order' },
    },
    connectionRequirements: {
      connectionType: 'campus',
      requiredContext: ['campusId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  {
    elementId: 'study-spot-finder',
    name: 'Study Spot Finder',
    tier: 'T2',
    category: 'display',
    dataSource: 'campus-events',
    requiredConfig: {},
    optionalConfig: {
      title: { type: 'string', description: 'Finder title' },
      showFilters: { type: 'boolean', description: 'Show filters', default: true },
      showRecommendation: { type: 'boolean', description: 'Show recommendation', default: true },
      defaultNoiseLevel: { type: 'string', description: 'Default noise preference' },
      defaultNeedsPower: { type: 'boolean', description: 'Default power outlet pref', default: false },
      maxItems: { type: 'number', description: 'Max items shown' },
    },
    connectionRequirements: {
      connectionType: 'campus',
      requiredContext: ['campusId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },

  // ─── T3: SPACE ELEMENTS (leaders only) ──────────────────────

  {
    elementId: 'member-list',
    name: 'Member List',
    tier: 'T3',
    category: 'display',
    dataSource: 'space-members',
    requiredConfig: {},
    optionalConfig: {
      maxMembers: { type: 'number', description: 'Max members shown' },
      showRole: { type: 'boolean', description: 'Show member role', default: true },
      showJoinDate: { type: 'boolean', description: 'Show join date', default: false },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  {
    elementId: 'member-selector',
    name: 'Member Selector',
    tier: 'T3',
    category: 'input',
    dataSource: 'space-members',
    requiredConfig: {},
    optionalConfig: {
      allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: false },
      filterByRole: { type: 'string', description: 'Filter by role' },
      showAvatars: { type: 'boolean', description: 'Show avatars', default: true },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: ['selections'] },
    canBeStandalone: false,
  },

  {
    elementId: 'space-events',
    name: 'Space Events',
    tier: 'T3',
    category: 'display',
    dataSource: 'space-events',
    requiredConfig: {},
    optionalConfig: {
      showPast: { type: 'boolean', description: 'Show past events', default: false },
      maxEvents: { type: 'number', description: 'Max events shown' },
      showRsvpCount: { type: 'boolean', description: 'Show RSVP counts', default: true },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  {
    elementId: 'space-feed',
    name: 'Space Feed',
    tier: 'T3',
    category: 'display',
    dataSource: 'space-feed',
    requiredConfig: {},
    optionalConfig: {
      maxPosts: { type: 'number', description: 'Max posts shown' },
      showEngagement: { type: 'boolean', description: 'Show engagement', default: true },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  {
    elementId: 'space-stats',
    name: 'Space Stats',
    tier: 'T3',
    category: 'display',
    dataSource: 'space-stats',
    requiredConfig: {},
    optionalConfig: {
      metrics: { type: 'string[]', description: 'Metrics to show' },
      showTrends: { type: 'boolean', description: 'Show trends', default: true },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  {
    elementId: 'announcement',
    name: 'Announcement',
    tier: 'T3',
    category: 'action',
    dataSource: 'space-members',
    requiredConfig: {},
    optionalConfig: {
      pinned: { type: 'boolean', description: 'Pin announcement', default: false },
      sendNotification: { type: 'boolean', description: 'Notify members', default: true },
      expiresAt: { type: 'string', description: 'Expiration date (ISO)' },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: ['create', 'pin', 'unpin', 'delete'],
    stateShape: {
      shared: ['collections', 'timeline'],
      personal: [],
    },
    canBeStandalone: false,
  },

  {
    elementId: 'role-gate',
    name: 'Role Gate',
    tier: 'T3',
    category: 'layout',
    dataSource: 'space-members',
    requiredConfig: {
      allowedRoles: { type: 'string[]', description: 'Roles allowed to see gated content' },
    },
    optionalConfig: {
      fallbackMessage: { type: 'string', description: 'Message shown to non-authorized members' },
    },
    connectionRequirements: {
      connectionType: 'space',
      requiredContext: ['spaceId'],
    },
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: false,
  },

  // ─── CUSTOM (Phase 5, T3) ───────────────────────────────────

  {
    elementId: 'custom-block',
    name: 'Custom Block',
    tier: 'T3',
    category: 'display',
    dataSource: 'none',
    requiredConfig: {
      html: { type: 'string', description: 'HTML content for iframe' },
    },
    optionalConfig: {
      css: { type: 'string', description: 'CSS styles' },
      js: { type: 'string', description: 'JavaScript code' },
      height: { type: 'number', description: 'Frame height' },
    },
    connectionRequirements: null,
    executeActions: [],
    stateShape: { shared: [], personal: [] },
    canBeStandalone: true,
  },
];

// ── Lookup Helpers ─────────────────────────────────────────────

const _manifestMap = new Map<string, ElementManifest>();
const _aliasMap = new Map<string, string>();

for (const el of ELEMENT_MANIFEST) {
  _manifestMap.set(el.elementId, el);
  if (el.aliases) {
    for (const alias of el.aliases) {
      _aliasMap.set(alias, el.elementId);
    }
  }
}

/** Get manifest entry by elementId (resolves aliases) */
export function getElementManifest(elementId: string): ElementManifest | undefined {
  const canonical = _aliasMap.get(elementId) ?? elementId;
  return _manifestMap.get(canonical);
}

/** Get all elements for a tier */
export function getElementsByTier(tier: ElementTier): ElementManifest[] {
  return ELEMENT_MANIFEST.filter(e => e.tier === tier);
}

/** Get all standalone-capable elements */
export function getStandaloneElements(): ElementManifest[] {
  return ELEMENT_MANIFEST.filter(e => e.canBeStandalone);
}

/** Check if an element can be used without context */
export function canBeStandalone(elementId: string): boolean {
  return getElementManifest(elementId)?.canBeStandalone ?? false;
}

/** Get all element IDs the generator should know about */
export function getGeneratableElementIds(): string[] {
  return ELEMENT_MANIFEST.filter(e => e.canBeStandalone).map(e => e.elementId);
}

/** Validate that a config has all required fields for an element */
export function validateRequiredConfig(
  elementId: string,
  config: Record<string, unknown>
): { valid: boolean; missingFields: string[] } {
  const manifest = getElementManifest(elementId);
  if (!manifest) return { valid: false, missingFields: ['UNKNOWN_ELEMENT'] };

  const missing: string[] = [];
  for (const [key, field] of Object.entries(manifest.requiredConfig)) {
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      // Skip if field has a default
      if (field.default !== undefined) continue;
      missing.push(key);
    }
  }
  return { valid: missing.length === 0, missingFields: missing };
}

/** Get connection requirements for an element */
export function getConnectionRequirements(elementId: string) {
  return getElementManifest(elementId)?.connectionRequirements ?? null;
}
