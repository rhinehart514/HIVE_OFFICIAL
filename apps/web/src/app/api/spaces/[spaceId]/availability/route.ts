/**
 * Space Availability API Route
 *
 * GET /api/spaces/[spaceId]/availability
 *
 * Returns aggregated availability heatmap for space members.
 * Only visible to space leaders/admins.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { getUserAvailability, ensureUserSynced, type UserAvailability } from '@/lib/calendar/calendar-sync';
import { logger } from '@/lib/structured-logger';

/**
 * Heatmap cell with aggregated availability
 */
interface HeatmapCell {
  /** Hour of day (0-23) */
  hour: number;
  /** Day of week (0-6) */
  dayOfWeek: number;
  /** Number of members available during this slot */
  available: number;
  /** Number of members with data for this slot */
  total: number;
  /** Availability score (0-1) */
  score: number;
}

/**
 * Time suggestion for events
 */
interface TimeSuggestion {
  dayOfWeek: number;
  hour: number;
  duration: number;
  score: number;
  label: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;

  try {
    // Verify user is authenticated
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has leader+ permission
    const permCheck = await checkSpacePermission(spaceId, session.userId, 'leader');
    if (!permCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Only space leaders can view availability' },
        { status: 403 }
      );
    }

    // Get space members
    const membersSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('members')
      .get();

    const memberIds = membersSnapshot.docs.map((doc) => doc.id);

    if (memberIds.length === 0) {
      return NextResponse.json({
        heatmap: [],
        memberCount: 0,
        connectedCount: 0,
        suggestions: [],
      });
    }

    // Get calendar connections for members who share with this space
    const connectionsSnapshot = await dbAdmin
      .collection('calendar_connections')
      .where('userId', 'in', memberIds.slice(0, 30)) // Firestore limit
      .where('isActive', '==', true)
      .get();

    // Filter to members who share with this space
    const sharingMemberIds: string[] = [];
    for (const doc of connectionsSnapshot.docs) {
      const data = doc.data();
      if (data.sharing?.enabled) {
        // Empty spaceIds means share with all
        if (
          data.sharing.spaceIds.length === 0 ||
          data.sharing.spaceIds.includes(spaceId)
        ) {
          sharingMemberIds.push(data.userId);
        }
      }
    }

    // Ensure all sharing members have synced availability
    await Promise.all(sharingMemberIds.map(ensureUserSynced));

    // Get availability data for sharing members
    const availabilities: UserAvailability[] = [];
    for (const memberId of sharingMemberIds) {
      const availability = await getUserAvailability(memberId);
      if (availability) {
        availabilities.push(availability);
      }
    }

    // Generate heatmap
    const heatmap = generateHeatmap(availabilities);

    // Generate time suggestions
    const suggestions = generateTimeSuggestions(heatmap);

    logger.info('Availability data retrieved', {
      spaceId,
      userId: session.userId,
      memberCount: memberIds.length,
      connectedCount: availabilities.length,
      component: 'space-availability',
    });

    return NextResponse.json({
      heatmap,
      memberCount: memberIds.length,
      connectedCount: availabilities.length,
      suggestions,
    });
  } catch (error) {
    logger.error('Availability endpoint error', { spaceId, component: 'space-availability' }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate a 7x24 heatmap from member availability data
 */
function generateHeatmap(availabilities: UserAvailability[]): HeatmapCell[] {
  const heatmap: HeatmapCell[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let available = 0;
      let total = 0;

      for (const avail of availabilities) {
        if (avail.weeklyGrid && avail.weeklyGrid[day]) {
          total++;
          // If not busy, they're available
          if (!avail.weeklyGrid[day][hour]) {
            available++;
          }
        }
      }

      const score = total > 0 ? available / total : 0;

      heatmap.push({
        hour,
        dayOfWeek: day,
        available,
        total,
        score,
      });
    }
  }

  return heatmap;
}

/**
 * Generate event time suggestions based on availability
 */
function generateTimeSuggestions(heatmap: HeatmapCell[]): TimeSuggestion[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const suggestions: TimeSuggestion[] = [];

  // Find slots with high availability (>70%)
  const goodSlots = heatmap
    .filter((cell) => cell.score >= 0.7 && cell.total >= 3)
    .sort((a, b) => b.score - a.score);

  // Find consecutive good slots (2-hour blocks)
  const usedSlots = new Set<string>();

  for (const slot of goodSlots) {
    const key = `${slot.dayOfWeek}-${slot.hour}`;
    if (usedSlots.has(key)) continue;

    // Check if next hour is also good
    const nextSlot = heatmap.find(
      (s) => s.dayOfWeek === slot.dayOfWeek && s.hour === slot.hour + 1
    );

    if (nextSlot && nextSlot.score >= 0.5) {
      const avgScore = (slot.score + nextSlot.score) / 2;
      const hour12 = slot.hour % 12 || 12;
      const ampm = slot.hour < 12 ? 'AM' : 'PM';

      suggestions.push({
        dayOfWeek: slot.dayOfWeek,
        hour: slot.hour,
        duration: 2,
        score: avgScore,
        label: `${dayNames[slot.dayOfWeek]} ${hour12}${ampm} - 2 hours`,
      });

      usedSlots.add(key);
      usedSlots.add(`${slot.dayOfWeek}-${slot.hour + 1}`);
    }

    // Limit to 5 suggestions
    if (suggestions.length >= 5) break;
  }

  return suggestions;
}
