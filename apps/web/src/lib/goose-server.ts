/**
 * Goose Server - Backend utilities for HiveLab tool generation
 *
 * Handles local rules-based generation and optional Groq enhancement.
 * Used by the /api/tools/generate endpoint.
 */

// Note: These imports are from the local goose module in packages/core
// Once the package export is properly configured, change to '@hive/core/hivelab/goose'
import {
  validateToolComposition,
  parseModelOutput,
  sanitizeComposition,
  buildSystemPrompt,
  buildCompactSystemPrompt,
  type ToolComposition,
} from '@hive/core/hivelab/goose';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { logger } from './logger';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type GooseBackend = 'groq' | 'rules';

export interface GooseConfig {
  backend: GooseBackend;
  groqApiKey?: string;
  groqModel: string;
}

export interface SpaceContext {
  type?: string;       // e.g. 'social', 'academic', 'project', 'club'
  memberCount?: number;
  name?: string;
}

export interface GenerateRequest {
  prompt: string;
  existingComposition?: ToolComposition;
  isIteration?: boolean;
  spaceContext?: SpaceContext;
}

export interface StreamMessage {
  type: 'thinking' | 'element' | 'connection' | 'complete' | 'error';
  data: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// XSS SANITIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Recursively strip HTML tags from all string values in a config object.
 * Prevents XSS injection from AI-generated or user-provided content.
 */
function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') return val.replace(/<[^>]*>/g, '').trim();
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  return val;
}

/**
 * Sanitize all element configs in a composition to remove HTML tags.
 */
function sanitizeElementConfigs(composition: ToolComposition): ToolComposition {
  return {
    ...composition,
    elements: composition.elements.map((el) => ({
      ...el,
      config: sanitizeValue(el.config) as Record<string, unknown>,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export function getGooseConfig(): GooseConfig {
  const requestedBackend = process.env.GOOSE_BACKEND;
  // Default to groq when API key is available, rules otherwise
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const backend: GooseBackend =
    requestedBackend === 'rules' ? 'rules' :
    requestedBackend === 'groq' ? 'groq' :
    hasGroqKey ? 'groq' : 'rules';

  return {
    backend,
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  };
}

let hasWarnedAboutMissingGroqKey = false;

export function validateGroqConfig(): boolean {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    if (!hasWarnedAboutMissingGroqKey) {
      logger.warn('GROQ_API_KEY not set — custom block generation will fail', {
        component: 'goose-server',
      });
      hasWarnedAboutMissingGroqKey = true;
    }
    return false;
  }

  hasWarnedAboutMissingGroqKey = false;
  return true;
}

// Startup-time configuration signal.
const groqConfigValidAtStartup = validateGroqConfig();
void groqConfigValidAtStartup;

// ═══════════════════════════════════════════════════════════════════
// GROQ BACKEND (Cloud Fallback)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// AI SDK STRUCTURED OUTPUT
// ═══════════════════════════════════════════════════════════════════

/**
 * Zod schema for structured tool composition output.
 * Guarantees valid JSON from any model via grammar-constrained generation.
 */
const ToolCompositionSchema = z.object({
  reasoning: z.string().describe(
    'Think about what the student actually needs. What social dynamics are at play? Who are the actors? What trust, timing, or structure is required? 2-4 sentences.'
  ),
  elements: z.array(z.object({
    type: z.string().describe('Element type from the catalog'),
    instanceId: z.string().describe('Unique instance ID like poll_element_1'),
    config: z.record(z.unknown()).describe('Element-specific configuration'),
    position: z.object({ x: z.number(), y: z.number() }),
    size: z.object({ width: z.number(), height: z.number() }),
  })).min(1).max(8),
  connections: z.array(z.object({
    from: z.object({ instanceId: z.string(), port: z.string() }),
    to: z.object({ instanceId: z.string(), port: z.string() }),
  })).default([]),
  name: z.string().describe('Short tool name'),
  description: z.string().describe('Brief description of what the tool does'),
  layout: z.enum(['grid', 'flow', 'tabs', 'sidebar']).default('grid'),
});

// ═══════════════════════════════════════════════════════════════════
// AI VALIDATION + REVISION
// ═══════════════════════════════════════════════════════════════════

const ValidationSchema = z.object({
  passes: z.boolean().describe('Does the composition serve the original need well?'),
  issues: z.array(z.object({
    problem: z.string().describe('What is wrong or missing'),
    fix: z.string().describe('Specific change to make'),
  })).describe('Empty if passes=true. Otherwise, specific issues to fix.'),
});

async function validateWithAI(
  config: GooseConfig,
  composition: ToolComposition,
  reasoning: string,
  originalPrompt: string,
): Promise<{ passes: boolean; issues: Array<{ problem: string; fix: string }> }> {
  const groq = createGroq({ apiKey: config.groqApiKey! });

  const { object } = await generateObject({
    model: groq(config.groqModel),
    schema: ValidationSchema,
    system: `You review campus tools. Given a student's request and a generated tool composition, check:
- Does the composition actually serve what the student asked for?
- Are there obvious mismatches (e.g., student wants anonymous feedback but tool collects names)?
- Are elements connected that should be (e.g., poll exists with chart but no connection)?
- Is anything critical missing for the tool to work for its intended purpose?
- Is anything unnecessary that adds complexity without value?

Be concise. Only flag real issues, not style preferences.`,
    prompt: `Student request: "${originalPrompt}"
AI reasoning: "${reasoning}"
Composition: ${JSON.stringify(composition, null, 2)}

Does this tool serve the student's need? If not, what specific issues need fixing?`,
    temperature: 0.1,
    maxOutputTokens: 512,
  });

  return object;
}

async function reviseComposition(
  config: GooseConfig,
  original: ToolComposition,
  issues: Array<{ problem: string; fix: string }>,
  originalPrompt: string,
): Promise<ToolComposition> {
  const groq = createGroq({ apiKey: config.groqApiKey! });
  const issueText = issues.map(i => `- Problem: ${i.problem}. Fix: ${i.fix}`).join('\n');

  const { object } = await generateObject({
    model: groq(config.groqModel),
    schema: ToolCompositionSchema,
    system: buildSystemPrompt(),
    prompt: `Fix this tool composition.

Original request: "${originalPrompt}"
Current composition: ${JSON.stringify(original, null, 2)}

Issues found:
${issueText}

Generate the corrected composition. Keep what works, fix what doesn't.`,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  return {
    name: object.name,
    description: object.description,
    elements: object.elements.map(el => ({
      type: el.type,
      instanceId: el.instanceId,
      config: el.config,
      position: el.position,
      size: el.size,
    })),
    connections: object.connections.map(conn => ({
      from: { instanceId: conn.from.instanceId, port: conn.from.port },
      to: { instanceId: conn.to.instanceId, port: conn.to.port },
    })),
    layout: object.layout,
    pages: [],
  };
}

/**
 * Generate a tool composition using AI SDK with structured output.
 * Uses Groq for fast, cost-effective structured generation.
 */
interface StructuredResult {
  composition: ToolComposition;
  reasoning: string;
}

async function callGroqStructured(
  config: GooseConfig,
  prompt: string,
  systemPrompt: string
): Promise<StructuredResult> {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const groq = createGroq({ apiKey: config.groqApiKey });

  const { object } = await generateObject({
    model: groq(config.groqModel),
    schema: ToolCompositionSchema,
    system: systemPrompt,
    prompt,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  // Capture reasoning before stripping
  const reasoning = object.reasoning || '';

  // Map AI SDK output to ToolComposition format (strip reasoning)
  return {
    reasoning,
    composition: {
      name: object.name,
      description: object.description,
      elements: object.elements.map(el => ({
        type: el.type,
        instanceId: el.instanceId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: object.connections.map(conn => ({
        from: { instanceId: conn.from.instanceId, port: conn.from.port },
        to: { instanceId: conn.to.instanceId, port: conn.to.port },
      })),
      layout: object.layout,
      pages: [],
    },
  };
}

/**
 * Legacy raw string Groq call (fallback if structured output fails).
 */
async function callGroqRaw(
  config: GooseConfig,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const is70b = config.groqModel.includes('70b');
  const maxTokens = is70b ? 2048 : 1024;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      response_format: is70b ? { type: 'json_object' } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════════════════════════
// GROQ SEMANTIC ITERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Use Groq to semantically modify an existing composition.
 * Unlike fresh generation, this sends the current composition as context
 * and asks the model to apply the user's modification request.
 */
async function callGroqIteration(
  config: GooseConfig,
  userPrompt: string,
  existingComposition: ToolComposition,
): Promise<StructuredResult> {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const groq = createGroq({ apiKey: config.groqApiKey });

  const iterationSystemPrompt = buildSystemPrompt({
    existingComposition,
    isIteration: true,
  });

  const { object } = await generateObject({
    model: groq(config.groqModel),
    schema: ToolCompositionSchema,
    system: iterationSystemPrompt,
    prompt: `User request: "${userPrompt}"\n\nApply this modification. Preserve what works, change what needs changing.`,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  const reasoning = object.reasoning || '';

  // Preserve instanceIds where elements match by type
  const result: ToolComposition = {
    name: object.name || existingComposition.name,
    description: object.description || existingComposition.description,
    elements: object.elements.map(el => {
      const existing = existingComposition.elements.find(
        e => e.instanceId === el.instanceId || (e.type === el.type && !object.elements.some(o => o.instanceId === e.instanceId && o !== el))
      );
      return {
        type: el.type,
        instanceId: existing?.instanceId || el.instanceId,
        config: el.config,
        position: el.position,
        size: el.size,
      };
    }),
    connections: object.connections.map(conn => ({
      from: { instanceId: conn.from.instanceId, port: conn.from.port },
      to: { instanceId: conn.to.instanceId, port: conn.to.port },
    })),
    layout: object.layout || existingComposition.layout,
    pages: existingComposition.pages,
  };

  return { composition: result, reasoning };
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT ANALYSIS
// ═══════════════════════════════════════════════════════════════════

interface PromptAnalysis {
  question: string | null;
  options: string[];
  eventName: string | null;
  targetDate: Date | null;
  subject: string;
  fields: Array<{ name: string; label: string; type: string }>;
  items: string[];
}

function analyzePrompt(prompt: string): PromptAnalysis {
  const result: PromptAnalysis = {
    question: null,
    options: [],
    eventName: null,
    targetDate: null,
    subject: '',
    fields: [],
    items: [],
  };

  // Extract explicit options: "options: A, B, C" or "with options A, B, C"
  // Also handles "choices:", "between X, Y, and Z", "A vs B vs C", "A or B or C"
  const optionsMatch = prompt.match(
    /(?:options?|choices?)\s*[:=]\s*(.+?)(?:\.|$)/i
  ) || prompt.match(
    /(?:with\s+options?|with\s+choices?)\s+(.+?)(?:\.|$)/i
  );
  if (optionsMatch) {
    result.options = splitList(optionsMatch[1]);
  } else {
    const vsMatch = prompt.match(/\b(.+?)\s+vs\.?\s+(.+?)(?:\s+vs\.?\s+(.+?))?(?:\.|$)/i);
    if (vsMatch) {
      result.options = [vsMatch[1].trim(), vsMatch[2].trim()];
      if (vsMatch[3]) result.options.push(vsMatch[3].trim());
    } else {
      const orMatch = prompt.match(/(?:between|choose|pick)\s+(.+?\s+or\s+.+?)(?:\.|$)/i);
      if (orMatch) {
        result.options = orMatch[1].split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);
      }
    }
  }

  // Clean up options
  result.options = result.options
    .map(o => o.replace(/^(and|or)\s+/i, '').trim())
    .filter(o => o.length > 0 && o.length < 80);

  // Extract question: text ending in "?" or "about X" patterns
  const questionMatch = prompt.match(/[""](.+?\?)[""]/) || prompt.match(/["""](.+?\?)["""]/) || prompt.match(/(?:^|\.\s*)([^.]+\?)$/);
  if (questionMatch) {
    result.question = questionMatch[1].trim();
  } else {
    const aboutMatch = prompt.match(/(?:poll|vote|survey|ask)\s+(?:about|on|for)\s+(.+?)(?:\s+with|\s+options|\s+choices|\.|$)/i);
    if (aboutMatch) {
      const topic = aboutMatch[1].trim();
      result.question = topic.endsWith('?') ? topic : `What do you think about ${topic}?`;
    }
  }

  // Extract event name: "for [event name]" or "[event] RSVP/signup"
  const eventMatch = prompt.match(
    /(?:rsvp|signup|sign[- ]up|register|registration|attend)\s+(?:for|to)\s+(.+?)(?:\s+with|\s+options|\.|$)/i
  ) || prompt.match(
    /(.+?)\s+(?:rsvp|signup|sign[- ]up|registration)/i
  ) || prompt.match(
    /(?:for|to)\s+(?:the\s+)?(.+?)(?:\s+with|\s+options|\.|$)/i
  );
  if (eventMatch) {
    result.eventName = titleCase(eventMatch[1].trim().replace(/^(a|an|the)\s+/i, ''));
  }

  // Extract date: "March 15", "next Friday", "January 20, 2026", "in 3 days"
  const dateStr = extractDateFromText(prompt);
  if (dateStr) {
    result.targetDate = dateStr;
  }

  // Extract subject (primary noun phrase)
  const subjectMatch = prompt.match(
    /(?:create|make|build|generate)\s+(?:a|an|the)?\s*(.+?)(?:\s+tool|\s+for|\s+with|\s+that|\.|$)/i
  );
  if (subjectMatch) {
    result.subject = subjectMatch[1].trim();
  } else {
    // Fall back to first meaningful phrase
    result.subject = prompt.replace(/^(create|make|build|generate|i need|i want)\s+(a|an|the)?\s*/i, '').split(/[.,!?]/)[0].trim();
  }

  // Extract form fields from "fields: name, email, phone" patterns
  const fieldsMatch = prompt.match(/(?:fields?|inputs?|questions?)\s*[:=]\s*(.+?)(?:\.|$)/i);
  if (fieldsMatch) {
    result.fields = splitList(fieldsMatch[1]).map(f => ({
      name: f.toLowerCase().replace(/\s+/g, '_'),
      label: titleCase(f),
      type: guessFieldType(f),
    }));
  }

  // Extract list items from "items: X, Y, Z" patterns
  const itemsMatch = prompt.match(/(?:items?|tasks?|things?|list)\s*[:=]\s*(.+?)(?:\.|$)/i);
  if (itemsMatch) {
    result.items = splitList(itemsMatch[1]);
  }

  return result;
}

function splitList(text: string): string[] {
  return text
    .split(/[,;]\s*|\s+and\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function guessFieldType(field: string): string {
  const lower = field.toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('number')) return 'tel';
  if (lower.includes('comment') || lower.includes('feedback') || lower.includes('message') || lower.includes('description')) return 'textarea';
  if (lower.includes('date') || lower.includes('when')) return 'date';
  return 'text';
}

function extractDateFromText(prompt: string): Date | null {
  // Explicit date: "March 15", "January 20, 2026", "12/25/2026"
  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthMatch = prompt.match(
    new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?`, 'i')
  );
  if (monthMatch) {
    const month = monthNames.indexOf(monthMatch[1].toLowerCase());
    const day = parseInt(monthMatch[2]);
    const year = monthMatch[3] ? parseInt(monthMatch[3]) : new Date().getFullYear();
    const date = new Date(year, month, day);
    if (date > new Date()) return date;
    // If date already passed this year, use next year
    return new Date(year + 1, month, day);
  }

  // Relative: "in 3 days", "in 2 weeks"
  const relativeMatch = prompt.match(/in\s+(\d+)\s+(day|week|month|hour)s?/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const date = new Date();
    if (unit === 'day') date.setDate(date.getDate() + amount);
    else if (unit === 'week') date.setDate(date.getDate() + amount * 7);
    else if (unit === 'month') date.setMonth(date.getMonth() + amount);
    else if (unit === 'hour') date.setHours(date.getHours() + amount);
    return date;
  }

  // "next Friday", "next Monday" etc.
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const nextDayMatch = prompt.match(
    new RegExp(`next\\s+(${dayNames.join('|')})`, 'i')
  );
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
    const date = new Date();
    const currentDay = date.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntil);
    return date;
  }

  // "tomorrow"
  if (/\btomorrow\b/i.test(prompt)) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// RULES-BASED FALLBACK
// ═══════════════════════════════════════════════════════════════════

// Detect multi-page intent from prompt keywords
const MULTI_PAGE_PATTERN = /\b(pages?|steps?|flow|wizard|multi.?step|registration\s+flow|onboarding|walkthrough|funnel|step.?by.?step|(\d+).?page|(\d+).?step)\b/i;

function detectMultiPageIntent(prompt: string): { isMultiPage: boolean; pageCount: number } {
  const match = prompt.match(MULTI_PAGE_PATTERN);
  if (!match) return { isMultiPage: false, pageCount: 1 };

  // Try to extract page count from "3-page", "3 step", etc.
  const countMatch = prompt.match(/(\d+)\s*[-\s]?\s*(?:page|step|screen)/i);
  const pageCount = countMatch ? Math.min(parseInt(countMatch[1]), 5) : 3; // cap at 5

  return { isMultiPage: true, pageCount };
}

// ── Iteration Intent Detection ────────────────────────────────────
const APPEND_PATTERN = /\b(add|include|also|plus|with\s+a|and\s+a|throw\s+in|insert|put\s+in)\b/i;
const REMOVE_PATTERN = /\b(remove|delete|take\s+out|get\s+rid\s+of|drop|lose\s+the|no\s+more)\b/i;
const MODIFY_PATTERN = /\b(change|make\s+the|update|rename|edit|modify|switch|replace\s+the)\b/i;

type IterationMode = 'append' | 'remove' | 'modify';

function detectIterationMode(lowerPrompt: string): IterationMode {
  if (REMOVE_PATTERN.test(lowerPrompt)) return 'remove';
  if (MODIFY_PATTERN.test(lowerPrompt)) return 'modify';
  return 'append'; // default — "add" keywords or anything unrecognized
}

/**
 * Apply additive/subtractive/modify rules to an existing composition.
 * Returns the updated composition, or null if no meaningful change was made
 * (signals the caller to fall through to full generation).
 */
function applyIterationRules(
  prompt: string,
  lowerPrompt: string,
  existing: ToolComposition,
): ToolComposition | null {
  const mode = detectIterationMode(lowerPrompt);
  const workingElements = [...existing.elements];
  const workingConnections = [...(existing.connections || [])];

  if (mode === 'remove') {
    const beforeCount = workingElements.length;
    // Build a set of keywords from the prompt to match against element titles/types
    const promptWords = lowerPrompt
      .replace(REMOVE_PATTERN, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const filtered = workingElements.filter(el => {
      const title = ((el.config?.title || el.config?.question || el.config?.eventName || '') as string).toLowerCase();
      const elType = el.type.toLowerCase();
      const elId = el.instanceId.toLowerCase();
      return !promptWords.some(word =>
        title.includes(word) || elType.includes(word) || elId.includes(word)
      );
    });

    if (filtered.length < beforeCount && filtered.length > 0) {
      // Remove connections referencing deleted elements
      const remainingIds = new Set(filtered.map(e => e.instanceId));
      const cleanedConnections = workingConnections.filter(
        c => remainingIds.has(c.from.instanceId) && remainingIds.has(c.to.instanceId)
      );
      return {
        ...existing,
        elements: filtered,
        connections: cleanedConnections,
      };
    }
    // If nothing matched or would empty the tool, return null to fall through
    return null;
  }

  if (mode === 'modify') {
    const promptWords = lowerPrompt
      .replace(MODIFY_PATTERN, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Fuzzy element matching: "the voting thing" → poll-element, "the counter" → counter
    const ELEMENT_ALIASES: Record<string, string[]> = {
      'poll-element': ['poll', 'vote', 'voting', 'survey', 'ballot'],
      'counter': ['counter', 'tally', 'count', 'number'],
      'rsvp-button': ['rsvp', 'signup', 'register', 'attend'],
      'countdown-timer': ['countdown', 'timer', 'deadline', 'clock'],
      'checklist-tracker': ['checklist', 'todo', 'tasks', 'list'],
      'leaderboard': ['leaderboard', 'scoreboard', 'ranking', 'scores'],
      'form-builder': ['form', 'feedback', 'input', 'submission'],
      'progress-indicator': ['progress', 'bar', 'goal', 'target'],
      'chart-display': ['chart', 'graph', 'visual'],
      'signup-sheet': ['sheet', 'volunteer', 'slots'],
      'tag-cloud': ['tags', 'cloud', 'labels'],
      'photo-gallery': ['gallery', 'photos', 'images'],
    };

    let modified = false;
    const updatedElements = workingElements.map(el => {
      const title = ((el.config?.title || el.config?.question || el.config?.eventName || '') as string).toLowerCase();
      const elType = el.type.toLowerCase();
      const aliases = ELEMENT_ALIASES[el.type] || [];

      // Match by title, type, aliases, or fuzzy prompt words
      const isTarget = promptWords.some(word =>
        title.includes(word) ||
        elType.includes(word) ||
        aliases.some(alias => word.includes(alias) || alias.includes(word))
      );
      if (!isTarget) return el;

      modified = true;
      const newConfig = { ...el.config };

      // Extract new title from patterns like "rename X to Y" or "change title to Y"
      const renameMatch = prompt.match(/(?:rename|change(?:\s+the)?(?:\s+title)?)\s+(?:.*?\s+)?to\s+[""]?(.+?)[""]?\s*$/i);
      if (renameMatch) {
        const newTitle = renameMatch[1].trim();
        if (newConfig.title !== undefined) newConfig.title = newTitle;
        if (newConfig.question !== undefined) newConfig.question = newTitle;
        if (newConfig.eventName !== undefined) newConfig.eventName = newTitle;
      }

      // Extract options changes: "change options to X, Y, Z" or "add more options to the poll"
      const optionsMatch = prompt.match(/(?:options?|choices?)\s+to\s+(.+?)(?:\.|$)/i);
      if (optionsMatch && newConfig.options !== undefined) {
        newConfig.options = splitList(optionsMatch[1]);
      }

      // Config-level: "add more options" → append to options array
      const addOptionsMatch = prompt.match(/add\s+(?:more\s+)?(?:options?|choices?)\s+(?:like\s+|:\s*)?(.+?)(?:\.|$)/i);
      if (addOptionsMatch && Array.isArray(newConfig.options)) {
        const newOptions = splitList(addOptionsMatch[1]);
        newConfig.options = [...(newConfig.options as string[]), ...newOptions];
      }

      // Layout iteration: "make it horizontal" or "change to flow layout"
      if (/\b(horizontal|flow|inline)\b/.test(lowerPrompt)) {
        newConfig.layout = 'flow';
      }
      if (/\b(vertical|stack|grid)\b/.test(lowerPrompt)) {
        newConfig.layout = 'grid';
      }

      // Max items: "show top 5" or "limit to 20"
      const limitMatch = prompt.match(/(?:top|limit|show|max)\s*(\d+)/i);
      if (limitMatch) {
        if (newConfig.maxItems !== undefined) newConfig.maxItems = parseInt(limitMatch[1]);
        if (newConfig.maxAttendees !== undefined) newConfig.maxAttendees = parseInt(limitMatch[1]);
      }

      return { ...el, config: newConfig };
    });

    // Layout-level iteration: "make it horizontal" changes the composition layout
    if (/\b(horizontal|flow)\b/.test(lowerPrompt) && !modified) {
      return { ...existing, elements: workingElements, connections: workingConnections, layout: 'flow' as const };
    }
    if (/\b(tabs|tabbed)\b/.test(lowerPrompt) && !modified) {
      return { ...existing, elements: workingElements, connections: workingConnections, layout: 'tabs' as const };
    }

    if (modified) {
      return { ...existing, elements: updatedElements, connections: workingConnections };
    }
    return null;
  }

  // ── Append mode ──────────────────────────────────────────────────
  const existingTypes = new Set(workingElements.map(e => e.type));
  const maxY = workingElements.reduce(
    (max, el) => Math.max(max, (el.position?.y || 0) + (el.size?.height || 200)),
    0,
  );
  let nextY = maxY + 20;

  const newElements: ToolComposition['elements'] = [];
  const newConnections: ToolComposition['connections'] = [];

  function addNewElement(
    type: string,
    instanceId: string,
    config: Record<string, unknown>,
    width = 12,
    height = 200,
  ) {
    if (existingTypes.has(type)) return; // Don't duplicate element types
    newElements.push({
      type,
      instanceId,
      config,
      position: { x: 0, y: nextY },
      size: { width, height },
    });
    nextY += height + 20;
  }

  const analysis = analyzePrompt(prompt);

  // Run keyword detection — same as normal generation but only for NEW types
  if (/\b(poll|vote|survey|ballot|rank|preference)\b/.test(lowerPrompt)) {
    const options = analysis.options.length >= 2
      ? analysis.options
      : ['Option A', 'Option B', 'Option C'];
    addNewElement('poll-element', 'poll_001', {
      question: analysis.question || `What do you think about ${analysis.subject || 'this'}?`,
      options,
      showResults: true,
      allowMultipleVotes: lowerPrompt.includes('multiple') || lowerPrompt.includes('multi'),
    });
  }

  if (/\b(rsvp|sign\s*up|signup|register|registration|attend|going)\b/.test(lowerPrompt)) {
    addNewElement('rsvp-button', 'rsvp_001', {
      eventName: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showAttendeeCount: true,
      enableWaitlist: lowerPrompt.includes('waitlist') || lowerPrompt.includes('limit'),
      maxAttendees: extractNumber(lowerPrompt, /(?:max|limit|cap)\s*(?:of|:)?\s*(\d+)/i),
    }, 12, 120);
  }

  if (/\b(countdown|count\s*down|time\s*left|days?\s*until|deadline)\b/.test(lowerPrompt)) {
    const targetDate = analysis.targetDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    })();
    addNewElement('countdown-timer', 'countdown_001', {
      targetDate: targetDate.toISOString(),
      title: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showDays: true,
      showHours: true,
      showMinutes: true,
    }, 12, 140);
  }

  if (/\b(leaderboard|ranking|scoreboard|top\s*\d+|competition|contest)\b/.test(lowerPrompt)) {
    addNewElement('leaderboard', 'leaderboard_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Leaderboard',
      maxItems: extractNumber(lowerPrompt, /top\s*(\d+)/i) || 10,
      showRank: true,
    });
  }

  if (/\b(counter|tally|count|track\s*(?:a\s+)?number|how\s*many)\b/.test(lowerPrompt) && !/\b(countdown)\b/.test(lowerPrompt)) {
    addNewElement('counter-element', 'counter_001', {
      label: titleCase(analysis.subject) || 'Count',
      initialValue: 0,
      step: 1,
      showControls: true,
    }, 12, 120);
  }

  if (/\b(checklist|to\s*-?\s*do|task\s*list|sign\s*-?\s*up\s*sheet|slot)\b/.test(lowerPrompt)) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Task 1', 'Task 2', 'Task 3'];
    addNewElement('checklist-tracker', 'checklist_001', {
      title: titleCase(analysis.subject) || 'Tasks',
      items: items.map(item => ({ text: item, completed: false })),
    });
  }

  if (/\b(signup\s*sheet|volunteer|bring\s*list|potluck|assign)\b/.test(lowerPrompt)) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'];
    addNewElement('signup-sheet', 'signup_sheet_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Sign-Up Sheet',
      slots: items.map(item => ({ label: item, maxSignups: 1 })),
    });
  }

  if (/\b(form|feedback|submission|input|collect|gather|questionnaire)\b/.test(lowerPrompt)) {
    const fields = analysis.fields.length > 0
      ? analysis.fields
      : [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'response', label: lowerPrompt.includes('feedback') ? 'Your Feedback' : 'Response', type: 'textarea' },
        ];
    addNewElement('form-builder', 'form_001', {
      fields: fields.map(f => ({ ...f, required: true })),
      submitButtonText: lowerPrompt.includes('feedback') ? 'Send Feedback' : 'Submit',
    });
  }

  if (/\b(progress|goal|fundrais|target|milestone)\b/.test(lowerPrompt)) {
    const target = extractNumber(lowerPrompt, /(?:goal|target|raise)\s*(?:of|:)?\s*\$?(\d+)/i) || 100;
    addNewElement('progress-indicator', 'progress_001', {
      title: titleCase(analysis.subject) || 'Progress',
      current: 0,
      target,
      unit: lowerPrompt.includes('$') || lowerPrompt.includes('fundrais') ? '$' : '',
    }, 12, 100);
  }

  if (/\b(chart|graph|visual|results?\s*display|analytics)\b/.test(lowerPrompt)) {
    addNewElement('chart-display', 'chart_001', {
      chartType: lowerPrompt.includes('pie') ? 'pie' : lowerPrompt.includes('line') ? 'line' : 'bar',
      title: 'Results',
      showLegend: true,
    }, 12, 240);

    // Wire poll → chart if poll exists in either existing or new elements
    const pollEl = workingElements.find(e => e.type === 'poll-element')
      || newElements.find(e => e.type === 'poll-element');
    if (pollEl) {
      newConnections.push({
        from: { instanceId: pollEl.instanceId, port: 'results' },
        to: { instanceId: 'chart_001', port: 'data' },
      });
    }
  }

  // If no new elements were generated, return null to fall through to full generation
  if (newElements.length === 0) return null;

  return {
    ...existing,
    elements: [...workingElements, ...newElements],
    connections: [...workingConnections, ...newConnections],
  };
}

function generateWithRules(
  prompt: string,
  existingComposition?: ToolComposition,
  isIteration?: boolean,
): ToolComposition {
  const lowerPrompt = prompt.toLowerCase();
  const analysis = analyzePrompt(prompt);

  // ── Additive iteration: modify existing composition instead of replacing ──
  if (isIteration && existingComposition?.elements && existingComposition.elements.length > 0) {
    const result = applyIterationRules(prompt, lowerPrompt, existingComposition);
    if (result) return result;
    // If no changes could be applied (e.g., append mode found nothing new), fall through to normal generation
  }

  const multiPage = detectMultiPageIntent(prompt);

  // If multi-page is detected, delegate to multi-page generator
  if (multiPage.isMultiPage) {
    return generateMultiPageWithRules(prompt, lowerPrompt, analysis, multiPage.pageCount);
  }

  let nextY = 100;

  const elements: ToolComposition['elements'] = [];
  const connections: ToolComposition['connections'] = [];

  function addElement(
    type: string,
    instanceId: string,
    config: Record<string, unknown>,
    width = 12,
    height = 200,
  ) {
    elements.push({
      type,
      instanceId,
      config,
      position: { x: 0, y: nextY },
      size: { width, height },
    });
    nextY += height + 20;
  }

  // ── Poll ──────────────────────────────────────────────────────
  const wantsPoll = /\b(poll|vote|survey|ballot|rank|preference)\b/.test(lowerPrompt);
  if (wantsPoll) {
    const options = analysis.options.length >= 2
      ? analysis.options
      : ['Option A', 'Option B', 'Option C'];
    addElement('poll-element', 'poll_001', {
      question: analysis.question || `What do you think about ${analysis.subject || 'this'}?`,
      options,
      showResults: true,
      allowMultipleVotes: lowerPrompt.includes('multiple') || lowerPrompt.includes('multi'),
    });
  }

  // ── RSVP / Signup ─────────────────────────────────────────────
  const wantsRsvp = /\b(rsvp|sign\s*up|signup|register|registration|attend|going)\b/.test(lowerPrompt);
  if (wantsRsvp) {
    addElement('rsvp-button', 'rsvp_001', {
      eventName: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showAttendeeCount: true,
      enableWaitlist: lowerPrompt.includes('waitlist') || lowerPrompt.includes('limit'),
      maxAttendees: extractNumber(lowerPrompt, /(?:max|limit|cap)\s*(?:of|:)?\s*(\d+)/i),
    }, 12, 120);
  }

  // ── Countdown ─────────────────────────────────────────────────
  const wantsCountdown = /\b(countdown|count\s*down|time\s*left|days?\s*until|deadline)\b/.test(lowerPrompt);
  if (wantsCountdown) {
    const targetDate = analysis.targetDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    })();
    addElement('countdown-timer', 'countdown_001', {
      targetDate: targetDate.toISOString(),
      title: analysis.eventName || titleCase(analysis.subject) || 'Event',
      showDays: true,
      showHours: true,
      showMinutes: true,
    }, 12, 140);
  }

  // ── Leaderboard ───────────────────────────────────────────────
  const wantsLeaderboard = /\b(leaderboard|ranking|scoreboard|top\s*\d+|competition|contest)\b/.test(lowerPrompt);
  if (wantsLeaderboard) {
    addElement('leaderboard', 'leaderboard_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Leaderboard',
      maxItems: extractNumber(lowerPrompt, /top\s*(\d+)/i) || 10,
      showRank: true,
    });
  }

  // ── Counter ───────────────────────────────────────────────────
  const wantsCounter = /\b(counter|tally|count|track\s*(?:a\s+)?number|how\s*many)\b/.test(lowerPrompt);
  if (wantsCounter && !wantsCountdown) {
    addElement('counter-element', 'counter_001', {
      label: titleCase(analysis.subject) || 'Count',
      initialValue: 0,
      step: 1,
      showControls: true,
    }, 12, 120);
  }

  // ── Signup Sheet / Checklist ──────────────────────────────────
  const wantsChecklist = /\b(checklist|to\s*-?\s*do|task\s*list|sign\s*-?\s*up\s*sheet|slot)\b/.test(lowerPrompt);
  if (wantsChecklist) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Task 1', 'Task 2', 'Task 3'];
    addElement('checklist-tracker', 'checklist_001', {
      title: titleCase(analysis.subject) || 'Tasks',
      items: items.map(item => ({ text: item, completed: false })),
    });
  }

  // ── Signup Sheet ──────────────────────────────────────────────
  const wantsSignupSheet = /\b(signup\s*sheet|volunteer|bring\s*list|potluck|assign)\b/.test(lowerPrompt);
  if (wantsSignupSheet && !wantsRsvp) {
    const items = analysis.items.length > 0
      ? analysis.items
      : ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'];
    addElement('signup-sheet', 'signup_sheet_001', {
      title: analysis.eventName || titleCase(analysis.subject) || 'Sign-Up Sheet',
      slots: items.map(item => ({ label: item, maxSignups: 1 })),
    });
  }

  // ── Form / Feedback ───────────────────────────────────────────
  const wantsForm = /\b(form|feedback|submission|input|collect|gather|questionnaire)\b/.test(lowerPrompt);
  if (wantsForm && !wantsPoll) {
    const fields = analysis.fields.length > 0
      ? analysis.fields
      : [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'response', label: lowerPrompt.includes('feedback') ? 'Your Feedback' : 'Response', type: 'textarea' },
        ];
    addElement('form-builder', 'form_001', {
      fields: fields.map(f => ({ ...f, required: true })),
      submitButtonText: lowerPrompt.includes('feedback') ? 'Send Feedback' : 'Submit',
    });
  }

  // ── Progress Bar ──────────────────────────────────────────────
  const wantsProgress = /\b(progress|goal|fundrais|target|milestone)\b/.test(lowerPrompt);
  if (wantsProgress) {
    const target = extractNumber(lowerPrompt, /(?:goal|target|raise)\s*(?:of|:)?\s*\$?(\d+)/i) || 100;
    addElement('progress-indicator', 'progress_001', {
      title: titleCase(analysis.subject) || 'Progress',
      current: 0,
      target,
      unit: lowerPrompt.includes('$') || lowerPrompt.includes('fundrais') ? '$' : '',
    }, 12, 100);
  }

  // ── Chart (standalone or paired) ──────────────────────────────
  const wantsChart = /\b(chart|graph|visual|results?\s*display|analytics)\b/.test(lowerPrompt);
  if (wantsChart) {
    addElement('chart-display', 'chart_001', {
      chartType: lowerPrompt.includes('pie') ? 'pie' : lowerPrompt.includes('line') ? 'line' : 'bar',
      title: 'Results',
      showLegend: true,
    }, 12, 240);

    // Connect poll → chart if both exist
    const hasPoll = elements.find(e => e.type === 'poll-element');
    if (hasPoll) {
      connections.push({
        from: { instanceId: hasPoll.instanceId, port: 'results' },
        to: { instanceId: 'chart_001', port: 'data' },
      });
    }
  }

  // ── Custom Block (games, interactive widgets) ─────────────────
  const wantsCustom = /\b(bingo|flip|game|drag|animation|widget|interactive|spinner|wheel|trivia|flashcard|matching|quiz game)\b/.test(lowerPrompt);
  if (wantsCustom && elements.length === 0) {
    const title = generateToolName(prompt, analysis);
    addElement('custom-block', 'custom_001', {
      blockId: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      version: 1,
      metadata: {
        name: title,
        description: `Interactive widget: ${analysis.subject}`,
        createdBy: 'ai' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      code: {
        html: `<div id="app" style="font-family: var(--hive-font-sans, system-ui, sans-serif); padding: 24px; text-align: center;">
  <h2 style="margin: 0 0 16px; color: var(--hive-color-text, #fff);">${title}</h2>
  <p style="color: var(--hive-color-text-secondary, #a0a0a0); margin-bottom: 24px;">Interactive widget</p>
  <div id="content" style="background: var(--hive-color-surface, #1a1a2e); border-radius: 12px; padding: 32px; border: 1px solid var(--hive-color-border, #2a2a3e);"></div>
</div>`,
        css: `#app { max-width: 480px; margin: 0 auto; }
#content { transition: all 0.2s ease; }
#content:hover { border-color: var(--hive-color-primary, #6366f1); }
button { background: var(--hive-color-primary, #6366f1); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: opacity 0.15s; }
button:hover { opacity: 0.9; }`,
        js: `const hive = window.HiveSDK?.init?.() || { setState: () => {}, getState: () => ({}), emit: () => {} };
const content = document.getElementById('content');
content.innerHTML = '<p style="color: var(--hive-color-text-secondary, #a0a0a0);">Ready to interact</p><button onclick="hive.emit(\\'click\\')">Get Started</button>';`,
        hash: `blk_${Math.abs(Date.now()).toString(36)}`,
      },
      manifest: { actions: [], inputs: [], outputs: [] },
    }, 12, 350);
  }

  // ── Smart Composition: RSVP + Countdown ───────────────────────
  if (wantsRsvp && !wantsCountdown && analysis.targetDate) {
    addElement('countdown-timer', 'countdown_001', {
      targetDate: analysis.targetDate.toISOString(),
      title: analysis.eventName || 'Event Starts',
      showDays: true,
      showHours: true,
      showMinutes: true,
    }, 12, 140);
  }

  // ── Smart Composition: Poll + Chart (auto-add chart for polls) ─
  if (wantsPoll && !wantsChart && elements.length < 3) {
    addElement('chart-display', 'chart_001', {
      chartType: 'bar',
      title: 'Live Results',
      showLegend: true,
    }, 12, 240);
    connections.push({
      from: { instanceId: 'poll_001', port: 'results' },
      to: { instanceId: 'chart_001', port: 'data' },
    });
  }

  // ── Default: intelligent single-element fallback ──────────────
  if (elements.length === 0) {
    // Try to infer the best element from the prompt
    if (/\b(event|meet|gather|party|meeting)\b/.test(lowerPrompt)) {
      addElement('rsvp-button', 'rsvp_001', {
        eventName: analysis.eventName || titleCase(analysis.subject) || 'Event',
        showAttendeeCount: true,
        enableWaitlist: false,
      }, 12, 120);
    } else if (/\b(question|ask|opinion|think)\b/.test(lowerPrompt)) {
      addElement('poll-element', 'poll_001', {
        question: analysis.question || `${titleCase(analysis.subject)}?`,
        options: analysis.options.length >= 2 ? analysis.options : ['Yes', 'No', 'Maybe'],
        showResults: true,
      });
    } else {
      // True fallback — use the subject to make a meaningful poll
      const q = analysis.subject
        ? `What do you think about ${analysis.subject}?`
        : prompt.length < 60
          ? `${prompt}?`
          : 'What do you think?';
      addElement('poll-element', 'poll_001', {
        question: q,
        options: analysis.options.length >= 2 ? analysis.options : ['Great idea', 'Needs work', 'Not sure'],
        showResults: true,
      });
    }
  }

  const name = generateToolName(prompt, analysis);
  const description = generateDescription(elements, analysis);

  return {
    elements,
    connections,
    name,
    description,
    layout: 'grid',
  };
}

/**
 * Multi-page rules-based generator.
 * Creates a structured multi-page flow (e.g., registration: Info → Form → Confirmation).
 */
function generateMultiPageWithRules(
  prompt: string,
  lowerPrompt: string,
  analysis: PromptAnalysis,
  pageCount: number,
): ToolComposition {
  const isRegistration = /\b(register|registration|signup|sign.?up|rsvp|attend)\b/.test(lowerPrompt);
  const isFeedback = /\b(feedback|survey|questionnaire)\b/.test(lowerPrompt);
  const isOnboarding = /\b(onboard|welcome|intro|walkthrough)\b/.test(lowerPrompt);

  interface PageDef {
    id: string;
    name: string;
    elements: ToolComposition['elements'];
    connections: ToolComposition['connections'];
    isStartPage?: boolean;
  }

  const pages: PageDef[] = [];
  const now = Date.now();

  const makePage = (index: number, name: string): PageDef => ({
    id: `page_${now}_${index}`,
    name,
    elements: [],
    connections: [],
    isStartPage: index === 0,
  });

  let nextY: number;

  function addToPage(
    page: PageDef,
    type: string,
    instanceId: string,
    config: Record<string, unknown>,
    width = 12,
    height = 200,
  ) {
    const y = page.elements.length === 0 ? 100 : Math.max(...page.elements.map(e => (e.position?.y || 0) + (e.size?.height || 200))) + 20;
    page.elements.push({
      type,
      instanceId,
      config,
      position: { x: 0, y },
      size: { width, height },
    });
  }

  const toolName = analysis.eventName || titleCase(analysis.subject) || 'Event';

  if (isRegistration) {
    // Page 1: Info
    const infoPage = makePage(0, 'Info');
    addToPage(infoPage, 'rsvp-button', 'rsvp_001', {
      eventName: toolName,
      showAttendeeCount: true,
      enableWaitlist: lowerPrompt.includes('waitlist'),
    }, 12, 120);
    if (analysis.targetDate) {
      addToPage(infoPage, 'countdown-timer', 'countdown_001', {
        targetDate: analysis.targetDate.toISOString(),
        title: `${toolName} starts`,
        showDays: true,
        showHours: true,
        showMinutes: true,
      }, 12, 140);
    }
    pages.push(infoPage);

    // Page 2: Form
    const formPage = makePage(1, 'Details');
    const fields = analysis.fields.length > 0 ? analysis.fields : [
      { name: 'name', label: 'Full Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ];
    addToPage(formPage, 'form-builder', 'form_001', {
      fields: fields.map(f => ({ ...f, required: true })),
      submitButtonText: 'Register',
    });
    // Wire navigation: RSVP → Form page, Form submit → Confirmation
    infoPage.elements[0] = { ...infoPage.elements[0], onAction: { type: 'navigate', targetPageId: `page_${now}_1` } };
    pages.push(formPage);

    // Page 3: Confirmation
    if (pageCount >= 3) {
      const confirmPage = makePage(2, 'Confirmation');
      addToPage(confirmPage, 'counter-element', 'confirm_counter', {
        label: 'Registered',
        initialValue: 0,
        step: 1,
        showControls: false,
      }, 12, 120);
      // Wire form submit → confirmation page
      formPage.elements[0] = { ...formPage.elements[0], onAction: { type: 'navigate', targetPageId: `page_${now}_2` } };
      pages.push(confirmPage);
    }
  } else if (isFeedback) {
    // Page 1: Question
    const questionPage = makePage(0, 'Question');
    addToPage(questionPage, 'poll-element', 'poll_001', {
      question: analysis.question || `What do you think about ${toolName}?`,
      options: analysis.options.length >= 2 ? analysis.options : ['Excellent', 'Good', 'Needs Improvement'],
      showResults: false,
    });
    pages.push(questionPage);

    // Page 2: Details
    const detailsPage = makePage(1, 'Details');
    addToPage(detailsPage, 'form-builder', 'form_001', {
      fields: [
        { name: 'feedback', label: 'Tell us more', type: 'textarea', required: false },
      ],
      submitButtonText: 'Submit Feedback',
    });
    questionPage.elements[0] = { ...questionPage.elements[0], onAction: { type: 'navigate', targetPageId: `page_${now}_1` } };
    pages.push(detailsPage);

    // Page 3: Thank you
    if (pageCount >= 3) {
      const thankYouPage = makePage(2, 'Thank You');
      addToPage(thankYouPage, 'chart-display', 'chart_001', {
        chartType: 'bar',
        title: 'Results So Far',
        showLegend: true,
      }, 12, 240);
      thankYouPage.connections.push({
        from: { instanceId: 'poll_001', port: 'results' },
        to: { instanceId: 'chart_001', port: 'data' },
      });
      detailsPage.elements[0] = { ...detailsPage.elements[0], onAction: { type: 'navigate', targetPageId: `page_${now}_2` } };
      pages.push(thankYouPage);
    }
  } else {
    // Generic multi-page: create sequential pages with appropriate elements
    const genericPageNames = ['Welcome', 'Details', 'Confirmation', 'Results', 'Summary'];
    for (let i = 0; i < pageCount; i++) {
      const page = makePage(i, genericPageNames[i] || `Page ${i + 1}`);

      if (i === 0) {
        // First page: informational element
        addToPage(page, 'counter-element', `counter_p${i}`, {
          label: titleCase(analysis.subject) || 'Step 1',
          initialValue: 0,
          step: 1,
          showControls: true,
        }, 12, 120);
      } else if (i === pageCount - 1) {
        // Last page: summary/results
        addToPage(page, 'checklist-tracker', `checklist_p${i}`, {
          title: 'Summary',
          items: [{ text: 'All steps completed', completed: false }],
        });
      } else {
        // Middle pages: form
        addToPage(page, 'form-builder', `form_p${i}`, {
          fields: [
            { name: `field_${i}`, label: `Step ${i + 1} Input`, type: 'text', required: true },
          ],
          submitButtonText: 'Continue',
        });
      }

      // Wire navigation to next page
      if (i < pageCount - 1) {
        const nextPageId = `page_${now}_${i + 1}`;
        page.elements[0] = { ...page.elements[0], onAction: { type: 'navigate', targetPageId: nextPageId } };
      }

      pages.push(page);
    }
  }

  // Flatten all elements/connections for backward compat
  const allElements = pages.flatMap((p) => p.elements);
  const allConnections = pages.flatMap((p) => p.connections);

  const name = generateToolName(prompt, analysis);
  const description = generateDescription(allElements, analysis);

  return {
    elements: allElements,
    connections: allConnections,
    name,
    description,
    layout: 'grid',
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      elements: p.elements,
      connections: p.connections,
      isStartPage: p.isStartPage,
    })),
  };
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : undefined;
}

function generateToolName(prompt: string, analysis: PromptAnalysis): string {
  // Use event name if we have one
  if (analysis.eventName) return analysis.eventName;

  // Use subject if meaningful
  if (analysis.subject && analysis.subject.length > 2 && analysis.subject.length < 40) {
    return titleCase(analysis.subject);
  }

  // Fall back to first 4 words
  const words = prompt.split(/\s+/).slice(0, 4);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function generateDescription(
  elements: ToolComposition['elements'],
  analysis: PromptAnalysis,
): string {
  const types = elements.map(e => e.type);
  const parts: string[] = [];

  if (types.includes('poll-element')) parts.push('poll');
  if (types.includes('rsvp-button')) parts.push('RSVP');
  if (types.includes('countdown-timer')) parts.push('countdown');
  if (types.includes('leaderboard')) parts.push('leaderboard');
  if (types.includes('counter-element')) parts.push('counter');
  if (types.includes('form-builder')) parts.push('form');
  if (types.includes('checklist-tracker')) parts.push('checklist');
  if (types.includes('signup-sheet')) parts.push('sign-up sheet');
  if (types.includes('chart-display')) parts.push('results chart');
  if (types.includes('progress-indicator')) parts.push('progress tracker');
  if (types.includes('custom-block')) parts.push('interactive widget');

  if (parts.length === 0) return `Tool for: ${analysis.subject}`;
  const subject = analysis.eventName || analysis.subject;
  return subject
    ? `${titleCase(parts.join(' + '))} for ${subject}`
    : titleCase(parts.join(' + '));
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// GENERATION OUTCOME TRACKING
// ═══════════════════════════════════════════════════════════════════

export interface GenerationOutcome {
  id: string;
  prompt: string;
  reasoning: string;
  spaceContext?: SpaceContext;
  composition: {
    elementTypes: string[];
    connectionCount: number;
    elementCount: number;
  };
  validated: boolean;
  validationPassed: boolean;
  revised: boolean;
  outcome: {
    kept: boolean;
    iterationCount: number;
    deployed: boolean;
    usedByOthers: number;
  };
  createdAt: Date;
}

/** Write generation outcome to Firestore (fire-and-forget) */
async function writeGenerationOutcome(outcome: Omit<GenerationOutcome, 'id'>): Promise<string | null> {
  try {
    const { dbAdmin, isFirebaseConfigured } = await import('./firebase-admin');
    if (!isFirebaseConfigured) return null;

    const ref = dbAdmin.collection('generation_outcomes').doc();
    await ref.set({
      ...outcome,
      createdAt: new Date(),
    });
    return ref.id;
  } catch (err) {
    logger.warn('Failed to write generation outcome', {
      component: 'goose-server',
      error: err instanceof Error ? err.message : 'unknown',
    });
    return null;
  }
}

/** Update a single field on a generation outcome doc */
export async function updateGenerationOutcome(
  outcomeId: string,
  update: Record<string, unknown>,
): Promise<void> {
  try {
    const { dbAdmin, isFirebaseConfigured } = await import('./firebase-admin');
    if (!isFirebaseConfigured) return;

    await dbAdmin.collection('generation_outcomes').doc(outcomeId).update(update);
  } catch {
    // Silent fail — outcome tracking is best-effort
  }
}

export async function generateTool(
  request: GenerateRequest
): Promise<ToolComposition & { _outcomeId?: string }> {
  const config = getGooseConfig();

  // Build context-aware prompt — raw pass-through, let the model reason
  let promptPrefix = '';
  if (request.spaceContext) {
    const sc = request.spaceContext;
    const parts: string[] = [];
    if (sc.name) parts.push(`Space: "${sc.name}"`);
    if (sc.type) parts.push(`Type: ${sc.type}`);
    if (sc.memberCount) parts.push(`${sc.memberCount} members`);
    if (parts.length > 0) {
      promptPrefix = `Context: ${parts.join(', ')}. Consider this when designing the tool.\n\n`;
    }
  }

  const enhancedPrompt = promptPrefix + request.prompt;
  const fullSystemPrompt = buildSystemPrompt({
    existingComposition: request.existingComposition,
    isIteration: request.isIteration,
  });

  let rawOutput: string;
  let composition: ToolComposition | null = null;
  let reasoning = '';
  let validated = false;
  let validationPassed = false;
  let revised = false;

  // Groq iteration path: semantic modification of existing composition
  const isGroqIteration = request.isIteration && request.existingComposition && config.groqApiKey;

  // When Groq is configured, use it as primary; rules is the free fallback.
  const backends: GooseBackend[] = [];
  if (config.backend === 'groq' && config.groqApiKey) {
    backends.push('groq');
  }
  backends.push('rules'); // always last — free fallback

  for (const backend of backends) {
    try {
      switch (backend) {
        case 'groq': {
          if (isGroqIteration) {
            // Semantic iteration: send current composition + modification request
            const iterResult = await callGroqIteration(
              config, request.prompt, request.existingComposition!
            );
            composition = iterResult.composition;
            reasoning = iterResult.reasoning;
            if (composition) {
              composition = sanitizeElementConfigs(composition);
              // Guard: warn/log if >50% of elements changed (likely misunderstood)
              const existingCount = request.existingComposition!.elements.length;
              const preservedCount = composition.elements.filter(el =>
                request.existingComposition!.elements.some(
                  existing => existing.instanceId === el.instanceId
                )
              ).length;
              if (existingCount > 0 && preservedCount < existingCount * 0.5) {
                logger.warn('Groq iteration changed >50% of elements — may have misunderstood', {
                  component: 'goose-server',
                  existingCount,
                  preservedCount,
                  newCount: composition.elements.length,
                });
              }
              logger.info('Groq semantic iteration succeeded', { component: 'goose-server' });
            }
          } else {
            // Primary path: AI SDK structured output with reasoning
            try {
              const result = await callGroqStructured(config, enhancedPrompt, fullSystemPrompt);
              composition = result.composition;
              reasoning = result.reasoning;
              if (composition) composition = sanitizeElementConfigs(composition);

              // AI validation: second call to check the work (only for multi-element tools)
              if (composition && composition.elements.length > 1 && config.groqApiKey) {
                try {
                  const validation = await validateWithAI(config, composition, reasoning, request.prompt);
                  validated = true;
                  validationPassed = validation.passes;

                  if (!validation.passes && validation.issues.length > 0) {
                    logger.info('AI validation found issues, revising', {
                      component: 'goose-server',
                      issues: validation.issues.length,
                    });
                    const revisedComp = await reviseComposition(config, composition, validation.issues, request.prompt);
                    composition = sanitizeElementConfigs(revisedComp);
                    revised = true;
                  }
                } catch (valError) {
                  logger.warn('AI validation failed, using original', {
                    component: 'goose-server',
                    error: valError instanceof Error ? valError.message : 'unknown',
                  });
                }
              }

              logger.info('Groq structured output succeeded', {
                component: 'goose-server',
                reasoning: reasoning.slice(0, 100),
                validated,
                revised,
              });
            } catch (structuredError) {
              // Fallback: raw string output + parse
              logger.warn('Structured output failed, trying raw', {
                component: 'goose-server',
                error: structuredError instanceof Error ? structuredError.message : 'unknown',
              });
              const is70b = config.groqModel.includes('70b');
              const groqSystemPrompt = is70b ? fullSystemPrompt : buildCompactSystemPrompt();
              rawOutput = await callGroqRaw(config, enhancedPrompt, groqSystemPrompt);
              composition = parseModelOutput(rawOutput);
              if (composition) composition = sanitizeElementConfigs(composition);
            }
          }
          break;
        }

        case 'rules':
          composition = sanitizeElementConfigs(
            generateWithRules(enhancedPrompt, request.existingComposition, request.isIteration)
          );
          break;
      }

      if (composition) {
        // Validate and sanitize
        const validation = validateToolComposition(composition);
        let finalComposition: ToolComposition;
        if (validation.valid) {
          finalComposition = composition;
        } else if (validation.sanitized) {
          finalComposition = validation.sanitized;
        } else {
          finalComposition = sanitizeComposition(composition);
        }

        // Write generation outcome (fire-and-forget)
        const outcomeId = await writeGenerationOutcome({
          prompt: request.prompt,
          reasoning,
          spaceContext: request.spaceContext,
          composition: {
            elementTypes: finalComposition.elements.map(e => e.type),
            connectionCount: finalComposition.connections.length,
            elementCount: finalComposition.elements.length,
          },
          validated,
          validationPassed,
          revised,
          outcome: {
            kept: true,
            iterationCount: 0,
            deployed: false,
            usedByOthers: 0,
          },
          createdAt: new Date(),
        });

        // Attach outcome ID for downstream tracking
        return Object.assign(finalComposition, { _outcomeId: outcomeId || undefined });
      }
    } catch {
      // Continue to next backend
    }
  }

  // Ultimate fallback
  return sanitizeElementConfigs(
    generateWithRules(enhancedPrompt, request.existingComposition, request.isIteration)
  );
}

export async function* generateToolStream(
  request: GenerateRequest
): AsyncGenerator<StreamMessage> {
  // Yield thinking message
  yield { type: 'thinking', data: { message: 'Analyzing your request...' } };

  try {
    const composition = await generateTool(request);

    // Yield elements one by one
    for (const element of composition.elements) {
      yield { type: 'element', data: { ...element, config: { ...(element.config || {}), aiGenerated: true } } };
      await new Promise(resolve => setTimeout(resolve, 100)); // Stagger for visual effect
    }

    // Yield connections
    for (const connection of composition.connections) {
      yield { type: 'connection', data: connection };
    }

    // Yield completion (include outcomeId for downstream tracking)
    yield {
      type: 'complete',
      data: {
        name: composition.name,
        description: composition.description,
        elementCount: composition.elements.length,
        pages: composition.pages,
        generationOutcomeId: (composition as ToolComposition & { _outcomeId?: string })._outcomeId || null,
      },
    };
  } catch (error) {
    yield {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'Generation failed',
        code: 'GENERATION_ERROR',
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

export async function getAvailableBackend(): Promise<GooseBackend> {
  const config = getGooseConfig();
  return config.groqApiKey ? 'groq' : 'rules';
}
