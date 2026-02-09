import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { deriveCampusFromEmail } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// =============================================================================
// Inlined Feature Flags (previously from @/lib/feature-flags)
// =============================================================================

export interface UserFeatureContext {
  userId: string;
  userRole: string;
  schoolId?: string;
  spaceIds?: string[];
  metadata?: Record<string, unknown>;
}

export const HIVE_FEATURE_FLAGS = {
  SPACES_V2: 'spaces_v2',
  HIVELAB: 'hivelab',
  CHAT_BOARD: 'chat_board',
  GHOST_MODE: 'ghost_mode',
  REALTIME_FEED: 'realtime_feed',
  AI_MODERATION: 'ai_moderation',
  CALENDAR_SYNC: 'calendar_sync',
  RITUALS: 'rituals_v1',
  TOOL_MARKETPLACE: 'tool_marketplace',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  // Social features
  ENABLE_DMS: 'enable_dms',
  ENABLE_CONNECTIONS: 'enable_connections',
} as const;

// Soft-launch overrides: intentionally hidden until core collaboration is stable.
const SOFT_LAUNCH_DISABLED_FLAGS = new Set<string>([
  HIVE_FEATURE_FLAGS.ENABLE_DMS,
  HIVE_FEATURE_FLAGS.ENABLE_CONNECTIONS,
  HIVE_FEATURE_FLAGS.RITUALS,
]);

// Simple feature flag service (inlined)
const featureFlagService = {
  async getUserFeatureFlags(
    flagIds: string[],
    context: UserFeatureContext
  ): Promise<Record<string, FlagResult>> {
    const results: Record<string, FlagResult> = {};

    for (const flagId of flagIds) {
      try {
        const flagDoc = await dbAdmin.collection('featureFlags').doc(flagId).get();
        if (flagDoc.exists) {
          const data = flagDoc.data();
          const enabled = evaluateFlag(data, context);
          results[flagId] = {
            enabled,
            config: data?.config,
            variant: data?.variant || 'default',
          };
        } else {
          // Default to disabled for unknown flags
          results[flagId] = { enabled: false };
        }
      } catch (error) {
        logger.error('Error evaluating feature flag', { flagId, error });
        results[flagId] = { enabled: false };
      }
    }

    return results;
  },

  async getCategoryFeatureFlags(
    category: string,
    context: UserFeatureContext
  ): Promise<Record<string, FlagResult>> {
    try {
      const flagsSnapshot = await dbAdmin
        .collection('featureFlags')
        .where('category', '==', category)
        .get();

      const results: Record<string, FlagResult> = {};
      for (const doc of flagsSnapshot.docs) {
        const data = doc.data();
        const enabled = evaluateFlag(data, context);
        results[doc.id] = {
          enabled,
          config: data?.config,
          variant: data?.variant || 'default',
        };
      }
      return results;
    } catch (error) {
      logger.error('Error fetching category flags', { category, error });
      return {};
    }
  },
};

// Evaluate if a flag is enabled for a given context
function evaluateFlag(
  flagData: Record<string, unknown> | undefined,
  context: UserFeatureContext
): boolean {
  if (!flagData) return false;

  // Check if globally enabled
  if (flagData.enabled === true) return true;
  if (flagData.enabled === false) return false;

  // Check rollout type
  const rollout = flagData.rollout as Record<string, unknown> | undefined;
  if (!rollout) return false;

  switch (rollout.type) {
    case 'all':
      return true;
    case 'none':
      return false;
    case 'percentage': {
      const percentage = (rollout.percentage as number) || 0;
      // Use consistent hashing for user ID
      const hash = hashString(context.userId);
      return (hash % 100) < percentage;
    }
    case 'users': {
      const allowedUsers = (rollout.users as string[]) || [];
      return allowedUsers.includes(context.userId);
    }
    case 'schools': {
      const allowedSchools = (rollout.schools as string[]) || [];
      return context.schoolId ? allowedSchools.includes(context.schoolId) : false;
    }
    case 'roles': {
      const allowedRoles = (rollout.roles as string[]) || [];
      return allowedRoles.includes(context.userRole);
    }
    default:
      return false;
  }
}

// Simple string hash for percentage rollouts
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Type for feature flag results
interface FlagResult {
  enabled: boolean;
  config?: Record<string, unknown>;
  variant?: string;
}

function applySoftLaunchOverrides(results: Record<string, FlagResult>): Record<string, FlagResult> {
  for (const flagId of SOFT_LAUNCH_DISABLED_FLAGS) {
    if (results[flagId]) {
      results[flagId] = {
        ...results[flagId],
        enabled: false,
        variant: 'soft_launch_disabled',
      };
    }
  }

  return results;
}

/**
 * User Feature Flags API
 * Allows users to check which features are enabled for them
 */

// GET - Get feature flags for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error('Unauthorized', 'UNAUTHORIZED'), 
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const { searchParams } = new URL(request.url);
    const flagIds = searchParams.get('flags')?.split(',') || [];
    const category = searchParams.get('category');
    const includeConfig = searchParams.get('includeConfig') === 'true';

    // Campus is optional in non-campus mode.
    const campusId = user.email ? deriveCampusFromEmail(user.email) : undefined;

    // Build user context
    const userContext = await buildUserContext(user.uid, campusId);

    let results: Record<string, FlagResult> = {};

    if (flagIds.length > 0) {
      // Get specific flags
      results = await featureFlagService.getUserFeatureFlags(flagIds, userContext) as Record<string, FlagResult>;
    } else if (category) {
      // Get flags by category
      results = await featureFlagService.getCategoryFeatureFlags(
        category as 'core' | 'experimental' | 'infrastructure' | 'ui_ux' | 'tools' | 'spaces' | 'admin',
        userContext
      ) as Record<string, FlagResult>;
    } else {
      // Get all predefined HIVE flags
      const allHiveFlagIds = Object.values(HIVE_FEATURE_FLAGS);
      results = await featureFlagService.getUserFeatureFlags(allHiveFlagIds, userContext) as Record<string, FlagResult>;
    }
    results = applySoftLaunchOverrides(results);

    // Remove config if not requested (for security)
    if (!includeConfig) {
      Object.keys(results).forEach(flagId => {
        if (results[flagId]?.config) {
          delete results[flagId].config;
        }
      });
    }

    return NextResponse.json({
      success: true,
      flags: results,
      userContext: {
        userId: userContext.userId,
        userRole: userContext.userRole,
        schoolId: userContext.schoolId,
        spaceCount: userContext.spaceIds?.length || 0
      },
      evaluatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error(
      `Error getting user feature flags at /api/feature-flags`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      ApiResponseHelper.error('Failed to get feature flags', 'INTERNAL_ERROR'), 
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST - Check multiple feature flags with custom context
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error('Unauthorized', 'UNAUTHORIZED'), 
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { flagIds, customContext = {} } = body;

    if (!flagIds || !Array.isArray(flagIds)) {
      return NextResponse.json(
        ApiResponseHelper.error('Flag IDs array is required', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Campus is optional in non-campus mode.
    const campusId = user.email ? deriveCampusFromEmail(user.email) : undefined;

    // Build user context with custom overrides
    const baseUserContext = await buildUserContext(user.uid, campusId);
    const userContext: UserFeatureContext = {
      ...baseUserContext,
      ...customContext,
      userId: user.uid // Always keep the real user ID
    };

    const results = applySoftLaunchOverrides(
      await featureFlagService.getUserFeatureFlags(flagIds, userContext)
    );

    return NextResponse.json({
      success: true,
      flags: results,
      userContext: {
        userId: userContext.userId,
        userRole: userContext.userRole,
        schoolId: userContext.schoolId,
        spaceCount: userContext.spaceIds?.length || 0
      },
      evaluatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error(
      `Error checking feature flags at /api/feature-flags`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      ApiResponseHelper.error('Failed to check feature flags', 'INTERNAL_ERROR'), 
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

// Helper function to build user context from database
async function buildUserContext(userId: string, campusId?: string): Promise<UserFeatureContext> {
  try {
    // Get user profile
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Get user's spaces
    let membershipsQuery = dbAdmin.collection('spaceMembers')
      .where('userId', '==', userId)
      .where('status', '==', 'active');

    if (campusId) {
      membershipsQuery = membershipsQuery.where('campusId', '==', campusId);
    }
    
    const membershipsSnapshot = await membershipsQuery.get();
    const spaceIds = membershipsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().spaceId);

    // Determine user role (highest role across all spaces)
    const roles = membershipsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().role || 'member');
    const roleHierarchy = ['member', 'builder', 'moderator', 'admin'];
    const highestRole = roles.reduce((highest: string, current: string) => {
      const currentIndex = roleHierarchy.indexOf(current);
      const highestIndex = roleHierarchy.indexOf(highest);
      return currentIndex > highestIndex ? current : highest;
    }, 'member');

    return {
      userId,
      userRole: highestRole,
      schoolId: userData?.school || userData?.schoolId,
      spaceIds,
      metadata: {
        classYear: userData?.classYear,
        major: userData?.major,
        createdAt: userData?.createdAt,
        lastActiveAt: userData?.lastActiveAt,
        builderStatus: userData?.builderRequestStatus
      }
    };
  } catch (error) {
    logger.error('Error building user context', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
    
    // Return minimal context on error
    return {
      userId,
      userRole: 'member',
      spaceIds: []
    };
  }
}

// Utility route to get available feature flag categories and descriptions
export async function OPTIONS(_request: NextRequest) {
  try {
    const categories = [
      {
        id: 'core',
        name: 'Core Features',
        description: 'Essential platform functionality'
      },
      {
        id: 'experimental',
        name: 'Experimental Features',
        description: 'New features in testing'
      },
      {
        id: 'infrastructure',
        name: 'Infrastructure',
        description: 'Backend and performance features'
      },
      {
        id: 'ui_ux',
        name: 'UI/UX',
        description: 'User interface and experience enhancements'
      },
      {
        id: 'tools',
        name: 'Tools',
        description: 'Tool-related functionality'
      },
      {
        id: 'spaces',
        name: 'Spaces',
        description: 'Space and community features'
      },
      {
        id: 'admin',
        name: 'Admin',
        description: 'Administrative features'
      }
    ];

    const predefinedFlags = Object.entries(HIVE_FEATURE_FLAGS).map(([name, id]) => ({
      id,
      name: name.toLowerCase().replace(/_/g, ' '),
      constantName: name
    }));

    return NextResponse.json({
      success: true,
      categories,
      predefinedFlags,
      rolloutTypes: [
        {
          type: 'all',
          description: 'Enable for all users'
        },
        {
          type: 'percentage',
          description: 'Enable for a percentage of users'
        },
        {
          type: 'users',
          description: 'Enable for specific users'
        },
        {
          type: 'schools',
          description: 'Enable for specific schools'
        },
        {
          type: 'ab_test',
          description: 'A/B test with multiple groups'
        }
      ]
    });
  } catch (error) {
    logger.error(
      `Error getting feature flag metadata at /api/feature-flags`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      ApiResponseHelper.error('Failed to get metadata', 'INTERNAL_ERROR'), 
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
