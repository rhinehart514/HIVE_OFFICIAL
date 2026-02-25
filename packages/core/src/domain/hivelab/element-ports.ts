/**
 * HiveLab Element Ports - Single Source of Truth
 *
 * Centralized output and action mappings for all HiveLab elements.
 * Consolidates duplicated mappings from use-connection-cascade.ts and tool-connection-engine.ts.
 */

// ═══════════════════════════════════════════════════════════════════
// OUTPUT MAPPINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete output mappings for all element types.
 * Maps output port names to state property names.
 */
export const OUTPUT_MAPPINGS: Record<string, Record<string, string>> = {
  // ═══════════════════════════════════════════════════════════════════
  // UNIVERSAL ELEMENTS (15)
  // ═══════════════════════════════════════════════════════════════════
  'poll-element': {
    results: 'responses',
    votes: 'totalVotes',
    winner: 'topChoice',
    data: 'responses',
  },
  'form-builder': {
    submissions: 'submissions',
    data: 'lastSubmission',
    count: 'submissionCount',
    formData: 'lastSubmission',
  },
  'leaderboard': {
    entries: 'entries',
    data: 'entries',
    top: 'topEntries',
    rankings: 'entries',
  },
  'counter': {
    value: 'value',
    count: 'value',
    data: 'value',
  },
  'timer': {
    elapsed: 'elapsed',
    running: 'isRunning',
    time: 'elapsed',
    data: 'elapsed',
  },
  'countdown-timer': {
    finished: 'finished',
    complete: 'finished',
    timeLeft: 'timeLeft',
    data: 'timeLeft',
  },
  'search-input': {
    query: 'query',
    searchTerm: 'query',
    text: 'query',
    data: 'query',
  },
  'filter-selector': {
    filters: 'selectedFilters',
    selectedFilters: 'selectedFilters',
    value: 'selectedFilters',
    data: 'selectedFilters',
  },
  'result-list': {
    items: 'items',
    selection: 'selectedItem',
    selectedItem: 'selectedItem',
    data: 'items',
  },
  'date-picker': {
    date: 'selectedDate',
    selectedDate: 'selectedDate',
    value: 'selectedDate',
    data: 'selectedDate',
  },
  'tag-cloud': {
    tags: 'tags',
    selected: 'selectedTags',
    selectedTags: 'selectedTags',
    data: 'selectedTags',
  },
  'map-view': {
    location: 'selectedLocation',
    markers: 'markers',
    selectedLocation: 'selectedLocation',
    data: 'markers',
  },
  'chart-display': {
    chartData: 'chartData',
    selection: 'selectedPoint',
    selectedPoint: 'selectedPoint',
    data: 'chartData',
  },
  'notification-display': {
    notifications: 'notifications',
    count: 'notificationCount',
    data: 'notifications',
  },
  'availability-heatmap': {
    availability: 'availabilityData',
    slots: 'slots',
    suggestions: 'suggestedSlots',
    selectedSlot: 'selectedSlot',
    data: 'availabilityData',
  },
  'progress-indicator': {
    value: 'value',
    percentage: 'percentage',
    isComplete: 'isComplete',
    data: 'value',
  },

  // ═══════════════════════════════════════════════════════════════════
  // CONNECTED ELEMENTS (5)
  // ═══════════════════════════════════════════════════════════════════
  'event-picker': {
    event: 'selectedEvent',
    eventId: 'selectedEventId',
    selectedEvent: 'selectedEvent',
    events: 'events',
    data: 'selectedEvent',
  },
  'space-picker': {
    space: 'selectedSpace',
    spaceId: 'selectedSpaceId',
    selectedSpace: 'selectedSpace',
    spaces: 'spaces',
    data: 'selectedSpace',
  },
  'user-selector': {
    user: 'selectedUser',
    userId: 'selectedUserId',
    selectedUser: 'selectedUser',
    users: 'users',
    data: 'selectedUser',
  },
  'rsvp-button': {
    attendees: 'attendees',
    count: 'count',
    waitlist: 'waitlist',
    data: 'attendees',
  },
  'connection-list': {
    connections: 'connections',
    selected: 'selectedConnection',
    selectedConnection: 'selectedConnection',
    data: 'connections',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPACE ELEMENTS (7)
  // ═══════════════════════════════════════════════════════════════════
  'member-list': {
    members: 'members',
    selected: 'selectedMember',
    selectedMember: 'selectedMember',
    data: 'members',
  },
  'member-selector': {
    member: 'selectedMember',
    members: 'selectedMembers',
    userId: 'selectedMember',
    selectedMember: 'selectedMember',
    data: 'selectedMember',
  },
  'space-events': {
    events: 'events',
    upcoming: 'upcomingEvents',
    upcomingEvents: 'upcomingEvents',
    data: 'events',
  },
  'space-feed': {
    posts: 'posts',
    feed: 'posts',
    data: 'posts',
  },
  'space-stats': {
    stats: 'stats',
    metrics: 'stats',
    data: 'stats',
  },
  'announcement': {
    sent: 'announcementSent',
    recipients: 'recipients',
    data: 'announcementSent',
  },
  'role-gate': {
    allowed: 'isAllowed',
    role: 'currentRole',
    isAllowed: 'isAllowed',
    data: 'isAllowed',
  },

  // ═══════════════════════════════════════════════════════════════════
  // CAMPUS INFRASTRUCTURE ELEMENTS (4)
  // ═══════════════════════════════════════════════════════════════════
  'listing-board': {
    listings: 'listings',
    activeListings: 'activeListings',
    claimedItems: 'claimedItems',
    count: 'listingCount',
    data: 'listings',
  },
  'match-maker': {
    matches: 'matches',
    unmatchedPool: 'unmatchedPool',
    userMatches: 'userMatches',
    poolSize: 'poolSize',
    data: 'matches',
  },
  'workflow-pipeline': {
    requests: 'requests',
    queue: 'pipelineQueue',
    stageCounts: 'stageCounts',
    userRequests: 'userRequests',
    data: 'requests',
  },
  'data-table': {
    rows: 'rows',
    filteredRows: 'filteredRows',
    rowCount: 'rowCount',
    selection: 'selectedRow',
    data: 'rows',
  },
};

// ═══════════════════════════════════════════════════════════════════
// ACTION OUTPUT MAPPINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps action names to the output ports they affect.
 * Used to determine which downstream connections need to cascade.
 */
export const ACTION_OUTPUT_MAPPINGS: Record<string, Record<string, string[]>> = {
  'poll-element': {
    vote: ['results', 'votes', 'data'],
    submit: ['results', 'votes', 'data'],
  },
  'form-builder': {
    submit: ['submissions', 'data', 'count'],
  },
  'leaderboard': {
    update_score: ['entries', 'data'],
    increment: ['entries', 'data'],
  },
  'counter': {
    increment: ['value', 'data'],
    decrement: ['value', 'data'],
    update: ['value', 'data'],
  },
  'timer': {
    start: ['running', 'data'],
    stop: ['elapsed', 'time', 'data'],
    reset: ['elapsed', 'running', 'data'],
  },
  'countdown-timer': {
    start: ['timeLeft', 'data'],
    finished: ['finished', 'complete', 'data'],
  },
  'search-input': {
    search: ['query', 'data'],
    change: ['query', 'data'],
  },
  'filter-selector': {
    select: ['selectedFilters', 'data'],
    change: ['selectedFilters', 'data'],
  },
  'result-list': {
    select: ['selectedItem', 'data'],
  },
  'date-picker': {
    select: ['selectedDate', 'data'],
    change: ['selectedDate', 'data'],
  },
  'tag-cloud': {
    select: ['selectedTags', 'data'],
    toggle: ['selectedTags', 'data'],
  },
  'event-picker': {
    select: ['selectedEvent', 'data'],
    change: ['selectedEvent', 'data'],
  },
  'space-picker': {
    select: ['selectedSpace', 'data'],
    change: ['selectedSpace', 'data'],
  },
  'user-selector': {
    select: ['selectedUser', 'data'],
    change: ['selectedUser', 'data'],
  },
  'rsvp-button': {
    rsvp: ['attendees', 'count', 'data'],
    cancel_rsvp: ['attendees', 'count', 'data'],
  },
  'member-list': {
    select: ['selectedMember', 'data'],
  },
  'member-selector': {
    select: ['selectedMember', 'data'],
    change: ['selectedMember', 'data'],
  },
  'space-events': {
    select: ['selectedEvent', 'data'],
  },
  'space-feed': {
    post: ['posts', 'data'],
  },
  'announcement': {
    send: ['sent', 'recipients', 'data'],
  },
  'progress-indicator': {
    set: ['value', 'percentage', 'isComplete', 'data'],
    increment: ['value', 'percentage', 'isComplete', 'data'],
    reset: ['value', 'percentage', 'isComplete', 'data'],
  },
  'listing-board': {
    post_listing: ['listings', 'count', 'data'],
    claim_listing: ['listings', 'claimedItems', 'data'],
    unclaim: ['listings', 'claimedItems', 'data'],
    mark_done: ['listings', 'count', 'data'],
    delete_listing: ['listings', 'count', 'data'],
  },
  'match-maker': {
    submit_preferences: ['unmatchedPool', 'poolSize', 'data'],
    accept_match: ['matches', 'userMatches', 'data'],
    reject_match: ['unmatchedPool', 'poolSize', 'data'],
    rematch: ['matches', 'unmatchedPool', 'data'],
  },
  'workflow-pipeline': {
    submit: ['requests', 'queue', 'stageCounts', 'data'],
    approve: ['requests', 'queue', 'stageCounts', 'data'],
    reject: ['requests', 'queue', 'stageCounts', 'data'],
    request_changes: ['requests', 'data'],
  },
  'data-table': {
    add_row: ['rows', 'rowCount', 'data'],
    edit_row: ['rows', 'data'],
    delete_row: ['rows', 'rowCount', 'data'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract output value from element state using mappings.
 *
 * @param elementState - Current state of the element
 * @param outputName - Name of the output port to extract
 * @param elementId - Element type ID (e.g., 'poll-element')
 * @returns The extracted value or undefined
 */
export function extractOutputValue(
  elementState: Record<string, unknown>,
  outputName: string,
  elementId?: string
): unknown {
  // Direct property match takes precedence
  if (elementState[outputName] !== undefined) {
    return elementState[outputName];
  }

  // Try element-specific mapping
  if (elementId) {
    const mapping = OUTPUT_MAPPINGS[elementId];
    if (mapping && mapping[outputName]) {
      return elementState[mapping[outputName]];
    }
  }

  // Default: return entire state if 'data' output is requested
  if (outputName === 'data') {
    return elementState;
  }

  return undefined;
}

/**
 * Get outputs affected by a specific action.
 *
 * @param elementId - Element type ID
 * @param action - Action name
 * @returns Array of affected output port names
 */
export function getAffectedOutputs(elementId: string, action: string): string[] {
  const elementMappings = ACTION_OUTPUT_MAPPINGS[elementId];
  if (!elementMappings) return ['data']; // Default fallback

  const outputs = elementMappings[action];
  return outputs ?? ['data'];
}

/**
 * Check if an element has a specific output port.
 */
export function hasOutputPort(elementId: string, outputName: string): boolean {
  const mapping = OUTPUT_MAPPINGS[elementId];
  if (!mapping) return outputName === 'data'; // All elements have 'data'
  return outputName in mapping || outputName === 'data';
}

/**
 * Get all output port names for an element.
 */
export function getOutputPorts(elementId: string): string[] {
  const mapping = OUTPUT_MAPPINGS[elementId];
  if (!mapping) return ['data'];
  return [...Object.keys(mapping), 'data'].filter(
    (v, i, a) => a.indexOf(v) === i // Unique
  );
}
