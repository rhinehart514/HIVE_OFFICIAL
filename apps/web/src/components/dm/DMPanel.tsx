'use client';

/**
 * DMPanel - Slide-out drawer for direct messaging
 *
 * Features:
 * - Conversation header with recipient info
 * - Message list with auto-scroll
 * - Message input with send functionality
 * - Real-time updates via context
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDM } from '@/contexts/dm-context';
import { useAuth } from '@hive/auth-logic';
import { Avatar, AvatarFallback, AvatarImage, Text, getInitials } from '@hive/ui/design-system/primitives';
import { DMConversationList } from './DMConversationList';
import { DMMessageInput } from './DMMessageInput';

// ============================================================================
// Component
// ============================================================================

export function DMPanel() {
  const { user } = useAuth();
  const {
    isPanelOpen,
    activeConversation,
    messages,
    isLoadingMessages,
    closePanel,
    getOtherParticipant,
  } = useDM();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showList, setShowList] = React.useState(false);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Show list when no active conversation
  React.useEffect(() => {
    if (isPanelOpen && !activeConversation) {
      setShowList(true);
    }
  }, [isPanelOpen, activeConversation]);

  const otherParticipant = activeConversation
    ? getOtherParticipant(activeConversation)
    : null;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closePanel}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 'min(400px, 100vw)',
              backgroundColor: 'var(--bg-base)',
              borderLeft: '1px solid var(--border-default)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                borderBottom: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              {showList || !activeConversation ? (
                <>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Messages
                  </h2>
                  <button
                    onClick={closePanel}
                    className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowList(true)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="sr-only">Back to list</span>
                    </button>

                    {otherParticipant && (
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {otherParticipant.avatarUrl ? (
                            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                          ) : (
                            <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {otherParticipant.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            @{otherParticipant.handle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={closePanel}
                    className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close</span>
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            {showList || !activeConversation ? (
              <DMConversationList onSelectConversation={() => setShowList(false)} />
            ) : (
              <>
                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-4"
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Text size="lg" tone="muted" className="mb-2">
                        Start the conversation
                      </Text>
                      <Text size="sm" tone="muted">
                        Send a message to {otherParticipant?.name || 'them'}
                      </Text>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === user?.id;
                        const prevMessage = messages[index - 1];
                        const showAuthor = !prevMessage || prevMessage.senderId !== message.senderId;
                        const timeDiff = prevMessage ? message.timestamp - prevMessage.timestamp : Infinity;
                        const showTimestamp = timeDiff > 300000; // 5 minutes

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              'group flex gap-3',
                              'hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg',
                              'transition-colors'
                            )}
                          >
                            {/* Avatar */}
                            <div className="w-8 flex-shrink-0">
                              {(showAuthor || showTimestamp) && (
                                <Avatar size="sm">
                                  {message.senderAvatarUrl ? (
                                    <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} />
                                  ) : (
                                    <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                                  )}
                                </Avatar>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {(showAuthor || showTimestamp) && (
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <Text size="sm" weight="medium">
                                    {isOwnMessage ? 'You' : message.senderName}
                                  </Text>
                                  <Text size="xs" tone="muted">
                                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                                  </Text>
                                </div>
                              )}
                              <Text size="sm" className="whitespace-pre-wrap break-words">
                                {message.content}
                              </Text>
                            </div>

                            {/* Timestamp on hover */}
                            {!(showAuthor || showTimestamp) && (
                              <div className="w-12 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Text size="xs" tone="muted" className="text-right">
                                  {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Input */}
                <DMMessageInput />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

DMPanel.displayName = 'DMPanel';
