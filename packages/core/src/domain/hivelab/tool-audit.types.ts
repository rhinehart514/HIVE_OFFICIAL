/**
 * Tool Audit Trail Types
 *
 * Sprint 5: Audit Trail
 *
 * Tracks all significant changes to tools for transparency and debugging:
 * - Tool edits (who, when, what changed)
 * - Automation runs (trigger, status, actions)
 * - Connection changes (added, removed, modified)
 * - State changes (counters, collections)
 */

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

/**
 * Types of auditable events
 */
export type AuditEventType =
  // Tool lifecycle
  | 'tool.created'
  | 'tool.updated'
  | 'tool.deployed'
  | 'tool.undeployed'
  | 'tool.deleted'

  // Element changes
  | 'element.added'
  | 'element.updated'
  | 'element.removed'
  | 'element.reordered'

  // Automation events
  | 'automation.created'
  | 'automation.updated'
  | 'automation.deleted'
  | 'automation.enabled'
  | 'automation.disabled'
  | 'automation.run'
  | 'automation.failed'

  // Connection events
  | 'connection.created'
  | 'connection.updated'
  | 'connection.deleted'
  | 'connection.resolved'
  | 'connection.failed'

  // State events
  | 'state.counter.updated'
  | 'state.collection.updated'
  | 'state.reset'

  // Access events
  | 'access.granted'
  | 'access.revoked';

// ============================================================================
// AUDIT ENTRY
// ============================================================================

/**
 * Actor who performed the action
 */
export interface AuditActor {
  /** User ID (null for system actions) */
  userId: string | null;

  /** User display name at time of action */
  displayName?: string;

  /** User email at time of action */
  email?: string;

  /** Whether this was a system/automation action */
  isSystem: boolean;

  /** For system actions, the source (e.g., automation ID, scheduler) */
  systemSource?: string;
}

/**
 * Changed fields tracking
 */
export interface AuditChanges {
  /** Fields that were changed */
  fields: string[];

  /** Previous values (for update events) */
  before?: Record<string, unknown>;

  /** New values */
  after?: Record<string, unknown>;
}

/**
 * Single audit log entry
 */
export interface AuditEntry {
  /** Unique audit entry ID */
  id: string;

  /** Tool deployment ID */
  deploymentId: string;

  /** Event type */
  type: AuditEventType;

  /** Human-readable description */
  description: string;

  /** Who performed the action */
  actor: AuditActor;

  /** What changed */
  changes?: AuditChanges;

  /** Additional context (varies by event type) */
  metadata?: Record<string, unknown>;

  /** When it happened */
  timestamp: string;

  /** IP address if available */
  ipAddress?: string;

  /** User agent if available */
  userAgent?: string;
}

// ============================================================================
// AUDIT LOG QUERY
// ============================================================================

/**
 * Query options for fetching audit log
 */
export interface AuditLogQuery {
  /** Filter by event types */
  types?: AuditEventType[];

  /** Filter by actor user ID */
  actorId?: string;

  /** Filter by date range */
  startDate?: string;
  endDate?: string;

  /** Pagination */
  limit?: number;
  cursor?: string;
}

/**
 * Paginated audit log response
 */
export interface AuditLogResponse {
  /** Audit entries */
  entries: AuditEntry[];

  /** Total count (if available) */
  total?: number;

  /** Cursor for next page */
  nextCursor?: string;

  /** Whether there are more results */
  hasMore: boolean;
}

// ============================================================================
// AUDIT SUMMARY
// ============================================================================

/**
 * Summary stats for audit dashboard
 */
export interface AuditSummary {
  /** Total events in time period */
  totalEvents: number;

  /** Events by type */
  eventsByType: Record<string, number>;

  /** Events by actor */
  eventsByActor: {
    userId: string;
    displayName?: string;
    count: number;
  }[];

  /** Recent activity (last 7 days) */
  recentActivity: {
    date: string;
    count: number;
  }[];

  /** Automation stats */
  automationStats: {
    runs: number;
    successes: number;
    failures: number;
  };
}

// ============================================================================
// FIRESTORE COLLECTION
// ============================================================================

/**
 * Firestore collection name for audit logs
 */
export const AUDIT_COLLECTION = 'auditLog';

/**
 * Maximum entries to keep per deployment
 */
export const MAX_AUDIT_ENTRIES = 1000;

/**
 * Retention period in days
 */
export const AUDIT_RETENTION_DAYS = 90;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate audit entry ID
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create an audit entry
 */
export function createAuditEntry(
  deploymentId: string,
  type: AuditEventType,
  description: string,
  actor: AuditActor,
  options?: {
    changes?: AuditChanges;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): AuditEntry {
  return {
    id: generateAuditId(),
    deploymentId,
    type,
    description,
    actor,
    changes: options?.changes,
    metadata: options?.metadata,
    timestamp: new Date().toISOString(),
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };
}

/**
 * Create a system actor
 */
export function createSystemActor(source: string): AuditActor {
  return {
    userId: null,
    isSystem: true,
    systemSource: source,
  };
}

/**
 * Create a user actor
 */
export function createUserActor(
  userId: string,
  displayName?: string,
  email?: string
): AuditActor {
  return {
    userId,
    displayName,
    email,
    isSystem: false,
  };
}

/**
 * Get human-readable description for event type
 */
export function getEventDescription(type: AuditEventType): string {
  const descriptions: Record<AuditEventType, string> = {
    'tool.created': 'Tool created',
    'tool.updated': 'Tool updated',
    'tool.deployed': 'Tool deployed',
    'tool.undeployed': 'Tool undeployed',
    'tool.deleted': 'Tool deleted',

    'element.added': 'Element added',
    'element.updated': 'Element updated',
    'element.removed': 'Element removed',
    'element.reordered': 'Elements reordered',

    'automation.created': 'Automation created',
    'automation.updated': 'Automation updated',
    'automation.deleted': 'Automation deleted',
    'automation.enabled': 'Automation enabled',
    'automation.disabled': 'Automation disabled',
    'automation.run': 'Automation executed',
    'automation.failed': 'Automation failed',

    'connection.created': 'Connection created',
    'connection.updated': 'Connection updated',
    'connection.deleted': 'Connection deleted',
    'connection.resolved': 'Connection resolved',
    'connection.failed': 'Connection failed',

    'state.counter.updated': 'Counter updated',
    'state.collection.updated': 'Collection updated',
    'state.reset': 'State reset',

    'access.granted': 'Access granted',
    'access.revoked': 'Access revoked',
  };

  return descriptions[type] || type;
}
