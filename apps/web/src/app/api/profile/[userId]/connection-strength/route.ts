import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';

interface RouteParams {
  params: { userId: string };
}

/**
 * Weights for connection strength calculation
 */
const WEIGHTS = {
  interactions: 0.25,      // 25%
  sharedSpaces: 0.20,      // 20%
  sharedInterests: 0.15,   // 15%
  messages: 0.20,          // 20%
  connectionAge: 0.10,     // 10%
  recency: 0.05,           // 5%
  mutualConnections: 0.05  // 5%
};

/**
 * Get tier from score
 */
function getTier(score: number): string {
  if (score >= 91) return 'best_friend';
  if (score >= 76) return 'close_friend';
  if (score >= 51) return 'friend';
  if (score >= 26) return 'familiar';
  return 'acquaintance';
}

/**
 * GET /api/profile/[userId]/connection-strength
 * Calculate connection strength between current user and target user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.userId;
    const currentUserId = session.userId;

    // Can't calculate strength with yourself
    if (targetUserId === currentUserId) {
      return NextResponse.json({
        success: true,
        isSelf: true,
        score: 100,
        tier: 'self',
        factors: null,
      });
    }

    // Get the connection between users
    const [id1, id2] = [currentUserId, targetUserId].sort();
    const connectionId = `conn_${id1}_${id2}`;
    const connectionDoc = await db.collection('connections').doc(connectionId).get();

    // No connection exists
    if (!connectionDoc.exists) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        score: 0,
        tier: 'none',
        factors: null,
      });
    }

    const connectionData = connectionDoc.data();

    // Only calculate for active connections
    if (!connectionData?.isActive || connectionData.type === 'blocked') {
      return NextResponse.json({
        success: true,
        isConnected: false,
        score: 0,
        tier: 'none',
        factors: null,
      });
    }

    // Gather factors for calculation
    const factors = await calculateConnectionFactors(currentUserId, targetUserId, connectionData);

    // Calculate score using weighted factors
    const score = calculateScore(factors);
    const tier = getTier(score);

    // Optionally update the connection document with the calculated strength
    await db.collection('connections').doc(connectionId).update({
      strength: score,
      strengthTier: tier,
      strengthCalculatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      isConnected: true,
      connectionType: connectionData.type,
      score,
      tier,
      factors,
      tierLabel: getTierLabel(tier),
    });
  } catch (error) {
    console.error('Error calculating connection strength:', error);
    return NextResponse.json(
      { error: 'Failed to calculate connection strength' },
      { status: 500 }
    );
  }
}

/**
 * Calculate all factors for connection strength
 */
async function calculateConnectionFactors(
  userId1: string,
  userId2: string,
  connectionData: FirebaseFirestore.DocumentData
) {
  const now = new Date();

  // Get connection age
  const createdAt = connectionData.createdAt?.toDate?.() || now;
  const daysSinceConnection = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get recent interaction days
  const lastInteraction = connectionData.lastInteractionAt?.toDate?.() || createdAt;
  const recentInteractionDays = Math.floor(
    (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get interaction count from connection data
  const interactionCount = connectionData.interactionCount || 0;

  // Get shared spaces count
  let sharedSpacesCount = connectionData.mutualSpaces?.length || 0;
  if (sharedSpacesCount === 0) {
    // Calculate if not cached
    sharedSpacesCount = await getSharedSpacesCount(userId1, userId2);
  }

  // Get shared interests count
  const sharedInterestsCount = await getSharedInterestsCount(userId1, userId2);

  // Get message count between users
  const messageCount = await getMessageCount(userId1, userId2);

  // Get mutual connections count
  const mutualConnectionsCount = await getMutualConnectionsCount(userId1, userId2);

  return {
    interactionCount,
    sharedSpacesCount,
    sharedInterestsCount,
    messageCount,
    daysSinceConnection,
    recentInteractionDays,
    mutualConnectionsCount,
  };
}

/**
 * Calculate score from factors
 */
function calculateScore(factors: {
  interactionCount: number;
  sharedSpacesCount: number;
  sharedInterestsCount: number;
  messageCount: number;
  daysSinceConnection: number;
  recentInteractionDays: number;
  mutualConnectionsCount: number;
}): number {
  // Normalize each factor to 0-100
  const interactionScore = Math.min(factors.interactionCount / 50, 1) * 100;
  const spacesScore = Math.min(factors.sharedSpacesCount / 5, 1) * 100;
  const interestsScore = Math.min(factors.sharedInterestsCount / 5, 1) * 100;
  const messageScore = Math.min(factors.messageCount / 100, 1) * 100;

  // Connection age: peaks at 180 days, then plateaus
  const ageScore = Math.min(factors.daysSinceConnection / 180, 1) * 100;

  // Recency: higher if interacted recently (inverse decay)
  const recencyScore = factors.recentInteractionDays <= 7
    ? 100
    : Math.max(0, 100 - (factors.recentInteractionDays - 7) * 2);

  // Mutual connections
  const mutualScore = Math.min(factors.mutualConnectionsCount / 10, 1) * 100;

  // Weighted sum
  const totalScore =
    interactionScore * WEIGHTS.interactions +
    spacesScore * WEIGHTS.sharedSpaces +
    interestsScore * WEIGHTS.sharedInterests +
    messageScore * WEIGHTS.messages +
    ageScore * WEIGHTS.connectionAge +
    recencyScore * WEIGHTS.recency +
    mutualScore * WEIGHTS.mutualConnections;

  return Math.round(Math.min(Math.max(totalScore, 0), 100));
}

/**
 * Get shared spaces count between two users
 */
async function getSharedSpacesCount(userId1: string, userId2: string): Promise<number> {
  try {
    // Get spaces for user 1
    const user1SpacesSnapshot = await db.collection('spaceMembers')
      .where('userId', '==', userId1)
      .where('isActive', '==', true)
      .get();

    const user1SpaceIds = new Set(user1SpacesSnapshot.docs.map(d => d.data().spaceId));

    // Get spaces for user 2
    const user2SpacesSnapshot = await db.collection('spaceMembers')
      .where('userId', '==', userId2)
      .where('isActive', '==', true)
      .get();

    // Count intersection
    let shared = 0;
    user2SpacesSnapshot.docs.forEach(doc => {
      if (user1SpaceIds.has(doc.data().spaceId)) {
        shared++;
      }
    });

    return shared;
  } catch {
    return 0;
  }
}

/**
 * Get shared interests count between two users
 */
async function getSharedInterestsCount(userId1: string, userId2: string): Promise<number> {
  try {
    const [user1Doc, user2Doc] = await Promise.all([
      db.collection('users').doc(userId1).get(),
      db.collection('users').doc(userId2).get(),
    ]);

    const user1Interests = user1Doc.data()?.interests || [];
    const user2Interests = new Set(user2Doc.data()?.interests || []);

    return user1Interests.filter((i: string) => user2Interests.has(i)).length;
  } catch {
    return 0;
  }
}

/**
 * Get message count between two users
 */
async function getMessageCount(userId1: string, userId2: string): Promise<number> {
  try {
    // Check DM conversations
    const [chatId1, chatId2] = [`dm_${userId1}_${userId2}`, `dm_${userId2}_${userId1}`].sort();
    const chatDoc = await db.collection('chats').doc(chatId1).get();

    if (chatDoc.exists) {
      return chatDoc.data()?.messageCount || 0;
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Get mutual connections count
 */
async function getMutualConnectionsCount(userId1: string, userId2: string): Promise<number> {
  try {
    // Get friends of user 1
    const user1Friends = new Set<string>();

    const [conn1a, conn1b] = await Promise.all([
      db.collection('connections')
        .where('profileId1', '==', userId1)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
      db.collection('connections')
        .where('profileId2', '==', userId1)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
    ]);

    [...conn1a.docs, ...conn1b.docs].forEach(doc => {
      const data = doc.data();
      const friendId = data.profileId1 === userId1 ? data.profileId2 : data.profileId1;
      user1Friends.add(friendId);
    });

    // Get friends of user 2
    const [conn2a, conn2b] = await Promise.all([
      db.collection('connections')
        .where('profileId1', '==', userId2)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
      db.collection('connections')
        .where('profileId2', '==', userId2)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
    ]);

    // Count intersection
    let mutual = 0;
    [...conn2a.docs, ...conn2b.docs].forEach(doc => {
      const data = doc.data();
      const friendId = data.profileId1 === userId2 ? data.profileId2 : data.profileId1;
      if (user1Friends.has(friendId)) {
        mutual++;
      }
    });

    return mutual;
  } catch {
    return 0;
  }
}

/**
 * Get display label for tier
 */
function getTierLabel(tier: string): string {
  switch (tier) {
    case 'best_friend': return 'Best Friend';
    case 'close_friend': return 'Close Friend';
    case 'friend': return 'Friend';
    case 'familiar': return 'Familiar';
    case 'acquaintance': return 'Acquaintance';
    default: return 'None';
  }
}
