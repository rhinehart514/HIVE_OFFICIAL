/**
 * Automation Handlers - Automation slash commands
 *
 * Handles: /welcome, /remind, /automate commands
 */

import { toast } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import type { AutomationHandlerDeps, SlashCommandData } from './types';

/**
 * Create automation-related handlers with the given dependencies
 */
export function createAutomationHandlers(deps: AutomationHandlerDeps) {
  const { spaceId, activeBoardId } = deps;

  // Handler for automation slash commands (/welcome, /remind, /automate)
  const handleAutomationCommand = async (command: SlashCommandData): Promise<void> => {
    if (!spaceId) return;

    try {
      let automationPayload: {
        name: string;
        description?: string;
        trigger: { type: string; config: Record<string, unknown> };
        action: { type: string; config: Record<string, unknown> };
        creationSource: string;
        creationPrompt: string;
      };

      switch (command.command) {
        case 'welcome': {
          // /welcome "Message" [--delay=<seconds>] [--board=<boardId>]
          const message = command.primaryArg || 'Welcome to our space! 👋';
          const delay = command.flags.delay ? Number(command.flags.delay) * 1000 : 0;
          const boardId = (command.flags.board as string) || activeBoardId || 'general';

          automationPayload = {
            name: 'Welcome Message',
            description: `Auto-greet new members: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
            trigger: {
              type: 'member_join',
              config: { delayMs: delay },
            },
            action: {
              type: 'send_message',
              config: {
                boardId,
                content: message,
              },
            },
            creationSource: 'slash_command',
            creationPrompt: command.raw,
          };
          break;
        }

        case 'remind': {
          // /remind <minutes> ["Message"] [--board=<boardId>]
          const beforeMinutes = parseInt(command.primaryArg || '30', 10);
          const message =
            command.listArgs[0] ||
            `📅 Reminder: {event.title} starts in ${beforeMinutes} minutes!`;
          const boardId = (command.flags.board as string) || activeBoardId || 'general';

          automationPayload = {
            name: `Event Reminder (${beforeMinutes} min)`,
            description: `Remind members ${beforeMinutes} minutes before events`,
            trigger: {
              type: 'event_reminder',
              config: { beforeMinutes },
            },
            action: {
              type: 'send_message',
              config: {
                boardId,
                content: message,
              },
            },
            creationSource: 'slash_command',
            creationPrompt: command.raw,
          };
          break;
        }

        case 'automate': {
          // /automate <type> "Name" [config]
          const automationType = command.primaryArg?.toLowerCase() || 'welcome';
          const name = command.listArgs[0] || `Custom ${automationType} automation`;

          // Build trigger/action based on automation type
          if (automationType === 'welcome') {
            automationPayload = {
              name,
              trigger: { type: 'member_join', config: {} },
              action: {
                type: 'send_message',
                config: {
                  boardId: activeBoardId || 'general',
                  content: 'Welcome to our space!',
                },
              },
              creationSource: 'slash_command',
              creationPrompt: command.raw,
            };
          } else if (automationType === 'reminder') {
            const beforeMinutes = Number(command.flags.before) || 30;
            automationPayload = {
              name,
              trigger: { type: 'event_reminder', config: { beforeMinutes } },
              action: {
                type: 'send_message',
                config: {
                  boardId: activeBoardId || 'general',
                  content: `📅 {event.title} starts in ${beforeMinutes} minutes!`,
                },
              },
              creationSource: 'slash_command',
              creationPrompt: command.raw,
            };
          } else {
            toast.error('Unknown automation type', `Type "${automationType}" is not supported yet.`);
            return;
          }
          break;
        }

        default:
          return;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create automation');
      }

      const result = await response.json();

      // Show success toast with automation-specific messaging
      const triggerLabels: Record<string, string> = {
        member_join: 'when new members join',
        event_reminder: 'before events start',
        schedule: 'on schedule',
        keyword: 'when keywords are detected',
      };
      const triggerDesc = triggerLabels[automationPayload.trigger.type] || '';

      toast.success(
        `${automationPayload.name} active!`,
        `Will automatically run ${triggerDesc}.`
      );

      logger.info('[Space] Automation created', { result });
    } catch (err) {
      logger.error('[Space] Failed to create automation', err as Error);
      toast.error(
        'Automation failed',
        err instanceof Error ? err.message : 'Failed to create automation'
      );
    }
  };

  return {
    handleAutomationCommand,
  };
}
