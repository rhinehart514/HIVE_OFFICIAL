"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { sseRealtimeService } from "@/lib/sse-realtime-service";
import { HttpStatus } from "@/lib/api-response-types";
import { notifyPostLike } from "@/lib/notification-service";
import { getServerSpaceRepository } from "@hive/core/server";

const ReactionSchema = z.object({
  type: z.enum(["heart"]).default("heart"),
  action: z.enum(["add", "remove", "toggle"]).default("toggle"),
});

async function validateSpaceAndMembership(spaceId: string, userId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== CURRENT_CAMPUS_ID) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

async function ensurePostExists(spaceId: string, postId: string) {
  const postDoc = await dbAdmin
    .collection("spaces")
    .doc(spaceId)
    .collection("posts")
    .doc(postId)
    .get();
  if (!postDoc.exists) {
    return { ok: false as const, status: 404, message: "Post not found" };
  }
  const postData = postDoc.data();
  if (!postData) {
    return { ok: false as const, status: 404, message: "Post data missing" };
  }
  if (postData.campusId && postData.campusId !== CURRENT_CAMPUS_ID) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied for this campus" };
  }
  return { ok: true as const, postRef: postDoc.ref };
}

export const POST = withAuthValidationAndErrors(
  ReactionSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; postId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId, postId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);

      const validation = await validateSpaceAndMembership(spaceId, userId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(validation.message, code, { status: validation.status });
      }

      const post = await ensurePostExists(spaceId, postId);
      if (!post.ok) {
        return respond.error(post.message, "RESOURCE_NOT_FOUND", { status: post.status });
      }

      const reactionKey = String(body.type || "heart");

      const result = await dbAdmin.runTransaction(async (tx) => {
        const snapshot = await tx.get(post.postRef);
        const data = snapshot.data() as Record<string, unknown> | undefined;
        if (!data) {
          throw Object.assign(new Error("Post data missing"), { status: 404 });
        }

        const reactions: Record<string, number> = (data.reactions as Record<string, number>) || { heart: 0 };
        const reactedUsers: Record<string, string[]> =
          (data.reactedUsers as Record<string, string[]>) || { heart: [] };

        const users = new Set<string>((reactedUsers[reactionKey] || []) as string[]);
        const alreadyReacted = users.has(userId);
        let count = reactions[reactionKey] || 0;
        let didReact = alreadyReacted;

        if (body.action === "add" || (body.action === "toggle" && !alreadyReacted)) {
          if (!alreadyReacted) {
            users.add(userId);
            count = Math.max(0, count + 1);
            didReact = true;
          }
        } else if (
          body.action === "remove" ||
          (body.action === "toggle" && alreadyReacted)
        ) {
          if (alreadyReacted) {
            users.delete(userId);
            count = Math.max(0, count - 1);
            didReact = false;
          }
        }

        tx.update(post.postRef, {
          [`reactions.${reactionKey}`]: count,
          [`reactedUsers.${reactionKey}`]: Array.from(users),
          updatedAt: new Date(),
        });

        return { count, reacted: didReact };
      });

      try {
        await sseRealtimeService.sendMessage({
          type: "chat",
          channel: `space:${spaceId}:posts`,
          senderId: userId,
          content: {
            type: "reaction_update",
            postId,
            reactionType: body.type,
            reacted: result.reacted,
            count: result.count,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            priority: "low",
            requiresAck: false,
            retryCount: 0,
          },
        });
      } catch (broadcastError) {
        logger.warn("Failed to broadcast reaction via SSE", {
          broadcastError,
          spaceId,
          postId,
        });
      }

      // Send notification if user added a like (not removed)
      if (result.reacted) {
        try {
          // Get post author from the post data
          const postSnapshot = await post.postRef.get();
          const postData = postSnapshot.data();

          if (postData && postData.authorId && postData.authorId !== userId) {
            // Get the liker's name
            const userDoc = await dbAdmin.collection("users").doc(userId).get();
            const userData = userDoc.data();

            await notifyPostLike({
              postAuthorId: postData.authorId,
              likerId: userId,
              likerName: userData?.fullName || 'Someone',
              postId,
              spaceId,
            });
          }
        } catch (notifyError) {
          // Don't fail the like if notification fails
          logger.warn('Failed to send like notification', {
            error: notifyError instanceof Error ? notifyError.message : String(notifyError),
            postId,
            spaceId,
          });
        }
      }

      return respond.success({
        postId,
        reactions: { [reactionKey]: result.count },
        userReacted: result.reacted,
      });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      logger.error(
        "Error updating reaction at /api/spaces/[spaceId]/posts/[postId]/reactions",
        { error: error instanceof Error ? error.message : String(error) },
      );
      const code =
        status === 404 ? "RESOURCE_NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR";
      return respond.error("Failed to update reaction", code, { status });
    }
  },
);
