"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { postCreationRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { requireSpaceMembership } from "@/lib/space-security";
import { HttpStatus } from "@/lib/api-response-types";
import { withCache } from '../../../../../lib/cache-headers';
import { enforceSpaceRules } from "@/lib/space-rules-middleware";

const profanityWords = ["spam", "scam"];
const containsProfanity = (text: string) =>
  profanityWords.some((word) => text.toLowerCase().includes(word));

const GetPostsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  lastPostId: z.string().optional(),
  type: z.enum(["hot_threads", "latest"]).optional(),
  minReplies: z.coerce.number().min(0).default(0),
});

const CreatePostSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image", "link", "tool"]).default("text"),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  toolId: z.string().optional(),
});

async function ensureSpaceAndMembership(spaceId: string, userId: string, userCampusId: string) {
  const membership = await requireSpaceMembership(spaceId, userId);
  if (!membership.ok) {
    return {
      ok: false as const,
      status: membership.status,
      message: membership.error,
    };
  }

  const spaceData = membership.space;
  if (spaceData.campusId && spaceData.campusId !== userCampusId) {
    return {
      ok: false as const,
      status: HttpStatus.FORBIDDEN,
      message: "Access denied for this campus",
    };
  }

  return {
    ok: true as const,
    spaceData,
    membershipData: membership.membership,
  };
}

const _GET = withAuthAndErrors(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request);
    const campusId = getCampusId(request);
    const queryParams = GetPostsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const membership = await ensureSpaceAndMembership(spaceId, userId, campusId);
    if (!membership.ok) {
      const code =
        membership.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(membership.message, code, { status: membership.status });
    }

    let query: FirebaseFirestore.Query = dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("posts");

    if (queryParams.type === "hot_threads") {
      query = query
        .where("commentCount", ">=", queryParams.minReplies)
        .orderBy("commentCount", "desc")
        .orderBy("lastActivity", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    query = query.limit(queryParams.limit);

    if (queryParams.lastPostId) {
      const lastDoc = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("posts")
        .doc(queryParams.lastPostId)
        .get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    // COST OPTIMIZATION: Fetch posts and pinned posts in parallel
    const [postsSnapshot, pinnedSnapshot] = await Promise.all([
      query.get(),
      dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("posts")
        .where("isPinned", "==", true)
        .get(),
    ]);

    // COST OPTIMIZATION: Batch fetch all authors at once (N+1 → 1 query)
    // Collect all unique author IDs from both queries
    const authorIds = new Set<string>();
    for (const doc of pinnedSnapshot.docs) {
      const data = doc.data();
      if (data.authorId && (!data.campusId || data.campusId === campusId)) {
        authorIds.add(data.authorId);
      }
    }
    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      if (data.authorId && !data.isPinned && (!data.campusId || data.campusId === campusId)) {
        authorIds.add(data.authorId);
      }
    }

    // Batch fetch all authors in a single query
    const authorMap = new Map<string, { id: string; fullName?: string; handle?: string; photoURL?: string } | null>();
    if (authorIds.size > 0) {
      const authorRefs = Array.from(authorIds).map(id => dbAdmin.collection("users").doc(id));
      const authorDocs = await dbAdmin.getAll(...authorRefs);
      for (const doc of authorDocs) {
        if (doc.exists) {
          const data = doc.data();
          authorMap.set(doc.id, {
            id: doc.id,
            fullName: data?.fullName,
            handle: data?.handle,
            photoURL: data?.photoURL,
          });
        } else {
          authorMap.set(doc.id, null);
        }
      }
    }

    // Helper to get author from pre-fetched map (O(1) lookup)
    const getAuthor = (authorId: string) => authorMap.get(authorId) || null;

    const posts: Record<string, unknown>[] = [];
    const pinnedPosts: Record<string, unknown>[] = [];

    for (const doc of pinnedSnapshot.docs) {
      const data = doc.data();
      if (data.campusId && data.campusId !== campusId) {
        continue;
      }
      pinnedPosts.push({
        id: doc.id,
        ...data,
        author: getAuthor(data.authorId),
      });
    }

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      if (data.isPinned) continue;
      if (data.campusId && data.campusId !== campusId) {
        continue;
      }
      posts.push({
        id: doc.id,
        ...data,
        author: getAuthor(data.authorId),
      });
    }

    return respond.success({
      posts: [...pinnedPosts, ...posts],
      hasMore: postsSnapshot.docs.length === queryParams.limit,
      lastPostId:
        postsSnapshot.docs.length > 0
          ? postsSnapshot.docs[postsSnapshot.docs.length - 1].id
          : null,
    });
  } catch (error) {
    logger.error(
      "Error fetching posts at /api/spaces/[spaceId]/posts",
      error instanceof Error ? error : new Error(String(error)),
    );
    return respond.error("Failed to fetch posts", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const POST = withAuthValidationAndErrors(
  CreatePostSchema,
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    let spaceId = "";
    let userId = "";
    let campusId = "";
    try {
      const resolved = await params;
      spaceId = resolved.spaceId;
      userId = getUserId(request);
      campusId = getCampusId(request);

      const membership = await ensureSpaceAndMembership(spaceId, userId, campusId);
      if (!membership.ok) {
        const code =
          membership.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(membership.message, code, { status: membership.status });
      }

      const permissionCheck = await enforceSpaceRules(spaceId, userId, 'posts:create');
      if (!permissionCheck.allowed) {
        return respond.error(permissionCheck.reason || "Permission denied", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      await postCreationRateLimit.check(userId);

      if (containsProfanity(body.content)) {
        return respond.error("Post contains inappropriate content", "INVALID_INPUT", {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const now = new Date();
      const postData = {
        authorId: userId,
        content: body.content,
        type: body.type,
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl || null,
        toolId: body.toolId || null,
        replyCount: 0,
        commentCount: 0,
        reactions: { heart: 0 },
        reactedUsers: { heart: [] as string[] },
        createdAt: now,
        updatedAt: now,
        lastActivity: now,
        isPinned: false,
        isDeleted: false,
        campusId,
      };

      const postRef = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("posts")
        .add(postData);

      await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .update({
          lastActivity: now,
          updatedAt: now,
        });

      // Notify space members about new post (non-blocking)
      notifyNewSpacePost(spaceId, postRef.id, body.content, userId, campusId).catch(err => {
        logger.warn('Post notification failed', {
          error: err instanceof Error ? err.message : String(err),
          spaceId,
          postId: postRef.id,
        });
      });

      return respond.created({
        post: {
          id: postRef.id,
          ...postData,
        },
      });
    } catch (error) {
      logger.error(
        "Error creating post at /api/spaces/[spaceId]/posts",
        { spaceId, userId, error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error("Failed to create post", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const GET = withCache(_GET, 'SHORT');

/**
 * Notify space members about a new post.
 * Sends bulk notifications to all active members except the author.
 */
async function notifyNewSpacePost(
  spaceId: string,
  postId: string,
  content: string,
  authorId: string,
  campusId: string
): Promise<void> {
  const { createBulkNotifications } = await import('@/lib/notification-service');

  // Get author name
  const authorDoc = await dbAdmin.collection('users').doc(authorId).get();
  const authorName = authorDoc.data()?.fullName || authorDoc.data()?.displayName || 'Someone';

  // Get space info
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceData = spaceDoc.data();
  const spaceName = spaceData?.name || 'a space';
  const spaceHandle = spaceData?.handle || spaceId;

  // Get all active members
  const membersSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .get();

  const memberIds = membersSnapshot.docs
    .map(d => d.data().userId)
    .filter(id => id !== authorId);

  if (memberIds.length === 0) return;

  const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');

  await createBulkNotifications(memberIds, {
    type: 'comment', // closest existing type for post activity
    category: 'social',
    title: `${authorName} posted in ${spaceName}`,
    body: preview,
    actionUrl: `/s/${spaceHandle}/posts/${postId}`,
    metadata: {
      actorId: authorId,
      actorName: authorName,
      postId,
      spaceId,
      spaceName,
    },
  });
}
