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
  z.object({
    type: z.literal("hottake_react"),
    statementIdx: z.number().int().min(0),
    reaction: z.enum(["agree", "disagree"]),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("tierlist_place"),
    item: z.string().min(1),
    tier: z.string().min(1),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("tierlist_submit"),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("thisorthat_vote"),
    pairIdx: z.number().int().min(0),
    choice: z.enum(["a", "b"]),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("signup_join"),
    slotLabel: z.string().min(1),
    sessionId: z.string().min(1),
    displayName: z.string().optional(),
  }),
  z.object({
    type: z.literal("signup_leave"),
    slotLabel: z.string().min(1),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("superlative_nominate"),
    categoryIdx: z.number().int().min(0),
    name: z.string().min(1),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("quiz_answer"),
    questionIdx: z.number().int().min(0),
    optionText: z.string().min(1),
    sessionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("quiz_complete"),
    sessionId: z.string().min(1),
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

      case "hottake_react": {
        const reactionRef = rtdb.ref(
          `${basePath}/reactions/${action.statementIdx}/${userId}`
        );
        const existing = await reactionRef.once("value");
        if (existing.exists()) {
          return respond.success({ ok: true, duplicate: true });
        }
        await reactionRef.set(action.reaction);
        // Increment count
        const countField = action.reaction === "agree" ? "agreeCounts" : "disagreeCounts";
        await rtdb
          .ref(`${basePath}/${countField}/${action.statementIdx}`)
          .transaction((current: number | null) => (current ?? 0) + 1);
        break;
      }

      case "tierlist_place": {
        // Store individual placement — overwrite if re-placing same item
        await rtdb
          .ref(`${basePath}/placements/${userId}/${action.item}`)
          .set(action.tier);
        break;
      }

      case "tierlist_submit": {
        // Read user's placements and merge into aggregated tallies
        const userPlacements = await rtdb
          .ref(`${basePath}/placements/${userId}`)
          .once("value");
        const placed = userPlacements.val();
        if (placed && typeof placed === "object") {
          const updates: Record<string, unknown> = {};
          for (const [item, tier] of Object.entries(placed)) {
            // Increment aggregated[item][tier]
            updates[`aggregated/${item}/${tier as string}`] = admin.database.ServerValue.increment(1);
          }
          updates["participantCount"] = admin.database.ServerValue.increment(1);
          await rtdb.ref(basePath).update(updates);
        }
        break;
      }

      case "thisorthat_vote": {
        const totVoteRef = rtdb.ref(
          `${basePath}/votes/${action.pairIdx}/${userId}`
        );
        const existingTot = await totVoteRef.once("value");
        if (existingTot.exists()) {
          return respond.success({ ok: true, duplicate: true });
        }
        await totVoteRef.set(action.choice);
        // Increment count
        await rtdb
          .ref(`${basePath}/counts/${action.pairIdx}/${action.choice}`)
          .transaction((current: number | null) => (current ?? 0) + 1);
        break;
      }

      case "signup_join": {
        const slotRef = rtdb.ref(
          `${basePath}/signups/${action.slotLabel}`
        );
        // Check if already signed up
        const slotSnap = await slotRef.once("value");
        const slotSignups: Array<{ userId: string }> = slotSnap.val() ?? [];
        if (Array.isArray(slotSignups) && slotSignups.some((s) => s.userId === userId)) {
          return respond.success({ ok: true, duplicate: true });
        }
        // Push new signup
        await slotRef.push({
          userId,
          displayName: action.displayName || "Guest",
          signedUpAt: Date.now(),
        });
        await rtdb
          .ref(`${basePath}/counts/${action.slotLabel}`)
          .transaction((current: number | null) => (current ?? 0) + 1);
        break;
      }

      case "signup_leave": {
        // Find and remove user's signup entry
        const leaveRef = rtdb.ref(`${basePath}/signups/${action.slotLabel}`);
        const leaveSnap = await leaveRef.once("value");
        const entries = leaveSnap.val();
        if (entries && typeof entries === "object") {
          for (const [key, val] of Object.entries(entries)) {
            if ((val as { userId: string }).userId === userId) {
              await rtdb.ref(`${basePath}/signups/${action.slotLabel}/${key}`).remove();
              await rtdb
                .ref(`${basePath}/counts/${action.slotLabel}`)
                .transaction((current: number | null) => Math.max(0, (current ?? 0) - 1));
              break;
            }
          }
        }
        break;
      }

      case "superlative_nominate": {
        const nomRef = rtdb.ref(
          `${basePath}/nominations/${action.categoryIdx}/${userId}`
        );
        const existingNom = await nomRef.once("value");
        if (existingNom.exists()) {
          return respond.success({ ok: true, duplicate: true });
        }
        await nomRef.set(action.name);
        // Increment tally for this name
        await rtdb
          .ref(`${basePath}/tallies/${action.categoryIdx}/${action.name}`)
          .transaction((current: number | null) => (current ?? 0) + 1);
        await rtdb
          .ref(`${basePath}/participantCount`)
          .transaction((current: number | null) => (current ?? 0) + 1);
        break;
      }

      case "quiz_answer": {
        // Store individual answer
        await rtdb
          .ref(`${basePath}/responses/${userId}/answers/${action.questionIdx}`)
          .set(action.optionText);
        break;
      }

      case "quiz_complete": {
        // Read all answers, tally result
        const answersSnap = await rtdb
          .ref(`${basePath}/responses/${userId}/answers`)
          .once("value");
        const answers = answersSnap.val();
        if (answers) {
          // Determine result by most-frequent resultKey (computed client-side and stored)
          // For server-side, just increment participantCount — client already shows result
          await rtdb
            .ref(`${basePath}/participantCount`)
            .transaction((current: number | null) => (current ?? 0) + 1);
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
