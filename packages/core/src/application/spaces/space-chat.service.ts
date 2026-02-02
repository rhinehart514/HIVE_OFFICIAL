/**
 * SpaceChatService
 *
 * Application service for chat board and message management.
 * Handles real-time messaging, board CRUD, reactions, and inline components.
 *
 * Key responsibilities:
 * - Board (channel) management
 * - Message sending/editing/deleting
 * - Reactions
 * - Message pinning
 * - Inline HiveLab component rendering context
 *
 * @version 1.0.0
 */

import { BaseApplicationService, ApplicationServiceContext, ServiceResult } from '../base.service';
import { Result } from '../../domain/shared/base/Result';
import { Board, BoardType, BoardPermission } from '../../domain/spaces/entities/board';
import { ChatMessage, ChatMessageType, InlineComponentData } from '../../domain/spaces/entities/chat-message';
import {
  InlineComponent,
  InlineComponentType,
  ComponentConfig,
  ComponentDisplayState,
  ParticipantRecord,
  PollConfig,
  CountdownConfig,
  RsvpConfig,
} from '../../domain/spaces/entities/inline-component';
import { DomainEventPublisher, getDomainEventPublisher, createLoggingEventHandler } from '../../infrastructure/events';
import {
  BoardCreatedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
  BoardDeletedEvent,
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessagePinnedEvent,
  ReactionAddedEvent,
  ParticipationSubmittedEvent,
} from '../../domain/spaces/events';

// ============================================================
// Types
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
 * Result of board operations
 */
export interface BoardResult {
  boardId: string;
  name: string;
  type: BoardType;
  isDefault: boolean;
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
    // Poll participation
    selectedOptions?: string[];
    // RSVP participation
    response?: 'yes' | 'no' | 'maybe';
    // Custom participation
    data?: Record<string, unknown>;
  };
}

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
/**
 * Search options for messages
 */
export interface SearchMessagesOptions {
  query: string;
  boardId?: string;  // Optional: limit to specific board
  limit?: number;
  offset?: number;
  authorId?: string; // Optional: filter by author
  startDate?: Date;  // Optional: date range
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
   * Optional - falls back to update() if not implemented.
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
    delta: { incrementOption?: string; decrementOption?: string; rsvpChange?: { from?: 'yes' | 'no' | 'maybe'; to: 'yes' | 'no' | 'maybe' }; isNewParticipant: boolean }
  ): Promise<Result<{ newVersion: number }>>;
  close(spaceId: string, componentId: string): Promise<Result<void>>;
}

/**
 * Callback for checking member permissions
 * Returns a simple object (no Result wrapper) for easier integration
 */
export type CheckPermissionFn = (
  userId: string,
  spaceId: string,
  requiredRole: 'member' | 'admin' | 'owner' | 'read'
) => Promise<{ allowed: boolean; role?: string | null }>;

/**
 * Callback for getting user profile info
 * Returns a simple object (no Result wrapper) for easier integration
 */
export type GetUserProfileFn = (
  userId: string
) => Promise<{ displayName: string; avatarUrl?: string } | null>;

// ============================================================
// Service
// ============================================================

export class SpaceChatService extends BaseApplicationService {
  private boardRepo: IBoardRepository;
  private messageRepo: IMessageRepository;
  private inlineComponentRepo?: IInlineComponentRepository;
  private checkPermission?: CheckPermissionFn;
  private getUserProfile?: GetUserProfileFn;
  private eventPublisher: DomainEventPublisher;

  constructor(
    context?: Partial<ApplicationServiceContext>,
    repos?: {
      boardRepo?: IBoardRepository;
      messageRepo?: IMessageRepository;
      inlineComponentRepo?: IInlineComponentRepository;
    },
    callbacks?: {
      checkPermission?: CheckPermissionFn;
      getUserProfile?: GetUserProfileFn;
    },
    eventPublisher?: DomainEventPublisher
  ) {
    super(context);
    this.boardRepo = repos?.boardRepo || {} as IBoardRepository;
    this.messageRepo = repos?.messageRepo || {} as IMessageRepository;
    this.inlineComponentRepo = repos?.inlineComponentRepo;
    this.checkPermission = callbacks?.checkPermission;
    this.getUserProfile = callbacks?.getUserProfile;
    this.eventPublisher = eventPublisher || getDomainEventPublisher();

    // Register logging handler
    const loggingHandler = createLoggingEventHandler();
    this.eventPublisher.registerHandler(loggingHandler);
  }

  /**
   * Set callbacks for dependency injection
   */
  setCallbacks(callbacks: {
    checkPermission?: CheckPermissionFn;
    getUserProfile?: GetUserProfileFn;
  }): void {
    if (callbacks.checkPermission) this.checkPermission = callbacks.checkPermission;
    if (callbacks.getUserProfile) this.getUserProfile = callbacks.getUserProfile;
  }

  // ============================================================
  // Board Operations
  // ============================================================

  /**
   * List all boards for a space
   */
  async listBoards(
    userId: string,
    spaceId: string
  ): Promise<Result<ServiceResult<Board[]>>> {
    return this.execute(async () => {
      // Check permission (read level for listing boards - allows non-members on public spaces)
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'read');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<Board[]>>('Access denied');
        }
      }

      // Get boards
      const boardsResult = await this.boardRepo.findBySpaceId(spaceId);
      if (boardsResult.isFailure) {
        return Result.fail<ServiceResult<Board[]>>(boardsResult.error ?? 'Failed to fetch boards');
      }

      const boards = boardsResult.getValue();

      // If no boards exist, create default General board
      if (boards.length === 0) {
        const generalResult = Board.createGeneral(userId, spaceId);
        if (generalResult.isSuccess) {
          const generalBoard = generalResult.getValue();
          await this.boardRepo.save(spaceId, generalBoard);
          return Result.ok<ServiceResult<Board[]>>({ data: [generalBoard] });
        }
      }

      return Result.ok<ServiceResult<Board[]>>({ data: boards });
    }, 'SpaceChat.listBoards');
  }

  /**
   * Create a new board in a space
   */
  async createBoard(
    userId: string,
    input: CreateBoardInput
  ): Promise<Result<ServiceResult<BoardResult>>> {
    return this.execute(async () => {
      // Check leader permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'admin');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<BoardResult>>('Only space leaders can create boards');
        }
      }

      // Create board
      const boardResult = Board.create({
        name: input.name,
        type: input.type,
        description: input.description,
        linkedEventId: input.linkedEventId,
        canPost: input.canPost ?? 'members',
        createdBy: userId,
      });

      if (boardResult.isFailure) {
        return Result.fail<ServiceResult<BoardResult>>(boardResult.error ?? 'Failed to create board');
      }

      const board = boardResult.getValue();

      // Save board
      const saveResult = await this.boardRepo.save(input.spaceId, board);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<BoardResult>>(saveResult.error ?? 'Failed to save board');
      }

      // Publish event
      const event = new BoardCreatedEvent(
        input.spaceId,
        board.id,
        board.name,
        board.type,
        userId
      );
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<BoardResult>>({
        data: {
          boardId: board.id,
          name: board.name,
          type: board.type,
          isDefault: board.isDefault,
        }
      });
    }, 'SpaceChat.createBoard');
  }

  /**
   * Update a board
   */
  async updateBoard(
    userId: string,
    input: UpdateBoardInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Check leader permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'admin');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<void>>('Only space leaders can update boards');
        }
      }

      // Get board
      const boardResult = await this.boardRepo.findById(input.spaceId, input.boardId);
      if (boardResult.isFailure || !boardResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Board not found');
      }

      const board = boardResult.getValue()!;
      const updates: string[] = [];

      // Apply updates
      if (input.name !== undefined) {
        const nameResult = board.setName(input.name);
        if (nameResult.isFailure) {
          return Result.fail<ServiceResult<void>>(nameResult.error ?? 'Invalid name');
        }
        updates.push('name');
      }

      if (input.description !== undefined) {
        board.setDescription(input.description);
        updates.push('description');
      }

      if (input.canPost !== undefined) {
        board.setPostPermission(input.canPost);
        updates.push('canPost');
      }

      if (input.isLocked !== undefined) {
        if (input.isLocked) {
          board.lock();
        } else {
          board.unlock();
        }
        updates.push('isLocked');
      }

      // Save board
      const saveResult = await this.boardRepo.save(input.spaceId, board);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save board');
      }

      // Publish event
      if (updates.length > 0) {
        const event = new BoardUpdatedEvent(input.spaceId, input.boardId, updates);
        await this.eventPublisher.publish(event);
      }

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.updateBoard');
  }

  /**
   * Archive a board
   */
  async archiveBoard(
    userId: string,
    spaceId: string,
    boardId: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Check leader permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'admin');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<void>>('Only leaders can archive boards');
        }
      }

      // Get board
      const boardResult = await this.boardRepo.findById(spaceId, boardId);
      if (boardResult.isFailure || !boardResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Board not found');
      }

      const board = boardResult.getValue()!;

      // Cannot archive default board
      if (board.isDefault) {
        return Result.fail<ServiceResult<void>>('Cannot archive the default board');
      }

      board.archive();

      // Save board
      const saveResult = await this.boardRepo.save(spaceId, board);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save board');
      }

      // Publish event
      const event = new BoardArchivedEvent(spaceId, boardId, board.name);
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.archiveBoard');
  }

  /**
   * Delete a board
   */
  async deleteBoard(
    userId: string,
    spaceId: string,
    boardId: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Check owner permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'owner');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<void>>('Only owners can delete boards');
        }
      }

      // Get board
      const boardResult = await this.boardRepo.findById(spaceId, boardId);
      if (boardResult.isFailure || !boardResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Board not found');
      }

      const board = boardResult.getValue()!;

      // Cannot delete default board
      if (board.isDefault) {
        return Result.fail<ServiceResult<void>>('Cannot delete the default board');
      }

      // Delete board
      const deleteResult = await this.boardRepo.delete(spaceId, boardId);
      if (deleteResult.isFailure) {
        return Result.fail<ServiceResult<void>>(deleteResult.error ?? 'Failed to delete board');
      }

      // Publish event
      const event = new BoardDeletedEvent(spaceId, boardId, board.name);
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.deleteBoard');
  }

  // ============================================================
  // Message Operations
  // ============================================================

  /**
   * List messages for a board
   */
  async listMessages(
    userId: string,
    options: ListMessagesOptions
  ): Promise<Result<ServiceResult<ListMessagesResult>>> {
    return this.execute(async () => {
      // Check permission (read level for listing messages - allows non-members on public spaces)
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, options.spaceId, 'read');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<ListMessagesResult>>('Access denied');
        }
      }

      // Get messages
      const messagesResult = await this.messageRepo.findByBoard(
        options.spaceId,
        options.boardId,
        {
          limit: options.limit ?? 50,
          before: options.before,
          after: options.after,
        }
      );

      if (messagesResult.isFailure) {
        return Result.fail<ServiceResult<ListMessagesResult>>(
          messagesResult.error ?? 'Failed to fetch messages'
        );
      }

      const { messages, hasMore } = messagesResult.getValue();

      return Result.ok<ServiceResult<ListMessagesResult>>({
        data: {
          messages,
          hasMore,
          boardId: options.boardId,
        }
      });
    }, 'SpaceChat.listMessages');
  }

  /**
   * List thread replies for a parent message
   */
  async listThreadReplies(
    userId: string,
    options: {
      spaceId: string;
      boardId: string;
      parentMessageId: string;
      limit?: number;
      before?: number;
    }
  ): Promise<Result<ServiceResult<ListMessagesResult>>> {
    return this.execute(async () => {
      // Check permission (read level for listing thread replies - allows non-members on public spaces)
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, options.spaceId, 'read');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<ListMessagesResult>>('Access denied');
        }
      }

      // Get thread replies
      const repliesResult = await this.messageRepo.findByReplyTo(
        options.spaceId,
        options.boardId,
        options.parentMessageId,
        {
          limit: options.limit ?? 50,
          before: options.before,
        }
      );

      if (repliesResult.isFailure) {
        return Result.fail<ServiceResult<ListMessagesResult>>(
          repliesResult.error ?? 'Failed to fetch thread replies'
        );
      }

      const { messages, hasMore } = repliesResult.getValue();

      return Result.ok<ServiceResult<ListMessagesResult>>({
        data: {
          messages,
          hasMore,
          boardId: options.boardId,
        }
      });
    }, 'SpaceChat.listThreadReplies');
  }

  /**
   * Search messages within a space
   */
  async searchMessages(
    userId: string,
    spaceId: string,
    options: SearchMessagesOptions
  ): Promise<Result<ServiceResult<SearchMessagesResult>>> {
    return this.execute(async () => {
      // Check member permission (guests can search in public spaces)
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<SearchMessagesResult>>('You do not have access to this space');
        }
      }

      // Validate query
      if (!options.query || options.query.trim().length < 2) {
        return Result.fail<ServiceResult<SearchMessagesResult>>('Search query must be at least 2 characters');
      }

      // Execute search
      const searchResult = await this.messageRepo.search(spaceId, {
        ...options,
        query: options.query.trim(),
        limit: options.limit ?? 50,
        includeDeleted: false, // Never include deleted in search
      });

      if (searchResult.isFailure) {
        return Result.fail<ServiceResult<SearchMessagesResult>>(searchResult.error ?? 'Search failed');
      }

      return Result.ok<ServiceResult<SearchMessagesResult>>({
        data: searchResult.getValue()
      });
    }, 'SpaceChat.searchMessages');
  }

  /**
   * Get pinned messages in a space
   */
  async getPinnedMessages(
    userId: string,
    spaceId: string,
    boardId?: string
  ): Promise<Result<ServiceResult<{ messages: ChatMessage[] }>>> {
    return this.execute(async () => {
      // Check member permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<{ messages: ChatMessage[] }>>('You do not have access to this space');
        }
      }

      const pinnedResult = await this.messageRepo.findPinned(spaceId, boardId);
      if (pinnedResult.isFailure) {
        return Result.fail<ServiceResult<{ messages: ChatMessage[] }>>(pinnedResult.error ?? 'Failed to fetch pinned messages');
      }

      return Result.ok<ServiceResult<{ messages: ChatMessage[] }>>({
        data: { messages: pinnedResult.getValue() }
      });
    }, 'SpaceChat.getPinnedMessages');
  }

  /**
   * Send a message to a board
   */
  async sendMessage(
    userId: string,
    input: SendMessageInput
  ): Promise<Result<ServiceResult<MessageResult>>> {
    return this.execute(async () => {
      // Check member permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<MessageResult>>('Only members can send messages');
        }
      }

      // Get board to check if locked
      const boardResult = await this.boardRepo.findById(input.spaceId, input.boardId);
      if (boardResult.isFailure || !boardResult.getValue()) {
        return Result.fail<ServiceResult<MessageResult>>('Board not found');
      }

      const board = boardResult.getValue()!;
      if (board.isLocked) {
        return Result.fail<ServiceResult<MessageResult>>('This board is locked');
      }

      // Get user profile
      let authorName = 'Member';
      let authorAvatarUrl: string | undefined;

      if (this.getUserProfile) {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          authorName = profile.displayName;
          authorAvatarUrl = profile.avatarUrl;
        }
      }

      // Create message
      let messageResult: Result<ChatMessage>;

      if (input.componentData) {
        messageResult = ChatMessage.createInlineComponent({
          boardId: input.boardId,
          spaceId: input.spaceId,
          authorId: userId,
          authorName,
          authorAvatarUrl,
          content: input.content,
          componentData: input.componentData,
        });
      } else {
        messageResult = ChatMessage.createText({
          boardId: input.boardId,
          spaceId: input.spaceId,
          authorId: userId,
          authorName,
          authorAvatarUrl,
          content: input.content,
          replyToId: input.replyToId,
        });
      }

      if (messageResult.isFailure) {
        return Result.fail<ServiceResult<MessageResult>>(messageResult.error ?? 'Failed to create message');
      }

      const message = messageResult.getValue();

      // Save message
      const saveResult = await this.messageRepo.save(input.spaceId, input.boardId, message);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<MessageResult>>(saveResult.error ?? 'Failed to save message');
      }

      // Update board message count
      await this.messageRepo.incrementBoardMessageCount(input.spaceId, input.boardId);

      // Publish event
      const event = new MessageSentEvent(
        input.spaceId,
        message.id,
        input.boardId,
        userId,
        message.type,
        !!input.componentData
      );
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<MessageResult>>({
        data: {
          messageId: message.id,
          timestamp: message.timestamp.getTime(),
          type: message.type,
        }
      });
    }, 'SpaceChat.sendMessage');
  }

  /**
   * Edit a message
   */
  async editMessage(
    userId: string,
    spaceId: string,
    boardId: string,
    messageId: string,
    newContent: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Get message
      const messageResult = await this.messageRepo.findById(spaceId, boardId, messageId);
      if (messageResult.isFailure || !messageResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Message not found');
      }

      const message = messageResult.getValue()!;

      // Only author can edit
      if (message.authorId !== userId) {
        return Result.fail<ServiceResult<void>>('Only the author can edit this message');
      }

      // Edit message
      const editResult = message.edit(newContent);
      if (editResult.isFailure) {
        return Result.fail<ServiceResult<void>>(editResult.error ?? 'Failed to edit message');
      }

      // Save message
      const saveResult = await this.messageRepo.update(spaceId, boardId, message);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save message');
      }

      // Publish event
      const event = new MessageEditedEvent(spaceId, messageId, boardId, userId);
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.editMessage');
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    userId: string,
    spaceId: string,
    boardId: string,
    messageId: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Get message
      const messageResult = await this.messageRepo.findById(spaceId, boardId, messageId);
      if (messageResult.isFailure || !messageResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Message not found');
      }

      const message = messageResult.getValue()!;

      // Check permission: author or leader
      const isAuthor = message.authorId === userId;
      let isLeader = false;

      if (this.checkPermission && !isAuthor) {
        const permResult = await this.checkPermission(userId, spaceId, 'admin');
        if (permResult.allowed) {
          isLeader = true;
        }
      }

      if (!isAuthor && !isLeader) {
        return Result.fail<ServiceResult<void>>('Only the author or leaders can delete this message');
      }

      // Soft delete
      message.delete();

      // Save message
      const saveResult = await this.messageRepo.update(spaceId, boardId, message);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save message');
      }

      // Publish event
      const event = new MessageDeletedEvent(spaceId, messageId, boardId, userId);
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.deleteMessage');
  }

  /**
   * Pin a message
   */
  async pinMessage(
    userId: string,
    spaceId: string,
    boardId: string,
    messageId: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Check leader permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'admin');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<void>>('Only leaders can pin messages');
        }
      }

      // Get message
      const messageResult = await this.messageRepo.findById(spaceId, boardId, messageId);
      if (messageResult.isFailure || !messageResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Message not found');
      }

      const message = messageResult.getValue()!;
      message.pin();

      // Save message
      const saveResult = await this.messageRepo.update(spaceId, boardId, message);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save message');
      }

      // Also update board's pinned messages list
      const boardResult = await this.boardRepo.findById(spaceId, boardId);
      if (boardResult.isSuccess && boardResult.getValue()) {
        const board = boardResult.getValue()!;
        const pinResult = board.pinMessage(messageId);
        if (pinResult.isSuccess) {
          await this.boardRepo.save(spaceId, board);
        }
      }

      // Publish event
      const event = new MessagePinnedEvent(spaceId, messageId, boardId, userId);
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.pinMessage');
  }

  /**
   * Add a reaction to a message
   * SCALING FIX: Uses atomic transaction to prevent race conditions
   */
  async addReaction(
    userId: string,
    input: ReactionInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Check member permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<void>>('Only members can react to messages');
        }
      }

      // SCALING FIX: Use atomic update if available (prevents lost updates under high concurrency)
      if (this.messageRepo.updateReactionAtomic) {
        const atomicResult = await this.messageRepo.updateReactionAtomic(
          input.spaceId,
          input.boardId,
          input.messageId,
          input.emoji,
          userId,
          'add'
        );
        if (atomicResult.isFailure) {
          return Result.fail<ServiceResult<void>>(atomicResult.error ?? 'Failed to save reaction');
        }
      } else {
        // Fallback to non-atomic update (legacy behavior)
        const messageResult = await this.messageRepo.findById(input.spaceId, input.boardId, input.messageId);
        if (messageResult.isFailure || !messageResult.getValue()) {
          return Result.fail<ServiceResult<void>>('Message not found');
        }

        const message = messageResult.getValue()!;
        message.addReaction(input.emoji, userId);

        const saveResult = await this.messageRepo.update(input.spaceId, input.boardId, message);
        if (saveResult.isFailure) {
          return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save reaction');
        }
      }

      // Publish event
      const event = new ReactionAddedEvent(
        input.spaceId,
        input.messageId,
        input.boardId,
        input.emoji,
        userId
      );
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.addReaction');
  }

  /**
   * Remove a reaction from a message
   * SECURITY: Users can only remove their own reactions
   * SCALING FIX: Uses atomic transaction to prevent race conditions
   */
  async removeReaction(
    userId: string,
    input: ReactionInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // SCALING FIX: Use atomic update if available (prevents lost updates under high concurrency)
      if (this.messageRepo.updateReactionAtomic) {
        // Note: The atomic method handles validation internally via transaction
        const atomicResult = await this.messageRepo.updateReactionAtomic(
          input.spaceId,
          input.boardId,
          input.messageId,
          input.emoji,
          userId,
          'remove'
        );
        if (atomicResult.isFailure) {
          // Could be "User has not reacted" or actual error - return appropriately
          return Result.fail<ServiceResult<void>>(atomicResult.error ?? 'Failed to remove reaction');
        }
      } else {
        // Fallback to non-atomic update (legacy behavior)
        const messageResult = await this.messageRepo.findById(input.spaceId, input.boardId, input.messageId);
        if (messageResult.isFailure || !messageResult.getValue()) {
          return Result.fail<ServiceResult<void>>('Message not found');
        }

        const message = messageResult.getValue()!;

        // SECURITY: Verify user has this reaction before allowing removal
        if (!message.hasUserReacted(input.emoji, userId)) {
          return Result.fail<ServiceResult<void>>('User has not reacted with this emoji');
        }

        message.removeReaction(input.emoji, userId);

        const saveResult = await this.messageRepo.update(input.spaceId, input.boardId, message);
        if (saveResult.isFailure) {
          return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save reaction');
        }
      }

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.removeReaction');
  }

  // ============================================================
  // Inline Component Operations
  // ============================================================

  /**
   * Create an inline component message (poll, countdown, RSVP, etc.)
   */
  async createInlineComponent(
    userId: string,
    input: CreateInlineComponentInput
  ): Promise<Result<ServiceResult<InlineComponentResult>>> {
    return this.execute(async () => {
      if (!this.inlineComponentRepo) {
        return Result.fail<ServiceResult<InlineComponentResult>>('Inline component repository not configured');
      }

      // Check member permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<InlineComponentResult>>('Only members can create inline components');
        }
      }

      // Get board to check if locked
      const boardResult = await this.boardRepo.findById(input.spaceId, input.boardId);
      if (boardResult.isFailure || !boardResult.getValue()) {
        return Result.fail<ServiceResult<InlineComponentResult>>('Board not found');
      }

      const board = boardResult.getValue()!;
      if (board.isLocked) {
        return Result.fail<ServiceResult<InlineComponentResult>>('This board is locked');
      }

      // Get user profile
      let authorName = 'Member';
      let authorAvatarUrl: string | undefined;

      if (this.getUserProfile) {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          authorName = profile.displayName;
          authorAvatarUrl = profile.avatarUrl;
        }
      }

      // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
      const messageId = `msg_${crypto.randomUUID()}`;

      // Create the inline component based on type
      let componentResult: Result<InlineComponent>;

      switch (input.componentType) {
        case 'poll':
          componentResult = InlineComponent.createPoll({
            spaceId: input.spaceId,
            boardId: input.boardId,
            messageId,
            createdBy: userId,
            question: input.componentConfig.question || 'Poll',
            options: input.componentConfig.options || ['Option 1', 'Option 2'],
            allowMultiple: input.componentConfig.allowMultiple,
            showResults: input.componentConfig.showResults,
            closesAt: input.componentConfig.closesAt,
          });
          break;

        case 'countdown':
          if (!input.componentConfig.targetDate) {
            return Result.fail<ServiceResult<InlineComponentResult>>('Target date is required for countdown');
          }
          componentResult = InlineComponent.createCountdown({
            spaceId: input.spaceId,
            boardId: input.boardId,
            messageId,
            createdBy: userId,
            title: input.componentConfig.title || 'Countdown',
            targetDate: input.componentConfig.targetDate,
          });
          break;

        case 'rsvp':
          if (!input.componentConfig.eventDate) {
            return Result.fail<ServiceResult<InlineComponentResult>>('Event date is required for RSVP');
          }
          componentResult = InlineComponent.createRsvp({
            spaceId: input.spaceId,
            boardId: input.boardId,
            messageId,
            createdBy: userId,
            eventTitle: input.componentConfig.eventTitle || 'Event',
            eventDate: input.componentConfig.eventDate,
            eventId: input.componentConfig.eventId,
            maxCapacity: input.componentConfig.maxCapacity,
            allowMaybe: input.componentConfig.allowMaybe,
          });
          break;

        case 'custom':
          if (!input.componentConfig.elementType || !input.componentConfig.toolId) {
            return Result.fail<ServiceResult<InlineComponentResult>>('Element type and tool ID required for custom component');
          }
          componentResult = InlineComponent.createCustom({
            spaceId: input.spaceId,
            boardId: input.boardId,
            messageId,
            createdBy: userId,
            elementType: input.componentConfig.elementType,
            toolId: input.componentConfig.toolId,
            settings: input.componentConfig.settings,
          });
          break;

        default:
          return Result.fail<ServiceResult<InlineComponentResult>>('Invalid component type');
      }

      if (componentResult.isFailure) {
        return Result.fail<ServiceResult<InlineComponentResult>>(componentResult.error ?? 'Failed to create component');
      }

      const component = componentResult.getValue();

      // Save the inline component state
      const saveComponentResult = await this.inlineComponentRepo.save(input.spaceId, component);
      if (saveComponentResult.isFailure) {
        return Result.fail<ServiceResult<InlineComponentResult>>(saveComponentResult.error ?? 'Failed to save component');
      }

      // Create the chat message with component data
      // For inline chat components (polls, RSVP, etc.), use componentId
      // For deployed tools, use deploymentId/toolId
      const componentData: InlineComponentData = {
        elementType: component.elementType,
        componentId: component.id, // Reference to the inline component for state fetching
        toolId: component.toolId,
        state: component.config as unknown as Record<string, unknown>,
        isActive: true,
      };

      const messageResult = ChatMessage.createInlineComponent({
        boardId: input.boardId,
        spaceId: input.spaceId,
        authorId: userId,
        authorName,
        authorAvatarUrl,
        content: input.content,
        componentData,
      }, messageId);

      if (messageResult.isFailure) {
        return Result.fail<ServiceResult<InlineComponentResult>>(messageResult.error ?? 'Failed to create message');
      }

      const message = messageResult.getValue();

      // Save message
      const saveMessageResult = await this.messageRepo.save(input.spaceId, input.boardId, message);
      if (saveMessageResult.isFailure) {
        return Result.fail<ServiceResult<InlineComponentResult>>(saveMessageResult.error ?? 'Failed to save message');
      }

      // Update board message count
      await this.messageRepo.incrementBoardMessageCount(input.spaceId, input.boardId);

      // Publish event
      const event = new MessageSentEvent(
        input.spaceId,
        message.id,
        input.boardId,
        userId,
        'inline_component',
        true
      );
      await this.eventPublisher.publish(event);

      return Result.ok<ServiceResult<InlineComponentResult>>({
        data: {
          messageId: message.id,
          componentId: component.id,
          timestamp: message.timestamp.getTime(),
        }
      });
    }, 'SpaceChat.createInlineComponent');
  }

  /**
   * Submit participation to an inline component (vote, RSVP, etc.)
   */
  async submitParticipation(
    userId: string,
    input: SubmitParticipationInput
  ): Promise<Result<ServiceResult<ComponentDisplayState>>> {
    return this.execute(async () => {
      if (!this.inlineComponentRepo) {
        return Result.fail<ServiceResult<ComponentDisplayState>>('Inline component repository not configured');
      }

      // Get the component
      const componentResult = await this.inlineComponentRepo.findById(input.spaceId, input.componentId);
      if (componentResult.isFailure || !componentResult.getValue()) {
        return Result.fail<ServiceResult<ComponentDisplayState>>('Component not found');
      }

      const component = componentResult.getValue()!;

      // Check member permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, input.spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<ComponentDisplayState>>('Only members can participate');
        }
      }

      // Get existing participation
      const existingResult = await this.inlineComponentRepo.getParticipation(
        input.spaceId,
        input.componentId,
        userId
      );
      const existingParticipation = existingResult.isSuccess ? existingResult.getValue() : null;

      // Record participation based on component type
      let participationResult;

      switch (component.componentType) {
        case 'poll':
          if (!input.participation.selectedOptions?.length) {
            return Result.fail<ServiceResult<ComponentDisplayState>>('No options selected');
          }
          participationResult = component.recordPollVote(
            userId,
            input.participation.selectedOptions,
            existingParticipation ?? undefined
          );
          break;

        case 'rsvp':
          if (!input.participation.response) {
            return Result.fail<ServiceResult<ComponentDisplayState>>('No response provided');
          }
          participationResult = component.recordRsvp(
            userId,
            input.participation.response,
            existingParticipation ?? undefined
          );
          break;

        case 'custom':
          participationResult = component.recordCustomParticipation(
            userId,
            input.participation.data ?? {},
            existingParticipation ?? undefined
          );
          break;

        default:
          return Result.fail<ServiceResult<ComponentDisplayState>>('Component does not support participation');
      }

      if (participationResult.isFailure) {
        return Result.fail<ServiceResult<ComponentDisplayState>>(participationResult.error ?? 'Failed to record participation');
      }

      const { participantRecord, aggregationDelta } = participationResult.getValue();

      // Atomic write to Firestore
      const submitResult = await this.inlineComponentRepo.submitParticipationAtomic(
        input.spaceId,
        input.componentId,
        participantRecord,
        aggregationDelta
      );

      if (submitResult.isFailure) {
        return Result.fail<ServiceResult<ComponentDisplayState>>(submitResult.error ?? 'Failed to save participation');
      }

      const { newVersion } = submitResult.getValue();

      // Apply delta to component for returning updated state
      component.applyDelta(aggregationDelta);

      // Publish event for real-time sync
      const event = new ParticipationSubmittedEvent(
        input.spaceId,
        input.componentId,
        userId,
        component.sharedState
      );
      await this.eventPublisher.publish(event);

      // Return updated display state
      const displayState = component.getDisplayState(participantRecord);

      return Result.ok<ServiceResult<ComponentDisplayState>>({
        data: displayState
      });
    }, 'SpaceChat.submitParticipation');
  }

  /**
   * Get component display state for a user
   */
  async getComponentState(
    userId: string,
    spaceId: string,
    componentId: string
  ): Promise<Result<ServiceResult<ComponentDisplayState | null>>> {
    return this.execute(async () => {
      if (!this.inlineComponentRepo) {
        return Result.fail<ServiceResult<ComponentDisplayState | null>>('Inline component repository not configured');
      }

      // Check permission
      if (this.checkPermission) {
        const permResult = await this.checkPermission(userId, spaceId, 'member');
        if (!permResult.allowed) {
          return Result.fail<ServiceResult<ComponentDisplayState | null>>('Access denied');
        }
      }

      // Get component
      const componentResult = await this.inlineComponentRepo.findById(spaceId, componentId);
      if (componentResult.isFailure) {
        return Result.fail<ServiceResult<ComponentDisplayState | null>>(componentResult.error ?? 'Failed to fetch component');
      }

      const component = componentResult.getValue();
      if (!component) {
        return Result.ok<ServiceResult<ComponentDisplayState | null>>({ data: null });
      }

      // Get user's participation
      const participationResult = await this.inlineComponentRepo.getParticipation(spaceId, componentId, userId);
      const participation = participationResult.isSuccess ? participationResult.getValue() : null;

      const displayState = component.getDisplayState(participation ?? undefined);

      return Result.ok<ServiceResult<ComponentDisplayState | null>>({
        data: displayState
      });
    }, 'SpaceChat.getComponentState');
  }

  /**
   * Close a component (stop accepting participation)
   */
  async closeComponent(
    userId: string,
    spaceId: string,
    componentId: string
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      if (!this.inlineComponentRepo) {
        return Result.fail<ServiceResult<void>>('Inline component repository not configured');
      }

      // Get component to check creator
      const componentResult = await this.inlineComponentRepo.findById(spaceId, componentId);
      if (componentResult.isFailure || !componentResult.getValue()) {
        return Result.fail<ServiceResult<void>>('Component not found');
      }

      const component = componentResult.getValue()!;

      // Check permission: creator or leader can close
      const isCreator = component.createdBy === userId;
      let isLeader = false;

      if (this.checkPermission && !isCreator) {
        const permResult = await this.checkPermission(userId, spaceId, 'admin');
        isLeader = permResult.allowed;
      }

      if (!isCreator && !isLeader) {
        return Result.fail<ServiceResult<void>>('Only the creator or leaders can close this component');
      }

      // Close the component
      const closeResult = await this.inlineComponentRepo.close(spaceId, componentId);
      if (closeResult.isFailure) {
        return Result.fail<ServiceResult<void>>(closeResult.error ?? 'Failed to close component');
      }

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceChat.closeComponent');
  }
}

/**
 * Factory function for creating SpaceChatService with repositories
 */
export function createSpaceChatService(
  context?: Partial<ApplicationServiceContext>,
  repos?: {
    boardRepo?: IBoardRepository;
    messageRepo?: IMessageRepository;
    inlineComponentRepo?: IInlineComponentRepository;
  },
  callbacks?: {
    checkPermission?: CheckPermissionFn;
    getUserProfile?: GetUserProfileFn;
  }
): SpaceChatService {
  return new SpaceChatService(context, repos, callbacks);
}
