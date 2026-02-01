/**
 * SpaceChatService Types
 *
 * DTOs, repository interfaces, and callback types for the chat service.
 */

import { Result } from '../../../domain/shared/base/Result';
import { Board, BoardType, BoardPermission } from '../../../domain/spaces/entities/board';
import { ChatMessage, ChatMessageType, InlineComponentData } from '../../../domain/spaces/entities/chat-message';
import {
  InlineComponent,
  InlineComponentType,
  ParticipantRecord,
} from '../../../domain/spaces/entities/inline-component';

// ============================================================
// Board DTOs
// ============================================================

/**
 * Input for creating a new board
 */
export interface CreateBoardInput {
  spaceId: string;
  name: string;
  type: BoardType;
  description?: string;
  linkedEventId?: string;
  canPost?: BoardPermission;
}

/**
 * Input for updating a board
 */
export interface UpdateBoardInput {
  spaceId: string;
  boardId: string;
  name?: string;
  description?: string;
  canPost?: BoardPermission;
  isLocked?: boolean;
}

/**
 * Result of board operations
 */
export interface BoardResult {
  boardId: string;
  name: string;
  type: BoardType;
  isDefault: boolean;
}

// ============================================================
// Message DTOs
// ============================================================

/**
 * Attachment data for chat messages
 */
export interface ChatAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Input for sending a message
 */
export interface SendMessageInput {
  spaceId: string;
  boardId: string;
  content: string;
  replyToId?: string;
  componentData?: InlineComponentData;
  attachments?: ChatAttachment[];
}

/**
 * Input for message reactions
 */
export interface ReactionInput {
  spaceId: string;
  boardId: string;
  messageId: string;
  emoji: string;
}

/**
 * Result of message operations
 */
export interface MessageResult {
  messageId: string;
  timestamp: number;
  type: ChatMessageType;
}

/**
 * Message listing options
 */
export interface ListMessagesOptions {
  spaceId: string;
  boardId: string;
  limit?: number;
  before?: number;
  after?: number;
}

/**
 * Message listing result
 */
export interface ListMessagesResult {
  messages: ChatMessage[];
  hasMore: boolean;
  boardId: string;
}

/**
 * Search options for messages
 */
export interface SearchMessagesOptions {
  query: string;
  boardId?: string;
  limit?: number;
  offset?: number;
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
  includeDeleted?: boolean;
}

/**
 * Search result for messages
 */
export interface SearchMessagesResult {
  messages: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
}

// ============================================================
// Inline Component DTOs
// ============================================================

/**
 * Input for creating an inline component message
 */
export interface CreateInlineComponentInput {
  spaceId: string;
  boardId: string;
  content: string;
  componentType: InlineComponentType;
  componentConfig: {
    // Poll config
    question?: string;
    options?: string[];
    allowMultiple?: boolean;
    showResults?: 'always' | 'after_vote' | 'after_close';
    closesAt?: Date;
    // Countdown config
    title?: string;
    targetDate?: Date;
    // RSVP config
    eventId?: string;
    eventTitle?: string;
    eventDate?: Date;
    maxCapacity?: number;
    allowMaybe?: boolean;
    // Custom config
    elementType?: string;
    toolId?: string;
    settings?: Record<string, unknown>;
  };
}

/**
 * Result of inline component creation
 */
export interface InlineComponentResult {
  messageId: string;
  componentId: string;
  timestamp: number;
}

/**
 * Input for submitting participation
 */
export interface SubmitParticipationInput {
  spaceId: string;
  componentId: string;
  participation: {
    selectedOptions?: string[];
    response?: 'yes' | 'no' | 'maybe';
    data?: Record<string, unknown>;
  };
}

// ============================================================
// Repository Interfaces
// ============================================================

/**
 * Repository interface for board persistence
 */
export interface IBoardRepository {
  findById(spaceId: string, boardId: string): Promise<Result<Board | null>>;
  findBySpaceId(spaceId: string): Promise<Result<Board[]>>;
  save(spaceId: string, board: Board): Promise<Result<void>>;
  delete(spaceId: string, boardId: string): Promise<Result<void>>;
}

/**
 * Repository interface for message persistence
 */
export interface IMessageRepository {
  findById(spaceId: string, boardId: string, messageId: string): Promise<Result<ChatMessage | null>>;
  findByBoard(spaceId: string, boardId: string, options: { limit: number; before?: number; after?: number }): Promise<Result<{ messages: ChatMessage[]; hasMore: boolean }>>;
  findByReplyTo(spaceId: string, boardId: string, messageId: string, options: { limit: number; before?: number }): Promise<Result<{ messages: ChatMessage[]; hasMore: boolean }>>;
  findPinned(spaceId: string, boardId?: string): Promise<Result<ChatMessage[]>>;
  search(spaceId: string, options: SearchMessagesOptions): Promise<Result<SearchMessagesResult>>;
  save(spaceId: string, boardId: string, message: ChatMessage): Promise<Result<void>>;
  update(spaceId: string, boardId: string, message: ChatMessage): Promise<Result<void>>;
  delete(spaceId: string, boardId: string, messageId: string): Promise<Result<void>>;
  incrementBoardMessageCount(spaceId: string, boardId: string): Promise<Result<void>>;
  /**
   * SCALING FIX: Atomically update reactions using a transaction.
   * Prevents race conditions when multiple users react simultaneously.
   */
  updateReactionAtomic?(
    spaceId: string,
    boardId: string,
    messageId: string,
    emoji: string,
    userId: string,
    action: 'add' | 'remove'
  ): Promise<Result<void>>;
}

/**
 * Repository interface for inline component persistence
 */
export interface IInlineComponentRepository {
  save(spaceId: string, component: InlineComponent): Promise<Result<void>>;
  findById(spaceId: string, componentId: string): Promise<Result<InlineComponent | null>>;
  findByMessageId(spaceId: string, boardId: string, messageId: string): Promise<Result<InlineComponent | null>>;
  getParticipation(spaceId: string, componentId: string, userId: string): Promise<Result<ParticipantRecord | null>>;
  submitParticipationAtomic(
    spaceId: string,
    componentId: string,
    participation: ParticipantRecord,
    delta: {
      incrementOption?: string;
      decrementOption?: string;
      rsvpChange?: { from?: 'yes' | 'no' | 'maybe'; to: 'yes' | 'no' | 'maybe' };
      isNewParticipant: boolean;
    }
  ): Promise<Result<{ newVersion: number }>>;
  close(spaceId: string, componentId: string): Promise<Result<void>>;
}

// ============================================================
// Callback Types
// ============================================================

/**
 * Callback for checking member permissions
 */
export type CheckPermissionFn = (
  userId: string,
  spaceId: string,
  requiredRole: 'member' | 'leader' | 'owner'
) => Promise<{ allowed: boolean; role?: string | null }>;

/**
 * Callback for getting user profile info
 */
export type GetUserProfileFn = (
  userId: string
) => Promise<{ displayName: string; avatarUrl?: string } | null>;
