/**
 * Chat Messages Types
 *
 * Shared types for the chat hooks system.
 */

// ============================================================
// Core Data Types
// ============================================================

export interface ChatMessageData {
  id: string;
  boardId: string;
  type: "text" | "inline_component" | "system";
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: "owner" | "admin" | "moderator" | "member";
  content: string;
  componentData?: {
    elementType: string;
    deploymentId?: string;
    componentId?: string;
    toolId?: string;
    state?: Record<string, unknown>;
    isActive: boolean;
  };
  systemAction?: string;
  timestamp: number;
  editedAt?: number;
  isDeleted?: boolean;
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  replyToId?: string;
  replyToPreview?: string;
  threadCount?: number;
}

export interface SpaceBoardData {
  id: string;
  name: string;
  type: "general" | "topic" | "event";
  description?: string;
  linkedEventId?: string;
  messageCount: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ThreadData {
  isOpen: boolean;
  parentMessage: ChatMessageData | null;
  replies: ChatMessageData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

// ============================================================
// Options & Return Types
// ============================================================

export interface UseChatMessagesOptions {
  spaceId: string;
  initialBoardId?: string;
  limit?: number;
  enableRealtime?: boolean;
  enableTypingIndicators?: boolean;
  pollingIntervalMs?: number; // For polling fallback (not used with SSE)
}

export interface UseChatMessagesReturn {
  // Data
  messages: ChatMessageData[];
  boards: SpaceBoardData[];
  activeBoardId: string;
  typingUsers: TypingUser[];
  pinnedMessages: ChatMessageData[];
  thread: ThreadData;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  changeBoard: (boardId: string) => void;
  reorderBoards: (boardIds: string[]) => void;
  loadMore: () => Promise<void>;
  setTyping: () => void;
  refresh: () => Promise<void>;

  // Scroll position management
  saveScrollPosition: (scrollTop: number) => void;
  getScrollPosition: () => number | undefined;

  // Thread actions
  openThread: (messageId: string) => Promise<void>;
  closeThread: () => void;
  sendThreadReply: (content: string) => Promise<void>;
  loadMoreReplies: () => Promise<void>;
}

// ============================================================
// Internal Hook Types
// ============================================================

export interface SSEEventData {
  type: "connected" | "message" | "update" | "delete" | "ping";
  data?: ChatMessageData | { id: string };
}

export interface ChatSSEOptions {
  spaceId: string;
  boardId: string;
  enabled: boolean;
  onMessage: (message: ChatMessageData) => void;
  onUpdate: (message: Partial<ChatMessageData> & { id: string }) => void;
  onDelete: (messageId: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

export interface ChatMutationCallbacks {
  onOptimisticUpdate: (update: () => void) => void;
  onRollback: (rollback: () => void) => void;
}
