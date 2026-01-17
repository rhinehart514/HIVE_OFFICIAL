'use client';

/**
 * PostCard Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Feed post card with content, media, and interactions.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT POST CARD:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐  Jane Doe              @jane  ·  2h ago                       │
 * │  │ AV │  UB Coders Space                                               │
 * │  └────┘                                                                │
 * │                                                                         │
 * │  Just shipped a new feature for our campus app! Check out the          │
 * │  live demo and let me know what you think. 🚀                          │
 * │                                                                         │
 * │  ┌─────────────────────────────────────────────────────────────────┐   │
 * │  │                                                                 │   │
 * │  │                     [MEDIA/IMAGE]                              │   │
 * │  │                                                                 │   │
 * │  └─────────────────────────────────────────────────────────────────┘   │
 * │                                                                         │
 * │  ❤️ 24    💬 8 replies    🔄 3    📤                                    │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * HEADER STRUCTURE:
 * - 40x40 Avatar (rounded-xl)
 * - Name: text-sm font-medium, hover:underline
 * - Handle: text-sm text-muted
 * - Timestamp: text-sm text-muted, relative ("2h ago")
 * - Source space (optional): text-xs text-muted
 * - More menu: ···
 *
 * CONTENT AREA:
 * - Text: text-sm, whitespace-pre-wrap
 * - Mentions: text-gold, hover:underline
 * - Hashtags: text-gold, hover:underline
 * - Links: text-gold, hover:underline
 * - Max lines: 5 (expandable "...more")
 *
 * MEDIA TYPES:
 * - Single image: Full width, aspect-video, rounded-xl
 * - Multiple images: 2x2 grid
 * - Video: With play button overlay
 * - Link preview: Card with title, description, image
 * - Tool embed: Interactive tool preview
 *
 * ACTION BAR:
 * - Like: ❤️ (hollow) → ❤️ (filled, red) + count
 * - Comment: 💬 + count
 * - Repost: 🔄 + count
 * - Share: 📤
 * - Spacing: gap-6 between actions
 *
 * VARIANTS:
 * 1. default: Standard feed card
 * 2. compact: Less padding, smaller media
 * 3. detailed: Shows more metadata
 * 4. embedded: For embedding in other contexts
 *
 * STATES:
 * - Default: Standard styling
 * - Hover: Subtle bg-hover
 * - Pinned: Pin icon + "Pinned" badge
 * - Thread: Connected to parent/children
 *
 * SKELETON:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐  ████████████  ·  ██████                                       │
 * │  │ ▓▓ │                                                                │
 * │  └────┘                                                                │
 * │  ████████████████████████████████████████████████████████████          │
 * │  ██████████████████████████████████████                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { SimpleAvatar, getInitials } from '../primitives/Avatar';

const postCardVariants = cva(
  'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl overflow-hidden transition-colors',
  {
    variants: {
      variant: {
        default: 'p-4',
        compact: 'p-3',
        detailed: 'p-5',
        embedded: 'p-3 border-none bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface PostAuthor {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
}

export interface PostMedia {
  type: 'image' | 'video' | 'link' | 'tool';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  aspectRatio?: number;
}

export interface PostCardProps extends VariantProps<typeof postCardVariants> {
  /** Post ID */
  id: string;
  /** Post author */
  author: PostAuthor;
  /** Post content text */
  content: string;
  /** Post timestamp */
  timestamp: Date | string;
  /** Media attachments */
  media?: PostMedia[];
  /** Source space */
  space?: { id: string; name: string };
  /** Like count */
  likeCount?: number;
  /** Reply count */
  replyCount?: number;
  /** Repost count */
  repostCount?: number;
  /** Is liked by current user */
  isLiked?: boolean;
  /** Is reposted by current user */
  isReposted?: boolean;
  /** Is pinned */
  isPinned?: boolean;
  /** On like */
  onLike?: () => void;
  /** On reply */
  onReply?: () => void;
  /** On repost */
  onRepost?: () => void;
  /** On share */
  onShare?: () => void;
  /** On author click */
  onAuthorClick?: () => void;
  /** On post click */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format count
 */
function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * PostCard - Feed post display
 */
const PostCard: React.FC<PostCardProps> = ({
  variant = 'default',
  id,
  author,
  content,
  timestamp,
  media,
  space,
  likeCount = 0,
  replyCount = 0,
  repostCount = 0,
  isLiked = false,
  isReposted = false,
  isPinned = false,
  onLike,
  onReply,
  onRepost,
  onShare,
  onAuthorClick,
  onClick,
  loading = false,
  className,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Loading skeleton
  if (loading) {
    return <PostCardSkeleton variant={variant ?? undefined} className={className} />;
  }

  // Check if content should be truncated
  const shouldTruncate = content.length > 280 && !expanded;
  const displayContent = shouldTruncate
    ? content.slice(0, 280) + '...'
    : content;

  return (
    <article
      className={cn(
        postCardVariants({ variant }),
        onClick && 'cursor-pointer hover:bg-[var(--color-bg-hover)]',
        className
      )}
      onClick={onClick}
    >
      {/* Pinned indicator */}
      {isPinned && (
        <div className="flex items-center gap-2 mb-3 text-[var(--color-text-muted)]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M16 3H8c-1.1 0-2 .9-2 2v16l6-3 6 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          <Text size="xs" tone="muted">Pinned</Text>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <SimpleAvatar
          src={author.avatar}
          fallback={getInitials(author.name)}
          size="default"
          onClick={() => onAuthorClick?.()}
          className="cursor-pointer"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick?.();
              }}
              className="hover:underline"
            >
              <Text size="sm" weight="medium">
                {author.name}
              </Text>
            </button>
            <Text size="sm" tone="muted">
              @{author.handle}
            </Text>
            <Text size="sm" tone="muted">·</Text>
            <Text size="sm" tone="muted">
              {formatRelativeTime(timestamp)}
            </Text>
          </div>

          {space && (
            <Text size="xs" tone="muted">
              in {space.name}
            </Text>
          )}
        </div>

        {/* More menu */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-muted)]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <Text size="sm" className="whitespace-pre-wrap">
          {displayContent}
        </Text>
        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="text-life-gold text-sm hover:underline mt-1"
          >
            Show more
          </button>
        )}
      </div>

      {/* Media */}
      {media && media.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden">
          {media.length === 1 ? (
            <MediaPreview media={media[0]} />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {media.slice(0, 4).map((m, i) => (
                <MediaPreview key={i} media={m} compact />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-1">
        {/* Like */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike?.();
          }}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            isLiked ? 'text-red-500' : 'text-[var(--color-text-muted)] hover:text-red-500'
          )}
        >
          {isLiked ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          )}
          {likeCount > 0 && (
            <Text size="xs">{formatCount(likeCount)}</Text>
          )}
        </button>

        {/* Reply */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReply?.();
          }}
          className="flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-blue-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {replyCount > 0 && (
            <Text size="xs">{formatCount(replyCount)}</Text>
          )}
        </button>

        {/* Repost */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRepost?.();
          }}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            isReposted ? 'text-green-500' : 'text-[var(--color-text-muted)] hover:text-green-500'
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
          {repostCount > 0 && (
            <Text size="xs">{formatCount(repostCount)}</Text>
          )}
        </button>

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare?.();
          }}
          className="flex items-center text-[var(--color-text-muted)] hover:text-white transition-colors ml-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </button>
      </div>
    </article>
  );
};

PostCard.displayName = 'PostCard';

/**
 * MediaPreview - Single media item
 */
const MediaPreview: React.FC<{ media: PostMedia; compact?: boolean }> = ({
  media,
  compact = false,
}) => {
  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt=""
        className={cn(
          'w-full object-cover',
          compact ? 'aspect-square' : 'aspect-video'
        )}
      />
    );
  }

  if (media.type === 'video') {
    return (
      <div className={cn('relative', compact ? 'aspect-square' : 'aspect-video')}>
        <img
          src={media.thumbnailUrl || media.url}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (media.type === 'link') {
    return (
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        {media.thumbnailUrl && (
          <img
            src={media.thumbnailUrl}
            alt=""
            className="w-full aspect-[2/1] object-cover"
          />
        )}
        <div className="p-3">
          {media.title && (
            <Text size="sm" weight="medium" className="line-clamp-1">
              {media.title}
            </Text>
          )}
          {media.description && (
            <Text size="xs" tone="muted" className="line-clamp-2 mt-1">
              {media.description}
            </Text>
          )}
          <Text size="xs" tone="muted" className="mt-2">
            {new URL(media.url).hostname}
          </Text>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * PostCardSkeleton - Loading state
 */
const PostCardSkeleton: React.FC<{ variant?: 'default' | 'compact' | 'detailed' | 'embedded'; className?: string }> = ({
  variant = 'default',
  className,
}) => (
  <div className={cn(postCardVariants({ variant }), 'animate-pulse', className)}>
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-hover)]" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-4 w-24 bg-[var(--color-bg-hover)] rounded" />
          <div className="h-4 w-16 bg-[var(--color-bg-hover)] rounded" />
        </div>
        <div className="h-3 w-12 bg-[var(--color-bg-hover)] rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-4 w-full bg-[var(--color-bg-hover)] rounded" />
      <div className="h-4 w-4/5 bg-[var(--color-bg-hover)] rounded" />
    </div>
    <div className="flex gap-6">
      <div className="h-4 w-8 bg-[var(--color-bg-hover)] rounded" />
      <div className="h-4 w-8 bg-[var(--color-bg-hover)] rounded" />
      <div className="h-4 w-8 bg-[var(--color-bg-hover)] rounded" />
    </div>
  </div>
);

PostCardSkeleton.displayName = 'PostCardSkeleton';

export { PostCard, PostCardSkeleton };
