/**
 * Space Health Utilities
 *
 * Pure functions for calculating space health levels and growth trends.
 * Split from SpaceHealthBadge.tsx for modularity.
 */

// ============================================
// TYPES
// ============================================

export type SpaceHealthLevel = 'active' | 'moderate' | 'quiet' | 'dormant';

export interface SpaceHealthMetrics {
  /** Last activity timestamp */
  lastActivityAt?: string | Date | null;
  /** Currently online users */
  onlineCount?: number;
  /** Messages in last 24 hours */
  recentMessageCount?: number;
  /** Member count (for growth context) */
  memberCount?: number;
  /** New members in last 7 days (for growth trend) */
  newMembers7d?: number;
}

// ============================================
// HEALTH CALCULATION
// ============================================

/**
 * Calculate health level from space metrics
 */
export function getSpaceHealthLevel(metrics: SpaceHealthMetrics): SpaceHealthLevel {
  const { lastActivityAt, onlineCount = 0, recentMessageCount = 0 } = metrics;

  if (onlineCount > 0) return 'active';
  if (recentMessageCount >= 10) return 'active';

  if (lastActivityAt) {
    const lastActive = typeof lastActivityAt === 'string'
      ? new Date(lastActivityAt)
      : lastActivityAt;
    const now = new Date();
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'active';
    if (diffHours < 24) {
      return recentMessageCount >= 5 ? 'active' : 'moderate';
    }
    if (diffHours < 24 * 7) return 'quiet';
    return 'dormant';
  }

  if (recentMessageCount >= 1) return 'moderate';
  return 'quiet';
}

/**
 * Get human-readable label for health level
 */
export function getHealthLabel(level: SpaceHealthLevel): string {
  switch (level) {
    case 'active':
      return 'Active';
    case 'moderate':
      return 'Moderate';
    case 'quiet':
      return 'Quiet';
    case 'dormant':
      return 'Dormant';
  }
}

/**
 * Get detailed description for health level (for tooltips)
 */
export function getHealthDescription(level: SpaceHealthLevel): string {
  switch (level) {
    case 'active':
      return 'Active in the last hour';
    case 'moderate':
      return 'Active in the last 24 hours';
    case 'quiet':
      return 'No recent activity';
    case 'dormant':
      return 'Inactive for over a week';
  }
}

/**
 * Calculate growth trend from member metrics
 */
export function getMemberGrowthTrend(metrics: SpaceHealthMetrics): 'growing' | 'stable' | 'declining' | null {
  const { memberCount = 0, newMembers7d } = metrics;

  if (newMembers7d === undefined || memberCount === 0) return null;

  const growthRate = newMembers7d / memberCount;

  if (growthRate > 0.1) return 'growing';
  if (newMembers7d > 0) return 'stable';
  return 'declining';
}
