// @ts-nocheck
// Advanced Redis-based caching layer for HIVE platform
// Supports Upstash Redis (REST API) with fallback to in-memory mock
// Optimized for multi-tenant architecture and cross-campus scaling

import { logger } from '@/lib/logger';

// ============================================================================
// UPSTASH REDIS ADAPTER
// Wraps Upstash Redis client to provide ioredis-compatible interface
// ============================================================================

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_ENABLED = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Upstash client type (from @upstash/redis)
interface UpstashRedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number; px?: number }) => Promise<string | null>;
  del: (...keys: string[]) => Promise<number>;
  exists: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  mget: <T = string>(...keys: string[]) => Promise<(T | null)[]>;
  incrby: (key: string, increment: number) => Promise<number>;
  ping: () => Promise<string>;
  flushall: () => Promise<string>;
  scan: (cursor: number, options?: { match?: string; count?: number }) => Promise<[string, string[]]>;
}

/**
 * Adapter class that wraps Upstash Redis to provide ioredis-compatible interface
 * This allows the existing HiveRedisCache to work with both MockRedis and Upstash
 */
class UpstashAdapter {
  private client: UpstashRedisClient;
  private eventHandlers: Map<string, Array<() => void>> = new Map();

  constructor(client: UpstashRedisClient) {
    this.client = client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<string> {
    // Handle Redis set with expiry: SET key value PX milliseconds
    if (args.length >= 2 && args[0] === 'PX' && typeof args[1] === 'number') {
      const expiryMs = args[1];
      await this.client.set(key, value, { px: expiryMs });
    } else {
      await this.client.set(key, value);
    }
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    await this.client.set(key, value, { ex: seconds });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    // Upstash keys() works similarly to ioredis
    return this.client.keys(pattern);
  }

  async mget(...keys: string[]): Promise<Array<string | null>> {
    if (keys.length === 0) return [];
    return this.client.mget<string>(...keys);
  }

  async incrby(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async info(_section?: string): Promise<string> {
    // Upstash doesn't support INFO command via REST API
    // Return a mock response for compatibility
    return `# Server
redis_version:7.0.0-upstash
used_memory:0
used_memory_human:0K
connected_clients:1
uptime_in_seconds:0`;
  }

  async flushall(): Promise<string> {
    await this.client.flushall();
    return 'OK';
  }

  async quit(): Promise<string> {
    // Upstash REST API doesn't need explicit disconnection
    return 'OK';
  }

  pipeline() {
    // Simple pipeline implementation for Upstash
    // Collects operations and executes them (not truly pipelined, but compatible)
    const operations: Array<() => Promise<string>> = [];

    return {
      setex: (key: string, ttl: number, value: string) => {
        operations.push(async () => {
          await this.setex(key, ttl, value);
          return 'OK';
        });
        return this;
      },
      exec: async () => {
        const results = await Promise.all(operations.map(op => op()));
        return results.map(r => [r]);
      }
    };
  }

  on(event: string, handler: () => void) {
    // Store event handlers
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);

    // Trigger 'ready' event immediately since Upstash is always ready
    if (event === 'ready') {
      setTimeout(handler, 100);
    }
  }
}

// Function to create Upstash client
let upstashClientPromise: Promise<UpstashAdapter | null> | null = null;

async function getUpstashClient(): Promise<UpstashAdapter | null> {
  if (!UPSTASH_ENABLED) return null;
  if (upstashClientPromise) return upstashClientPromise;

  upstashClientPromise = (async () => {
    try {
      // Dynamic import to avoid build errors if package not installed
      const { Redis } = await import('@upstash/redis');
      const client = new Redis({
        url: UPSTASH_URL!,
        token: UPSTASH_TOKEN!,
      }) as unknown as UpstashRedisClient;

      logger.info('Upstash Redis client initialized for caching');
      return new UpstashAdapter(client);
    } catch (error) {
      logger.error('Failed to initialize Upstash Redis client', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return null;
    }
  })();

  return upstashClientPromise;
}

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  keyPrefix: string;
  enabled: boolean;
}

// Mock Redis implementation for development when Redis is disabled
class MockRedis {
  private data: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<string> {
    const entry: { value: string; expiry?: number } = { value };

    // Handle Redis set with expiry: SET key value PX milliseconds
    if (args.length >= 2 && args[0] === 'PX' && typeof args[1] === 'number') {
      const expiryMs = args[1];
      entry.expiry = Date.now() + expiryMs;
    }

    this.data.set(key, entry);
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.data.set(key, {
      value,
      expiry: Date.now() + (seconds * 1000)
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.data.delete(key)) deleted++;
    });
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const entry = this.data.get(key);
    if (!entry) return 0;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.data.delete(key);
      return 0;
    }

    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.data.keys()).filter(key => regex.test(key));
  }

  async mget(...keys: string[]): Promise<Array<string | null>> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0') + increment).toString();
    await this.set(key, newValue);
    return parseInt(newValue);
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async info(section?: string): Promise<string> {
    return `# ${section || 'Server'}
redis_version:7.0.0-mock
used_memory:1024
used_memory_human:1.00K
used_memory_rss:2048
used_memory_peak:2048
maxmemory:0
mem_fragmentation_ratio:1.0
connected_clients:1
uptime_in_seconds:3600`;
  }

  async flushall(): Promise<string> {
    this.data.clear();
    return 'OK';
  }

  async quit(): Promise<string> {
    this.data.clear();
    return 'OK';
  }

  pipeline() {
    return {
      setex: (key: string, ttl: number, value: string) => this.setex(key, ttl, value),
      exec: async () => [['OK']]
    };
  }

  on(event: string, handler: () => void) {
    // Mock event handlers
    if (event === 'ready') {
      setTimeout(handler, 100);
    }
  }
}

// ============================================================================
// REDIS CLIENT FACTORY
// Priority: Upstash (when configured) > MockRedis (fallback)
// ============================================================================

type RedisClientType = MockRedis | UpstashAdapter;

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  campusId: string;
  metadata?: Record<string, unknown>;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  avgResponseTime: number;
  memoryUsage: number;
  activeConnections: number;
}

class HiveRedisCache {
  private client: RedisClientType;
  private readonly config: CacheConfig;
  private stats: CacheStats;
  private healthCheckInterval?: NodeJS.Timeout;
  private _isUsingMockRedis: boolean;
  private _isUsingUpstash: boolean;
  private _initialized: boolean = false;
  private _initPromise: Promise<void> | null = null;

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: 'hive:',
      enabled: process.env.REDIS_ENABLED === 'true' || UPSTASH_ENABLED
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      activeConnections: 0
    };

    // Default to mock until async init completes
    this._isUsingMockRedis = true;
    this._isUsingUpstash = false;
    this.client = new MockRedis();

    // Start async initialization
    this._initPromise = this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    // Priority 1: Try Upstash if configured
    if (UPSTASH_ENABLED) {
      try {
        const upstashClient = await getUpstashClient();
        if (upstashClient) {
          this.client = upstashClient;
          this._isUsingMockRedis = false;
          this._isUsingUpstash = true;
          this._initialized = true;
          logger.info('Using Upstash Redis for caching (distributed)');
          this.startHealthCheck();
          return;
        }
      } catch (error) {
        logger.error('Failed to initialize Upstash, falling back to MockRedis', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      }
    }

    // Priority 2: Fall back to MockRedis
    this.client = new MockRedis();
    this._isUsingMockRedis = true;
    this._isUsingUpstash = false;
    this._initialized = true;

    if (UPSTASH_ENABLED) {
      logger.warn('Upstash configured but failed to connect, using MockRedis fallback');
    } else {
      logger.info('Using MockRedis for caching (Upstash not configured)');
    }

    // Simulate ready event for mock Redis
    setTimeout(() => {
      this.startHealthCheck();
    }, 100);
  }

  // Ensure client is initialized before operations
  private async ensureInitialized(): Promise<void> {
    if (!this._initialized && this._initPromise) {
      await this._initPromise;
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await this.client.ping();
        const responseTime = Date.now() - start;

        // Update average response time
        this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;

        // Get memory usage from Redis INFO
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          this.stats.memoryUsage = parseInt(memoryMatch[1]);
        }

        // Get connection count
        const clientInfo = await this.client.info('clients');
        const connectionMatch = clientInfo.match(/connected_clients:(\d+)/);
        if (connectionMatch) {
          this.stats.activeConnections = parseInt(connectionMatch[1]);
        }
      } catch (error: unknown) {
        this.stats.errors++;
        logger.error('Redis health check failed', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      }
    }, 30000); // Every 30 seconds
  }

  private generateKey(namespace: string, key: string, campusId: string = 'ub-buffalo'): string {
    return `${namespace}:${campusId}:${key}`;
  }

  private async trackOperation<T>(operation: Promise<T>, type: 'get' | 'set' | 'del'): Promise<T> {
    const start = Date.now();

    try {
      const result = await operation;

      switch (type) {
        case 'get':
          if (result !== null) {
            this.stats.hits++;
          } else {
            this.stats.misses++;
          }
          break;
        case 'set':
          this.stats.sets++;
          break;
        case 'del':
          this.stats.deletes++;
          break;
      }

      return result;
    } catch (error) {
      this.stats.errors++;
      throw error;
    } finally {
      const responseTime = Date.now() - start;
      this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
    }
  }

  async get<T>(namespace: string, key: string, campusId?: string): Promise<T | null> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    return this.trackOperation(
      this.client.get(cacheKey).then((result: string | null) => {
        if (result) {
          try {
            const entry: CacheEntry<T> = JSON.parse(result);

            // Check if expired
            if (Date.now() > entry.timestamp + entry.ttl * 1000) {
              this.delete(namespace, key, campusId);
              return null;
            }

            return entry.data;
          } catch (error) {
            logger.error('Failed to parse cache entry', { component: 'redis-client' }, error instanceof Error ? error : undefined);
            return null;
          }
        }
        return null;
      }),
      'get'
    );
  }

  async set<T>(
    namespace: string,
    key: string,
    data: T,
    ttlSeconds: number = 3600,
    campusId?: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
      version: '1.0.0',
      campusId: campusId || 'ub-buffalo',
      metadata
    };

    return this.trackOperation(
      this.client.setex(cacheKey, ttlSeconds, JSON.stringify(entry)).then((result: string) => result === 'OK'),
      'set'
    );
  }

  async delete(namespace: string, key: string, campusId?: string): Promise<boolean> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    return this.trackOperation(
      this.client.del(cacheKey).then((result: number) => result > 0),
      'del'
    );
  }

  async deletePattern(namespace: string, pattern: string, campusId?: string): Promise<number> {
    const searchPattern = this.generateKey(namespace, pattern, campusId);

    try {
      const keys = await this.client.keys(searchPattern);
      if (keys.length === 0) return 0;

      const deleted = await this.client.del(...keys);
      this.stats.deletes += deleted;
      return deleted;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to delete pattern', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  async exists(namespace: string, key: string, campusId?: string): Promise<boolean> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    try {
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch {
      this.stats.errors++;
      return false;
    }
  }

  async increment(namespace: string, key: string, amount: number = 1, campusId?: string): Promise<number> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    try {
      return await this.client.incrby(cacheKey, amount);
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to increment key', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  async setWithExpiry(
    namespace: string,
    key: string,
    data: unknown,
    expiryMs: number,
    campusId?: string
  ): Promise<boolean> {
    const cacheKey = this.generateKey(namespace, key, campusId);

    try {
      const result = await this.client.set(cacheKey, JSON.stringify(data), 'PX', expiryMs);
      if (result === 'OK') {
        this.stats.sets++;
        return true;
      }
      return false;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to set with expiry', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return false;
    }
  }

  // Multi-campus operations
  async getCampusData<T>(namespace: string, key: string): Promise<Record<string, T>> {
    const campuses = ['ub-buffalo']; // Will expand as we add more campuses
    const results: Record<string, T> = {};

    const promises = campuses.map(async (campusId) => {
      const data = await this.get<T>(namespace, key, campusId);
      if (data) {
        results[campusId] = data;
      }
    });

    await Promise.all(promises);
    return results;
  }

  async invalidateCampusCache(campusId: string): Promise<number> {
    try {
      const pattern = `*:${campusId}:*`;
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) return 0;

      const deleted = await this.client.del(...keys);
      this.stats.deletes += deleted;

      logger.info(`Invalidated ${deleted} cache entries for campus: ${campusId}`);
      return deleted;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to invalidate campus cache', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  // Performance optimization methods
  async pipeline(): Promise<ReturnType<MockRedis['pipeline']>> {
    return this.client.pipeline();
  }

  // Check if using mock Redis
  isUsingMockRedis(): boolean {
    return this._isUsingMockRedis;
  }

  // Check if using Upstash Redis
  isUsingUpstash(): boolean {
    return this._isUsingUpstash;
  }

  // Get connection type string
  getConnectionType(): 'upstash' | 'mock' {
    return this._isUsingUpstash ? 'upstash' : 'mock';
  }

  // Check if Upstash is configured (env vars present)
  isUpstashConfigured(): boolean {
    return UPSTASH_ENABLED;
  }

  // Wait for initialization to complete
  async waitForInit(): Promise<void> {
    await this.ensureInitialized();
  }

  async mget<T>(namespace: string, keys: string[], campusId?: string): Promise<Array<T | null>> {
    const cacheKeys = keys.map(key => this.generateKey(namespace, key, campusId));

    try {
      const results = await this.client.mget(...cacheKeys);
      return results.map((result: string | null) => {
        if (result) {
          try {
            const entry: CacheEntry<T> = JSON.parse(result);

            // Check if expired
            if (Date.now() > entry.timestamp + entry.ttl * 1000) {
              return null;
            }

            this.stats.hits++;
            return entry.data;
          } catch (error) {
            logger.error('Failed to parse cache entry in mget', { component: 'redis-client' }, error instanceof Error ? error : undefined);
            this.stats.misses++;
            return null;
          }
        }
        this.stats.misses++;
        return null;
      });
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to execute mget', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return new Array(keys.length).fill(null);
    }
  }

  async mset(entries: Array<{ namespace: string; key: string; data: unknown; ttl?: number; campusId?: string }>): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();

      entries.forEach(({ namespace, key, data, ttl = 3600, campusId }) => {
        const cacheKey = this.generateKey(namespace, key, campusId);
        const entry: CacheEntry = {
          data,
          timestamp: Date.now(),
          ttl,
          version: '1.0.0',
          campusId: campusId || 'ub-buffalo'
        };

        pipeline.setex(cacheKey, ttl, JSON.stringify(entry));
      });

      const results = await pipeline.exec();
      const success = results?.every((result: [string]) => result && result[0] === 'OK') || false;

      if (success) {
        this.stats.sets += entries.length;
      }

      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to execute mset', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return false;
    }
  }

  // Analytics and monitoring
  getStats(): CacheStats & { hitRate: number; totalOperations: number } {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      totalOperations: this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes
    };
  }

  async getMemoryInfo(): Promise<Record<string, string | number>> {
    try {
      const info = await this.client.info('memory');
      const lines = info.split('\r\n');
      const memoryInfo: Record<string, string | number> = {};

      lines.forEach((line: string) => {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          memoryInfo[key] = isNaN(Number(value)) ? value : Number(value);
        }
      });

      return memoryInfo;
    } catch (error) {
      logger.error('Failed to get memory info', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return {};
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      await this.client.flushall();
      logger.warn('Redis cache completely flushed');
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to flush cache', { component: 'redis-client' }, error instanceof Error ? error : undefined);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await this.client.quit();
      logger.info('Redis client connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { component: 'redis-client' }, error instanceof Error ? error : undefined);
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const redisCache = new HiveRedisCache();
export default redisCache;
