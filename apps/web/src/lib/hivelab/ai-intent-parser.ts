/**
 * AI Intent Parser for HiveLab Chat-First Experience
 *
 * Parses natural language messages to detect intent to create
 * inline components (polls, RSVPs, countdowns, announcements).
 *
 * Uses pattern matching first (fast) with AI fallback (accurate).
 */

import { ai, getGenerativeModel, Schema } from '../firebase';
import { logger } from '../structured-logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'none';

export interface PollParams {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  closesAt?: Date;
}

export interface RsvpParams {
  eventTitle: string;
  eventDate?: Date;
  maxCapacity?: number;
  allowMaybe?: boolean;
}

export interface CountdownParams {
  title: string;
  targetDate: Date;
}

export interface AnnouncementParams {
  title?: string;
  content: string;
  isPinned?: boolean;
}

export type IntentParams = PollParams | RsvpParams | CountdownParams | AnnouncementParams;

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  params: IntentParams;
  rawInput: string;
  parseMethod: 'pattern' | 'ai';
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-Based Detection (Fast Path)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pattern matchers for quick detection
 * These avoid AI calls for obvious cases
 */
const INTENT_PATTERNS = {
  poll: [
    /^(?:create\s+)?(?:a\s+)?poll[:\s]+(.+)/i,
    /^let'?s?\s+vote\s+(?:on\s+)?(.+)/i,
    /^vote[:\s]+(.+)/i,
    /^(?:quick\s+)?poll[:\s]*(.+)/i,
    /which\s+(?:do\s+you|should\s+we|one)\s+.+\?/i,
    /(?:pizza|lunch|dinner|meeting|time|day|option)[^?]*\s+or\s+[^?]+\?/i,
  ],
  rsvp: [
    /^(?:create\s+)?(?:an?\s+)?rsvp\s+(?:for\s+)?(.+)/i,
    /^(?:set\s+up\s+)?(?:event\s+)?registration\s+(?:for\s+)?(.+)/i,
    /^sign[\s-]?up\s+(?:for\s+)?(.+)/i,
    /^(?:who'?s?\s+)?(?:coming|attending)\s+(?:to\s+)?(.+)\??/i,
    /^(?:are\s+you\s+)?going\s+to\s+(.+)\??/i,
  ],
  countdown: [
    /^(?:create\s+)?(?:a\s+)?countdown\s+(?:to|for|until)\s+(.+)/i,
    /^(?:set\s+)?(?:a\s+)?timer\s+(?:for|until)\s+(.+)/i,
    /^(\d+)\s+(?:days?|hours?|minutes?)\s+(?:until|to|left|remaining)/i,
    /^(?:how\s+(?:long|much\s+time)\s+)?(?:until|till)\s+(.+)\??/i,
  ],
  announcement: [
    /^(?:📢|🔔|⚠️|❗|‼️)\s*(.+)/i,
    /^announcement[:\s]+(.+)/i,
    /^announce[:\s]+(.+)/i,
    /^(?:attention|important)[:\s!]+(.+)/i,
    /^(?:hey\s+)?everyone[,:\s!]+(.+)/i,
  ],
};

/**
 * Extract poll options from text
 * Handles formats like:
 * - "A or B or C"
 * - "A, B, C"
 * - "A vs B"
 * - "Option 1. Option 2. Option 3"
 */
function extractPollOptions(text: string): string[] {
  // Try "or" separated
  if (/\bor\b/i.test(text)) {
    const options = text.split(/\s+or\s+/i).map(s => s.trim()).filter(Boolean);
    if (options.length >= 2) return options;
  }

  // Try "vs" separated
  if (/\bvs\.?\b/i.test(text)) {
    const options = text.split(/\s+vs\.?\s+/i).map(s => s.trim()).filter(Boolean);
    if (options.length >= 2) return options;
  }

  // Try comma separated (but not if it's a sentence)
  if (text.includes(',') && !text.includes(' and ')) {
    const options = text.split(/,\s*/).map(s => s.trim()).filter(Boolean);
    if (options.length >= 2) return options;
  }

  // Try numbered options (1. Option 2. Option)
  const numberedMatch = text.match(/\d+[.)]\s*([^0-9]+)/g);
  if (numberedMatch && numberedMatch.length >= 2) {
    return numberedMatch.map(s => s.replace(/^\d+[.)]\s*/, '').trim());
  }

  return [];
}

/**
 * Parse date/time from natural language
 */
function parseDateTime(text: string): Date | undefined {
  const now = new Date();

  // Relative time patterns
  const relativePatterns = [
    { pattern: /in\s+(\d+)\s+minutes?/i, unit: 'minutes' },
    { pattern: /in\s+(\d+)\s+hours?/i, unit: 'hours' },
    { pattern: /in\s+(\d+)\s+days?/i, unit: 'days' },
    { pattern: /in\s+(\d+)\s+weeks?/i, unit: 'weeks' },
    { pattern: /(\d+)\s+minutes?\s+(?:from\s+now|left)/i, unit: 'minutes' },
    { pattern: /(\d+)\s+hours?\s+(?:from\s+now|left)/i, unit: 'hours' },
    { pattern: /(\d+)\s+days?\s+(?:from\s+now|left)/i, unit: 'days' },
  ];

  for (const { pattern, unit } of relativePatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      const date = new Date(now);
      switch (unit) {
        case 'minutes':
          date.setMinutes(date.getMinutes() + value);
          break;
        case 'hours':
          date.setHours(date.getHours() + value);
          break;
        case 'days':
          date.setDate(date.getDate() + value);
          break;
        case 'weeks':
          date.setDate(date.getDate() + value * 7);
          break;
      }
      return date;
    }
  }

  // Named days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayIndex = now.getDay();

  for (let i = 0; i < dayNames.length; i++) {
    if (text.toLowerCase().includes(dayNames[i])) {
      const daysUntil = (i - todayIndex + 7) % 7 || 7; // Next occurrence
      const date = new Date(now);
      date.setDate(date.getDate() + daysUntil);
      date.setHours(12, 0, 0, 0); // Default to noon
      return date;
    }
  }

  // "tomorrow", "today", "tonight"
  if (/\btomorrow\b/i.test(text)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  if (/\btonight\b/i.test(text)) {
    const date = new Date(now);
    date.setHours(20, 0, 0, 0);
    return date;
  }

  // ISO date format
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)/);
  if (isoMatch) {
    const parsed = new Date(isoMatch[1]);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // MM/DD or MM/DD/YYYY format
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    const date = new Date(fullYear, month, day, 12, 0, 0);
    if (!isNaN(date.getTime())) return date;
  }

  return undefined;
}

/**
 * Extract capacity/limit from text
 */
function extractCapacity(text: string): number | undefined {
  const patterns = [
    /(?:limit|max|capacity|spots?|seats?)[:\s]+(\d+)/i,
    /(\d+)\s+(?:spots?|seats?|people|attendees?|max)/i,
    /--limit[=\s]+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

/**
 * Fast pattern-based intent detection
 */
function detectIntentByPattern(message: string): ParsedIntent | null {
  const trimmed = message.trim();

  // Check poll patterns
  for (const pattern of INTENT_PATTERNS.poll) {
    const match = trimmed.match(pattern);
    if (match) {
      const content = match[1] || trimmed;
      const options = extractPollOptions(content);

      // Need at least a question-like structure
      const hasQuestion = content.includes('?') || options.length >= 2;
      if (!hasQuestion && options.length < 2) continue;

      // Extract question (everything before options or the whole thing)
      let question = content;
      if (options.length >= 2) {
        // Try to find the question part
        const questionMatch = content.match(/^([^?]+\?)/);
        if (questionMatch) {
          question = questionMatch[1];
        } else {
          question = content.split(/\s+(?:or|vs\.?)\s+/i)[0];
          if (!question.endsWith('?')) question += '?';
        }
      }

      return {
        type: 'poll',
        confidence: options.length >= 2 ? 0.9 : 0.7,
        params: {
          question: question.trim(),
          options: options.length >= 2 ? options : ['Option 1', 'Option 2'],
        } as PollParams,
        rawInput: trimmed,
        parseMethod: 'pattern',
      };
    }
  }

  // Check RSVP patterns
  for (const pattern of INTENT_PATTERNS.rsvp) {
    const match = trimmed.match(pattern);
    if (match) {
      const content = match[1] || trimmed;
      const eventDate = parseDateTime(content);
      const maxCapacity = extractCapacity(content);

      return {
        type: 'rsvp',
        confidence: 0.85,
        params: {
          eventTitle: content.replace(/\s+(?:on|at|@)\s+.+$/i, '').trim(),
          eventDate,
          maxCapacity,
          allowMaybe: true,
        } as RsvpParams,
        rawInput: trimmed,
        parseMethod: 'pattern',
      };
    }
  }

  // Check countdown patterns
  for (const pattern of INTENT_PATTERNS.countdown) {
    const match = trimmed.match(pattern);
    if (match) {
      const content = match[1] || trimmed;
      const targetDate = parseDateTime(content);

      // Must have a parseable date for countdown
      if (!targetDate) continue;

      return {
        type: 'countdown',
        confidence: 0.9,
        params: {
          title: content.replace(/\d{4}-\d{2}-\d{2}/, '').trim() || 'Countdown',
          targetDate,
        } as CountdownParams,
        rawInput: trimmed,
        parseMethod: 'pattern',
      };
    }
  }

  // Check announcement patterns
  for (const pattern of INTENT_PATTERNS.announcement) {
    const match = trimmed.match(pattern);
    if (match) {
      const content = match[1] || trimmed;

      return {
        type: 'announcement',
        confidence: 0.85,
        params: {
          content: content.trim(),
          isPinned: /important|urgent|pin/i.test(trimmed),
        } as AnnouncementParams,
        rawInput: trimmed,
        parseMethod: 'pattern',
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI-Based Detection (Accurate Path)
// ─────────────────────────────────────────────────────────────────────────────

const AI_INTENT_SCHEMA = Schema.object({
  properties: {
    type: Schema.enumString({ enum: ['poll', 'rsvp', 'countdown', 'announcement', 'none'] }),
    confidence: Schema.number(),
    params: Schema.object({
      properties: {
        // Poll params
        question: Schema.string(),
        options: Schema.array({ items: Schema.string() }),
        allowMultiple: Schema.boolean(),

        // RSVP params
        eventTitle: Schema.string(),
        eventDate: Schema.string(),
        maxCapacity: Schema.number(),
        allowMaybe: Schema.boolean(),

        // Countdown params
        title: Schema.string(),
        targetDate: Schema.string(),

        // Announcement params
        content: Schema.string(),
        isPinned: Schema.boolean(),
      },
    }),
  },
});

const AI_INTENT_PROMPT = `You are an intent parser for a campus community chat platform.
Analyze the message and determine if the user wants to create an interactive component.

SUPPORTED COMPONENT TYPES:
1. poll - User wants to create a vote/poll
   - Keywords: "poll", "vote", "which", "prefer", questions with "or"
   - Extract: question, options (min 2), allowMultiple

2. rsvp - User wants event registration/attendance tracking
   - Keywords: "rsvp", "sign up", "registration", "who's coming", "attending"
   - Extract: eventTitle, eventDate (ISO format), maxCapacity, allowMaybe

3. countdown - User wants a countdown timer
   - Keywords: "countdown", "timer", "days until", "time left"
   - Extract: title, targetDate (ISO format)

4. announcement - User wants to make an announcement
   - Keywords: "📢", "announcement", "attention", "important", "hey everyone"
   - Extract: content, isPinned

5. none - Regular chat message, not a component request

CONFIDENCE SCORING:
- 0.9+ : Explicit intent (e.g., "create a poll")
- 0.7-0.9 : Strong implicit intent (e.g., "let's vote on lunch")
- 0.5-0.7 : Possible intent, needs confirmation
- < 0.5 : Unlikely intent, return "none"

Return JSON with: type, confidence (0-1), params (extracted values)
For dates, use ISO 8601 format. For missing values, omit the field.
If type is "none", params should be empty object.`;

/**
 * Get the AI model for intent parsing
 */
function getIntentParserModel() {
  return getGenerativeModel(ai, {
    model: 'gemini-2.0-flash',
    systemInstruction: AI_INTENT_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: AI_INTENT_SCHEMA,
      temperature: 0.1, // Low temperature for consistent parsing
      maxOutputTokens: 512,
    },
  });
}

/**
 * Parse intent using AI (for ambiguous cases)
 */
async function parseIntentWithAI(message: string): Promise<ParsedIntent> {
  try {
    const model = getIntentParserModel();
    const result = await model.generateContent(`Message: "${message}"`);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Convert ISO date strings back to Date objects
    const params = { ...parsed.params };
    if (params.eventDate) params.eventDate = new Date(params.eventDate);
    if (params.targetDate) params.targetDate = new Date(params.targetDate);

    return {
      type: parsed.type || 'none',
      confidence: parsed.confidence || 0,
      params: params || {},
      rawInput: message,
      parseMethod: 'ai',
    };
  } catch (error) {
    logger.error('AI intent parsing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      message: message.substring(0, 100),
    });

    return {
      type: 'none',
      confidence: 0,
      params: {} as IntentParams,
      rawInput: message,
      parseMethod: 'ai',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser Function
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseOptions {
  /**
   * Skip AI parsing and only use patterns
   * Faster but less accurate for ambiguous messages
   */
  patternOnly?: boolean;

  /**
   * Minimum confidence threshold to return an intent
   * Default: 0.6
   */
  confidenceThreshold?: number;

  /**
   * Force AI parsing even if pattern matches
   * Useful for validation
   */
  forceAI?: boolean;
}

/**
 * Parse a chat message for component creation intent
 *
 * Strategy:
 * 1. Try fast pattern matching first
 * 2. If high confidence match, return immediately
 * 3. If no match or low confidence, use AI for ambiguous cases
 *
 * @param message - The chat message to parse
 * @param options - Parsing options
 * @returns Parsed intent with type, confidence, and extracted parameters
 */
export async function parseIntent(
  message: string,
  options: ParseOptions = {}
): Promise<ParsedIntent> {
  const {
    patternOnly = false,
    confidenceThreshold = 0.6,
    forceAI = false,
  } = options;

  // Skip very short messages
  if (message.trim().length < 3) {
    return {
      type: 'none',
      confidence: 1,
      params: {} as IntentParams,
      rawInput: message,
      parseMethod: 'pattern',
    };
  }

  // Try pattern matching first
  const patternResult = detectIntentByPattern(message);

  if (patternResult && patternResult.confidence >= 0.8 && !forceAI) {
    // High confidence pattern match - use it
    logger.debug('Intent parsed by pattern', {
      type: patternResult.type,
      confidence: patternResult.confidence,
    });
    return patternResult;
  }

  if (patternOnly) {
    // Return pattern result (or none) if AI is disabled
    return patternResult || {
      type: 'none',
      confidence: 1,
      params: {} as IntentParams,
      rawInput: message,
      parseMethod: 'pattern',
    };
  }

  // Use AI for ambiguous cases
  if (!patternResult || patternResult.confidence < 0.8 || forceAI) {
    const aiResult = await parseIntentWithAI(message);

    logger.debug('Intent parsed by AI', {
      type: aiResult.type,
      confidence: aiResult.confidence,
    });

    // If AI found something and pattern didn't, use AI
    if (aiResult.type !== 'none' && aiResult.confidence >= confidenceThreshold) {
      return aiResult;
    }

    // If both found something, use higher confidence
    if (patternResult && patternResult.confidence > aiResult.confidence) {
      return patternResult;
    }

    return aiResult;
  }

  return patternResult;
}

/**
 * Check if a message potentially has component intent
 * Quick check without full parsing - useful for UI hints
 */
export function hasComponentIntent(message: string): boolean {
  const trimmed = message.trim().toLowerCase();

  // Quick keyword check
  const keywords = [
    'poll', 'vote', 'rsvp', 'sign up', 'countdown', 'timer',
    'announcement', '📢', 'attention', 'who\'s coming',
  ];

  return keywords.some(keyword => trimmed.includes(keyword));
}

/**
 * Get suggested component type from partial input
 * Useful for autocomplete/suggestions
 */
export function suggestComponentType(partialInput: string): IntentType | null {
  const lower = partialInput.toLowerCase().trim();

  if (lower.startsWith('poll') || lower.includes('vote')) return 'poll';
  if (lower.startsWith('rsvp') || lower.includes('sign up')) return 'rsvp';
  if (lower.startsWith('countdown') || lower.includes('timer')) return 'countdown';
  if (lower.startsWith('announce') || lower.startsWith('📢')) return 'announcement';

  return null;
}
