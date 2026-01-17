/**
 * Chat Messages Hook - Re-export
 *
 * This file re-exports from the new modular chat hooks system
 * for backward compatibility. All implementations have moved to ./chat/
 *
 * The chat system is now split into focused hooks:
 * - useChatMessages: Main hook (composes all others)
 * - useChatSSE: SSE connection management
 * - useChatTyping: Typing indicators
 * - useChatMutations: Message CRUD
 * - useChatThreads: Thread management
 *
 * @see ./chat/index.ts for all exports
 */

// Re-export everything from the new modular system
export {
  useChatMessages,
  useChatSSE,
  useChatTyping,
  useChatMutations,
  useChatThreads,
} from "./chat";

export type {
  ChatMessageData,
  SpaceBoardData,
  TypingUser,
  ThreadData,
  UseChatMessagesOptions,
  UseChatMessagesReturn,
} from "./chat";

export {
  CHAT_DEFAULT_LIMIT,
  DEFAULT_BOARD_ID,
  TYPING_INDICATOR_INTERVAL_MS,
  TYPING_TTL_MS,
} from "./chat";
