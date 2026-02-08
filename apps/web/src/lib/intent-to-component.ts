/**
 * Intent to Component Mapper
 *
 * Bridges parsed intents and slash commands to InlineComponent creation.
 * This is the final step in the chat-first component creation flow.
 *
 * Flow:
 * 1. User sends message
 * 2. AI Intent Parser OR Slash Command Parser extracts intent
 * 3. This mapper creates the InlineComponent
 * 4. Component is persisted and rendered in chat
 *
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 */

import { InlineComponent } from '@hive/core';
import type { ParsedIntent, IntentParams } from './ai-intent-parser';
import type {
  ParsedSlashCommand,
  PollCommand,
  RsvpCommand,
  CountdownCommand,
} from './slash-command-parser';
import { logger } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentCreationContext {
  spaceId: string;
  boardId: string;
  messageId: string;
  createdBy: string;
}

export interface ComponentCreationResult {
  success: boolean;
  component?: InlineComponent;
  error?: string;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
}

export type CreationSource = 'chat_intent' | 'slash_command' | 'canvas' | 'automation';

// ─────────────────────────────────────────────────────────────────────────────
// Main Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create InlineComponent from parsed AI intent
 */
export function createComponentFromIntent(
  intent: ParsedIntent,
  context: ComponentCreationContext
): ComponentCreationResult {
  try {
    switch (intent.type) {
      case 'poll':
        return createPollFromIntent(intent.params, context);

      case 'rsvp':
        return createRsvpFromIntent(intent.params, context);

      case 'countdown':
        return createCountdownFromIntent(intent.params, context);

      case 'announcement':
        // Announcements are handled differently - they're styled messages
        return {
          success: false,
          error: 'Announcements are styled messages, not components',
          needsConfirmation: false,
        };

      case 'none':
      default:
        return {
          success: false,
          error: 'No component intent detected',
        };
    }
  } catch (error) {
    logger.error('Failed to create component from intent', {
      component: 'intent-to-component',
      intentType: intent.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create component',
    };
  }
}

/**
 * Create InlineComponent from parsed slash command
 */
export function createComponentFromSlashCommand(
  command: ParsedSlashCommand,
  context: ComponentCreationContext
): ComponentCreationResult {
  if (!command.isValid) {
    return {
      success: false,
      error: command.error || 'Invalid command',
    };
  }

  try {
    switch (command.command) {
      case 'poll':
        return createPollFromCommand(command as PollCommand, context);

      case 'rsvp':
        return createRsvpFromCommand(command as RsvpCommand, context);

      case 'countdown':
        return createCountdownFromCommand(command as CountdownCommand, context);

      case 'announce':
        // Announcements are handled differently
        return {
          success: false,
          error: 'Announcements are styled messages, not inline components',
        };

      case 'help':
        return {
          success: false,
          error: 'Help command does not create a component',
        };

      default:
        return {
          success: false,
          error: `Unknown command: ${command.command}`,
        };
    }
  } catch (error) {
    logger.error('Failed to create component from command', {
      component: 'intent-to-component',
      commandType: command.command,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create component',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll Creation
// ─────────────────────────────────────────────────────────────────────────────

function createPollFromIntent(
  params: IntentParams,
  context: ComponentCreationContext
): ComponentCreationResult {
  // Check if we have enough info
  if (!params.question || !params.options || params.options.length < 2) {
    return {
      success: false,
      needsConfirmation: true,
      confirmationMessage: 'I detected a poll request. What question would you like to ask, and what options should voters choose from?',
    };
  }

  const result = InlineComponent.createPoll({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    question: params.question,
    options: params.options,
    allowMultiple: params.allowMultiple ?? false,
    showResults: 'always',
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create poll',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

function createPollFromCommand(
  command: PollCommand,
  context: ComponentCreationContext
): ComponentCreationResult {
  const { parsed } = command;

  // Calculate closesAt if specified
  let closesAt: Date | undefined;
  if (parsed.closesIn && parsed.closesIn > 0) {
    closesAt = new Date(Date.now() + parsed.closesIn * 60 * 1000);
  }

  const result = InlineComponent.createPoll({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    question: parsed.question,
    options: parsed.options,
    allowMultiple: parsed.allowMultiple,
    showResults: parsed.anonymous ? 'after_close' : 'always',
    closesAt,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create poll',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RSVP Creation
// ─────────────────────────────────────────────────────────────────────────────

function createRsvpFromIntent(
  params: IntentParams,
  context: ComponentCreationContext
): ComponentCreationResult {
  // Check if we have enough info
  if (!params.eventTitle) {
    return {
      success: false,
      needsConfirmation: true,
      confirmationMessage: 'I detected an RSVP request. What is the name of the event?',
    };
  }

  // Default to a week from now if no date specified
  const eventDate = params.eventDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = InlineComponent.createRsvp({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    eventTitle: params.eventTitle,
    eventDate,
    maxCapacity: params.maxCapacity,
    allowMaybe: true,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create RSVP',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

function createRsvpFromCommand(
  command: RsvpCommand,
  context: ComponentCreationContext
): ComponentCreationResult {
  const { parsed } = command;

  // Default to a week from now if no date specified
  const eventDate = parsed.eventDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = InlineComponent.createRsvp({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    eventTitle: parsed.eventTitle,
    eventDate,
    maxCapacity: parsed.maxCapacity,
    allowMaybe: parsed.allowMaybe,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create RSVP',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown Creation
// ─────────────────────────────────────────────────────────────────────────────

function createCountdownFromIntent(
  params: IntentParams,
  context: ComponentCreationContext
): ComponentCreationResult {
  // Check if we have enough info
  if (!params.title || !params.targetDate) {
    return {
      success: false,
      needsConfirmation: true,
      confirmationMessage: 'I detected a countdown request. What should I count down to, and when is the target date?',
    };
  }

  // Validate target date is in the future
  if (params.targetDate <= new Date()) {
    return {
      success: false,
      error: 'Countdown target date must be in the future',
    };
  }

  const result = InlineComponent.createCountdown({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    title: params.title,
    targetDate: params.targetDate,
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create countdown',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

function createCountdownFromCommand(
  command: CountdownCommand,
  context: ComponentCreationContext
): ComponentCreationResult {
  const { parsed } = command;

  // Validate target date is in the future
  if (parsed.targetDate <= new Date()) {
    return {
      success: false,
      error: 'Countdown target date must be in the future',
    };
  }

  const result = InlineComponent.createCountdown({
    spaceId: context.spaceId,
    boardId: context.boardId,
    messageId: context.messageId,
    createdBy: context.createdBy,
    title: parsed.title,
    targetDate: parsed.targetDate,
    showDays: parsed.showDays,
    showHours: parsed.showHours,
    showMinutes: parsed.showMinutes,
    showSeconds: parsed.showSeconds,
  });

  if (result.isFailure) {
    return {
      success: false,
      error: result.error || 'Failed to create countdown',
    };
  }

  return {
    success: true,
    component: result.getValue(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a message and create component if applicable
 *
 * This is the main entry point for chat-first component creation.
 * It handles both natural language intents and slash commands.
 */
export async function processMessageForComponent(
  message: string,
  context: ComponentCreationContext,
  options: {
    isLeader: boolean;
    spaceName?: string;
    spaceCategory?: string;
  }
): Promise<ComponentCreationResult & { source?: CreationSource }> {
  // Only leaders can create components
  if (!options.isLeader) {
    return {
      success: false,
      error: 'Only space leaders can create inline components',
    };
  }

  // Import parsers dynamically to avoid circular dependencies
  const { isSlashCommand, parseSlashCommand } = await import('./slash-command-parser');
  const { parseIntent, shouldCreateComponent } = await import('./ai-intent-parser');

  // Check for slash command first (explicit, faster)
  if (isSlashCommand(message)) {
    const command = parseSlashCommand(message);
    const result = createComponentFromSlashCommand(command, context);
    return { ...result, source: 'slash_command' };
  }

  // Otherwise, try AI intent parsing
  const intent = await parseIntent(message, {
    spaceName: options.spaceName,
    spaceCategory: options.spaceCategory,
    isLeader: options.isLeader,
  });

  if (shouldCreateComponent(intent)) {
    const result = createComponentFromIntent(intent, context);
    return { ...result, source: 'chat_intent' };
  }

  // No component intent detected
  return {
    success: false,
    error: 'No component intent detected',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a user-friendly description of what will be created
 */
export function describeCreation(
  intent: ParsedIntent | ParsedSlashCommand,
  _source: CreationSource
): string {
  if ('type' in intent) {
    // ParsedIntent
    switch (intent.type) {
      case 'poll':
        if (intent.params.question) {
          return `Creating poll: "${intent.params.question}" with ${intent.params.options?.length || 0} options`;
        }
        return 'Creating a poll';

      case 'rsvp':
        if (intent.params.eventTitle) {
          return `Creating RSVP for: "${intent.params.eventTitle}"`;
        }
        return 'Creating an RSVP';

      case 'countdown':
        if (intent.params.title) {
          return `Creating countdown to: "${intent.params.title}"`;
        }
        return 'Creating a countdown';

      default:
        return 'Creating component';
    }
  } else {
    // ParsedSlashCommand
    switch (intent.command) {
      case 'poll': {
        const poll = intent as PollCommand;
        return `Creating poll: "${poll.parsed.question}" with ${poll.parsed.options.length} options`;
      }

      case 'rsvp': {
        const rsvp = intent as RsvpCommand;
        return `Creating RSVP for: "${rsvp.parsed.eventTitle}"`;
      }

      case 'countdown': {
        const countdown = intent as CountdownCommand;
        return `Creating countdown to: "${countdown.parsed.title}"`;
      }

      default:
        return 'Creating component';
    }
  }
}

/**
 * Validate that a component can be created in the given context
 */
export function validateCreationContext(context: ComponentCreationContext): {
  valid: boolean;
  error?: string;
} {
  if (!context.spaceId) {
    return { valid: false, error: 'Space ID is required' };
  }

  if (!context.boardId) {
    return { valid: false, error: 'Board ID is required' };
  }

  if (!context.messageId) {
    return { valid: false, error: 'Message ID is required' };
  }

  if (!context.createdBy) {
    return { valid: false, error: 'Creator ID is required' };
  }

  return { valid: true };
}
