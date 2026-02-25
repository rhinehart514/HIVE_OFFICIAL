'use client';

/**
 * ChatMessageList — Scrollable thread with auto-scroll to bottom.
 */

import { useRef, useEffect } from 'react';
import type { QuickTemplate } from '@hive/ui';
import type { ChatMessage } from '@/lib/hivelab/chat-types';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onDeploy?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
  onShare?: (toolId: string) => void;
  onUseTemplate?: (template: QuickTemplate) => void;
  onBuildWithAI?: () => void;
}

export function ChatMessageList({
  messages,
  onDeploy,
  onEdit,
  onShare,
  onUseTemplate,
  onBuildWithAI,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or content updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overscroll-contain px-1"
    >
      <div className="space-y-4 py-4 max-w-2xl mx-auto">
        {messages.map(msg => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            onDeploy={onDeploy}
            onEdit={onEdit}
            onShare={onShare}
            onUseTemplate={onUseTemplate}
            onBuildWithAI={onBuildWithAI}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
