/**
 * Connection Resolver Service
 *
 * Sprint 3: Tool-to-Tool Connections
 *
 * Resolves connections between tools at runtime by:
 * 1. Loading all incoming connections for a tool
 * 2. Fetching source tool state data
 * 3. Applying transforms to source values
 * 4. Injecting resolved values into element configs
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

import type {
  ToolConnection,
  ResolvedConnection,
  ResolvedConnections,
  ToolConnectionSource,
  DataTransform,
  ConnectionStatus,
} from '../../domain/hivelab/tool-connection.types';
import {
  applyTransform,
  getValueAtPath,
  CONNECTION_CACHE_TTL_MS,
  getConnectionCacheKey,
  getConnectionCacheTTL,
} from '../../domain/hivelab/tool-connection.types';
import type { CanvasElement, ToolSharedState } from '../../domain/hivelab/tool-composition.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Repository interface for fetching connections and tool state
 */
export interface ConnectionRepository {
  /**
   * Get all connections where the target is the given deployment
   */
  getIncomingConnections(
    deploymentId: string,
    spaceId: string
  ): Promise<ToolConnection[]>;

  /**
   * Get the shared state of a deployed tool
   */
  getToolSharedState(deploymentId: string): Promise<ToolSharedState | null>;

  /**
   * Get tool metadata (name, description, etc.)
   */
  getToolMetadata(deploymentId: string): Promise<{
    name: string;
    spaceId: string;
  } | null>;
}

/**
 * Cache entry for resolved connection values
 */
interface CacheEntry {
  value: unknown;
  resolvedAt: string;
  expiresAt: number;
}

/**
 * Options for connection resolution
 */
export interface ResolveOptions {
  /** Skip cache and fetch fresh values */
  bypassCache?: boolean;
  /** Custom TTL for this resolution */
  ttl?: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class ConnectionResolverService {
  /** In-memory cache for resolved values */
  private cache: Map<string, CacheEntry> = new Map();

  constructor(private readonly repository: ConnectionRepository) {}

  /**
   * Resolve all incoming connections for a tool.
   *
   * This is the main entry point called when a tool loads.
   */
  async resolveConnections(
    deploymentId: string,
    spaceId: string,
    options: ResolveOptions = {}
  ): Promise<ResolvedConnections> {
    const { bypassCache = false, ttl = CONNECTION_CACHE_TTL_MS } = options;
    const now = new Date().toISOString();
    const values: Record<string, ResolvedConnection> = {};
    let errorCount = 0;

    // Get all connections targeting this tool
    const connections = await this.repository.getIncomingConnections(
      deploymentId,
      spaceId
    );

    // Filter to only enabled connections
    const activeConnections = connections.filter((c) => c.enabled);

    // Resolve each connection
    for (const connection of activeConnections) {
      const cacheKey = getConnectionCacheKey(
        connection.target.deploymentId,
        connection.target.elementId,
        connection.target.inputPath
      );

      // Check cache first (unless bypassing)
      if (!bypassCache) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          values[cacheKey] = {
            connectionId: connection.id,
            status: 'connected',
            value: cached.value,
            resolvedAt: cached.resolvedAt,
            ttl,
          };
          continue;
        }
      }

      // Resolve the source value
      try {
        const resolved = await this.resolveSourceValue(connection.source);

        // Apply transform if specified
        const transformedValue = applyTransform(resolved, connection.transform);

        // COST OPTIMIZATION: Use type-specific TTL based on source path
        // Counters: 5 min, collections: 2 min, timeline: 30 sec
        const effectiveTtl = options.ttl ?? getConnectionCacheTTL(connection.source.path);

        // Cache the result
        this.setInCache(cacheKey, transformedValue, effectiveTtl);

        values[cacheKey] = {
          connectionId: connection.id,
          status: 'connected',
          value: transformedValue,
          resolvedAt: now,
          ttl: effectiveTtl,
        };
      } catch (error) {
        errorCount++;
        values[cacheKey] = {
          connectionId: connection.id,
          status: 'error',
          value: undefined,
          error: error instanceof Error ? error.message : 'Failed to resolve',
          resolvedAt: now,
          ttl: 0,
        };
      }
    }

    return {
      values,
      resolvedAt: now,
      count: activeConnections.length,
      errorCount,
    };
  }

  /**
   * Fetch the value at a source path from a source tool's state.
   */
  async resolveSourceValue(source: ToolConnectionSource): Promise<unknown> {
    const state = await this.repository.getToolSharedState(source.deploymentId);

    if (!state) {
      throw new Error(`Source tool state not found: ${source.deploymentId}`);
    }

    const value = getValueAtPath(state, source.path);

    if (value === undefined) {
      throw new Error(`Path not found in source: ${source.path}`);
    }

    return value;
  }

  /**
   * Inject resolved connection values into element configs.
   *
   * This modifies elements in-place to include connected data.
   */
  injectIntoElements(
    elements: CanvasElement[],
    resolved: ResolvedConnections
  ): CanvasElement[] {
    return elements.map((element) => {
      // Check if any connections target this element
      const elementConnections = Object.entries(resolved.values).filter(
        ([key]) => key.includes(`:${element.instanceId}:`)
      );

      if (elementConnections.length === 0) {
        return element;
      }

      // Clone the element to avoid mutations
      const updatedElement = {
        ...element,
        config: { ...element.config },
      };

      // Inject each connected value
      for (const [key, connection] of elementConnections) {
        if (connection.status !== 'connected') continue;

        // Extract the inputPath from the cache key
        const parts = key.split(':');
        const inputPath = parts[parts.length - 1];

        // Set the value in the config
        if (inputPath.includes('.')) {
          // Handle nested paths
          const pathParts = inputPath.split('.');
          let current: Record<string, unknown> = updatedElement.config;
          for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current[pathParts[i]] as Record<string, unknown>;
          }
          current[pathParts[pathParts.length - 1]] = connection.value;
        } else {
          updatedElement.config[inputPath] = connection.value;
        }

        // Add metadata about the connection source
        if (!updatedElement.config._connectedFields) {
          updatedElement.config._connectedFields = {};
        }
        (updatedElement.config._connectedFields as Record<string, string>)[
          inputPath
        ] = connection.connectionId;
      }

      return updatedElement;
    });
  }

  /**
   * Get a single connection's current value (with caching).
   */
  async getConnectionValue(
    connection: ToolConnection,
    options: ResolveOptions = {}
  ): Promise<ResolvedConnection> {
    const { bypassCache = false, ttl = CONNECTION_CACHE_TTL_MS } = options;
    const cacheKey = getConnectionCacheKey(
      connection.target.deploymentId,
      connection.target.elementId,
      connection.target.inputPath
    );

    // Check cache
    if (!bypassCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          connectionId: connection.id,
          status: 'connected',
          value: cached.value,
          resolvedAt: cached.resolvedAt,
          ttl,
        };
      }
    }

    // Resolve fresh
    try {
      const value = await this.resolveSourceValue(connection.source);
      const transformedValue = applyTransform(value, connection.transform);
      const now = new Date().toISOString();

      this.setInCache(cacheKey, transformedValue, ttl);

      return {
        connectionId: connection.id,
        status: 'connected',
        value: transformedValue,
        resolvedAt: now,
        ttl,
      };
    } catch (error) {
      return {
        connectionId: connection.id,
        status: 'error',
        value: undefined,
        error: error instanceof Error ? error.message : 'Failed to resolve',
        resolvedAt: new Date().toISOString(),
        ttl: 0,
      };
    }
  }

  /**
   * Clear the cache for a specific connection or all connections.
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Invalidate all cached values for a source tool.
   *
   * Call this when a source tool's state changes.
   */
  invalidateSourceTool(sourceDeploymentId: string): void {
    // Can't efficiently invalidate by source with current key structure
    // For now, clear everything (can optimize later with reverse index)
    this.cache.clear();
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private setInCache(key: string, value: unknown, ttl: number): void {
    this.cache.set(key, {
      value,
      resolvedAt: new Date().toISOString(),
      expiresAt: Date.now() + ttl,
    });
  }
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

let instance: ConnectionResolverService | null = null;

/**
 * Get the singleton connection resolver instance.
 *
 * Must call initializeConnectionResolver first.
 */
export function getConnectionResolver(): ConnectionResolverService {
  if (!instance) {
    throw new Error(
      'ConnectionResolverService not initialized. Call initializeConnectionResolver first.'
    );
  }
  return instance;
}

/**
 * Initialize the connection resolver with dependencies.
 */
export function initializeConnectionResolver(
  repository: ConnectionRepository
): ConnectionResolverService {
  instance = new ConnectionResolverService(repository);
  return instance;
}

/**
 * Create a connection resolver (non-singleton for testing).
 */
export function createConnectionResolver(
  repository: ConnectionRepository
): ConnectionResolverService {
  return new ConnectionResolverService(repository);
}

/**
 * Reset the singleton (for testing).
 */
export function resetConnectionResolver(): void {
  instance = null;
}
