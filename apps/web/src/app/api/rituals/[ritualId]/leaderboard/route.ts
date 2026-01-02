import { RitualEngineService } from "@hive/core";
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  streakCount: number;
  completionCount: number;
  isCurrentUser: boolean;
}

/**
 * GET /api/rituals/[ritualId]/leaderboard - Get ritual leaderboard
 *
 * Returns top participants ranked by points.
 * Query params:
 * - limit: Max entries (default 50, max 100)
 */
export const GET = withAuthAndErrors(
  async (request, context: RouteParams, respond) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = getCampusId(req);
    const { ritualId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Check feature flag
    const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
    if (!ritualsEnabled) {
      return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
        status: 403,
      });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      // Verify ritual exists
      const ritualResult = await service.getRitual(ritualId);
      if (ritualResult.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      // Fetch top participants
      const participantsSnapshot = await dbAdmin
        .collection("ritual_participants")
        .where("ritualId", "==", ritualId)
        .where("status", "==", "active")
        .orderBy("totalPoints", "desc")
        .limit(limit)
        .get();

      // Get user profiles for display names
      const userIds = participantsSnapshot.docs.map((doc) => doc.data().userId);
      const profilesMap: Record<string, { displayName?: string; avatarUrl?: string }> = {};

      if (userIds.length > 0) {
        // Batch fetch profiles
        const profilesSnapshot = await dbAdmin
          .collection("profiles")
          .where("userId", "in", userIds.slice(0, 10)) // Firestore limit
          .get();

        profilesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          profilesMap[data.userId] = {
            displayName: data.displayName || data.handle,
            avatarUrl: data.avatarUrl,
          };
        });
      }

      // Build leaderboard entries
      const leaderboard: LeaderboardEntry[] = participantsSnapshot.docs.map(
        (doc, index) => {
          const data = doc.data();
          const profile = profilesMap[data.userId] || {};

          return {
            rank: index + 1,
            userId: data.userId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            totalPoints: data.totalPoints || 0,
            streakCount: data.streakCount || 0,
            completionCount: data.completionCount || 0,
            isCurrentUser: data.userId === userId,
          };
        }
      );

      // Find current user's position if not in top
      let currentUserEntry: LeaderboardEntry | null = null;
      const isInLeaderboard = leaderboard.some((e) => e.isCurrentUser);

      if (!isInLeaderboard) {
        const userDoc = await dbAdmin
          .collection("ritual_participants")
          .doc(`${ritualId}_${userId}`)
          .get();

        if (userDoc.exists && userDoc.data()?.status === "active") {
          const userData = userDoc.data()!;

          // Count users with more points to determine rank
          const rankSnapshot = await dbAdmin
            .collection("ritual_participants")
            .where("ritualId", "==", ritualId)
            .where("status", "==", "active")
            .where("totalPoints", ">", userData.totalPoints || 0)
            .count()
            .get();

          currentUserEntry = {
            rank: rankSnapshot.data().count + 1,
            userId,
            totalPoints: userData.totalPoints || 0,
            streakCount: userData.streakCount || 0,
            completionCount: userData.completionCount || 0,
            isCurrentUser: true,
          };
        }
      }

      logger.info("Fetched ritual leaderboard", {
        ritualId,
        count: leaderboard.length,
        campusId,
      });

      return respond.success({
        leaderboard,
        currentUserEntry,
        totalParticipants: participantsSnapshot.size,
      });
    } catch (error) {
      logger.error("Error fetching leaderboard", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        campusId,
      });
      return respond.error("Failed to load leaderboard", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);
