'use client';

/**
 * ChatMessageBubble — Routes message type to correct renderer.
 *
 * Handles: text, tool-preview, template-suggestion, status, deploy-confirm.
 */

import { motion } from 'framer-motion';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import type { QuickTemplate } from '@hive/ui';
import { getQuickTemplate } from '@hive/ui';
import type { ChatMessage } from '@/lib/hivelab/chat-types';
import { ToolPreviewCard } from './ToolPreviewCard';

const EASE = [0.22, 1, 0.36, 1] as const;

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onDeploy?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
  onShare?: (toolId: string) => void;
  onUseTemplate?: (template: QuickTemplate) => void;
  onBuildWithAI?: () => void;
}

export function ChatMessageBubble({
  message,
  onDeploy,
  onEdit,
  onShare,
  onUseTemplate,
  onBuildWithAI,
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

  // Template suggestion
  if (message.type === 'template-suggestion' && message.templateSuggestion) {
    const template = getQuickTemplate(message.templateSuggestion.templateId);
    if (!template) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="max-w-md"
      >
        <div className="rounded-2xl border border-white/[0.06] bg-[#080808] p-4">
          <p className="text-white/60 text-sm mb-3">{message.content}</p>

          <button
            onClick={() => onUseTemplate?.(template)}
            className="w-full text-left p-3 rounded-xl border border-white/[0.08] bg-white/[0.03]
              hover:bg-white/[0.06] transition-all mb-2 group"
          >
            <p className="text-sm font-medium text-white group-hover:text-white">
              {template.name}
            </p>
            <p className="text-xs text-white/40 mt-0.5">{template.description}</p>
          </button>

          <button
            onClick={onBuildWithAI}
            className="w-full text-center py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            Build with AI instead
          </button>
        </div>
      </motion.div>
    );
  }

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
