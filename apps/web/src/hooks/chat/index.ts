/**
 * Chat Hooks
 *
 * Modular chat system with focused hooks for each concern:
 * - useChatMessages: Main hook (composes all others)
 * - useChatSSE: SSE connection management
 * - useChatTyping: Typing indicators
 * - useChatMutations: Message CRUD
 * - useChatThreads: Thread management
 */

// Main hook (backward compatible)
export { useChatMessages } from "./use-chat-messages";

// Focused hooks (for custom compositions)
export { useChatSSE } from "./use-chat-sse";
export { useChatTyping } from "./use-chat-typing";
export { useChatMutations } from "./use-chat-mutations";
export { useChatThreads } from "./use-chat-threads";
export { useChatSearch } from "./use-chat-search";

// Types
export type {
  ChatMessageData,
  SpaceBoardData,
  TypingUser,
  ThreadData,
  UseChatMessagesOptions,
  UseChatMessagesReturn,
  SSEEventData,
  ChatSSEOptions,
  ChatMutationCallbacks,
} from "./types";

export type {
  SearchFilters,
  UseChatSearchOptions,
  UseChatSearchReturn,
} from "./use-chat-search";

// Constants
export {
  CHAT_DEFAULT_LIMIT,
  DEFAULT_BOARD_ID,
  TYPING_INDICATOR_INTERVAL_MS,
  TYPING_TTL_MS,
  TYPING_CLEANUP_INTERVAL_MS,
  SSE_RECONNECT_BASE_DELAY_MS,
  SSE_RECONNECT_MAX_DELAY_MS,
  IN_FLIGHT_CLEANUP_DELAY_MS,
} from "./constants";
