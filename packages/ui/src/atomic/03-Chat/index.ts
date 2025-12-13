/**
 * Chat Components - OpenAI-style conversational UI
 *
 * High-value components for building chat-based AI interfaces:
 * - MessageBubble: User/AI message display
 * - ConversationThread: Scrollable message container
 * - ChatInput: Bottom-anchored input with send/stop
 * - ChatToolbar: Tool insertion toolbar (polls, events, countdowns)
 * - TypingIndicator: AI thinking animation
 * - ToolPreviewCard: Split-view preview panel
 */

export { MessageBubble, MessageList, type MessageBubbleProps } from './message-bubble';
export {
  ConversationThread,
  EmptyChatState,
  type ConversationThreadProps,
  type EmptyChatStateProps
} from './conversation-thread';
export { ChatInput, type ChatInputProps, type ChatInputHandle } from './chat-input';
export {
  ChatToolbar,
  type ChatToolbarProps,
  type ToolInsertData,
  type ToolType
} from './chat-toolbar';
export { TypingIndicator, type TypingIndicatorProps } from './typing-indicator';
export {
  ToolPreviewCard,
  MobilePreviewSheet,
  type ToolPreviewCardProps,
  type MobilePreviewSheetProps
} from './tool-preview-card';
