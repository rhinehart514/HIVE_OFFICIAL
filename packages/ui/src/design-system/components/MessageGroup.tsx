'use client';

/**
 * MessageGroup Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Groups consecutive messages from the same author.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChatMessage, type ChatMessageProps } from './ChatMessage';

export interface MessageGroupProps {
  /** Array of messages from the same author */
  messages: ChatMessageProps['message'][];
  /** React callback */
  onReact?: (messageId: string, emoji: string) => void;
  /** Reply callback */
  onReply?: (messageId: string) => void;
  /** Pin callback */
  onPin?: (messageId: string) => void;
  /** Compact mode */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  onReact,
  onReply,
  onPin,
  compact = false,
  className,
}) => {
  if (messages.length === 0) return null;

  return (
    <div className={cn('space-y-0.5', className)}>
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          showAuthor={index === 0}
          showTimestamp={index === 0}
          compact={compact}
          onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
          onReply={onReply ? () => onReply(message.id) : undefined}
          onPin={onPin ? () => onPin(message.id) : undefined}
        />
      ))}
    </div>
  );
};

MessageGroup.displayName = 'MessageGroup';

/**
 * Group messages by author and time proximity
 */
export function groupMessages(
  messages: ChatMessageProps['message'][],
  maxGapMinutes: number = 5
): ChatMessageProps['message'][][] {
  const groups: ChatMessageProps['message'][][] = [];
  let currentGroup: ChatMessageProps['message'][] = [];

  messages.forEach((message, index) => {
    if (index === 0) {
      currentGroup.push(message);
      return;
    }

    const prevMessage = messages[index - 1];
    const sameAuthor = message.author.id === prevMessage.author.id;
    const timeDiff =
      (message.timestamp.getTime() - prevMessage.timestamp.getTime()) / 60000;
    const withinTimeLimit = timeDiff <= maxGapMinutes;

    if (sameAuthor && withinTimeLimit) {
      currentGroup.push(message);
    } else {
      groups.push(currentGroup);
      currentGroup = [message];
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export { MessageGroup };
