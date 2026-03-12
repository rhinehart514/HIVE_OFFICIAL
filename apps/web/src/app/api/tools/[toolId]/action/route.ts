/**
 * Shell Action API Route
 *
 * Proxies shell actions (poll votes, RSVP toggles, bracket votes) to RTDB
 * via Admin SDK. This allows anonymous users on viral URLs to interact
 * without Firebase Auth.
 *
 * POST /api/tools/[toolId]/action
 */

import { z } from "zod";
import * as admin from "firebase-admin";
import { withErrors } from "@/lib/middleware";
import { logger } from "@/lib/logger";
import { checkSocialProofThreshold } from "@/lib/social-proof-notifications";

const ShellActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("poll_vote"),
    optionIndex: z.number().int().min(0),
    sessionId: z.string().min(1),
    displayName: z.string().optional(),
  }),
  z.object({
    type: z.literal("bracket_vote"),
    matchupId: z.string().min(1),
    choice: z.enum(["a", "b"]),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("rsvp_toggle"),
    sessionId: z.string().min(1),
    displayName: z.string().optional(),
    photoURL: z.string().optional(),
  }),
]);

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

  const parsed = ShellActionSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error("Invalid action", "INVALID_INPUT", { status: 400 });
  }

  const action = parsed.data;
  // Use sessionId prefixed with "anon:" to distinguish from real user IDs
  const userId = `anon:${action.sessionId}`;
  const basePath = `shell_states/${toolId}`;

  try {
    const rtdb = admin.database();

    switch (action.type) {
      case "poll_vote": {
        const voteRef = rtdb.ref(`${basePath}/votes/${userId}`);
        const existingVote = await voteRef.once("value");
        if (existingVote.exists()) {
          const prev = existingVote.val();
          if (prev.optionIndex === action.optionIndex) {
            // Same vote — skip write, return existing
            return respond.success({ ok: true, duplicate: true });
          }
        }
        await voteRef.set({
          userId,
          optionIndex: action.optionIndex,
          votedAt: Date.now(),
        });
        break;
      }

      case "bracket_vote": {
        // Read current state to find matchup index
        const stateSnap = await rtdb.ref(basePath).once("value");
        const state = stateSnap.val();
        if (state?.matchups) {
          const idx = state.matchups.findIndex(
            (m: { id: string }) => m?.id === action.matchupId
          );
          if (idx >= 0) {
            const existingChoice = state.matchups[idx]?.votes?.[userId];
            if (existingChoice === action.choice) {
              // Same vote — skip write
              return respond.success({ ok: true, duplicate: true });
            }
            await rtdb
              .ref(`${basePath}/matchups/${idx}/votes/${userId}`)
              .set(action.choice);
          }
        }
        break;
      }

      case "rsvp_toggle": {
        const attendeeRef = rtdb.ref(`${basePath}/attendees/${userId}`);
        const snap = await attendeeRef.once("value");
        if (snap.exists()) {
          await attendeeRef.remove();
        } else {
          await attendeeRef.set({
            userId,
            displayName: action.displayName || "Guest",
            photoURL: action.photoURL ?? null,
            rsvpAt: Date.now(),
          });
        }
        break;
      }
    }

    // Fire-and-forget: check if we hit the social-proof threshold
    const displayName = 'displayName' in action ? action.displayName : undefined;
    checkSocialProofThreshold(toolId, action.type, displayName).catch((err) => {
      logger.warn("Social-proof check failed (non-blocking)", {
        toolId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return respond.success({ ok: true });
  } catch (error) {
    logger.error("Shell action failed", {
      toolId,
      actionType: action.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error("Action failed", "INTERNAL_ERROR", { status: 500 });
  }
}, {
  rateLimit: { maxRequests: 60, windowMs: 60000 },
});
