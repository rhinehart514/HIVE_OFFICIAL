/**
 * Goose Training Data Generator
 *
 * Generates synthetic training data for fine-tuning the Goose model.
 * Creates prompt → tool composition pairs in JSONL format.
 *
 * Usage:
 *   pnpm tsx packages/core/src/hivelab/goose/training/generate-dataset.ts
 *
 * If you encounter "heap out of memory" errors, run with increased heap size:
 *   node --max-old-space-size=4096 $(which tsx) packages/core/src/hivelab/goose/training/generate-dataset.ts
 *
 * Output:
 *   packages/core/src/hivelab/goose/training/data/training.jsonl
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import elementKnowledge from './element-knowledge.json' with { type: 'json' };

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TrainingExample {
  prompt: string;
  output: ToolComposition;
}

interface ToolComposition {
  elements: CanvasElement[];
  connections: Connection[];
  name: string;
  description: string;
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

interface CanvasElement {
  type: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface Connection {
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const POLL_PROMPTS = [
  'create a poll about {topic}',
  'make a voting poll for {topic}',
  'poll to decide {topic}',
  'voting for {topic}',
  'let members vote on {topic}',
  'quick poll about {topic}',
  'opinion poll for {topic}',
  '{topic} poll',
  'poll: {topic}',
  'vote on {topic}',
];

const POLL_TOPICS = [
  'favorite study spots',
  'meeting times',
  'event themes',
  'food preferences',
  'next project ideas',
  'best library floor',
  'favorite coffee shops',
  'club activities',
  'movie night picks',
  'study music genres',
  'weekend plans',
  'lunch spots',
  'team names',
  'logo designs',
  'event dates',
  'workshop topics',
  'guest speakers',
  'fundraising ideas',
  'social activities',
  'retreat locations',
];

const POLL_OPTIONS_BY_TOPIC: Record<string, string[]> = {
  'favorite study spots': ['Library', 'Coffee shop', 'Dorm', 'Student union'],
  'meeting times': ['Monday evening', 'Wednesday afternoon', 'Friday morning', 'Weekend'],
  'event themes': ['Hawaiian Luau', 'Formal Gala', 'Costume Party', 'Game Night'],
  'food preferences': ['Pizza', 'Tacos', 'Sushi', 'Burgers'],
  'next project ideas': ['Community service', 'Fundraiser', 'Social event', 'Workshop'],
  'best library floor': ['1st floor (social)', '2nd floor (quiet)', '3rd floor (silent)', 'Basement'],
  'favorite coffee shops': ['Starbucks', 'Local cafe', 'Campus coffee', 'Dunkin'],
  'club activities': ['Sports', 'Games', 'Crafts', 'Movies'],
  'movie night picks': ['Action', 'Comedy', 'Horror', 'Drama'],
  'study music genres': ['Lo-fi', 'Classical', 'Jazz', 'Silent'],
  'weekend plans': ['Study session', 'Game night', 'Outdoor activity', 'Rest day'],
  'lunch spots': ['Campus dining', 'Food truck', 'Off-campus', 'Pack lunch'],
  'team names': ['The Innovators', 'Dream Team', 'The Wildcats', 'Phoenix Rising'],
  'logo designs': ['Option A', 'Option B', 'Option C', 'Option D'],
  'event dates': ['This Saturday', 'Next Friday', 'In two weeks', 'End of month'],
  'workshop topics': ['Resume writing', 'Interview skills', 'Networking', 'LinkedIn'],
  'guest speakers': ['Industry professional', 'Alumni', 'Professor', 'Entrepreneur'],
  'fundraising ideas': ['Bake sale', 'Car wash', 'Merchandise', 'Raffle'],
  'social activities': ['Bowling', 'Escape room', 'Trivia night', 'Karaoke'],
  'retreat locations': ['Beach', 'Mountains', 'Cabin', 'City trip'],
};

const RSVP_PROMPTS = [
  'create rsvp for {event}',
  'event signup for {event}',
  'registration for {event}',
  'sign up for {event}',
  'rsvp button for {event}',
  '{event} attendance tracker',
  'let people sign up for {event}',
  'event registration: {event}',
];

const EVENT_NAMES = [
  'weekly meeting',
  'study session',
  'game night',
  'workshop',
  'info session',
  'social mixer',
  'guest speaker event',
  'volunteer day',
  'movie night',
  'career fair prep',
  'networking event',
  'end of semester party',
  'welcome event',
  'recruitment event',
  'alumni panel',
];

const COUNTDOWN_PROMPTS = [
  'countdown to {event}',
  'timer until {event}',
  '{event} countdown',
  'days until {event}',
  'countdown timer for {event}',
  'time remaining until {event}',
];

const LEADERBOARD_PROMPTS = [
  'leaderboard for {metric}',
  'ranking of {metric}',
  'top {metric}',
  '{metric} leaderboard',
  'scores for {metric}',
  'competition rankings for {metric}',
];

const LEADERBOARD_METRICS = [
  'attendance',
  'participation',
  'points',
  'contributions',
  'event attendance',
  'volunteer hours',
  'study streaks',
  'engagement',
];

const FORM_PROMPTS = [
  'feedback form',
  'registration form',
  'survey about {topic}',
  'sign up form',
  'application form',
  'contact form',
  'interest form',
  'questionnaire about {topic}',
];

const COMBINED_PROMPTS = [
  'poll about {topic} with results chart',
  'poll with leaderboard for {topic}',
  'event rsvp with countdown for {event}',
  'rsvp and attendee list for {event}',
  'search and filter for {category}',
  'feedback form with response list',
  'study timer with session counter',
  'meeting scheduler with availability',
];

// ═══════════════════════════════════════════════════════════════════
// ELEMENT GENERATORS
// ═══════════════════════════════════════════════════════════════════

function generateInstanceId(elementType: string, index: number = 1): string {
  const prefix = elementType.replace(/-/g, '_');
  return `${prefix}_${index}`;
}

function generatePosition(index: number): { x: number; y: number } {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: 100 + col * 340,
    y: 100 + row * 250,
  };
}

function getDefaultSize(elementType: string): { width: number; height: number } {
  const element = (elementKnowledge.elements as Record<string, { default_size: { width: number; height: number } }>)[elementType];
  return element?.default_size || { width: 280, height: 200 };
}

function generatePollElement(topic: string, options: string[]): CanvasElement {
  return {
    type: 'poll-element',
    instanceId: generateInstanceId('poll-element'),
    config: {
      question: `What's your ${topic.replace('favorite ', '')}?`,
      options,
      showResults: true,
      allowMultipleVotes: false,
    },
    position: generatePosition(0),
    size: getDefaultSize('poll-element'),
  };
}

function generateRsvpElement(eventName: string, maxAttendees?: number): CanvasElement {
  return {
    type: 'rsvp-button',
    instanceId: generateInstanceId('rsvp-button'),
    config: {
      eventName: eventName.charAt(0).toUpperCase() + eventName.slice(1),
      showAttendeeCount: true,
      enableWaitlist: true,
      ...(maxAttendees && { maxAttendees }),
    },
    position: generatePosition(0),
    size: getDefaultSize('rsvp-button'),
  };
}

function generateCountdownElement(eventName: string): CanvasElement {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);

  return {
    type: 'countdown-timer',
    instanceId: generateInstanceId('countdown-timer'),
    config: {
      targetDate: futureDate.toISOString(),
      title: `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} Starts In`,
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    position: generatePosition(1),
    size: getDefaultSize('countdown-timer'),
  };
}

function generateLeaderboardElement(metric: string): CanvasElement {
  return {
    type: 'leaderboard',
    instanceId: generateInstanceId('leaderboard'),
    config: {
      title: `Top ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
      maxEntries: 10,
      showRankChange: true,
    },
    position: generatePosition(0),
    size: getDefaultSize('leaderboard'),
  };
}

function generateChartElement(title: string): CanvasElement {
  return {
    type: 'chart-display',
    instanceId: generateInstanceId('chart-display'),
    config: {
      chartType: 'bar',
      title,
      showLegend: true,
    },
    position: generatePosition(1),
    size: getDefaultSize('chart-display'),
  };
}

function generateResultListElement(): CanvasElement {
  return {
    type: 'result-list',
    instanceId: generateInstanceId('result-list'),
    config: {
      itemsPerPage: 10,
      showPagination: true,
    },
    position: generatePosition(1),
    size: getDefaultSize('result-list'),
  };
}

function generateTimerElement(): CanvasElement {
  return {
    type: 'timer',
    instanceId: generateInstanceId('timer'),
    config: {
      autoStart: false,
      showMilliseconds: false,
      targetDuration: 1500, // 25 minutes (pomodoro)
    },
    position: generatePosition(0),
    size: getDefaultSize('timer'),
  };
}

function generateCounterElement(label: string): CanvasElement {
  return {
    type: 'counter',
    instanceId: generateInstanceId('counter'),
    config: {
      initialValue: 0,
      minValue: 0,
      label,
    },
    position: generatePosition(1),
    size: getDefaultSize('counter'),
  };
}

function generateFormElement(purpose: string): CanvasElement {
  let fields: Array<{ name: string; type: string; label: string; required?: boolean; options?: string[] }> = [];

  if (purpose.includes('feedback')) {
    fields = [
      { name: 'feedback', type: 'textarea', label: 'Your Feedback', required: true },
      { name: 'rating', type: 'select', label: 'Rating', options: ['1', '2', '3', '4', '5'] },
    ];
  } else if (purpose.includes('registration') || purpose.includes('sign up')) {
    fields = [
      { name: 'name', type: 'text', label: 'Full Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
    ];
  } else {
    fields = [
      { name: 'response', type: 'textarea', label: 'Your Response', required: true },
    ];
  }

  return {
    type: 'form-builder',
    instanceId: generateInstanceId('form-builder'),
    config: {
      fields,
      submitButtonText: 'Submit',
      showValidation: true,
    },
    position: generatePosition(0),
    size: getDefaultSize('form-builder'),
  };
}

function generateSearchElement(placeholder: string): CanvasElement {
  return {
    type: 'search-input',
    instanceId: generateInstanceId('search-input'),
    config: {
      placeholder,
      showSuggestions: true,
    },
    position: generatePosition(0),
    size: getDefaultSize('search-input'),
  };
}

function generateFilterElement(options: string[]): CanvasElement {
  return {
    type: 'filter-selector',
    instanceId: generateInstanceId('filter-selector'),
    config: {
      options: options.map(opt => ({ value: opt.toLowerCase(), label: opt })),
      allowMultiple: true,
    },
    position: generatePosition(1),
    size: getDefaultSize('filter-selector'),
  };
}

function generateAvailabilityElement(): CanvasElement {
  return {
    type: 'availability-heatmap',
    instanceId: generateInstanceId('availability-heatmap'),
    config: {
      showSuggestions: true,
      timeFormat: '12h',
      startHour: 9,
      endHour: 17,
    },
    position: generatePosition(0),
    size: getDefaultSize('availability-heatmap'),
  };
}

function generateDatePickerElement(): CanvasElement {
  return {
    type: 'date-picker',
    instanceId: generateInstanceId('date-picker'),
    config: {
      mode: 'single',
      showTime: true,
    },
    position: generatePosition(1),
    size: getDefaultSize('date-picker'),
  };
}

// ═══════════════════════════════════════════════════════════════════
// TRAINING EXAMPLE GENERATORS
// ═══════════════════════════════════════════════════════════════════

function generateSimplePollExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const topic of POLL_TOPICS) {
    const options = POLL_OPTIONS_BY_TOPIC[topic] || ['Option A', 'Option B', 'Option C'];

    // Generate multiple prompt variations for each topic
    const promptTemplates = POLL_PROMPTS.slice(0, 3 + Math.floor(Math.random() * 3));

    for (const template of promptTemplates) {
      const prompt = template.replace('{topic}', topic);
      const pollElement = generatePollElement(topic, options);

      examples.push({
        prompt,
        output: {
          elements: [pollElement],
          connections: [],
          name: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Poll`,
          description: `Quick poll about ${topic}`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generatePollWithChartExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const topic of POLL_TOPICS.slice(0, 10)) {
    const options = POLL_OPTIONS_BY_TOPIC[topic] || ['Option A', 'Option B', 'Option C'];

    const prompts = [
      `poll about ${topic} with results chart`,
      `${topic} poll with visualization`,
      `voting for ${topic} with chart`,
      `poll and chart for ${topic}`,
    ];

    for (const prompt of prompts.slice(0, 2)) {
      const pollElement = generatePollElement(topic, options);
      const chartElement = generateChartElement(`${topic} Results`);
      chartElement.position = generatePosition(1);

      examples.push({
        prompt,
        output: {
          elements: [pollElement, chartElement],
          connections: [
            {
              from: { instanceId: pollElement.instanceId, port: 'results' },
              to: { instanceId: chartElement.instanceId, port: 'data' },
            },
          ],
          name: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Poll with Chart`,
          description: `Poll about ${topic} with visual results`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generatePollWithLeaderboardExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const topic of POLL_TOPICS.slice(0, 8)) {
    const options = POLL_OPTIONS_BY_TOPIC[topic] || ['Option A', 'Option B', 'Option C'];

    const prompts = [
      `poll about ${topic} with leaderboard`,
      `${topic} voting with rankings`,
      `poll and leaderboard for ${topic}`,
    ];

    for (const prompt of prompts.slice(0, 2)) {
      const pollElement = generatePollElement(topic, options);
      const leaderboardElement = generateLeaderboardElement(topic);
      leaderboardElement.position = generatePosition(1);

      examples.push({
        prompt,
        output: {
          elements: [pollElement, leaderboardElement],
          connections: [
            {
              from: { instanceId: pollElement.instanceId, port: 'results' },
              to: { instanceId: leaderboardElement.instanceId, port: 'entries' },
            },
          ],
          name: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Poll with Rankings`,
          description: `Poll about ${topic} with ranked results`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateRsvpExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const eventName of EVENT_NAMES) {
    const promptTemplates = RSVP_PROMPTS.slice(0, 3 + Math.floor(Math.random() * 3));

    for (const template of promptTemplates) {
      const prompt = template.replace('{event}', eventName);
      const rsvpElement = generateRsvpElement(eventName);

      examples.push({
        prompt,
        output: {
          elements: [rsvpElement],
          connections: [],
          name: `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} RSVP`,
          description: `Sign up for ${eventName}`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateRsvpWithCountdownExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const eventName of EVENT_NAMES.slice(0, 10)) {
    const prompts = [
      `rsvp for ${eventName} with countdown`,
      `${eventName} signup with timer`,
      `event registration and countdown for ${eventName}`,
      `countdown to ${eventName} with rsvp`,
    ];

    for (const prompt of prompts.slice(0, 2)) {
      const rsvpElement = generateRsvpElement(eventName);
      const countdownElement = generateCountdownElement(eventName);

      examples.push({
        prompt,
        output: {
          elements: [rsvpElement, countdownElement],
          connections: [],
          name: `${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`,
          description: `RSVP and countdown for ${eventName}`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateRsvpWithAttendeeListExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const eventName of EVENT_NAMES.slice(0, 8)) {
    const prompts = [
      `rsvp for ${eventName} with attendee list`,
      `${eventName} signup showing who's coming`,
      `event registration with attendees for ${eventName}`,
    ];

    for (const prompt of prompts.slice(0, 2)) {
      const rsvpElement = generateRsvpElement(eventName);
      const resultListElement = generateResultListElement();

      examples.push({
        prompt,
        output: {
          elements: [rsvpElement, resultListElement],
          connections: [
            {
              from: { instanceId: rsvpElement.instanceId, port: 'attendees' },
              to: { instanceId: resultListElement.instanceId, port: 'items' },
            },
          ],
          name: `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} Registration`,
          description: `RSVP for ${eventName} with attendee list`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateCountdownExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const eventName of EVENT_NAMES) {
    const promptTemplates = COUNTDOWN_PROMPTS.slice(0, 2 + Math.floor(Math.random() * 2));

    for (const template of promptTemplates) {
      const prompt = template.replace('{event}', eventName);
      const countdownElement = generateCountdownElement(eventName);
      countdownElement.position = generatePosition(0);

      examples.push({
        prompt,
        output: {
          elements: [countdownElement],
          connections: [],
          name: `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} Countdown`,
          description: `Countdown timer for ${eventName}`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateLeaderboardExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const metric of LEADERBOARD_METRICS) {
    const promptTemplates = LEADERBOARD_PROMPTS.slice(0, 2 + Math.floor(Math.random() * 2));

    for (const template of promptTemplates) {
      const prompt = template.replace('{metric}', metric);
      const leaderboardElement = generateLeaderboardElement(metric);

      examples.push({
        prompt,
        output: {
          elements: [leaderboardElement],
          connections: [],
          name: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Leaderboard`,
          description: `Rankings for ${metric}`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateFormExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  const formTypes = [
    { purpose: 'feedback', prompts: ['feedback form', 'collect feedback', 'get member feedback'] },
    { purpose: 'registration', prompts: ['registration form', 'sign up form', 'member registration'] },
    { purpose: 'survey', prompts: ['survey form', 'questionnaire', 'poll survey'] },
  ];

  for (const formType of formTypes) {
    for (const prompt of formType.prompts) {
      const formElement = generateFormElement(formType.purpose);

      examples.push({
        prompt,
        output: {
          elements: [formElement],
          connections: [],
          name: `${formType.purpose.charAt(0).toUpperCase() + formType.purpose.slice(1)} Form`,
          description: `${formType.purpose} collection form`,
          layout: 'grid',
        },
      });
    }
  }

  return examples;
}

function generateFormWithResultsExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  const prompts = [
    'feedback form with responses list',
    'survey with results display',
    'form with submission list',
    'collect feedback and show responses',
  ];

  for (const prompt of prompts) {
    const formElement = generateFormElement('feedback');
    const resultListElement = generateResultListElement();

    examples.push({
      prompt,
      output: {
        elements: [formElement, resultListElement],
        connections: [
          {
            from: { instanceId: formElement.instanceId, port: 'submittedData' },
            to: { instanceId: resultListElement.instanceId, port: 'items' },
          },
        ],
        name: 'Feedback Form with Responses',
        description: 'Feedback collection with response list',
        layout: 'grid',
      },
    });
  }

  return examples;
}

function generateStudyTimerExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  const prompts = [
    'study timer',
    'pomodoro timer',
    'focus timer with session counter',
    'study session timer',
    'timer with break counter',
    'productivity timer',
  ];

  for (const prompt of prompts) {
    const timerElement = generateTimerElement();
    const counterElement = generateCounterElement('Sessions Completed');

    examples.push({
      prompt,
      output: {
        elements: [timerElement, counterElement],
        connections: [],
        name: 'Study Timer',
        description: 'Pomodoro-style study timer with session tracking',
        layout: 'grid',
      },
    });
  }

  return examples;
}

function generateMeetingSchedulerExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  const prompts = [
    'meeting scheduler',
    'find best meeting time',
    'availability heatmap',
    'when2meet style scheduler',
    'schedule meeting with availability',
    'team availability finder',
  ];

  for (const prompt of prompts) {
    const availabilityElement = generateAvailabilityElement();
    const datePickerElement = generateDatePickerElement();

    examples.push({
      prompt,
      output: {
        elements: [availabilityElement, datePickerElement],
        connections: [],
        name: 'Meeting Scheduler',
        description: 'Find best meeting times based on member availability',
        layout: 'grid',
      },
    });
  }

  return examples;
}

function generateSearchFilterExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  const categories = [
    { name: 'events', filters: ['Academic', 'Social', 'Professional', 'Sports'] },
    { name: 'resources', filters: ['Articles', 'Videos', 'Tutorials', 'Tools'] },
    { name: 'members', filters: ['Officers', 'Members', 'Alumni', 'Advisors'] },
  ];

  for (const category of categories) {
    const prompts = [
      `search and filter ${category.name}`,
      `${category.name} search with filters`,
      `find ${category.name} with categories`,
    ];

    for (const prompt of prompts) {
      const searchElement = generateSearchElement(`Search ${category.name}...`);
      const filterElement = generateFilterElement(category.filters);
      const resultListElement = generateResultListElement();
      resultListElement.position = generatePosition(2);

      examples.push({
        prompt,
        output: {
          elements: [searchElement, filterElement, resultListElement],
          connections: [
            {
              from: { instanceId: searchElement.instanceId, port: 'query' },
              to: { instanceId: resultListElement.instanceId, port: 'items' },
            },
            {
              from: { instanceId: filterElement.instanceId, port: 'filters' },
              to: { instanceId: resultListElement.instanceId, port: 'items' },
            },
          ],
          name: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} Search`,
          description: `Search and filter ${category.name}`,
          layout: 'flow',
        },
      });
    }
  }

  return examples;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateAllExamples(): TrainingExample[] {
  const allExamples: TrainingExample[] = [
    ...generateSimplePollExamples(),
    ...generatePollWithChartExamples(),
    ...generatePollWithLeaderboardExamples(),
    ...generateRsvpExamples(),
    ...generateRsvpWithCountdownExamples(),
    ...generateRsvpWithAttendeeListExamples(),
    ...generateCountdownExamples(),
    ...generateLeaderboardExamples(),
    ...generateFormExamples(),
    ...generateFormWithResultsExamples(),
    ...generateStudyTimerExamples(),
    ...generateMeetingSchedulerExamples(),
    ...generateSearchFilterExamples(),
  ];

  // Shuffle examples
  for (let i = allExamples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allExamples[i], allExamples[j]] = [allExamples[j], allExamples[i]];
  }

  return allExamples;
}

function formatForTraining(example: TrainingExample): string {
  return JSON.stringify({
    prompt: example.prompt,
    output: example.output,
  });
}

function generateDataset(): void {
  // Create output directory
  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const trainingPath = path.join(outputDir, 'training.jsonl');
  const validationPath = path.join(outputDir, 'validation.jsonl');

  // Create write streams for memory-efficient writing
  const trainingStream = fs.createWriteStream(trainingPath, { encoding: 'utf8' });
  const validationStream = fs.createWriteStream(validationPath, { encoding: 'utf8' });

  // Track statistics while generating
  let totalExamples = 0;
  let validationSize = 0;
  const elementTypesSet = new Set<string>();

  // Generate examples and write them incrementally
  // Process in batches to reduce memory pressure
  const batchSize = 50;
  const examples = generateAllExamples();
  totalExamples = examples.length;
  validationSize = Math.floor(totalExamples * 0.1);
  const validationStartIndex = totalExamples - validationSize;

  // Process and write examples in batches
  for (let batchStart = 0; batchStart < examples.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, examples.length);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const example = examples[i];
      const line = formatForTraining(example);
      
      // Track element types
      for (const element of example.output.elements) {
        elementTypesSet.add(element.type);
      }

      // Write to appropriate stream
      if (i >= validationStartIndex) {
        if (i > validationStartIndex) {
          validationStream.write('\n');
        }
        validationStream.write(line);
      } else {
        if (i > 0) {
          trainingStream.write('\n');
        }
        trainingStream.write(line);
      }
    }
    
    // Allow garbage collection between batches if available
    if (typeof global.gc === 'function' && batchStart % (batchSize * 2) === 0) {
      global.gc();
    }
  }

  // Close streams synchronously (they'll finish writing in background)
  trainingStream.end();
  validationStream.end();

  // Write summary
  const summary = {
    total_examples: totalExamples,
    training_examples: totalExamples - validationSize,
    validation_examples: validationSize,
    element_types_covered: Array.from(elementTypesSet),
    generated_at: new Date().toISOString(),
  };

  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`Generated ${totalExamples} training examples`);
  console.log(`Training set: ${totalExamples - validationSize} examples`);
  console.log(`Validation set: ${validationSize} examples`);
  console.log(`Element types covered: ${summary.element_types_covered.length}`);
  console.log(`\nOutput files:`);
  console.log(`  - ${trainingPath}`);
  console.log(`  - ${validationPath}`);
  console.log(`  - ${summaryPath}`);
}

// Run if executed directly (ESM-compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  try {
    generateDataset();
  } catch (error) {
    console.error('Failed to generate dataset:', error);
    process.exit(1);
  }
}

export {
  generateAllExamples,
  generateDataset,
  formatForTraining,
  type TrainingExample,
  type ToolComposition,
  type CanvasElement,
  type Connection,
};
