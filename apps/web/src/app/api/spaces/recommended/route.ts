import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository, type EnhancedSpace } from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";

/**
 * SPEC.md Behavioral Psychology Algorithm:
 * Score = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
 */
interface BehavioralSpace {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  anxietyReliefScore: number;
  socialProofScore: number;
  insiderAccessScore: number;
  recommendationScore: number;
  joinToActiveRate: number;
  mutualConnections: number;
  friendsInSpace: number;
}

/**
 * GET /api/spaces/recommended - Get personalized space recommendations
 *
 * Uses behavioral psychology algorithm from SPEC.md:
 * - Anxiety Relief: Spaces that address common student anxieties
 * - Social Proof: Spaces with friends/connections
 * - Insider Access: Exclusive/invite-only spaces
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  try {
    // Get user profile for personalization
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return respond.error("User profile not found", "NOT_FOUND", { status: 404 });
    }

    // Get user's connections for social proof
    const connectionsSnapshot = await dbAdmin
      .collection('connections')
      .where('userId', '==', userId)
      .where('status', '==', 'connected')
      .get();
    const connectionIds = connectionsSnapshot.docs.map(doc => doc.data().connectedUserId);

    // Get user's friends
    const friendsSnapshot = await dbAdmin
      .collection('friends')
      .where('userId', '==', userId)
      .where('status', '==', 'accepted')
      .get();
    const friendIds = friendsSnapshot.docs.map(doc => doc.data().friendId);

    // Use DDD repository to get spaces
    const spaceRepo = getServerSpaceRepository();
    const spacesResult = await spaceRepo.findByCampus(CURRENT_CAMPUS_ID, 100);

    if (spacesResult.isFailure) {
      logger.error('Failed to load spaces for recommendations', { error: spacesResult.error });
      return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
    }

    const allSpaces = spacesResult.getValue();
    const scoredSpaces: BehavioralSpace[] = [];

    // Calculate behavioral scores for each space
    for (const space of allSpaces) {
      // Get member data for social proof calculation
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', space.spaceId.value)
        .where('isActive', '==', true)
        .limit(100)
        .get();

      const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

      // Calculate mutual connections
      const mutualConnections = memberIds.filter(id => connectionIds.includes(id)).length;
      const friendsInSpace = memberIds.filter(id => friendIds.includes(id)).length;

      // Calculate behavioral scores
      const anxietyReliefScore = calculateAnxietyReliefScore(space, userData);
      const socialProofScore = calculateSocialProofScore(
        mutualConnections,
        friendsInSpace,
        space.memberCount
      );
      const insiderAccessScore = calculateInsiderAccessScore(space);

      // Overall recommendation score (SPEC.md formula)
      const recommendationScore =
        (anxietyReliefScore * 0.4) +
        (socialProofScore * 0.3) +
        (insiderAccessScore * 0.3);

      // Calculate join-to-active rate
      const joinToActiveRate = calculateJoinToActiveRate(space.memberCount, membersSnapshot.size);

      scoredSpaces.push({
        id: space.spaceId.value,
        name: space.name.value,
        slug: space.slug?.value,
        description: space.description.value,
        category: space.category.value,
        memberCount: space.memberCount,
        isVerified: space.isVerified,
        isPrivate: !space.isPublic,
        anxietyReliefScore,
        socialProofScore,
        insiderAccessScore,
        recommendationScore,
        joinToActiveRate,
        mutualConnections,
        friendsInSpace
      });
    }

    // Sort by recommendation score
    scoredSpaces.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Categorize spaces for SPEC.md sections
    const panicRelief = scoredSpaces
      .filter(s => s.anxietyReliefScore > 0.6)
      .slice(0, 5);

    const whereYourFriendsAre = scoredSpaces
      .filter(s => s.socialProofScore > 0.5 && (s.friendsInSpace > 0 || s.mutualConnections > 2))
      .slice(0, 5);

    const insiderAccess = scoredSpaces
      .filter(s => s.insiderAccessScore > 0.7)
      .slice(0, 5);

    return respond.success({
      panicRelief,
      whereYourFriendsAre,
      insiderAccess,
      recommendations: scoredSpaces.slice(0, 20),
      meta: {
        totalSpaces: allSpaces.length,
        userConnections: connectionIds.length,
        userFriends: friendIds.length
      }
    });

  } catch (error) {
    logger.error('Error generating space recommendations', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
  }
});

/**
 * Calculate anxiety relief score based on space characteristics
 * Higher scores for spaces that address common student anxieties
 */
function calculateAnxietyReliefScore(space: EnhancedSpace, user: Record<string, unknown>): number {
  let score = 0;
  const category = space.category.value;

  // Study stress relief - academic/study spaces
  if (category === 'academic' || category === 'study-group') {
    score += 0.3;
  }

  // Loneliness relief - active social spaces
  if (category === 'social' || category === 'club') {
    score += 0.2;
  }

  // FOMO relief - trending or popular spaces
  if (space.memberCount > 50) {
    score += 0.2;
  }

  // Major-specific anxiety relief
  if (user.major && space.category.value.toLowerCase().includes((user.major as string).toLowerCase())) {
    score += 0.3;
  }

  return Math.min(score, 1);
}

/**
 * Calculate social proof score based on connections
 */
function calculateSocialProofScore(
  mutualConnections: number,
  friendsInSpace: number,
  totalMembers: number
): number {
  let score = 0;

  // Friends are highest signal
  if (friendsInSpace > 0) {
    score += Math.min(friendsInSpace * 0.2, 0.4);
  }

  // Connections are medium signal
  if (mutualConnections > 0) {
    score += Math.min(mutualConnections * 0.1, 0.3);
  }

  // Popular spaces have social proof
  if (totalMembers > 100) {
    score += 0.2;
  } else if (totalMembers > 50) {
    score += 0.1;
  }

  // Network effect bonus
  const networkRatio = (mutualConnections + friendsInSpace) / Math.max(totalMembers, 1);
  score += Math.min(networkRatio * 0.2, 0.2);

  return Math.min(score, 1);
}

/**
 * Calculate insider access score based on exclusivity
 */
function calculateInsiderAccessScore(space: EnhancedSpace): number {
  let score = 0;

  // Smaller spaces feel more exclusive
  if (space.memberCount < 30) {
    score += 0.3;
  } else if (space.memberCount < 50) {
    score += 0.1;
  }

  // Greek life and certain categories are inherently exclusive
  if (space.category.value === 'social') {
    score += 0.2;
  }

  // Private spaces are exclusive
  if (!space.isPublic) {
    score += 0.4;
  }

  // Settings-based exclusivity
  if (space.settings.requireApproval) {
    score += 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Calculate the join-to-active member conversion rate
 * SPEC.md target: 70% for optimal behavioral change
 */
function calculateJoinToActiveRate(totalMembers: number, activeMembers: number): number {
  const rate = activeMembers / Math.max(totalMembers, 1);
  return Math.max(0, Math.min(1, rate));
}
