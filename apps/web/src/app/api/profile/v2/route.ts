/**
 * Profile V2 API Route
 *
 * @deprecated This endpoint is deprecated. Use /api/profile?include=grid,viewer instead.
 * Sunset date: 2026-03-01
 *
 * This route provides backward compatibility but will be removed.
 */
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { getServerProfileRepository, PrivacyLevel, ProfilePrivacy } from '@hive/core/server';
import { NextResponse } from 'next/server';

// Add deprecation headers to all responses
function addDeprecationHeaders(response: NextResponse): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', 'Sat, 01 Mar 2026 00:00:00 GMT');
  response.headers.set('Link', '</api/profile?include=grid,viewer>; rel="successor-version"');
  response.headers.set('X-Deprecation-Notice', 'Use /api/profile?include=grid,viewer instead');
  return response;
}

type ViewerRelationship = 'self' | 'friend' | 'connection' | 'campus';

const relationshipScore: Record<ViewerRelationship, number> = {
  self: 4,
  friend: 3,
  connection: 2,
  campus: 1,
};

const visibilityRequirement: Record<string, number> = {
  public: 0,
  campus: 1,
  connections: 2,
  friends: 3,
  private: 4,
  ghost: 4,
};

const DEFAULT_GRID = {
  cards: [
    { id: 'spaces_hub', type: 'spaces_hub', size: '2x1' as const, visible: true },
    { id: 'friends_network', type: 'friends_network', size: '2x1' as const, visible: true },
    { id: 'active_now', type: 'active_now', size: '1x1' as const, visible: true },
    { id: 'discovery', type: 'discovery', size: '1x1' as const, visible: true },
  ],
  mobileLayout: [
    { id: 'spaces_hub_mobile', type: 'spaces_hub', size: '2x1' as const, visible: true },
    { id: 'friends_network_mobile', type: 'friends_network', size: '2x1' as const, visible: true },
  ],
};

const GridSchema = z.object({
  cards: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        size: z.enum(['1x1', '1x2', '2x1', '2x2']).default('1x1'),
        position: z.number().optional(),
        visible: z.boolean().optional(),
        customType: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .default(DEFAULT_GRID.cards as typeof DEFAULT_GRID.cards),
  mobileLayout: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        size: z.enum(['1x1', '1x2', '2x1', '2x2']).default('1x1'),
        position: z.number().optional(),
        visible: z.boolean().optional(),
        customType: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .default(DEFAULT_GRID.mobileLayout as typeof DEFAULT_GRID.mobileLayout),
  lastModified: z.union([z.string(), z.number(), z.date()]).optional(),
});

const UpdateSchema = z.object({
  privacy: z.record(z.unknown()).optional(),
  grid: GridSchema.optional(),
});

const formatTimestamp = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    try {
      return (value.toDate() as Date).toISOString();
    } catch (err) {
      logger.warn('Failed to convert Firestore timestamp', { error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  }
  return null;
};

const normalizeGrid = (grid: unknown) => {
  if (!grid) {
    return { ...DEFAULT_GRID, lastModified: new Date().toISOString() };
  }

  const parsed = GridSchema.safeParse(grid);
  if (!parsed.success) {
    logger.warn('Invalid profile grid stored in Firestore; defaulting', { error: parsed.error.message, issues: JSON.stringify(parsed.error.issues) });
    return { ...DEFAULT_GRID, lastModified: new Date().toISOString() };
  }

  const lastModified = parsed.data.lastModified ? formatTimestamp(parsed.data.lastModified) : null;
  return {
    cards: parsed.data.cards,
    mobileLayout: parsed.data.mobileLayout,
    lastModified: lastModified ?? new Date().toISOString(),
  };
};

const normalizeWidgetLevel = (
  widget: string,
  privacyDoc: Record<string, unknown> | undefined,
  defaults: { level: string },
) => {
  const widgets = privacyDoc?.widgets as Record<string, Record<string, unknown>> | undefined;
  const widgetSettings = privacyDoc?.[widget] as Record<string, unknown> | undefined;
  const level = widgets?.[widget]?.level ?? widgetSettings?.level;
  if (typeof level === 'string') return level;

  // Fall back to legacy boolean flags
  switch (widget) {
    case 'activity':
      return privacyDoc?.showActivity === false ? 'private' : 'connections';
    case 'spaces':
      return privacyDoc?.showSpaces === false ? 'private' : 'connections';
    case 'connections':
      return privacyDoc?.showConnections === false ? 'private' : 'connections';
    case 'discovery':
      return 'campus';
    default:
      return defaults.level;
  }
};

const canView = (relationship: ViewerRelationship, level: string | undefined): boolean => {
  if (!level) return true;
  if (level === 'private' || level === 'ghost') {
    return relationship === 'self';
  }

  const viewerScore = relationshipScore[relationship] ?? 0;
  const required = visibilityRequirement[level] ?? 0;
  return viewerScore >= required;
};

const resolveRelationship = (
  isOwnProfile: boolean,
  connectionDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | null,
): ViewerRelationship => {
  if (isOwnProfile) return 'self';
  if (connectionDoc?.exists && connectionDoc.data()?.isFriend) return 'friend';
  if (connectionDoc?.exists) return 'connection';
  return 'campus';
};

/**
 * Maps ViewerRelationship to DDD ProfilePrivacy viewer type
 * Used for profile-level access control with 4-tier privacy
 */
const toDddViewerType = (relationship: ViewerRelationship): 'public' | 'campus' | 'connection' => {
  switch (relationship) {
    case 'self':
      // Self always has access - handled separately
      return 'connection';
    case 'friend':
    case 'connection':
      return 'connection';
    case 'campus':
      return 'campus';
    default:
      return 'campus';
  }
};

/**
 * Maps legacy privacy level strings to DDD PrivacyLevel enum
 */
const toDddPrivacyLevel = (level: string | undefined): PrivacyLevel => {
  switch (level) {
    case 'public':
      return PrivacyLevel.PUBLIC;
    case 'campus':
    case 'campus_only':
      return PrivacyLevel.CAMPUS_ONLY;
    case 'connections':
    case 'connections_only':
    case 'friends':
      return PrivacyLevel.CONNECTIONS_ONLY;
    case 'private':
    case 'ghost':
      return PrivacyLevel.PRIVATE;
    default:
      return PrivacyLevel.CAMPUS_ONLY;
  }
};

export const GET = withAuthAndErrors(async (request, _ctx, respond) => {
  try {
    const viewerId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const handle = searchParams.get('handle');

    let targetUserId = id || null;

    if (!targetUserId && handle) {
      const byHandle = await dbAdmin
        .collection('users')
        .where('handle', '==', handle)
        .where('campusId', '==', campusId)
        .limit(1)
        .get();

      if (byHandle.empty) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }
      targetUserId = byHandle.docs[0].id;
    }

    if (!targetUserId) targetUserId = viewerId;

    const userRef = dbAdmin.collection('users').doc(targetUserId);
    const isOwnProfile = targetUserId === viewerId;

    // Try DDD repository first for profile data
    const profileRepository = getServerProfileRepository();
    const profileResult = await profileRepository.findById(targetUserId);

    // Get connection status for viewer relationship
    const connectionSnap = isOwnProfile
      ? null
      : await userRef.collection('connections').doc(viewerId).get().catch(() => null);

    const viewerRelationship = resolveRelationship(isOwnProfile, connectionSnap);
    const dddViewerType = toDddViewerType(viewerRelationship);

    // If DDD profile found, use it for access control
    let userData: Record<string, unknown> = {};
    let profilePrivacy: ProfilePrivacy | null = null;

    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();

      // Use DDD 4-tier privacy for profile-level access control
      profilePrivacy = profile.privacy;

      // Check campus isolation
      if (profile.campusId.id !== campusId) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      // Check profile-level access using DDD privacy
      if (!isOwnProfile && !profilePrivacy.canViewProfile(dddViewerType)) {
        logger.info('Profile access denied by DDD privacy', {
          targetUserId,
          viewerId,
          viewerType: dddViewerType,
          privacyLevel: profilePrivacy.level,
        });
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      // Extract user data from DDD profile for compatibility
      userData = {
        handle: profile.handle.value,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: profile.displayName,
        bio: profile.bio || '',
        major: profile.major || '',
        graduationYear: profile.graduationYear,
        interests: profile.interests,
        avatarUrl: profile.personalInfo.profilePhoto,
        profileImageUrl: profile.personalInfo.profilePhoto,
        pronouns: profile.personalInfo.dorm ? undefined : undefined, // Not in DDD yet
        badges: profile.badges,
        campusId: profile.campusId.id,
        connectionCount: profile.connectionCount,
        // Preserve privacy settings in legacy format for widget-level checks
        privacySettings: {
          level: profilePrivacy.level,
          showEmail: profilePrivacy.showEmail,
          showPhone: profilePrivacy.showPhone,
          showDorm: profilePrivacy.showDorm,
          showSchedule: profilePrivacy.showSchedule,
          showActivity: profilePrivacy.showActivity,
        },
      };

      logger.debug('Profile loaded via DDD repository', {
        targetUserId,
        handle: profile.handle.value,
        privacyLevel: profilePrivacy.level,
      });
    } else {
      // Fallback to direct Firestore if DDD fails
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      userData = userSnap.data() || {};
      if (userData.campusId && userData.campusId !== campusId) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      logger.debug('Profile loaded via Firestore fallback', { targetUserId });
    }

    // Fetch additional data in parallel
    const [privacySnap, presenceSnap] = await Promise.all([
      dbAdmin.collection('privacySettings').doc(targetUserId).get().catch(() => null),
      dbAdmin.collection('presence').doc(targetUserId).get().catch(() => null),
    ]);

    // Merge privacy settings from all sources for widget-level checks
    const privacyDoc = {
      ...(userData.privacySettings || {}),
      ...(userData.privacy || {}),
      ...(privacySnap?.exists ? privacySnap.data() : {}),
    } as Record<string, unknown>;

    // Determine profile visibility level - prefer DDD privacy if available
    let profileVisibilityLevel: string;
    if (profilePrivacy) {
      // Map DDD PrivacyLevel to legacy string format
      switch (profilePrivacy.level) {
        case PrivacyLevel.PUBLIC:
          profileVisibilityLevel = 'public';
          break;
        case PrivacyLevel.CAMPUS_ONLY:
          profileVisibilityLevel = 'campus';
          break;
        case PrivacyLevel.CONNECTIONS_ONLY:
          profileVisibilityLevel = 'connections';
          break;
        case PrivacyLevel.PRIVATE:
          profileVisibilityLevel = 'private';
          break;
        default:
          profileVisibilityLevel = 'campus';
      }
    } else {
      // Legacy path
      const profileSettings = privacyDoc?.profile as Record<string, unknown> | undefined;
      profileVisibilityLevel =
        typeof profileSettings?.level === 'string'
          ? profileSettings.level
          : privacyDoc?.isPublic === false
            ? 'connections'
            : 'public';

      // Apply legacy access check if DDD didn't handle it
      if (!canView(viewerRelationship, profileVisibilityLevel)) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }
    }

    const gridLayout = normalizeGrid(userData.profileGrid);

    const widgetLevels = {
      activity: normalizeWidgetLevel('activity', privacyDoc, { level: 'connections' }),
      spaces: normalizeWidgetLevel('spaces', privacyDoc, { level: 'connections' }),
      connections: normalizeWidgetLevel('connections', privacyDoc, { level: 'connections' }),
      discovery: normalizeWidgetLevel('discovery', privacyDoc, { level: 'campus' }),
    };

    const [spacesSnap, connectionsListSnap, suggestionSnap] = await Promise.all([
      dbAdmin
        .collection('spaces')
        .where('campusId', '==', campusId)
        .where('members', 'array-contains', targetUserId)
        .limit(8)
        .get()
        .catch(() => ({ empty: true, docs: [] } as unknown as FirebaseFirestore.QuerySnapshot)),
      userRef
        .collection('connections')
        .orderBy('connectedAt', 'desc')
        .limit(8)
        .get()
        .catch(() => ({ empty: true, docs: [] } as unknown as FirebaseFirestore.QuerySnapshot)),
      dbAdmin
        .collection('spaces')
        .where('campusId', '==', campusId)
        .orderBy('memberCount', 'desc')
        .limit(6)
        .get()
        .catch(() => ({ empty: true, docs: [] } as unknown as FirebaseFirestore.QuerySnapshot)),
    ]);

    const spaces = spacesSnap.docs.map((doc) => {
      const space = doc.data();
      const memberIds: string[] = Array.isArray(space.members) ? space.members : [];
      const leaderIds: string[] = Array.isArray(space.leaders) ? space.leaders : [];
      return {
        id: doc.id,
        name: space.name ?? 'Campus Space',
        role: leaderIds.includes(targetUserId)
          ? 'Lead'
          : memberIds.includes(targetUserId)
            ? 'Member'
            : 'Participant',
        memberCount: space.memberCount ?? memberIds.length ?? 0,
        lastActivityAt: formatTimestamp(space.lastActivityAt) ?? new Date().toISOString(),
        headline: space.tagline ?? space.subtitle ?? '',
      };
    });

    const connections = connectionsListSnap.docs.map((doc) => {
      const connection = doc.data();
      return {
        id: doc.id,
        name: connection.displayName || connection.fullName || 'Student',
        avatarUrl: connection.avatarUrl || null,
        sharedSpaces: Array.isArray(connection.sharedSpaces) ? connection.sharedSpaces : [],
        isFriend: connection.isFriend === true,
        connectionStrength: connection.connectionStrength ?? connection.strength ?? 0,
        mutualConnections: connection.mutualConnections ?? 0,
        lastInteractionAt: formatTimestamp(connection.lastInteraction),
      };
    });

    const suggestionCandidates = suggestionSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
      .filter((space) => {
        if (typeof space !== 'object' || space === null) return false;
        if (!('members' in space)) return true;
        const members = space.members;
        return !Array.isArray(members) || !members.includes(targetUserId);
      })
      .slice(0, 3)
      .map((space) => ({
        id: typeof space === 'object' && space !== null && 'id' in space ? String(space.id) : '',
        name: typeof space === 'object' && space !== null && 'name' in space && typeof space.name === 'string' ? space.name : 'Campus Space',
        reason: typeof space === 'object' && space !== null && 'matchReason' in space && typeof space.matchReason === 'string' ? space.matchReason : 'Popular on campus',
        category: typeof space === 'object' && space !== null && 'category' in space && typeof space.category === 'string' ? space.category : 'space',
      }));

    const friendCount = connections.filter((c) => c.isFriend).length;

    // Cast nested stats object for safe property access
    const userStats = (userData.stats || {}) as Record<string, unknown>;

    const stats = {
      spacesJoined: spaces.length,
      connections: (userData.connectionCount ?? connections.length) as number,
      friends: (userData.friendCount ?? friendCount) as number,
      toolsCreated: (userData.toolsCreated ?? userStats.toolsCreated ?? 0) as number,
      toolsUsed: (userData.toolsUsed ?? userStats.toolsUsed ?? spaces.filter((space) => {
        const spaceData = space as Record<string, unknown>;
        return Array.isArray(spaceData.tools) && spaceData.tools.length > 0;
      }).length ?? 0) as number,
      activeRituals: (userData.activeRituals ?? userStats.activeRituals ?? 0) as number,
      reputation: (userData.reputation ?? userStats.reputation ?? 68) as number,
      currentStreak: (userData.currentStreak ?? userStats.currentStreak ?? 0) as number,
    };

    const presenceStatus = presenceSnap?.exists ? presenceSnap.data() : null;

    const profilePayload = {
      id: targetUserId,
      handle: userData.handle || '',
      fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Student',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      campusId: userData.campusId || campusId,
      avatarUrl: userData.avatarUrl || userData.profileImageUrl || null,
      pronouns: userData.pronouns || null,
      bio: userData.bio || '',
      major: userData.major || '',
      graduationYear: userData.graduationYear || null,
      interests: Array.isArray(userData.interests) ? userData.interests : [],
      badges: Array.isArray(userData.badges) ? userData.badges : [],
      presence: {
        status: presenceStatus?.status || 'offline',
        lastSeen: formatTimestamp(presenceStatus?.lastSeen),
        isGhostMode: presenceStatus?.isGhostMode ?? privacyDoc?.ghostMode ?? false,
      },
      stats,
    };

    const viewerCanViewSpaces = canView(viewerRelationship, widgetLevels.spaces);
    const viewerCanViewConnections = canView(viewerRelationship, widgetLevels.connections);
    const viewerCanViewActivity = canView(viewerRelationship, widgetLevels.activity);
    const viewerCanViewDiscovery = canView(viewerRelationship, widgetLevels.discovery);

    const activities = viewerCanViewActivity
      ? spaces.slice(0, 4).map((space) => ({
          id: `${space.id}-activity`,
          type: 'space',
          spaceId: space.id,
          spaceName: space.name,
          action: 'active',
          timestamp: space.lastActivityAt,
        }))
      : [];

    return respond.success({
      profile: profilePayload,
      grid: gridLayout,
      stats,
      spaces: viewerCanViewSpaces ? spaces : [],
      connections: viewerCanViewConnections ? connections : [],
      activities,
      intelligence: viewerCanViewDiscovery
        ? {
            suggestions: suggestionCandidates,
          }
        : { suggestions: [] },
      viewer: {
        relationship: viewerRelationship,
        isOwnProfile,
        isConnection: viewerRelationship === 'connection' || viewerRelationship === 'friend',
        isFriend: viewerRelationship === 'friend',
      },
      privacy: {
        profileLevel: profileVisibilityLevel,
        widgets: widgetLevels,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch profile v2', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to fetch profile', 'INTERNAL_ERROR', { status: 500 });
  }
});

export const PATCH = withAuthAndErrors(async (request, _ctx, respond) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const payload = await request.json();
    const parsed = UpdateSchema.parse(payload);

    const updates: Array<Promise<unknown>> = [];
    let fieldsUpdated: string[] = [];
    let usedDddPath = false;

    // Try DDD path for privacy updates
    if (parsed.privacy) {
      const profileRepository = getServerProfileRepository();
      const profileResult = await profileRepository.findById(userId);

      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();
        const currentPrivacy = profile.privacy;
        const privacyUpdate = parsed.privacy as Record<string, unknown>;

        // Map incoming privacy fields to DDD ProfilePrivacy
        const newLevel = privacyUpdate.level
          ? toDddPrivacyLevel(privacyUpdate.level as string)
          : currentPrivacy.level;

        const newPrivacyResult = ProfilePrivacy.create({
          level: newLevel,
          showEmail: typeof privacyUpdate.showEmail === 'boolean'
            ? privacyUpdate.showEmail
            : currentPrivacy.showEmail,
          showPhone: typeof privacyUpdate.showPhone === 'boolean'
            ? privacyUpdate.showPhone
            : currentPrivacy.showPhone,
          showDorm: typeof privacyUpdate.showDorm === 'boolean'
            ? privacyUpdate.showDorm
            : currentPrivacy.showDorm,
          showSchedule: typeof privacyUpdate.showSchedule === 'boolean'
            ? privacyUpdate.showSchedule
            : currentPrivacy.showSchedule,
          showActivity: typeof privacyUpdate.showActivity === 'boolean'
            ? privacyUpdate.showActivity
            : currentPrivacy.showActivity,
        });

        if (newPrivacyResult.isSuccess) {
          profile.updatePrivacy(newPrivacyResult.getValue());

          const saveResult = await profileRepository.save(profile);
          if (saveResult.isSuccess) {
            fieldsUpdated = fieldsUpdated.concat(Object.keys(parsed.privacy));
            usedDddPath = true;
            logger.info('Privacy updated via DDD', { userId, fields: Object.keys(parsed.privacy) });
          } else {
            logger.warn('DDD save failed, falling back to direct update', {
              userId,
              error: saveResult.error,
            });
          }
        }
      }

      // Fallback to direct Firestore if DDD didn't handle it
      if (!usedDddPath) {
        const privacyRef = dbAdmin.collection('privacySettings').doc(userId);
        const existing = await privacyRef.get();
        const now = new Date().toISOString();
        const merged: Record<string, unknown> = {
          ...(existing.exists ? existing.data() : {}),
          ...parsed.privacy,
          userId,
          updatedAt: now,
          campusId: existing.data()?.campusId || campusId,
        };
        if (!existing.exists) merged.createdAt = now;

        updates.push(privacyRef.set(merged, { merge: true }));
        fieldsUpdated = fieldsUpdated.concat(Object.keys(parsed.privacy));
      }
    }

    // Grid updates stay in Firestore (not in DDD domain model)
    if (parsed.grid) {
      const normalized = normalizeGrid(parsed.grid);
      updates.push(
        dbAdmin
          .collection('users')
          .doc(userId)
          .set({ profileGrid: normalized }, { merge: true }),
      );
      fieldsUpdated.push('grid');
    }

    if (updates.length === 0) {
      return respond.success({ message: 'No changes applied', fieldsUpdated: [] });
    }

    await Promise.all(updates);

    return respond.success({ fieldsUpdated, message: 'Profile updated' });
  } catch (error) {
    logger.error('Failed to update profile v2', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to update profile', 'INTERNAL_ERROR', { status: 500 });
  }
});
