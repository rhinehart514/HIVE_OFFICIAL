/**
 * HiveLab Tool Composition Types
 *
 * Core domain types for tool composition and element system.
 */

/**
 * Element instance on the canvas
 */
export interface CanvasElement {
  /** Element type ID (e.g., 'search-input', 'form-builder') */
  elementId: string;

  /** Unique instance ID on canvas (e.g., 'elem_001') */
  instanceId: string;

  /** Element-specific configuration */
  config: Record<string, any>;

  /** Position on canvas */
  position: { x: number; y: number };

  /** Size of element */
  size: { width: number; height: number };
}

/**
 * Connection between elements (data flow)
 */
export interface ElementConnection {
  /** Source element and output */
  from: { instanceId: string; output: string };

  /** Target element and input */
  to: { instanceId: string; input: string };
}

/**
 * Tool composition - complete definition of a canvas tool
 */
export interface ToolComposition {
  /** Unique tool ID */
  id: string;

  /** Tool name */
  name: string;

  /** Tool description */
  description: string;

  /** Elements placed on canvas */
  elements: CanvasElement[];

  /** Connections between elements */
  connections: ElementConnection[];

  /** Layout type */
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

/**
 * Element category types
 */
export type ElementCategory = 'input' | 'display' | 'filter' | 'action' | 'layout';

/**
 * Element definition (registry entry)
 */
export interface ElementDefinition {
  id: string;
  name: string;
  description: string;
  category: ElementCategory;
  icon: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
}

// ============================================================================
// Tool Shared State Types (Phase 1 State Architecture)
// ============================================================================

/**
 * Tool shared state - aggregate data visible to all users
 * Stored at: deployedTools/{deploymentId}/sharedState
 *
 * This is the critical piece that enables tools like polls, RSVPs, and
 * leaderboards to work correctly. Unlike ToolUserState which is per-user,
 * ToolSharedState is visible to everyone and updated atomically.
 *
 * Note: Named ToolSharedState to avoid conflict with inline-component SharedState
 */
export interface ToolSharedState {
  /**
   * Atomic counters for aggregate values (e.g., vote totals)
   * Key format: "{elementInstanceId}:{counterId}"
   * Example: "poll_001:option_a" -> 42
   */
  counters: Record<string, number>;

  /**
   * Collections of entities keyed by ID
   * Key format: "{elementInstanceId}:{collectionName}"
   * Example: "rsvp_001:attendees" -> { "user123": {...}, "user456": {...} }
   */
  collections: Record<string, Record<string, ToolSharedEntity>>;

  /**
   * Ordered timeline of events for the tool
   * Used for activity feeds, logs, recent submissions
   */
  timeline: ToolTimelineEvent[];

  /**
   * Computed/derived values (updated by triggers)
   * Example: "leaderboard_001:rankings" -> [...]
   */
  computed: Record<string, unknown>;

  /**
   * Version number for optimistic concurrency control
   */
  version: number;

  /**
   * Last modification timestamp
   */
  lastModified: string;
}

/**
 * Entity stored in a tool shared collection
 */
export interface ToolSharedEntity {
  id: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  data: Record<string, unknown>;
}

/**
 * Timeline event for tool activity tracking
 */
export interface ToolTimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  userId: string;
  elementInstanceId: string;
  action: string;
  data?: Record<string, unknown>;
}

/**
 * Tool user state - per-user data for personalization
 * Stored at: toolStates/{deploymentId}_{userId}
 */
export interface ToolUserState {
  /**
   * User's selections/choices per element
   * Example: "poll_001:selectedOption" -> "option_b"
   */
  selections: Record<string, unknown>;

  /**
   * User's participation status per element
   * Example: "poll_001:hasVoted" -> true
   */
  participation: Record<string, boolean>;

  /**
   * User's personal data (form drafts, preferences)
   */
  personal: Record<string, unknown>;

  /**
   * Local UI state (collapsed sections, scroll positions)
   */
  ui: Record<string, unknown>;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * Tool action category determines how state is updated
 */
export type ToolActionCategory =
  | 'aggregate'   // Updates sharedState (vote, rsvp, submit)
  | 'personal'    // Updates userState only (toggle, select, draft)
  | 'hybrid';     // Updates both (vote also tracks who voted)

/**
 * Tool shared state update operation
 * Used for atomic operations on shared state
 */
export interface ToolSharedStateUpdate {
  /**
   * Counter increments/decrements
   * Example: { "poll_001:option_a": 1, "poll_001:option_b": -1 }
   */
  counterDeltas?: Record<string, number>;

  /**
   * Entities to upsert into collections
   * Example: { "rsvp_001:attendees": { "user123": { id: "user123", ... } } }
   */
  collectionUpserts?: Record<string, Record<string, ToolSharedEntity>>;

  /**
   * Entity IDs to remove from collections
   * Example: { "rsvp_001:attendees": ["user456"] }
   */
  collectionDeletes?: Record<string, string[]>;

  /**
   * Events to append to timeline
   */
  timelineAppend?: Omit<ToolTimelineEvent, 'id' | 'timestamp'>[];

  /**
   * Computed values to update (full replacement)
   */
  computedUpdates?: Record<string, unknown>;
}

/**
 * Tool user state update operation
 */
export interface ToolUserStateUpdate {
  selections?: Record<string, unknown>;
  participation?: Record<string, boolean>;
  personal?: Record<string, unknown>;
  ui?: Record<string, unknown>;
}

/**
 * Result from executing an action
 */
export interface ToolActionResult {
  success: boolean;
  error?: string;

  /**
   * Updates to apply to shared state (aggregate actions)
   */
  sharedStateUpdate?: ToolSharedStateUpdate;

  /**
   * Updates to apply to user state (personal actions)
   */
  userStateUpdate?: ToolUserStateUpdate;

  /**
   * Result data to return to client
   */
  result?: {
    message?: string;
    data?: Record<string, unknown>;
    cascadedElements?: string[];
  };

  /**
   * Effects to trigger after state commit
   */
  effects?: ToolEffect[];
}

/**
 * Side effect to execute after action
 */
export interface ToolEffect {
  type: 'notification' | 'trigger' | 'broadcast' | 'log';
  payload: Record<string, unknown>;
}

/**
 * Combined state for client consumption
 */
export interface CombinedToolState {
  /**
   * Shared state visible to all users
   */
  shared: ToolSharedState;

  /**
   * Current user's personal state
   */
  user: ToolUserState;

  /**
   * Injected context data (space info, member list, etc.)
   */
  context?: ToolContext;
}

/**
 * Context injected into tool execution
 */
export interface ToolContext {
  spaceId?: string;
  spaceName?: string;
  memberCount?: number;
  userRole?: 'admin' | 'moderator' | 'member' | 'guest';
  userId: string;
  userDisplayName?: string;
  timestamp: string;
}

// ============================================================================
// Sharded Counter Types (Phase 1 Scaling Architecture)
// ============================================================================

/**
 * Configuration for sharded counters.
 *
 * Sharding distributes counter writes across multiple documents to overcome
 * Firestore's ~25 writes/sec/document limit.
 *
 * Example capacity:
 *   - 10 shards (default) = 200 writes/sec
 *   - 50 shards = 1,000 writes/sec
 *   - 100 shards (max) = 2,000 writes/sec
 */
export interface ShardedCounterConfig {
  /**
   * Number of shards for this counter
   * Default: 10, Max: 100
   */
  shardCount: number;

  /**
   * Whether this counter uses sharding
   * When false, uses legacy single-document counter
   */
  isSharded: boolean;
}

/**
 * Element-level counter configuration.
 * Allows per-element shard tuning for different traffic patterns.
 */
export interface ElementCounterConfig {
  /**
   * Element instance ID this config applies to
   */
  elementInstanceId: string;

  /**
   * Counter-specific shard configurations
   * Key is the counter suffix (e.g., "votes", "option_a")
   */
  counters?: Record<string, ShardedCounterConfig>;

  /**
   * Default shard count for counters without explicit config
   */
  defaultShardCount?: number;
}

/**
 * Tool-level counter configuration.
 * Stored in tool composition for scaling configuration.
 */
export interface ToolCounterConfig {
  /**
   * Default shard count for all counters in this tool
   * Individual elements can override
   */
  defaultShardCount: number;

  /**
   * Element-specific counter configurations
   */
  elementConfigs?: ElementCounterConfig[];

  /**
   * Whether to use sharded counters (can be disabled for testing)
   */
  enableSharding: boolean;
}

/**
 * Migration status for a deployed tool's counters
 */
export interface CounterMigrationStatus {
  /**
   * Deployment ID
   */
  deploymentId: string;

  /**
   * Current migration state
   */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  /**
   * Counters that have been migrated to sharded format
   */
  migratedCounters: string[];

  /**
   * Counters still using legacy format
   */
  legacyCounters: string[];

  /**
   * Migration started timestamp
   */
  startedAt?: string;

  /**
   * Migration completed timestamp
   */
  completedAt?: string;

  /**
   * Error message if migration failed
   */
  error?: string;
}
