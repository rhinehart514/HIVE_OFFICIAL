/**
 * Intent to Component Converter
 *
 * Converts parsed intents (from AI or slash commands) into
 * InlineComponent entities that can be persisted and rendered in chat.
 */

import {
  InlineComponent,
  Result,
  type PollConfig,
  type CountdownConfig,
  type RsvpConfig,
} from '@hive/core';
import type {
  ParsedIntent,
  IntentType,
  PollParams,
  RsvpParams,
  CountdownParams,
  AnnouncementParams,
} from './ai-intent-parser';
import type { ParsedSlashCommand } from './slash-command-parser';
import { logger } from '../structured-logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentCreationContext {
  spaceId: string;
  boardId: string;
  messageId: string;
  creatorId: string;
  creatorName?: string;
}

export interface ComponentCreationResult {
  component: InlineComponent | null;
  type: IntentType;
  /**
   * For announcements, we don't create a component but enhance the message
   */
  messageEnhancement?: {
    isPinned: boolean;
    isAnnouncement: boolean;
    content: string;
  };
  error?: string;
}

export type CreationSource = 'chat_intent' | 'slash_command' | 'canvas' | 'automation';

// ─────────────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate poll parameters
 */
function validatePollParams(params: PollParams): string[] {
  const errors: string[] = [];

  if (!params.question || params.question.trim().length === 0) {
    errors.push('Poll question is required');
  }

  if (!params.options || params.options.length < 2) {
    errors.push('Poll requires at least 2 options');
  }

  if (params.options && params.options.length > 10) {
    errors.push('Poll cannot have more than 10 options');
  }

  if (params.closesAt && params.closesAt <= new Date()) {
    errors.push('Close time must be in the future');
  }

  return errors;
}

/**
 * Validate RSVP parameters
 */
function validateRsvpParams(params: RsvpParams): string[] {
  const errors: string[] = [];

  if (!params.eventTitle || params.eventTitle.trim().length === 0) {
    errors.push('Event title is required');
  }

  if (params.maxCapacity !== undefined && params.maxCapacity < 1) {
    errors.push('Max capacity must be at least 1');
  }

  return errors;
}

/**
 * Validate countdown parameters
 */
function validateCountdownParams(params: CountdownParams): string[] {
  const errors: string[] = [];

  if (!params.title || params.title.trim().length === 0) {
    errors.push('Countdown title is required');
  }

  if (!params.targetDate) {
    errors.push('Target date is required');
  } else if (params.targetDate <= new Date()) {
    errors.push('Target date must be in the future');
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Creators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a poll component from parsed intent
 */
function createPollFromIntent(
  params: PollParams,
  context: ComponentCreationContext
): Result<InlineComponent> {
  const validationErrors = validatePollParams(params);
  if (validationErrors.length > 0) {
    return Result.fail<InlineComponent>(validationErrors.join('; '));
  }

  return InlineComponent.createPoll({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.creatorId,
    question: params.question,
    options: params.options,
    allowMultiple: params.allowMultiple,
    showResults: 'always',
    closesAt: params.closesAt,
  });
}

/**
 * Create an RSVP component from parsed intent
 */
function createRsvpFromIntent(
  params: RsvpParams,
  context: ComponentCreationContext
): Result<InlineComponent> {
  const validationErrors = validateRsvpParams(params);
  if (validationErrors.length > 0) {
    return Result.fail<InlineComponent>(validationErrors.join('; '));
  }

  // Default to 7 days from now if no date provided
  const eventDate = params.eventDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return InlineComponent.createRsvp({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.creatorId,
    eventTitle: params.eventTitle,
    eventDate,
    maxCapacity: params.maxCapacity,
    allowMaybe: params.allowMaybe ?? true,
  });
}

/**
 * Create a countdown component from parsed intent
 */
function createCountdownFromIntent(
  params: CountdownParams,
  context: ComponentCreationContext
): Result<InlineComponent> {
  const validationErrors = validateCountdownParams(params);
  if (validationErrors.length > 0) {
    return Result.fail<InlineComponent>(validationErrors.join('; '));
  }

  return InlineComponent.createCountdown({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.creatorId,
    title: params.title,
    targetDate: params.targetDate,
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Conversion Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a parsed intent to an InlineComponent
 *
 * @param intent - Parsed intent from AI or pattern matching
 * @param context - Space/board/message context
 * @returns Component creation result
 */
export function intentToComponent(
  intent: ParsedIntent,
  context: ComponentCreationContext
): ComponentCreationResult {
  logger.debug('Converting intent to component', {
    type: intent.type,
    confidence: intent.confidence,
    parseMethod: intent.parseMethod,
  });

  switch (intent.type) {
    case 'poll': {
      const params = intent.params as PollParams;
      const result = createPollFromIntent(params, context);
      if (result.isFailure) {
        return {
          component: null,
          type: 'poll',
          error: result.error ?? undefined,
        };
      }
      return {
        component: result.getValue(),
        type: 'poll',
      };
    }

    case 'rsvp': {
      const params = intent.params as RsvpParams;
      const result = createRsvpFromIntent(params, context);
      if (result.isFailure) {
        return {
          component: null,
          type: 'rsvp',
          error: result.error ?? undefined,
        };
      }
      return {
        component: result.getValue(),
        type: 'rsvp',
      };
    }

    case 'countdown': {
      const params = intent.params as CountdownParams;
      const result = createCountdownFromIntent(params, context);
      if (result.isFailure) {
        return {
          component: null,
          type: 'countdown',
          error: result.error ?? undefined,
        };
      }
      return {
        component: result.getValue(),
        type: 'countdown',
      };
    }

    case 'announcement': {
      // Announcements don't create a component, they enhance the message
      const params = intent.params as AnnouncementParams;
      return {
        component: null,
        type: 'announcement',
        messageEnhancement: {
          isPinned: params.isPinned ?? false,
          isAnnouncement: true,
          content: params.content,
        },
      };
    }

    case 'none':
    default:
      return {
        component: null,
        type: 'none',
      };
  }
}

/**
 * Convert a parsed slash command to an InlineComponent
 *
 * @param command - Parsed slash command
 * @param context - Space/board/message context
 * @returns Component creation result
 */
export function slashCommandToComponent(
  command: ParsedSlashCommand,
  context: ComponentCreationContext
): ComponentCreationResult {
  if (!command.isValid) {
    return {
      component: null,
      type: command.type,
      error: command.errors.join('; '),
    };
  }

  // Convert to intent format and use the same conversion logic
  const intent: ParsedIntent = {
    type: command.type,
    confidence: 1.0, // Slash commands are explicit
    params: command.params,
    rawInput: command.raw,
    parseMethod: 'pattern',
  };

  return intentToComponent(intent, context);
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialization Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert an InlineComponent to Firestore document format
 */
export function componentToFirestoreDoc(
  component: InlineComponent,
  source: CreationSource,
  originalPrompt?: string
): Record<string, unknown> {
  const dto = component.toDTO();

  return {
    ...dto,
    creationSource: source,
    creationPrompt: originalPrompt,
    createdVia: 'web',
  };
}

/**
 * Generate a unique message ID for component attachment
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview Generation
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentPreview {
  type: IntentType;
  title: string;
  description: string;
  details: Record<string, string>;
}

/**
 * Generate a preview of what component will be created
 * Used for confirmation UI before creating
 */
export function generatePreview(intent: ParsedIntent): ComponentPreview | null {
  switch (intent.type) {
    case 'poll': {
      const params = intent.params as PollParams;
      return {
        type: 'poll',
        title: 'Poll',
        description: params.question,
        details: {
          'Options': params.options.join(', '),
          'Multiple votes': params.allowMultiple ? 'Yes' : 'No',
          ...(params.closesAt && { 'Closes': params.closesAt.toLocaleString() }),
        },
      };
    }

    case 'rsvp': {
      const params = intent.params as RsvpParams;
      return {
        type: 'rsvp',
        title: 'RSVP',
        description: params.eventTitle,
        details: {
          ...(params.eventDate && { 'Date': params.eventDate.toLocaleString() }),
          ...(params.maxCapacity && { 'Capacity': `${params.maxCapacity} spots` }),
          'Allow maybe': params.allowMaybe ? 'Yes' : 'No',
        },
      };
    }

    case 'countdown': {
      const params = intent.params as CountdownParams;
      return {
        type: 'countdown',
        title: 'Countdown',
        description: params.title,
        details: {
          'Target': params.targetDate.toLocaleString(),
        },
      };
    }

    case 'announcement': {
      const params = intent.params as AnnouncementParams;
      return {
        type: 'announcement',
        title: 'Announcement',
        description: params.content.substring(0, 100) + (params.content.length > 100 ? '...' : ''),
        details: {
          'Pinned': params.isPinned ? 'Yes' : 'No',
        },
      };
    }

    default:
      return null;
  }
}
