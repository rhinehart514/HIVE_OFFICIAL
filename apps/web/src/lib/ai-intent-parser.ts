/**
 * AI Intent Parser
 *
 * Backward-compatible wrapper around intent-detection.ts.
 */

import { detectIntent, type Intent } from './ai-generator/intent-detection';
import { logger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types (legacy shape used by chat intent route)
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'signup' | 'event' | 'none';

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  params: IntentParams;
  rawInput: string;
}

export interface IntentParams {
  question?: string;
  options?: string[];
  allowMultiple?: boolean;

  eventTitle?: string;
  eventDate?: Date;
  maxCapacity?: number;

  title?: string;
  targetDate?: Date;

  signupTitle?: string;
  slots?: string[];
  limitPerSlot?: number;

  location?: string;
  description?: string;

  content?: string;
}

const INTENT_MAP: Record<Intent, IntentType> = {
  'collect-input': 'signup',
  'show-results': 'announcement',
  'track-time': 'countdown',
  'rank-items': 'event',
  'enable-voting': 'poll',
  'search-filter': 'event',
  'coordinate-people': 'rsvp',
  'broadcast': 'announcement',
  'visualize-data': 'announcement',
  'discover-events': 'event',
  'find-food': 'event',
  'find-study-spot': 'event',
  'photo-challenge': 'event',
  'attendance-tracking': 'rsvp',
  'resource-management': 'signup',
  'multi-vote': 'poll',
  'event-series': 'event',
  'suggestion-triage': 'signup',
  'group-matching': 'rsvp',
  'competition-goals': 'event',
  'custom-visual': 'event',
  'exchange-items': 'signup',
  'match-people': 'rsvp',
  'run-approval': 'signup',
  'track-data': 'announcement',
};

/**
 * Parse a chat message for component creation intent
 */
export async function parseIntent(
  message: string,
  context?: {
    spaceName?: string;
    spaceCategory?: string;
    isLeader?: boolean;
  }
): Promise<ParsedIntent> {
  if (message.length < 5 || message.length > 2000) {
    return createNoneIntent(message);
  }

  const detected = detectIntent(message);
  const mappedType = detected.confidence < 0.35 ? 'none' : INTENT_MAP[detected.primary] ?? 'none';
  const confidence = clampConfidence(detected.confidence);

  logger.debug('Intent parsed', {
    component: 'ai-intent-parser',
    detectedPrimary: detected.primary,
    mappedType,
    confidence,
    messagePreview: message.substring(0, 80),
    spaceName: context?.spaceName,
    spaceCategory: context?.spaceCategory,
    isLeader: context?.isLeader,
  });

  if (mappedType === 'none') {
    return createNoneIntent(message, confidence);
  }

  return {
    type: mappedType,
    confidence,
    params: extractLegacyParams(mappedType, message),
    rawInput: message,
  };
}

function extractLegacyParams(type: IntentType, message: string): IntentParams {
  switch (type) {
    case 'poll': {
      const question = message.match(/([^.!?]+\?)/)?.[1]?.trim();
      const optionText = message.match(/(?:options?|choices?)\s*[:=-]\s*(.+)$/i)?.[1];
      const options = optionText
        ? optionText.split(/,\s*|;\s*|\s+or\s+/i).map((value) => value.trim()).filter(Boolean)
        : undefined;
      return {
        question,
        options,
        allowMultiple: /\b(multiple|multi[-\s]?select)\b/i.test(message),
      };
    }

    case 'rsvp':
      return {
        eventTitle: message.match(/\b(?:for|to)\s+([^,.!?]+)/i)?.[1]?.trim(),
        eventDate: parseRelativeDate(message),
        maxCapacity: parseNumber(message, /(?:max|limit|cap(?:acity)?)\s*(?:of|:)?\s*(\d+)/i),
      };

    case 'countdown':
      return {
        title: message.match(/\b(?:to|for)\s+([^,.!?]+)/i)?.[1]?.trim() || message.slice(0, 100),
        targetDate: parseRelativeDate(message),
      };

    case 'announcement':
      return { content: message.trim() };

    case 'signup':
      return {
        signupTitle: message.match(/\b(?:for|to)\s+([^,.!?]+)/i)?.[1]?.trim() || message.slice(0, 100),
      };

    case 'event':
      return {
        eventTitle: message.match(/\b(?:for|to|about)\s+([^,.!?]+)/i)?.[1]?.trim(),
        eventDate: parseRelativeDate(message),
        location: message.match(/\b(?:at|in)\s+([A-Z0-9][^,.!?]+)/i)?.[1]?.trim(),
        description: message.trim(),
      };

    default:
      return {};
  }
}

function parseNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseRelativeDate(text: string): Date | undefined {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('tomorrow')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  if (lower.includes('next week')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  try {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // ignored
  }

  return undefined;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createNoneIntent(rawInput: string, confidence = 1): ParsedIntent {
  return {
    type: 'none',
    confidence: clampConfidence(confidence),
    params: {},
    rawInput,
  };
}

export function shouldCreateComponent(intent: ParsedIntent): boolean {
  return intent.type !== 'none' && intent.confidence >= 0.7;
}

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
