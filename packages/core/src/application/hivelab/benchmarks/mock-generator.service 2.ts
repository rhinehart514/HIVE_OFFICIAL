/**
 * Mock Generator Service
 *
 * Generates deterministic mock compositions for CI testing.
 * This allows benchmarks to run without API keys while still
 * testing the validation and scoring logic.
 *
 * The mock generates based on keywords in the prompt to produce
 * realistic-looking compositions.
 */

import type { BenchmarkPrompt, MockGenerationResult } from './benchmark.types';

// ═══════════════════════════════════════════════════════════════════
// ELEMENT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const ELEMENT_TEMPLATES: Record<string, {
  config: Record<string, unknown>;
  size: { width: number; height: number };
}> = {
  'poll-element': {
    config: {
      question: 'What would you prefer?',
      options: ['Option A', 'Option B', 'Option C'],
      allowMultipleVotes: false,
      showResults: true,
    },
    size: { width: 280, height: 200 },
  },
  'countdown-timer': {
    config: {
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Time remaining',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    size: { width: 260, height: 140 },
  },
  'form-builder': {
    config: {
      title: 'Submit Form',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name' },
        { name: 'email', type: 'email', required: true, label: 'Email' },
      ],
      submitLabel: 'Submit',
    },
    size: { width: 300, height: 280 },
  },
  'search-input': {
    config: {
      placeholder: 'Search...',
      debounceMs: 300,
    },
    size: { width: 260, height: 60 },
  },
  'result-list': {
    config: {
      emptyMessage: 'No results found',
      itemsPerPage: 10,
    },
    size: { width: 280, height: 300 },
  },
  'chart-display': {
    config: {
      type: 'bar',
      title: 'Results',
      showLegend: true,
    },
    size: { width: 320, height: 240 },
  },
  'counter': {
    config: {
      label: 'Count',
      initialValue: 0,
      step: 1,
    },
    size: { width: 200, height: 100 },
  },
  'leaderboard': {
    config: {
      title: 'Top Members',
      maxItems: 10,
      showRank: true,
    },
    size: { width: 280, height: 300 },
  },
  'rsvp-button': {
    config: {
      eventName: 'Upcoming Event',
      maxAttendees: 50,
    },
    size: { width: 240, height: 80 },
  },
  'notification-center': {
    config: {
      maxNotifications: 5,
      showTimestamp: true,
    },
    size: { width: 300, height: 200 },
  },
};

// ═══════════════════════════════════════════════════════════════════
// KEYWORD DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps keywords in prompts to element types
 */
const KEYWORD_ELEMENT_MAP: Record<string, string[]> = {
  poll: ['poll-element'],
  vote: ['poll-element'],
  voting: ['poll-element'],
  survey: ['poll-element', 'form-builder'],

  countdown: ['countdown-timer'],
  timer: ['countdown-timer'],
  'time remaining': ['countdown-timer'],

  form: ['form-builder'],
  signup: ['form-builder'],
  registration: ['form-builder'],
  feedback: ['form-builder'],

  search: ['search-input', 'result-list'],
  find: ['search-input', 'result-list'],
  directory: ['search-input', 'result-list'],

  chart: ['chart-display'],
  visualization: ['chart-display'],
  results: ['chart-display'],
  graph: ['chart-display'],

  counter: ['counter'],
  points: ['counter'],
  score: ['counter'],

  leaderboard: ['leaderboard'],
  ranking: ['leaderboard'],
  'top members': ['leaderboard'],

  rsvp: ['rsvp-button'],
  attend: ['rsvp-button'],
  'sign up': ['rsvp-button', 'form-builder'],

  notification: ['notification-center'],
  alerts: ['notification-center'],
};

// ═══════════════════════════════════════════════════════════════════
// MOCK GENERATOR SERVICE
// ═══════════════════════════════════════════════════════════════════

export class MockGeneratorService {
  /**
   * Generate a mock composition based on the benchmark prompt
   */
  generate(prompt: BenchmarkPrompt): MockGenerationResult {
    const startTime = Date.now();

    // Element type for the result
    type ResultElement = {
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position: { x: number; y: number };
      size: { width: number; height: number };
    };

    // If iteration, start with existing elements (add position/size if missing)
    const elements: ResultElement[] = prompt.existingComposition?.elements
      ? prompt.existingComposition.elements.map((e, index) => ({
          elementId: e.elementId,
          instanceId: e.instanceId,
          config: e.config,
          position: { x: 50, y: 50 + index * 180 },
          size: ELEMENT_TEMPLATES[e.elementId]?.size || { width: 280, height: 200 },
        }))
      : [];

    // Detect elements from prompt keywords
    const detectedElements = this.detectElements(prompt.prompt);

    // Add detected elements (avoiding duplicates)
    const existingTypes = new Set(elements.map(e => e.elementId));
    let positionY = elements.length * 180 + 50;

    for (const elementId of detectedElements) {
      if (!existingTypes.has(elementId)) {
        const template = ELEMENT_TEMPLATES[elementId];
        if (template) {
          elements.push({
            elementId,
            instanceId: `${elementId.replace(/-/g, '_')}_${elements.length + 1}`,
            config: { ...template.config },
            position: { x: 50, y: positionY },
            size: { ...template.size },
          });
          existingTypes.add(elementId);
          positionY += template.size.height + 40;
        }
      }
    }

    // Ensure minimum element count
    if (elements.length === 0) {
      // Default to poll if nothing detected
      const template = ELEMENT_TEMPLATES['poll-element'];
      elements.push({
        elementId: 'poll-element',
        instanceId: 'poll_element_1',
        config: { ...template.config },
        position: { x: 50, y: 50 },
        size: { ...template.size },
      });
    }

    // Generate connections if expected
    const connections = prompt.expectedConnections && elements.length > 1
      ? this.generateConnections(elements)
      : [];

    // Simulate realistic duration
    const durationMs = 200 + Math.random() * 300;

    return {
      composition: {
        id: `mock_${prompt.id}_${Date.now()}`,
        name: this.generateName(prompt.prompt),
        description: `Generated from: ${prompt.prompt.slice(0, 100)}`,
        elements,
        connections,
        layout: 'flow',
      },
      durationMs: Math.round(durationMs),
    };
  }

  /**
   * Detect element types from prompt text
   */
  private detectElements(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const detected = new Set<string>();

    for (const [keyword, elementIds] of Object.entries(KEYWORD_ELEMENT_MAP)) {
      if (lowerPrompt.includes(keyword)) {
        for (const id of elementIds) {
          detected.add(id);
        }
      }
    }

    return Array.from(detected);
  }

  /**
   * Generate connections between elements
   */
  private generateConnections(
    elements: Array<{ elementId: string; instanceId: string }>
  ): Array<{
    from: { instanceId: string; output: string };
    to: { instanceId: string; input: string };
  }> {
    const connections: Array<{
      from: { instanceId: string; output: string };
      to: { instanceId: string; input: string };
    }> = [];

    // Connect elements that naturally flow into each other
    const connectionRules: Array<{
      from: string;
      to: string;
      output: string;
      input: string;
    }> = [
      { from: 'poll-element', to: 'chart-display', output: 'results', input: 'data' },
      { from: 'search-input', to: 'result-list', output: 'query', input: 'searchQuery' },
      { from: 'form-builder', to: 'result-list', output: 'submission', input: 'items' },
      { from: 'counter', to: 'leaderboard', output: 'value', input: 'score' },
    ];

    for (const rule of connectionRules) {
      const fromElement = elements.find(e => e.elementId === rule.from);
      const toElement = elements.find(e => e.elementId === rule.to);

      if (fromElement && toElement) {
        connections.push({
          from: { instanceId: fromElement.instanceId, output: rule.output },
          to: { instanceId: toElement.instanceId, input: rule.input },
        });
      }
    }

    return connections;
  }

  /**
   * Generate a name from the prompt
   */
  private generateName(prompt: string): string {
    // Extract key words for name
    const words = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3);

    if (words.length === 0) {
      return 'Tool';
    }

    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

let mockGeneratorInstance: MockGeneratorService | null = null;

export function getMockGenerator(): MockGeneratorService {
  if (!mockGeneratorInstance) {
    mockGeneratorInstance = new MockGeneratorService();
  }
  return mockGeneratorInstance;
}
