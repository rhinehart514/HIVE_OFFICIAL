'use client';

/**
 * DMConversationList - List of DM conversations in panel
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDM } from '@/contexts/dm-context';
import { Avatar, AvatarFallback, AvatarImage, Text, getInitials } from '@hive/ui/design-system/primitives';

interface DMConversationListProps {
  onSelectConversation?: () => void;
}

export function DMConversationList({ onSelectConversation }: DMConversationListProps) {
  const {
    conversations,
    isLoadingConversations,
    openConversationById,
    getOtherParticipant,
  } = useDM();

  const handleSelect = React.useCallback(
    async (conversationId: string) => {
      await openConversationById(conversationId);
      onSelectConversation?.();
    },
    [openConversationById, onSelectConversation]
  );

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 " style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <MessageSquare className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <Text size="lg" tone="muted" className="mb-2">
          No messages yet
        </Text>
        <Text size="sm" tone="muted">
          Start a conversation by visiting someone's profile and clicking "Message"
        </Text>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        if (!otherParticipant) return null;

        const hasUnread = conversation.unreadCount > 0;

        return (
          <button
            key={conversation.id}
            onClick={() => handleSelect(conversation.id)}
            className={cn(
              'w-full flex items-start gap-3 px-4 py-3',
              'transition-colors hover:bg-white/[0.06]',
              'border-b border-white/[0.06]'
            )}
          >
            {/* Avatar */}
            <Avatar size="default" className="flex-shrink-0">
              {otherParticipant.avatarUrl ? (
                <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              ) : (
                <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
              )}
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p
                  className={cn('text-sm truncate', hasUnread && 'font-semibold')}
                  style={{ color: 'var(--text-primary)' }}
                >
                  {otherParticipant.name}
                </p>
                {conversation.lastMessage?.timestamp && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn('text-sm truncate', hasUnread ? 'text-white' : 'text-white/50')}
                >
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>

                {hasUnread && (
                  <span
                    className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--life-gold)',
                      color: 'var(--bg-base)',
                    }}
                  >
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

DMConversationList.displayName = 'DMConversationList';
