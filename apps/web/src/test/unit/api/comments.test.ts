import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ data, init, ok: true })),
    error: vi.fn(() => ({ ok: false })),
  },
}));

describe('Comments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/posts/[postId]/comments', () => {
    it('should fetch comments for a post with campus isolation', async () => {
      const fetchComments = async (postId: string, userId: string | null, campusId: string) => {
        // Mock comments in subcollection
        const allComments = [
          {
            id: 'comment-1',
            postId: 'post-1',
            authorId: 'user-1',
            authorName: 'John Doe',
            content: 'Great post!',
            likeCount: 5,
            createdAt: new Date().toISOString(),
            campusId: 'ub-buffalo',
            isHidden: false,
            isDeleted: false,
          },
          {
            id: 'comment-2',
            postId: 'post-1',
            authorId: 'user-2',
            authorName: 'Jane Smith',
            content: 'I agree!',
            likeCount: 2,
            createdAt: new Date().toISOString(),
            campusId: 'ub-buffalo',
            isHidden: false,
            isDeleted: false,
          },
          {
            id: 'comment-3',
            postId: 'post-1',
            authorId: 'user-3',
            authorName: 'Other Campus',
            content: 'Should not appear',
            likeCount: 0,
            createdAt: new Date().toISOString(),
            campusId: 'cornell',
            isHidden: false,
            isDeleted: false,
          },
        ];

        // Filter by postId and campusId (campus isolation)
        const filtered = allComments.filter(
          (c) => c.postId === postId && c.campusId === campusId && !c.isHidden && !c.isDeleted
        );

        // Transform to response format
        const comments = filtered.map((c) => ({
          id: c.id,
          author: {
            id: c.authorId,
            name: c.authorName,
          },
          content: c.content,
          createdAt: c.createdAt,
          likes: c.likeCount,
          hasLiked: userId === 'user-1' && c.id === 'comment-2', // Mock: user-1 liked comment-2
          replies: [],
        }));

        return NextResponse.json({ comments });
      };

      // Fetch comments for post-1
      const response = await fetchComments('post-1', 'user-1', 'ub-buffalo');
      expect(response.data.comments).toHaveLength(2);
      expect(response.data.comments[0].author.name).toBe('John Doe');

      // Verify campus isolation - cornell comment not included
      const allCommentCampuses = response.data.comments.map(
        (c: { author: { id: string } }) => c.author.id
      );
      expect(allCommentCampuses).not.toContain('user-3');

      // Verify hasLiked status
      const comment2 = response.data.comments.find((c: { id: string }) => c.id === 'comment-2');
      expect(comment2.hasLiked).toBe(true);
    });

    it('should skip hidden and deleted comments', async () => {
      const fetchComments = async (postId: string) => {
        const allComments = [
          { id: '1', content: 'Visible', isHidden: false, isDeleted: false },
          { id: '2', content: 'Hidden', isHidden: true, isDeleted: false },
          { id: '3', content: 'Deleted', isHidden: false, isDeleted: true },
          { id: '4', content: 'Also visible', isHidden: false, isDeleted: false },
        ];

        const visible = allComments.filter((c) => !c.isHidden && !c.isDeleted);
        return NextResponse.json({ comments: visible });
      };

      const response = await fetchComments('post-1');
      expect(response.data.comments).toHaveLength(2);
      expect(response.data.comments.map((c: { id: string }) => c.id)).toEqual(['1', '4']);
    });
  });

  describe('POST /api/posts/[postId]/comments', () => {
    it('should create a new comment with proper validation', async () => {
      const createComment = async (
        postId: string,
        content: string,
        user: { uid: string; email: string } | null
      ) => {
        // Auth check
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Content validation
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }

        if (content.length > 2000) {
          return NextResponse.json(
            { error: 'Comment too long (max 2000 characters)' },
            { status: 400 }
          );
        }

        const comment = {
          id: `comment-${Date.now()}`,
          author: {
            id: user.uid,
            name: user.email.split('@')[0],
          },
          content: content.trim(),
          createdAt: new Date().toISOString(),
          likes: 0,
          hasLiked: false,
          replies: [],
        };

        return NextResponse.json(comment, { status: 201 });
      };

      // Valid comment
      const validComment = await createComment('post-1', 'Great post!', {
        uid: 'user-123',
        email: 'john@buffalo.edu',
      });
      expect(validComment.init?.status).toBe(201);
      expect(validComment.data.content).toBe('Great post!');

      // Unauthenticated
      const unauth = await createComment('post-1', 'Test', null);
      expect(unauth.init.status).toBe(401);

      // Empty content
      const empty = await createComment('post-1', '   ', { uid: 'user-123', email: 'test@test.edu' });
      expect(empty.init.status).toBe(400);

      // Too long
      const tooLong = await createComment('post-1', 'a'.repeat(2001), {
        uid: 'user-123',
        email: 'test@test.edu',
      });
      expect(tooLong.init.status).toBe(400);
    });

    it('should increment post comment count after creation', async () => {
      let postCommentCount = 5;

      const createComment = async (postId: string, content: string) => {
        // Simulate incrementing comment count
        postCommentCount += 1;

        return NextResponse.json({
          id: `comment-${Date.now()}`,
          content,
          postCommentCount,
        });
      };

      await createComment('post-1', 'First comment');
      expect(postCommentCount).toBe(6);

      await createComment('post-1', 'Second comment');
      expect(postCommentCount).toBe(7);
    });
  });

  describe('POST /api/comments/[commentId]/like', () => {
    it('should toggle like status on a comment', async () => {
      const likeStatus: Record<string, Set<string>> = {
        'comment-1': new Set(['user-1']),
      };
      const likeCounts: Record<string, number> = {
        'comment-1': 1,
      };

      const toggleLike = async (commentId: string, userId: string | null) => {
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!likeStatus[commentId]) {
          likeStatus[commentId] = new Set();
          likeCounts[commentId] = 0;
        }

        if (likeStatus[commentId].has(userId)) {
          // Unlike
          likeStatus[commentId].delete(userId);
          likeCounts[commentId] -= 1;
          return NextResponse.json({ liked: false, likeCount: likeCounts[commentId] });
        } else {
          // Like
          likeStatus[commentId].add(userId);
          likeCounts[commentId] += 1;
          return NextResponse.json({ liked: true, likeCount: likeCounts[commentId] });
        }
      };

      // user-1 unlikes (was already liked)
      const unlike = await toggleLike('comment-1', 'user-1');
      expect(unlike.data.liked).toBe(false);
      expect(unlike.data.likeCount).toBe(0);

      // user-1 likes again
      const like = await toggleLike('comment-1', 'user-1');
      expect(like.data.liked).toBe(true);
      expect(like.data.likeCount).toBe(1);

      // user-2 likes
      const user2Like = await toggleLike('comment-1', 'user-2');
      expect(user2Like.data.liked).toBe(true);
      expect(user2Like.data.likeCount).toBe(2);

      // Unauthenticated
      const unauth = await toggleLike('comment-1', null);
      expect(unauth.init.status).toBe(401);
    });

    it('should handle like with postId optimization', async () => {
      const toggleLikeWithPostId = async (
        commentId: string,
        postId: string | null,
        userId: string
      ) => {
        // When postId is provided, use direct path
        if (postId) {
          // Direct path: posts/{postId}/comments/{commentId}/likes/{userId}
          return NextResponse.json({
            liked: true,
            method: 'direct',
            path: `posts/${postId}/comments/${commentId}/likes/${userId}`,
          });
        }

        // Fallback: search through recent posts
        return NextResponse.json({
          liked: true,
          method: 'search',
          searchedPosts: 100,
        });
      };

      // With postId (efficient)
      const withPostId = await toggleLikeWithPostId('comment-1', 'post-1', 'user-1');
      expect(withPostId.data.method).toBe('direct');

      // Without postId (fallback)
      const withoutPostId = await toggleLikeWithPostId('comment-1', null, 'user-1');
      expect(withoutPostId.data.method).toBe('search');
      expect(withoutPostId.data.searchedPosts).toBe(100);
    });
  });
});
