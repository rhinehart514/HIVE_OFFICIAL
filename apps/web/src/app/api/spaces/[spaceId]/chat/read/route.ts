import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { FieldValue } from "firebase-admin/firestore";
import { withCache } from '../../../../../../lib/cache-headers';

/**
 * Read Receipts API - Track message read status per user per board
 *
 * This uses a lightweight approach: store lastReadTimestamp per user per board.
 * This avoids storing individual read status per message which would be expensive.
 *
 * GET  /api/spaces/[spaceId]/chat/read - Get user's read receipts for all boards
 * POST /api/spaces/[spaceId]/chat/read - Mark messages as read up to a timestamp
 */

const MarkReadSchema = z.object({
  boardId: z.string().min(1),
  /** Timestamp of the last message read (messages up to and including this are marked read) */
  lastReadTimestamp: z.number().positive(),
});

interface ReadReceiptDoc {
  userId: string;
  boardId: string;
  spaceId: string;
  campusId: string;
  lastReadTimestamp: number;
  updatedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

/**
 * GET /api/spaces/[spaceId]/chat/read - Get read receipts for current user
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const _campusId = getCampusId(request as AuthenticatedRequest);
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId');

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Check member permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    // Allow guests to view read status in public spaces
    const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
    if (!guestCheck.hasPermission || !guestCheck.space?.isPublic) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }
  }

  try {
    const query = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards');

    if (boardId) {
      // Get read receipt for specific board
      const receiptDoc = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(boardId)
        .collection('read_receipts')
        .doc(userId)
        .get();

      if (!receiptDoc.exists) {
        return respond.success({
          readReceipts: [{
            boardId,
            lastReadTimestamp: 0,
          }],
        });
      }

      const data = receiptDoc.data() as ReadReceiptDoc;
      return respond.success({
        readReceipts: [{
          boardId,
          lastReadTimestamp: data.lastReadTimestamp,
        }],
      });
    }

    // Get all boards first
    const boardsSnapshot = await query.get();
    const readReceipts: { boardId: string; lastReadTimestamp: number }[] = [];

    // For each board, get the read receipt
    for (const boardDoc of boardsSnapshot.docs) {
      const receiptDoc = await boardDoc.ref
        .collection('read_receipts')
        .doc(userId)
        .get();

      readReceipts.push({
        boardId: boardDoc.id,
        lastReadTimestamp: receiptDoc.exists
          ? (receiptDoc.data() as ReadReceiptDoc).lastReadTimestamp
          : 0,
      });
    }

    return respond.success({ readReceipts });
  } catch (error) {
    logger.error('Failed to fetch read receipts', { error, spaceId, userId });
    return respond.error("Failed to fetch read receipts", "FETCH_FAILED", { status: 500 });
  }
});

/**
 * POST /api/spaces/[spaceId]/chat/read - Mark messages as read
 */
type MarkReadData = z.output<typeof MarkReadSchema>;

export const POST = withAuthValidationAndErrors(
  MarkReadSchema as z.ZodType<MarkReadData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: MarkReadData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check member permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      // Allow guests in public spaces
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (!guestCheck.hasPermission || !guestCheck.space?.isPublic) {
        return respond.error("Access denied", "FORBIDDEN", { status: 403 });
      }
    }

    try {
      const readReceiptRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(data.boardId)
        .collection('read_receipts')
        .doc(userId);

      // Get existing to avoid moving backwards
      const existing = await readReceiptRef.get();
      const existingTimestamp = existing.exists
        ? (existing.data() as ReadReceiptDoc).lastReadTimestamp
        : 0;

      // Only update if new timestamp is later
      if (data.lastReadTimestamp > existingTimestamp) {
        const receiptData: ReadReceiptDoc = {
          userId,
          boardId: data.boardId,
          spaceId,
          campusId,
          lastReadTimestamp: data.lastReadTimestamp,
          updatedAt: FieldValue.serverTimestamp(),
        };

        await readReceiptRef.set(receiptData, { merge: true });

        logger.info('Read receipt updated', {
          spaceId,
          boardId: data.boardId,
          userId,
          lastReadTimestamp: data.lastReadTimestamp,
        });
      }

      return respond.success({
        message: "Read status updated",
        boardId: data.boardId,
        lastReadTimestamp: Math.max(data.lastReadTimestamp, existingTimestamp),
      });
    } catch (error) {
      logger.error('Failed to update read receipt', { error, spaceId, boardId: data.boardId, userId });
      return respond.error("Failed to update read status", "UPDATE_FAILED", { status: 500 });
    }
  }
);

export const GET = withCache(_GET, 'PRIVATE');
