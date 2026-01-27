/**
 * Admin Aggregations Cloud Functions
 *
 * Scheduled functions to aggregate admin metrics:
 * - Every 5 minutes: Update adminMetrics/{campusId} with real-time aggregations
 * - Daily at midnight: Record snapshot to adminTimeSeries/{campusId}/daily/{date}
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const logger = functions.logger;

/**
 * Admin Metrics Schema
 */
interface AdminMetrics {
  activeUsers24h: number;
  totalUsers: number;
  totalSpaces: number;
  totalEvents: number;
  postsToday: number;
  reportsPending: number;
  toolsPending: number;
  claimsPending: number;
  appealsPending: number;
  spacesAtRisk: string[];
  usersAtRisk: number;
  weeklyGrowth: {
    users: number;
    spaces: number;
    engagement: number;
  };
  recentActivity: RecentActivity[];
  updatedAt: FirebaseFirestore.Timestamp;
}

interface RecentActivity {
  type: 'user_signup' | 'space_created' | 'event_created' | 'post_created' | 'tool_deployed';
  entityId: string;
  entityName: string;
  timestamp: FirebaseFirestore.Timestamp;
}

interface DailyTimeSeries {
  date: string;
  activeUsers: number;
  newUsers: number;
  postsCreated: number;
  eventsCreated: number;
  spacesCreated: number;
  toolsDeployed: number;
  reportsResolved: number;
  engagementScore: number;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Get all unique campus IDs from the system
 */
async function getCampusIds(): Promise<string[]> {
  const campusesSnapshot = await db
    .collection('campuses')
    .where('isActive', '==', true)
    .get();

  if (campusesSnapshot.empty) {
    // Fallback: get unique campusIds from profiles
    const profilesSnapshot = await db
      .collection('profiles')
      .select('campusId')
      .limit(100)
      .get();

    const campusIds = new Set<string>();
    profilesSnapshot.forEach(doc => {
      const campusId = doc.data().campusId;
      if (campusId) campusIds.add(campusId);
    });

    return Array.from(campusIds);
  }

  return campusesSnapshot.docs.map(doc => doc.id);
}

/**
 * Calculate spaces at risk (declining engagement)
 * Risk indicators:
 * - No activity in 14+ days
 * - Declining member count
 * - No events scheduled
 */
async function getSpacesAtRisk(campusId: string): Promise<string[]> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const spacesSnapshot = await db
    .collection('spaces')
    .where('campusId', '==', campusId)
    .where('isActive', '==', true)
    .get();

  const atRiskSpaceIds: string[] = [];

  for (const doc of spacesSnapshot.docs) {
    const data = doc.data();
    const lastActivity = data.lastActivityAt?.toDate() || data.updatedAt?.toDate();

    // Space is at risk if no activity in 14 days
    if (lastActivity && lastActivity < fourteenDaysAgo) {
      atRiskSpaceIds.push(doc.id);
    }
  }

  return atRiskSpaceIds.slice(0, 20); // Limit to 20 for performance
}

/**
 * Calculate weekly growth metrics
 */
async function calculateWeeklyGrowth(campusId: string): Promise<AdminMetrics['weeklyGrowth']> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // This week's new users
  const thisWeekUsers = await db
    .collection('profiles')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', sevenDaysAgo)
    .count()
    .get();

  // Last week's new users
  const lastWeekUsers = await db
    .collection('profiles')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', fourteenDaysAgo)
    .where('createdAt', '<', sevenDaysAgo)
    .count()
    .get();

  // This week's new spaces
  const thisWeekSpaces = await db
    .collection('spaces')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', sevenDaysAgo)
    .count()
    .get();

  // Last week's new spaces
  const lastWeekSpaces = await db
    .collection('spaces')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', fourteenDaysAgo)
    .where('createdAt', '<', sevenDaysAgo)
    .count()
    .get();

  // Calculate growth percentages
  const thisWeekUsersCount = thisWeekUsers.data().count;
  const lastWeekUsersCount = lastWeekUsers.data().count;
  const thisWeekSpacesCount = thisWeekSpaces.data().count;
  const lastWeekSpacesCount = lastWeekSpaces.data().count;

  const userGrowth = lastWeekUsersCount > 0
    ? Math.round(((thisWeekUsersCount - lastWeekUsersCount) / lastWeekUsersCount) * 100)
    : thisWeekUsersCount > 0 ? 100 : 0;

  const spaceGrowth = lastWeekSpacesCount > 0
    ? Math.round(((thisWeekSpacesCount - lastWeekSpacesCount) / lastWeekSpacesCount) * 100)
    : thisWeekSpacesCount > 0 ? 100 : 0;

  // Engagement growth (based on posts)
  const thisWeekPosts = await db
    .collection('posts')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', sevenDaysAgo)
    .count()
    .get();

  const lastWeekPosts = await db
    .collection('posts')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', fourteenDaysAgo)
    .where('createdAt', '<', sevenDaysAgo)
    .count()
    .get();

  const thisWeekPostsCount = thisWeekPosts.data().count;
  const lastWeekPostsCount = lastWeekPosts.data().count;

  const engagementGrowth = lastWeekPostsCount > 0
    ? Math.round(((thisWeekPostsCount - lastWeekPostsCount) / lastWeekPostsCount) * 100)
    : thisWeekPostsCount > 0 ? 100 : 0;

  return {
    users: userGrowth,
    spaces: spaceGrowth,
    engagement: engagementGrowth,
  };
}

/**
 * Get recent activity feed for dashboard
 */
async function getRecentActivity(campusId: string): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Get recent users
  const recentUsers = await db
    .collection('profiles')
    .where('campusId', '==', campusId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  recentUsers.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'user_signup',
      entityId: doc.id,
      entityName: data.displayName || data.handle || 'Unknown',
      timestamp: data.createdAt,
    });
  });

  // Get recent spaces
  const recentSpaces = await db
    .collection('spaces')
    .where('campusId', '==', campusId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  recentSpaces.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'space_created',
      entityId: doc.id,
      entityName: data.name || 'Unknown',
      timestamp: data.createdAt,
    });
  });

  // Sort by timestamp and limit to 10 most recent
  activities.sort((a, b) => {
    const aTime = a.timestamp?.toMillis() || 0;
    const bTime = b.timestamp?.toMillis() || 0;
    return bTime - aTime;
  });

  return activities.slice(0, 10);
}

/**
 * Update admin metrics every 5 minutes
 */
export const updateAdminMetrics = functions.pubsub
  .schedule("*/5 * * * *") // Every 5 minutes
  .timeZone("America/New_York")
  .onRun(async (): Promise<null> => {
    try {
      logger.info("Starting admin metrics aggregation");

      const campusIds = await getCampusIds();

      if (campusIds.length === 0) {
        logger.warn("No campus IDs found, using default");
        campusIds.push('default');
      }

      for (const campusId of campusIds) {
        await updateMetricsForCampus(campusId);
      }

      logger.info(`Admin metrics updated for ${campusIds.length} campuses`);
      return null;
    } catch (error) {
      logger.error("Error updating admin metrics", error);
      return null;
    }
  });

/**
 * Update metrics for a single campus
 */
async function updateMetricsForCampus(campusId: string): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Parallel count queries
    const [
      totalUsers,
      activeUsers24h,
      totalSpaces,
      totalEvents,
      postsToday,
      reportsPending,
      toolsPending,
      claimsPending,
      appealsPending,
    ] = await Promise.all([
      // Total users
      db.collection('profiles')
        .where('campusId', '==', campusId)
        .count()
        .get(),

      // Active users in last 24 hours
      db.collection('profiles')
        .where('campusId', '==', campusId)
        .where('lastActive', '>=', yesterday)
        .count()
        .get(),

      // Total spaces
      db.collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .count()
        .get(),

      // Total events
      db.collection('events')
        .where('campusId', '==', campusId)
        .count()
        .get(),

      // Posts today
      db.collection('posts')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', today)
        .count()
        .get(),

      // Pending reports
      db.collection('contentReports')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),

      // Pending tool reviews
      db.collection('toolPublishRequests')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),

      // Pending claims
      db.collection('claims')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),

      // Pending appeals
      db.collection('appeals')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),
    ]);

    // Get additional computed metrics
    const [spacesAtRisk, weeklyGrowth, recentActivity] = await Promise.all([
      getSpacesAtRisk(campusId),
      calculateWeeklyGrowth(campusId),
      getRecentActivity(campusId),
    ]);

    // Compile metrics
    const metrics: AdminMetrics = {
      activeUsers24h: activeUsers24h.data().count,
      totalUsers: totalUsers.data().count,
      totalSpaces: totalSpaces.data().count,
      totalEvents: totalEvents.data().count,
      postsToday: postsToday.data().count,
      reportsPending: reportsPending.data().count,
      toolsPending: toolsPending.data().count,
      claimsPending: claimsPending.data().count,
      appealsPending: appealsPending.data().count,
      spacesAtRisk,
      usersAtRisk: 0, // TODO: Implement user risk calculation
      weeklyGrowth,
      recentActivity,
      updatedAt: now,
    };

    // Write to Firestore
    await db.collection('adminMetrics').doc(campusId).set(metrics, { merge: true });

    logger.info(`Updated metrics for campus ${campusId}`, {
      totalUsers: metrics.totalUsers,
      activeUsers24h: metrics.activeUsers24h,
      reportsPending: metrics.reportsPending,
    });
  } catch (error) {
    logger.error(`Error updating metrics for campus ${campusId}`, error);
    throw error;
  }
}

/**
 * Record daily time series snapshot at midnight
 */
export const recordDailyTimeSeries = functions.pubsub
  .schedule("0 0 * * *") // Midnight every day
  .timeZone("America/New_York")
  .onRun(async (): Promise<null> => {
    try {
      logger.info("Starting daily time series recording");

      const campusIds = await getCampusIds();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

      for (const campusId of campusIds) {
        await recordTimeSeriesForCampus(campusId, dateStr, yesterday);
      }

      logger.info(`Daily time series recorded for ${campusIds.length} campuses`);
      return null;
    } catch (error) {
      logger.error("Error recording daily time series", error);
      return null;
    }
  });

/**
 * Record time series for a single campus
 */
async function recordTimeSeriesForCampus(
  campusId: string,
  dateStr: string,
  date: Date
): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  try {
    const [
      activeUsers,
      newUsers,
      postsCreated,
      eventsCreated,
      spacesCreated,
      toolsDeployed,
      reportsResolved,
    ] = await Promise.all([
      // Active users that day
      db.collection('profiles')
        .where('campusId', '==', campusId)
        .where('lastActive', '>=', dayStart)
        .where('lastActive', '<=', dayEnd)
        .count()
        .get(),

      // New users that day
      db.collection('profiles')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<=', dayEnd)
        .count()
        .get(),

      // Posts created that day
      db.collection('posts')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<=', dayEnd)
        .count()
        .get(),

      // Events created that day
      db.collection('events')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<=', dayEnd)
        .count()
        .get(),

      // Spaces created that day
      db.collection('spaces')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<=', dayEnd)
        .count()
        .get(),

      // Tools deployed that day
      db.collection('tools')
        .where('campusId', '==', campusId)
        .where('deployedAt', '>=', dayStart)
        .where('deployedAt', '<=', dayEnd)
        .count()
        .get(),

      // Reports resolved that day
      db.collection('contentReports')
        .where('campusId', '==', campusId)
        .where('resolvedAt', '>=', dayStart)
        .where('resolvedAt', '<=', dayEnd)
        .count()
        .get(),
    ]);

    // Calculate engagement score (simple formula)
    const activeUsersCount = activeUsers.data().count;
    const postsCount = postsCreated.data().count;
    const eventsCount = eventsCreated.data().count;

    const engagementScore = activeUsersCount > 0
      ? Math.round((postsCount + eventsCount * 2) / activeUsersCount * 100) / 100
      : 0;

    const timeSeries: DailyTimeSeries = {
      date: dateStr,
      activeUsers: activeUsersCount,
      newUsers: newUsers.data().count,
      postsCreated: postsCount,
      eventsCreated: eventsCount,
      spacesCreated: spacesCreated.data().count,
      toolsDeployed: toolsDeployed.data().count,
      reportsResolved: reportsResolved.data().count,
      engagementScore,
      createdAt: now,
    };

    // Write to time series collection
    await db
      .collection('adminTimeSeries')
      .doc(campusId)
      .collection('daily')
      .doc(dateStr)
      .set(timeSeries);

    logger.info(`Recorded time series for campus ${campusId} on ${dateStr}`, {
      activeUsers: timeSeries.activeUsers,
      newUsers: timeSeries.newUsers,
    });
  } catch (error) {
    logger.error(`Error recording time series for campus ${campusId}`, error);
    throw error;
  }
}

/**
 * Manually trigger metrics update (callable function for testing)
 */
export const triggerMetricsUpdate = functions.https.onCall(
  async (data: { campusId?: string }, context) => {
    // Only allow authenticated admins
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to trigger metrics update"
      );
    }

    // Check admin role
    const userDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can trigger metrics update"
      );
    }

    const campusId = data.campusId;

    if (campusId) {
      await updateMetricsForCampus(campusId);
      return { success: true, message: `Metrics updated for ${campusId}` };
    }

    const campusIds = await getCampusIds();
    for (const id of campusIds) {
      await updateMetricsForCampus(id);
    }

    return { success: true, message: `Metrics updated for ${campusIds.length} campuses` };
  }
);
