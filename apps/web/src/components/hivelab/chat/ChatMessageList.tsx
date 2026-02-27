'use client';

/**
 * ChatMessageList — Scrollable thread with auto-scroll to bottom.
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { QuickTemplate } from '@hive/ui';
import type { ChatMessage } from '@/lib/hivelab/chat-types';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  onDeploy?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
  onShare?: (toolId: string) => void;
  onUseTemplate?: (template: QuickTemplate) => void;
  onBuildWithAI?: () => void;
}

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2"
    >
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.04] border border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-white/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ChatMessageList({
  messages,
  isThinking,
  onDeploy,
  onEdit,
  onShare,
  onUseTemplate,
  onBuildWithAI,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or thinking state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) return null;

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
        {isThinking && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
