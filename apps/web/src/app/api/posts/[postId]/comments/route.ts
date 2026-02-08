/**
 * Post Comments API
 *
 * GET /api/posts/[postId]/comments - Get comments for a post
 * POST /api/posts/[postId]/comments - Add a comment to a post
 */

import * as admin from 'firebase-admin';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, withOptionalAuth, getUserId, getCampusId, getUser } from '@/lib/middleware';

// Zod schema for comment creation
const CommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long (max 2000 characters)'),
});

const FieldValue = admin.firestore.FieldValue;

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  hasLiked: boolean;
  replies?: Comment[];
}

/**
 * GET /api/posts/[postId]/comments
 * Returns comments for a post
 * Uses optional auth - returns comments for anyone but tracks hasLiked for authenticated users
 */
export const GET = withOptionalAuth(async (request, context: { params: Promise<{ postId: string }> }, respond) => {
  const { postId } = await context.params;
  const user = getUser(request as import('next/server').NextRequest);

  // Use authenticated user's campus or fall back to ub-buffalo for public access
  const campusId = user?.campusId || 'ub-buffalo';

  // Fetch comments from Firestore
  const commentsSnapshot = await dbAdmin
    .collection('posts')
    .doc(postId)
    .collection('comments')
    .where('campusId', '==', campusId)
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get();

  const comments: Comment[] = [];

  for (const doc of commentsSnapshot.docs) {
    const data = doc.data();

    // Skip hidden/deleted comments
    if (data.isHidden || data.isDeleted) continue;

    // Check if current user liked this comment
    let hasLiked = false;
    if (user) {
      const likeDoc = await doc.ref.collection('likes').doc(user.uid).get();
      hasLiked = likeDoc.exists;
    }

    comments.push({
      id: doc.id,
      author: {
        id: data.authorId,
        name: data.authorName || 'Unknown',
        avatarUrl: data.authorAvatar,
        role: data.authorRole,
      },
      content: data.content,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      likes: data.likeCount || 0,
      hasLiked,
      replies: [], // TODO: Fetch nested replies if needed
    });
  }

  return respond.success({ comments });
});

/**
 * POST /api/posts/[postId]/comments
 * Add a comment to a post
 */
export const POST = withAuthAndErrors(async (request, context: { params: Promise<{ postId: string }> }, respond) => {
  const { postId } = await context.params;
  const userId = getUserId(request);
  const campusId = getCampusId(request);
  const userEmail = request.user.email;

  const { content } = CommentSchema.parse(await request.json());

  // Get user profile for author info
  const profileDoc = await dbAdmin.collection('profiles').doc(userId).get();
  const profileData = profileDoc.exists ? profileDoc.data() : null;

  const commentData = {
    postId,
    authorId: userId,
    authorName: profileData?.displayName || userEmail?.split('@')[0] || 'Anonymous',
    authorAvatar: profileData?.avatarUrl || null,
    authorRole: profileData?.role || null,
    content: content.trim(),
    campusId,
    createdAt: new Date(),
    updatedAt: new Date(),
    likeCount: 0,
    isHidden: false,
    isDeleted: false,
  };

  // Add comment to subcollection
  const commentRef = await dbAdmin
    .collection('posts')
    .doc(postId)
    .collection('comments')
    .add(commentData);

  // Increment comment count on post (both legacy and new fields)
  await dbAdmin.collection('posts').doc(postId).update({
    'reactions.comments': FieldValue.increment(1),
    'engagement.comments': FieldValue.increment(1),
    updatedAt: new Date(),
  });

  // Return the new comment in the expected format
  return respond.success({
    id: commentRef.id,
    author: {
      id: userId,
      name: commentData.authorName,
      avatarUrl: commentData.authorAvatar,
      role: commentData.authorRole,
    },
    content: commentData.content,
    createdAt: commentData.createdAt.toISOString(),
    likes: 0,
    hasLiked: false,
    replies: [],
  });
});
