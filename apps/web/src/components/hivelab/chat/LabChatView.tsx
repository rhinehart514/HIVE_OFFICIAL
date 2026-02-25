'use client';

/**
 * LabChatView — Main container: message list + input + template chips.
 *
 * The primary creation experience for HiveLab.
 * Empty state: hero + chips + large input.
 * Active state: message thread + bottom input.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOTION } from '@hive/tokens';
import type { QuickTemplate } from '@hive/ui';

import { useLabChat } from '@/hooks/use-lab-chat';
import { QuickStartChips } from '@/components/hivelab/dashboard/QuickStartChips';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

const EASE = MOTION.ease.premium;

interface LabChatViewProps {
  templates: QuickTemplate[];
  originSpaceId?: string | null;
  autoPrompt?: string;
  onViewAllTemplates?: () => void;
  onToolCreated?: (toolId: string) => void;
}

export function LabChatView({
  templates,
  originSpaceId,
  autoPrompt,
  onViewAllTemplates,
  onToolCreated,
}: LabChatViewProps) {
  const router = useRouter();
  const {
    thread,
    isGenerating,
    isCreatingTool,
    sendMessage,
    useTemplate,
    dismissTemplateSuggestion,
    publishAndCopyLink,
  } = useLabChat({
    originSpaceId,
    onToolCreated,
  });

  const hasMessages = thread.messages.length > 0;
  const hasExistingTool = !!thread.toolId;

  const handleDeploy = useCallback(
    (toolId: string) => {
      const spaceParam = originSpaceId ? `?spaceId=${originSpaceId}` : '';
      router.push(`/lab/${toolId}/deploy${spaceParam}`);
    },
    [router, originSpaceId]
  );

  const handleEdit = useCallback(
    (toolId: string) => {
      router.push(`/lab/${toolId}`);
    },
    [router]
  );

  const handleShare = useCallback(
    (_toolId: string) => {
      publishAndCopyLink();
    },
    [publishAndCopyLink]
  );

  const handleTemplateClick = useCallback(
    (template: QuickTemplate) => {
      // Templates with fields — just send a message about it to trigger AI generation
      sendMessage(`Create a ${template.name.toLowerCase()}`);
    },
    [sendMessage]
  );

  // Empty state — hero + chips + input
  if (!hasMessages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-6 max-w-lg"
        >
          <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">
            What&apos;s your campus missing?
          </h1>
          <p className="text-white/40 text-sm">
            Describe what you need and it&apos;ll be built in seconds
          </p>
        </motion.div>

        {/* Template chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          className="w-full max-w-xl mb-6"
        >
          <QuickStartChips
            templates={templates}
            onTemplateClick={handleTemplateClick}
            onViewAll={onViewAllTemplates || (() => {})}
            disabled={isCreatingTool}
            variant="primary"
          />
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
          className="w-full max-w-xl"
        >
          <ChatInput
            onSend={sendMessage}
            isGenerating={isGenerating}
            isCreatingTool={isCreatingTool}
            autoFocus
            initialValue={autoPrompt}
          />
        </motion.div>
      </div>
    );
  }

  // Active state — message thread + bottom input
  return (
    <div className="flex flex-col h-full min-h-[50vh]">
      <ChatMessageList
        messages={thread.messages}
        onDeploy={handleDeploy}
        onEdit={handleEdit}
        onShare={handleShare}
        onUseTemplate={useTemplate}
        onBuildWithAI={dismissTemplateSuggestion}
      />

      {/* Bottom input */}
      <div className="sticky bottom-0 bg-black/80 backdrop-blur-sm border-t border-white/[0.04] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {/* Template chips when no tool yet */}
          {!hasExistingTool && !isGenerating && !isCreatingTool && (
            <div className="mb-3">
              <QuickStartChips
                templates={templates.slice(0, 4)}
                onTemplateClick={handleTemplateClick}
                onViewAll={onViewAllTemplates || (() => {})}
                disabled={isCreatingTool}
                variant="secondary"
              />
            </div>
          )}
          <ChatInput
            onSend={sendMessage}
            isGenerating={isGenerating}
            isCreatingTool={isCreatingTool}
            hasExistingTool={hasExistingTool}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
