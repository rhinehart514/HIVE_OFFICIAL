import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Board Reorder API - Batch update board positions
 *
 * POST /api/spaces/[spaceId]/boards/reorder - Reorder boards
 */

const ReorderBoardsSchema = z.object({
  boardIds: z.array(z.string().min(1)).min(1).max(50),
});

type ReorderBoardsData = z.output<typeof ReorderBoardsSchema>;

export const POST = withAuthValidationAndErrors(
  ReorderBoardsSchema as z.ZodType<ReorderBoardsData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: ReorderBoardsData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Permission check - only leaders can reorder boards
    const permission = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permission.hasPermission) {
      return respond.error("Only leaders can reorder boards", "FORBIDDEN", { status: 403 });
    }

    // Verify space belongs to user's campus
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return respond.error("Space not found", "NOT_FOUND", { status: 404 });
    }

    const spaceData = spaceDoc.data()!;
    if (spaceData.campusId !== campusId) {
      return respond.error("Space not found", "NOT_FOUND", { status: 404 });
    }

    const { boardIds } = data;

    // Verify all boards exist in this space
    const boardsRef = dbAdmin.collection('spaces').doc(spaceId).collection('boards');
    const existingBoardsSnap = await boardsRef.get();
    const existingBoardIds = new Set(existingBoardsSnap.docs.map(doc => doc.id));

    for (const boardId of boardIds) {
      if (!existingBoardIds.has(boardId)) {
        return respond.error(`Board ${boardId} not found in space`, "NOT_FOUND", { status: 404 });
      }
    }

    // Batch update board orders
    const batch = dbAdmin.batch();

    boardIds.forEach((boardId, index) => {
      const boardRef = boardsRef.doc(boardId);
      batch.update(boardRef, {
        order: index,
        updatedAt: Date.now(),
      });
    });

    try {
      await batch.commit();

      logger.info(`Boards reordered in space ${spaceId}`, {
        spaceId,
        boardIds,
        userId,
      });

      return respond.success({
        message: "Boards reordered successfully",
        boardIds,
      });
    } catch (error) {
      logger.error('Failed to reorder boards', { error, spaceId, boardIds });
      return respond.error("Failed to reorder boards", "UPDATE_FAILED", { status: 500 });
    }
  }
);
