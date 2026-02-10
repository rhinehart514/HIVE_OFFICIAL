import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { parseIntent, shouldCreateComponent, getIntentConfirmation } from '@/lib/ai-intent-parser';
import {
  isSlashCommand,
  parseSlashCommand,
  getCommandHelp,
} from '@/lib/slash-command-parser';
import {
  createComponentFromIntent,
  createComponentFromSlashCommand,
  describeCreation,
  type CreationSource,
} from '@/lib/intent-to-component';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * Intent Parsing API - Detect component creation intents from chat messages
 *
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 *
 * POST /api/spaces/[spaceId]/chat/intent - Parse message for component intent
 *
 * This endpoint allows the frontend to:
 * 1. Check if a message contains a component creation intent
 * 2. Preview what component would be created
 * 3. Create the component if confirmed
 */

const ParseIntentSchema = z.object({
  message: z.string().min(1).max(4000),
  // boardId is optional — defaults to "main" for single-feed spaces
  boardId: z.string().min(1).default('main'),
  // If true, actually create the component (requires leader role)
  createIfDetected: z.boolean().default(false),
  // Optional message ID if creating inline with a message
  messageId: z.string().optional(),
});

type ParseIntentData = z.output<typeof ParseIntentSchema>;

/**
 * POST /api/spaces/[spaceId]/chat/intent - Parse and optionally create component
 *
 * Response includes:
 * - hasIntent: Whether a component intent was detected
 * - intentType: Type of component (poll, rsvp, countdown, etc.)
 * - confidence: AI confidence score (0-1)
 * - preview: Description of what would be created
 * - confirmation: Message to show user for confirmation
 * - component: Created component (if createIfDetected=true)
 * - helpText: Help text for slash commands
 */
export const POST = withAuthValidationAndErrors(
  ParseIntentSchema as z.ZodType<ParseIntentData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: ParseIntentData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error('Space ID is required', 'INVALID_INPUT', { status: 400 });
    }

    // Check user permissions
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error('Not authorized to access this space', 'UNAUTHORIZED', { status: 403 });
    }

    const isLeader = permCheck.role === 'owner' || permCheck.role === 'admin';
    const spaceName = permCheck.space?.name;
    const spaceCategory = permCheck.space?.category;

    // Handle slash commands (explicit, no AI needed)
    if (isSlashCommand(data.message)) {
      return handleSlashCommand(
        data,
        spaceId,
        userId,
        campusId,
        isLeader,
        respond
      );
    }

    // Use AI to parse natural language intent
    const intent = await parseIntent(data.message, {
      spaceName,
      spaceCategory,
      isLeader,
    });

    const hasIntent = shouldCreateComponent(intent);

    // If no intent detected, return early
    if (!hasIntent) {
      return respond.success({
        hasIntent: false,
        intentType: 'none',
        confidence: intent.confidence,
        message: 'No component creation intent detected',
      });
    }

    // If user is not a leader, they can't create components
    if (!isLeader) {
      return respond.success({
        hasIntent: true,
        intentType: intent.type,
        confidence: intent.confidence,
        preview: getIntentConfirmation(intent),
        canCreate: false,
        message: 'Only space leaders can create inline components',
      });
    }

    // If not creating, just return the preview
    if (!data.createIfDetected) {
      return respond.success({
        hasIntent: true,
        intentType: intent.type,
        confidence: intent.confidence,
        preview: getIntentConfirmation(intent),
        params: intent.params,
        canCreate: true,
        confirmation: getIntentConfirmation(intent),
      });
    }

    // Create the component
    const messageId = data.messageId || generateMessageId();
    const result = createComponentFromIntent(intent, {
      spaceId,
      boardId: data.boardId,
      messageId,
      createdBy: userId,
    });

    if (!result.success) {
      if (result.needsConfirmation) {
        return respond.success({
          hasIntent: true,
          intentType: intent.type,
          confidence: intent.confidence,
          needsMoreInfo: true,
          confirmationMessage: result.confirmationMessage,
        });
      }

      return respond.error(
        result.error || 'Failed to create component',
        'CREATE_FAILED',
        { status: 400 }
      );
    }

    // Persist the component
    const component = result.component!;
    const componentDTO = component.toDTO();

    try {
      await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(data.boardId)
        .collection('inline_components')
        .doc(component.id)
        .set({
          ...componentDTO,
          creationSource: 'chat_intent' as CreationSource,
          creationPrompt: data.message,
          campusId,
        });

      logger.info('Inline component created via intent', {
        component: 'intent-api',
        componentId: component.id,
        componentType: intent.type,
        spaceId,
        boardId: data.boardId,
        userId,
      });

      return respond.success(
        {
          hasIntent: true,
          intentType: intent.type,
          confidence: intent.confidence,
          created: true,
          component: {
            id: component.id,
            type: component.componentType,
            config: component.config,
          },
          description: describeCreation(intent, 'chat_intent'),
        },
        { status: 201 }
      );
    } catch (error) {
      logger.error('Failed to persist component', {
        component: 'intent-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        boardId: data.boardId,
      });

      return respond.error(
        'Failed to save component',
        'PERSIST_FAILED',
        { status: 500 }
      );
    }
  }
);

/**
 * Handle slash command parsing and execution
 */
async function handleSlashCommand(
  data: ParseIntentData,
  spaceId: string,
  userId: string,
  campusId: string,
  isLeader: boolean,
  respond: {
    success: (data: unknown, options?: { status?: number }) => Response;
    error: (message: string, code: string, options?: { status?: number }) => Response;
  }
) {
  const command = parseSlashCommand(data.message);

  // Handle help command
  if (command.command === 'help') {
    const helpText = getCommandHelp(
      (command as { parsed: { topic?: 'poll' | 'rsvp' | 'countdown' | 'announce' | 'help' | 'unknown' } }).parsed.topic
    );
    return respond.success({
      hasIntent: true,
      intentType: 'help',
      isCommand: true,
      helpText,
    });
  }

  // Validate command
  if (!command.isValid) {
    return respond.success({
      hasIntent: true,
      intentType: command.command,
      isCommand: true,
      isValid: false,
      error: command.error,
      helpText: getCommandHelp(command.command as 'poll' | 'rsvp' | 'countdown' | 'announce' | 'signup' | 'event' | 'help' | 'unknown'),
    });
  }

  // Check if user can create components
  if (!isLeader) {
    return respond.success({
      hasIntent: true,
      intentType: command.command,
      isCommand: true,
      isValid: true,
      canCreate: false,
      message: 'Only space leaders can create inline components',
    });
  }

  // If not creating, just return the preview
  if (!data.createIfDetected) {
    return respond.success({
      hasIntent: true,
      intentType: command.command,
      isCommand: true,
      isValid: true,
      canCreate: true,
      preview: describeCreation(command, 'slash_command'),
    });
  }

  // Create the component
  const messageId = data.messageId || generateMessageId();
  const result = createComponentFromSlashCommand(command, {
    spaceId,
    boardId: data.boardId,
    messageId,
    createdBy: userId,
  });

  if (!result.success) {
    return respond.error(
      result.error || 'Failed to create component',
      'CREATE_FAILED',
      { status: 400 }
    );
  }

  // Persist the component
  const component = result.component!;
  const componentDTO = component.toDTO();

  try {
    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(data.boardId)
      .collection('inline_components')
      .doc(component.id)
      .set({
        ...componentDTO,
        creationSource: 'slash_command' as CreationSource,
        creationPrompt: data.message,
        campusId,
      });

    logger.info('Inline component created via slash command', {
      component: 'intent-api',
      componentId: component.id,
      componentType: command.command,
      spaceId,
      boardId: data.boardId,
      userId,
    });

    return respond.success(
      {
        hasIntent: true,
        intentType: command.command,
        isCommand: true,
        created: true,
        component: {
          id: component.id,
          type: component.componentType,
          config: component.config,
        },
        description: describeCreation(command, 'slash_command'),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to persist component', {
      component: 'intent-api',
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceId,
      boardId: data.boardId,
    });

    return respond.error(
      'Failed to save component',
      'PERSIST_FAILED',
      { status: 500 }
    );
  }
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
