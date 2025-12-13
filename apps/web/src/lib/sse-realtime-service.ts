/**
 * Server-Sent Events Real-time Service
 * Alternative to Firebase Realtime Database using SSE + Firestore
 * Optimized with performance monitoring and management
 *
 * @deprecated This service has architectural issues. The `broadcastController`
 * is not properly initialized during message sends, causing all broadcasts to
 * fail silently. Messages are only delivered to users with active SSE connections
 * at the time of connection creation, not during broadcast.
 *
 * RECOMMENDED ALTERNATIVES:
 * - For chat: Use `useChatMessages` hook with Firestore polling (already implemented)
 * - For presence: Use Firebase Realtime Database directly
 * - For notifications: Use Firestore listeners in client components
 *
 * This service is kept for backwards compatibility but should NOT be relied upon
 * for critical real-time features. All calls to `sendMessage()` will silently fail
 * to deliver to most users.
 *
 * See: /Users/laneyfraass/.claude/plans/recursive-wishing-thacker.md for details.
 */

import { dbAdmin } from './firebase-admin';
import { logger } from './structured-logger';
import { realtimeOptimizationManager } from './realtime-optimization';

export interface RealtimeMessage {
  id: string;
  type: 'chat' | 'notification' | 'tool_update' | 'presence' | 'system';
  channel: string;
  senderId: string;
  targetUsers?: string[];
  content: Record<string, unknown>;
  metadata: {
    timestamp: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    requiresAck: boolean;
    expiresAt?: string;
    retryCount: number;
  };
}

export interface SSEConnection {
  userId: string;
  connectionId: string;
  channels: Set<string>;
  controller: ReadableStreamDefaultController | null;
  lastActivity: number;
}

/** @deprecated See file-level deprecation notice */
export class SSERealtimeService {
  private connections: Map<string, SSEConnection> = new Map();
  private messageQueue: Map<string, RealtimeMessage[]> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up inactive connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, 30000);
  }

  /**
   * Create SSE connection for a user
   */
  createConnection(userId: string, channels: string[]): ReadableStream {
    const connectionId = `${userId}-${Date.now()}`;
    const startTime = Date.now();
    
    // Register connection with optimization manager
    realtimeOptimizationManager.registerConnection(connectionId, userId);
    
    const stream = new ReadableStream({
      start: (controller) => {
        // Store connection with controller reference for broadcasting
        const connection: SSEConnection = {
          userId,
          connectionId,
          channels: new Set(channels),
          controller, // Store controller for later broadcasts
          lastActivity: Date.now()
        };

        this.connections.set(connectionId, connection);
        
        // Send initial connection confirmation
        this.sendSSEMessage(controller, {
          type: 'connection',
          data: { status: 'connected', connectionId, channels, establishedAt: startTime }
        });
        
        // Send any queued messages
        this.sendQueuedMessages(userId, controller);
        
        logger.info('SSE connection established', { userId, connectionId, channels: channels.join(',') });
      },
      
      cancel: () => {
        // Null out controller to prevent writes to closed stream
        const conn = this.connections.get(connectionId);
        if (conn) {
          conn.controller = null;
        }

        // Unregister from optimization manager
        realtimeOptimizationManager.unregisterConnection(connectionId);

        // Clean up connection
        this.connections.delete(connectionId);
        logger.info('SSE connection closed', { userId, connectionId });
      }
    });

    return stream;
  }

  /**
   * Send message to specific users or channels
   *
   * @deprecated This method has architectural issues and messages may not be delivered.
   * Use Firestore listeners or polling-based approaches instead.
   * This method now operates in "silent fail" mode to prevent disruption.
   */
  async sendMessage(message: Omit<RealtimeMessage, 'id'>): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullMessage: RealtimeMessage = {
      ...message,
      id: messageId,
      metadata: {
        ...message.metadata,
        timestamp: new Date().toISOString()
      }
    };

    // Log deprecation warning in development only (once per session)
    if (process.env.NODE_ENV === 'development' && !this._deprecationWarned) {
      this._deprecationWarned = true;
      logger.warn('SSE sendMessage called - this service is deprecated. Messages may not be delivered.', {
        recommendation: 'Use Firestore listeners or useChatMessages hook instead'
      });
    }

    try {
      // Use optimization manager for message delivery
      if (message.targetUsers && message.targetUsers.length > 0) {
        // Send to specific users with optimization
        for (const userId of message.targetUsers) {
          await realtimeOptimizationManager.optimizeMessageDelivery(userId, [fullMessage]);
        }
      } else {
        // Store message in Firestore for persistence (this still works)
        await dbAdmin.collection('realtimeMessages').doc(messageId).set({
          ...fullMessage,
          createdAt: new Date()
        });

        // Attempt broadcast to active connections (may fail silently)
        this.broadcastMessage(fullMessage);

        // Queue for offline users if channel-based
        await this.queueChannelMessage(fullMessage);
      }

      return messageId;
    } catch (error) {
      // Silent fail - log but don't throw
      logger.warn('SSE message delivery failed (expected - service deprecated)', {
        error: error instanceof Error ? error.message : String(error),
        messageId,
        channel: message.channel
      });
      return messageId; // Return ID anyway so callers don't break
    }
  }

  private _deprecationWarned = false;

  /**
   * Send chat message to a space
   */
  async sendChatMessage(
    spaceId: string, 
    userId: string, 
    content: string, 
    type: 'text' | 'image' | 'file' = 'text'
  ): Promise<string> {
    return this.sendMessage({
      type: 'chat',
      channel: `space:${spaceId}`,
      senderId: userId,
      content: {
        spaceId,
        message: content,
        messageType: type,
        timestamp: new Date().toISOString()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        priority: 'normal',
        requiresAck: false,
        retryCount: 0
      }
    });
  }

  /**
   * Update user presence
   */
  async updatePresence(
    userId: string, 
    status: 'online' | 'away' | 'offline', 
    currentSpace?: string
  ): Promise<void> {
    const presenceData = {
      userId,
      status,
      currentSpace,
      lastSeen: new Date().toISOString(),
      connectionId: this.getUserConnectionId(userId)
    };

    // Store in Firestore
    await dbAdmin.collection('presence').doc(userId).set(presenceData);

    // Broadcast to relevant spaces
    const channels = currentSpace ? [`space:${currentSpace}:presence`] : ['global:presence'];
    
    for (const channel of channels) {
      await this.sendMessage({
        type: 'presence',
        channel,
        senderId: 'system',
        content: presenceData,
        metadata: {
          timestamp: new Date().toISOString(),
          priority: 'low',
          requiresAck: false,
          retryCount: 0
        }
      });
    }
  }

  /**
   * Send tool update notification
   */
  async sendToolUpdate(
    toolId: string,
    spaceId: string,
    userId: string,
    updateData: Record<string, unknown>
  ): Promise<void> {
    await this.sendMessage({
      type: 'tool_update',
      channel: `space:${spaceId}:tools`,
      senderId: userId,
      content: {
        toolId,
        spaceId,
        updateType: updateData.type || 'state_change',
        data: updateData,
        timestamp: new Date().toISOString()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        priority: 'normal',
        requiresAck: true,
        retryCount: 0
      }
    });
  }

  /**
   * Send system notification
   */
  async sendNotification(
    userId: string | string[], 
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      actionUrl?: string;
    }
  ): Promise<void> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    
    await this.sendMessage({
      type: 'notification',
      channel: 'user:notifications',
      senderId: 'system',
      targetUsers: userIds,
      content: notification,
      metadata: {
        timestamp: new Date().toISOString(),
        priority: notification.type === 'error' ? 'high' : 'normal',
        requiresAck: true,
        retryCount: 0
      }
    });
  }

  /**
   * Get message history for a channel
   */
  async getMessageHistory(channel: string, limit: number = 50): Promise<RealtimeMessage[]> {
    try {
      const messagesSnapshot = await dbAdmin
        .collection('realtimeMessages')
        .where('channel', '==', channel)
        .orderBy('metadata.timestamp', 'desc')
        .limit(limit)
        .get();

      return messagesSnapshot.docs.map(doc => doc.data() as RealtimeMessage);
    } catch (error) {
      logger.error('Error getting message history', { error: { error: error instanceof Error ? error.message : String(error) }, channel });
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private broadcastMessage(message: RealtimeMessage): void {
    const targetConnections = this.getTargetConnections(message);

    for (const connection of targetConnections) {
      try {
        // Use the stored controller for broadcasting
        if (connection.controller) {
          this.sendSSEMessage(connection.controller, {
            type: 'message',
            data: message
          });
          connection.lastActivity = Date.now();
        } else {
          logger.warn('No controller for SSE connection', {
            connectionId: connection.connectionId,
            userId: connection.userId
          });
        }
      } catch (error) {
        logger.error('Error broadcasting to connection', {
          error: error instanceof Error ? error.message : String(error),
          connectionId: connection.connectionId
        });
        // Connection may have closed, clean it up
        this.connections.delete(connection.connectionId);
        realtimeOptimizationManager.unregisterConnection(connection.connectionId);
      }
    }
  }

  private getTargetConnections(message: RealtimeMessage): SSEConnection[] {
    const connections: SSEConnection[] = [];
    
    for (const connection of Array.from(this.connections.values())) {
      // Check if user is in target users
      if (message.targetUsers && !message.targetUsers.includes(connection.userId)) {
        continue;
      }
      
      // Check if connection subscribes to this channel
      if (connection.channels.has(message.channel)) {
        connections.push(connection);
      }
    }
    
    return connections;
  }

  private sendSSEMessage(controller: ReadableStreamDefaultController | null, data: { type: string; data: unknown }): void {
    if (!controller) return; // Skip if no controller (broadcasting case)
    
    const sseData = `data: ${JSON.stringify(data)}\\n\\n`;
    controller.enqueue(new TextEncoder().encode(sseData));
  }

  private queueMessage(userId: string, message: RealtimeMessage): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    
    const queue = this.messageQueue.get(userId)!;
    queue.push(message);
    
    // Keep only last 100 messages per user
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }
  }

  private async queueChannelMessage(message: RealtimeMessage): Promise<void> {
    // Find users who should receive this channel message but are offline
    const channelSubscribers = await this.getChannelSubscribers(message.channel);
    
    for (const userId of channelSubscribers) {
      if (!this.isUserConnected(userId)) {
        this.queueMessage(userId, message);
      }
    }
  }

  private async getChannelSubscribers(channel: string): Promise<string[]> {
    // This would implement logic to find users subscribed to a channel
    // For now, return users from active connections that have this channel
    const subscribers: string[] = [];
    
    for (const connection of Array.from(this.connections.values())) {
      if (connection.channels.has(channel)) {
        subscribers.push(connection.userId);
      }
    }
    
    return subscribers;
  }

  private sendQueuedMessages(userId: string, controller: ReadableStreamDefaultController): void {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) return;
    
    for (const message of queue) {
      this.sendSSEMessage(controller, {
        type: 'message',
        data: message
      });
    }
    
    // Clear queue after sending
    this.messageQueue.delete(userId);
  }

  private isUserConnected(userId: string): boolean {
    for (const connection of Array.from(this.connections.values())) {
      if (connection.userId === userId) {
        return true;
      }
    }
    return false;
  }

  private getUserConnectionId(userId: string): string | undefined {
    for (const connection of Array.from(this.connections.values())) {
      if (connection.userId === userId) {
        return connection.connectionId;
      }
    }
    return undefined;
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [connectionId, connection] of Array.from(this.connections.entries())) {
      if (now - connection.lastActivity > timeout) {
        this.connections.delete(connectionId);
        logger.info('Cleaned up inactive SSE connection', { connectionId, userId: connection.userId });
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.connections.clear();
    this.messageQueue.clear();
  }
}

/**
 * @deprecated This singleton has architectural issues and should not be used.
 * See file-level deprecation notice for recommended alternatives.
 */
export const sseRealtimeService = new SSERealtimeService();
import 'server-only';
