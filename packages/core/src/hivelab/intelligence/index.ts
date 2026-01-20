/**
 * HiveLab Intelligence Module
 *
 * Free, rules-based intelligence for HiveLab:
 * - Element affinity (what goes well together)
 * - Smart defaults (context-aware configs)
 * - Connection suggestions (auto-wire compatible elements)
 * - Template recommendations (based on space type)
 *
 * No AI cost. Just good product design encoded in rules.
 */

// ═══════════════════════════════════════════════════════════════════
// ELEMENT AFFINITY MAP
// ═══════════════════════════════════════════════════════════════════

/**
 * Which elements work well together.
 * Used to reorder sidebar and suggest connections.
 */
export const ELEMENT_AFFINITY: Record<string, string[]> = {
  // Data collection → visualization
  'poll-element': ['chart-display', 'leaderboard', 'result-list', 'counter'],
  'form-builder': ['result-list', 'chart-display', 'counter', 'leaderboard'],
  'rsvp-button': ['countdown-timer', 'member-list', 'counter', 'space-events'],

  // Visualization elements
  'chart-display': ['poll-element', 'form-builder', 'counter', 'leaderboard'],
  'leaderboard': ['poll-element', 'counter', 'chart-display', 'member-list'],
  'result-list': ['form-builder', 'poll-element', 'filter-selector', 'search-input'],

  // Time-based
  'countdown-timer': ['rsvp-button', 'announcement', 'space-events'],
  'timer': ['counter', 'leaderboard', 'announcement'],

  // Display elements
  'announcement': ['countdown-timer', 'space-events', 'member-list'],
  'member-list': ['leaderboard', 'rsvp-button', 'space-stats'],
  'space-events': ['rsvp-button', 'countdown-timer', 'announcement'],
  'space-stats': ['member-list', 'chart-display', 'leaderboard'],

  // Input elements
  'search-input': ['result-list', 'filter-selector', 'member-list'],
  'filter-selector': ['result-list', 'search-input', 'chart-display'],
  'date-picker': ['rsvp-button', 'countdown-timer', 'form-builder'],

  // Counter/progress
  'counter': ['leaderboard', 'chart-display', 'progress-indicator'],
  'progress-indicator': ['counter', 'announcement', 'leaderboard'],
};

/**
 * Get recommended elements based on what's already on canvas
 */
export function getRecommendedElements(existingElements: string[]): string[] {
  const recommendations = new Set<string>();

  for (const element of existingElements) {
    const affine = ELEMENT_AFFINITY[element] || [];
    for (const rec of affine) {
      if (!existingElements.includes(rec)) {
        recommendations.add(rec);
      }
    }
  }

  return Array.from(recommendations);
}

// ═══════════════════════════════════════════════════════════════════
// CONNECTION SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Valid connections between element ports.
 * Format: "elementType.outputPort" → ["elementType.inputPort", ...]
 */
export const CONNECTION_MAP: Record<string, string[]> = {
  // Poll outputs
  'poll-element.results': ['chart-display.data', 'leaderboard.entries', 'result-list.items'],
  'poll-element.totalVotes': ['counter.value'],

  // Form outputs
  'form-builder.submissions': ['result-list.items', 'chart-display.data'],
  'form-builder.submissionCount': ['counter.value'],

  // RSVP outputs
  'rsvp-button.attendees': ['member-list.members', 'counter.value', 'leaderboard.entries'],
  'rsvp-button.attendeeCount': ['counter.value'],

  // Filter outputs
  'filter-selector.selection': ['result-list.filter', 'chart-display.filter'],
  'search-input.query': ['result-list.filter', 'member-list.filter'],

  // Date outputs
  'date-picker.selectedDate': ['countdown-timer.targetDate', 'rsvp-button.eventDate'],
};

export interface ConnectionSuggestion {
  from: { elementType: string; instanceId: string; port: string };
  to: { elementType: string; instanceId: string; port: string };
  description: string;
}

/**
 * Suggest connections between elements on canvas
 */
export function suggestConnections(
  elements: Array<{ elementType: string; instanceId: string }>
): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = [];

  for (const source of elements) {
    // Find all outputs for this element type
    const outputKeys = Object.keys(CONNECTION_MAP).filter(k =>
      k.startsWith(`${source.elementType}.`)
    );

    for (const outputKey of outputKeys) {
      const outputPort = outputKey.split('.')[1];
      const validTargets = CONNECTION_MAP[outputKey];

      // Find matching targets on canvas
      for (const target of elements) {
        if (target.instanceId === source.instanceId) continue;

        for (const validTarget of validTargets) {
          const [targetType, targetPort] = validTarget.split('.');
          if (target.elementType === targetType) {
            suggestions.push({
              from: { elementType: source.elementType, instanceId: source.instanceId, port: outputPort },
              to: { elementType: target.elementType, instanceId: target.instanceId, port: targetPort },
              description: getConnectionDescription(source.elementType, outputPort, targetType, targetPort),
            });
          }
        }
      }
    }
  }

  return suggestions;
}

function getConnectionDescription(
  sourceType: string,
  sourcePort: string,
  targetType: string,
  targetPort: string
): string {
  const descriptions: Record<string, string> = {
    'poll-element.results→chart-display.data': 'Visualize poll results in real-time',
    'poll-element.results→leaderboard.entries': 'Show top voted options',
    'form-builder.submissions→result-list.items': 'Display form responses',
    'rsvp-button.attendees→member-list.members': 'Show who\'s attending',
    'rsvp-button.attendeeCount→counter.value': 'Display attendee count',
    'filter-selector.selection→result-list.filter': 'Filter results by selection',
  };

  const key = `${sourceType}.${sourcePort}→${targetType}.${targetPort}`;
  return descriptions[key] || `Connect ${sourcePort} to ${targetPort}`;
}

// ═══════════════════════════════════════════════════════════════════
// SMART DEFAULTS
// ═══════════════════════════════════════════════════════════════════

export interface SpaceContext {
  spaceId?: string;
  spaceName?: string;
  spaceType?: string; // 'club', 'study-group', 'dorm', 'class', etc.
  memberCount?: number;
  category?: string;
}

/**
 * Generate smart default config for an element based on context
 */
export function getSmartDefaults(
  elementType: string,
  context: SpaceContext = {}
): Record<string, unknown> {
  const { spaceName, spaceType, memberCount } = context;

  const defaults: Record<string, () => Record<string, unknown>> = {
    'poll-element': () => ({
      question: spaceName ? `What does ${spaceName} think?` : 'What do you think?',
      options: getDefaultPollOptions(spaceType),
      showResults: true,
      allowMultiple: false,
      anonymous: false,
    }),

    'countdown-timer': () => ({
      title: spaceName ? `${spaceName} Event` : 'Upcoming Event',
      targetDate: getNextWeekDate(),
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: false,
    }),

    'rsvp-button': () => ({
      eventTitle: spaceName ? `${spaceName} Meeting` : 'Upcoming Event',
      eventDate: getNextWeekDate(),
      maxAttendees: memberCount ? Math.min(memberCount * 2, 100) : 50,
      showAttendeeCount: true,
      allowMaybe: true,
    }),

    'leaderboard': () => ({
      title: spaceType === 'study-group' ? 'Study Champions' : 'Top Contributors',
      metric: spaceType === 'study-group' ? 'hours' : 'points',
      maxEntries: 10,
      showAvatars: true,
      showChange: true,
    }),

    'form-builder': () => ({
      fields: getDefaultFormFields(spaceType),
      submitLabel: 'Submit',
      showProgress: true,
    }),

    'announcement': () => ({
      title: 'Announcements',
      items: [{
        title: 'Welcome!',
        content: spaceName
          ? `Welcome to ${spaceName}! Stay tuned for updates.`
          : 'Welcome! Check back for announcements.',
        priority: 'normal',
        date: new Date().toISOString(),
      }],
      maxItems: 5,
    }),

    'member-list': () => ({
      title: 'Members',
      displayMode: 'grid',
      maxMembers: Math.min(memberCount || 10, 20),
      showBio: false,
      showRole: true,
    }),

    'chart-display': () => ({
      title: 'Results',
      chartType: 'bar',
      showLegend: true,
      animate: true,
    }),

    'counter': () => ({
      title: 'Count',
      value: 0,
      showAnimation: true,
    }),

    'timer': () => ({
      title: 'Timer',
      duration: spaceType === 'study-group' ? 25 * 60 : 60 * 60, // Pomodoro for study groups
      autoStart: false,
    }),

    'space-events': () => ({
      title: 'Upcoming Events',
      maxEvents: 3,
      showDescription: true,
      showRSVP: true,
      filterPast: true,
    }),

    'space-stats': () => ({
      showMembers: true,
      showMessages: true,
      showEvents: true,
      period: 'week',
    }),
  };

  const generator = defaults[elementType];
  return generator ? generator() : {};
}

function getDefaultPollOptions(spaceType?: string): string[] {
  switch (spaceType) {
    case 'study-group':
      return ['Library', 'Coffee Shop', 'Dorm', 'Student Union'];
    case 'club':
      return ['Yes, I\'m in!', 'Maybe', 'Can\'t make it', 'Need more info'];
    case 'class':
      return ['Strongly Agree', 'Agree', 'Neutral', 'Disagree'];
    default:
      return ['Option A', 'Option B', 'Option C'];
  }
}

function getDefaultFormFields(spaceType?: string): Array<{ name: string; label: string; type: string; required: boolean }> {
  switch (spaceType) {
    case 'study-group':
      return [
        { name: 'name', label: 'Your Name', type: 'text', required: true },
        { name: 'course', label: 'Course', type: 'text', required: true },
        { name: 'availability', label: 'Available Times', type: 'text', required: false },
      ];
    case 'club':
      return [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'text', required: true },
        { name: 'interest', label: 'Why do you want to join?', type: 'textarea', required: false },
      ];
    default:
      return [
        { name: 'name', label: 'Your Name', type: 'text', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ];
  }
}

function getNextWeekDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Recommended templates by space type
 */
export const TEMPLATE_RECOMMENDATIONS: Record<string, string[]> = {
  'club': [
    'quick-poll',
    'event-rsvp',
    'announcements',
    'member-spotlight',
    'attendance-tracker',
  ],
  'study-group': [
    'study-group-signup',
    'meeting-agenda',
    'progress-tracker',
    'study-group-matcher',
  ],
  'class': [
    'anonymous-qa',
    'quick-poll',
    'feedback-form',
    'office-hours',
  ],
  'dorm': [
    'quick-poll',
    'announcements',
    'event-countdown',
    'decision-maker',
  ],
  'sports': [
    'event-rsvp',
    'attendance-tracker',
    'member-leaderboard',
    'competition-tracker',
  ],
  'organization': [
    'announcements',
    'event-rsvp',
    'feedback-form',
    'resource-signup',
    'multi-poll-dashboard',
  ],
  'default': [
    'quick-poll',
    'event-rsvp',
    'announcements',
    'event-countdown',
  ],
};

/**
 * Get recommended template IDs for a space
 */
export function getRecommendedTemplates(context: SpaceContext): string[] {
  const spaceType = context.spaceType || context.category || 'default';
  return TEMPLATE_RECOMMENDATIONS[spaceType] || TEMPLATE_RECOMMENDATIONS['default'];
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH SYNONYMS
// ═══════════════════════════════════════════════════════════════════

/**
 * Search term → element type mapping
 */
export const SEARCH_SYNONYMS: Record<string, string> = {
  // Poll
  'vote': 'poll-element',
  'voting': 'poll-element',
  'survey': 'poll-element',
  'opinion': 'poll-element',
  'decision': 'poll-element',

  // RSVP
  'signup': 'rsvp-button',
  'sign up': 'rsvp-button',
  'register': 'rsvp-button',
  'registration': 'rsvp-button',
  'attend': 'rsvp-button',
  'rsvp': 'rsvp-button',

  // Form
  'form': 'form-builder',
  'feedback': 'form-builder',
  'submission': 'form-builder',
  'collect': 'form-builder',

  // Chart
  'graph': 'chart-display',
  'chart': 'chart-display',
  'visualization': 'chart-display',
  'visualize': 'chart-display',

  // Timer
  'countdown': 'countdown-timer',
  'timer': 'countdown-timer',
  'deadline': 'countdown-timer',

  // Leaderboard
  'ranking': 'leaderboard',
  'scoreboard': 'leaderboard',
  'top': 'leaderboard',
  'winners': 'leaderboard',

  // Members
  'members': 'member-list',
  'people': 'member-list',
  'who': 'member-list',
  'attendees': 'member-list',

  // Announcements
  'news': 'announcement',
  'update': 'announcement',
  'notice': 'announcement',

  // Counter
  'count': 'counter',
  'number': 'counter',
  'total': 'counter',
};

/**
 * Find element type from search term
 */
export function findElementBySearch(query: string): string | null {
  const normalized = query.toLowerCase().trim();
  return SEARCH_SYNONYMS[normalized] || null;
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT COMPLETIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Autocomplete suggestions for prompt input
 */
export const PROMPT_COMPLETIONS: Record<string, string[]> = {
  'poll': [
    'poll about favorite study spots',
    'poll about meeting times',
    'poll about event ideas',
    'poll about food preferences',
  ],
  'vote': [
    'voting for next event',
    'voting on budget decisions',
    'voting with leaderboard',
  ],
  'event': [
    'event signup with countdown',
    'event RSVP tracker',
    'event check-in system',
  ],
  'countdown': [
    'countdown to our next meeting',
    'countdown timer for deadline',
  ],
  'signup': [
    'signup form for new members',
    'signup with availability',
  ],
  'feedback': [
    'feedback form for events',
    'feedback collection with results',
  ],
  'announcement': [
    'announcement board for updates',
    'announcements with pinned items',
  ],
  'leaderboard': [
    'leaderboard for participation',
    'leaderboard with weekly rankings',
  ],
  'study': [
    'study group signup',
    'study session timer',
    'study partner matcher',
  ],
};

/**
 * Get autocomplete suggestions for a partial prompt
 */
export function getPromptCompletions(partial: string): string[] {
  const normalized = partial.toLowerCase().trim();

  // Find matching prefix
  for (const [prefix, completions] of Object.entries(PROMPT_COMPLETIONS)) {
    if (normalized.includes(prefix)) {
      return completions;
    }
  }

  // Return all suggestions if no match
  if (normalized.length > 2) {
    return Object.values(PROMPT_COMPLETIONS).flat().slice(0, 5);
  }

  return [];
}

// ═══════════════════════════════════════════════════════════════════
// QUICK CREATE INTENTS
// ═══════════════════════════════════════════════════════════════════

export interface QuickCreateIntent {
  id: string;
  label: string;
  description: string;
  icon: string;
  templateId: string;
  requiredFields: string[];
}

/**
 * Simple intents for "blind" tool creation
 * User picks intent → fills 1-2 fields → tool deployed
 */
export const QUICK_CREATE_INTENTS: QuickCreateIntent[] = [
  {
    id: 'poll',
    label: 'Ask a question',
    description: 'Get opinions from your members',
    icon: 'bar-chart-2',
    templateId: 'quick-poll',
    requiredFields: ['question'],
  },
  {
    id: 'rsvp',
    label: 'Event signup',
    description: 'Let people RSVP to an event',
    icon: 'calendar',
    templateId: 'event-rsvp',
    requiredFields: ['eventTitle'],
  },
  {
    id: 'countdown',
    label: 'Countdown timer',
    description: 'Count down to something exciting',
    icon: 'timer',
    templateId: 'event-countdown',
    requiredFields: ['title', 'targetDate'],
  },
  {
    id: 'announcement',
    label: 'Make an announcement',
    description: 'Share news with your space',
    icon: 'megaphone',
    templateId: 'announcements',
    requiredFields: ['content'],
  },
  {
    id: 'feedback',
    label: 'Collect feedback',
    description: 'Gather thoughts and suggestions',
    icon: 'message-square',
    templateId: 'feedback-form',
    requiredFields: [],
  },
  {
    id: 'decision',
    label: 'Make a decision',
    description: 'Quick yes/no vote for the group',
    icon: 'target',
    templateId: 'decision-maker',
    requiredFields: ['question'],
  },
];

/**
 * Get intent by ID
 */
export function getQuickCreateIntent(id: string): QuickCreateIntent | undefined {
  return QUICK_CREATE_INTENTS.find(i => i.id === id);
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const HiveLabIntelligence = {
  // Element affinity
  ELEMENT_AFFINITY,
  getRecommendedElements,

  // Connections
  CONNECTION_MAP,
  suggestConnections,

  // Smart defaults
  getSmartDefaults,

  // Templates
  TEMPLATE_RECOMMENDATIONS,
  getRecommendedTemplates,

  // Search
  SEARCH_SYNONYMS,
  findElementBySearch,

  // Prompts
  PROMPT_COMPLETIONS,
  getPromptCompletions,

  // Quick create
  QUICK_CREATE_INTENTS,
  getQuickCreateIntent,
};

export default HiveLabIntelligence;
