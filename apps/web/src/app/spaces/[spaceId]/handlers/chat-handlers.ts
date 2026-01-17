/**
 * Chat Handlers - Message and intent operations
 *
 * Handles: send message with intent detection, confirm/dismiss intent, insert tools, slash commands
 */

import { toast } from '@hive/ui';
import { mightHaveIntent } from '@/hooks/use-chat-intent';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import type { ChatHandlerDeps, PendingIntent, SlashCommandData } from './types';

/** Parse duration strings like "25m", "1h", "30s" into milliseconds */
function parseDuration(durationStr: string): number {
  const match = durationStr.match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!match) return 5 * 60 * 1000; // Default 5 minutes

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'm').toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 60 * 1000;
  }
}

/**
 * Create chat-related handlers with the given dependencies
 */
export function createChatHandlers(deps: ChatHandlerDeps) {
  const {
    spaceId,
    activeBoardId,
    isLeader,
    sendMessage,
    checkIntent,
    createIntentComponent,
    setPendingIntent,
  } = deps;

  // Handler for sending messages with intent detection
  const handleSendMessage = async (content: string, replyToId?: string): Promise<void> => {
    // Skip intent detection for thread replies
    if (replyToId) {
      await sendMessage(content, replyToId);
      return;
    }

    // Quick check - if message might have an intent, check with API
    if (isLeader && activeBoardId && mightHaveIntent(content)) {
      try {
        const intentResult = await checkIntent(content, activeBoardId);

        // If we detected a valid intent that can be created, show confirmation
        if (
          intentResult.hasIntent &&
          intentResult.intentType !== 'none' &&
          intentResult.intentType !== 'help'
        ) {
          setPendingIntent({
            intent: intentResult,
            message: content,
            boardId: activeBoardId,
          });
          return; // Don't send yet - wait for confirmation
        }
      } catch (err) {
        // Intent check failed, continue with normal send
        console.warn('[Space] Intent check failed:', err);
      }
    }

    // No intent detected or not a leader - send as normal message
    await sendMessage(content, replyToId);
  };

  // Handler for confirming intent creation
  const handleConfirmIntent = async (pendingIntent: PendingIntent | null): Promise<void> => {
    if (!pendingIntent) return;

    try {
      const result = await createIntentComponent(pendingIntent.message, pendingIntent.boardId);

      if (result.success && result.created) {
        // Component created - clear pending state
        setPendingIntent(null);

        // Show success toast with component type
        const typeLabels: Record<string, string> = {
          poll: 'Poll',
          rsvp: 'RSVP',
          countdown: 'Countdown',
          announcement: 'Announcement',
        };
        const label = (pendingIntent.intent.intentType && typeLabels[pendingIntent.intent.intentType]) || 'Component';
        toast.success(`${label} created`, 'Your interactive component is now live in the chat.');
      } else {
        console.warn('[Space] Intent component not created:', result.error);
        toast.error(
          'Could not create component',
          result.error || 'Please try again or send as a regular message.'
        );
      }
    } catch (err) {
      console.error('[Space] Failed to create intent component:', err);
      toast.error('Failed to create component', 'An unexpected error occurred. Please try again.');
    }
  };

  // Handler for dismissing intent (send as regular message instead)
  const handleDismissIntent = async (pendingIntent: PendingIntent | null): Promise<void> => {
    if (!pendingIntent) return;
    await sendMessage(pendingIntent.message);
    setPendingIntent(null);
  };

  // Handler for inserting tools (polls, countdowns, RSVPs) into chat
  const handleInsertTool = async (toolData: {
    type: 'poll' | 'event' | 'countdown' | 'custom';
    config: Record<string, unknown>;
  }): Promise<void> => {
    if (!spaceId || !activeBoardId) return;

    try {
      // Map UI tool types to API types
      const apiType = toolData.type === 'event' ? 'rsvp' : toolData.type;

      // Build config based on type
      const config: Record<string, unknown> = {};

      if (apiType === 'poll') {
        config.question = toolData.config.question as string;
        config.options = toolData.config.options as string[];
        config.allowMultiple = toolData.config.allowMultiple ?? false;
        config.showResults = toolData.config.showResults ?? 'after_vote';
      } else if (apiType === 'countdown') {
        config.title = toolData.config.title as string;
        config.targetDate = toolData.config.targetDate as string;
      } else if (apiType === 'rsvp') {
        config.eventTitle =
          (toolData.config.eventTitle as string) || (toolData.config.title as string);
        config.eventDate =
          (toolData.config.eventDate as string) || (toolData.config.targetDate as string);
        config.allowMaybe = toolData.config.allowMaybe ?? true;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoardId,
          type: apiType,
          content: '',
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create component');
      }

      const typeLabels: Record<string, string> = {
        poll: 'Poll',
        rsvp: 'RSVP',
        countdown: 'Countdown',
        custom: 'Component',
      };
      toast.success(
        `${typeLabels[apiType] || 'Tool'} added`,
        'Your interactive component is now live in the chat.'
      );
    } catch (err) {
      console.error('[Space] Failed to insert tool:', err);
      toast.error('Failed to add tool', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  // Handler for slash commands (e.g., /poll "Question?" Option1, Option2)
  const handleSlashCommand = async (
    command: SlashCommandData,
    automationHandler?: (cmd: SlashCommandData) => Promise<void>
  ): Promise<void> => {
    if (!spaceId || !activeBoardId) return;

    // Check if this is an automation command
    const automationCommands = ['welcome', 'remind', 'automate'];
    if (automationCommands.includes(command.command) && automationHandler) {
      return automationHandler(command);
    }

    try {
      // Map slash command to component API format
      let apiType: 'poll' | 'countdown' | 'rsvp' | 'custom';
      const config: Record<string, unknown> = {};

      switch (command.command) {
        case 'poll':
          apiType = 'poll';
          config.question = command.primaryArg || 'Quick Poll';
          config.options = command.listArgs.length > 0 ? command.listArgs : ['Yes', 'No'];
          config.allowMultiple = command.flags.multi === true || command.flags.multiple === true;
          config.showResults = command.flags.results || 'after_vote';
          break;

        case 'timer':
        case 'countdown': {
          apiType = 'countdown';
          config.title = command.primaryArg || 'Timer';
          const durationStr =
            command.listArgs[0] || (command.flags.duration as string) || '5m';
          const duration = parseDuration(durationStr);
          config.targetDate = new Date(Date.now() + duration).toISOString();
          break;
        }

        case 'rsvp':
        case 'event': {
          apiType = 'rsvp';
          config.eventTitle = command.primaryArg || 'Event';
          const dateStr = (command.flags.date as string) || (command.flags.when as string);
          config.eventDate = dateStr
            ? new Date(dateStr).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          config.allowMaybe = command.flags.maybe !== false;
          break;
        }

        case 'announce':
        case 'announcement':
          apiType = 'custom';
          config.elementType = 'announcement';
          config.settings = {
            message: command.primaryArg || command.raw.replace(/^\/\w+\s*/, ''),
            style: command.flags.style || 'info',
          };
          break;

        default:
          logger.warn(`[Space] Unknown slash command: ${command.command}`);
          return;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoardId,
          type: apiType,
          content: '',
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create component');
      }

      const typeLabels: Record<string, string> = {
        poll: 'Poll',
        rsvp: 'RSVP',
        countdown: 'Countdown',
        custom: 'Component',
      };
      toast.success(
        `${typeLabels[apiType] || 'Component'} created`,
        'Your interactive component is now live.'
      );
    } catch (err) {
      logger.error('[Space] Failed to execute slash command', err as Error);
      toast.error(
        'Command failed',
        err instanceof Error ? err.message : 'Failed to create component'
      );
    }
  };

  return {
    handleSendMessage,
    handleConfirmIntent,
    handleDismissIntent,
    handleInsertTool,
    handleSlashCommand,
  };
}
