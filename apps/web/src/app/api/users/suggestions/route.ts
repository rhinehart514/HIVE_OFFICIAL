/**
 * User Suggestions API - "People you may know"
 *
 * GET /api/users/suggestions
 *
 * Returns suggested users based on:
 * - Shared spaces (highest signal)
 * - Same campus
 * - Mutual connections
 * - Same major/field
 *
 * Each suggestion includes a reason explaining why they're suggested.
 */

import { dbAdmin as db } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../../lib/cache-headers';

interface SuggestionScore {
  userId: string;
  score: number;
  reasons: string[];
  sharedSpaces: string[];
  mutualConnections: number;
  sameMajor: boolean;
  sameCampus: boolean;
}

interface UserProfile {
  id: string;
  handle?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  bio?: string;
  major?: string;
  campusId?: string;
  campusName?: string;
  graduationYear?: number;
}

interface SuggestionResult {
  user: UserProfile;
  reason: string;
  context: {
    sharedSpaces: number;
    mutualConnections: number;
    sameMajor: boolean;
  };
}

const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

  // Get current user's profile for matching
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return respond.error('User not found', 'NOT_FOUND', { status: 404 });
  }
  const currentUser = userDoc.data() as UserProfile;
  const campusId = currentUser.campusId;

  // Get user's existing connections (to exclude from suggestions)
  const [connectionsAsId1, connectionsAsId2] = await Promise.all([
    db.collection('connections')
      .where('profileId1', '==', userId)
      .where('isActive', '==', true)
      .get(),
    db.collection('connections')
      .where('profileId2', '==', userId)
      .where('isActive', '==', true)
      .get(),
  ]);

  const connectedUserIds = new Set<string>([userId]); // Include self
  connectionsAsId1.docs.forEach(doc => {
    const data = doc.data();
    connectedUserIds.add(data.profileId2);
  });
  connectionsAsId2.docs.forEach(doc => {
    const data = doc.data();
    connectedUserIds.add(data.profileId1);
  });

  // Get user's spaces
  const membershipSnapshot = await db.collection('spaceMembers')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const userSpaceIds = membershipSnapshot.docs.map(doc => doc.data().spaceId as string);

  // Score candidates
  const candidateScores = new Map<string, SuggestionScore>();

  // Strategy 1: Users in shared spaces (highest signal)
  if (userSpaceIds.length > 0) {
    // Process spaces in batches of 10 (Firestore 'in' limit)
    for (let i = 0; i < Math.min(userSpaceIds.length, 30); i += 10) {
      const spaceIdBatch = userSpaceIds.slice(i, i + 10);
      if (spaceIdBatch.length === 0) continue;

      const spaceMembersSnapshot = await db.collection('spaceMembers')
        .where('spaceId', 'in', spaceIdBatch)
        .where('status', '==', 'active')
        .limit(200)
        .get();

      for (const doc of spaceMembersSnapshot.docs) {
        const data = doc.data();
        const candidateId = data.userId as string;

        if (connectedUserIds.has(candidateId)) continue;

        const existing = candidateScores.get(candidateId) || {
          userId: candidateId,
          score: 0,
          reasons: [],
          sharedSpaces: [],
          mutualConnections: 0,
          sameMajor: false,
          sameCampus: false,
        };

        existing.sharedSpaces.push(data.spaceId);
        existing.score += 10; // High weight for shared spaces
        candidateScores.set(candidateId, existing);
      }
    }
  }

  // Strategy 2: Same campus users (baseline)
  if (campusId) {
    const campusUsersSnapshot = await db.collection('users')
      .where('campusId', '==', campusId)
      .limit(100)
      .get();

    for (const doc of campusUsersSnapshot.docs) {
      const candidateId = doc.id;
      if (connectedUserIds.has(candidateId)) continue;

      const existing = candidateScores.get(candidateId) || {
        userId: candidateId,
        score: 0,
        reasons: [],
        sharedSpaces: [],
        mutualConnections: 0,
        sameMajor: false,
        sameCampus: false,
      };

      existing.sameCampus = true;
      existing.score += 2; // Lower weight for same campus

      // Bonus for same major
      const candidateData = doc.data();
      if (currentUser.major && candidateData.major === currentUser.major) {
        existing.sameMajor = true;
        existing.score += 5;
      }

      candidateScores.set(candidateId, existing);
    }
  }

  // Strategy 3: Friends of friends (mutual connections)
  const friendIds = Array.from(connectedUserIds).filter(id => id !== userId);
  if (friendIds.length > 0) {
    // Get connections of our connections (limit to prevent explosion)
    for (let i = 0; i < Math.min(friendIds.length, 20); i += 10) {
      const friendBatch = friendIds.slice(i, i + 10);
      if (friendBatch.length === 0) continue;

      const [fofAsId1, fofAsId2] = await Promise.all([
        db.collection('connections')
          .where('profileId1', 'in', friendBatch)
          .where('isActive', '==', true)
          .where('type', '==', 'friend')
          .limit(100)
          .get(),
        db.collection('connections')
          .where('profileId2', 'in', friendBatch)
          .where('isActive', '==', true)
          .where('type', '==', 'friend')
          .limit(100)
          .get(),
      ]);

      const processConnection = (data: FirebaseFirestore.DocumentData, friendId: string) => {
        const candidateId = data.profileId1 === friendId ? data.profileId2 : data.profileId1;
        if (connectedUserIds.has(candidateId)) return;

        const existing = candidateScores.get(candidateId) || {
          userId: candidateId,
          score: 0,
          reasons: [],
          sharedSpaces: [],
          mutualConnections: 0,
          sameMajor: false,
          sameCampus: false,
        };

        existing.mutualConnections += 1;
        existing.score += 8; // High weight for mutual connections
        candidateScores.set(candidateId, existing);
      };

      fofAsId1.docs.forEach(doc => {
        const data = doc.data();
        const friendId = friendBatch.find(id => id === data.profileId1);
        if (friendId) processConnection(data, friendId);
      });

      fofAsId2.docs.forEach(doc => {
        const data = doc.data();
        const friendId = friendBatch.find(id => id === data.profileId2);
        if (friendId) processConnection(data, friendId);
      });
    }
  }

  // Sort by score and take top candidates
  const topCandidates = Array.from(candidateScores.values())
    .filter(c => c.score >= 2) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (topCandidates.length === 0) {
    return respond.success({
      suggestions: [],
      message: 'No suggestions available. Join more spaces to discover people.',
    });
  }

  // Fetch full profiles for top candidates
  const candidateIds = topCandidates.map(c => c.userId);
  const profiles = new Map<string, UserProfile>();

  for (let i = 0; i < candidateIds.length; i += 10) {
    const batch = candidateIds.slice(i, i + 10);
    if (batch.length === 0) continue;

    const profilesSnapshot = await db.collection('users')
      .where('__name__', 'in', batch)
      .get();

    profilesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Skip ghost mode users
      if (data.isGhostMode) return;

      profiles.set(doc.id, {
        id: doc.id,
        handle: data.handle,
        firstName: data.firstName,
        lastName: data.lastName,
        profilePhoto: data.profilePhoto,
        bio: data.bio,
        major: data.major,
        campusId: data.campusId,
        campusName: data.campusName,
        graduationYear: data.graduationYear,
      });
    });
  }

  // Get space names for context
  const allSpaceIds = new Set<string>();
  topCandidates.forEach(c => c.sharedSpaces.forEach(s => allSpaceIds.add(s)));
  const spaceNames = new Map<string, string>();

  const spaceIdArray = Array.from(allSpaceIds);
  for (let i = 0; i < spaceIdArray.length; i += 10) {
    const batch = spaceIdArray.slice(i, i + 10);
    if (batch.length === 0) continue;

    const spacesSnapshot = await db.collection('spaces')
      .where('__name__', 'in', batch)
      .get();

    spacesSnapshot.docs.forEach(doc => {
      spaceNames.set(doc.id, doc.data().name || 'Space');
    });
  }

  // Build response with reasons
  const suggestions: SuggestionResult[] = topCandidates
    .filter(c => profiles.has(c.userId))
    .map(candidate => {
      const profile = profiles.get(candidate.userId)!;

      // Build reason string
      let reason = '';
      if (candidate.sharedSpaces.length > 0) {
        const spaceName = spaceNames.get(candidate.sharedSpaces[0]) || 'a space';
        if (candidate.sharedSpaces.length === 1) {
          reason = `Both in ${spaceName}`;
        } else {
          reason = `${candidate.sharedSpaces.length} shared spaces`;
        }
      } else if (candidate.mutualConnections > 0) {
        reason = `${candidate.mutualConnections} mutual connection${candidate.mutualConnections > 1 ? 's' : ''}`;
      } else if (candidate.sameMajor) {
        reason = `Also studying ${profile.major}`;
      } else if (candidate.sameCampus) {
        reason = 'On your campus';
      }

      return {
        user: profile,
        reason,
        context: {
          sharedSpaces: candidate.sharedSpaces.length,
          mutualConnections: candidate.mutualConnections,
          sameMajor: candidate.sameMajor,
        },
      };
    });

  return respond.success({
    suggestions,
    total: suggestions.length,
  });
});

export const GET = withCache(_GET, 'SHORT');
