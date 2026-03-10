/**
 * Social-Proof Threshold Check
 *
 * Lightweight endpoint called fire-and-forget by authenticated users
 * after they write to RTDB directly. Checks if the tool just crossed
 * a social-proof threshold and notifies the creator.
 *
 * POST /api/tools/[toolId]/check-threshold
 */

import { z } from "zod";
import { withErrors } from "@/lib/middleware";
import { logger } from "@/lib/logger";
import { checkSocialProofThreshold } from "@/lib/social-proof-notifications";
import { notifyPollClosed } from "@/lib/poll-close-notifications";

const CheckThresholdSchema = z.object({
  actionType: z.enum(["poll_vote", "bracket_vote", "rsvp_toggle", "poll_close"]),
  displayName: z.string().optional(),
});

export const POST = withErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond,
) => {
  const { toolId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond.error("Invalid JSON", "INVALID_INPUT", { status: 400 });
  }

  const parsed = CheckThresholdSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error("Invalid payload", "INVALID_INPUT", { status: 400 });
  }

  const { actionType, displayName } = parsed.data;

  if (actionType === 'poll_close') {
    // Fire-and-forget: notify all voters about poll results
    notifyPollClosed(toolId).catch((err) => {
      logger.warn("Poll-close notification failed (non-blocking)", {
        toolId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  } else {
    // Fire-and-forget: check threshold
    checkSocialProofThreshold(toolId, actionType, displayName).catch((err) => {
      logger.warn("Social-proof check failed (non-blocking)", {
        toolId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  return respond.success({ ok: true });
}, {
  rateLimit: { maxRequests: 60, windowMs: 60000 },
});
