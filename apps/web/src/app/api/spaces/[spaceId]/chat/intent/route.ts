import { z } from "zod";
import { NextResponse } from "next/server";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import {
  parseIntent,
  parseSlashCommandToIntent,
  isSlashCommand,
  intentToComponent,
  slashCommandToComponent,
  generatePreview,
  type ParsedIntent,
  type ComponentCreationContext,
} from "@/lib/hivelab";

/**
 * Intent Detection API
 *
 * Analyzes chat messages to detect component creation intent.
 * Used by the chat input for real-time suggestions and previews.
 *
 * POST /api/spaces/[spaceId]/chat/intent
 *
 * Leaders can use this to preview what component will be created
 * before sending the message.
 */

const IntentRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  boardId: z.string().min(1),
  /**
   * If true, only use pattern matching (faster but less accurate)
   */
  patternOnly: z.boolean().optional().default(false),
  /**
   * If true, skip component creation and only return the parsed intent
   */
  previewOnly: z.boolean().optional().default(true),
});

type IntentRequestData = z.output<typeof IntentRequestSchema>;

export const POST = withAuthValidationAndErrors(
  IntentRequestSchema as z.ZodType<IntentRequestData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: IntentRequestData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check if user is a leader in this space (only leaders can create components)
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      // Non-leaders get a simple "no intent" response (don't reveal capability)
      return respond.success({
        hasIntent: false,
        message: "No component intent detected",
      });
    }

    const { message, boardId, patternOnly, previewOnly } = data;

    try {
      let parsedIntent: ParsedIntent;

      // Check if it's a slash command first
      if (isSlashCommand(message)) {
        const slashResult = parseSlashCommandToIntent(message);
        if (slashResult) {
          parsedIntent = {
            type: slashResult.type,
            confidence: slashResult.isValid ? 1.0 : 0.5,
            params: slashResult.params,
            rawInput: message,
            parseMethod: 'pattern',
          };

          if (!slashResult.isValid) {
            return respond.success({
              hasIntent: true,
              isSlashCommand: true,
              type: slashResult.type,
              valid: false,
              errors: slashResult.errors,
              preview: null,
            });
          }
        } else {
          // Invalid slash command
          return respond.success({
            hasIntent: false,
            isSlashCommand: true,
            valid: false,
            errors: ['Unknown command. Try /poll, /rsvp, /countdown, or /announce'],
          });
        }
      } else {
        // Use AI intent parser for natural language
        parsedIntent = await parseIntent(message, {
          patternOnly,
          confidenceThreshold: 0.6,
        });
      }

      // No intent detected
      if (parsedIntent.type === 'none' || parsedIntent.confidence < 0.6) {
        return respond.success({
          hasIntent: false,
          confidence: parsedIntent.confidence,
          parseMethod: parsedIntent.parseMethod,
        });
      }

      // Generate preview
      const preview = generatePreview(parsedIntent);

      if (previewOnly) {
        return respond.success({
          hasIntent: true,
          isSlashCommand: isSlashCommand(message),
          type: parsedIntent.type,
          confidence: parsedIntent.confidence,
          parseMethod: parsedIntent.parseMethod,
          preview,
          params: parsedIntent.params,
        });
      }

      // Create the component (for non-preview requests)
      const context: ComponentCreationContext = {
        spaceId,
        boardId,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        creatorId: userId,
      };

      const result = intentToComponent(parsedIntent, context);

      if (result.error) {
        return respond.success({
          hasIntent: true,
          type: parsedIntent.type,
          valid: false,
          errors: [result.error],
          preview,
        });
      }

      return respond.success({
        hasIntent: true,
        type: parsedIntent.type,
        confidence: parsedIntent.confidence,
        parseMethod: parsedIntent.parseMethod,
        preview,
        component: result.component?.toDTO(),
        messageEnhancement: result.messageEnhancement,
      });

    } catch (error) {
      logger.error('Intent parsing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        userId,
        messageLength: message.length,
      });

      return respond.error(
        "Failed to parse intent",
        "PARSE_FAILED",
        { status: 500 }
      );
    }
  }
);
