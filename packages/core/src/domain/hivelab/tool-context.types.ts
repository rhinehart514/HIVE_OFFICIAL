/**
 * Tool Runtime Context Types
 *
 * Defines the context structure that tools receive at runtime.
 * Enables personalization and conditional rendering based on:
 * - Space information (where the tool is deployed)
 * - Member information (who is using it)
 * - Temporal information (when it's being used)
 *
 * @version 1.0.0 - HiveLab Sprint 2 (Jan 2026)
 */

// ============================================================================
// Space Context
// ============================================================================

/**
 * Information about the space where the tool is deployed
 */
export interface SpaceContext {
  /** Unique space identifier */
  spaceId: string;

  /** Display name of the space */
  spaceName: string;

  /** Total number of members */
  memberCount: number;

  /** Number of currently online members */
  onlineCount?: number;

  /** Space category (club, academic, social, etc.) */
  category: string;

  /** Whether the space is verified */
  isVerified?: boolean;

  /** Space branding configuration */
  brand?: {
    /** Primary brand color (hex) */
    primaryColor?: string;
    /** Secondary brand color (hex) */
    secondaryColor?: string;
    /** Space icon URL */
    iconUrl?: string;
  };
}

// ============================================================================
// Member Context
// ============================================================================

/**
 * The user's role within the space
 */
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

/**
 * Information about the current user's membership
 */
export interface MemberContext {
  /** User's unique identifier */
  userId: string;

  /** User's display name */
  displayName?: string;

  /** User's role in the space */
  role: MemberRole;

  /** Tenure information */
  tenure: {
    /** Days since joining the space */
    daysInSpace: number;
    /** Considered new if < 7 days */
    isNewMember: boolean;
    /** Timestamp when user joined */
    joinedAt?: string;
  };

  /** User's permissions within the space */
  permissions: {
    /** Can create posts/messages */
    canPost: boolean;
    /** Can deploy tools */
    canDeployTools: boolean;
    /** Can moderate content */
    canModerate: boolean;
    /** Can manage members */
    canManageMembers: boolean;
    /** Can access admin features */
    canAccessAdmin: boolean;
  };
}

// ============================================================================
// Temporal Context
// ============================================================================

/**
 * Time-based context for conditional rendering
 */
export interface TemporalContext {
  /** Day of week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number;

  /** Hour of day (0-23) in user's local timezone */
  hourOfDay: number;

  /** Whether it's a weekend (Saturday or Sunday) */
  isWeekend: boolean;

  /** Whether it's evening (after 6pm) */
  isEvening: boolean;

  /** Whether it's morning (before noon) */
  isMorning: boolean;

  /** Current timestamp (ISO 8601) */
  timestamp: string;

  /** User's timezone (IANA format, e.g., "America/New_York") */
  timezone?: string;
}

// ============================================================================
// Capability Context
// ============================================================================

/**
 * Platform capabilities available to the tool
 */
export interface CapabilityContext {
  /** Can access campus-wide events */
  campusEvents: boolean;

  /** Can access space member list */
  spaceMembers: boolean;

  /** Can send notifications */
  notifications: boolean;

  /** Can access user's connections */
  userConnections: boolean;

  /** Can access analytics data */
  analytics: boolean;

  /** Can perform state mutations */
  stateMutations: boolean;
}

// ============================================================================
// Combined Runtime Context
// ============================================================================

/**
 * Complete runtime context passed to tools
 */
export interface ToolRuntimeContext {
  /** Current user's ID */
  userId: string;

  /** Campus/organization ID */
  campusId: string;

  /** Temporal context (computed client-side) */
  temporal: TemporalContext;

  /** Space context (if deployed to a space) */
  space?: SpaceContext;

  /** Member context (if user is a space member) */
  member?: MemberContext;

  /** Deployment identifier for this tool instance */
  deploymentId: string;

  /** Platform capabilities available */
  capabilities: CapabilityContext;
}

// ============================================================================
// Visibility Conditions
// ============================================================================

/**
 * Operators for condition evaluation
 */
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'contains'
  | 'notContains'
  | 'in'
  | 'notIn'
  | 'exists'
  | 'notExists';

/**
 * A single visibility condition
 */
export interface VisibilityCondition {
  /** Context field path (e.g., "member.role", "temporal.isWeekend") */
  field: string;

  /** Comparison operator */
  operator: ConditionOperator;

  /** Value to compare against */
  value: unknown;
}

/**
 * Logical grouping of conditions
 */
export interface ConditionGroup {
  /** Logical operator for combining conditions */
  logic: 'and' | 'or';

  /** Conditions in this group */
  conditions: (VisibilityCondition | ConditionGroup)[];
}

// ============================================================================
// Context Requirements
// ============================================================================

/**
 * Declares what context fields an element requires
 */
export interface ContextRequirements {
  /** Requires space context */
  space?: boolean | string[];

  /** Requires member context */
  member?: boolean | string[];

  /** Requires temporal context */
  temporal?: boolean | string[];

  /** Required capabilities */
  capabilities?: (keyof CapabilityContext)[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper to extract nested property type from a path string
 * e.g., PathValue<ToolRuntimeContext, "member.role"> = MemberRole
 */
export type PathValue<T, Path extends string> = Path extends keyof T
  ? T[Path]
  : Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : never;

/**
 * All possible context field paths
 */
export type ContextFieldPath =
  | 'userId'
  | 'campusId'
  | 'deploymentId'
  | 'temporal.dayOfWeek'
  | 'temporal.hourOfDay'
  | 'temporal.isWeekend'
  | 'temporal.isEvening'
  | 'temporal.isMorning'
  | 'temporal.timestamp'
  | 'space.spaceId'
  | 'space.spaceName'
  | 'space.memberCount'
  | 'space.onlineCount'
  | 'space.category'
  | 'space.isVerified'
  | 'space.brand.primaryColor'
  | 'member.userId'
  | 'member.displayName'
  | 'member.role'
  | 'member.tenure.daysInSpace'
  | 'member.tenure.isNewMember'
  | 'member.permissions.canPost'
  | 'member.permissions.canDeployTools'
  | 'member.permissions.canModerate'
  | 'member.permissions.canManageMembers'
  | 'member.permissions.canAccessAdmin'
  | 'capabilities.campusEvents'
  | 'capabilities.spaceMembers'
  | 'capabilities.notifications'
  | 'capabilities.userConnections'
  | 'capabilities.analytics'
  | 'capabilities.stateMutations';

// ============================================================================
// Condition Evaluation
// ============================================================================

/**
 * Evaluates a single condition against the runtime context
 */
export function evaluateCondition(
  condition: VisibilityCondition,
  context: ToolRuntimeContext
): boolean {
  const value = getNestedValue(context, condition.field);

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'notEquals':
      return value !== condition.value;
    case 'greaterThan':
      return typeof value === 'number' && value > (condition.value as number);
    case 'lessThan':
      return typeof value === 'number' && value < (condition.value as number);
    case 'greaterThanOrEquals':
      return typeof value === 'number' && value >= (condition.value as number);
    case 'lessThanOrEquals':
      return typeof value === 'number' && value <= (condition.value as number);
    case 'contains':
      return typeof value === 'string' && value.includes(condition.value as string);
    case 'notContains':
      return typeof value === 'string' && !value.includes(condition.value as string);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value);
    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(value);
    case 'exists':
      return value !== undefined && value !== null;
    case 'notExists':
      return value === undefined || value === null;
    default:
      return false;
  }
}

/**
 * Evaluates a condition group against the runtime context
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  context: ToolRuntimeContext
): boolean {
  const results = group.conditions.map((item) => {
    if ('logic' in item) {
      return evaluateConditionGroup(item, context);
    }
    return evaluateCondition(item, context);
  });

  if (group.logic === 'and') {
    return results.every(Boolean);
  }
  return results.some(Boolean);
}

/**
 * Helper to get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ============================================================================
// Context Factory
// ============================================================================

/**
 * Creates a temporal context from the current time
 */
export function createTemporalContext(
  timezone?: string
): TemporalContext {
  const now = new Date();

  // Use timezone if provided, otherwise use local time
  const options: Intl.DateTimeFormatOptions = timezone
    ? { timeZone: timezone }
    : {};

  const localDate = new Date(
    now.toLocaleString('en-US', { ...options, hour12: false })
  );

  const dayOfWeek = localDate.getDay();
  const hourOfDay = localDate.getHours();

  return {
    dayOfWeek,
    hourOfDay,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isEvening: hourOfDay >= 18,
    isMorning: hourOfDay < 12,
    timestamp: now.toISOString(),
    timezone,
  };
}

/**
 * Creates default capabilities based on user role
 */
export function createDefaultCapabilities(
  role: MemberRole
): CapabilityContext {
  const isLeader = ['owner', 'admin', 'moderator'].includes(role);

  return {
    campusEvents: true,
    spaceMembers: isLeader,
    notifications: true,
    userConnections: true,
    analytics: isLeader,
    stateMutations: true,
  };
}

// ============================================================================
// Server-Side Execution Context Types
// ============================================================================

/**
 * Server-side execution context for space-deployed tools
 */
export interface SpaceExecutionContext {
  space: {
    id: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
  };
  events: {
    upcoming: Array<{ id: string; title?: string; startDate?: string; [key: string]: unknown }>;
    recent: Array<{ id: string; title?: string; startDate?: string; [key: string]: unknown }>;
    total: number;
  };
  members: {
    list: Array<{ id: string; displayName: string; avatarUrl?: string | null; role: string }>;
    total: number;
    currentUserIsMember: boolean;
  };
  fetchedAt: string;
  error?: string;
}

/**
 * Server-side execution context for profile-deployed tools
 */
export interface ProfileExecutionContext {
  profile: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isOwner: boolean;
  fetchedAt: string;
}

/**
 * Server-side execution context for campus-deployed tools
 */
export interface CampusExecutionContext {
  campus: {
    campusId: string;
    campusName: string;
    toolCount: number;
  };
  tool: {
    slug: string;
    category: string;
    badge: 'official' | 'community';
    status: 'pending_review' | 'active' | 'paused';
  };
  usageStats: {
    weeklyUsers: number;
    totalUses: number;
  };
  fetchedAt: string;
}

/**
 * Discriminated union for deployment execution context
 */
export type DeploymentExecutionContext =
  | { type: 'space'; context: SpaceExecutionContext }
  | { type: 'profile'; context: ProfileExecutionContext }
  | { type: 'campus'; context: CampusExecutionContext };
