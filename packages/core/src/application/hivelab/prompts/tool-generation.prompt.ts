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
export const ELEMENT_CATALOG = {
  'search-input': {
    category: 'input',
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
    description: 'Date and time selection calendar. Use for scheduling events, setting deadlines, or picking dates.',
    config: {
      mode: '"single" | "range" (default: "single")',
      showTime: 'boolean (default: false)',
      minDate: 'string (ISO date)',
      maxDate: 'string (ISO date)'
    },
    outputs: ['selectedDate', 'dateRange'],
    useCases: ['event scheduling', 'deadline picker', 'date range selection', 'availability calendar']
  },

  'user-selector': {
    category: 'input',
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

  'tag-cloud': {
    category: 'display',
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
    description: 'Dynamic form with custom fields. Use for collecting structured data, surveys, or sign-ups.',
    config: {
      fields: 'array of {name, type, label, required?, options?} (required)',
      submitButtonText: 'string (default: "Submit")',
      showValidation: 'boolean (default: true)'
    },
    outputs: ['formData', 'submittedData'],
    useCases: ['event RSVP', 'feedback form', 'registration', 'survey', 'data collection']
  },

  'notification-center': {
    category: 'display',
    description: 'Real-time notifications feed. Use for showing updates, alerts, or activity streams.',
    config: {
      maxItems: 'number (default: 20)',
      showUnreadOnly: 'boolean (default: false)',
      enableRealtime: 'boolean (default: true)'
    },
    inputs: ['notifications'],
    useCases: ['activity feed', 'updates stream', 'announcements', 'alerts']
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
