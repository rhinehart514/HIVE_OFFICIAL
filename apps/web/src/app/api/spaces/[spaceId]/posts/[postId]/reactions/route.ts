"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { requireSpaceMembership } from "@/lib/space-security";
import { HttpStatus } from "@/lib/api-response-types";

const ReactionSchema = z.object({
  type: z.enum(["heart"]).default("heart"),
  action: z.enum(["add", "remove", "toggle"]).default("toggle"),
});

async function ensureMembership(spaceId: string, userId: string, campusId: string) {
  const membership = await requireSpaceMembership(spaceId, userId);
  if (!membership.ok) {
    return {
      ok: false as const,
      status: membership.status,
      message: membership.error,
    };
  }

  const spaceData = membership.space;
  if (spaceData.campusId && spaceData.campusId !== campusId) {
    return {
      ok: false as const,
      status: HttpStatus.FORBIDDEN,
      message: "Access denied for this campus",
    };
  }

  return { ok: true as const };
}

async function ensurePostExists(spaceId: string, postId: string, campusId: string) {
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
  if (postData.campusId && postData.campusId !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied for this campus" };
  }
  return { ok: true as const, postRef: postDoc.ref };
}

export const POST = withAuthValidationAndErrors(
  ReactionSchema,
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ spaceId: string; postId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId, postId } = await params;
      const userId = getUserId(request);
      const campusId = getCampusId(request);

      const membership = await ensureMembership(spaceId, userId, campusId);
      if (!membership.ok) {
        const code =
          membership.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(membership.message, code, { status: membership.status });
      }

      const post = await ensurePostExists(spaceId, postId, campusId);
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
          (data.reactedUsers as Record<string, string[]>) || { heart: [] as string[] };

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

      // Real-time updates handled by Firestore listeners on client

      return respond.success({
        postId,
        reactions: { [reactionKey]: result.count },
        userReacted: result.reacted,
      });
    } catch (error) {
      const status = (error as { status?: number })?.status || 500;
      logger.error(
        "Error updating reaction at /api/spaces/[spaceId]/posts/[postId]/reactions",
        error instanceof Error ? error : new Error(String(error)),
      );
      const code =
        status === 404 ? "RESOURCE_NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR";
      return respond.error("Failed to update reaction", code, { status });
    }
  },
);
