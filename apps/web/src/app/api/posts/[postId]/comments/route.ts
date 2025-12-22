/**
 * Post Comments API
 *
 * GET /api/posts/[postId]/comments - Get comments for a post
 * POST /api/posts/[postId]/comments - Add a comment to a post
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/server-auth';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { NextRequest, NextResponse } from 'next/server';

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
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getCurrentUser(request);

    // Fetch comments from Firestore
    const commentsSnapshot = await dbAdmin
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
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

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ comments: [] });
  }
}

/**
 * POST /api/posts/[postId]/comments
 * Add a comment to a post
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
    }

    // Get user profile for author info
    const profileDoc = await dbAdmin.collection('profiles').doc(user.uid).get();
    const profileData = profileDoc.exists ? profileDoc.data() : null;

    const commentData = {
      postId,
      authorId: user.uid,
      authorName: profileData?.displayName || user.email?.split('@')[0] || 'Anonymous',
      authorAvatar: profileData?.avatarUrl || null,
      authorRole: profileData?.role || null,
      content: content.trim(),
      campusId: CURRENT_CAMPUS_ID,
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

    // Increment comment count on post
    await dbAdmin.collection('posts').doc(postId).update({
      'reactions.comments': FieldValue.increment(1),
      updatedAt: new Date(),
    });

    // Return the new comment in the expected format
    return NextResponse.json({
      id: commentRef.id,
      author: {
        id: user.uid,
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
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
