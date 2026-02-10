/**
 * AI Intent Parser
 *
 * Detects when a chat message is a request to create an inline component.
 * Uses Gemini 2.0 Flash for natural language understanding.
 *
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 */

import { ai, getGenerativeModel, Schema } from './firebase';
import { logger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'signup' | 'event' | 'none';

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  params: IntentParams;
  rawInput: string;
}

export interface IntentParams {
  // Poll params
  question?: string;
  options?: string[];
  allowMultiple?: boolean;

  // RSVP params
  eventTitle?: string;
  eventDate?: Date;
  maxCapacity?: number;

  // Countdown params
  title?: string;
  targetDate?: Date;

  // Signup params
  signupTitle?: string;
  slots?: string[];
  limitPerSlot?: number;

  // Event params
  location?: string;
  description?: string;

  // Announcement params
  content?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema for structured output
// ─────────────────────────────────────────────────────────────────────────────

const intentSchema = Schema.object({
  properties: {
    type: Schema.string(),
    confidence: Schema.number(),
    params: Schema.object({
      properties: {
        question: Schema.string(),
        options: Schema.array({ items: Schema.string() }),
        allowMultiple: Schema.boolean(),
        eventTitle: Schema.string(),
        eventDate: Schema.string(),
        maxCapacity: Schema.number(),
        title: Schema.string(),
        targetDate: Schema.string(),
        content: Schema.string(),
        signupTitle: Schema.string(),
        slots: Schema.array({ items: Schema.string() }),
        limitPerSlot: Schema.number(),
        location: Schema.string(),
        description: Schema.string(),
      },
    }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// System prompt for intent detection
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are an intent parser for a campus community platform (HIVE).
Your job is to detect if a message is a request to create an interactive component.

## Supported Component Types

POLL (type: "poll")
- Triggers: "create a poll", "let's vote", "poll for", "vote on", "quick poll"
- Extract: question, options (array), allowMultiple (true if "select multiple" mentioned)
- Example: "Let's vote on where to eat - pizza, sushi, or burgers" → poll with 3 options

RSVP (type: "rsvp")
- Triggers: "set up rsvp", "registration for", "sign up for", "rsvp for", "attendance for"
- Extract: eventTitle, eventDate (ISO string), maxCapacity (if limit mentioned)
- Example: "RSVP for study session on Friday at 3pm" → rsvp with title and date

COUNTDOWN (type: "countdown")
- Triggers: "countdown to", "timer for", "X days until", "countdown for"
- Extract: title, targetDate (ISO string)
- Example: "Countdown to finals - December 16th" → countdown with target date

ANNOUNCEMENT (type: "announcement")
- Triggers: "announce", "announcement:", "📢", "@everyone"
- Extract: content (the announcement text)
- Example: "📢 Meeting moved to Room 201" → announcement

SIGNUP (type: "signup")
- Triggers: "signup sheet", "sign up sheet", "volunteer for", "who can bring", "slot signup", "need volunteers"
- Extract: signupTitle, slots (array of slot names), limitPerSlot (if capacity mentioned)
- Example: "Who can bring stuff to the potluck? Drinks, Snacks, Plates, Cups" → signup with 4 slots
- Example: "Need 3 volunteers for each: Setup, Cleanup, Registration" → signup with limit 3

EVENT (type: "event")
- Triggers: "create an event", "schedule event", "new event", "event for", "let's plan"
- Extract: eventTitle, eventDate (ISO string), location, description
- Example: "Let's plan a study session Wednesday at the library" → event with date and location
- Example: "Create an event for the end-of-year party on May 1st in the student union" → event

NONE (type: "none")
- Regular conversation, questions, statements that aren't component requests
- Example: "How's everyone doing?" → none
- Example: "What time is the meeting?" → none (asking, not creating)

## Important Rules

1. Only detect clear creation intents - don't hallucinate components from casual mentions
2. If unsure, return type: "none" with low confidence
3. For polls, extract actual options from the message (don't make them up)
4. For dates, parse relative dates (tomorrow, Friday, next week) to ISO format
5. Confidence should be 0.0-1.0:
   - 0.9+ for explicit commands ("create a poll")
   - 0.7-0.9 for implicit but clear ("let's vote on")
   - 0.5-0.7 for ambiguous (might be question vs command)
   - <0.5 should return "none"

## Output Format

Return a JSON object with:
- type: "poll" | "rsvp" | "countdown" | "announcement" | "signup" | "event" | "none"
- confidence: 0.0 to 1.0
- params: extracted parameters (only include relevant ones)

For "none" type, params should be empty object {}.`;

// ─────────────────────────────────────────────────────────────────────────────
// Intent Parser Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create the Gemini model for intent parsing
 */
function getIntentParserModel() {
  return getGenerativeModel(ai, {
    model: 'gemini-2.0-flash',
    systemInstruction: INTENT_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: intentSchema,
      temperature: 0.1, // Low temperature for deterministic parsing
      maxOutputTokens: 1024,
    },
  });
}

/**
 * Parse a chat message for component creation intent
 *
 * @param message - The chat message to analyze
 * @param context - Optional context about the space/user
 * @returns Parsed intent with type, confidence, and extracted params
 */
export async function parseIntent(
  message: string,
  context?: {
    spaceName?: string;
    spaceCategory?: string;
    isLeader?: boolean;
  }
): Promise<ParsedIntent> {
  // Quick rejection for obvious non-intents
  if (message.length < 5 || message.length > 2000) {
    return createNoneIntent(message);
  }

  // Check for quick patterns first (faster than AI)
  const quickIntent = detectQuickPatterns(message);
  if (quickIntent) {
    return quickIntent;
  }

  try {
    const model = getIntentParserModel();

    // Build contextual prompt
    let contextPrompt = '';
    if (context?.spaceName) {
      contextPrompt += `\nContext: This message is in the "${context.spaceName}" space`;
      if (context.spaceCategory) {
        contextPrompt += ` (${context.spaceCategory})`;
      }
      contextPrompt += '.';
    }
    if (context?.isLeader) {
      contextPrompt += '\nThe user is a space leader (can create components).';
    }

    const fullPrompt = `${contextPrompt}\n\nMessage: "${message}"`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Validate and transform response
    const intent = transformAIResponse(parsed, message);

    logger.debug('Intent parsed', {
      component: 'ai-intent-parser',
      type: intent.type,
      confidence: intent.confidence,
      messagePreview: message.substring(0, 50),
    });

    return intent;
  } catch (error) {
    logger.error('Intent parsing failed', {
      component: 'ai-intent-parser',
      error: error instanceof Error ? error.message : 'Unknown error',
      messagePreview: message.substring(0, 50),
    });

    // Fall back to none on error
    return createNoneIntent(message);
  }
}

/**
 * Quick pattern detection for common commands (no AI needed)
 * This provides instant responses for obvious patterns
 */
function detectQuickPatterns(message: string): ParsedIntent | null {
  const lower = message.toLowerCase().trim();

  // Poll patterns
  if (lower.startsWith('/poll') || lower.match(/^poll:\s*/i)) {
    return parseQuickPoll(message);
  }

  // RSVP patterns
  if (lower.startsWith('/rsvp') || lower.match(/^rsvp:/i)) {
    return parseQuickRsvp(message);
  }

  // Countdown patterns
  if (lower.startsWith('/countdown') || lower.match(/^countdown:/i)) {
    return parseQuickCountdown(message);
  }

  // Announcement patterns
  if (lower.startsWith('/announce') || message.startsWith('📢')) {
    return parseQuickAnnouncement(message);
  }

  return null;
}

/**
 * Parse quick poll syntax: /poll "Question?" Option1 Option2 Option3
 * or: Poll: Question? - Option1, Option2, Option3
 */
function parseQuickPoll(message: string): ParsedIntent {
  // Try /poll "Question?" options format
  const slashMatch = message.match(/^\/poll\s+"([^"]+)"\s+(.+)$/i);
  if (slashMatch) {
    const question = slashMatch[1];
    const optionsStr = slashMatch[2];
    const options = optionsStr.split(/\s+/).filter(o => o.length > 0);

    return {
      type: 'poll',
      confidence: 0.95,
      params: { question, options },
      rawInput: message,
    };
  }

  // Try Poll: Question? - Option1, Option2
  const colonMatch = message.match(/^poll:\s*([^?]+\?)\s*[-–]\s*(.+)$/i);
  if (colonMatch) {
    const question = colonMatch[1].trim();
    const options = colonMatch[2].split(/[,;]/).map(o => o.trim()).filter(o => o.length > 0);

    return {
      type: 'poll',
      confidence: 0.9,
      params: { question, options },
      rawInput: message,
    };
  }

  // Fallback - just detect it's a poll, let AI fill in details
  return {
    type: 'poll',
    confidence: 0.7,
    params: {},
    rawInput: message,
  };
}

/**
 * Parse quick RSVP syntax
 */
function parseQuickRsvp(message: string): ParsedIntent {
  // Try /rsvp "Event" --limit=N --date=DATE format
  const slashMatch = message.match(/^\/rsvp\s+"([^"]+)"(.*)$/i);
  if (slashMatch) {
    const eventTitle = slashMatch[1];
    const flagsStr = slashMatch[2];

    const params: IntentParams = { eventTitle };

    // Extract flags
    const limitMatch = flagsStr.match(/--limit[=:]?\s*(\d+)/i);
    if (limitMatch) {
      params.maxCapacity = parseInt(limitMatch[1], 10);
    }

    const dateMatch = flagsStr.match(/--date[=:]?\s*([^\s]+)/i);
    if (dateMatch) {
      params.eventDate = parseRelativeDate(dateMatch[1]);
    }

    return {
      type: 'rsvp',
      confidence: 0.95,
      params,
      rawInput: message,
    };
  }

  return {
    type: 'rsvp',
    confidence: 0.7,
    params: {},
    rawInput: message,
  };
}

/**
 * Parse quick countdown syntax
 */
function parseQuickCountdown(message: string): ParsedIntent {
  // Try /countdown "Title" DATE format
  const slashMatch = message.match(/^\/countdown\s+"([^"]+)"\s+(.+)$/i);
  if (slashMatch) {
    const title = slashMatch[1];
    const dateStr = slashMatch[2];

    return {
      type: 'countdown',
      confidence: 0.95,
      params: {
        title,
        targetDate: parseRelativeDate(dateStr),
      },
      rawInput: message,
    };
  }

  // Try countdown: title - date format
  const colonMatch = message.match(/^countdown:\s*([^-]+)\s*[-–]\s*(.+)$/i);
  if (colonMatch) {
    const title = colonMatch[1].trim();
    const dateStr = colonMatch[2].trim();

    return {
      type: 'countdown',
      confidence: 0.9,
      params: {
        title,
        targetDate: parseRelativeDate(dateStr),
      },
      rawInput: message,
    };
  }

  return {
    type: 'countdown',
    confidence: 0.7,
    params: {},
    rawInput: message,
  };
}

/**
 * Parse quick announcement syntax
 */
function parseQuickAnnouncement(message: string): ParsedIntent {
  let content = message;

  // Remove /announce prefix
  if (content.toLowerCase().startsWith('/announce')) {
    content = content.substring(9).trim();
  }

  // Remove 📢 prefix
  if (content.startsWith('📢')) {
    content = content.substring(2).trim();
  }

  return {
    type: 'announcement',
    confidence: 0.95,
    params: { content },
    rawInput: message,
  };
}

/**
 * Transform AI response to ParsedIntent
 */
function transformAIResponse(
  response: Record<string, unknown>,
  rawInput: string
): ParsedIntent {
  const type = (response.type as string)?.toLowerCase() as IntentType;
  const confidence = (response.confidence as number) ?? 0;
  const paramsRaw = (response.params as Record<string, unknown>) ?? {};

  // Validate type
  const validTypes: IntentType[] = ['poll', 'rsvp', 'countdown', 'announcement', 'signup', 'event', 'none'];
  if (!validTypes.includes(type)) {
    return createNoneIntent(rawInput);
  }

  // Transform params
  const params: IntentParams = {};

  if (paramsRaw.question) params.question = String(paramsRaw.question);
  if (Array.isArray(paramsRaw.options)) params.options = paramsRaw.options.map(String);
  if (typeof paramsRaw.allowMultiple === 'boolean') params.allowMultiple = paramsRaw.allowMultiple;

  if (paramsRaw.eventTitle) params.eventTitle = String(paramsRaw.eventTitle);
  if (paramsRaw.eventDate) params.eventDate = new Date(String(paramsRaw.eventDate));
  if (typeof paramsRaw.maxCapacity === 'number') params.maxCapacity = paramsRaw.maxCapacity;

  if (paramsRaw.title) params.title = String(paramsRaw.title);
  if (paramsRaw.targetDate) params.targetDate = new Date(String(paramsRaw.targetDate));

  if (paramsRaw.content) params.content = String(paramsRaw.content);

  return {
    type,
    confidence: Math.max(0, Math.min(1, confidence)),
    params,
    rawInput,
  };
}

/**
 * Create a "none" intent result
 */
function createNoneIntent(rawInput: string): ParsedIntent {
  return {
    type: 'none',
    confidence: 1,
    params: {},
    rawInput,
  };
}

/**
 * Parse relative date strings to Date objects
 */
function parseRelativeDate(dateStr: string): Date | undefined {
  const lower = dateStr.toLowerCase().trim();
  const now = new Date();

  // Handle relative terms
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  if (lower === 'today') {
    const d = new Date(now);
    d.setHours(23, 59, 0, 0);
    return d;
  }

  if (lower.includes('next week')) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  // Handle day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.findIndex(d => lower.includes(d));
  if (dayIndex !== -1) {
    const d = new Date(now);
    const currentDay = d.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  // Try parsing as ISO or common formats
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Fall through
  }

  return undefined;
}

/**
 * Check if an intent should trigger component creation
 */
export function shouldCreateComponent(intent: ParsedIntent): boolean {
  return intent.type !== 'none' && intent.confidence >= 0.7;
}

/**
 * Get a human-readable confirmation message for an intent
 */
export function getIntentConfirmation(intent: ParsedIntent): string {
  switch (intent.type) {
    case 'poll':
      if (intent.params.question && intent.params.options?.length) {
        return `Create poll: "${intent.params.question}" with ${intent.params.options.length} options?`;
      }
      return 'Create a poll?';

    case 'rsvp':
      if (intent.params.eventTitle) {
        return `Create RSVP for "${intent.params.eventTitle}"?`;
      }
      return 'Create an RSVP?';

    case 'countdown':
      if (intent.params.title && intent.params.targetDate) {
        return `Create countdown to "${intent.params.title}" (${intent.params.targetDate.toLocaleDateString()})?`;
      }
      return 'Create a countdown?';

    case 'announcement':
      return 'Post announcement?';

    default:
      return '';
  }
}
