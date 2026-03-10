/**
 * Element Type Definitions
 *
 * Extracted from element-system.ts to break the circular dependency:
 *   element-system.ts -> element-renderers.tsx -> registry.tsx -> element-system.ts
 *
 * Both element-system.ts and registry.tsx (plus individual element components)
 * import types from this file instead of creating a cycle.
 */

import type {
  SpaceContext,
  MemberContext,
  TemporalContext,
  CapabilityContext,
  VisibilityCondition,
  ConditionGroup,
  ContextRequirements,
} from '@hive/core';

// Element access tiers - determines what DATA an element can access
export type ElementTier =
  | 'universal'   // Everyone - no HIVE data needed
  | 'connected'   // Everyone - pulls from public HIVE data (events, spaces, users)
  | 'space';      // Leaders only - pulls from their space's private data

// Data source types for connected/space elements
export type DataSource =
  | 'none'           // Universal elements - user provides data
  | 'campus-events'  // UBLinked imported events
  | 'campus-spaces'  // Space directory
  | 'campus-users'   // User search/directory
  | 'user-connections' // Current user's connections
  | 'space-members'  // Specific space's members (leader only)
  | 'space-events'   // Specific space's events (leader only)
  | 'space-feed'     // Specific space's posts (leader only)
  | 'space-stats';   // Specific space's metrics (leader only)

/**
 * Shared state structure for aggregate data visible to all users.
 * Used for polls, RSVPs, leaderboards, etc.
 */
export interface ElementSharedState {
  /** Atomic counters (e.g., vote counts) - key format: "{instanceId}:{counterId}" */
  counters: Record<string, number>;
  /** Collections of entities - key format: "{instanceId}:{collectionName}" */
  collections: Record<string, Record<string, { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> }>>;
  /** Timeline of events */
  timeline: Array<{ id: string; type: string; timestamp: string; userId: string; action: string; data?: Record<string, unknown> }>;
  /** Computed/derived values */
  computed: Record<string, unknown>;
  /** Version for optimistic concurrency */
  version: number;
  /** Last modification timestamp */
  lastModified: string;
}

/**
 * User state for per-user data.
 * All properties optional for backward compatibility with legacy flat data.
 */
export interface ElementUserState {
  /** User's selections per element */
  selections?: Record<string, unknown>;
  /** User's participation flags per element */
  participation?: Record<string, boolean>;
  /** User's personal data */
  personal?: Record<string, unknown>;
  /** UI state (collapsed, scroll positions, etc.) */
  ui?: Record<string, unknown>;
  /** Allow additional properties for legacy/flat data */
  [key: string]: unknown;
}

/**
 * Runtime connection shape for element-level I/O wiring.
 * Supports both canonical `input`/`output` and IDE `port` naming.
 */
export interface ElementConnectionRef {
  from: { instanceId: string; output?: string; port?: string };
  to: { instanceId: string; input?: string; port?: string };
}

/**
 * Minimal element instance metadata for resolving connection source types.
 */
export interface ElementInstanceRef {
  instanceId: string;
  elementId: string;
}

export interface ElementProps {
  id: string;
  config: Record<string, any>;
  /** @deprecated Use sharedState for aggregate data, userState for per-user data */
  data?: any;
  onChange?: (data: any) => void;
  onAction?: (action: string, payload: any) => void;

  // ============================================================================
  // Sprint 2: Runtime Context (Contextual Intelligence)
  // ============================================================================

  /**
   * Runtime context for data access and personalization
   * Provides space, member, and temporal information for conditional rendering
   */
  context?: {
    userId?: string;
    userDisplayName?: string;
    userRole?: 'admin' | 'moderator' | 'member' | 'guest';
    campusId?: string;
    spaceId?: string;      // Only set if user is a leader of this space
    spaceName?: string;
    isSpaceLeader?: boolean;
    // Sprint 2: Full context objects
    temporal?: TemporalContext;
    space?: SpaceContext;
    member?: MemberContext;
    capabilities?: CapabilityContext;
  };

  /**
   * Visibility conditions for conditional rendering (Sprint 2)
   * If conditions evaluate to false, the element is hidden
   */
  visibilityConditions?: VisibilityCondition[] | ConditionGroup;

  /**
   * Context requirements declaring what context fields this element needs
   */
  contextRequirements?: ContextRequirements;

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Shared state visible to all users (aggregate data like vote counts, RSVP lists)
   * Read from: deployedTools/{deploymentId}/sharedState/current
   */
  sharedState?: ElementSharedState;

  /**
   * Per-user state (personal selections, participation, UI state)
   * Read from: toolStates/{deploymentId}_{userId}
   */
  userState?: ElementUserState;

  /**
   * Intra-tool connections available at runtime.
   * Used by custom blocks to resolve `get_input` requests.
   */
  connections?: ElementConnectionRef[];

  /**
   * Runtime state for all element instances in the tool.
   * Keyed by instanceId.
   */
  allElementStates?: Record<string, unknown>;

  /**
   * Element instance metadata for connection source/target resolution.
   */
  elementDefinitions?: ElementInstanceRef[];

  /**
   * Callback for element-emitted output events.
   */
  onOutput?: (outputId: string, data: unknown) => void;
}
