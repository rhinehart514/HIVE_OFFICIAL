/**
 * Firebase AI Tool Generator
 *
 * Uses Firebase AI (Gemini) to generate HiveLab tools from natural language.
 * Produces structured JSON output with guaranteed schema compliance.
 */

import { ai, getGenerativeModel, Schema } from './firebase';
import type { StreamingChunk, GenerateToolRequest } from './mock-ai-generator';
import { mockGenerateToolStreaming } from './mock-ai-generator';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Tool schema for structured output - Gemini will output this exact structure
const toolSchema = Schema.object({
  properties: {
    name: Schema.string(),
    description: Schema.string(),
    elements: Schema.array({
      items: Schema.object({
        properties: {
          type: Schema.string(),
          instanceId: Schema.string(),
          name: Schema.string(),
          config: Schema.object({
            properties: {
              // Gemini requires at least one property for OBJECT type
              // Using common config properties that most elements use
              label: Schema.string(),
            },
          }),
          position: Schema.object({
            properties: {
              x: Schema.number(),
              y: Schema.number(),
            },
          }),
        },
      }),
    }),
    connections: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          from: Schema.string(),
          to: Schema.string(),
          type: Schema.string(),
        },
      }),
    }),
    layout: Schema.string(),
  },
});

// System prompt with full element library knowledge
const SYSTEM_PROMPT = `You are HiveLab, an AI tool generator for campus communities (Spaces).

Your job is to generate tools from natural language descriptions. Tools are compositions of elements that work together within a Space.

## Available Elements

INPUT ELEMENTS:
- search-input: Text search with autocomplete. Config: { placeholder: string, showSuggestions: boolean, debounceMs: number }
- date-picker: Date/time selection. Config: { includeTime: boolean, allowRange: boolean, minDate: string, maxDate: string }
- user-selector: Pick users from the space. Config: { allowMultiple: boolean, filterBySpace: boolean, showAvatars: boolean }
- form-builder: Dynamic form creation. Config: { fields: [{ name: string, type: 'text'|'textarea'|'date'|'select', required: boolean }], validateOnChange: boolean, showProgress: boolean }

DISPLAY ELEMENTS:
- result-list: Paginated list of items. Config: { itemsPerPage: number, showPagination: boolean, cardStyle: 'standard'|'compact' }
- tag-cloud: Visual tag display with weighting. Config: { maxTags: number, sortBy: 'frequency'|'alpha', showCounts: boolean }
- chart-display: Data visualization. Config: { chartType: 'bar'|'line'|'area', showLegend: boolean, animate: boolean }
- notification-center: In-tool notifications. Config: { maxNotifications: number, groupByType: boolean, autoMarkRead: boolean }
- countdown-timer: Live countdown for events/deadlines. Config: { seconds: number, label: string, showDays: boolean, targetDate: string }
- leaderboard: Ranked standings with scores. Config: { maxEntries: number, showRank: boolean, showScore: boolean, scoreLabel: string, highlightTop: number }

FILTER ELEMENTS:
- filter-selector: Multi-select filters with categories. Config: { options: [{ value: string, label: string, count?: number }], allowMultiple: boolean, showCounts: boolean }

ACTION ELEMENTS:
- poll-element: Voting/polls for space members. Config: { question: string, options: string[], allowMultipleVotes: boolean, showResults: boolean, anonymousVoting: boolean }
- rsvp-button: Event signup with capacity. Config: { eventName: string, maxAttendees: number, showCount: boolean, requireConfirmation: boolean, allowWaitlist: boolean, eventDate: string }

## Context: Tools Live in Spaces
- Tools are created FOR a specific Space (club, org, dorm, etc.)
- Space members interact with tools
- Tools can trigger actions in the Space (create posts, send notifications)
- Consider the Space's purpose when generating tools

## Guidelines

1. Position elements logically (x: 0-600, y: 0-500, spaced ~150px apart vertically)
2. Connect elements that pass data (search → result-list, filter → result-list, poll → leaderboard, etc.)
3. Use meaningful instanceIds like "search-main", "results-1", "filter-type", "poll-voting"
4. Set appropriate configs for the specific use case
5. Keep tools focused - 3-6 elements typically
6. For events: combine countdown-timer + rsvp-button + form-builder
7. For competitions: combine poll-element + leaderboard + countdown-timer
8. For feedback: combine form-builder + result-list + chart-display

## Connection Types
- data-flow: Data passes from output to input
- trigger: Action in one element triggers another

## Example Use Cases
- "hackathon registration" → form-builder + countdown-timer + rsvp-button + leaderboard
- "weekly poll" → poll-element + chart-display
- "study group finder" → search-input + filter-selector + result-list + user-selector
- "event countdown" → countdown-timer + rsvp-button + notification-center

## Iteration Mode

When iterating on an existing tool:
1. EXISTING ELEMENTS provided in the context - these are already on the canvas
2. Generate ONLY NEW elements that ADD to the composition
3. DO NOT recreate existing elements - reference them by instanceId if connecting
4. Position new elements BELOW existing ones (higher Y values)
5. Preserve the tool name unless user explicitly asks to rename
6. Connect new elements to existing ones when logical (e.g., new filter → existing result-list)
7. For "add X" requests: add only X, don't restructure existing elements
8. For "change X" requests: modify only the specific element mentioned
9. For "remove X" requests: do not include that element in output

Generate practical tools for college students and campus organizations.`;

// Create the Gemini model with structured output
const getToolGeneratorModel = () => {
  return getGenerativeModel(ai, {
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toolSchema,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });
};

/**
 * Build contextual prompt with space information
 */
function buildContextualPrompt(request: GenerateToolRequest): string {
  let fullPrompt = '';

  // Add space context if provided
  if (request.spaceContext) {
    const { spaceName, spaceType, category, memberCount, description } = request.spaceContext;
    fullPrompt += `## Space Context\n`;
    fullPrompt += `You are generating a tool for the "${spaceName}" space.\n`;
    if (spaceType) fullPrompt += `- Type: ${spaceType}\n`;
    if (category) fullPrompt += `- Category: ${category}\n`;
    if (memberCount) fullPrompt += `- Members: ${memberCount} people\n`;
    if (description) fullPrompt += `- Description: ${description}\n`;
    fullPrompt += `\nConsider this context when generating the tool. Make it relevant to this specific community.\n\n`;
  }

  // Add iteration context if this is an iteration on existing tool
  if (request.isIteration && request.existingComposition?.elements?.length) {
    const existingElements = request.existingComposition.elements;
    const maxY = Math.max(...existingElements.map((el) => el.position?.y ?? 0));
    const nextYPosition = maxY + 150; // Position new elements below existing

    fullPrompt += `## ITERATION MODE\n`;
    fullPrompt += `This is an iteration on an existing tool. DO NOT recreate these elements:\n\n`;

    for (const el of existingElements) {
      fullPrompt += `- ${el.instanceId} (${el.elementId}) at y=${el.position?.y ?? 0}\n`;
    }

    fullPrompt += `\nTool name: "${request.existingComposition.name || 'Untitled'}"\n`;
    fullPrompt += `Position any NEW elements starting at y=${nextYPosition} or below.\n`;
    fullPrompt += `Connect new elements to existing ones using their instanceIds listed above.\n\n`;
  }

  // Add the user's prompt
  fullPrompt += `## User Request\n${request.prompt}`;

  // Add constraints
  if (request.constraints?.maxElements) {
    fullPrompt += `\n\nConstraint: Use at most ${request.constraints.maxElements} elements.`;
  }
  if (request.constraints?.allowedCategories?.length) {
    fullPrompt += `\n\nConstraint: Only use elements from these categories: ${request.constraints.allowedCategories.join(', ')}`;
  }

  return fullPrompt;
}

/**
 * Attempt to generate tool from Firebase AI with retries
 */
async function attemptGeneration(
  request: GenerateToolRequest,
  attempt: number = 1
): Promise<{ success: true; tool: Record<string, unknown> } | { success: false; error: string }> {
  try {
    const model = getToolGeneratorModel();
    const fullPrompt = buildContextualPrompt(request);

    console.log(`[Firebase AI] Generation attempt ${attempt}/${MAX_RETRIES + 1}`);

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // Try to parse JSON
    const tool = JSON.parse(text);
    return { success: true, tool };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isParseError = errorMessage.includes('JSON') || errorMessage.includes('parse');

    console.error(`[Firebase AI] Attempt ${attempt} failed:`, errorMessage);

    // Retry on JSON parse errors (truncation issues)
    if (isParseError && attempt <= MAX_RETRIES) {
      console.log(`[Firebase AI] Retrying in ${RETRY_DELAY_MS}ms...`);
      await delay(RETRY_DELAY_MS);
      return attemptGeneration(request, attempt + 1);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Generate tool with streaming for real-time canvas updates
 * Includes retry logic and fallback to mock generator
 */
export async function* firebaseGenerateToolStreaming(
  request: GenerateToolRequest
): AsyncGenerator<StreamingChunk> {
  const thinkingMessage = request.spaceContext
    ? `Generating tool for "${request.spaceContext.spaceName}": "${request.prompt.substring(0, 40)}..."`
    : `Understanding: "${request.prompt.substring(0, 50)}..."`;

  yield {
    type: 'thinking',
    data: { message: thinkingMessage },
  };

  // Attempt generation with retries
  const result = await attemptGeneration(request);

  if (result.success) {
    const tool = result.tool;

    // For iteration mode: filter out duplicates and track what we're adding
    const existingIds = new Set(
      request.existingComposition?.elements?.map((el) => el.instanceId) ?? []
    );
    const newElements = ((tool.elements as Array<Record<string, unknown>>) || []).filter(
      (el) => !existingIds.has(el.instanceId as string)
    );

    // Stream elements one by one for canvas animation
    const elementsToStream = request.isIteration ? newElements : (tool.elements as Array<Record<string, unknown>>) || [];

    for (const element of elementsToStream) {
      yield {
        type: 'element',
        data: {
          id: (element.instanceId as string) || `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: element.type as string,
          name: (element.name as string) || (element.type as string),
          config: (element.config as Record<string, unknown>) || {},
          position: (element.position as { x: number; y: number }) || { x: 100, y: 100 },
        },
      };
      await delay(150); // Smooth animation
    }

    // Stream connections
    for (const connection of (tool.connections as Array<Record<string, unknown>>) || []) {
      yield {
        type: 'connection',
        data: {
          id: (connection.id as string) || `conn-${Date.now()}`,
          from: connection.from as string,
          to: connection.to as string,
          type: (connection.type as string) || 'data-flow',
        },
      };
      await delay(100);
    }

    // For iteration mode: preserve original tool name unless explicitly changed
    const toolName = request.isIteration
      ? request.existingComposition?.name || (tool.name as string) || 'Generated Tool'
      : (tool.name as string) || 'Generated Tool';

    // Calculate total element count (existing + new for iterations)
    const totalElementCount = request.isIteration
      ? (request.existingComposition?.elements?.length ?? 0) + newElements.length
      : (tool.elements as Array<unknown>)?.length ?? 0;

    // Complete
    yield {
      type: 'complete',
      data: {
        toolId: `tool-${Date.now()}`,
        name: toolName,
        description: (tool.description as string) || '',
        elementCount: totalElementCount,
        connectionCount: (tool.connections as Array<unknown>)?.length || 0,
        layout: (tool.layout as string) || 'flow',
      },
    };
  } else {
    // All retries failed - fall back to mock generator
    console.warn('[Firebase AI] All retries failed, falling back to mock generator');
    console.warn('[Firebase AI] Error was:', result.error);

    yield {
      type: 'thinking',
      data: { message: 'Switching to template mode...' },
    };

    // Use mock generator as fallback
    for await (const chunk of mockGenerateToolStreaming(request)) {
      // Skip the mock's thinking message since we already showed ours
      if (chunk.type !== 'thinking') {
        yield chunk;
      }
    }
  }
}

/**
 * Generate tool (non-streaming, returns complete tool)
 */
export async function firebaseGenerateTool(prompt: string): Promise<{
  name: string;
  description: string;
  elements: Array<{
    type: string;
    instanceId: string;
    name: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  connections: Array<{
    id: string;
    from: string;
    to: string;
    type: string;
  }>;
  layout: string;
}> {
  const model = getToolGeneratorModel();
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

/**
 * Check if Firebase AI is available
 */
export function isFirebaseAIAvailable(): boolean {
  try {
    // AI module is available if we got here
    return typeof ai !== 'undefined';
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
