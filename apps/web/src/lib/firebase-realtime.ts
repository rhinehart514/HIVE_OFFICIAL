import { type Database, getDatabase, ref, push, set, get, update, onValue, serverTimestamp, runTransaction, type DataSnapshot, type Unsubscribe } from 'firebase/database';
import { app } from '@hive/core';
import { logger } from './structured-logger';

/**
 * Firebase Realtime Database Helper for HIVE Platform
 * Handles real-time messaging, presence, and broadcasting
 */

export interface RealtimeMessage {
  id: string;
  type: 'chat' | 'notification' | 'tool_update' | 'presence' | 'system';
  channel: string;
  senderId: string;
  targetUsers?: string[];
  content: Record<string, unknown>;
  metadata: {
    timestamp: unknown; // Firebase ServerValue.TIMESTAMP
    priority: 'low' | 'normal' | 'high' | 'urgent';
    requiresAck: boolean;
    expiresAt?: unknown;
    retryCount: number;
  };
  delivery?: {
    sent: string[];
    delivered: string[];
    read: string[];
    failed: string[];
  };
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: unknown; // Firebase ServerValue.TIMESTAMP
  connectionId?: string;
  currentSpace?: string;
  activity?: string;
  metadata?: {
    platform: string;
    version: string;
  };
}

export interface ChatMessage {
  id: string;
  spaceId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'poll' | 'system';
  timestamp: unknown;
  reactions?: {
    [emoji: string]: string[]; // array of user IDs
  };
  edited?: boolean;
  editedAt?: unknown;
  replyTo?: string;
  mentions?: string[];
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
}

export interface TypingIndicator {
  userId: string;
  spaceId: string;
  timestamp: unknown;
  isTyping: boolean;
}

export class FirebaseRealtimeService {
  private database: Database;
  private listeners: Map<string, Unsubscribe[]> = new Map();
  /** Track last typing indicator write to prevent spam (key: spaceId:boardId:userId) */
  private lastTypingWrite: Map<string, { time: number; isTyping: boolean }> = new Map();
  /** Minimum interval between typing indicator writes (ms) - matches client TYPING_INDICATOR_INTERVAL_MS */
  private static readonly TYPING_WRITE_THROTTLE_MS = 3000;

  constructor() {
    this.database = getDatabase(app);
  }

  /**
   * Send a message to a specific channel
   */
  async sendMessage(message: Omit<RealtimeMessage, 'id'>): Promise<string> {
    try {
      const messagesRef = ref(this.database, `channels/${message.channel}/messages`);
      const messageRef = push(messagesRef);
      
      const messageWithId: RealtimeMessage = {
        ...message,
        id: messageRef.key!,
        metadata: {
          ...message.metadata,
          timestamp: serverTimestamp()
        }
      };

      await set(messageRef, messageWithId);
      
      // Update channel's last activity
      await set(ref(this.database, `channels/${message.channel}/lastActivity`), serverTimestamp());
      
      logger.info('Message sent to channel', { 
        messageId: messageRef.key, 
        channel: message.channel,
        type: message.type 
      });

      return messageRef.key!;
    } catch (error) {
      logger.error('Error sending message', { error: { error: error instanceof Error ? error.message : String(error) }, channel: message.channel });
      throw error;
    }
  }

  /**
   * Send a chat message to a space
   */
  async sendChatMessage(spaceId: string, userId: string, content: string, type: ChatMessage['type'] = 'text'): Promise<string> {
    try {
      const chatRef = ref(this.database, `chats/${spaceId}/messages`);
      const messageRef = push(chatRef);
      
      const chatMessage: ChatMessage = {
        id: messageRef.key!,
        spaceId,
        userId,
        content,
        type,
        timestamp: serverTimestamp()
      };

      await set(messageRef, chatMessage);
      
      // Update space's last message info
      await set(ref(this.database, `chats/${spaceId}/lastMessage`), {
        id: messageRef.key,
        userId,
        timestamp: serverTimestamp(),
        preview: content.substring(0, 100)
      });

      // Send notification via message system
      await this.sendMessage({
        type: 'notification',
        channel: `space:${spaceId}:chat`,
        senderId: userId,
        content: {
          type: 'new_chat_message',
          spaceId,
          messageId: messageRef.key,
          preview: content.substring(0, 100)
        },
        metadata: {
          timestamp: serverTimestamp(),
          priority: 'normal',
          requiresAck: false,
          retryCount: 0
        }
      });

      return messageRef.key!;
    } catch (error) {
      logger.error('Error sending chat message', { error: { error: error instanceof Error ? error.message : String(error) }, spaceId, userId });
      throw error;
    }
  }

  /**
   * Update user presence
   * SCALING: Dual-write to both user-indexed and space-indexed paths
   * - `presence/{userId}` for user lookups
   * - `space_presence/{spaceId}/{userId}` for space-specific queries (O(space members) not O(all users))
   */
  async updatePresence(userId: string, presenceData: Omit<PresenceData, 'userId'>): Promise<void> {
    try {
      const fullPresenceData: PresenceData = {
        userId,
        ...presenceData,
        lastSeen: serverTimestamp()
      };

      // Write to user-indexed path (for user lookups)
      const presenceRef = ref(this.database, `presence/${userId}`);
      await set(presenceRef, fullPresenceData);

      // SCALING FIX: Also write to space-indexed path for efficient space queries
      if (presenceData.currentSpace) {
        const spacePresenceRef = ref(this.database, `space_presence/${presenceData.currentSpace}/${userId}`);
        await set(spacePresenceRef, fullPresenceData);

        // Broadcast presence update to relevant spaces
        await this.sendMessage({
          type: 'presence',
          channel: `space:${presenceData.currentSpace}:presence`,
          senderId: 'system',
          content: {
            userId,
            status: presenceData.status,
            activity: presenceData.activity
          },
          metadata: {
            timestamp: serverTimestamp(),
            priority: 'low',
            requiresAck: false,
            retryCount: 0
          }
        });
      }

      logger.info('User presence updated', { userId, status: presenceData.status });
    } catch (error) {
      logger.error('Error updating presence', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
      throw error;
    }
  }

  /**
   * Clear user presence from a space
   * Call when user leaves a space or goes offline
   */
  async clearSpacePresence(userId: string, spaceId: string): Promise<void> {
    try {
      const spacePresenceRef = ref(this.database, `space_presence/${spaceId}/${userId}`);
      await set(spacePresenceRef, null);
      logger.info('Space presence cleared', { userId, spaceId });
    } catch (error) {
      logger.error('Error clearing space presence', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        spaceId
      });
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(spaceId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const typingRef = ref(this.database, `typing/${spaceId}/${userId}`);
      
      if (isTyping) {
        const typingData: TypingIndicator = {
          userId,
          spaceId,
          timestamp: serverTimestamp(),
          isTyping: true
        };
        await set(typingRef, typingData);
      } else {
        await set(typingRef, null); // Remove typing indicator
      }

      // Broadcast typing status
      await this.sendMessage({
        type: 'system',
        channel: `space:${spaceId}:typing`,
        senderId: userId,
        content: {
          isTyping,
          userId
        },
        metadata: {
          timestamp: serverTimestamp(),
          priority: 'low',
          requiresAck: false,
          retryCount: 0
        }
      });
    } catch (error) {
      logger.error('Error setting typing indicator', { error: { error: error instanceof Error ? error.message : String(error) }, spaceId, userId });
      throw error;
    }
  }

  /**
   * Send tool state update
   */
  async sendToolUpdate(toolId: string, spaceId: string, userId: string, updateData: Record<string, unknown>): Promise<void> {
    try {
      // Store tool state
      await set(ref(this.database, `tools/${toolId}/state`), {
        ...updateData,
        lastUpdated: serverTimestamp(),
        updatedBy: userId
      });

      // Broadcast update to space
      await this.sendMessage({
        type: 'tool_update',
        channel: `space:${spaceId}:tools`,
        senderId: userId,
        content: {
          toolId,
          updateType: updateData.type || 'state_change',
          data: updateData
        },
        metadata: {
          timestamp: serverTimestamp(),
          priority: 'normal',
          requiresAck: true,
          retryCount: 0
        }
      });

      logger.info('Tool update sent', { toolId, spaceId, userId });
    } catch (error) {
      logger.error('Error sending tool update', { error: { error: error instanceof Error ? error.message : String(error) }, toolId, spaceId });
      throw error;
    }
  }

  /**
   * Send system notification
   */
  async sendNotification(userId: string | string[], notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const userIds = Array.isArray(userId) ? userId : [userId];
      
      for (const uid of userIds) {
        await this.sendMessage({
          type: 'notification',
          channel: `user:${uid}:notifications`,
          senderId: 'system',
          targetUsers: [uid],
          content: notification,
          metadata: {
            timestamp: serverTimestamp(),
            priority: notification.type === 'error' ? 'high' : 'normal',
            requiresAck: true,
            retryCount: 0
          }
        });
      }

      logger.info('Notification sent', { userIds: userIds.join(','), type: notification.type });
    } catch (error) {
      logger.error('Error sending notification', { error: { error: error instanceof Error ? error.message : String(error) }, userId: Array.isArray(userId) ? userId.join(',') : userId });
      throw error;
    }
  }

  /**
   * Listen to channel messages
   */
  listenToChannel(channel: string, callback: (messages: RealtimeMessage[]) => void): () => void {
    const channelRef = ref(this.database, `channels/${channel}/messages`);

    // onValue returns an unsubscribe function
    const unsubscribe = onValue(channelRef, (snapshot: DataSnapshot) => {
      const messages: RealtimeMessage[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        messages.push(childSnapshot.val() as RealtimeMessage);
      });

      // Sort by timestamp (handle number | object for ServerTimestamp)
      messages.sort((a, b) => {
        const aTime = typeof a.metadata.timestamp === 'number' ? a.metadata.timestamp : 0;
        const bTime = typeof b.metadata.timestamp === 'number' ? b.metadata.timestamp : 0;
        return aTime - bTime;
      });
      callback(messages);
    });

    // Store unsubscribe function for cleanup
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(unsubscribe);

    // Return cleanup function
    return () => {
      unsubscribe();
      const channelListeners = this.listeners.get(channel);
      if (channelListeners) {
        const index = channelListeners.indexOf(unsubscribe);
        if (index > -1) {
          channelListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen to chat messages for a space
   */
  listenToChat(spaceId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const chatRef = ref(this.database, `chats/${spaceId}/messages`);

    const unsubscribe = onValue(chatRef, (snapshot: DataSnapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        messages.push(childSnapshot.val() as ChatMessage);
      });

      // Sort by timestamp (handle number | object for ServerTimestamp)
      messages.sort((a, b) => {
        const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
        const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
        return aTime - bTime;
      });
      callback(messages);
    });

    // Store unsubscribe for cleanup
    const listenerKey = `chat:${spaceId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey)!.push(unsubscribe);

    return () => {
      unsubscribe();
      const chatListeners = this.listeners.get(listenerKey);
      if (chatListeners) {
        const index = chatListeners.indexOf(unsubscribe);
        if (index > -1) {
          chatListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen to chat messages for a specific board within a space
   * Path: chats/{spaceId}/boards/{boardId}/messages
   */
  listenToChatBoard(
    spaceId: string,
    boardId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const boardChatRef = ref(this.database, `chats/${spaceId}/boards/${boardId}/messages`);

    const unsubscribe = onValue(
      boardChatRef,
      (snapshot: DataSnapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const msg = childSnapshot.val() as ChatMessage;
          messages.push({
            ...msg,
            id: msg.id || childSnapshot.key || '',
          });
        });

        // Sort by timestamp (oldest first for chat, handle number | object)
        messages.sort((a, b) => {
          const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
          const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
          return aTime - bTime;
        });
        callback(messages);
      },
      (error: Error) => {
        logger.error('RTDB chat board listener error', {
          spaceId,
          boardId,
          error: error instanceof Error ? error.message : String(error)
        });
        onError?.(error);
      }
    );

    // Store unsubscribe for cleanup
    const listenerKey = `chat:${spaceId}:${boardId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey)!.push(unsubscribe);

    logger.info('RTDB chat board listener started', { spaceId, boardId });

    return () => {
      unsubscribe();
      const chatListeners = this.listeners.get(listenerKey);
      if (chatListeners) {
        const index = chatListeners.indexOf(unsubscribe);
        if (index > -1) {
          chatListeners.splice(index, 1);
        }
      }
      logger.info('RTDB chat board listener stopped', { spaceId, boardId });
    };
  }

  /**
   * Listen to typing indicators for a specific board
   */
  listenToBoardTyping(
    spaceId: string,
    boardId: string,
    callback: (typing: Record<string, TypingIndicator>) => void
  ): () => void {
    const typingRef = ref(this.database, `typing/${spaceId}/${boardId}`);

    const unsubscribe = onValue(typingRef, (snapshot: DataSnapshot) => {
      const typing: Record<string, TypingIndicator> = {};
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        if (childSnapshot.key) {
          typing[childSnapshot.key] = childSnapshot.val() as TypingIndicator;
        }
      });

      callback(typing);
    });

    const listenerKey = `typing:${spaceId}:${boardId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey)!.push(unsubscribe);

    return () => {
      unsubscribe();
      const typingListeners = this.listeners.get(listenerKey);
      if (typingListeners) {
        const index = typingListeners.indexOf(unsubscribe);
        if (index > -1) {
          typingListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Set typing indicator for a specific board
   * Throttled to prevent spam - only writes if state changed or interval passed
   */
  async setBoardTypingIndicator(
    spaceId: string,
    boardId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const cacheKey = `${spaceId}:${boardId}:${userId}`;
      const now = Date.now();
      const lastWrite = this.lastTypingWrite.get(cacheKey);

      // Throttle logic: skip write if same state and interval hasn't passed
      if (lastWrite) {
        const timeSinceLastWrite = now - lastWrite.time;
        const stateUnchanged = lastWrite.isTyping === isTyping;

        // If state unchanged and we're within throttle window, skip
        if (stateUnchanged && timeSinceLastWrite < FirebaseRealtimeService.TYPING_WRITE_THROTTLE_MS) {
          return;
        }

        // If setting to false and already false, skip entirely
        if (!isTyping && !lastWrite.isTyping) {
          return;
        }
      }

      // Update cache before write
      this.lastTypingWrite.set(cacheKey, { time: now, isTyping });

      const typingRef = ref(this.database, `typing/${spaceId}/${boardId}/${userId}`);

      if (isTyping) {
        const typingData: TypingIndicator = {
          userId,
          spaceId,
          timestamp: serverTimestamp(),
          isTyping: true
        };
        await set(typingRef, typingData);
      } else {
        await set(typingRef, null);
      }
    } catch (error) {
      logger.error('Error setting board typing indicator', {
        error: { error: error instanceof Error ? error.message : String(error) },
        spaceId,
        boardId,
        userId
      });
    }
  }

  /**
   * Clean up stale typing indicators for a board
   * Removes typing indicators older than TTL (default 10 seconds)
   * Called periodically by the listener to prevent RTDB bloat from crashed clients
   */
  async cleanupStaleTypingIndicators(
    spaceId: string,
    boardId: string,
    ttlMs: number = 10000
  ): Promise<number> {
    try {
      const typingRef = ref(this.database, `typing/${spaceId}/${boardId}`);
      const snapshot = await get(typingRef);

      if (!snapshot.exists()) {
        return 0;
      }

      const now = Date.now();
      let cleanedCount = 0;
      const updates: Record<string, null> = {};

      snapshot.forEach((childSnapshot: DataSnapshot) => {
        const typingData = childSnapshot.val() as TypingIndicator;
        const timestamp = typeof typingData.timestamp === 'number' ? typingData.timestamp : 0;

        // If older than TTL, mark for deletion
        if (now - timestamp > ttlMs) {
          if (childSnapshot.key) {
            updates[childSnapshot.key] = null;
            cleanedCount++;
          }
        }
      });

      // Batch delete stale indicators
      if (cleanedCount > 0) {
        await update(typingRef, updates);
        logger.debug('Cleaned up stale typing indicators', {
          spaceId,
          boardId,
          cleanedCount
        });
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up typing indicators', {
        error: { error: error instanceof Error ? error.message : String(error) },
        spaceId,
        boardId
      });
      return 0;
    }
  }

  /**
   * Listen to presence updates for a space
   * SCALING FIX: Now uses space-indexed path `space_presence/{spaceId}` instead of loading all users
   * This reduces data transfer from O(all users) to O(space members)
   */
  listenToPresence(spaceId: string, callback: (presence: Record<string, PresenceData>) => void): () => void {
    // SCALING: Use space-indexed path instead of loading all presence data
    const spacePresenceRef = ref(this.database, `space_presence/${spaceId}`);

    const unsubscribe = onValue(spacePresenceRef, (snapshot: DataSnapshot) => {
      const spacePresence: Record<string, PresenceData> = {};
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        const presenceData = childSnapshot.val() as PresenceData;
        if (childSnapshot.key) {
          spacePresence[childSnapshot.key] = presenceData;
        }
      });

      callback(spacePresence);
    });

    const listenerKey = `presence:${spaceId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey)!.push(unsubscribe);

    return () => {
      unsubscribe();
      const presenceListeners = this.listeners.get(listenerKey);
      if (presenceListeners) {
        const index = presenceListeners.indexOf(unsubscribe);
        if (index > -1) {
          presenceListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen to typing indicators for a space
   */
  listenToTyping(spaceId: string, callback: (typing: Record<string, TypingIndicator>) => void): () => void {
    const typingRef = ref(this.database, `typing/${spaceId}`);

    const unsubscribe = onValue(typingRef, (snapshot: DataSnapshot) => {
      const typing: Record<string, TypingIndicator> = {};
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        if (childSnapshot.key) {
          typing[childSnapshot.key] = childSnapshot.val() as TypingIndicator;
        }
      });

      callback(typing);
    });

    const listenerKey = `typing:${spaceId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey)!.push(unsubscribe);

    return () => {
      unsubscribe();
      const typingListeners = this.listeners.get(listenerKey);
      if (typingListeners) {
        const index = typingListeners.indexOf(unsubscribe);
        if (index > -1) {
          typingListeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get message history for a channel
   */
  async getMessageHistory(channel: string, limit: number = 50): Promise<RealtimeMessage[]> {
    try {
      const messagesRef = ref(this.database, `channels/${channel}/messages`);
      // In a production app, you'd use Firebase's query methods to limit and paginate
      // For now, we'll get all messages and limit client-side

      return new Promise((resolve, reject) => {
        onValue(messagesRef, (snapshot: DataSnapshot) => {
          const messages: RealtimeMessage[] = [];
          snapshot.forEach((childSnapshot: DataSnapshot) => {
            messages.push(childSnapshot.val() as RealtimeMessage);
          });

          // Sort by timestamp and limit (handle number | object)
          messages.sort((a, b) => {
            const aTime = typeof a.metadata.timestamp === 'number' ? a.metadata.timestamp : 0;
            const bTime = typeof b.metadata.timestamp === 'number' ? b.metadata.timestamp : 0;
            return bTime - aTime;
          });
          resolve(messages.slice(0, limit));
        }, reject, { onlyOnce: true });
      });
    } catch (error) {
      logger.error('Error getting message history', { error: { error: error instanceof Error ? error.message : String(error) }, channel });
      throw error;
    }
  }

  /**
   * Mark messages as read
   * Uses Firebase transactions to prevent lost updates from concurrent reads
   */
  async markMessagesAsRead(channel: string, userId: string, messageIds: string[]): Promise<void> {
    try {
      // Use Promise.all to mark all messages concurrently with atomic transactions
      await Promise.all(
        messageIds.map(async (messageId) => {
          const readRef = ref(this.database, `channels/${channel}/messages/${messageId}/delivery/read`);
          // Use transaction for atomic read-modify-write
          await runTransaction(readRef, (currentRead) => {
            const readArray = currentRead || [];
            if (!readArray.includes(userId)) {
              return [...readArray, userId];
            }
            // Return undefined to abort transaction (no change needed)
            return undefined;
          });
        })
      );
    } catch (error) {
      logger.error('Error marking messages as read', { error: { error: error instanceof Error ? error.message : String(error) }, channel, userId });
      throw error;
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribeFns, channel) => {
      unsubscribeFns.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          logger.error('Error cleaning up listener', {
            channel,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    });
    this.listeners.clear();
    logger.info('All Firebase realtime listeners cleaned up');
  }
}

// Export singleton instance
export const realtimeService = new FirebaseRealtimeService();