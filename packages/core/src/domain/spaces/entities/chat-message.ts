/**
 * ChatMessage Entity
 * Represents a message in a space's chat board
 *
 * Messages can be:
 * - text: Plain text content
 * - inline_component: HiveLab element rendered inline (poll, signup, etc.)
 * - system: System announcements (user joined, settings changed, etc.)
 */

import { Entity } from '../../shared/base/Entity.base';
import { Result } from '../../shared/base/Result';

export type ChatMessageType = 'text' | 'inline_component' | 'system';

export interface ChatMessageAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  isVerified?: boolean;
}

export interface InlineComponentData {
  /** The HiveLab element type (e.g., 'poll-element', 'signup-form') */
  elementType: string;
  /** Reference to the deployed tool (for deployed tools mode) */
  deploymentId?: string;
  /** Tool ID for fetching full definition (for deployed tools mode) */
  toolId?: string;
  /** Reference to inline component (for inline chat mode - polls, RSVP) */
  componentId?: string;
  /** Current state of the component */
  state?: Record<string, unknown>;
  /** Whether component is still active */
  isActive: boolean;
}

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface ChatMessageProps {
  boardId: string;
  spaceId: string;

  // Author
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: string;

  // Content
  type: ChatMessageType;
  content: string;

  // For inline HiveLab components
  componentData?: InlineComponentData;

  // For system messages
  systemAction?: 'user_joined' | 'user_left' | 'board_created' | 'settings_changed' | 'event_started';
  systemMeta?: Record<string, unknown>;

  // Metadata
  timestamp: Date;
  editedAt?: Date;

  // Reactions
  reactions: ChatMessageReaction[];

  // Threading
  replyToId?: string;
  threadCount: number;

  // Status
  isDeleted: boolean;
  isPinned: boolean;
}

export class ChatMessage extends Entity<ChatMessageProps> {
  get boardId(): string {
    return this.props.boardId;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get author(): ChatMessageAuthor {
    return {
      id: this.props.authorId,
      name: this.props.authorName,
      avatarUrl: this.props.authorAvatarUrl,
      role: this.props.authorRole as ChatMessageAuthor['role'],
    };
  }

  get type(): ChatMessageType {
    return this.props.type;
  }

  get content(): string {
    return this.props.content;
  }

  get componentData(): InlineComponentData | undefined {
    return this.props.componentData;
  }

  get systemAction(): string | undefined {
    return this.props.systemAction;
  }

  get systemMeta(): Record<string, unknown> | undefined {
    return this.props.systemMeta;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get editedAt(): Date | undefined {
    return this.props.editedAt;
  }

  get reactions(): ChatMessageReaction[] {
    return this.props.reactions;
  }

  get replyToId(): string | undefined {
    return this.props.replyToId;
  }

  get threadCount(): number {
    return this.props.threadCount;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get isPinned(): boolean {
    return this.props.isPinned;
  }

  get isEdited(): boolean {
    return this.props.editedAt !== undefined;
  }

  private constructor(props: ChatMessageProps, id?: string) {
    // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
    // Math.random() is predictable and can lead to ID collision attacks
    super(props, id || `msg_${crypto.randomUUID()}`);
  }

  /**
   * Create a text message
   */
  public static createText(
    props: {
      boardId: string;
      spaceId: string;
      authorId: string;
      authorName: string;
      authorAvatarUrl?: string;
      authorRole?: string;
      content: string;
      replyToId?: string;
    },
    id?: string
  ): Result<ChatMessage> {
    if (!props.content || props.content.trim().length === 0) {
      return Result.fail<ChatMessage>('Message content is required');
    }

    if (props.content.length > 4000) {
      return Result.fail<ChatMessage>('Message cannot exceed 4000 characters');
    }

    return Result.ok<ChatMessage>(
      new ChatMessage(
        {
          boardId: props.boardId,
          spaceId: props.spaceId,
          authorId: props.authorId,
          authorName: props.authorName,
          authorAvatarUrl: props.authorAvatarUrl,
          authorRole: props.authorRole,
          type: 'text',
          content: props.content.trim(),
          timestamp: new Date(),
          reactions: [],
          replyToId: props.replyToId,
          threadCount: 0,
          isDeleted: false,
          isPinned: false,
        },
        id
      )
    );
  }

  /**
   * Create an inline component message (HiveLab tool in chat)
   */
  public static createInlineComponent(
    props: {
      boardId: string;
      spaceId: string;
      authorId: string;
      authorName: string;
      authorAvatarUrl?: string;
      authorRole?: string;
      content: string;
      componentData: InlineComponentData;
    },
    id?: string
  ): Result<ChatMessage> {
    if (!props.componentData.elementType) {
      return Result.fail<ChatMessage>('Component element type is required');
    }

    return Result.ok<ChatMessage>(
      new ChatMessage(
        {
          boardId: props.boardId,
          spaceId: props.spaceId,
          authorId: props.authorId,
          authorName: props.authorName,
          authorAvatarUrl: props.authorAvatarUrl,
          authorRole: props.authorRole,
          type: 'inline_component',
          content: props.content || 'Shared a tool',
          componentData: props.componentData,
          timestamp: new Date(),
          reactions: [],
          threadCount: 0,
          isDeleted: false,
          isPinned: false,
        },
        id
      )
    );
  }

  /**
   * Create a system message
   */
  public static createSystem(
    props: {
      boardId: string;
      spaceId: string;
      action: ChatMessageProps['systemAction'];
      content: string;
      meta?: Record<string, unknown>;
    },
    id?: string
  ): Result<ChatMessage> {
    return Result.ok<ChatMessage>(
      new ChatMessage(
        {
          boardId: props.boardId,
          spaceId: props.spaceId,
          authorId: 'system',
          authorName: 'System',
          type: 'system',
          content: props.content,
          systemAction: props.action,
          systemMeta: props.meta,
          timestamp: new Date(),
          reactions: [],
          threadCount: 0,
          isDeleted: false,
          isPinned: false,
        },
        id
      )
    );
  }

  /**
   * Edit message content
   */
  public edit(newContent: string): Result<void> {
    if (this.props.type !== 'text') {
      return Result.fail<void>('Only text messages can be edited');
    }

    if (!newContent || newContent.trim().length === 0) {
      return Result.fail<void>('Message content cannot be empty');
    }

    if (newContent.length > 4000) {
      return Result.fail<void>('Message cannot exceed 4000 characters');
    }

    this.props.content = newContent.trim();
    this.props.editedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Add a reaction
   */
  public addReaction(emoji: string, userId: string): void {
    const existing = this.props.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (!existing.userIds.includes(userId)) {
        existing.userIds.push(userId);
        existing.count += 1;
      }
    } else {
      this.props.reactions.push({
        emoji,
        count: 1,
        userIds: [userId],
      });
    }
  }

  /**
   * Remove a reaction
   */
  public removeReaction(emoji: string, userId: string): void {
    const existing = this.props.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      existing.userIds = existing.userIds.filter((id) => id !== userId);
      existing.count = existing.userIds.length;

      // Remove empty reactions
      if (existing.count === 0) {
        this.props.reactions = this.props.reactions.filter((r) => r.emoji !== emoji);
      }
    }
  }

  /**
   * Check if user has reacted with emoji
   */
  public hasUserReacted(emoji: string, userId: string): boolean {
    const reaction = this.props.reactions.find((r) => r.emoji === emoji);
    return reaction?.userIds.includes(userId) ?? false;
  }

  /**
   * Increment thread count
   */
  public incrementThreadCount(): void {
    this.props.threadCount += 1;
  }

  /**
   * Soft delete the message
   */
  public delete(): void {
    this.props.isDeleted = true;
    this.props.content = '[Message deleted]';
  }

  /**
   * Pin the message
   */
  public pin(): void {
    this.props.isPinned = true;
  }

  /**
   * Unpin the message
   */
  public unpin(): void {
    this.props.isPinned = false;
  }

  /**
   * Convert to plain object for persistence
   */
  public toDTO(): Record<string, unknown> {
    return {
      id: this.id,
      boardId: this.props.boardId,
      spaceId: this.props.spaceId,
      authorId: this.props.authorId,
      authorName: this.props.authorName,
      authorAvatarUrl: this.props.authorAvatarUrl,
      authorRole: this.props.authorRole,
      type: this.props.type,
      content: this.props.content,
      componentData: this.props.componentData,
      systemAction: this.props.systemAction,
      systemMeta: this.props.systemMeta,
      timestamp: this.props.timestamp.getTime(),
      editedAt: this.props.editedAt?.getTime(),
      reactions: this.props.reactions,
      replyToId: this.props.replyToId,
      threadCount: this.props.threadCount,
      isDeleted: this.props.isDeleted,
      isPinned: this.props.isPinned,
    };
  }

  /**
   * Reconstruct from persistence
   */
  public static fromDTO(data: Record<string, unknown>): Result<ChatMessage> {
    try {
      return Result.ok<ChatMessage>(
        new ChatMessage(
          {
            boardId: data.boardId as string,
            spaceId: data.spaceId as string,
            authorId: data.authorId as string,
            authorName: data.authorName as string,
            authorAvatarUrl: data.authorAvatarUrl as string | undefined,
            authorRole: data.authorRole as string | undefined,
            type: data.type as ChatMessageType,
            content: data.content as string,
            componentData: data.componentData as InlineComponentData | undefined,
            systemAction: data.systemAction as ChatMessageProps['systemAction'],
            systemMeta: data.systemMeta as Record<string, unknown> | undefined,
            timestamp: new Date(data.timestamp as number),
            editedAt: data.editedAt ? new Date(data.editedAt as number) : undefined,
            reactions: (data.reactions as ChatMessageReaction[]) || [],
            replyToId: data.replyToId as string | undefined,
            threadCount: (data.threadCount as number) || 0,
            isDeleted: Boolean(data.isDeleted),
            isPinned: Boolean(data.isPinned),
          },
          data.id as string
        )
      );
    } catch (error) {
      return Result.fail<ChatMessage>('Failed to reconstruct ChatMessage from DTO');
    }
  }
}
