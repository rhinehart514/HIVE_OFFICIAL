// @ts-nocheck
// TODO: Fix unknown→typed array conversions and method access on integration types
/**
 * HIVE Platform Integration Layer
 *
 * Manages cross-slice data flow and integration patterns
 * Connects Feed, Spaces, Tools, Profile, and real-time features
 */


// ===== CORE INTEGRATION TYPES =====

export interface PlatformIntegrationConfig {
  enableRealtime: boolean;
  enableCrossSliceNotifications: boolean;
  enableUnifiedSearch: boolean;
  enableActivityStreaming: boolean;
  cacheStrategy: 'memory' | 'localStorage' | 'hybrid';
}

export interface CrossSliceData {
  feedItems: FeedItem[];
  spaceActivities: SpaceActivity[];
  toolInteractions: ToolInteraction[];
  profileUpdates: ProfileUpdate[];
  notifications: PlatformNotification[];
}

export interface FeedItem {
  id: string;
  type: 'post' | 'tool_created' | 'space_joined' | 'event_created' | 'achievement';
  sourceSlice: 'feed' | 'spaces' | 'tools' | 'profile';
  sourceId: string;
  userId: string;
  spaceId?: string;
  toolId?: string;
  content: Record<string, unknown>;
  metadata: {
    visibility: 'public' | 'space' | 'private';
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    timestamp: string;
  };
}

export interface SpaceActivity {
  id: string;
  spaceId: string;
  userId: string;
  type: 'post_created' | 'member_joined' | 'tool_shared' | 'event_created';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ToolInteraction {
  id: string;
  toolId: string;
  userId: string;
  spaceId?: string;
  type: 'created' | 'deployed' | 'shared' | 'used';
  metadata: {
    deploymentId?: string;
    interactionCount: number;
    lastUsed: string;
  };
}

export interface ProfileUpdate {
  id: string;
  userId: string;
  type: 'space_joined' | 'tool_created' | 'achievement_earned' | 'bio_updated';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface PlatformNotification {
  id: string;
  userId: string;
  type: 'space_invite' | 'tool_shared' | 'event_reminder' | 'achievement' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  metadata: {
    sourceSlice: string;
    sourceId: string;
    priority: 'low' | 'medium' | 'high';
    read: boolean;
    timestamp: string;
  };
}

// ===== PLATFORM INTEGRATION CLASS =====

export class PlatformIntegration {
  private config: PlatformIntegrationConfig;
  private cache: Map<string, unknown> = new Map();
  private subscriptions: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: PlatformIntegrationConfig) {
    this.config = config;
    
    if (config.enableRealtime) {
      this.initializeWebSocket();
    }
  }

  // ===== CROSS-SLICE DATA FLOW =====

  /**
   * Get unified feed data combining all slices
   */
  async getUnifiedFeedData(userId: string, options: {
    limit?: number;
    sources?: string[];
    timeRange?: string;
  } = {}): Promise<FeedItem[]> {
    const { limit = 20, sources = ['feed', 'spaces', 'tools', 'profile'], timeRange = '24h' } = options;
    
    const cacheKey = `unified_feed_${userId}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const feedData: FeedItem[] = [];

      // Get data from each slice
      if (sources.includes('feed')) {
        const feedItems = await this.getFeedSliceData(userId, { limit: Math.ceil(limit * 0.4), timeRange });
        feedData.push(...feedItems);
      }

      if (sources.includes('spaces')) {
        const spaceItems = await this.getSpaceSliceData(userId, { limit: Math.ceil(limit * 0.3), timeRange });
        feedData.push(...spaceItems);
      }

      if (sources.includes('tools')) {
        const toolItems = await this.getToolSliceData(userId, { limit: Math.ceil(limit * 0.2), timeRange });
        feedData.push(...toolItems);
      }

      if (sources.includes('profile')) {
        const profileItems = await this.getProfileSliceData(userId, { limit: Math.ceil(limit * 0.1), timeRange });
        feedData.push(...profileItems);
      }

      // Sort by relevance and timestamp
      const sortedFeed = this.rankFeedItems(feedData, userId);
      const finalFeed = sortedFeed.slice(0, limit);

      // Cache the result
      this.cacheData(cacheKey, finalFeed, 5 * 60 * 1000); // 5 minutes

      return finalFeed;
    } catch {
      return [];
    }
  }

  /**
   * Get feed slice specific data
   */
  private async getFeedSliceData(userId: string, options: { limit: number; timeRange: string }): Promise<FeedItem[]> {
    try {
      const { secureApiFetch } = await import('./secure-auth-utils');
      const response = await secureApiFetch('/api/feed/algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: options.limit,
          timeRange: options.timeRange,
          feedType: 'personal'
        })
      });

      if (!response.ok) throw new Error('Failed to fetch feed data');

      const data = await response.json() as { items: Array<Record<string, unknown>> };
      return data.items.map((item) => ({
        id: String(item.id),
        type: 'post' as const,
        sourceSlice: 'feed' as const,
        sourceId: String(item.id),
        userId: String(item.authorId),
        spaceId: item.spaceId ? String(item.spaceId) : undefined,
        content: (item.content as Record<string, unknown>) || {},
        metadata: {
          visibility: 'public' as const,
          priority: (typeof item.relevanceScore === 'number' && item.relevanceScore > 80) ? 'high' as const : (typeof item.relevanceScore === 'number' && item.relevanceScore > 50) ? 'medium' as const : 'low' as const,
          tags: (item.content as Record<string, unknown>)?.tags as string[] || [],
          timestamp: String(item.timestamp)
        }
      }));
    } catch {
      // Error fetching feed slice, return empty array
      return [];
    }
  }

  /**
   * Get space slice specific data
   */
  private async getSpaceSliceData(userId: string, options: { limit: number; timeRange: string }): Promise<FeedItem[]> {
    try {
      // Get user's spaces first
      const { secureApiFetch } = await import('./secure-auth-utils');
      const spacesResponse = await secureApiFetch(`/api/profile/spaces/actions`);

      if (!spacesResponse.ok) throw new Error('Failed to fetch user spaces');

      const spacesData = await spacesResponse.json();
      const userSpaces = spacesData.spaces || [];

      const feedItems: FeedItem[] = [];

      // Get recent activities from each space
      for (const space of userSpaces.slice(0, 5)) { // Limit to top 5 spaces
        try {
          const postsResponse = await secureApiFetch(`/api/spaces/${space.id}/posts?limit=5`);

          if (postsResponse.ok) {
            const postsData = await postsResponse.json() as { posts?: Array<Record<string, unknown>> };
            for (const post of postsData.posts || []) {
              feedItems.push({
                id: `space_${String(post.id)}`,
                type: 'post' as const,
                sourceSlice: 'spaces' as const,
                sourceId: String(post.id),
                userId: String(post.authorId),
                spaceId: String(space.id),
                content: post,
                metadata: {
                  visibility: 'space' as const,
                  priority: post.isPinned ? 'high' as const : 'medium' as const,
                  tags: (post.tags as string[]) || [],
                  timestamp: String(post.createdAt)
                }
              });
            }
          }
        } catch {
          // Silently ignore individual space post fetch errors
        }
      }

      return feedItems.slice(0, options.limit);
    } catch {
      // Error fetching unified feed data, return empty array
      return [];
    }
  }

  /**
   * Get tool slice specific data
   */
  private async getToolSliceData(userId: string, options: { limit: number; timeRange: string }): Promise<FeedItem[]> {
    try {
      const { secureApiFetch } = await import('./secure-auth-utils');
      const response = await secureApiFetch(`/api/tools/personal`);

      if (!response.ok) throw new Error('Failed to fetch tool data');

      const data = await response.json() as { tools?: Array<Record<string, unknown>> };
      const tools = data.tools || [];

      return tools.slice(0, options.limit).map((tool) => ({
        id: `tool_${String(tool.id)}`,
        type: 'tool_created' as const,
        sourceSlice: 'tools' as const,
        sourceId: String(tool.id),
        userId: String(tool.creatorId),
        toolId: String(tool.id),
        content: tool,
        metadata: {
          visibility: tool.isPublic ? 'public' as const : 'private' as const,
          priority: (typeof tool.deploymentCount === 'number' && tool.deploymentCount > 10) ? 'high' as const : 'medium' as const,
          tags: (tool.tags as string[]) || [],
          timestamp: String(tool.createdAt)
        }
      }));
    } catch {
      // Error fetching tool slice, return empty array
      return [];
    }
  }

  /**
   * Get profile slice specific data
   */
  private async getProfileSliceData(userId: string, options: { limit: number; timeRange: string }): Promise<FeedItem[]> {
    try {
      const { secureApiFetch } = await import('./secure-auth-utils');
      const response = await secureApiFetch(`/api/profile/dashboard`);

      if (!response.ok) throw new Error('Failed to fetch profile data');

      const data = await response.json() as { recentActivities?: Array<Record<string, unknown>> };
      const activities = data.recentActivities || [];

      return activities.slice(0, options.limit).map((activity) => ({
        id: `profile_${String(activity.id)}`,
        type: (activity.type as FeedItem['type']) || 'achievement' as const,
        sourceSlice: 'profile' as const,
        sourceId: String(activity.id),
        userId: userId,
        content: activity,
        metadata: {
          visibility: 'private' as const,
          priority: 'low' as const,
          tags: [],
          timestamp: String(activity.timestamp)
        }
      }));
    } catch {
      // Error fetching profile slice, return empty array
      return [];
    }
  }

  // ===== REAL-TIME INTEGRATION =====

  /**
   * Initialize WebSocket connection for real-time features
   */
  private initializeWebSocket(): void {
    if (typeof window === 'undefined') return; // Server-side check

    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://api.hive.com/ws' 
        : 'ws://localhost:3001/ws';
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.reconnectAttempts = 0;
        
        // Subscribe to user-specific updates
        this.sendWebSocketMessage({
          type: 'subscribe',
          channels: ['platform_updates', 'notifications', 'realtime_feed']
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch {
          // Silently ignore WebSocket message parsing errors
        }
      };

      this.websocket.onclose = () => {
        this.handleWebSocketReconnect();
      };

      this.websocket.onerror = (_error) => {
        // WebSocket error - will attempt reconnection
      };
    } catch {
      // Silently ignore WebSocket initialization errors
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: Record<string, unknown>): void {
    switch (message.type) {
      case 'platform_update':
        this.handlePlatformUpdate(message.data);
        break;
      case 'notification':
        this.handleRealTimeNotification(message.data);
        break;
      case 'feed_update':
        this.handleFeedUpdate(message.data);
        break;
      case 'space_activity':
        this.handleSpaceActivity(message.data);
        break;
      case 'tool_interaction':
        this.handleToolInteraction(message.data);
        break;
      default:
        // Unknown message type, ignore
    }
  }

  /**
   * Handle platform-wide updates
   */
  private handlePlatformUpdate(data: unknown): void {
    // Invalidate relevant caches
    const userId = (data as Record<string, unknown>)?.userId;
    if (userId) {
      this.invalidateCache(`unified_feed_${String(userId)}`);
    }

    // Notify subscribers
    this.notifySubscribers('platform_update', data);
  }

  /**
   * Handle real-time notifications
   */
  private handleRealTimeNotification(notification: PlatformNotification): void {
    // Add to notification cache
    const cacheKey = `notifications_${notification.userId}`;
    const existingNotifications = this.cache.get(cacheKey) || [];
    this.cache.set(cacheKey, [notification, ...existingNotifications.slice(0, 49)]);
    
    // Notify subscribers
    this.notifySubscribers('notification', notification);
  }

  /**
   * Handle feed updates
   */
  private handleFeedUpdate(data: unknown): void {
    // Invalidate feed cache
    const userId = (data as Record<string, unknown>)?.userId;
    if (userId) {
      this.invalidateCache(`unified_feed_${String(userId)}`);
    }

    // Notify subscribers
    this.notifySubscribers('feed_update', data);
  }

  /**
   * Handle space activity updates
   */
  private handleSpaceActivity(activity: SpaceActivity): void {
    // Update space activity cache
    const cacheKey = `space_activities_${activity.spaceId}`;
    const existingActivities = this.cache.get(cacheKey) || [];
    this.cache.set(cacheKey, [activity, ...existingActivities.slice(0, 19)]);
    
    // Notify subscribers
    this.notifySubscribers('space_activity', activity);
  }

  /**
   * Handle tool interaction updates
   */
  private handleToolInteraction(interaction: ToolInteraction): void {
    // Update tool interaction cache
    const cacheKey = `tool_interactions_${interaction.toolId}`;
    const existingInteractions = this.cache.get(cacheKey) || [];
    this.cache.set(cacheKey, [interaction, ...existingInteractions.slice(0, 19)]);
    
    // Notify subscribers
    this.notifySubscribers('tool_interaction', interaction);
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  /**
   * Subscribe to platform events
   */
  subscribe(eventType: string, callback: (...args: unknown[]) => void): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }
    
    this.subscriptions.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(eventType)?.delete(callback);
    };
  }

  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(eventType: string, data: unknown): void {
    const subscribers = this.subscriptions.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch {
          // Silently ignore subscriber callback errors
        }
      });
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Rank feed items by relevance
   */
  private rankFeedItems(items: FeedItem[], _userId: string): FeedItem[] {
    return items.sort((a, b) => {
      // Priority weighting
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.metadata.priority];
      const bPriority = priorityWeight[b.metadata.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Timestamp weighting (more recent = higher)
      const aTime = new Date(a.metadata.timestamp).getTime();
      const bTime = new Date(b.metadata.timestamp).getTime();
      
      return bTime - aTime;
    });
  }

  /**
   * Cache data with TTL
   */
  private cacheData(key: string, data: unknown, ttl: number): void {
    if (this.config.cacheStrategy === 'memory' || this.config.cacheStrategy === 'hybrid') {
      this.cache.set(key, data);

      // Set TTL
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl);
    }

    if (this.config.cacheStrategy === 'localStorage' || this.config.cacheStrategy === 'hybrid') {
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          expires: Date.now() + ttl
        }));
      } catch {
        // Silently ignore localStorage errors
      }
    }
  }

  /**
   * Invalidate cache entries
   */
  private invalidateCache(pattern: string): void {
    // Memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    
    // localStorage cache
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Silently ignore cache invalidation errors
      }
    }
  }

  /**
   * Get authentication token
   * SECURITY: Uses real Firebase tokens only - no dev token fallbacks
   */
  private async getAuthToken(): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
      // Try to get real Firebase token
      const { auth } = await import('./firebase');
      if (auth?.currentUser) {
        return await auth.currentUser.getIdToken();
      }
    } catch {
      // Silently ignore auth token fetch errors
    }

    return '';
  }

  /**
   * Send WebSocket message
   */
  private sendWebSocketMessage(message: Record<string, unknown>): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private handleWebSocketReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      

      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    } else {
      // Max reconnection attempts reached, giving up
    }
  }

  /**
   * Cleanup and close connections
   */
  destroy(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.cache.clear();
    this.subscriptions.clear();
  }
}

// ===== SINGLETON INSTANCE =====

let platformIntegrationInstance: PlatformIntegration | null = null;

export function getPlatformIntegration(config?: PlatformIntegrationConfig): PlatformIntegration {
  if (!platformIntegrationInstance) {
    const defaultConfig: PlatformIntegrationConfig = {
      enableRealtime: true,
      enableCrossSliceNotifications: true,
      enableUnifiedSearch: true,
      enableActivityStreaming: true,
      cacheStrategy: 'hybrid'
    };
    
    platformIntegrationInstance = new PlatformIntegration(config || defaultConfig);
  }
  
  return platformIntegrationInstance;
}

// ===== HOOK FOR REACT COMPONENTS =====

export function usePlatformIntegration() {
  const integration = getPlatformIntegration();

  return {
    getUnifiedFeed: (userId: string, options?: { limit?: number; sources?: string[]; timeRange?: string }) => integration.getUnifiedFeedData(userId, options),
    subscribe: (eventType: string, callback: (...args: unknown[]) => void) => integration.subscribe(eventType, callback),
    invalidateCache: (pattern: string) => {
      // Access private method via type assertion
      type IntegrationWithPrivates = PlatformIntegration & { invalidateCache(pattern: string): void };
      (integration as IntegrationWithPrivates).invalidateCache(pattern);
    }
  };
}
