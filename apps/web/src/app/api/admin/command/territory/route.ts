/**
 * Command Center - Territory API
 *
 * Space ecosystem visualization data for executive dashboard.
 * Returns space nodes with relationships for d3-force visualization.
 *
 * GET: Returns space ecosystem data with connections
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { withCache } from '../../../../../lib/cache-headers';

interface SpaceNode {
  id: string;
  name: string;
  handle: string;
  category: string;
  memberCount: number;
  postCount: number;
  eventCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  status: 'active' | 'inactive' | 'at_risk';
  createdAt: string;
  // Visual properties
  size: number; // Computed from memberCount
  color: string; // Based on category
}

interface SpaceConnection {
  source: string;
  target: string;
  strength: number; // 0-1 based on shared members
}

interface CategoryCluster {
  category: string;
  label: string;
  color: string;
  spaceCount: number;
  totalMembers: number;
}

/**
 * Map space category to color
 */
function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'university_org': '#3B82F6', // Blue
    'academic': '#8B5CF6',       // Purple
    'residential': '#10B981',    // Green
    'greek_life': '#F59E0B',     // Amber
    'student_org': '#EC4899',    // Pink
    'sports': '#EF4444',         // Red
    'arts': '#06B6D4',           // Cyan
    'social': '#F97316',         // Orange
    'professional': '#6366F1',   // Indigo
  };
  return categoryColors[category] || '#6B7280'; // Gray default
}

/**
 * GET /api/admin/command/territory
 * Returns space ecosystem data for visualization
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);

  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
  const includeConnections = searchParams.get('connections') !== 'false';

  logger.info('command_territory_fetch', { adminId, campusId, limit });

  try {
    // Fetch all active spaces
    const spacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .orderBy('metrics.memberCount', 'desc')
      .limit(limit)
      .get();

    if (spacesSnapshot.empty) {
      return respond.success({
        nodes: [],
        connections: [],
        clusters: [],
        timestamp: new Date().toISOString(),
      });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Build nodes
    const nodes: SpaceNode[] = spacesSnapshot.docs.map(doc => {
      const data = doc.data();
      const memberCount = data.metrics?.memberCount || data.memberCount || 0;
      const lastActivity = data.lastActivityAt?.toDate?.() || data.updatedAt?.toDate?.();

      // Determine status
      let status: SpaceNode['status'] = 'active';
      if (lastActivity && lastActivity < fourteenDaysAgo) {
        status = 'at_risk';
      } else if (data.status === 'inactive' || data.isActive === false) {
        status = 'inactive';
      }

      return {
        id: doc.id,
        name: data.name || 'Unnamed Space',
        handle: data.handle || doc.id,
        category: data.category || 'student_org',
        memberCount,
        postCount: data.metrics?.postCount || 0,
        eventCount: data.metrics?.eventCount || 0,
        isVerified: data.verification?.isVerified || false,
        isFeatured: data.isFeatured || false,
        status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        // Visual properties
        size: Math.max(10, Math.min(100, Math.log10(memberCount + 1) * 30)),
        color: getCategoryColor(data.category || 'student_org'),
      };
    });

    // Build connections (shared members)
    let connections: SpaceConnection[] = [];

    if (includeConnections && nodes.length > 1 && nodes.length <= 50) {
      // Only compute connections for smaller datasets
      const spaceIds = nodes.map(n => n.id);

      // Get members for each space
      const membersBySpace = new Map<string, Set<string>>();

      for (const spaceId of spaceIds) {
        const membersSnapshot = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('isActive', '==', true)
          .limit(500)
          .get();

        const memberIds = new Set<string>();
        membersSnapshot.docs.forEach(doc => {
          const userId = doc.data().userId;
          if (userId) memberIds.add(userId);
        });
        membersBySpace.set(spaceId, memberIds);
      }

      // Find connections (shared members)
      for (let i = 0; i < spaceIds.length; i++) {
        for (let j = i + 1; j < spaceIds.length; j++) {
          const spaceA = spaceIds[i];
          const spaceB = spaceIds[j];
          const membersA = membersBySpace.get(spaceA);
          const membersB = membersBySpace.get(spaceB);

          if (membersA && membersB) {
            // Count shared members
            let sharedCount = 0;
            membersA.forEach(memberId => {
              if (membersB.has(memberId)) sharedCount++;
            });

            if (sharedCount > 0) {
              // Calculate strength (0-1)
              const strength = Math.min(
                sharedCount / Math.min(membersA.size, membersB.size),
                1
              );

              if (strength > 0.05) { // Only include meaningful connections
                connections.push({
                  source: spaceA,
                  target: spaceB,
                  strength,
                });
              }
            }
          }
        }
      }

      // Limit connections to prevent visual clutter
      connections = connections
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 100);
    }

    // Build category clusters
    const categoryMap = new Map<string, { count: number; members: number }>();
    nodes.forEach(node => {
      const current = categoryMap.get(node.category) || { count: 0, members: 0 };
      categoryMap.set(node.category, {
        count: current.count + 1,
        members: current.members + node.memberCount,
      });
    });

    const categoryLabels: Record<string, string> = {
      'university_org': 'University Organizations',
      'academic': 'Academic',
      'residential': 'Residential',
      'greek_life': 'Greek Life',
      'student_org': 'Student Organizations',
      'sports': 'Sports & Athletics',
      'arts': 'Arts & Culture',
      'social': 'Social',
      'professional': 'Professional',
    };

    const clusters: CategoryCluster[] = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        label: categoryLabels[category] || category,
        color: getCategoryColor(category),
        spaceCount: stats.count,
        totalMembers: stats.members,
      }))
      .sort((a, b) => b.spaceCount - a.spaceCount);

    logger.info('command_territory_success', {
      adminId,
      campusId,
      nodeCount: nodes.length,
      connectionCount: connections.length,
      clusterCount: clusters.length,
    });

    return respond.success({
      nodes,
      connections,
      clusters,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('command_territory_error', {
      adminId,
      campusId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to fetch territory data', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
