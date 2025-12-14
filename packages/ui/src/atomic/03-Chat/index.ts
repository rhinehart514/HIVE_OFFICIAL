/**
 * Chat Components - OpenAI-style conversational UI
 *
 * High-value components for building chat-based AI interfaces:
 * - MessageBubble: User/AI message display
 * - ConversationThread: Scrollable message container
 * - ChatInput: Bottom-anchored input with send/stop + slash command autocomplete
 * - ChatToolbar: Tool insertion toolbar (polls, events, countdowns)
 * - IntentConfirmation: Confirmation UI for chat-detected component intents
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
export {
  ChatInput,
  type ChatInputProps,
  type ChatInputHandle,
  type SlashCommandSuggestion,
} from './chat-input';
export {
  ChatToolbar,
  type ChatToolbarProps,
  type ToolInsertData,
  type ToolType
} from './chat-toolbar';
export {
  IntentConfirmation,
  IntentConfirmationInline,
  type IntentConfirmationProps,
  type IntentConfirmationInlineProps,
  type DetectedIntent,
  type IntentType,
} from './intent-confirmation';
export { TypingIndicator, type TypingIndicatorProps } from './typing-indicator';
export {
  ToolPreviewCard,
  MobilePreviewSheet,
  type ToolPreviewCardProps,
  type MobilePreviewSheetProps
} from './tool-preview-card';
