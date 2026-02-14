'use client';

import * as React from 'react';
import { FileText, Heart, MessageSquare, Plus } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Textarea,
  getInitials,
} from '@hive/ui/design-system/primitives';

interface SpacePostsTabProps {
  spaceId: string;
  isMember: boolean;
  onPostCountChange?: (count: number) => void;
}

interface ApiAuthor {
  id?: string;
  fullName?: string;
  handle?: string;
  photoURL?: string;
}

interface ApiPost {
  id: string;
  content?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  commentCount?: number;
  replyCount?: number;
  reactions?: unknown;
  isPinned?: boolean;
  author?: ApiAuthor | null;
  authorName?: string;
  authorAvatarUrl?: string;
}

interface SpacePost {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl?: string;
  commentCount: number;
  reactionCount: number;
  isPinned: boolean;
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (typeof record.toDate === 'function') {
      try {
        const maybeDate = (record.toDate as () => unknown)();
        if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
          return maybeDate;
        }
      } catch {
        // Fall through to other timestamp shapes.
      }
    }

    const seconds =
      typeof record.seconds === 'number'
        ? record.seconds
        : typeof record._seconds === 'number'
          ? record._seconds
          : null;

    if (seconds !== null) {
      return new Date(seconds * 1000);
    }
  }

  return new Date();
}

function getReactionCount(reactions: unknown): number {
  if (Array.isArray(reactions)) {
    return reactions.reduce((total, reaction) => {
      if (!reaction || typeof reaction !== 'object') return total;
      const count = (reaction as Record<string, unknown>).count;
      return total + (typeof count === 'number' ? count : 0);
    }, 0);
  }

  if (reactions && typeof reactions === 'object') {
    return Object.values(reactions as Record<string, unknown>).reduce((total, value) => {
      return total + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  return 0;
}

function normalizePost(post: ApiPost): SpacePost {
  const createdAt = parseDate(post.createdAt ?? post.updatedAt).toISOString();
  const authorName =
    post.author?.fullName ||
    post.authorName ||
    post.author?.handle ||
    'Unknown member';

  return {
    id: post.id,
    content: post.content || '',
    createdAt,
    authorName,
    authorAvatarUrl: post.author?.photoURL || post.authorAvatarUrl,
    commentCount:
      typeof post.commentCount === 'number'
        ? post.commentCount
        : typeof post.replyCount === 'number'
          ? post.replyCount
          : 0,
    reactionCount: getReactionCount(post.reactions),
    isPinned: Boolean(post.isPinned),
  };
}

export function SpacePostsTab({
  spaceId,
  isMember,
  onPostCountChange,
}: SpacePostsTabProps) {
  const [posts, setPosts] = React.useState<SpacePost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/spaces/${spaceId}/posts?limit=20`);
      if (!res.ok) {
        throw new Error('Failed to fetch posts');
      }

      const payload = await res.json();
      const data = payload.data || payload;
      const rawPosts = Array.isArray(data.posts) ? (data.posts as ApiPost[]) : [];
      const normalizedPosts = rawPosts.map(normalizePost);

      setPosts(normalizedPosts);
      onPostCountChange?.(normalizedPosts.length);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load posts');
      setPosts([]);
      onPostCountChange?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, onPostCountChange]);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleCreatePost = React.useCallback(async () => {
    if (!draft.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.trim(),
          type: 'text',
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message =
          payload?.error?.message ||
          payload?.error ||
          payload?.message ||
          'Failed to create post';
        throw new Error(message);
      }

      setDraft('');
      setIsComposerOpen(false);
      await loadPosts();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, loadPosts, spaceId]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-white/50">Posts</h3>
        {isMember && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsComposerOpen((open) => !open)}
          >
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        )}
      </div>

      {isComposerOpen && (
        <div className="mb-5 rounded-lg border border-white/[0.06] bg-white/[0.06] p-4">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share something with the space..."
            rows={4}
            className="min-h-[120px] border border-white/[0.06] bg-transparent"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsComposerOpen(false);
                setDraft('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="cta"
              size="sm"
              loading={isSubmitting}
              onClick={() => {
                void handleCreatePost();
              }}
              disabled={!draft.trim()}
            >
              Post
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/[0.06] bg-white/[0.06] p-5"
            >
              <div className="h-4 w-28 rounded bg-white/[0.06]" />
              <div className="mt-3 h-3 w-full rounded bg-white/[0.06]" />
              <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-white/[0.06]">
            <FileText className="h-7 w-7 text-white/50" />
          </div>
          <h3 className="text-lg font-semibold text-white">No posts yet</h3>
          <p className="mt-2 max-w-md text-sm text-white/50">
            {isMember
              ? 'Start the thread with the first post for this space.'
              : 'No posts are available yet.'}
          </p>
          {isMember && (
            <Button
              variant="cta"
              size="sm"
              className="mt-6"
              onClick={() => setIsComposerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const createdAt = new Date(post.createdAt);
            const createdLabel = Number.isNaN(createdAt.getTime())
              ? 'Recently'
              : createdAt.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });

            return (
              <div
                key={post.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.06] p-5"
              >
                <div className="flex items-start gap-3">
                  <Avatar size="sm" className="mt-0.5">
                    {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} />}
                    <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-white">
                        {post.authorName}
                      </h4>
                      <span className="text-xs text-white/50">{createdLabel}</span>
                      {post.isPinned && (
                        <span className="rounded bg-[var(--life-gold)]/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--life-gold)]">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                      {post.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {post.reactionCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

