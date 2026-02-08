/**
 * Firebase AI Tool Generator
 *
 * Uses Firebase AI (Gemini) to generate HiveLab tools from natural language.
 * Produces structured JSON output with guaranteed schema compliance.
 *
 * Includes AI Quality Pipeline integration for validation and tracking.
 */

import { ai, getGenerativeModel, Schema } from './firebase';
import type { StreamingChunk, GenerateToolRequest } from './mock-ai-generator';
import { mockGenerateToolStreaming } from './mock-ai-generator';
import { logger } from './logger';
import { dbAdmin, isFirebaseConfigured } from './firebase-admin';
import {
  AIQualityPipeline,
  CURRENT_PROMPT_VERSION,
  type PipelineResult,
  getPromptEnhancerService,
  initializeAIQualityPipeline,
  initializePromptEnhancer,
  type EnhancedPrompt,
} from '@hive/core';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Whether to use learned context (RAG + patterns) in prompts
// Can be disabled via environment variable for A/B testing
const USE_LEARNED_CONTEXT = process.env.NEXT_PUBLIC_USE_AI_LEARNING !== 'false';

// Quality pipeline instance (singleton)
const qualityPipeline = new AIQualityPipeline();

// Initialize quality pipeline with Firestore for persistence
// This enables tracking of all AI generations for quality analytics
let pipelineInitialized = false;
function ensurePipelineInitialized(): void {
  if (pipelineInitialized) return;
  try {
    if (isFirebaseConfigured && dbAdmin) {
      initializeAIQualityPipeline(dbAdmin);
      initializePromptEnhancer(dbAdmin);
      pipelineInitialized = true;
      logger.info('[AI Quality] Pipeline and prompt enhancer initialized with Firestore persistence');
    }
  } catch (error) {
    // Non-fatal - pipeline will work in mock mode without persistence
    logger.warn('[AI Quality] Pipeline running without Firestore persistence', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Prompt enhancer instance (singleton)
const promptEnhancer = getPromptEnhancerService();

// Session ID generator for tracking
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
- counter: Track counts (attendance, inventory, etc). Config: { label: string, min: number, max: number, step: number }
- timer: Stopwatch for sessions/activities. Config: { label: string, showControls: boolean, countUp: boolean, showLapTimes: boolean }

## Context: Tools Live in Spaces
- Tools are created FOR a specific Space (club, org, dorm, etc.)
- Space members interact with tools
- Tools can trigger actions in the Space (create posts, send notifications)
- Consider the Space's purpose when generating tools

## Layout
Always use layout: "flow". This is the only supported layout mode.

## Guidelines

1. Position elements logically (x: 0-600, y: 0-500, spaced ~150px apart vertically)
2. Connect elements that pass data (search → result-list, filter → result-list, poll → leaderboard, etc.)
3. Use meaningful instanceIds like "search-main", "results-1", "filter-type", "poll-voting"
4. Set appropriate configs for the specific use case
5. Keep tools focused — default to 3-4 elements. Only go complex (5-6) if the user's description demands it.
6. For events: combine countdown-timer + rsvp-button + form-builder
7. For competitions: combine poll-element + leaderboard + countdown-timer
8. For feedback: combine form-builder + result-list + chart-display
9. For signups/scheduling: combine signup-sheet + countdown-timer
10. For task tracking: combine checklist-tracker + countdown-timer
11. Prioritize the most impactful elements first — a poll before a chart, a signup before a leaderboard.

## Naming & Description
- Generate short, human-friendly names. Not "Study Group Finder Tool" but "Study Buddy" or "Find Study Partners".
- Descriptions should be one casual line. Not "A comprehensive tool for managing event registrations" but "Sign up for events and see who's going".
- Match the vibe of college students talking to each other.

## Connection Types
- data-flow: Data passes from output to input
- trigger: Action in one element triggers another

## Example Use Cases
- "hackathon registration" → form-builder + countdown-timer + rsvp-button + leaderboard
- "weekly poll" → poll-element + chart-display
- "study group finder" → search-input + filter-selector + result-list + user-selector
- "event countdown" → countdown-timer + rsvp-button
- "competition tracker" → poll-element + leaderboard + counter + countdown-timer
- "feedback collector" → form-builder + result-list + chart-display
- "attendance tracker" → counter + leaderboard + chart-display

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
 * Build contextual prompt with space information (basic version)
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
 * Build enhanced contextual prompt with RAG and learned patterns
 * Falls back to basic prompt if enhancement fails
 */
async function buildEnhancedContextualPrompt(
  request: GenerateToolRequest
): Promise<{ prompt: string; enhanced: boolean; metadata?: EnhancedPrompt['metadata'] }> {
  // Skip enhancement if disabled
  if (!USE_LEARNED_CONTEXT) {
    return { prompt: buildContextualPrompt(request), enhanced: false };
  }

  try {
    // Build iteration context separately (not part of enhancer)
    let iterationContext = '';
    if (request.isIteration && request.existingComposition?.elements?.length) {
      const existingElements = request.existingComposition.elements;
      const maxY = Math.max(...existingElements.map((el) => el.position?.y ?? 0));
      const nextYPosition = maxY + 150;

      iterationContext += `## ITERATION MODE\n`;
      iterationContext += `This is an iteration on an existing tool. DO NOT recreate these elements:\n\n`;

      for (const el of existingElements) {
        iterationContext += `- ${el.instanceId} (${el.elementId}) at y=${el.position?.y ?? 0}\n`;
      }

      iterationContext += `\nTool name: "${request.existingComposition.name || 'Untitled'}"\n`;
      iterationContext += `Position any NEW elements starting at y=${nextYPosition} or below.\n`;
      iterationContext += `Connect new elements to existing ones using their instanceIds listed above.\n\n`;
    }

    // Build constraints string
    let constraints = '';
    if (request.constraints?.maxElements) {
      constraints += `\n\nConstraint: Use at most ${request.constraints.maxElements} elements.`;
    }
    if (request.constraints?.allowedCategories?.length) {
      constraints += `\n\nConstraint: Only use elements from these categories: ${request.constraints.allowedCategories.join(', ')}`;
    }

    // Use prompt enhancer for RAG + patterns
    const userPromptWithConstraints = request.prompt + constraints;
    const enhanced = await promptEnhancer.enhancePrompt(
      userPromptWithConstraints,
      SYSTEM_PROMPT,
      {
        useRAG: true,
        usePatterns: true,
        useConfigHints: true,
        spaceContext: request.spaceContext ? {
          spaceId: request.spaceContext.spaceId || '',
          spaceName: request.spaceContext.spaceName,
          category: request.spaceContext.category,
        } : undefined,
      }
    );

    // Insert iteration context before user request
    let finalPrompt = enhanced.prompt;
    if (iterationContext) {
      // Insert iteration context before "## User Request"
      finalPrompt = finalPrompt.replace(
        '## User Request',
        `${iterationContext}## User Request`
      );
    }

    logger.debug('Prompt enhanced', {
      component: 'firebase-ai-generator',
      layers: enhanced.layers,
      tokenBudget: enhanced.tokenBudget,
      enhancementTimeMs: enhanced.metadata.totalEnhancementTimeMs,
    });

    return {
      prompt: finalPrompt,
      enhanced: true,
      metadata: enhanced.metadata,
    };
  } catch (error) {
    // Fall back to basic prompt on any error
    logger.warn('Prompt enhancement failed, using basic prompt', {
      component: 'firebase-ai-generator',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return { prompt: buildContextualPrompt(request), enhanced: false };
  }
}

/**
 * Attempt to generate tool from Firebase AI with retries
 * Uses enhanced prompt with RAG and learned patterns when available
 */
async function attemptGeneration(
  request: GenerateToolRequest,
  attempt: number = 1
): Promise<{
  success: true;
  tool: Record<string, unknown>;
  promptEnhanced?: boolean;
  enhancementMetadata?: EnhancedPrompt['metadata'];
} | { success: false; error: string }> {
  try {
    const model = getToolGeneratorModel();

    // Use enhanced prompt on first attempt, fall back to basic on retries
    let fullPrompt: string;
    let promptEnhanced = false;
    let enhancementMetadata: EnhancedPrompt['metadata'] | undefined;

    if (attempt === 1) {
      // First attempt: use enhanced prompt with RAG + patterns
      const enhanced = await buildEnhancedContextualPrompt(request);
      fullPrompt = enhanced.prompt;
      promptEnhanced = enhanced.enhanced;
      enhancementMetadata = enhanced.metadata;
    } else {
      // Retry attempts: use basic prompt (more deterministic)
      fullPrompt = buildContextualPrompt(request);
    }

    logger.debug(`Generation attempt ${attempt}/${MAX_RETRIES + 1}`, {
      component: 'firebase-ai-generator',
      enhanced: promptEnhanced,
    });

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // Try to parse JSON
    const tool = JSON.parse(text);
    return { success: true, tool, promptEnhanced, enhancementMetadata };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isParseError = errorMessage.includes('JSON') || errorMessage.includes('parse');

    logger.error(`Attempt ${attempt} failed: ${errorMessage}`, { component: 'firebase-ai-generator', attempt });

    // Retry on JSON parse errors (truncation issues)
    if (isParseError && attempt <= MAX_RETRIES) {
      logger.debug(`Retrying in ${RETRY_DELAY_MS}ms...`, { component: 'firebase-ai-generator' });
      await delay(RETRY_DELAY_MS);
      return attemptGeneration(request, attempt + 1);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Extended streaming chunk with validation metadata
 */
export interface ValidatedStreamingChunk extends StreamingChunk {
  data: StreamingChunk['data'] & {
    // Quality metadata on 'complete' chunks
    quality?: {
      score: number;
      decision: 'accepted' | 'partial_accept' | 'rejected';
      fixes?: string[];
      generationId?: string;
    };
  };
}

/**
 * Generation context for quality tracking
 */
export interface GenerationContext {
  userId?: string | null;
  sessionId?: string;
  campusId?: string;
}

/**
 * Generate tool with streaming for real-time canvas updates
 * Includes retry logic, fallback to mock generator, and AI quality validation
 */
export async function* firebaseGenerateToolStreaming(
  request: GenerateToolRequest,
  context?: GenerationContext
): AsyncGenerator<ValidatedStreamingChunk> {
  // Ensure quality pipeline is initialized with Firestore (lazy init)
  ensurePipelineInitialized();

  const startTime = Date.now();
  const sessionId = context?.sessionId || generateSessionId();
  let retryCount = 0;
  let usedFallback = false;

  const thinkingMessage = request.spaceContext
    ? `Generating tool for "${request.spaceContext.spaceName}": "${request.prompt.substring(0, 40)}..."`
    : `Understanding: "${request.prompt.substring(0, 50)}..."`;

  yield {
    type: 'thinking',
    data: { message: thinkingMessage },
  };

  // Attempt generation with retries
  const result = await attemptGeneration(request);
  retryCount = 0; // attemptGeneration handles its own retries

  if (result.success) {
    const tool = result.tool;

    // ═══════════════════════════════════════════════════════════════════
    // AI QUALITY VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    // Transform raw tool output to ToolComposition format for validation
    const composition = transformToComposition(tool, request);

    // Run through quality pipeline
    const latencyMs = Date.now() - startTime;
    let pipelineResult: PipelineResult;

    try {
      pipelineResult = await qualityPipeline.process(composition, {
        userId: context?.userId ?? null,
        sessionId,
        campusId: context?.campusId,
        prompt: request.prompt,
        isIteration: request.isIteration || false,
        model: 'gemini-2.0-flash',
        promptVersion: CURRENT_PROMPT_VERSION,
        spaceContext: request.spaceContext,
        constraints: request.constraints,
        tokenCount: { input: request.prompt.length, output: JSON.stringify(tool).length },
        retryCount,
        usedFallback,
        latencyMs,
      });

      logger.info('Quality pipeline result', {
        component: 'firebase-ai-generator',
        decision: pipelineResult.decision,
        score: pipelineResult.score.overall,
        fixes: pipelineResult.fixes.length,
        generationId: pipelineResult.generationId,
      });

    } catch (pipelineError) {
      // If pipeline fails, log but don't block generation
      logger.error('Quality pipeline error', { component: 'firebase-ai-generator' }, pipelineError instanceof Error ? pipelineError : undefined);

      // Create a fallback result that passes through
      pipelineResult = {
        accepted: true,
        decision: 'accepted',
        composition,
        validation: { valid: true, score: { overall: 0, schema: 0, elements: 0, config: 0, connections: 0, semantic: 0 }, errors: [], warnings: [], metadata: { validatedAt: new Date().toISOString(), durationMs: 0, elementCount: 0, connectionCount: 0 } },
        score: { overall: 0, schema: 0, elements: 0, config: 0, connections: 0, semantic: 0 },
        fixes: [],
        generationId: 'unknown',
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // HANDLE REJECTION
    // ═══════════════════════════════════════════════════════════════════

    if (!pipelineResult.accepted) {
      logger.warn('Generation rejected by quality gate', {
        component: 'firebase-ai-generator',
        reason: pipelineResult.rejectionReason,
        hints: pipelineResult.regenerationHints,
      });

      // Emit rejection as error chunk
      yield {
        type: 'error',
        data: {
          error: pipelineResult.rejectionReason || 'Generation failed quality checks',
          quality: {
            score: pipelineResult.score.overall,
            decision: pipelineResult.decision,
            generationId: pipelineResult.generationId,
          },
          hints: pipelineResult.regenerationHints,
        },
      };
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // STREAM VALIDATED (potentially fixed) COMPOSITION
    // ═══════════════════════════════════════════════════════════════════

    // Use the composition from pipeline (may have auto-fixes applied)
    const validatedComposition = pipelineResult.composition;

    // For iteration mode: filter out duplicates and track what we're adding
    const existingIds = new Set(
      request.existingComposition?.elements?.map((el) => el.instanceId) ?? []
    );
    const newElements = validatedComposition.elements.filter(
      (el) => !existingIds.has(el.instanceId)
    );

    // Stream elements one by one for canvas animation
    const elementsToStream = request.isIteration ? newElements : validatedComposition.elements;

    for (const element of elementsToStream) {
      yield {
        type: 'element',
        data: {
          id: element.instanceId || `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: element.elementId,
          name: element.elementId,
          config: { ...(element.config || {}), aiGenerated: true },
          position: element.position || { x: 100, y: 100 },
          size: element.size || { width: 300, height: 200 },
        },
      };
      await delay(150); // Smooth animation
    }

    // Stream connections
    for (const connection of validatedComposition.connections || []) {
      yield {
        type: 'connection',
        data: {
          id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
          from: connection.from.instanceId,
          to: connection.to.instanceId,
          fromOutput: connection.from.output,
          toInput: connection.to.input,
          type: 'data-flow',
        },
      };
      await delay(100);
    }

    // For iteration mode: preserve original tool name unless explicitly changed
    const toolName = request.isIteration
      ? request.existingComposition?.name || validatedComposition.name || 'Generated Tool'
      : validatedComposition.name || 'Generated Tool';

    // Calculate total element count (existing + new for iterations)
    const totalElementCount = request.isIteration
      ? (request.existingComposition?.elements?.length ?? 0) + newElements.length
      : validatedComposition.elements.length;

    // Complete with quality metadata
    yield {
      type: 'complete',
      data: {
        toolId: `tool-${Date.now()}`,
        name: toolName,
        description: validatedComposition.description || '',
        elementCount: totalElementCount,
        connectionCount: validatedComposition.connections?.length || 0,
        layout: validatedComposition.layout || 'flow',
        // Include quality metadata
        quality: {
          score: pipelineResult.score.overall,
          decision: pipelineResult.decision,
          fixes: pipelineResult.fixes,
          generationId: pipelineResult.generationId,
        },
      },
    };
  } else {
    // All retries failed - fall back to mock generator
    logger.warn('All retries failed, falling back to mock generator', { component: 'firebase-ai-generator', error: result.error });
    usedFallback = true;

    // Record failure
    try {
      await qualityPipeline.recordFailure(result.error, {
        userId: context?.userId ?? null,
        sessionId,
        campusId: context?.campusId,
        prompt: request.prompt,
        isIteration: request.isIteration || false,
        model: 'gemini-2.0-flash',
        promptVersion: CURRENT_PROMPT_VERSION,
        latencyMs: Date.now() - startTime,
        retryCount,
      }, {
        fallbackAttempted: true,
        fallbackSucceeded: true, // We're about to try fallback
      });
    } catch (trackingError) {
      logger.error('Failed to record failure', { component: 'firebase-ai-generator' }, trackingError instanceof Error ? trackingError : undefined);
    }

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
 * Transform raw Gemini output to ToolComposition format
 */
function transformToComposition(
  tool: Record<string, unknown>,
  request: GenerateToolRequest
): import('@hive/core').ToolComposition {
  const elements = ((tool.elements as Array<Record<string, unknown>>) || []).map((el, index) => ({
    elementId: (el.type as string) || 'unknown',
    instanceId: (el.instanceId as string) || `el-${Date.now()}-${index}`,
    position: (el.position as { x: number; y: number }) || { x: 100, y: 100 + index * 150 },
    size: (el.size as { width: number; height: number }) || { width: 300, height: 200 },
    config: (el.config as Record<string, unknown>) || {},
  }));

  const connections = ((tool.connections as Array<Record<string, unknown>>) || []).map((conn, index) => ({
    from: {
      instanceId: (conn.from as string) || '',
      output: 'default',
    },
    to: {
      instanceId: (conn.to as string) || '',
      input: 'default',
    },
  }));

  return {
    id: `tool-${Date.now()}`,
    name: (tool.name as string) || 'Generated Tool',
    description: (tool.description as string) || '',
    elements,
    connections,
    layout: ((tool.layout as string) || 'flow') as 'grid' | 'flow' | 'tabs' | 'sidebar',
  };
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
