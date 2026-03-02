'use client';

/**
 * ChatMessageBubble — Routes message type to correct renderer.
 *
 * Handles: text, tool-preview, template-suggestion, status, deploy-confirm.
 */

import { motion } from 'framer-motion';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '@/lib/hivelab/chat-types';
import { ToolPreviewCard } from './ToolPreviewCard';

const EASE = [0.22, 1, 0.36, 1] as const;

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onDeploy?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
  onShare?: (toolId: string) => void;
  onUseTemplate?: (template: unknown) => void;
  onBuildWithAI?: () => void;
}

export function ChatMessageBubble({
  message,
  onDeploy,
  onEdit,
  onShare,
  onUseTemplate: _onUseTemplate,
  onBuildWithAI: _onBuildWithAI,
}: ChatMessageBubbleProps) {
  // User messages
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-md
          bg-white/[0.08] text-white text-[15px] leading-relaxed">
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Status messages (system)
  if (message.type === 'status') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex justify-center"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-white/[0.04] text-white/40 text-xs">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Template suggestion (template system removed — fall through to default text)

  // Tool preview (streaming / complete / error)
  if (message.type === 'tool-preview' && message.toolPreview) {
    const { toolPreview } = message;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-full"
      >
        {/* Status line */}
        <div className="flex items-center gap-2 mb-2">
          {toolPreview.phase === 'complete' ? (
            <Check className="w-3.5 h-3.5 text-white/50" />
          ) : toolPreview.phase === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400/60" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white/30" />
            </motion.div>
          )}
          <span
            className={`text-xs ${
              toolPreview.phase === 'complete'
                ? 'text-white/50'
                : toolPreview.phase === 'error'
                  ? 'text-red-400/60'
                  : 'text-white/30'
            }`}
          >
            {message.content}
          </span>
        </div>

        <ToolPreviewCard
          toolId={toolPreview.toolId}
          toolName={toolPreview.toolName}
          elements={toolPreview.elements}
          phase={toolPreview.phase}
          onDeploy={() => onDeploy?.(toolPreview.toolId)}
          onEdit={() => onEdit?.(toolPreview.toolId)}
          onShare={() => onShare?.(toolPreview.toolId)}
        />
      </motion.div>
    );
  }

  // Default text message (assistant)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <p className="text-white/60 text-[15px] leading-relaxed">{message.content}</p>
    </motion.div>
  );
}
