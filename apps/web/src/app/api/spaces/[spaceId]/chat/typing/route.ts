import { z } from "zod";
import * as admin from 'firebase-admin';
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";

/**
 * Typing Indicator API - Track who is typing in a board
 *
 * GET  /api/spaces/[spaceId]/chat/typing - Get typing users
 * POST /api/spaces/[spaceId]/chat/typing - Send typing indicator
 */

const TYPING_EXPIRY_MS = 5000; // 5 seconds

const TypingSchema = z.object({
  boardId: z.string().min(1),
});

/**
 * GET /api/spaces/[spaceId]/chat/typing - Get users currently typing
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId');

  if (!spaceId || !boardId) {
    return respond.error("Space ID and Board ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Check member permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status: 403 });
  }

  try {
    const now = Date.now();
    const cutoff = now - TYPING_EXPIRY_MS;

    const typingRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(boardId)
      .collection('typing');

    // Get ALL typing indicators, then filter client-side
    // This allows us to return active ones AND clean up expired ones
    const typingSnapshot = await typingRef.get();

    const activeUsers: Array<{ id: string; name: string; avatarUrl?: string }> = [];
    const expiredDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    for (const doc of typingSnapshot.docs) {
      const data = doc.data();
      const timestamp = data.timestamp as number;

      if (timestamp > cutoff) {
        // Active indicator - include in response (excluding self)
        if (doc.id !== userId) {
          activeUsers.push({
            id: doc.id,
            name: data.name,
            avatarUrl: data.avatarUrl,
          });
        }
      } else {
        // Expired indicator - mark for cleanup
        expiredDocs.push(doc);
      }
    }

    // Cleanup expired typing indicators (fire and forget with logging)
    if (expiredDocs.length > 0) {
      Promise.all(
        expiredDocs.map(doc => doc.ref.delete())
      ).catch(err => {
        logger.warn('Failed to cleanup expired typing indicators', {
          spaceId,
          boardId,
          count: expiredDocs.length,
          error: err instanceof Error ? err.message : String(err)
        });
      });
    }

    return respond.success({ users: activeUsers });
  } catch (error) {
    logger.error('Failed to get typing users', { error, spaceId, boardId });
    return respond.error("Failed to get typing users", "FETCH_FAILED", { status: 500 });
  }
});

/**
 * POST /api/spaces/[spaceId]/chat/typing - Send typing indicator
 */
type TypingData = z.output<typeof TypingSchema>;

export const POST = withAuthValidationAndErrors(
  TypingSchema as z.ZodType<TypingData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: TypingData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check member permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status: 403 });
    }

    try {
      // Get user info
      const userDoc = await dbAdmin.collection('profiles').doc(userId).get();
      const userData = userDoc.data() || {};

      // Build typing indicator data, filtering out undefined values
      // expiresAt enables Firestore TTL auto-deletion (30s buffer over 5s client expiry)
      const typingData: {
        name: string;
        timestamp: number;
        expiresAt: admin.firestore.Timestamp;
        avatarUrl?: string;
      } = {
        name: userData.displayName || userData.name || 'Member',
        timestamp: Date.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 1000)),
      };

      // Only add avatarUrl if it exists (Firestore doesn't accept undefined)
      const avatarUrl = userData.avatarUrl || userData.photoURL;
      if (avatarUrl) {
        typingData.avatarUrl = avatarUrl;
      }

      // Set typing indicator (overwrites previous)
      await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(data.boardId)
        .collection('typing')
        .doc(userId)
        .set(typingData);

      return respond.success({ ok: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Failed to set typing indicator', {
        errorMessage,
        errorStack,
        spaceId,
        boardId: data.boardId,
        userId
      });
      return respond.error("Failed to set typing indicator", "UPDATE_FAILED", { status: 500 });
    }
  }
);
