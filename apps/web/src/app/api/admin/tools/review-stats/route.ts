"use server";

/**
 * Admin Tool Review Statistics Endpoint
 *
 * GET /api/admin/tools/review-stats
 * Returns statistics about tool publish requests and review activity.
 */

import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/admin/tools/review-stats
 *
 * Returns comprehensive statistics about tool publishing and reviews.
 * Uses withAdminAuthAndErrors for built-in admin auth + CSRF + rate limiting.
 *
 * Response includes:
 * - Request counts by status (pending, approved, rejected, changes_requested)
 * - Review activity over time
 * - Average review times
 * - Top reviewers
 * - Most active tool creators
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Parallel queries for better performance
  const [
    pendingSnapshot,
    approvedSnapshot,
    rejectedSnapshot,
    changesRequestedSnapshot,
    recentActivitySnapshot,
    allRequestsSnapshot,
  ] = await Promise.all([
    // Count by status
    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("status", "==", "pending")
      .count()
      .get(),

    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("status", "==", "approved")
      .count()
      .get(),

    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("status", "==", "rejected")
      .count()
      .get(),

    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("status", "==", "changes_requested")
      .count()
      .get(),

    // Recent review activity
    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("reviewedAt", ">=", startDateStr)
      .orderBy("reviewedAt", "desc")
      .limit(100)
      .get(),

    // All requests in time period (for metrics)
    dbAdmin
      .collection("toolPublishRequests")
      .where("campusId", "==", campusId)
      .where("createdAt", ">=", startDateStr)
      .get(),
  ]);

  // Calculate status counts
  const statusCounts = {
    pending: pendingSnapshot.data().count,
    approved: approvedSnapshot.data().count,
    rejected: rejectedSnapshot.data().count,
    changes_requested: changesRequestedSnapshot.data().count,
    total:
      pendingSnapshot.data().count +
      approvedSnapshot.data().count +
      rejectedSnapshot.data().count +
      changesRequestedSnapshot.data().count,
  };

  // Calculate review metrics
  const reviewerStats: Record<string, { count: number; approved: number; rejected: number }> = {};
  const creatorStats: Record<string, number> = {};
  const reviewTimes: number[] = [];
  const dailyActivity: Record<string, { submitted: number; reviewed: number }> = {};

  // Process recent activity for reviewer stats
  recentActivitySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const reviewerId = data.reviewedBy;

    if (reviewerId) {
      if (!reviewerStats[reviewerId]) {
        reviewerStats[reviewerId] = { count: 0, approved: 0, rejected: 0 };
      }
      reviewerStats[reviewerId].count++;
      if (data.status === "approved") reviewerStats[reviewerId].approved++;
      if (data.status === "rejected") reviewerStats[reviewerId].rejected++;

      // Calculate review time
      if (data.createdAt && data.reviewedAt) {
        const created = new Date(data.createdAt).getTime();
        const reviewed = new Date(data.reviewedAt).getTime();
        if (reviewed > created) {
          reviewTimes.push(reviewed - created);
        }
      }

      // Track daily reviewed
      if (data.reviewedAt) {
        const day = data.reviewedAt.split("T")[0];
        if (!dailyActivity[day]) {
          dailyActivity[day] = { submitted: 0, reviewed: 0 };
        }
        dailyActivity[day].reviewed++;
      }
    }
  });

  // Process all requests for creator stats and daily submissions
  allRequestsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const creatorId = data.userId;

    if (creatorId) {
      creatorStats[creatorId] = (creatorStats[creatorId] || 0) + 1;
    }

    // Track daily submissions
    if (data.createdAt) {
      const day = data.createdAt.split("T")[0];
      if (!dailyActivity[day]) {
        dailyActivity[day] = { submitted: 0, reviewed: 0 };
      }
      dailyActivity[day].submitted++;
    }
  });

  // Calculate average review time
  const avgReviewTimeMs =
    reviewTimes.length > 0
      ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
      : 0;
  const avgReviewTimeHours = Math.round(avgReviewTimeMs / (1000 * 60 * 60) * 10) / 10;

  // Get top reviewers (limit to 10)
  const topReviewers = Object.entries(reviewerStats)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([reviewerId, stats]) => ({
      userId: reviewerId,
      ...stats,
      approvalRate: stats.count > 0 ? Math.round((stats.approved / stats.count) * 100) : 0,
    }));

  // Get top creators (limit to 10)
  const topCreators = Object.entries(creatorStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, submissionCount: count }));

  // Convert daily activity to sorted array
  const dailyActivityArray = Object.entries(dailyActivity)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  // Calculate approval rate
  const totalReviewed = statusCounts.approved + statusCounts.rejected + statusCounts.changes_requested;
  const approvalRate = totalReviewed > 0 ? Math.round((statusCounts.approved / totalReviewed) * 100) : 0;

  logger.info("Admin tool review stats fetched", {
    userId,
    days,
    pendingCount: statusCounts.pending,
    totalRequests: statusCounts.total,
    endpoint: "/api/admin/tools/review-stats",
  });

  return respond.success({
    statusCounts,
    metrics: {
      approvalRate,
      avgReviewTimeHours,
      totalReviewsInPeriod: recentActivitySnapshot.size,
      totalSubmissionsInPeriod: allRequestsSnapshot.size,
    },
    topReviewers,
    topCreators,
    dailyActivity: dailyActivityArray,
    period: {
      days,
      startDate: startDateStr,
      endDate: new Date().toISOString(),
    },
  });
});

export const GET = withCache(_GET, 'PRIVATE');
