/**
 * Firebase Admin Chat Repository
 * Server-side implementation for boards and messages
 *
 * Implements IBoardRepository and IMessageRepository interfaces
 * for the SpaceChatService.
 */

import { dbAdmin } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Result } from '../../../domain/shared/base/Result';
import { Board, BoardType, BoardPermission } from '../../../domain/spaces/entities/board';
import { ChatMessage, ChatMessageType, InlineComponentData, ChatMessageReaction } from '../../../domain/spaces/entities/chat-message';
import { IBoardRepository, IMessageRepository, SearchMessagesOptions, SearchMessagesResult } from '../../../application/spaces/space-chat.service';

// Re-export interfaces for convenience
export type { IBoardRepository, IMessageRepository };

/**
 * Board document structure in Firestore
 */
interface BoardDocument {
  name: string;
  type: BoardType;
  description?: string;
  order: number;
  isDefault: boolean;
  linkedEventId?: string;
  canPost: BoardPermission;
  canReact: BoardPermission;
  messageCount: number;
  participantCount: number;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp | Date;
  lastActivityAt?: FirebaseFirestore.Timestamp | Date | null;
  isArchived: boolean;
  archivedAt?: FirebaseFirestore.Timestamp | Date;
  isLocked: boolean;
  pinnedMessageIds: string[];
}

/**
 * Message document structure in Firestore
 */
interface MessageDocument {
  boardId: string;
  spaceId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: string;
  type: ChatMessageType;
  content: string;
  componentData?: InlineComponentData;
  systemAction?: string;
  systemMeta?: Record<string, unknown>;
  timestamp: number;
  editedAt?: number;
  reactions: Array<{ emoji: string; count: number; userIds: string[] }>;
  replyToId?: string;
  replyToPreview?: string;
  threadCount: number;
  isDeleted: boolean;
  isPinned: boolean;
}

/**
 * Convert Firestore timestamp to Date
 */
function toDate(value: FirebaseFirestore.Timestamp | Date | undefined | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof (value as any).toDate === 'function') {
    return (value as FirebaseFirestore.Timestamp).toDate();
  }
  return undefined;
}

/**
 * Firebase Admin Board Repository
 */
export class FirebaseAdminBoardRepository implements IBoardRepository {
  private getBoardsRef(spaceId: string) {
    return dbAdmin.collection('spaces').doc(spaceId).collection('boards');
  }

  async findById(spaceId: string, boardId: string): Promise<Result<Board | null>> {
    try {
      const docRef = this.getBoardsRef(spaceId).doc(boardId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.ok<Board | null>(null);
      }

      const data = docSnap.data() as BoardDocument;
      const boardResult = Board.create(
        {
          name: data.name,
          type: data.type,
          description: data.description,
          order: data.order,
          isDefault: data.isDefault,
          linkedEventId: data.linkedEventId,
          canPost: data.canPost,
          canReact: data.canReact,
          messageCount: data.messageCount,
          participantCount: data.participantCount,
          createdBy: data.createdBy,
          createdAt: toDate(data.createdAt),
          lastActivityAt: toDate(data.lastActivityAt),
          isArchived: data.isArchived,
          archivedAt: toDate(data.archivedAt),
          isLocked: data.isLocked,
          pinnedMessageIds: data.pinnedMessageIds || [],
        },
        docSnap.id
      );

      if (boardResult.isFailure) {
        return Result.fail<Board | null>(boardResult.error ?? 'Failed to parse board');
      }

      return Result.ok<Board | null>(boardResult.getValue());
    } catch (error) {
      return Result.fail<Board | null>(`Failed to find board: ${error}`);
    }
  }

  async findBySpaceId(spaceId: string): Promise<Result<Board[]>> {
    try {
      const snapshot = await this.getBoardsRef(spaceId)
        .where('isArchived', '==', false)
        .orderBy('order', 'asc')
        .get();

      const boards: Board[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data() as BoardDocument;
        const boardResult = Board.create(
          {
            name: data.name,
            type: data.type,
            description: data.description,
            order: data.order,
            isDefault: data.isDefault,
            linkedEventId: data.linkedEventId,
            canPost: data.canPost,
            canReact: data.canReact,
            messageCount: data.messageCount,
            participantCount: data.participantCount,
            createdBy: data.createdBy,
            createdAt: toDate(data.createdAt),
            lastActivityAt: toDate(data.lastActivityAt),
            isArchived: data.isArchived,
            archivedAt: toDate(data.archivedAt),
            isLocked: data.isLocked,
            pinnedMessageIds: data.pinnedMessageIds || [],
          },
          doc.id
        );

        if (boardResult.isSuccess) {
          boards.push(boardResult.getValue());
        }
      }

      return Result.ok<Board[]>(boards);
    } catch (error) {
      return Result.fail<Board[]>(`Failed to find boards: ${error}`);
    }
  }

  async save(spaceId: string, board: Board): Promise<Result<void>> {
    try {
      const dto = board.toDTO();
      const docRef = this.getBoardsRef(spaceId).doc(board.id);

      // Firestore doesn't accept undefined values - filter them out
      const dataToSave: Record<string, unknown> = {
        name: dto.name,
        type: dto.type,
        order: dto.order,
        isDefault: dto.isDefault,
        canPost: dto.canPost,
        canReact: dto.canReact,
        messageCount: dto.messageCount,
        participantCount: dto.participantCount,
        createdBy: dto.createdBy,
        createdAt: dto.createdAt,
        isArchived: dto.isArchived,
        isLocked: dto.isLocked,
        pinnedMessageIds: dto.pinnedMessageIds,
      };

      // Only add optional fields if they have values
      if (dto.description !== undefined) dataToSave.description = dto.description;
      if (dto.linkedEventId !== undefined) dataToSave.linkedEventId = dto.linkedEventId;
      if (dto.lastActivityAt !== undefined) dataToSave.lastActivityAt = dto.lastActivityAt;
      if (dto.archivedAt !== undefined) dataToSave.archivedAt = dto.archivedAt;

      await docRef.set(dataToSave, { merge: true });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save board: ${error}`);
    }
  }

  async delete(spaceId: string, boardId: string): Promise<Result<void>> {
    try {
      const docRef = this.getBoardsRef(spaceId).doc(boardId);
      await docRef.delete();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete board: ${error}`);
    }
  }
}

/**
 * Firebase Admin Message Repository
 */
export class FirebaseAdminMessageRepository implements IMessageRepository {
  private getMessagesRef(spaceId: string, boardId: string) {
    return dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(boardId)
      .collection('messages');
  }

  private getBoardRef(spaceId: string, boardId: string) {
    return dbAdmin.collection('spaces').doc(spaceId).collection('boards').doc(boardId);
  }

  /**
   * Convert a Firestore document to a ChatMessage entity
   * Returns null if conversion fails
   */
  private docToMessage(id: string, data: MessageDocument): ChatMessage | null {
    const messageResult = ChatMessage.fromDTO({
      id,
      boardId: data.boardId,
      spaceId: data.spaceId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatarUrl: data.authorAvatarUrl,
      authorRole: data.authorRole,
      type: data.type || 'text',
      content: data.content,
      componentData: data.componentData,
      systemAction: data.systemAction,
      systemMeta: data.systemMeta,
      timestamp: data.timestamp || Date.now(),
      editedAt: data.editedAt,
      reactions: data.reactions || [],
      replyToId: data.replyToId,
      replyToPreview: data.replyToPreview,
      threadCount: data.threadCount || 0,
      isDeleted: data.isDeleted || false,
      isPinned: data.isPinned || false,
    });

    return messageResult.isSuccess ? messageResult.getValue() : null;
  }

  async findById(
    spaceId: string,
    boardId: string,
    messageId: string
  ): Promise<Result<ChatMessage | null>> {
    try {
      const docRef = this.getMessagesRef(spaceId, boardId).doc(messageId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.ok<ChatMessage | null>(null);
      }

      const data = docSnap.data() as MessageDocument;
      const messageResult = ChatMessage.fromDTO({
        id: docSnap.id,
        boardId: data.boardId,
        spaceId: data.spaceId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorAvatarUrl: data.authorAvatarUrl,
        authorRole: data.authorRole,
        type: data.type,
        content: data.content,
        componentData: data.componentData,
        systemAction: data.systemAction,
        systemMeta: data.systemMeta,
        timestamp: data.timestamp,
        editedAt: data.editedAt,
        reactions: data.reactions || [],
        replyToId: data.replyToId,
        replyToPreview: data.replyToPreview,
        threadCount: data.threadCount || 0,
        isDeleted: data.isDeleted || false,
        isPinned: data.isPinned || false,
      });

      if (messageResult.isFailure) {
        return Result.fail<ChatMessage | null>(messageResult.error ?? 'Failed to parse message');
      }

      return Result.ok<ChatMessage | null>(messageResult.getValue());
    } catch (error) {
      return Result.fail<ChatMessage | null>(`Failed to find message: ${error}`);
    }
  }

  async findByBoard(
    spaceId: string,
    boardId: string,
    options: { limit: number; before?: number; after?: number }
  ): Promise<Result<{ messages: ChatMessage[]; hasMore: boolean }>> {
    try {
      let query = this.getMessagesRef(spaceId, boardId)
        .orderBy('timestamp', 'desc')
        .limit(options.limit + 1); // +1 to check hasMore

      if (options.before) {
        query = query.where('timestamp', '<', options.before);
      }

      if (options.after) {
        query = query.where('timestamp', '>', options.after);
      }

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > options.limit;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

      const messages: ChatMessage[] = [];

      for (const doc of docs) {
        const data = doc.data() as MessageDocument;
        const messageResult = ChatMessage.fromDTO({
          id: doc.id,
          boardId: data.boardId || boardId,
          spaceId: data.spaceId || spaceId,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatarUrl: data.authorAvatarUrl,
          authorRole: data.authorRole,
          type: data.type || 'text',
          content: data.content,
          componentData: data.componentData,
          systemAction: data.systemAction,
          systemMeta: data.systemMeta,
          timestamp: data.timestamp || Date.now(),
          editedAt: data.editedAt,
          reactions: data.reactions || [],
          replyToId: data.replyToId,
          replyToPreview: data.replyToPreview,
          threadCount: data.threadCount || 0,
          isDeleted: data.isDeleted || false,
          isPinned: data.isPinned || false,
        });

        if (messageResult.isSuccess) {
          messages.push(messageResult.getValue());
        }
      }

      return Result.ok({ messages, hasMore });
    } catch (error) {
      return Result.fail<{ messages: ChatMessage[]; hasMore: boolean }>(
        `Failed to find messages: ${error}`
      );
    }
  }

  async findByReplyTo(
    spaceId: string,
    boardId: string,
    parentMessageId: string,
    options: { limit: number; before?: number }
  ): Promise<Result<{ messages: ChatMessage[]; hasMore: boolean }>> {
    try {
      let query = this.getMessagesRef(spaceId, boardId)
        .where('replyToId', '==', parentMessageId)
        .orderBy('timestamp', 'asc')
        .limit(options.limit + 1); // +1 to check hasMore

      if (options.before) {
        query = query.where('timestamp', '<', options.before);
      }

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > options.limit;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

      const messages: ChatMessage[] = [];

      for (const doc of docs) {
        const data = doc.data() as MessageDocument;
        const messageResult = ChatMessage.fromDTO({
          id: doc.id,
          boardId: data.boardId || boardId,
          spaceId: data.spaceId || spaceId,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatarUrl: data.authorAvatarUrl,
          authorRole: data.authorRole,
          type: data.type || 'text',
          content: data.content,
          componentData: data.componentData,
          systemAction: data.systemAction,
          systemMeta: data.systemMeta,
          timestamp: data.timestamp || Date.now(),
          editedAt: data.editedAt,
          reactions: data.reactions || [],
          replyToId: data.replyToId,
          replyToPreview: data.replyToPreview,
          threadCount: data.threadCount || 0,
          isDeleted: data.isDeleted || false,
          isPinned: data.isPinned || false,
        });

        if (messageResult.isSuccess) {
          messages.push(messageResult.getValue());
        }
      }

      return Result.ok({ messages, hasMore });
    } catch (error) {
      return Result.fail<{ messages: ChatMessage[]; hasMore: boolean }>(
        `Failed to find thread replies: ${error}`
      );
    }
  }

  async save(spaceId: string, boardId: string, message: ChatMessage): Promise<Result<void>> {
    try {
      const dto = message.toDTO();
      const docRef = this.getMessagesRef(spaceId, boardId).doc(message.id);

      // Firestore doesn't accept undefined values - filter them out
      const dataToSave: Record<string, unknown> = {
        boardId: dto.boardId,
        spaceId: dto.spaceId,
        authorId: dto.authorId,
        authorName: dto.authorName,
        type: dto.type,
        content: dto.content,
        timestamp: dto.timestamp,
        reactions: dto.reactions,
        threadCount: dto.threadCount,
        isDeleted: dto.isDeleted,
        isPinned: dto.isPinned,
      };

      // Only add optional fields if they have values
      if (dto.authorAvatarUrl !== undefined) dataToSave.authorAvatarUrl = dto.authorAvatarUrl;
      if (dto.authorRole !== undefined) dataToSave.authorRole = dto.authorRole;
      if (dto.componentData !== undefined) dataToSave.componentData = dto.componentData;
      if (dto.systemAction !== undefined) dataToSave.systemAction = dto.systemAction;
      if (dto.systemMeta !== undefined) dataToSave.systemMeta = dto.systemMeta;
      if (dto.editedAt !== undefined) dataToSave.editedAt = dto.editedAt;
      if (dto.replyToId !== undefined) dataToSave.replyToId = dto.replyToId;
      if (dto.replyToPreview !== undefined) dataToSave.replyToPreview = dto.replyToPreview;

      await docRef.set(dataToSave);

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save message: ${error}`);
    }
  }

  async update(spaceId: string, boardId: string, message: ChatMessage): Promise<Result<void>> {
    try {
      const dto = message.toDTO();
      const docRef = this.getMessagesRef(spaceId, boardId).doc(message.id);

      await docRef.update({
        content: dto.content,
        editedAt: dto.editedAt,
        reactions: dto.reactions,
        isDeleted: dto.isDeleted,
        isPinned: dto.isPinned,
        threadCount: dto.threadCount,
      });

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update message: ${error}`);
    }
  }

  async delete(spaceId: string, boardId: string, messageId: string): Promise<Result<void>> {
    try {
      const docRef = this.getMessagesRef(spaceId, boardId).doc(messageId);
      await docRef.delete();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete message: ${error}`);
    }
  }

  /**
   * SCALING FIX: Atomically update reactions using a transaction
   * Prevents race conditions when multiple users react to the same message simultaneously.
   * Without this, concurrent reactions can overwrite each other.
   *
   * @param spaceId - Space ID
   * @param boardId - Board ID
   * @param messageId - Message ID
   * @param emoji - Emoji to add/remove
   * @param userId - User adding/removing reaction
   * @param action - 'add' or 'remove'
   */
  async updateReactionAtomic(
    spaceId: string,
    boardId: string,
    messageId: string,
    emoji: string,
    userId: string,
    action: 'add' | 'remove'
  ): Promise<Result<void>> {
    try {
      const docRef = this.getMessagesRef(spaceId, boardId).doc(messageId);

      await dbAdmin.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw new Error('Message not found');
        }

        const data = doc.data() as MessageDocument;
        const reactions: ChatMessageReaction[] = data.reactions || [];

        // Find existing reaction entry for this emoji
        const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

        if (action === 'add') {
          if (reactionIndex >= 0) {
            // Emoji already exists - add user if not already reacted
            if (!reactions[reactionIndex].userIds.includes(userId)) {
              reactions[reactionIndex].count++;
              reactions[reactionIndex].userIds.push(userId);
            }
          } else {
            // New emoji - create entry
            reactions.push({ emoji, count: 1, userIds: [userId] });
          }
        } else {
          // Remove reaction
          if (reactionIndex >= 0) {
            const userIndex = reactions[reactionIndex].userIds.indexOf(userId);
            if (userIndex >= 0) {
              reactions[reactionIndex].count--;
              reactions[reactionIndex].userIds.splice(userIndex, 1);

              // Remove emoji entry if no users left
              if (reactions[reactionIndex].count <= 0) {
                reactions.splice(reactionIndex, 1);
              }
            }
          }
        }

        transaction.update(docRef, { reactions });
      });

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to update reaction: ${error}`);
    }
  }

  async incrementBoardMessageCount(spaceId: string, boardId: string): Promise<Result<void>> {
    try {
      const boardRef = this.getBoardRef(spaceId, boardId);
      await boardRef.update({
        messageCount: FieldValue.increment(1),
        lastActivityAt: FieldValue.serverTimestamp(),
      });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to increment message count: ${error}`);
    }
  }

  /**
   * Find pinned messages in a space, optionally filtered by board
   */
  async findPinned(spaceId: string, boardId?: string): Promise<Result<ChatMessage[]>> {
    try {
      const messages: ChatMessage[] = [];

      if (boardId) {
        // Query specific board
        const query = this.getMessagesRef(spaceId, boardId)
          .where('isPinned', '==', true)
          .where('isDeleted', '==', false)
          .orderBy('timestamp', 'desc')
          .limit(50);

        const snapshot = await query.get();
        for (const doc of snapshot.docs) {
          const messageResult = this.docToMessage(doc.id, doc.data() as MessageDocument);
          if (messageResult) {
            messages.push(messageResult);
          }
        }
      } else {
        // Get all boards and query each
        const boardsResult = await (new FirebaseAdminBoardRepository()).findBySpaceId(spaceId);
        if (boardsResult.isFailure) {
          return Result.fail<ChatMessage[]>(boardsResult.error ?? 'Failed to get boards');
        }

        const boards = boardsResult.getValue();
        for (const board of boards) {
          const query = this.getMessagesRef(spaceId, board.id)
            .where('isPinned', '==', true)
            .where('isDeleted', '==', false)
            .orderBy('timestamp', 'desc')
            .limit(10);  // Limit per board

          const snapshot = await query.get();
          for (const doc of snapshot.docs) {
            const messageResult = this.docToMessage(doc.id, doc.data() as MessageDocument);
            if (messageResult) {
              messages.push(messageResult);
            }
          }
        }

        // Sort by timestamp descending and limit to 50 total
        messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        messages.splice(50);
      }

      return Result.ok<ChatMessage[]>(messages);
    } catch (error) {
      return Result.fail<ChatMessage[]>(`Failed to fetch pinned messages: ${error}`);
    }
  }

  /**
   * Search messages within a space
   * Note: Firestore doesn't support full-text search natively.
   * This implementation uses case-insensitive prefix matching on content.
   * For production, consider using Algolia, Typesense, or Firebase Extensions.
   */
  async search(spaceId: string, options: SearchMessagesOptions): Promise<Result<SearchMessagesResult>> {
    try {
      const limit = options.limit ?? 50;
      const offset = options.offset ?? 0;
      const query = options.query.toLowerCase();
      const allMessages: ChatMessage[] = [];

      // Get boards to search
      let boardIds: string[] = [];
      if (options.boardId) {
        boardIds = [options.boardId];
      } else {
        const boardsResult = await (new FirebaseAdminBoardRepository()).findBySpaceId(spaceId);
        if (boardsResult.isFailure) {
          return Result.fail<SearchMessagesResult>(boardsResult.error ?? 'Failed to get boards');
        }
        boardIds = boardsResult.getValue().map(b => b.id);
      }

      // Search each board
      for (const boardId of boardIds) {
        let boardQuery = this.getMessagesRef(spaceId, boardId)
          .where('isDeleted', '==', false)
          .orderBy('timestamp', 'desc');

        // Apply date filters if provided
        if (options.startDate) {
          boardQuery = boardQuery.where('timestamp', '>=', options.startDate.getTime());
        }
        if (options.endDate) {
          boardQuery = boardQuery.where('timestamp', '<=', options.endDate.getTime());
        }

        // Filter by author if provided
        if (options.authorId) {
          boardQuery = boardQuery.where('authorId', '==', options.authorId);
        }

        // Firestore doesn't support full-text search, so we fetch more and filter client-side
        // In production, use a dedicated search service
        const snapshot = await boardQuery.limit(500).get();

        for (const doc of snapshot.docs) {
          const data = doc.data() as MessageDocument;

          // Client-side text search (case-insensitive)
          const contentLower = (data.content || '').toLowerCase();
          if (contentLower.includes(query)) {
            const messageResult = this.docToMessage(doc.id, data);
            if (messageResult) {
              allMessages.push(messageResult);
            }
          }
        }
      }

      // Sort by timestamp descending (most recent first)
      allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const totalCount = allMessages.length;
      const paginatedMessages = allMessages.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;

      return Result.ok<SearchMessagesResult>({
        messages: paginatedMessages,
        totalCount,
        hasMore,
      });
    } catch (error) {
      return Result.fail<SearchMessagesResult>(`Failed to search messages: ${error}`);
    }
  }
}

// Singleton instances
let boardRepoInstance: FirebaseAdminBoardRepository | null = null;
let messageRepoInstance: FirebaseAdminMessageRepository | null = null;

/**
 * Get the server-side Board Repository instance (singleton)
 */
export function getServerBoardRepository(): IBoardRepository {
  if (!boardRepoInstance) {
    boardRepoInstance = new FirebaseAdminBoardRepository();
  }
  return boardRepoInstance;
}

/**
 * Get the server-side Message Repository instance (singleton)
 */
export function getServerMessageRepository(): IMessageRepository {
  if (!messageRepoInstance) {
    messageRepoInstance = new FirebaseAdminMessageRepository();
  }
  return messageRepoInstance;
}

/**
 * Factory function to create chat repositories
 * @deprecated Use getServerBoardRepository() and getServerMessageRepository() instead
 */
export function createChatRepositories(): {
  boardRepo: FirebaseAdminBoardRepository;
  messageRepo: FirebaseAdminMessageRepository;
} {
  return {
    boardRepo: getServerBoardRepository() as FirebaseAdminBoardRepository,
    messageRepo: getServerMessageRepository() as FirebaseAdminMessageRepository,
  };
}
