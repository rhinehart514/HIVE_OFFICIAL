/**
 * Goose System Prompt Builder
 *
 * Constructs the system prompt for Goose model inference.
 * Includes element catalog, output schema, and generation guidelines.
 */

import { VALID_ELEMENT_TYPES, ELEMENT_PORTS, REQUIRED_CONFIG_FIELDS } from './validator';

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT = `You are Goose, an AI assistant that generates HiveLab tools from natural language descriptions.

HiveLab tools are composed of visual elements that can be connected to create interactive experiences for campus communities.

OUTPUT FORMAT:
You must output valid JSON with this exact structure:
{
  "elements": [
    {
      "type": "<element-type>",
      "instanceId": "<unique-id>",
      "config": { <element-specific-config> },
      "position": { "x": <number>, "y": <number> },
      "size": { "width": <number>, "height": <number> }
    }
  ],
  "connections": [
    {
      "from": { "instanceId": "<source-id>", "port": "<output-port>" },
      "to": { "instanceId": "<target-id>", "port": "<input-port>" }
    }
  ],
  "name": "<tool-name>",
  "description": "<brief-description>",
  "layout": "grid" | "flow" | "tabs" | "sidebar"
}

RULES:
1. Always output valid JSON only - no explanations or markdown
2. Use only valid element types from the catalog below
3. Include all required config fields for each element type
4. Ensure unique instanceId for each element (use pattern: element_type_1, element_type_2)
5. Only create connections between elements that exist
6. Position elements to avoid overlap (use grid: 100+col*340, 100+row*250)
7. Keep tool compositions simple - 1-4 elements maximum
8. Match the user's intent precisely - don't add unnecessary elements`;

// ═══════════════════════════════════════════════════════════════════
// ELEMENT CATALOG
// ═══════════════════════════════════════════════════════════════════

interface ElementCatalogEntry {
  description: string;
  use_for: string[];
  required_config: string[];
  optional_config: string[];
  outputs: string[];
  inputs: string[];
  default_size: { width: number; height: number };
}

export const ELEMENT_CATALOG: Record<string, ElementCatalogEntry> = {
  'poll-element': {
    description: 'Interactive poll with voting options',
    use_for: ['voting', 'opinions', 'decisions', 'surveys'],
    required_config: ['question (string)', 'options (string array, 2-10 items)'],
    optional_config: ['allowMultipleVotes', 'showResults', 'showVoterCount', 'closesAt'],
    outputs: ['results', 'totalVotes'],
    inputs: [],
    default_size: { width: 300, height: 200 },
  },
  'rsvp-button': {
    description: 'Event RSVP with attendance tracking',
    use_for: ['events', 'signups', 'registration', 'attendance'],
    required_config: ['eventName (string)'],
    optional_config: ['maxAttendees', 'showAttendeeCount', 'enableWaitlist', 'options'],
    outputs: ['attendees', 'waitlist', 'count'],
    inputs: [],
    default_size: { width: 240, height: 120 },
  },
  'countdown-timer': {
    description: 'Visual countdown to target date/time',
    use_for: ['countdowns', 'deadlines', 'event timers', 'launches'],
    required_config: ['targetDate (ISO date string)'],
    optional_config: ['title', 'showDays', 'showHours', 'showMinutes', 'showSeconds', 'completedMessage'],
    outputs: ['remaining', 'isComplete'],
    inputs: [],
    default_size: { width: 280, height: 140 },
  },
  'leaderboard': {
    description: 'Competitive ranking display',
    use_for: ['rankings', 'scores', 'competitions', 'gamification'],
    required_config: [],
    optional_config: ['title', 'maxEntries', 'showRankChange', 'refreshInterval'],
    outputs: ['rankings', 'topScorer'],
    inputs: ['entries'],
    default_size: { width: 280, height: 320 },
  },
  'chart-display': {
    description: 'Data visualization (bar, line, pie)',
    use_for: ['statistics', 'results', 'data visualization', 'analytics'],
    required_config: ['chartType (bar|line|pie)'],
    optional_config: ['title', 'showLegend'],
    outputs: [],
    inputs: ['data'],
    default_size: { width: 320, height: 240 },
  },
  'result-list': {
    description: 'Paginated list display',
    use_for: ['search results', 'items', 'collections', 'directories'],
    required_config: [],
    optional_config: ['itemsPerPage', 'showPagination'],
    outputs: [],
    inputs: ['items'],
    default_size: { width: 280, height: 300 },
  },
  'form-builder': {
    description: 'Dynamic form with custom fields',
    use_for: ['surveys', 'registration', 'feedback', 'data collection'],
    required_config: [],
    optional_config: ['fields (array of {name, type, label, required, options})', 'submitButtonText', 'showValidation'],
    outputs: ['formData', 'submittedData'],
    inputs: [],
    default_size: { width: 280, height: 200 },
  },
  'counter': {
    description: 'Simple increment/decrement counter',
    use_for: ['counting', 'tracking', 'tallies', 'attendance'],
    required_config: [],
    optional_config: ['initialValue', 'minValue', 'maxValue', 'step', 'label'],
    outputs: ['value'],
    inputs: [],
    default_size: { width: 160, height: 100 },
  },
  'timer': {
    description: 'Stopwatch timer',
    use_for: ['time tracking', 'study sessions', 'pomodoro', 'meetings'],
    required_config: [],
    optional_config: ['autoStart', 'showMilliseconds', 'targetDuration'],
    outputs: ['elapsed', 'isRunning', 'laps'],
    inputs: [],
    default_size: { width: 200, height: 120 },
  },
  'search-input': {
    description: 'Text search with autocomplete',
    use_for: ['search', 'filtering', 'lookup', 'queries'],
    required_config: [],
    optional_config: ['placeholder', 'showSuggestions', 'debounceMs'],
    outputs: ['query', 'searchTerm'],
    inputs: [],
    default_size: { width: 280, height: 60 },
  },
  'filter-selector': {
    description: 'Multi-select filter buttons',
    use_for: ['filtering', 'categories', 'tags', 'multi-select'],
    required_config: [],
    optional_config: ['options (array of {value, label})', 'allowMultiple', 'showCounts'],
    outputs: ['selectedFilters', 'filters'],
    inputs: [],
    default_size: { width: 280, height: 80 },
  },
  'date-picker': {
    description: 'Date and time selection',
    use_for: ['scheduling', 'deadlines', 'date selection', 'calendars'],
    required_config: [],
    optional_config: ['mode (single|range)', 'showTime', 'minDate', 'maxDate'],
    outputs: ['selectedDate', 'dateRange'],
    inputs: [],
    default_size: { width: 280, height: 140 },
  },
  'user-selector': {
    description: 'Campus user picker',
    use_for: ['inviting', 'assigning', 'team building', 'selection'],
    required_config: [],
    optional_config: ['allowMultiple', 'maxSelections', 'filterByRole', 'placeholder'],
    outputs: ['selectedUsers', 'userIds'],
    inputs: [],
    default_size: { width: 280, height: 100 },
  },
  'availability-heatmap': {
    description: 'Member availability visualization',
    use_for: ['meeting scheduling', 'finding best times', 'availability'],
    required_config: [],
    optional_config: ['showSuggestions', 'timeFormat', 'startHour', 'endHour', 'highlightThreshold'],
    outputs: ['selectedSlot', 'bestTimes', 'connectedMemberCount'],
    inputs: ['spaceId'],
    default_size: { width: 400, height: 320 },
  },
  'member-list': {
    description: 'Space member directory',
    use_for: ['directories', 'rosters', 'team lists', 'attendance'],
    required_config: [],
    optional_config: ['maxMembers', 'showRole', 'showJoinDate'],
    outputs: ['members', 'selectedMember'],
    inputs: ['spaceId'],
    default_size: { width: 280, height: 350 },
  },
  'space-events': {
    description: 'Space event calendar',
    use_for: ['event lists', 'calendars', 'schedules', 'upcoming'],
    required_config: [],
    optional_config: ['showPast', 'maxEvents', 'showRsvpCount'],
    outputs: ['events', 'upcomingCount'],
    inputs: ['spaceId'],
    default_size: { width: 300, height: 280 },
  },
  'space-stats': {
    description: 'Space engagement metrics',
    use_for: ['analytics', 'dashboards', 'insights', 'metrics'],
    required_config: [],
    optional_config: ['metrics', 'showTrends'],
    outputs: ['stats', 'trends'],
    inputs: ['spaceId'],
    default_size: { width: 300, height: 200 },
  },
  'announcement': {
    description: 'Create and display announcements',
    use_for: ['broadcasts', 'updates', 'alerts', 'pinned messages'],
    required_config: [],
    optional_config: ['pinned', 'sendNotification', 'expiresAt'],
    outputs: ['announcementId', 'viewCount'],
    inputs: ['content', 'spaceId'],
    default_size: { width: 320, height: 180 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// CONNECTION PATTERNS
// ═══════════════════════════════════════════════════════════════════

const COMMON_CONNECTIONS = `
COMMON CONNECTIONS:
- poll-element.results -> chart-display.data (show poll results as chart)
- poll-element.results -> leaderboard.entries (show poll results as rankings)
- search-input.query -> result-list.items (search filtering)
- filter-selector.filters -> result-list.items (category filtering)
- form-builder.submittedData -> result-list.items (show form submissions)
- rsvp-button.attendees -> result-list.items (show attendee list)`;

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Build the element catalog section of the prompt
 */
function buildElementCatalog(includeAll = false): string {
  const elements = includeAll
    ? Object.entries(ELEMENT_CATALOG)
    : Object.entries(ELEMENT_CATALOG).slice(0, 12); // Top 12 most common

  const lines = ['ELEMENT CATALOG:'];

  for (const [type, entry] of elements) {
    lines.push(`
${type}:
  Description: ${entry.description}
  Use for: ${entry.use_for.join(', ')}
  Required config: ${entry.required_config.length > 0 ? entry.required_config.join(', ') : 'none'}
  Outputs: ${entry.outputs.length > 0 ? entry.outputs.join(', ') : 'none'}
  Inputs: ${entry.inputs.length > 0 ? entry.inputs.join(', ') : 'none'}
  Default size: ${entry.default_size.width}x${entry.default_size.height}`);
  }

  return lines.join('\n');
}

/**
 * Build the full system prompt
 */
export function buildSystemPrompt(options: {
  includeAllElements?: boolean;
  includeConnections?: boolean;
  existingComposition?: unknown;
  isIteration?: boolean;
} = {}): string {
  const parts = [BASE_SYSTEM_PROMPT];

  // Add element catalog
  parts.push(buildElementCatalog(options.includeAllElements));

  // Add connection patterns
  if (options.includeConnections !== false) {
    parts.push(COMMON_CONNECTIONS);
  }

  // Add context for iteration
  if (options.isIteration && options.existingComposition) {
    parts.push(`
CURRENT TOOL:
The user already has a tool. They want to modify it.
Current composition: ${JSON.stringify(options.existingComposition, null, 2)}

ITERATION RULES:
1. Preserve existing elements unless the user explicitly wants to remove them
2. Add new elements when requested
3. Update configurations when requested
4. Maintain existing connections unless they conflict with changes`);
  }

  // Add examples
  parts.push(`
EXAMPLES:

User: "create a poll about favorite study spots"
Output: {"elements":[{"type":"poll-element","instanceId":"poll_element_1","config":{"question":"What's your favorite study spot?","options":["Library","Coffee shop","Dorm","Student union"],"showResults":true},"position":{"x":100,"y":100},"size":{"width":300,"height":200}}],"connections":[],"name":"Study Spots Poll","description":"Quick poll about favorite study locations","layout":"grid"}

User: "rsvp for weekly meeting with countdown"
Output: {"elements":[{"type":"rsvp-button","instanceId":"rsvp_button_1","config":{"eventName":"Weekly Meeting","showAttendeeCount":true},"position":{"x":100,"y":100},"size":{"width":240,"height":120}},{"type":"countdown-timer","instanceId":"countdown_timer_1","config":{"targetDate":"2026-02-01T18:00:00Z","title":"Meeting Starts In"},"position":{"x":440,"y":100},"size":{"width":280,"height":140}}],"connections":[],"name":"Weekly Meeting RSVP","description":"RSVP with countdown timer","layout":"grid"}

User: "poll with results chart"
Output: {"elements":[{"type":"poll-element","instanceId":"poll_element_1","config":{"question":"What do you prefer?","options":["Option A","Option B","Option C"],"showResults":true},"position":{"x":100,"y":100},"size":{"width":300,"height":200}},{"type":"chart-display","instanceId":"chart_display_1","config":{"chartType":"bar","title":"Results","showLegend":true},"position":{"x":440,"y":100},"size":{"width":320,"height":240}}],"connections":[{"from":{"instanceId":"poll_element_1","port":"results"},"to":{"instanceId":"chart_display_1","port":"data"}}],"name":"Poll with Chart","description":"Poll with visual results chart","layout":"grid"}`);

  return parts.join('\n\n');
}

/**
 * Build a compact system prompt for smaller models
 */
export function buildCompactSystemPrompt(): string {
  return `You are Goose. Generate HiveLab tools as JSON.

Valid elements: poll-element, rsvp-button, countdown-timer, leaderboard, chart-display, result-list, form-builder, counter, timer, search-input, filter-selector, date-picker, availability-heatmap, member-list, space-events, announcement

Required configs:
- poll-element: question (string), options (string[])
- rsvp-button: eventName (string)
- countdown-timer: targetDate (ISO string)
- chart-display: chartType (bar|line|pie)

Output format:
{"elements":[{"type":"...","instanceId":"...","config":{...},"position":{"x":100,"y":100},"size":{"width":280,"height":200}}],"connections":[],"name":"...","description":"...","layout":"grid"}

Always output valid JSON only.`;
}

/**
 * Build user prompt with context
 */
export function buildUserPrompt(
  userInput: string,
  context?: {
    existingComposition?: unknown;
    isIteration?: boolean;
  }
): string {
  if (context?.isIteration && context.existingComposition) {
    return `Modify the current tool: ${userInput}`;
  }
  return userInput;
}

export default {
  buildSystemPrompt,
  buildCompactSystemPrompt,
  buildUserPrompt,
  ELEMENT_CATALOG,
};
