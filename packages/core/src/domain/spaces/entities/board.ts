/**
 * Board Entity
 * Represents a chat board (channel) in a space
 * Think: Discord channels within a server
 *
 * Boards are real-time chat channels where members can have conversations.
 * They support different types: general, topic-specific, or event-linked.
 */

import { Entity } from '../../shared/base/Entity.base';
import { Result } from '../../shared/base/Result';

export type BoardType = 'general' | 'topic' | 'event';
export type BoardPermission = 'all' | 'members' | 'leaders';

interface BoardProps {
  name: string;
  type: BoardType;
  description?: string;
  order: number;
  isDefault: boolean;

  // Event-linked boards
  linkedEventId?: string;

  // Permissions
  canPost: BoardPermission;
  canReact: BoardPermission;

  // Stats
  messageCount: number;
  participantCount: number;

  // Metadata
  createdBy: string;
  createdAt: Date;
  lastActivityAt?: Date;

  // Archival
  isArchived: boolean;
  archivedAt?: Date;

  // Moderation
  isLocked: boolean;
  pinnedMessageIds: string[];
}

export class Board extends Entity<BoardProps> {
  get name(): string {
    return this.props.name;
  }

  get type(): BoardType {
    return this.props.type;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get order(): number {
    return this.props.order;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get linkedEventId(): string | undefined {
    return this.props.linkedEventId;
  }

  get canPost(): BoardPermission {
    return this.props.canPost;
  }

  get canReact(): BoardPermission {
    return this.props.canReact;
  }

  get messageCount(): number {
    return this.props.messageCount;
  }

  get participantCount(): number {
    return this.props.participantCount;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastActivityAt(): Date | undefined {
    return this.props.lastActivityAt;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get archivedAt(): Date | undefined {
    return this.props.archivedAt;
  }

  get isLocked(): boolean {
    return this.props.isLocked;
  }

  get pinnedMessageIds(): string[] {
    return [...this.props.pinnedMessageIds];
  }

  private constructor(props: BoardProps, id?: string) {
    // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
    super(props, id || `board_${crypto.randomUUID()}`);
  }

  /**
   * Create a new Board
   */
  public static create(
    props: Partial<BoardProps> & {
      name: string;
      type: BoardType;
      createdBy: string;
    },
    id?: string
  ): Result<Board> {
    // Validation
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Board>('Board name is required');
    }

    if (props.name.length > 50) {
      return Result.fail<Board>('Board name cannot exceed 50 characters');
    }

    const boardProps: BoardProps = {
      name: props.name.trim(),
      type: props.type,
      description: props.description?.trim(),
      order: props.order ?? 0,
      isDefault: props.isDefault ?? false,
      linkedEventId: props.linkedEventId,
      canPost: props.canPost ?? 'members',
      canReact: props.canReact ?? 'all',
      messageCount: props.messageCount ?? 0,
      participantCount: props.participantCount ?? 0,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
      lastActivityAt: props.lastActivityAt,
      isArchived: props.isArchived ?? false,
      archivedAt: props.archivedAt,
      isLocked: props.isLocked ?? false,
      pinnedMessageIds: props.pinnedMessageIds ?? [],
    };

    return Result.ok<Board>(new Board(boardProps, id));
  }

  /**
   * Create a general board (default channel)
   * Uses simple "general" ID since boards are already scoped within space collection
   */
  public static createGeneral(createdBy: string, _spaceId?: string): Result<Board> {
    return Board.create({
      name: 'General',
      type: 'general',
      description: 'General discussion for all members',
      isDefault: true,
      order: 0,
      createdBy,
    }, 'general');
  }

  /**
   * Create an event-linked board
   */
  public static createForEvent(
    eventId: string,
    eventName: string,
    createdBy: string
  ): Result<Board> {
    return Board.create({
      name: eventName,
      type: 'event',
      linkedEventId: eventId,
      createdBy,
    });
  }

  /**
   * Update the board name
   */
  public setName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail<void>('Board name cannot be empty');
    }
    if (name.length > 50) {
      return Result.fail<void>('Board name cannot exceed 50 characters');
    }
    this.props.name = name.trim();
    return Result.ok<void>();
  }

  /**
   * Update description
   */
  public setDescription(description: string | undefined): void {
    this.props.description = description?.trim();
  }

  /**
   * Update order
   */
  public setOrder(order: number): void {
    this.props.order = order;
  }

  /**
   * Set as default board
   */
  public setAsDefault(): void {
    this.props.isDefault = true;
  }

  /**
   * Remove default status
   */
  public removeDefault(): void {
    this.props.isDefault = false;
  }

  /**
   * Update post permission
   */
  public setPostPermission(permission: BoardPermission): void {
    this.props.canPost = permission;
  }

  /**
   * Update react permission
   */
  public setReactPermission(permission: BoardPermission): void {
    this.props.canReact = permission;
  }

  /**
   * Increment message count
   */
  public incrementMessageCount(): void {
    this.props.messageCount += 1;
    this.props.lastActivityAt = new Date();
  }

  /**
   * Update participant count
   */
  public setParticipantCount(count: number): void {
    this.props.participantCount = count;
  }

  /**
   * Pin a message
   */
  public pinMessage(messageId: string): Result<void> {
    if (this.props.pinnedMessageIds.length >= 10) {
      return Result.fail<void>('Cannot pin more than 10 messages');
    }
    if (!this.props.pinnedMessageIds.includes(messageId)) {
      this.props.pinnedMessageIds.push(messageId);
    }
    return Result.ok<void>();
  }

  /**
   * Unpin a message
   */
  public unpinMessage(messageId: string): void {
    this.props.pinnedMessageIds = this.props.pinnedMessageIds.filter(id => id !== messageId);
  }

  /**
   * Lock the board (prevent new messages)
   */
  public lock(): void {
    this.props.isLocked = true;
  }

  /**
   * Unlock the board
   */
  public unlock(): void {
    this.props.isLocked = false;
  }

  /**
   * Archive the board
   */
  public archive(): void {
    this.props.isArchived = true;
    this.props.archivedAt = new Date();
  }

  /**
   * Unarchive the board
   */
  public unarchive(): void {
    this.props.isArchived = false;
    this.props.archivedAt = undefined;
  }

  /**
   * Check if user can post based on permission and role
   */
  public canUserPost(userRole: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'): boolean {
    if (this.props.isLocked || this.props.isArchived) {
      return false;
    }

    switch (this.props.canPost) {
      case 'all':
        return userRole !== 'guest';
      case 'members':
        return ['owner', 'admin', 'moderator', 'member'].includes(userRole);
      case 'leaders':
        return ['owner', 'admin', 'moderator'].includes(userRole);
      default:
        return false;
    }
  }

  /**
   * Convert to plain object for persistence
   */
  public toDTO(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.props.name,
      type: this.props.type,
      description: this.props.description,
      order: this.props.order,
      isDefault: this.props.isDefault,
      linkedEventId: this.props.linkedEventId,
      canPost: this.props.canPost,
      canReact: this.props.canReact,
      messageCount: this.props.messageCount,
      participantCount: this.props.participantCount,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
      lastActivityAt: this.props.lastActivityAt?.toISOString(),
      isArchived: this.props.isArchived,
      archivedAt: this.props.archivedAt?.toISOString(),
      isLocked: this.props.isLocked,
      pinnedMessageIds: this.props.pinnedMessageIds,
    };
  }
}
