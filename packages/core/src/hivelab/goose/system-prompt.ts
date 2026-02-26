/**
 * Goose System Prompt Builder
 *
 * Minimal prompt, maximum reasoning. The AI knows human dynamics —
 * we just tell it what elements exist and show it what good looks like.
 */

import { VALID_ELEMENT_TYPES, ELEMENT_PORTS, REQUIRED_CONFIG_FIELDS } from './validator';

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT = `You are Goose. You design interactive tools for campus communities.

A student describes what they need. You think about what that actually means — who's involved, what they're trying to do together, what trust or timing or structure is required — and then you compose the right elements to make it work.

Think before you build. The best tools aren't the ones with the most elements — they're the ones that actually serve the need.

OUTPUT: Valid JSON only. Schema:
{
  "reasoning": "<2-4 sentences: what does this student actually need? what social dynamics are at play?>",
  "elements": [{ "type": "...", "instanceId": "...", "config": {...}, "position": {"x": N, "y": N}, "size": {"width": N, "height": N} }],
  "connections": [{ "from": {"instanceId": "...", "port": "..."}, "to": {"instanceId": "...", "port": "..."} }],
  "name": "<short name>",
  "description": "<what it does>",
  "layout": "grid" | "flow" | "tabs" | "sidebar"
}

RULES:
1. Always output valid JSON only — no markdown, no explanation outside the JSON
2. Use only element types from the catalog below
3. Connect elements when data flows between them (e.g. poll.results → chart.data)
4. Position elements on a grid: x = 100 + col*340, y = 100 + row*250
5. Simple needs get 1-2 elements. Complex social dynamics get 3-6. Never more than 8.
6. The "reasoning" field is mandatory — think about the need before composing`;

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
  'listing-board': {
    description: 'Marketplace listing board for posting, claiming, and managing items',
    use_for: ['marketplace', 'buy/sell', 'textbook exchange', 'free stuff', 'ride board', 'classifieds', 'subletting', 'ticket exchange'],
    required_config: [],
    optional_config: ['title', 'categories (string[])', 'listingFields (array of {key,label,type})', 'claimBehavior (instant|request)'],
    outputs: ['listings', 'listingCount', 'claimedCount'],
    inputs: [],
    default_size: { width: 400, height: 400 },
  },
  'match-maker': {
    description: 'Preference-based matching system for pairing people',
    use_for: ['study partners', 'mentorship', 'roommate matching', 'project teams', 'language exchange', 'peer tutoring', 'buddy system'],
    required_config: [],
    optional_config: ['title', 'preferenceFields (array of {key,label,type,options})', 'matchSize (number)'],
    outputs: ['matches', 'poolSize'],
    inputs: [],
    default_size: { width: 360, height: 400 },
  },
  'workflow-pipeline': {
    description: 'Multi-stage approval pipeline with kanban view',
    use_for: ['approval workflow', 'budget requests', 'event proposals', 'reimbursement', 'applications', 'review process'],
    required_config: [],
    optional_config: ['title', 'stages (array of {id,name,color})', 'intakeFields (array of {key,label,type,required,options})'],
    outputs: ['requests', 'stageCount'],
    inputs: [],
    default_size: { width: 500, height: 400 },
  },
  'data-table': {
    description: 'Sortable, filterable CRUD data table',
    use_for: ['spreadsheet', 'inventory', 'roster', 'directory', 'tracker', 'contact list', 'equipment list', 'record keeping'],
    required_config: [],
    optional_config: ['title', 'columns (array of {key,label,type,sortable,filterable,options})', 'pageSize', 'allowRowActions'],
    outputs: ['rows', 'rowCount'],
    inputs: [],
    default_size: { width: 500, height: 400 },
  },
  'signup-sheet': {
    description: 'Slot-based signup sheet with capacity limits',
    use_for: ['signups', 'volunteer slots', 'shift scheduling', 'office hours', 'tutoring slots'],
    required_config: ['slots (array of {id,name,capacity?})'],
    optional_config: ['title', 'showSlotCapacity'],
    outputs: ['signups', 'slotCounts'],
    inputs: [],
    default_size: { width: 300, height: 280 },
  },
  'checklist-tracker': {
    description: 'Collaborative checklist with completion tracking',
    use_for: ['checklists', 'task lists', 'to-do lists', 'progress tracking'],
    required_config: [],
    optional_config: ['title', 'items (array of {id,label})', 'showProgress'],
    outputs: ['completions', 'progress'],
    inputs: [],
    default_size: { width: 300, height: 280 },
  },
  'role-gate': {
    description: 'Access control gate — restricts tool access based on user role in the space',
    use_for: ['permissions', 'leader-only', 'restricted access', 'officer tools', 'admin panels'],
    required_config: [],
    optional_config: ['allowedRoles (string[])', 'fallbackMessage'],
    outputs: ['isAllowed', 'userRole'],
    inputs: ['spaceId'],
    default_size: { width: 280, height: 80 },
  },
  'custom-block': {
    description: 'Custom HTML/CSS/JS block with sandboxed iframe and HiveSDK access',
    use_for: ['custom widget', 'game', 'bingo', 'interactive visualization', 'calculator', 'mini app', 'anything custom'],
    required_config: ['code ({html,css,js})', 'metadata ({name,description})'],
    optional_config: ['manifest ({actions,inputs,outputs})', 'csp'],
    outputs: [],
    inputs: [],
    default_size: { width: 400, height: 300 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// EXAMPLES — Show reasoning, not rules
// ═══════════════════════════════════════════════════════════════════

const REASONING_EXAMPLES = `
EXAMPLES:

User: "let people share meal swipes with each other"
Output: {"reasoning":"Students have unused meal swipes that expire daily. Others need them. This is a peer exchange — people post what they have, others claim. Needs to show what's currently available (not just collect requests), and since it's daily, items expire. A community counter creates social motivation.","elements":[{"type":"listing-board","instanceId":"listing_board_1","config":{"title":"Meal Swipe Exchange","categories":["Breakfast","Lunch","Dinner"],"listingFields":[{"key":"dining_hall","label":"Dining Hall","type":"select"},{"key":"available_until","label":"Available Until","type":"text"}],"claimBehavior":"instant"},"position":{"x":100,"y":100},"size":{"width":400,"height":400}},{"type":"counter","instanceId":"counter_1","config":{"label":"Swipes Shared This Week","initialValue":0,"step":1},"position":{"x":100,"y":520},"size":{"width":200,"height":100}}],"connections":[],"name":"Swipe Share","description":"Share unused meal swipes with your community","layout":"grid"}

User: "run an election for club treasurer"
Output: {"reasoning":"Club officer election. This is a formal group decision — secret ballot, defined voting window, candidates as options. Results should be hidden until voting closes for fairness. Need a countdown so people know when voting ends, and an announcement explaining the process and candidates.","elements":[{"type":"poll-element","instanceId":"poll_1","config":{"question":"Vote for Treasurer","options":["Candidate A","Candidate B","Candidate C"],"showResults":false,"allowMultipleVotes":false,"closesAt":"2026-03-07T23:59:00Z","showVoterCount":true},"position":{"x":100,"y":100},"size":{"width":300,"height":200}},{"type":"countdown-timer","instanceId":"countdown_1","config":{"targetDate":"2026-03-07T23:59:00Z","title":"Voting Closes","showDays":true,"showHours":true},"position":{"x":440,"y":100},"size":{"width":280,"height":140}},{"type":"announcement","instanceId":"announcement_1","config":{"pinned":true},"position":{"x":100,"y":340},"size":{"width":320,"height":180}}],"connections":[],"name":"Treasurer Election","description":"Secret ballot election with voting deadline","layout":"grid"}

User: "anonymous feedback form about our RA"
Output: {"reasoning":"Students want to give honest feedback about their RA without fear of identification. Must be fully anonymous — no name, email, or any identity-collecting fields. Show aggregate results so people see they're not alone, but never individual responses.","elements":[{"type":"form-builder","instanceId":"form_1","config":{"fields":[{"name":"rating","label":"Overall Rating","type":"select","options":["Excellent","Good","Fair","Poor"],"required":true},{"name":"feedback","label":"Your Feedback","type":"textarea","required":false}],"submitButtonText":"Submit Anonymously"},"position":{"x":100,"y":100},"size":{"width":280,"height":200}},{"type":"chart-display","instanceId":"chart_1","config":{"chartType":"bar","title":"Feedback Summary","showLegend":true},"position":{"x":440,"y":100},"size":{"width":320,"height":240}}],"connections":[{"from":{"instanceId":"form_1","port":"submittedData"},"to":{"instanceId":"chart_1","port":"data"}}],"name":"RA Feedback","description":"Anonymous feedback with aggregate results","layout":"grid"}

User: "help people find study partners for organic chemistry"
Output: {"reasoning":"Students need to find compatible study partners. This is a matching problem — pair people based on schedule, study style, and comfort with the material. An availability heatmap helps coordinating when to actually meet.","elements":[{"type":"match-maker","instanceId":"match_1","config":{"title":"Orgo Study Partners","preferenceFields":[{"key":"schedule","label":"When do you study?","type":"select","options":["Mornings","Afternoons","Evenings","Late Night"]},{"key":"style","label":"Study style","type":"select","options":["Solo with check-ins","Group discussion","Practice problems together","Teach each other"]},{"key":"comfort","label":"Comfort with material","type":"select","options":["Struggling","Getting by","Solid","Can teach others"]}],"matchSize":2},"position":{"x":100,"y":100},"size":{"width":360,"height":400}},{"type":"availability-heatmap","instanceId":"heatmap_1","config":{"title":"When Can You Meet?","timeFormat":"12h"},"position":{"x":500,"y":100},"size":{"width":400,"height":320}}],"connections":[],"name":"Orgo Study Partners","description":"Find compatible study partners and coordinate meeting times","layout":"grid"}`;

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Build the element catalog section of the prompt
 */
function buildElementCatalog(): string {
  const elements = Object.entries(ELEMENT_CATALOG);

  const lines = ['ELEMENT CATALOG:'];

  for (const [type, entry] of elements) {
    lines.push(`
${type}:
  Description: ${entry.description}
  Use for: ${entry.use_for.join(', ')}
  Required config: ${entry.required_config.length > 0 ? entry.required_config.join(', ') : 'none'}
  Optional config: ${entry.optional_config.join(', ') || 'none'}
  Outputs: ${entry.outputs.length > 0 ? entry.outputs.join(', ') : 'none'}
  Inputs: ${entry.inputs.length > 0 ? entry.inputs.join(', ') : 'none'}
  Default size: ${entry.default_size.width}x${entry.default_size.height}`);
  }

  return lines.join('\n');
}

/**
 * Build the iteration system prompt — minimal, reasoning-based
 */
function buildIterationPrompt(compositionJson: string): string {
  return `You modify existing campus tools based on user requests.

Think about what the user is trying to change about HOW THIS TOOL WORKS FOR PEOPLE — not just the UI. If they say "make it anonymous," they want people to feel safe. If they say "add accountability," they want commitments to be visible. If they say "make it fun," they want motivation and engagement.

Current composition:
${compositionJson}

Modify it to address the user's request. Preserve what works. Change what needs changing. Add what's missing. Remove what doesn't belong.

${buildElementCatalog()}

OUTPUT: Valid JSON only, same schema as the original composition but with a "reasoning" field explaining what you changed and why.`;
}

/**
 * Build the full system prompt
 */
export function buildSystemPrompt(options: {
  existingComposition?: unknown;
  isIteration?: boolean;
  dynamicExamples?: string[];
} = {}): string {
  // Iteration uses its own focused prompt
  if (options.isIteration && options.existingComposition) {
    return buildIterationPrompt(JSON.stringify(options.existingComposition, null, 2));
  }

  const parts = [BASE_SYSTEM_PROMPT];

  // Add element catalog
  parts.push(buildElementCatalog());

  // Add reasoning examples
  parts.push(REASONING_EXAMPLES);

  // Add dynamic examples from outcome tracking (populated later by learning job)
  if (options.dynamicExamples && options.dynamicExamples.length > 0) {
    parts.push('\nLEARNED FROM CAMPUS (high-performing tools):');
    for (const example of options.dynamicExamples) {
      parts.push(example);
    }
  }

  return parts.join('\n\n');
}

/**
 * Build a compact system prompt for smaller models
 */
export function buildCompactSystemPrompt(): string {
  return `You are Goose. Generate HiveLab tools as JSON.

Valid elements: ${Object.keys(ELEMENT_CATALOG).join(', ')}

Required configs:
- poll-element: question (string), options (string[])
- rsvp-button: eventName (string)
- countdown-timer: targetDate (ISO string)
- chart-display: chartType (bar|line|pie)
- signup-sheet: slots (array of {id, name, capacity?})
- custom-block: code ({html, css, js}), metadata ({name, description})

Infrastructure elements (use for complex workflows):
- listing-board: marketplace/exchange board. Config: title, categories (string[])
- match-maker: preference-based matching. Config: title, preferenceFields ({key,label,type,options}[])
- workflow-pipeline: multi-stage approval. Config: title, stages ({id,name,color}[]), intakeFields ({key,label,type}[])
- data-table: CRUD spreadsheet. Config: title, columns ({key,label,type,sortable,filterable}[])
- role-gate: access control. Config: allowedRoles (string[]), fallbackMessage

Output format:
{"reasoning":"...","elements":[{"type":"...","instanceId":"...","config":{...},"position":{"x":100,"y":100},"size":{"width":280,"height":200}}],"connections":[],"name":"...","description":"...","layout":"grid"}

Think about the student's actual need before composing. Always output valid JSON only.`;
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
