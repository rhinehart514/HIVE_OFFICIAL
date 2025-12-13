/**
 * Space Go Live API Route (Admin Only)
 *
 * Allows platform admins to verify a space leader and take the space live.
 * This is called when admin reviews and approves a leader's claim to a space.
 *
 * While in stealth mode, leaders can fully use their space - they get instant
 * value. Once verified by admin, the space becomes publicly discoverable.
 */

import { z } from "zod";
import {
  createServerSpaceManagementService,
} from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import { withAdminAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";

const GoLiveSchema = z.object({
  leaderId: z.string().optional(), // Optional: specific leader to verify (defaults to owner)
});

/**
 * POST /api/spaces/[spaceId]/go-live - Admin verifies leader and takes space live
 *
 * Admin-only endpoint. Called when admin approves a leader request.
 * The space must be in 'stealth' status to go live.
 */
export const POST = withAdminAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Parse optional body for specific leader ID
  let leaderId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = GoLiveSchema.safeParse(body);
    if (parsed.success) {
      leaderId = parsed.data.leaderId;
    }
  } catch {
    // Body is optional, continue without it
  }

  logger.info("Admin verifying space and going live", {
    spaceId,
    adminId,
    leaderId,
    endpoint: "/api/spaces/[spaceId]/go-live"
  });

  // Use DDD SpaceManagementService
  const spaceService = createServerSpaceManagementService(
    { userId: adminId, campusId }
  );

  const result = await spaceService.verifyAndGoLive(adminId, spaceId, leaderId);

  if (result.isFailure) {
    const errorMessage = result.error ?? 'Unknown error';

    if (errorMessage.includes('not found')) {
      return respond.error("Space or leader not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
    if (errorMessage.includes('Cannot go live')) {
      return respond.error(errorMessage, "INVALID_STATE", { status: 400 });
    }

    return respond.error(errorMessage, "GO_LIVE_FAILED", { status: 500 });
  }

  const data = result.getValue().data;

  logger.info("Space verified and went live", {
    spaceId: data.spaceId,
    spaceName: data.spaceName,
    wentLiveAt: data.wentLiveAt,
    verifiedLeaderId: data.verifiedLeaderId,
    verifiedBy: adminId
  });

  return respond.success({
    message: "Leader verified. Space is now live!",
    spaceId: data.spaceId,
    spaceName: data.spaceName,
    wentLiveAt: data.wentLiveAt.toISOString(),
    verifiedLeaderId: data.verifiedLeaderId,
    publishStatus: 'live'
  });
});
