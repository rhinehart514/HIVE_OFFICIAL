/**
 * Platform Stats API Route
 *
 * Returns real-time platform statistics for the landing page.
 * Publicly accessible (no auth required).
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';

// Cache stats for 5 minutes to reduce Firestore reads
let statsCache: {
  data: PlatformStats;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PlatformStats {
  activeUsers: number;
  totalSpaces: number;
  totalUsers: number;
  recentActivity: {
    type: 'space_created' | 'user_joined' | 'space_joined';
    handle?: string;
    spaceName?: string;
    timestamp: string;
  } | null;
}

async function fetchStats(): Promise<PlatformStats> {
  try {
    // Fetch all stats in parallel for efficiency
    const [
      spacesSnapshot,
      usersSnapshot,
      recentSpaceSnapshot,
    ] = await Promise.all([
      // Count spaces (only published/live ones)
      dbAdmin
        .collection('spaces')
        .where('status', '==', 'live')
        .count()
        .get(),

      // Count users with completed onboarding
      dbAdmin
        .collection('profiles')
        .where('onboardingCompleted', '==', true)
        .count()
        .get(),

      // Get most recently created space for activity
      dbAdmin
        .collection('spaces')
        .where('status', '==', 'live')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get(),
    ]);

    const totalSpaces = spacesSnapshot.data().count;
    const totalUsers = usersSnapshot.data().count;

    // Get recent activity
    let recentActivity: PlatformStats['recentActivity'] = null;
    if (!recentSpaceSnapshot.empty) {
      const spaceDoc = recentSpaceSnapshot.docs[0];
      const spaceData = spaceDoc.data();
      recentActivity = {
        type: 'space_created',
        spaceName: spaceData.name,
        handle: spaceData.handle || spaceData.slug,
        timestamp: spaceData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }

    // Estimate "active now" based on recent activity
    // In production, this could be based on real-time presence or recent logins
    const activeUsers = Math.max(
      Math.floor(totalUsers * 0.05), // ~5% of users typically "active"
      Math.min(totalUsers, 50) // Minimum of 50 or total users if less
    );

    return {
      activeUsers,
      totalSpaces,
      totalUsers,
      recentActivity,
    };
  } catch (error) {
    logger.error('Failed to fetch platform stats', { error });
    // Return fallback stats on error
    return {
      activeUsers: 0,
      totalSpaces: 0,
      totalUsers: 0,
      recentActivity: null,
    };
  }
}

export async function GET() {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      data: statsCache.data,
      cached: true,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }

  // Fetch fresh stats
  const stats = await fetchStats();

  // Update cache
  statsCache = {
    data: stats,
    timestamp: Date.now(),
  };

  return NextResponse.json({
    success: true,
    data: stats,
    cached: false,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
