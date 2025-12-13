/**
 * Curated Benchmark Prompts
 *
 * Hand-picked prompts that test various aspects of AI generation quality.
 * These form the foundation of automated quality measurement.
 *
 * Categories:
 * - basic: Single element, clear intent - should always pass
 * - complex: Multi-element, connections - tests composition
 * - edge_case: Vague/conflicting prompts - tests robustness
 * - space_context: Context-aware generation
 * - iteration: Building on existing compositions
 */

import type { BenchmarkPrompt, BenchmarkCategory } from './benchmark.types';

// ═══════════════════════════════════════════════════════════════════
// BASIC PROMPTS (Single Element)
// These should always pass with high scores
// ═══════════════════════════════════════════════════════════════════

const BASIC_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'basic-poll',
    category: 'basic',
    prompt: 'Create a simple poll asking what day to hold the meeting',
    expectedElements: ['poll-element'],
    minElementCount: 1,
    maxElementCount: 2,
    minQualityScore: 85,
    tags: ['poll', 'single-element', 'voting'],
  },
  {
    id: 'basic-countdown',
    category: 'basic',
    prompt: 'Create a countdown timer for our spring event on April 15th',
    expectedElements: ['countdown-timer'],
    minElementCount: 1,
    maxElementCount: 2,
    minQualityScore: 85,
    tags: ['timer', 'single-element', 'event'],
  },
  {
    id: 'basic-form',
    category: 'basic',
    prompt: 'Create a feedback form with name, email, and comments fields',
    expectedElements: ['form-builder'],
    minElementCount: 1,
    maxElementCount: 2,
    minQualityScore: 85,
    tags: ['form', 'single-element', 'feedback'],
  },
  {
    id: 'basic-search',
    category: 'basic',
    prompt: 'Create a search box to find events',
    expectedElements: ['search-input'],
    minElementCount: 1,
    maxElementCount: 2,
    minQualityScore: 85,
    tags: ['search', 'single-element', 'input'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// COMPLEX PROMPTS (Multi-Element Compositions)
// Tests ability to compose multiple elements with connections
// ═══════════════════════════════════════════════════════════════════

const COMPLEX_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'complex-event-registration',
    category: 'complex',
    prompt: 'Create an event registration tool with a signup form, countdown to the event, and RSVP tracking',
    expectedElements: ['form-builder', 'countdown-timer'],
    minElementCount: 2,
    maxElementCount: 5,
    expectedConnections: true,
    minQualityScore: 70,
    tags: ['event', 'multi-element', 'registration', 'form'],
  },
  {
    id: 'complex-poll-results',
    category: 'complex',
    prompt: 'Create a voting tool with poll options and a chart showing live results',
    expectedElements: ['poll-element', 'chart-display'],
    minElementCount: 2,
    maxElementCount: 4,
    expectedConnections: true,
    minQualityScore: 75,
    tags: ['poll', 'visualization', 'multi-element', 'chart'],
  },
  {
    id: 'complex-member-search',
    category: 'complex',
    prompt: 'Create a member directory with search functionality and a list of matching results',
    expectedElements: ['search-input', 'result-list'],
    minElementCount: 2,
    maxElementCount: 4,
    expectedConnections: true,
    minQualityScore: 75,
    tags: ['search', 'directory', 'multi-element', 'members'],
  },
  {
    id: 'complex-leaderboard',
    category: 'complex',
    prompt: 'Create a participation tracker with a counter for points and a leaderboard showing top members',
    expectedElements: ['counter', 'leaderboard'],
    minElementCount: 2,
    maxElementCount: 4,
    expectedConnections: true,
    minQualityScore: 70,
    tags: ['gamification', 'leaderboard', 'multi-element'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// EDGE CASE PROMPTS
// Tests robustness with vague, conflicting, or unusual inputs
// ═══════════════════════════════════════════════════════════════════

const EDGE_CASE_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'edge-vague',
    category: 'edge_case',
    prompt: 'Make something cool for our club',
    expectedElements: [], // No specific expectation
    minElementCount: 1,
    maxElementCount: 6,
    minQualityScore: 60,
    tags: ['vague', 'creative', 'open-ended'],
  },
  {
    id: 'edge-long',
    category: 'edge_case',
    prompt: 'I need a comprehensive event management system that allows members to sign up for events, see a countdown to upcoming events, vote on food options for the event, see a leaderboard of most active members, and get notifications about updates',
    expectedElements: ['form-builder', 'countdown-timer', 'poll-element'],
    minElementCount: 3,
    maxElementCount: 8,
    minQualityScore: 60,
    tags: ['complex', 'many-requirements', 'comprehensive'],
  },
  {
    id: 'edge-minimal',
    category: 'edge_case',
    prompt: 'poll',
    expectedElements: ['poll-element'],
    minElementCount: 1,
    maxElementCount: 2,
    minQualityScore: 70,
    tags: ['minimal', 'one-word', 'terse'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// SPACE CONTEXT PROMPTS
// Tests context-aware generation for specific space types
// ═══════════════════════════════════════════════════════════════════

const SPACE_CONTEXT_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'context-hackathon',
    category: 'space_context',
    prompt: 'Create a team registration tool for our hackathon',
    expectedElements: ['form-builder'],
    minElementCount: 1,
    maxElementCount: 4,
    minQualityScore: 75,
    spaceContext: {
      spaceName: 'HackMIT 2025',
      spaceType: 'event',
      category: 'academic',
    },
    tags: ['hackathon', 'context-aware', 'registration'],
  },
  {
    id: 'context-study-group',
    category: 'space_context',
    prompt: 'Create a poll for picking our next study topic',
    expectedElements: ['poll-element'],
    minElementCount: 1,
    maxElementCount: 3,
    minQualityScore: 80,
    spaceContext: {
      spaceName: 'CS Study Group',
      spaceType: 'academic',
      category: 'academic',
    },
    tags: ['study', 'academic', 'poll'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// ITERATION PROMPTS
// Tests ability to modify existing compositions
// ═══════════════════════════════════════════════════════════════════

const ITERATION_PROMPTS: BenchmarkPrompt[] = [
  {
    id: 'iteration-add-chart',
    category: 'iteration',
    prompt: 'Add a chart to show the poll results visually',
    expectedElements: ['poll-element', 'chart-display'],
    minElementCount: 2,
    maxElementCount: 4,
    expectedConnections: true,
    minQualityScore: 70,
    tags: ['iteration', 'add-element', 'visualization'],
    existingComposition: {
      elements: [
        {
          elementId: 'poll-element',
          instanceId: 'poll_001',
          config: {
            question: 'What time works best?',
            options: ['Morning', 'Afternoon', 'Evening'],
          },
        },
      ],
    },
  },
  {
    id: 'iteration-add-countdown',
    category: 'iteration',
    prompt: 'Add a countdown timer showing time until voting closes',
    expectedElements: ['form-builder', 'countdown-timer'],
    minElementCount: 2,
    maxElementCount: 4,
    minQualityScore: 70,
    tags: ['iteration', 'add-element', 'timer'],
    existingComposition: {
      elements: [
        {
          elementId: 'form-builder',
          instanceId: 'form_001',
          config: {
            title: 'Event Signup',
            fields: [
              { name: 'name', type: 'text', required: true },
              { name: 'email', type: 'email', required: true },
            ],
          },
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * All benchmark prompts
 */
export const BENCHMARK_PROMPTS: BenchmarkPrompt[] = [
  ...BASIC_PROMPTS,
  ...COMPLEX_PROMPTS,
  ...EDGE_CASE_PROMPTS,
  ...SPACE_CONTEXT_PROMPTS,
  ...ITERATION_PROMPTS,
];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: BenchmarkCategory): BenchmarkPrompt[] {
  return BENCHMARK_PROMPTS.filter(p => p.category === category);
}

/**
 * Get prompts by tag
 */
export function getPromptsByTag(tag: string): BenchmarkPrompt[] {
  return BENCHMARK_PROMPTS.filter(p => p.tags.includes(tag));
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): BenchmarkPrompt | undefined {
  return BENCHMARK_PROMPTS.find(p => p.id === id);
}

/**
 * Get prompt IDs by category
 */
export function getPromptIdsByCategory(): Record<BenchmarkCategory, string[]> {
  const result: Record<BenchmarkCategory, string[]> = {
    basic: [],
    complex: [],
    edge_case: [],
    space_context: [],
    iteration: [],
  };

  for (const prompt of BENCHMARK_PROMPTS) {
    result[prompt.category].push(prompt.id);
  }

  return result;
}

/**
 * Prompt count by category
 */
export const PROMPT_COUNTS: Record<BenchmarkCategory, number> = {
  basic: BASIC_PROMPTS.length,
  complex: COMPLEX_PROMPTS.length,
  edge_case: EDGE_CASE_PROMPTS.length,
  space_context: SPACE_CONTEXT_PROMPTS.length,
  iteration: ITERATION_PROMPTS.length,
};

/**
 * Total prompt count
 */
export const TOTAL_PROMPT_COUNT = BENCHMARK_PROMPTS.length;
