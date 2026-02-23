/**
 * Element Configuration Schemas
 *
 * Defines what properties each element type has.
 * Extracted from properties-panel.tsx for reuse across editors.
 */

export interface PropertySchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'color' | 'string-array';
  label: string;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
  // For string-array type
  placeholder?: string;
  addButtonText?: string;
  emptyMessage?: string;
  maxItems?: number;
  minItems?: number;
}

// Element config schemas - defines what properties each element type has
// Complete coverage for all 27 elements
export const ELEMENT_SCHEMAS: Record<string, PropertySchema[]> = {
  // =============================================================================
  // UNIVERSAL ELEMENTS (15)
  // =============================================================================

  'search-input': [
    { key: 'placeholder', type: 'string', label: 'Placeholder', default: 'Search...' },
    { key: 'showSuggestions', type: 'boolean', label: 'Show Suggestions', default: true },
    { key: 'debounceMs', type: 'number', label: 'Debounce (ms)', default: 300, min: 0, max: 2000 },
  ],

  'filter-selector': [
    {
      key: 'filters',
      type: 'string-array',
      label: 'Filter Options',
      default: ['All', 'Category A', 'Category B'],
      placeholder: 'Add filter...',
      addButtonText: 'Add Filter',
      emptyMessage: 'Add filter options',
      minItems: 1,
      maxItems: 15,
    },
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: true },
    { key: 'showCounts', type: 'boolean', label: 'Show Counts', default: false },
  ],

  'result-list': [
    { key: 'itemsPerPage', type: 'number', label: 'Items Per Page', default: 10, min: 1, max: 100 },
    { key: 'showPagination', type: 'boolean', label: 'Show Pagination', default: true },
    { key: 'cardStyle', type: 'select', label: 'Card Style', options: ['standard', 'compact', 'detailed'], default: 'standard' },
  ],

  'date-picker': [
    { key: 'includeTime', type: 'boolean', label: 'Include Time', default: false },
    { key: 'allowRange', type: 'boolean', label: 'Allow Range', default: false },
    { key: 'minDate', type: 'string', label: 'Min Date', default: '' },
    { key: 'maxDate', type: 'string', label: 'Max Date', default: '' },
  ],

  'tag-cloud': [
    {
      key: 'tags',
      type: 'string-array',
      label: 'Tags',
      default: ['Popular', 'Trending', 'New', 'Featured'],
      placeholder: 'Add tag...',
      addButtonText: 'Add Tag',
      emptyMessage: 'Add tags',
      maxItems: 50,
    },
    { key: 'maxTags', type: 'number', label: 'Max Visible', default: 50, min: 5, max: 200 },
    { key: 'sortBy', type: 'select', label: 'Sort By', options: ['frequency', 'alphabetical', 'recent'], default: 'frequency' },
    { key: 'showCounts', type: 'boolean', label: 'Show Counts', default: true },
  ],

  'map-view': [
    { key: 'defaultZoom', type: 'number', label: 'Default Zoom', default: 10, min: 1, max: 20 },
    { key: 'allowMarkers', type: 'boolean', label: 'Allow Markers', default: true },
    { key: 'showControls', type: 'boolean', label: 'Show Controls', default: true },
  ],

  'chart-display': [
    { key: 'chartType', type: 'select', label: 'Chart Type', options: ['bar', 'line', 'pie', 'area', 'doughnut'], default: 'bar' },
    { key: 'showLegend', type: 'boolean', label: 'Show Legend', default: true },
    { key: 'animate', type: 'boolean', label: 'Animate', default: true },
  ],

  'form-builder': [
    { key: 'title', type: 'string', label: 'Form Title', default: 'Form' },
    {
      key: 'fieldLabels',
      type: 'string-array',
      label: 'Form Fields',
      default: ['Name', 'Email', 'Message'],
      placeholder: 'Add field...',
      addButtonText: 'Add Field',
      emptyMessage: 'Add form fields',
      minItems: 1,
      maxItems: 20,
    },
    { key: 'submitLabel', type: 'string', label: 'Submit Button', default: 'Submit' },
    { key: 'validateOnChange', type: 'boolean', label: 'Validate On Change', default: true },
    { key: 'showProgress', type: 'boolean', label: 'Show Progress', default: false },
  ],

  'countdown-timer': [
    { key: 'label', type: 'string', label: 'Label', default: 'Time Remaining' },
    { key: 'targetDate', type: 'string', label: 'Target Date (ISO)', default: '' },
    { key: 'showDays', type: 'boolean', label: 'Show Days', default: true },
    { key: 'onComplete', type: 'string', label: 'On Complete Action', default: '' },
  ],

  'poll-element': [
    { key: 'question', type: 'string', label: 'Question', default: 'What do you think?' },
    {
      key: 'options',
      type: 'string-array',
      label: 'Poll Options',
      default: ['Option 1', 'Option 2', 'Option 3'],
      placeholder: 'Add option...',
      addButtonText: 'Add Option',
      emptyMessage: 'Add poll options',
      minItems: 2,
      maxItems: 10,
    },
    { key: 'allowMultipleVotes', type: 'boolean', label: 'Allow Multiple Votes', default: false },
    { key: 'showResults', type: 'boolean', label: 'Show Results', default: true },
    { key: 'anonymousVoting', type: 'boolean', label: 'Anonymous Voting', default: false },
  ],

  'leaderboard': [
    { key: 'title', type: 'string', label: 'Title', default: 'Leaderboard' },
    { key: 'maxEntries', type: 'number', label: 'Max Entries', default: 10, min: 3, max: 100 },
    { key: 'showRank', type: 'boolean', label: 'Show Rank', default: true },
    { key: 'showScore', type: 'boolean', label: 'Show Score', default: true },
    { key: 'scoreLabel', type: 'string', label: 'Score Label', default: 'Points' },
    { key: 'highlightTop', type: 'number', label: 'Highlight Top N', default: 3, min: 0, max: 10 },
  ],

  'notification-display': [
    { key: 'maxNotifications', type: 'number', label: 'Max Notifications', default: 10, min: 1, max: 50 },
    { key: 'groupByType', type: 'boolean', label: 'Group By Type', default: true },
    { key: 'autoMarkRead', type: 'boolean', label: 'Auto Mark Read', default: false },
  ],

  'timer': [
    { key: 'label', type: 'string', label: 'Label', default: 'Timer' },
    { key: 'showControls', type: 'boolean', label: 'Show Controls', default: true },
    { key: 'countUp', type: 'boolean', label: 'Count Up (vs Down)', default: true },
    { key: 'initialSeconds', type: 'number', label: 'Initial Seconds', default: 0, min: 0 },
  ],

  'counter': [
    { key: 'label', type: 'string', label: 'Label', default: 'Count' },
    { key: 'initialValue', type: 'number', label: 'Initial Value', default: 0 },
    { key: 'step', type: 'number', label: 'Step', default: 1, min: 1 },
    { key: 'min', type: 'number', label: 'Min Value', default: 0 },
    { key: 'max', type: 'number', label: 'Max Value', default: 999 },
    { key: 'showControls', type: 'boolean', label: 'Show +/- Buttons', default: true },
  ],

  'availability-heatmap': [
    { key: 'startHour', type: 'number', label: 'Start Hour', default: 8, min: 0, max: 23 },
    { key: 'endHour', type: 'number', label: 'End Hour', default: 22, min: 1, max: 24 },
    { key: 'timeFormat', type: 'select', label: 'Time Format', options: ['12h', '24h'], default: '12h' },
    { key: 'highlightThreshold', type: 'number', label: 'Highlight Threshold', default: 0.7, min: 0, max: 1 },
  ],

  // =============================================================================
  // CONNECTED ELEMENTS (5)
  // =============================================================================

  'event-picker': [
    { key: 'showPastEvents', type: 'boolean', label: 'Show Past Events', default: false },
    { key: 'filterByCategory', type: 'string', label: 'Filter Category', default: '' },
    { key: 'maxEvents', type: 'number', label: 'Max Events', default: 20, min: 1, max: 100 },
  ],

  'space-picker': [
    { key: 'filterByCategory', type: 'string', label: 'Filter Category', default: '' },
    { key: 'showMemberCount', type: 'boolean', label: 'Show Member Count', default: true },
  ],

  'user-selector': [
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: false },
    { key: 'showAvatars', type: 'boolean', label: 'Show Avatars', default: true },
  ],

  'rsvp-button': [
    { key: 'eventName', type: 'string', label: 'Event Name', default: 'Event' },
    {
      key: 'responseOptions',
      type: 'string-array',
      label: 'Response Options',
      default: ['Going', 'Maybe', 'Not Going'],
      placeholder: 'Add response...',
      addButtonText: 'Add Response',
      emptyMessage: 'Add response options',
      minItems: 2,
      maxItems: 5,
    },
    { key: 'maxAttendees', type: 'number', label: 'Max Attendees', default: 100, min: 1 },
    { key: 'showCount', type: 'boolean', label: 'Show Count', default: true },
    { key: 'requireConfirmation', type: 'boolean', label: 'Require Confirmation', default: false },
    { key: 'allowWaitlist', type: 'boolean', label: 'Allow Waitlist', default: true },
  ],

  'connection-list': [
    { key: 'maxConnections', type: 'number', label: 'Max Connections', default: 10, min: 1, max: 50 },
    { key: 'showMutual', type: 'boolean', label: 'Show Mutual', default: true },
  ],

  // =============================================================================
  // SPACE ELEMENTS (7) - Leaders only
  // =============================================================================

  'member-list': [
    { key: 'maxMembers', type: 'number', label: 'Max Members', default: 20, min: 1, max: 100 },
    { key: 'showRole', type: 'boolean', label: 'Show Role', default: true },
    { key: 'showJoinDate', type: 'boolean', label: 'Show Join Date', default: false },
  ],

  'member-selector': [
    { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple', default: true },
    { key: 'filterByRole', type: 'string', label: 'Filter By Role', default: '' },
    { key: 'showAvatars', type: 'boolean', label: 'Show Avatars', default: true },
  ],

  'space-events': [
    { key: 'showPast', type: 'boolean', label: 'Show Past Events', default: false },
    { key: 'maxEvents', type: 'number', label: 'Max Events', default: 5, min: 1, max: 20 },
    { key: 'showRsvpCount', type: 'boolean', label: 'Show RSVP Count', default: true },
  ],

  'space-feed': [
    { key: 'maxPosts', type: 'number', label: 'Max Posts', default: 5, min: 1, max: 20 },
    { key: 'showEngagement', type: 'boolean', label: 'Show Engagement', default: true },
  ],

  'space-stats': [
    { key: 'showTrends', type: 'boolean', label: 'Show Trends', default: true },
  ],

  'announcement': [
    { key: 'title', type: 'string', label: 'Title', default: 'Announcement' },
    { key: 'pinned', type: 'boolean', label: 'Pinned', default: false },
    { key: 'sendNotification', type: 'boolean', label: 'Send Notification', default: true },
    { key: 'expiresAt', type: 'string', label: 'Expires At (ISO)', default: '' },
  ],

  'role-gate': [
    { key: 'fallbackMessage', type: 'string', label: 'Fallback Message', default: 'This content is restricted.' },
  ],
};
