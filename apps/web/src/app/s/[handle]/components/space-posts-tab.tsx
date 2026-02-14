'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Image as ImageIcon,
  MoreHorizontal,
} from 'lucide-react';
import { Button, Input } from '@hive/ui/design-system/primitives';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { cn } from '@/lib/utils';

type PostType = 'text' | 'image' | 'link' | 'tool';

interface SpacePostAuthor {
  id?: string;
  fullName?: string;
  handle?: string;
  photoURL?: string | null;
}

interface SpacePost {
  id: string;
  authorId?: string;
  author?: SpacePostAuthor | null;
  content: string;
  type: PostType;
  imageUrl?: string | null;
  linkUrl?: string | null;
  toolId?: string | null;
  reactions?: Record<string, number>;
  reactedUsers?: Record<string, string[]>;
  commentCount?: number;
  createdAt?: unknown;
}

interface SpaceCommentAuthor {
  id?: string;
  fullName?: string;
  handle?: string;
  photoURL?: string | null;
}

interface SpaceComment {
  id: string;
  authorId?: string;
  author?: SpaceCommentAuthor | null;
  content: string;
  replies?: SpaceComment[];
  createdAt?: unknown;
}

interface PostsPage {
  posts: SpacePost[];
  hasMore: boolean;
  lastPostId: string | null;
}

interface SpacePostsQueryData {
  pages: PostsPage[];
}

interface CreatePostInput {
  content: string;
  type: PostType;
  imageUrl?: string;
  linkUrl?: string;
  toolId?: string;
}

interface ReactionResult {
  reactionKey: string;
  reactions: Record<string, number>;
  userReacted?: boolean;
}

export interface SpacePostsTabProps {
  spaceId: string;
  currentUserId?: string;
}

const POSTS_LIMIT = 20;

const POST_TYPE_META: Record<
  PostType,
  {
    label: string;
    icon: typeof FileText;
  }
> = {
  text: { label: 'Text', icon: FileText },
  image: { label: 'Image', icon: ImageIcon },
  link: { label: 'Link', icon: LinkIcon },
  tool: { label: 'Tool', icon: MoreHorizontal },
};

const REACTION_EMOJI_MAP: Record<string, string> = {
  heart: '❤️',
  like: '👍',
  thumbs_up: '👍',
  laugh: '😂',
  fire: '🔥',
  celebrate: '🎉',
  clap: '👏',
};

function unwrapData<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const maybeError = body as {
      error?: string | { message?: string };
      message?: string;
    };
    if (typeof maybeError.error === 'string') return maybeError.error;
    if (typeof maybeError.error === 'object' && maybeError.error && typeof maybeError.error.message === 'string') {
      return maybeError.error.message;
    }
    if (typeof maybeError.message === 'string') return maybeError.message;
  }
  return fallback;
}

async function fetchPostsPage(spaceId: string, lastPostId?: string): Promise<PostsPage> {
  const params = new URLSearchParams({ limit: String(POSTS_LIMIT) });
  if (lastPostId) {
    params.set('lastPostId', lastPostId);
  }

  const response = await secureApiFetch(`/api/spaces/${spaceId}/posts?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to fetch posts'));
  }

  const payload = unwrapData<Partial<PostsPage>>(await response.json());
  return {
    posts: Array.isArray(payload.posts) ? payload.posts : [],
    hasMore: Boolean(payload.hasMore),
    lastPostId: typeof payload.lastPostId === 'string' ? payload.lastPostId : null,
  };
}

async function createSpacePost(spaceId: string, input: CreatePostInput): Promise<SpacePost> {
  const payload: Record<string, string> = {
    content: input.content,
    type: input.type,
  };

  if (input.type === 'image' && input.imageUrl) payload.imageUrl = input.imageUrl;
  if (input.type === 'link' && input.linkUrl) payload.linkUrl = input.linkUrl;
  if (input.type === 'tool' && input.toolId) payload.toolId = input.toolId;

  const response = await secureApiFetch(`/api/spaces/${spaceId}/posts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to create post'));
  }

  const json = await response.json();
  const data = unwrapData<{ post?: SpacePost } & Partial<SpacePost>>(json);
  return (data.post || data) as SpacePost;
}

async function toggleSpacePostReaction(
  spaceId: string,
  postId: string,
  reactionKey: string
): Promise<ReactionResult> {
  const normalizedKey = normalizeReactionKey(reactionKey);
  const emoji = reactionToEmoji(reactionKey);
  const response = await secureApiFetch(`/api/spaces/${spaceId}/posts/${postId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({
      emoji,
      type: normalizedKey,
      action: 'toggle',
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to update reaction'));
  }

  const payload = unwrapData<{
    reactions?: Record<string, number>;
    userReacted?: boolean;
  }>(await response.json());

  return {
    reactionKey: normalizedKey,
    reactions: payload.reactions || {},
    userReacted: payload.userReacted,
  };
}

async function fetchPostComments(spaceId: string, postId: string): Promise<SpaceComment[]> {
  const response = await secureApiFetch(`/api/spaces/${spaceId}/posts/${postId}/comments`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Failed to load comments'));
  }
  const payload = unwrapData<{ comments?: SpaceComment[] }>(await response.json());
  return Array.isArray(payload.comments) ? payload.comments : [];
}

function mergeUniquePosts(pages: PostsPage[]): SpacePost[] {
  const seen = new Set<string>();
  const merged: SpacePost[] = [];

  for (const page of pages) {
    for (const post of page.posts) {
      if (!post?.id || seen.has(post.id)) continue;
      seen.add(post.id);
      merged.push(post);
    }
  }

  return merged;
}

function updatePostInPages(
  data: SpacePostsQueryData | undefined,
  postId: string,
  updater: (post: SpacePost) => SpacePost
): SpacePostsQueryData | undefined {
  if (!data) return data;

  return {
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map((post) => (post.id === postId ? updater(post) : post)),
    })),
  };
}

function normalizeReactionKey(value: string): string {
  const key = value.trim().toLowerCase();
  if (key === '❤️' || key === '❤' || key === '♥' || key === 'heart') return 'heart';
  return key;
}

function reactionToEmoji(reactionKey: string): string {
  const normalized = normalizeReactionKey(reactionKey);
  return REACTION_EMOJI_MAP[normalized] || reactionKey;
}

function getReactionEntries(post: SpacePost, currentUserId?: string) {
  const source = post.reactions || {};
  const reactedUsers = post.reactedUsers || {};
  const entries = Object.entries(source)
    .map(([key, value]) => {
      const count = Number(value || 0);
      const users = reactedUsers[key] || [];
      return {
        key,
        count: Number.isFinite(count) ? count : 0,
        emoji: reactionToEmoji(key),
        hasReacted: Boolean(currentUserId && users.includes(currentUserId)),
      };
    })
    .filter((entry) => entry.count > 0);

  if (entries.length > 0) return entries;

  const fallbackKey = 'heart';
  return [
    {
      key: fallbackKey,
      count: Number(post.reactions?.[fallbackKey] || 0),
      emoji: reactionToEmoji(fallbackKey),
      hasReacted: Boolean(currentUserId && (post.reactedUsers?.[fallbackKey] || []).includes(currentUserId)),
    },
  ];
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    };

    if (typeof maybeTimestamp.toDate === 'function') {
      const asDate = maybeTimestamp.toDate();
      return Number.isNaN(asDate.getTime()) ? null : asDate;
    }

    const seconds =
      typeof maybeTimestamp.seconds === 'number'
        ? maybeTimestamp.seconds
        : typeof maybeTimestamp._seconds === 'number'
          ? maybeTimestamp._seconds
          : null;

    if (typeof seconds === 'number') {
      const nanos =
        typeof maybeTimestamp.nanoseconds === 'number'
          ? maybeTimestamp.nanoseconds
          : typeof maybeTimestamp._nanoseconds === 'number'
            ? maybeTimestamp._nanoseconds
            : 0;
      return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
    }
  }
  return null;
}

function formatRelativeTimestamp(value: unknown): string {
  const parsed = toDate(value);
  if (!parsed) return 'just now';

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs <= 0) return 'just now';

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAuthorName(post: SpacePost): string {
  return post.author?.fullName || post.author?.handle || 'Unknown member';
}

function getAuthorAvatar(post: SpacePost): string | null {
  return post.author?.photoURL || null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function getCommentCount(post: SpacePost): number {
  return Number(post.commentCount || 0);
}

function formatLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function CommentNode({ comment, depth = 0 }: { comment: SpaceComment; depth?: number }) {
  const authorName = comment.author?.fullName || comment.author?.handle || 'Unknown member';
  const avatar = comment.author?.photoURL || null;
  const timeLabel = formatRelativeTimestamp(comment.createdAt);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3',
          depth > 0 ? 'ml-6' : ''
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="h-7 w-7 overflow-hidden rounded-full bg-white/[0.08]">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={authorName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/70">
                {getInitials(authorName)}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-white">{authorName}</p>
          <p className="text-xs text-white/50">{timeLabel}</p>
        </div>
        <p className="whitespace-pre-wrap text-sm text-white/80">{comment.content}</p>
      </div>

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCommentsThread({
  spaceId,
  postId,
}: {
  spaceId: string;
  postId: string;
}) {
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['space-post-comments', spaceId, postId],
    queryFn: () => fetchPostComments(spaceId, postId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
        {(error as Error).message || 'Failed to load comments'}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/50">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

export function SpacePostsTab({ spaceId, currentUserId }: SpacePostsTabProps) {
  const queryClient = useQueryClient();
  const queryKey = React.useMemo(() => ['space-posts', spaceId] as const, [spaceId]);

  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [composerType, setComposerType] = React.useState<PostType>('text');
  const [composerContent, setComposerContent] = React.useState('');
  const [composerLinkOrImageUrl, setComposerLinkOrImageUrl] = React.useState('');
  const [composerToolId, setComposerToolId] = React.useState('');
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadMoreError, setLoadMoreError] = React.useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = React.useState<Set<string>>(new Set());

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<SpacePostsQueryData>({
    queryKey,
    queryFn: async () => ({ pages: [await fetchPostsPage(spaceId)] }),
    enabled: Boolean(spaceId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const pages = data?.pages || [];
  const posts = React.useMemo(() => mergeUniquePosts(pages), [pages]);
  const hasMore = pages.length > 0 ? Boolean(pages[pages.length - 1]?.hasMore) : false;

  const createMutation = useMutation({
    mutationFn: (input: CreatePostInput) => createSpacePost(spaceId, input),
    onSuccess: (newPost) => {
      queryClient.setQueryData<SpacePostsQueryData>(queryKey, (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pages: [
              {
                posts: [newPost],
                hasMore: false,
                lastPostId: newPost.id,
              },
            ],
          };
        }

        const firstPage = old.pages[0];
        return {
          pages: [
            {
              ...firstPage,
              posts: [newPost, ...firstPage.posts.filter((post) => post.id !== newPost.id)],
            },
            ...old.pages.slice(1),
          ],
        };
      });

      setComposerContent('');
      setComposerLinkOrImageUrl('');
      setComposerToolId('');
      setComposerType('text');
      setIsComposerOpen(false);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reactionKey }: { postId: string; reactionKey: string }) =>
      toggleSpacePostReaction(spaceId, postId, reactionKey),
    onMutate: async ({ postId, reactionKey }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<SpacePostsQueryData>(queryKey);
      if (!previousData || !currentUserId) {
        return { previousData };
      }

      const normalizedKey = normalizeReactionKey(reactionKey);

      queryClient.setQueryData<SpacePostsQueryData>(queryKey, (old) =>
        updatePostInPages(old, postId, (post) => {
          const reactions = { ...(post.reactions || {}) };
          const reactedUsers = { ...(post.reactedUsers || {}) };

          const existingUsers = new Set<string>(reactedUsers[normalizedKey] || []);
          const hasReacted = existingUsers.has(currentUserId);
          if (hasReacted) {
            existingUsers.delete(currentUserId);
          } else {
            existingUsers.add(currentUserId);
          }

          const nextCount = Math.max(
            0,
            Number(reactions[normalizedKey] || 0) + (hasReacted ? -1 : 1)
          );

          reactions[normalizedKey] = nextCount;
          reactedUsers[normalizedKey] = Array.from(existingUsers);

          return {
            ...post,
            reactions,
            reactedUsers,
          };
        })
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData<SpacePostsQueryData>(queryKey, (old) =>
        updatePostInPages(old, variables.postId, (post) => {
          const nextReactions = {
            ...(post.reactions || {}),
            ...result.reactions,
          };

          if (!currentUserId) {
            return {
              ...post,
              reactions: nextReactions,
            };
          }

          const reactionKey = result.reactionKey;
          const currentUsers = new Set<string>((post.reactedUsers?.[reactionKey] || []) as string[]);
          if (typeof result.userReacted === 'boolean') {
            if (result.userReacted) currentUsers.add(currentUserId);
            if (!result.userReacted) currentUsers.delete(currentUserId);
          }

          return {
            ...post,
            reactions: nextReactions,
            reactedUsers: {
              ...(post.reactedUsers || {}),
              [reactionKey]: Array.from(currentUsers),
            },
          };
        })
      );
    },
  });

  const handleLoadMore = React.useCallback(async () => {
    if (isLoadingMore) return;

    const current = queryClient.getQueryData<SpacePostsQueryData>(queryKey);
    const lastPage = current?.pages[current.pages.length - 1];
    if (!lastPage?.hasMore || !lastPage.lastPostId) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const nextPage = await fetchPostsPage(spaceId, lastPage.lastPostId);
      queryClient.setQueryData<SpacePostsQueryData>(queryKey, (old) => {
        if (!old) return { pages: [nextPage] };
        return { pages: [...old.pages, nextPage] };
      });
    } catch (loadError) {
      setLoadMoreError(
        loadError instanceof Error ? loadError.message : 'Failed to load more posts'
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, queryClient, queryKey, spaceId]);

  const handleCreatePost = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedContent = composerContent.trim();
      const trimmedUrl = composerLinkOrImageUrl.trim();
      const trimmedToolId = composerToolId.trim();

      if (!trimmedContent) return;
      if ((composerType === 'image' || composerType === 'link') && !trimmedUrl) return;

      const input: CreatePostInput = {
        content: trimmedContent,
        type: composerType,
      };

      if (composerType === 'image') input.imageUrl = trimmedUrl;
      if (composerType === 'link') input.linkUrl = trimmedUrl;
      if (composerType === 'tool' && trimmedToolId) input.toolId = trimmedToolId;

      createMutation.mutate(input);
    },
    [composerContent, composerLinkOrImageUrl, composerToolId, composerType, createMutation]
  );

  const toggleComments = React.useCallback((postId: string) => {
    setExpandedPosts((previous) => {
      const next = new Set(previous);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  return (
    <section className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Posts</h2>
          <p className="text-sm text-white/50">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsComposerOpen((value) => !value)}
        >
          New Post
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isComposerOpen && (
          <motion.form
            key="composer"
            onSubmit={handleCreatePost}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.06] p-4"
          >
            <div className="grid gap-3">
              <Input
                value={composerContent}
                onChange={(event) => setComposerContent(event.target.value)}
                placeholder="Share an update with your space"
                maxLength={2000}
              />

              <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <select
                  value={composerType}
                  onChange={(event) => {
                    setComposerType(event.target.value as PostType);
                    setComposerLinkOrImageUrl('');
                    setComposerToolId('');
                  }}
                  className="h-11 rounded-[12px] border border-white/[0.08] bg-[#0A0A0A] px-3 text-sm text-white outline-none transition focus:border-white/[0.2]"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="link">Link</option>
                  <option value="tool">Tool</option>
                </select>

                {(composerType === 'image' || composerType === 'link') && (
                  <Input
                    type="url"
                    placeholder={
                      composerType === 'image'
                        ? 'Image URL (https://...)'
                        : 'Link URL (https://...)'
                    }
                    value={composerLinkOrImageUrl}
                    onChange={(event) => setComposerLinkOrImageUrl(event.target.value)}
                  />
                )}

                {composerType === 'tool' && (
                  <Input
                    placeholder="Tool ID (optional)"
                    value={composerToolId}
                    onChange={(event) => setComposerToolId(event.target.value)}
                  />
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={createMutation.isPending}
                  disabled={
                    !composerContent.trim() ||
                    ((composerType === 'image' || composerType === 'link') &&
                      !composerLinkOrImageUrl.trim())
                  }
                >
                  Publish
                </Button>
              </div>
              {createMutation.error && (
                <p className="text-sm text-red-300">
                  {(createMutation.error as Error).message || 'Could not create post'}
                </p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          <p className="mb-3">{(error as Error).message || 'Failed to load posts'}</p>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.06] px-6 py-16 text-center"
        >
          <div className="mb-4 rounded-full bg-white/[0.06] p-4">
            <FileText className="h-8 w-8 text-white/50" />
          </div>
          <h3 className="mb-1 text-xl font-semibold text-white">No posts yet</h3>
          <p className="mb-6 text-sm text-white/50">Share something with your space</p>
          <Button variant="primary" size="sm" onClick={() => setIsComposerOpen(true)}>
            New Post
          </Button>
        </motion.div>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05 },
              },
            }}
            className="space-y-3"
          >
            {posts.map((post) => {
              const authorName = getAuthorName(post);
              const authorAvatar = getAuthorAvatar(post);
              const reactionEntries = getReactionEntries(post, currentUserId);
              const commentCount = getCommentCount(post);
              const postTypeMeta = POST_TYPE_META[post.type] || POST_TYPE_META.text;
              const isCommentsOpen = expandedPosts.has(post.id);
              const BadgeIcon = postTypeMeta.icon;

              return (
                <motion.article
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-white/[0.08]">
                        {authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                            {getInitials(authorName)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{authorName}</p>
                        <p className="text-xs text-white/50">
                          {formatRelativeTimestamp(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-xs text-white/70">
                      <BadgeIcon className="h-3.5 w-3.5" />
                      {postTypeMeta.label}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                    {post.content}
                  </p>

                  {post.type === 'image' && post.imageUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="max-h-[360px] w-full object-cover"
                      />
                    </div>
                  )}

                  {post.type === 'link' && post.linkUrl && (
                    <a
                      href={post.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block rounded-xl border border-white/[0.08] bg-black/30 p-3 transition hover:border-white/[0.14]"
                    >
                      <div className="mb-1 flex items-center gap-2 text-sm text-white/90">
                        <LinkIcon className="h-4 w-4 text-white/50" />
                        <span className="truncate">{post.linkUrl}</span>
                      </div>
                      <p className="text-xs text-white/50">{formatLinkHost(post.linkUrl)}</p>
                    </a>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {reactionEntries.map((entry) => (
                      <button
                        key={`${post.id}-${entry.key}`}
                        type="button"
                        onClick={() =>
                          reactionMutation.mutate({
                            postId: post.id,
                            reactionKey: entry.key,
                          })
                        }
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition',
                          entry.hasReacted
                            ? 'border-white/20 bg-white/[0.12] text-white'
                            : 'border-white/[0.08] bg-black/30 text-white/70 hover:bg-white/[0.08]'
                        )}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        <span>{entry.emoji}</span>
                        <span>{entry.count}</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-xs transition',
                        isCommentsOpen
                          ? 'text-white'
                          : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                      )}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{commentCount}</span>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isCommentsOpen && (
                      <motion.div
                        key={`comments-${post.id}`}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <PostCommentsThread spaceId={spaceId} postId={post.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </motion.div>

          <div className="mt-5 space-y-2 text-center">
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLoadMore()}
                loading={isLoadingMore}
              >
                Load more
              </Button>
            )}
            {loadMoreError && <p className="text-sm text-red-300">{loadMoreError}</p>}
          </div>
        </>
      )}
    </section>
  );
}
