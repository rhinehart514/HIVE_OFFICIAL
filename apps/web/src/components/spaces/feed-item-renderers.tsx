'use client';

import * as React from 'react';
import {
  CalendarIcon,
  WrenchScrewdriverIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Button,
} from '@hive/ui/design-system/primitives';
import { formatDistanceToNow } from 'date-fns';
import type { MessageItem, PostItem, EventItem, ToolItem } from './unified-feed-types';

export function MessageFeedItem({
  item,
  onReact,
  onOpenThread,
  canDelete,
  onDelete,
}: {
  item: MessageItem;
  onReact?: (messageId: string, emoji: string) => void;
  onOpenThread?: (messageId: string) => void;
  canDelete?: boolean;
  onDelete?: (messageId: string) => Promise<void>;
}) {
  const [showActions, setShowActions] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [item.timestamp]);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-white/[0.01] group relative">
      <Avatar size="sm" className="flex-shrink-0 mt-0.5">
        {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} />}
        <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <Text size="sm" weight="medium" className="text-white">
            {item.authorName}
          </Text>
          <Text size="xs" className="text-white/30">
            {timeAgo}
          </Text>
        </div>

        <Text size="sm" className="text-white/70 mb-2 break-words">
          {item.content}
        </Text>

        {item.reactions && item.reactions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {item.reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => onReact?.(item.id, reaction.emoji)}
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  'flex items-center gap-1',
                  'transition-colors duration-150',
                  reaction.userReacted
                    ? 'bg-white/[0.05] text-white'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.05]'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {item.threadCount && item.threadCount > 0 && onOpenThread && (
          <button
            onClick={() => onOpenThread(item.id)}
            className="text-xs text-white/50 hover:text-white/70 transition-colors"
          >
            {item.threadCount} {item.threadCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {canDelete && onDelete && (
        <div className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className={cn(
                'p-1.5 rounded hover:bg-white/[0.05] transition-colors',
                'text-white/50 hover:text-white/70'
              )}
            >
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className={cn(
                  'absolute right-0 top-full mt-1 z-20',
                  'bg-[var(--bg-elevated)] border border-white/[0.05] rounded-lg',
                  'py-1 min-w-[120px]'
                )}>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm',
                      'text-red-400 hover:bg-red-500/10',
                      'flex items-center gap-2',
                      'disabled:opacity-50'
                    )}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EventFeedItem({
  item,
  onRsvp,
}: {
  item: EventItem;
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
}) {
  const eventDate = React.useMemo(() => {
    try {
      const date = new Date(item.startDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'TBD';
    }
  }, [item.startDate]);

  return (
    <div className="mx-4 my-3 rounded-lg border border-[var(--color-gold)]/[0.12] bg-[var(--color-gold)]/[0.05] p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-gold)]/[0.10] flex items-center justify-center flex-shrink-0">
          <CalendarIcon className="w-5 h-5 text-[var(--color-gold)]/80" />
        </div>
        <div className="flex-1 min-w-0">
          <Text weight="medium" className="text-white mb-1">
            {item.title}
          </Text>
          {item.description && (
            <Text size="sm" className="text-white/50 line-clamp-2">
              {item.description}
            </Text>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-white/50">
        <span>{eventDate}</span>
        {item.location && <span>• {item.location}</span>}
        <span>• {item.rsvpCount} going</span>
      </div>

      {onRsvp && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={item.userRsvp === 'going' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'going')}
            className="flex-1"
          >
            <CheckIcon className="w-3.5 h-3.5 mr-1" />
            Going
          </Button>
          <Button
            size="sm"
            variant={item.userRsvp === 'maybe' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'maybe')}
            className="flex-1"
          >
            Maybe
          </Button>
          <Button
            size="sm"
            variant={item.userRsvp === 'not_going' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'not_going')}
            className="flex-1"
          >
            <XMarkIcon className="w-3.5 h-3.5 mr-1" />
            Can't go
          </Button>
        </div>
      )}
    </div>
  );
}

export function ToolFeedItem({
  item,
  onRun,
}: {
  item: ToolItem;
  onRun?: (toolId: string, placementId: string) => void;
}) {
  return (
    <div className="mx-4 my-3 p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#FFD700]/[0.10] flex items-center justify-center flex-shrink-0">
          <WrenchScrewdriverIcon className="w-5 h-5 text-[#FFD700]/70" />
        </div>

        <div className="flex-1 min-w-0">
          <Text weight="medium" className="text-white mb-1">
            {item.name}
          </Text>
          {item.description && (
            <Text size="sm" className="text-white/50 mb-2 line-clamp-2">
              {item.description}
            </Text>
          )}
          <Text size="xs" className="text-white/50 mb-3">
            Deployed by {item.deployedBy}
            {item.responseCount && ` • ${item.responseCount} responses`}
          </Text>

          {onRun && (
            <Button
              size="sm"
              onClick={() => onRun(item.toolId, item.placementId)}
            >
              Run App
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PostFeedItem({
  item,
  onReply,
}: {
  item: PostItem;
  onReply?: (postId: string) => void;
}) {
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [item.timestamp]);

  return (
    <div className="px-4 py-4 border-b border-white/[0.05]">
      <div className="flex items-start gap-3 mb-3">
        <Avatar size="sm" className="flex-shrink-0">
          {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} />}
          <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text size="sm" weight="medium" className="text-white">
              {item.authorName}
            </Text>
            <Text size="xs" className="text-white/30">
              {timeAgo}
            </Text>
            {item.isPinned && (
              <span className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--color-gold)]/[0.10] text-[var(--color-gold)]/80 rounded">
                PINNED
              </span>
            )}
          </div>
          {item.title && (
            <Text weight="medium" className="text-white mb-2">
              {item.title}
            </Text>
          )}
          <Text size="sm" className="text-white/70">
            {item.content}
          </Text>
        </div>
      </div>

      {item.replyCount && item.replyCount > 0 && onReply && (
        <button
          onClick={() => onReply(item.id)}
          className="ml-11 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
}
