/**
 * Gemini Prompt Engineering for HiveLab Tool Generation
 *
 * This module contains the system prompt and examples for generating
 * ToolComposition JSON from natural language descriptions.
 */

import type { ToolComposition } from '../../../domain/hivelab/tool-composition.types';

/**
 * Element type descriptions for the AI model
 */
/**
 * IMPORTANT: These element IDs MUST match ELEMENT_RENDERERS in element-renderers.tsx
 * Do NOT add suffixes like "-1", "-2" to elementId values.
 * The instanceId field is used to distinguish multiple instances of the same element type.
 */
export const ELEMENT_CATALOG = {
  // ═══════════════════════════════════════════════════════════════
  // UNIVERSAL ELEMENTS - Work anywhere, no data source required
  // ═══════════════════════════════════════════════════════════════

  'search-input': {
    category: 'input',
    tier: 'universal',
    description: 'Text search input with autocomplete suggestions. Use for finding content, filtering by keywords, or querying data.',
    config: {
      placeholder: 'string (default: "Search...")',
      showSuggestions: 'boolean (default: false)',
      debounceMs: 'number (default: 300)'
    },
    outputs: ['query', 'searchTerm'],
    useCases: ['search events', 'find users', 'filter content', 'lookup data']
  },

  'filter-selector': {
    category: 'filter',
    tier: 'universal',
    description: 'Multi-select filter buttons with badges. Use for categorizing, tagging, or filtering by multiple criteria.',
    config: {
      options: 'array of {value, label, count?} (required)',
      allowMultiple: 'boolean (default: true)',
      showCounts: 'boolean (default: false)'
    },
    outputs: ['selectedFilters', 'filters'],
    useCases: ['filter by category', 'select tags', 'choose preferences', 'multi-select options']
  },

  'result-list': {
    category: 'display',
    tier: 'universal',
    description: 'Paginated list view for displaying results. Use for showing search results, filtered items, or collections.',
    config: {
      itemsPerPage: 'number (default: 10)',
      showPagination: 'boolean (default: true)'
    },
    inputs: ['items'],
    useCases: ['display search results', 'show filtered items', 'list events', 'member directory']
  },

  'date-picker': {
    category: 'input',
    tier: 'universal',
    description: 'Date and time selection calendar. Use for scheduling events, setting deadlines, or picking dates.',
    config: {
      mode: '"single" | "range" (default: "single")',
      includeTime: 'boolean (default: false)',
      minDate: 'string (ISO date)',
      maxDate: 'string (ISO date)'
    },
    outputs: ['selectedDate', 'dateRange'],
    useCases: ['event scheduling', 'deadline picker', 'date range selection', 'availability calendar']
  },

  'tag-cloud': {
    category: 'display',
    tier: 'universal',
    description: 'Weighted tag visualization showing popular topics or categories. Use for showing trending topics or keyword frequency.',
    config: {
      maxTags: 'number (default: 20)',
      minWeight: 'number (default: 1)',
      colorScheme: '"default" | "rainbow" (default: "default")'
    },
    inputs: ['tags'],
    useCases: ['trending topics', 'popular tags', 'keyword visualization', 'category frequency']
  },

  'map-view': {
    category: 'display',
    tier: 'universal',
    description: 'Geographic map visualization (campus map placeholder). Use for location-based features.',
    config: {
      center: '{lat, lng} (optional)',
      zoom: 'number (default: 15)',
      markers: 'array of {lat, lng, label} (optional)'
    },
    inputs: ['locations'],
    useCases: ['campus map', 'event locations', 'building finder', 'location picker']
  },

  'chart-display': {
    category: 'display',
    tier: 'universal',
    description: 'Data visualization charts (bar, line, pie). Use for showing statistics, trends, or analytics.',
    config: {
      chartType: '"bar" | "line" | "pie" (required)',
      title: 'string (optional)',
      showLegend: 'boolean (default: true)'
    },
    inputs: ['data'],
    useCases: ['analytics dashboard', 'voting results', 'poll statistics', 'attendance tracking']
  },

  'form-builder': {
    category: 'input',
    tier: 'universal',
    description: 'Dynamic form with custom fields. Use for collecting structured data, surveys, or sign-ups.',
    config: {
      fields: 'array of {name, type, label, required?, options?} (required)',
      submitButtonText: 'string (default: "Submit")',
      showValidation: 'boolean (default: true)'
    },
    outputs: ['formData', 'submittedData'],
    useCases: ['event RSVP', 'feedback form', 'registration', 'survey', 'data collection']
  },

  'countdown-timer': {
    category: 'display',
    tier: 'universal',
    description: 'Countdown to a specific date/time. Use for event countdowns, deadlines, or time-limited activities.',
    config: {
      targetDate: 'string (ISO date, required)',
      showDays: 'boolean (default: true)',
      showSeconds: 'boolean (default: true)',
      completedMessage: 'string (default: "Time\'s up!")'
    },
    outputs: ['timeRemaining', 'isComplete'],
    useCases: ['event countdown', 'deadline timer', 'launch countdown', 'sale timer']
  },

  'timer': {
    category: 'display',
    tier: 'universal',
    description: 'Stopwatch/timer that counts up or down. Use for timed activities, study sessions, or meetings.',
    config: {
      mode: '"stopwatch" | "countdown" (default: "stopwatch")',
      initialSeconds: 'number (default: 0)',
      autoStart: 'boolean (default: false)'
    },
    outputs: ['elapsedTime', 'isRunning'],
    useCases: ['study timer', 'meeting timer', 'exercise timer', 'presentation timer']
  },

  'counter': {
    category: 'input',
    tier: 'universal',
    description: 'Simple numeric counter with increment/decrement. Use for counting attendees, votes, or quantities.',
    config: {
      initialValue: 'number (default: 0)',
      min: 'number (optional)',
      max: 'number (optional)',
      step: 'number (default: 1)',
      label: 'string (optional)'
    },
    outputs: ['count', 'value'],
    useCases: ['headcount', 'inventory tracking', 'vote counter', 'quantity selector']
  },

  'poll-element': {
    category: 'input',
    tier: 'universal',
    description: 'Interactive poll/voting element. Use for gathering opinions, making group decisions, or voting.',
    config: {
      question: 'string (required)',
      options: 'array of strings (required)',
      allowMultiple: 'boolean (default: false)',
      showResults: 'boolean (default: true)',
      allowChangeVote: 'boolean (default: false)'
    },
    outputs: ['votes', 'selectedOption', 'results'],
    useCases: ['quick polls', 'voting', 'decision making', 'feedback', 'lunch poll']
  },

  'leaderboard': {
    category: 'display',
    tier: 'universal',
    description: 'Ranked list showing scores/standings. Use for competitions, gamification, or rankings.',
    config: {
      title: 'string (optional)',
      maxEntries: 'number (default: 10)',
      showRank: 'boolean (default: true)',
      highlightTop: 'number (default: 3)'
    },
    inputs: ['entries'],
    useCases: ['competition standings', 'top contributors', 'game scores', 'achievement rankings']
  },

  'notification-center': {
    category: 'display',
    tier: 'universal',
    description: 'Real-time notifications feed. Use for showing updates, alerts, or activity streams.',
    config: {
      maxItems: 'number (default: 20)',
      showUnreadOnly: 'boolean (default: false)',
      enableRealtime: 'boolean (default: true)'
    },
    inputs: ['notifications'],
    useCases: ['activity feed', 'updates stream', 'announcements', 'alerts']
  },

  // ═══════════════════════════════════════════════════════════════
  // CONNECTED ELEMENTS - Require data source connection
  // ═══════════════════════════════════════════════════════════════

  'event-picker': {
    category: 'input',
    tier: 'connected',
    description: 'Select from campus/space events. Use for linking tools to specific events.',
    config: {
      scope: '"campus" | "space" (default: "space")',
      allowMultiple: 'boolean (default: false)',
      showPastEvents: 'boolean (default: false)'
    },
    outputs: ['selectedEvent', 'eventId'],
    useCases: ['event selection', 'RSVP target', 'event linking', 'calendar integration']
  },

  'space-picker': {
    category: 'input',
    tier: 'connected',
    description: 'Select from campus spaces/organizations. Use for cross-space features or targeting.',
    config: {
      allowMultiple: 'boolean (default: false)',
      filterByCategory: 'string[] (optional)',
      showMemberCount: 'boolean (default: true)'
    },
    outputs: ['selectedSpace', 'spaceId'],
    useCases: ['space selection', 'cross-posting', 'collaboration', 'space linking']
  },

  'user-selector': {
    category: 'input',
    tier: 'connected',
    description: 'Campus user picker with search and multi-select. Use for inviting members, assigning people, or building teams.',
    config: {
      allowMultiple: 'boolean (default: true)',
      maxSelections: 'number (optional)',
      filterByRole: 'string[] (optional)',
      placeholder: 'string (default: "Select users...")'
    },
    outputs: ['selectedUsers', 'userIds'],
    useCases: ['invite attendees', 'assign tasks', 'build team', 'select members', 'RSVP list']
  },

  'rsvp-button': {
    category: 'input',
    tier: 'connected',
    description: 'RSVP/attendance button for events. Use for event sign-ups with optional capacity limits.',
    config: {
      eventId: 'string (required)',
      maxAttendees: 'number (optional)',
      showCount: 'boolean (default: true)',
      confirmationMessage: 'string (optional)'
    },
    outputs: ['isAttending', 'attendeeCount'],
    useCases: ['event RSVP', 'meeting signup', 'workshop registration', 'attendance tracking']
  },

  'connection-list': {
    category: 'display',
    tier: 'connected',
    description: 'Display user connections/friends. Use for social features or networking.',
    config: {
      showMutualConnections: 'boolean (default: false)',
      maxDisplay: 'number (default: 10)',
      allowConnect: 'boolean (default: true)'
    },
    inputs: ['users'],
    useCases: ['friend list', 'mutual connections', 'networking', 'social graph']
  },

  // ═══════════════════════════════════════════════════════════════
  // SPACE ELEMENTS - Space-specific, require space context
  // ═══════════════════════════════════════════════════════════════

  'member-list': {
    category: 'display',
    tier: 'space',
    description: 'Display space members with roles. Use for member directories or team views.',
    config: {
      showRoles: 'boolean (default: true)',
      showJoinDate: 'boolean (default: false)',
      maxDisplay: 'number (default: 20)',
      groupByRole: 'boolean (default: false)'
    },
    inputs: ['members'],
    useCases: ['member directory', 'team roster', 'leadership display', 'active members']
  },

  'member-selector': {
    category: 'input',
    tier: 'space',
    description: 'Select members from current space. Use for space-specific assignments or mentions.',
    config: {
      allowMultiple: 'boolean (default: true)',
      filterByRole: 'string[] (optional)',
      excludeSelf: 'boolean (default: false)'
    },
    outputs: ['selectedMembers', 'memberIds'],
    useCases: ['assign to member', 'mention members', 'team building', 'task assignment']
  },

  'space-events': {
    category: 'display',
    tier: 'space',
    description: 'Display upcoming events for current space. Use for event calendars or schedules.',
    config: {
      maxEvents: 'number (default: 5)',
      showPast: 'boolean (default: false)',
      layout: '"list" | "calendar" | "cards" (default: "list")'
    },
    inputs: ['events'],
    useCases: ['upcoming events', 'event calendar', 'schedule display', 'event list']
  },

  'space-feed': {
    category: 'display',
    tier: 'space',
    description: 'Display recent posts/activity from space. Use for activity feeds or updates.',
    config: {
      maxPosts: 'number (default: 10)',
      showComments: 'boolean (default: false)',
      allowPosting: 'boolean (default: false)'
    },
    inputs: ['posts'],
    useCases: ['activity feed', 'announcements', 'updates', 'discussion']
  },

  'space-stats': {
    category: 'display',
    tier: 'space',
    description: 'Display space statistics and metrics. Use for dashboards or status displays.',
    config: {
      metrics: 'array of "members" | "events" | "posts" | "activity" (default: all)',
      layout: '"grid" | "row" (default: "grid")'
    },
    inputs: ['stats'],
    useCases: ['space dashboard', 'activity metrics', 'engagement stats', 'growth tracking']
  },

  'announcement': {
    category: 'display',
    tier: 'space',
    description: 'Prominent announcement banner. Use for important messages or alerts.',
    config: {
      title: 'string (required)',
      message: 'string (required)',
      type: '"info" | "warning" | "success" | "urgent" (default: "info")',
      dismissible: 'boolean (default: true)'
    },
    outputs: ['isDismissed'],
    useCases: ['important announcements', 'alerts', 'notifications', 'updates']
  },

  'role-gate': {
    category: 'layout',
    tier: 'space',
    description: 'Show/hide content based on user role. Use for leader-only or member-only features.',
    config: {
      allowedRoles: 'array of "leader" | "admin" | "moderator" | "member" (required)',
      fallbackMessage: 'string (default: "You don\'t have permission to view this")'
    },
    outputs: ['hasAccess'],
    useCases: ['admin controls', 'leader features', 'member-only content', 'permissions']
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOM ELEMENTS - AI-generated HTML/CSS/JS for unique needs
  // ═══════════════════════════════════════════════════════════════

  'custom-block': {
    category: 'action',
    tier: 'universal',
    description: 'AI-generated custom HTML/CSS/JS component for unique UI needs not covered by native elements. Use ONLY when native elements cannot achieve the desired functionality. Examples: custom visualizations (bingo cards, flip countdown, hand-drawn charts), specialized interactions (drag-and-drop games, custom animations), branded components with specific styling.',
    config: {
      metadata: 'object with { name, description, createdBy, createdAt, updatedAt }',
      code: 'object with { html, css, js, hash }',
      manifest: 'object with { actions, inputs, outputs, stateSchema }'
    },
    outputs: ['Defined in manifest'],
    useCases: ['bingo card game', 'flip-style countdown', 'custom data viz', 'unique animations', 'branded UI components', 'specialized interactions not available in native elements']
  }
} as const;

/**
 * System prompt for Gemini model
 */
export const SYSTEM_PROMPT = `You are an expert at generating campus tool configurations for HIVE, a student-built campus platform.

Your task is to convert natural language descriptions into ToolComposition JSON structures that define interactive campus tools.

# Available Element Types

${Object.entries(ELEMENT_CATALOG).map(([id, spec]) => `
## ${id} (${spec.category})
${spec.description}

**Config**: ${JSON.stringify(spec.config, null, 2)}
**Outputs**: ${'outputs' in spec ? spec.outputs.join(', ') : 'N/A'}
**Inputs**: ${'inputs' in spec ? spec.inputs.join(', ') : 'N/A'}
**Use Cases**: ${spec.useCases.join(', ')}
`).join('\n')}

# Output Format

You must respond with a JSON object following this exact schema:

{
  "type": "element_added" | "generation_complete",
  "element"?: {
    "elementId": string,
    "instanceId": string,
    "config": Record<string, any>,
    "position": { "x": number, "y": number },
    "size": { "width": number, "height": number }
  },
  "composition"?: {
    "name": string,
    "description": string,
    "elements": array,
    "connections": array,
    "layout": "grid" | "flow" | "tabs" | "sidebar"
  },
  "status"?: string
}

# Streaming Protocol

For streaming responses, emit ONE element at a time:

1. First message: { "type": "element_added", "element": {...}, "status": "Adding search input..." }
2. Next message: { "type": "element_added", "element": {...}, "status": "Adding filter selector..." }
3. Final message: { "type": "generation_complete", "composition": {...} }

# Layout Rules

**Positioning**:
- Start at (0, 0) for first element
- Input elements on left side (x: 0-280)
- Display elements on right side (x: 320-600)
- Vertical spacing: 160px between elements
- Standard element size: 280x140 (can adjust for content)

**Connections**:
- Wire inputs to outputs when data flow is needed
- Example: search-input.query → result-list.items
- Example: filter-selector.filters → result-list.items
- Example: form-builder.submittedData → result-list.items

**Layout Types**:
- "flow": Linear data flow (input → processing → display)
- "grid": Grid arrangement (dashboards, analytics)
- "tabs": Tabbed interface (multi-view tools)
- "sidebar": Sidebar + main content

# Campus Context

Remember these are CAMPUS TOOLS for student organizations. Common requests:
- Event RSVP systems
- Feedback/survey forms
- Member directories
- Resource booking
- Anonymous submissions
- Polls/voting
- Announcement boards

Always optimize for:
- Mobile-first (students use phones)
- Quick interactions (< 30 seconds)
- Campus-specific needs (org management, event coordination)

# Examples

## Example 1: Event RSVP Tool

User: "Create an event RSVP form with meal preferences"

Response (streaming):

Message 1:
\`\`\`json
{
  "type": "element_added",
  "element": {
    "elementId": "form-builder",
    "instanceId": "elem_001",
    "config": {
      "fields": [
        { "name": "name", "type": "text", "label": "Full Name", "required": true },
        { "name": "email", "type": "email", "label": "Email", "required": true },
        { "name": "meal", "type": "select", "label": "Meal Preference", "required": false, "options": ["Vegan", "Vegetarian", "No Preference"] }
      ],
      "submitButtonText": "Submit RSVP"
    },
    "position": { "x": 0, "y": 0 },
    "size": { "width": 280, "height": 200 }
  },
  "status": "Adding RSVP form..."
}
\`\`\`

Message 2:
\`\`\`json
{
  "type": "element_added",
  "element": {
    "elementId": "result-list",
    "instanceId": "elem_002",
    "config": {
      "itemsPerPage": 20,
      "showPagination": true
    },
    "position": { "x": 320, "y": 0 },
    "size": { "width": 280, "height": 300 }
  },
  "status": "Adding attendee list..."
}
\`\`\`

Message 3 (final):
\`\`\`json
{
  "type": "generation_complete",
  "composition": {
    "name": "Event RSVP Manager",
    "description": "Collect event RSVPs with meal preferences and view attendee list",
    "elements": [
      {
        "elementId": "form-builder",
        "instanceId": "elem_001",
        "config": {
          "fields": [
            { "name": "name", "type": "text", "label": "Full Name", "required": true },
            { "name": "email", "type": "email", "label": "Email", "required": true },
            { "name": "meal", "type": "select", "label": "Meal Preference", "required": false, "options": ["Vegan", "Vegetarian", "No Preference"] }
          ],
          "submitButtonText": "Submit RSVP"
        },
        "position": { "x": 0, "y": 0 },
        "size": { "width": 280, "height": 200 }
      },
      {
        "elementId": "result-list",
        "instanceId": "elem_002",
        "config": {
          "itemsPerPage": 20,
          "showPagination": true
        },
        "position": { "x": 320, "y": 0 },
        "size": { "width": 280, "height": 300 }
      }
    ],
    "connections": [
      {
        "from": { "instanceId": "elem_001", "output": "submittedData" },
        "to": { "instanceId": "elem_002", "input": "items" }
      }
    ],
    "layout": "flow"
  }
}
\`\`\`

## Example 2: Room Booking Tool

User: "Build a room finder for studying with date/time selection"

Response (streaming):

Message 1:
\`\`\`json
{
  "type": "element_added",
  "element": {
    "elementId": "date-picker",
    "instanceId": "elem_001",
    "config": {
      "mode": "single",
      "showTime": true,
      "minDate": "${new Date().toISOString().split('T')[0]}"
    },
    "position": { "x": 0, "y": 0 },
    "size": { "width": 280, "height": 140 }
  },
  "status": "Adding date/time picker..."
}
\`\`\`

Message 2:
\`\`\`json
{
  "type": "element_added",
  "element": {
    "elementId": "filter-selector",
    "instanceId": "elem_002",
    "config": {
      "options": [
        { "value": "library", "label": "Library" },
        { "value": "student-union", "label": "Student Union" },
        { "value": "academic-buildings", "label": "Academic Buildings" }
      ],
      "allowMultiple": false
    },
    "position": { "x": 0, "y": 160 },
    "size": { "width": 280, "height": 120 }
  },
  "status": "Adding location filter..."
}
\`\`\`

Message 3:
\`\`\`json
{
  "type": "element_added",
  "element": {
    "elementId": "result-list",
    "instanceId": "elem_003",
    "config": {
      "itemsPerPage": 10
    },
    "position": { "x": 320, "y": 0 },
    "size": { "width": 280, "height": 300 }
  },
  "status": "Adding available rooms list..."
}
\`\`\`

Message 4 (final):
\`\`\`json
{
  "type": "generation_complete",
  "composition": {
    "name": "Study Room Finder",
    "description": "Find and book study rooms by date, time, and location",
    "elements": [
      {
        "elementId": "date-picker",
        "instanceId": "elem_001",
        "config": {
          "mode": "single",
          "showTime": true,
          "minDate": "${new Date().toISOString().split('T')[0]}"
        },
        "position": { "x": 0, "y": 0 },
        "size": { "width": 280, "height": 140 }
      },
      {
        "elementId": "filter-selector",
        "instanceId": "elem_002",
        "config": {
          "options": [
            { "value": "library", "label": "Library" },
            { "value": "student-union", "label": "Student Union" },
            { "value": "academic-buildings", "label": "Academic Buildings" }
          ],
          "allowMultiple": false
        },
        "position": { "x": 0, "y": 160 },
        "size": { "width": 280, "height": 120 }
      },
      {
        "elementId": "result-list",
        "instanceId": "elem_003",
        "config": {
          "itemsPerPage": 10
        },
        "position": { "x": 320, "y": 0 },
        "size": { "width": 280, "height": 300 }
      }
    ],
    "connections": [
      {
        "from": { "instanceId": "elem_001", "output": "selectedDate" },
        "to": { "instanceId": "elem_003", "input": "items" }
      },
      {
        "from": { "instanceId": "elem_002", "output": "filters" },
        "to": { "instanceId": "elem_003", "input": "items" }
      }
    ],
    "layout": "flow"
  }
}
\`\`\`

# Important Guidelines

1. **Keep it simple**: Most campus tools need 2-4 elements max
2. **Think mobile**: Design for vertical scrolling, not complex layouts
3. **Wire connections**: Always connect element outputs to inputs when data flows
4. **Use unique instanceIds**: Format as "elem_001", "elem_002", etc.
5. **Provide status**: Include helpful status messages during streaming
6. **Default configs**: Use sensible defaults, don't over-configure
7. **Campus context**: Remember these are for student orgs, not enterprises

# Hybrid Compositions: Native vs Custom Elements

**PREFER NATIVE ELEMENTS FIRST**. Custom blocks add complexity and should only be used when native elements cannot achieve the desired result.

**Use Native Elements When:**
- Standard campus tool patterns (polls, RSVPs, forms, directories)
- Data display (lists, charts, leaderboards)
- Common interactions (voting, countdown, counters)
- User selection, filtering, search
- 95% of campus tool requests

**Use Custom Blocks When:**
- Unique visual patterns not available natively (bingo cards, flip animations, custom grids)
- Specialized interactions (drag-and-drop games, drawing tools, gesture-based UI)
- Custom data visualizations (hand-drawn charts, unique graph styles)
- Branded components with very specific styling requirements
- Complex animations or transitions not supported by native elements

**Custom Block Code Generation:**
When generating custom block code, ALWAYS use HIVE design tokens:

\`\`\`css
/* Available CSS Variables */
--hive-color-gold, --hive-color-black, --hive-color-white
--hive-gray-{50,100,200,300,400,500,600,700,800,900,950}
--hive-bg-{ground,surface,surface-hover,surface-active}
--hive-text-{primary,secondary,tertiary,disabled}
--hive-border-{default,subtle,hover,focus}
--hive-spacing-{1,2,3,4,5,6,8,10,12,16,20,24}
--hive-radius-{sm,md,lg,xl,2xl,full}
--hive-font-size-{xs,sm,base,lg,xl,2xl,3xl,4xl}
--hive-shadow-{sm,md,lg,gold-glow}
--hive-duration-{fast,base,slow}
--hive-ease-{in-out,out,in}
\`\`\`

**Utility Classes Available:**
- \`.hive-btn\`, \`.hive-btn-primary\`, \`.hive-btn-secondary\`
- \`.hive-card\`
- \`.hive-input\`
- \`.hive-text-{primary,secondary,tertiary}\`

**Example Custom Block CSS:**
\`\`\`css
.my-element {
  background: var(--hive-bg-surface);
  border: 1px solid var(--hive-border-default);
  border-radius: var(--hive-radius-lg);
  padding: var(--hive-spacing-4);
  color: var(--hive-text-primary);
  transition: all var(--hive-duration-base) var(--hive-ease-in-out);
}

.my-element:hover {
  border-color: var(--hive-border-hover);
  background: var(--hive-bg-surface-hover);
}

button {
  background: var(--hive-color-gold);
  color: var(--hive-color-black);
  padding: var(--hive-spacing-2) var(--hive-spacing-4);
  border-radius: var(--hive-radius-lg);
}
\`\`\`

# CRITICAL: Element ID Format

**NEVER add numeric suffixes to elementId values!**

- CORRECT: \`"elementId": "date-picker"\`
- WRONG: \`"elementId": "date-picker-1"\` ← DO NOT DO THIS!
- WRONG: \`"elementId": "user-selector-2"\` ← DO NOT DO THIS!

The \`elementId\` must EXACTLY match one of the available element types listed above.
Use \`instanceId\` (like "elem_001", "elem_002") to distinguish multiple instances of the same element type.

**Valid elementId values (use EXACTLY as written):**
- Universal: search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, chart-display, form-builder, countdown-timer, timer, counter, poll-element, leaderboard, notification-center
- Connected: event-picker, space-picker, user-selector, rsvp-button, connection-list
- Space: member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate
- Custom: custom-block (AI-generated HTML/CSS/JS, use sparingly when native elements insufficient)

Now convert the user's prompt into a ToolComposition!`;

/**
 * Generate instance ID for elements
 */
export function generateInstanceId(index: number): string {
  return `elem_${String(index).padStart(3, '0')}`;
}

/**
 * Example demo prompts for landing page
 */
export const DEMO_PROMPTS = [
  'Create an event RSVP form with meal preferences and dietary restrictions',
  'Build an anonymous feedback tool for club meetings',
  'Make a room finder for group study sessions',
  'Design a poll for voting on club logo designs',
  'Create a member directory with search and filters'
] as const;

export type StreamingMessage =
  | { type: 'element_added'; element: any; status: string }
  | { type: 'generation_complete'; composition: ToolComposition };
