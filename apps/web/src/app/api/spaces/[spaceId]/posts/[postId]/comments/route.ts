"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";
import { notifyNewComment, notifyCommentReply } from "@/lib/notification-service";
import { getServerSpaceRepository } from "@hive/core/server";

/**
 * Check if content should be hidden from results
 * Filters out moderated/hidden/removed content
 */
function isContentHidden(data: Record<string, unknown>): boolean {
  if (data.isHidden === true) return true;
  if (data.status === 'hidden' || data.status === 'removed' || data.status === 'flagged') return true;
  if (data.isDeleted === true) return true;
  if (data.moderationStatus === 'removed' || data.moderationStatus === 'hidden') return true;
  return false;
}

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentCommentId: z.string().optional(),
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
  // SECURITY: Don't allow access to hidden/moderated posts
  if (isContentHidden(postData)) {
    return { ok: false as const, status: 404, message: "Post not found" };
  }

  return { ok: true as const, postDoc, postData };
}

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; postId: string }> },
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

    const commentsSnapshot = await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .orderBy("createdAt", "asc")
      .get();

    const commentMap = new Map<string, Record<string, unknown>>();
    const rootComments: Array<Record<string, unknown>> = [];

    for (const doc of commentsSnapshot.docs) {
      const data = doc.data();
      // SECURITY: Skip comments from other campuses
      if (data.campusId && data.campusId !== CURRENT_CAMPUS_ID) {
        continue;
      }
      // SECURITY: Skip hidden/moderated/removed comments
      if (isContentHidden(data)) {
        continue;
      }
      const authorDoc = await dbAdmin.collection("users").doc(data.authorId).get();
      const authorData = authorDoc.exists ? authorDoc.data() : null;

      const comment = {
        id: doc.id,
        content: data.content,
        authorId: data.authorId,
        author: authorData
          ? {
              id: authorDoc.id,
              fullName: authorData.fullName || "Unknown User",
              handle: authorData.handle || "unknown",
              photoURL: authorData.photoURL || null,
            }
          : {
              id: data.authorId,
              fullName: "Unknown User",
              handle: "unknown",
              photoURL: null,
            },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        parentCommentId: (data.parentCommentId as string) || null,
        replies: [],
        reactions: data.reactions || { heart: 0 },
        isEdited: Boolean(data.isEdited),
        isDeleted: Boolean(data.isDeleted),
      };

      commentMap.set(doc.id, comment);
    }

    for (const comment of commentMap.values()) {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId as string);
        if (parent) {
          (parent.replies as typeof comment[]).push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    }

    return respond.success({
      comments: rootComments,
      total: rootComments.length,
    });
  } catch (error) {
    logger.error(
      "Error fetching comments at /api/spaces/[spaceId]/posts/[postId]/comments",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch comments", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const POST = withAuthValidationAndErrors(
  CreateCommentSchema,
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

      if (body.parentCommentId) {
        const parentDoc = await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("posts")
          .doc(postId)
          .collection("comments")
          .doc(body.parentCommentId)
          .get();
        if (!parentDoc.exists) {
          return respond.error("Parent comment not found", "RESOURCE_NOT_FOUND", {
            status: HttpStatus.NOT_FOUND,
          });
        }
      }

      const userDoc = await dbAdmin.collection("users").doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      const now = new Date();
      const commentData = {
        authorId: userId,
        content: body.content,
        parentCommentId: body.parentCommentId || null,
        createdAt: now,
        updatedAt: now,
        reactions: { heart: 0 },
        reactedUsers: { heart: [] as string[] },
        isEdited: false,
        isDeleted: false,
        campusId: CURRENT_CAMPUS_ID,
      };

      const commentRef = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("posts")
        .doc(postId)
        .collection("comments")
        .add(commentData);

      await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("posts")
        .doc(postId)
        .update({
          replyCount: admin.firestore.FieldValue.increment(1),
          commentCount: admin.firestore.FieldValue.increment(1),
          lastActivity: now,
          updatedAt: now,
        });

      // Get space name for notification from DDD aggregate
      const spaceName = validation.space.name.value;

      // Send notification to post author or parent comment author
      try {
        if (body.parentCommentId) {
          // Replying to a comment - notify the comment author
          const parentCommentDoc = await dbAdmin
            .collection("spaces")
            .doc(spaceId)
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .doc(body.parentCommentId)
            .get();
          const parentCommentData = parentCommentDoc.data();

          if (parentCommentData && parentCommentData.authorId !== userId) {
            await notifyCommentReply({
              originalCommentAuthorId: parentCommentData.authorId,
              replierId: userId,
              replierName: userData?.fullName || 'Someone',
              postId,
              commentId: commentRef.id,
              spaceId,
              replyPreview: body.content,
            });
          }
        } else {
          // New comment on post - notify post author
          if (post.postData && post.postData.authorId !== userId) {
            await notifyNewComment({
              postAuthorId: post.postData.authorId,
              commenterId: userId,
              commenterName: userData?.fullName || 'Someone',
              postId,
              spaceId,
              spaceName,
              commentPreview: body.content,
            });
          }
        }
      } catch (notifyError) {
        // Don't fail the comment creation if notification fails
        logger.warn('Failed to send comment notification', {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
          postId,
          spaceId,
        });
      }

      return respond.created({
        id: commentRef.id,
        ...commentData,
        author: userData
          ? {
              id: userId,
              fullName: userData.fullName || "Unknown User",
              handle: userData.handle || "unknown",
              photoURL: userData.photoURL || null,
            }
          : {
              id: userId,
              fullName: "Unknown User",
              handle: "unknown",
              photoURL: null,
            },
        replies: [],
      });
    } catch (error) {
      logger.error(
        "Error creating comment at /api/spaces/[spaceId]/posts/[postId]/comments",
        { error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error("Failed to create comment", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
