/**
 * Template to Training Examples Converter
 *
 * Extracts training examples from existing HiveLab templates.
 * Generates multiple prompt variations for each template composition.
 *
 * Usage:
 *   pnpm tsx packages/core/src/hivelab/goose/training/templates-to-examples.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { TrainingExample, ToolComposition, CanvasElement, Connection } from './generate-dataset';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SystemToolTemplate {
  id: string;
  name: string;
  description: string;
  elementType: string;
  defaultConfig: Record<string, unknown>;
  category: string;
}

interface UniversalTemplate {
  id: string;
  name: string;
  description: string;
  slots: Array<{
    slotId: string;
    toolId: string;
    name: string;
    type: string;
    order: number;
    config: Record<string, unknown>;
  }>;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE DATA (extracted from system-tool-templates.ts)
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_TOOL_TEMPLATES: SystemToolTemplate[] = [
  {
    id: 'system:about',
    name: 'About',
    description: 'Space description, member count, and online status',
    elementType: 'space-stats',
    defaultConfig: {
      showMembers: true,
      showOnline: true,
      showDescription: true,
    },
    category: 'essential',
  },
  {
    id: 'system:events',
    name: 'Upcoming Events',
    description: 'Next events with RSVP buttons',
    elementType: 'space-events',
    defaultConfig: {
      maxEvents: 5,
      showRsvp: true,
      showDate: true,
      showAttendees: true,
    },
    category: 'essential',
  },
  {
    id: 'system:members',
    name: 'Members',
    description: 'Member list with online status and roles',
    elementType: 'member-list',
    defaultConfig: {
      maxVisible: 8,
      showRoles: true,
      showOnlineStatus: true,
    },
    category: 'essential',
  },
  {
    id: 'system:poll',
    name: 'Quick Poll',
    description: 'Interactive poll for member voting',
    elementType: 'poll-element',
    defaultConfig: {
      question: '',
      options: [],
      allowMultipleVotes: false,
      showResults: true,
    },
    category: 'engagement',
  },
  {
    id: 'system:countdown',
    name: 'Countdown',
    description: 'Timer to upcoming event or deadline',
    elementType: 'countdown-timer',
    defaultConfig: {
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    category: 'engagement',
  },
  {
    id: 'system:links',
    name: 'Quick Links',
    description: 'Important links and resources',
    elementType: 'result-list',
    defaultConfig: {
      style: 'compact',
      maxItems: 10,
    },
    category: 'engagement',
  },
  {
    id: 'system:announcements',
    name: 'Announcements',
    description: 'Pinned announcements feed',
    elementType: 'announcement',
    defaultConfig: {
      maxItems: 5,
      showTimestamp: true,
    },
    category: 'engagement',
  },
  {
    id: 'system:leaderboard',
    name: 'Leaderboard',
    description: 'Member rankings and scores',
    elementType: 'leaderboard',
    defaultConfig: {
      maxEntries: 10,
      showRankChange: true,
    },
    category: 'engagement',
  },
  {
    id: 'system:availability',
    name: 'Availability',
    description: 'Member availability heatmap for scheduling',
    elementType: 'availability-heatmap',
    defaultConfig: {
      showSuggestions: true,
      timeFormat: '12h',
      startHour: 8,
      endHour: 22,
    },
    category: 'info',
  },
];

// ═══════════════════════════════════════════════════════════════════
// PROMPT VARIATIONS
// ═══════════════════════════════════════════════════════════════════

const ELEMENT_PROMPT_VARIATIONS: Record<string, string[]> = {
  'space-stats': [
    'show space info',
    'about this space',
    'space overview',
    'display member count',
    'space statistics',
    'show space description',
  ],
  'space-events': [
    'show upcoming events',
    'event calendar',
    'list events',
    'upcoming activities',
    'event list',
    'show schedule',
  ],
  'member-list': [
    'show members',
    'member directory',
    'list members',
    'who is in this space',
    'member roster',
    'team members',
  ],
  'poll-element': [
    'create a poll',
    'quick poll',
    'voting poll',
    'let members vote',
    'opinion poll',
    'make a poll',
  ],
  'countdown-timer': [
    'countdown timer',
    'event countdown',
    'time until',
    'days remaining',
    'countdown to event',
    'timer',
  ],
  'result-list': [
    'list display',
    'show items',
    'display results',
    'item list',
    'content list',
    'quick links',
  ],
  'announcement': [
    'announcements',
    'important updates',
    'broadcast message',
    'pinned messages',
    'space announcements',
    'news',
  ],
  'leaderboard': [
    'leaderboard',
    'rankings',
    'top members',
    'scores',
    'member rankings',
    'activity leaderboard',
  ],
  'availability-heatmap': [
    'availability heatmap',
    'when to meet',
    'schedule finder',
    'find meeting time',
    'member availability',
    'best time to meet',
  ],
  'rsvp-button': [
    'rsvp',
    'event signup',
    'register',
    'sign up',
    'attendance',
    'going/not going',
  ],
  'form-builder': [
    'create form',
    'survey',
    'collect data',
    'registration form',
    'feedback form',
    'questionnaire',
  ],
  'chart-display': [
    'show chart',
    'data visualization',
    'graph',
    'display statistics',
    'bar chart',
    'pie chart',
  ],
  'counter': [
    'counter',
    'count tracker',
    'tally',
    'number tracker',
    'increment counter',
  ],
  'timer': [
    'stopwatch',
    'timer',
    'time tracker',
    'study timer',
    'pomodoro',
  ],
  'search-input': [
    'search box',
    'find',
    'lookup',
    'search',
    'search bar',
  ],
  'filter-selector': [
    'filter',
    'categories',
    'filter options',
    'select filters',
    'refine results',
  ],
  'date-picker': [
    'date picker',
    'select date',
    'calendar picker',
    'choose date',
    'schedule date',
  ],
  'user-selector': [
    'select users',
    'pick members',
    'choose people',
    'user picker',
    'member selector',
  ],
  'tag-cloud': [
    'tag cloud',
    'topics',
    'keywords',
    'popular tags',
    'tag display',
  ],
  'map-view': [
    'map',
    'location',
    'venue map',
    'show location',
    'campus map',
  ],
  'notification-center': [
    'notifications',
    'alerts',
    'updates',
    'activity feed',
    'notification list',
  ],
  'role-gate': [
    'access control',
    'admin only',
    'restrict access',
    'role based',
    'permission gate',
  ],
  'event-picker': [
    'select event',
    'choose event',
    'event selector',
    'pick event',
    'browse events',
  ],
  'space-picker': [
    'select space',
    'choose space',
    'space selector',
    'pick space',
    'browse spaces',
  ],
  'connection-list': [
    'connections',
    'contacts',
    'friends',
    'network',
    'people you know',
  ],
  'member-selector': [
    'select members',
    'pick members',
    'member picker',
    'choose from space',
    'team selector',
  ],
  'space-feed': [
    'activity feed',
    'recent posts',
    'space updates',
    'post feed',
    'news feed',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSED TOOL TEMPLATES
// ═══════════════════════════════════════════════════════════════════

interface ComposedTemplate {
  name: string;
  description: string;
  prompts: string[];
  elements: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  connections: Array<{
    fromType: string;
    fromPort: string;
    toType: string;
    toPort: string;
  }>;
}

const COMPOSED_TEMPLATES: ComposedTemplate[] = [
  {
    name: 'Event RSVP with Countdown',
    description: 'Event registration with countdown timer',
    prompts: [
      'event rsvp with countdown',
      'signup with timer',
      'registration and countdown',
      'rsvp and time until event',
    ],
    elements: [
      {
        type: 'rsvp-button',
        config: {
          eventName: 'Event',
          showAttendeeCount: true,
          enableWaitlist: true,
        },
      },
      {
        type: 'countdown-timer',
        config: {
          title: 'Event Starts In',
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
        },
      },
    ],
    connections: [],
  },
  {
    name: 'Poll with Results Chart',
    description: 'Interactive poll with visual results',
    prompts: [
      'poll with chart',
      'voting with visualization',
      'poll and results chart',
      'visual poll results',
    ],
    elements: [
      {
        type: 'poll-element',
        config: {
          question: 'What do you prefer?',
          options: ['Option A', 'Option B', 'Option C'],
          showResults: true,
        },
      },
      {
        type: 'chart-display',
        config: {
          chartType: 'bar',
          title: 'Poll Results',
          showLegend: true,
        },
      },
    ],
    connections: [
      {
        fromType: 'poll-element',
        fromPort: 'results',
        toType: 'chart-display',
        toPort: 'data',
      },
    ],
  },
  {
    name: 'Search with Filters',
    description: 'Search input with category filters',
    prompts: [
      'search with filters',
      'searchable list with categories',
      'filtered search',
      'search and filter',
    ],
    elements: [
      {
        type: 'search-input',
        config: {
          placeholder: 'Search...',
          showSuggestions: true,
        },
      },
      {
        type: 'filter-selector',
        config: {
          options: [
            { value: 'all', label: 'All' },
            { value: 'recent', label: 'Recent' },
            { value: 'popular', label: 'Popular' },
          ],
          allowMultiple: true,
        },
      },
      {
        type: 'result-list',
        config: {
          itemsPerPage: 10,
          showPagination: true,
        },
      },
    ],
    connections: [
      {
        fromType: 'search-input',
        fromPort: 'query',
        toType: 'result-list',
        toPort: 'items',
      },
      {
        fromType: 'filter-selector',
        fromPort: 'filters',
        toType: 'result-list',
        toPort: 'items',
      },
    ],
  },
  {
    name: 'Feedback Collection',
    description: 'Feedback form with response display',
    prompts: [
      'feedback form with responses',
      'collect feedback and show results',
      'feedback collection tool',
      'survey with response list',
    ],
    elements: [
      {
        type: 'form-builder',
        config: {
          fields: [
            { name: 'feedback', type: 'textarea', label: 'Your Feedback', required: true },
            { name: 'rating', type: 'select', label: 'Rating', options: ['1', '2', '3', '4', '5'] },
          ],
          submitButtonText: 'Submit Feedback',
        },
      },
      {
        type: 'result-list',
        config: {
          itemsPerPage: 5,
          showPagination: true,
        },
      },
    ],
    connections: [
      {
        fromType: 'form-builder',
        fromPort: 'submittedData',
        toType: 'result-list',
        toPort: 'items',
      },
    ],
  },
  {
    name: 'Meeting Scheduler',
    description: 'Availability finder with date picker',
    prompts: [
      'meeting scheduler',
      'find meeting time',
      'availability finder',
      'schedule meeting',
      'when2meet',
    ],
    elements: [
      {
        type: 'availability-heatmap',
        config: {
          showSuggestions: true,
          timeFormat: '12h',
          startHour: 9,
          endHour: 17,
        },
      },
      {
        type: 'date-picker',
        config: {
          mode: 'single',
          showTime: true,
        },
      },
    ],
    connections: [],
  },
  {
    name: 'Member Engagement Dashboard',
    description: 'Space stats with leaderboard',
    prompts: [
      'engagement dashboard',
      'member activity tracker',
      'space engagement stats',
      'participation leaderboard',
    ],
    elements: [
      {
        type: 'space-stats',
        config: {
          metrics: ['members', 'posts', 'events'],
          showTrends: true,
        },
      },
      {
        type: 'leaderboard',
        config: {
          title: 'Top Contributors',
          maxEntries: 10,
          showRankChange: true,
        },
      },
    ],
    connections: [],
  },
  {
    name: 'Event Check-in',
    description: 'RSVP with attendee counter and list',
    prompts: [
      'event check-in',
      'attendance tracker',
      'rsvp with attendee list',
      'event sign-in',
    ],
    elements: [
      {
        type: 'rsvp-button',
        config: {
          eventName: 'Event',
          showAttendeeCount: true,
        },
      },
      {
        type: 'counter',
        config: {
          label: 'Checked In',
          initialValue: 0,
          minValue: 0,
        },
      },
      {
        type: 'result-list',
        config: {
          itemsPerPage: 20,
        },
      },
    ],
    connections: [
      {
        fromType: 'rsvp-button',
        fromPort: 'attendees',
        toType: 'result-list',
        toPort: 'items',
      },
    ],
  },
  {
    name: 'Study Session Timer',
    description: 'Timer with session counter',
    prompts: [
      'study timer',
      'pomodoro timer',
      'focus session tracker',
      'study session timer',
    ],
    elements: [
      {
        type: 'timer',
        config: {
          autoStart: false,
          targetDuration: 1500,
        },
      },
      {
        type: 'counter',
        config: {
          label: 'Sessions',
          initialValue: 0,
        },
      },
    ],
    connections: [],
  },
];

// ═══════════════════════════════════════════════════════════════════
// CONVERSION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getDefaultSize(elementType: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    'search-input': { width: 280, height: 60 },
    'date-picker': { width: 280, height: 140 },
    'user-selector': { width: 280, height: 100 },
    'form-builder': { width: 280, height: 200 },
    'filter-selector': { width: 280, height: 80 },
    'result-list': { width: 280, height: 300 },
    'chart-display': { width: 320, height: 240 },
    'tag-cloud': { width: 300, height: 200 },
    'map-view': { width: 400, height: 300 },
    'notification-center': { width: 320, height: 400 },
    'poll-element': { width: 300, height: 200 },
    'rsvp-button': { width: 240, height: 120 },
    'countdown-timer': { width: 280, height: 140 },
    'leaderboard': { width: 280, height: 320 },
    'counter': { width: 160, height: 100 },
    'timer': { width: 200, height: 120 },
    'role-gate': { width: 300, height: 150 },
    'event-picker': { width: 300, height: 200 },
    'space-picker': { width: 300, height: 200 },
    'connection-list': { width: 280, height: 300 },
    'member-list': { width: 280, height: 350 },
    'member-selector': { width: 280, height: 150 },
    'space-events': { width: 300, height: 280 },
    'space-feed': { width: 300, height: 350 },
    'space-stats': { width: 300, height: 200 },
    'announcement': { width: 320, height: 180 },
    'availability-heatmap': { width: 400, height: 320 },
  };
  return sizes[elementType] || { width: 280, height: 200 };
}

function generatePosition(index: number): { x: number; y: number } {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: 100 + col * 340,
    y: 100 + row * 250,
  };
}

function generateInstanceId(elementType: string, index: number): string {
  return `${elementType.replace(/-/g, '_')}_${index}`;
}

function convertSystemTemplateToExamples(template: SystemToolTemplate): TrainingExample[] {
  const examples: TrainingExample[] = [];
  const prompts = ELEMENT_PROMPT_VARIATIONS[template.elementType] || [template.description];

  for (const prompt of prompts) {
    const element: CanvasElement = {
      type: template.elementType,
      instanceId: generateInstanceId(template.elementType, 1),
      config: { ...template.defaultConfig },
      position: generatePosition(0),
      size: getDefaultSize(template.elementType),
    };

    examples.push({
      prompt,
      output: {
        elements: [element],
        connections: [],
        name: template.name,
        description: template.description,
        layout: 'grid',
      },
    });
  }

  return examples;
}

function convertComposedTemplateToExamples(template: ComposedTemplate): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const prompt of template.prompts) {
    const elements: CanvasElement[] = template.elements.map((el, index) => ({
      type: el.type,
      instanceId: generateInstanceId(el.type, index + 1),
      config: { ...el.config },
      position: generatePosition(index),
      size: getDefaultSize(el.type),
    }));

    const connections: Connection[] = template.connections.map(conn => {
      const fromElement = elements.find(el => el.type === conn.fromType);
      const toElement = elements.find(el => el.type === conn.toType);

      return {
        from: {
          instanceId: fromElement?.instanceId || '',
          port: conn.fromPort,
        },
        to: {
          instanceId: toElement?.instanceId || '',
          port: conn.toPort,
        },
      };
    });

    examples.push({
      prompt,
      output: {
        elements,
        connections,
        name: template.name,
        description: template.description,
        layout: elements.length > 2 ? 'flow' : 'grid',
      },
    });
  }

  return examples;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CONVERTER
// ═══════════════════════════════════════════════════════════════════

function convertAllTemplatesToExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  // Convert system tool templates
  for (const template of SYSTEM_TOOL_TEMPLATES) {
    examples.push(...convertSystemTemplateToExamples(template));
  }

  // Convert composed templates
  for (const template of COMPOSED_TEMPLATES) {
    examples.push(...convertComposedTemplateToExamples(template));
  }

  return examples;
}

function saveTemplateExamples(): void {
  const examples = convertAllTemplatesToExamples();

  // Create output directory
  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write as JSONL
  const outputPath = path.join(outputDir, 'template-examples.jsonl');
  const jsonlData = examples.map(ex => JSON.stringify({ prompt: ex.prompt, output: ex.output })).join('\n');
  fs.writeFileSync(outputPath, jsonlData);

  console.log(`Converted ${examples.length} template examples`);
  console.log(`System templates: ${SYSTEM_TOOL_TEMPLATES.length}`);
  console.log(`Composed templates: ${COMPOSED_TEMPLATES.length}`);
  console.log(`Output: ${outputPath}`);
}

// Run if executed directly (ESM-compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  saveTemplateExamples();
}

export {
  convertAllTemplatesToExamples,
  convertSystemTemplateToExamples,
  convertComposedTemplateToExamples,
  saveTemplateExamples,
  SYSTEM_TOOL_TEMPLATES,
  COMPOSED_TEMPLATES,
  ELEMENT_PROMPT_VARIATIONS,
};
