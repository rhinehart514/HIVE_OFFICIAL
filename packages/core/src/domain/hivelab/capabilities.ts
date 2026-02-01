/**
 * HiveLab Tool Capabilities & Governance Layer
 *
 * Defines the three "Hack Lanes" for tool execution:
 * - Lane 1: SAFE (UI + state only, default)
 * - Lane 2: SCOPED (space-private reads/writes)
 * - Lane 3: POWER (platform side effects, gated)
 */

// =============================================================================
// Generic Firestore Interface (avoids importing firebase-admin on client)
// =============================================================================

/**
 * Minimal Firestore interface for budget operations.
 * Works with both firebase-admin and firebase client SDK.
 */
interface FirestoreDB {
  collection(path: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
      set(data: Record<string, unknown>, options?: { merge?: boolean }): Promise<unknown>;
    };
  };
}

// =============================================================================
// Capability Types
// =============================================================================

/**
 * Tool capability grants - what a deployed tool is allowed to do.
 *
 * These are explicitly requested at deployment time and enforced at execution.
 */
export interface ToolCapabilities {
  /**
   * Lane 1 (Safe) - Always allowed
   */
  read_own_state: true; // Always true, can't be disabled
  write_own_state: true; // Always true, can't be disabled

  /**
   * Lane 2 (Scoped) - Leader/Builder approved
   */
  read_space_context?: boolean; // Access memberCount, spaceId, etc.
  read_space_members?: boolean; // Access member list for @mentions, attendance
  write_shared_state?: boolean; // Update aggregate state visible to all users

  /**
   * Lane 3 (Power) - Explicitly gated
   */
  create_posts?: boolean; // Generate feed content
  send_notifications?: boolean; // Send in-app/push notifications
  trigger_automations?: boolean; // Invoke space automations

  /**
   * Lane 4 (Objects) - Type-specific access control
   *
   * Object type IDs use format: {publisherId}.{typeSlug}
   * Example: "jacob.meeting_note", "hive.eboard_proposal"
   *
   * Values:
   * - false/undefined: No access
   * - true: Wildcard access (restricted to verified/system trust tiers)
   * - string[]: Access to specific object types only
   */
  objects_read?: boolean | string[];
  objects_write?: boolean | string[];
  objects_delete?: boolean | string[];
}

/**
 * Pre-defined capability sets for common use cases
 */
export const CAPABILITY_PRESETS = {
  /**
   * Lane 1: Safe Hack (default)
   * UI composition, element connections, state management
   * Zero platform side effects
   */
  SAFE: {
    read_own_state: true as const,
    write_own_state: true as const,
    read_space_context: false,
    read_space_members: false,
    write_shared_state: true, // Allow shared state for polls, RSVPs
    create_posts: false,
    send_notifications: false,
    trigger_automations: false,
    objects_read: false,
    objects_write: false,
    objects_delete: false,
  },

  /**
   * Lane 2: Scoped Hack (leaders + builders)
   * Space-private reads, contextual intelligence
   */
  SCOPED: {
    read_own_state: true as const,
    write_own_state: true as const,
    read_space_context: true,
    read_space_members: true,
    write_shared_state: true,
    create_posts: false,
    send_notifications: false,
    trigger_automations: false,
    objects_read: false,
    objects_write: false,
    objects_delete: false,
  },

  /**
   * Lane 3: Power Hack (explicitly gated)
   * Full platform side effects with budgets
   */
  POWER: {
    read_own_state: true as const,
    write_own_state: true as const,
    read_space_context: true,
    read_space_members: true,
    write_shared_state: true,
    create_posts: true,
    send_notifications: true,
    trigger_automations: true,
    objects_read: true,
    objects_write: true,
    objects_delete: false, // Deletion requires explicit approval
  },
} as const;

/**
 * Determine which lane a tool operates in based on its capabilities
 */
export function getCapabilityLane(
  capabilities: Partial<ToolCapabilities>,
): 'safe' | 'scoped' | 'power' {
  if (
    capabilities.create_posts ||
    capabilities.send_notifications ||
    capabilities.trigger_automations
  ) {
    return 'power';
  }

  if (capabilities.read_space_context || capabilities.read_space_members) {
    return 'scoped';
  }

  return 'safe';
}

// =============================================================================
// Budget Types
// =============================================================================

/**
 * Resource budgets for deployed tools.
 * Prevents abuse of power capabilities.
 */
export interface ToolBudgets {
  /**
   * Maximum notifications per day per deployment
   * Default: 3 for power tools, 0 for others
   */
  notificationsPerDay: number;

  /**
   * Maximum posts generated per day per deployment
   * Default: 10 for power tools, 0 for others
   */
  postsPerDay: number;

  /**
   * Maximum automation triggers per day
   * Default: 50 for power tools, 0 for others
   */
  automationsPerDay: number;

  /**
   * Maximum executions per user per hour
   * Default: 60 for all tools
   */
  executionsPerUserPerHour: number;
}

/**
 * Default budgets by capability lane
 */
export const DEFAULT_BUDGETS: Record<'safe' | 'scoped' | 'power', ToolBudgets> = {
  safe: {
    notificationsPerDay: 0,
    postsPerDay: 0,
    automationsPerDay: 0,
    executionsPerUserPerHour: 60,
  },
  scoped: {
    notificationsPerDay: 0,
    postsPerDay: 0,
    automationsPerDay: 0,
    executionsPerUserPerHour: 60,
  },
  power: {
    notificationsPerDay: 3,
    postsPerDay: 10,
    automationsPerDay: 50,
    executionsPerUserPerHour: 60,
  },
};

/**
 * Get default budgets for a capability set
 */
export function getDefaultBudgets(capabilities: Partial<ToolCapabilities>): ToolBudgets {
  const lane = getCapabilityLane(capabilities);
  return { ...DEFAULT_BUDGETS[lane] };
}

// =============================================================================
// Deployment Governance
// =============================================================================

/**
 * Status for deployed tools with governance controls
 */
export type DeploymentGovernanceStatus =
  | 'active' // Normal operation
  | 'paused' // Temporarily stopped by leader
  | 'disabled' // Kill-switched by leader or admin
  | 'quarantined' // Flagged for review
  | 'experimental'; // Opt-in only, not auto-promoted

/**
 * Tool provenance for trust building
 */
export interface ToolProvenance {
  /** Original creator userId */
  creatorId: string;

  /** If remixed, the parent tool ID */
  remixedFrom?: string;

  /** Number of times this tool has been deployed */
  deploymentCount: number;

  /** Number of unique users who have interacted */
  uniqueUsers: number;

  /** Average rating (1-5) */
  rating?: number;

  /** Last updated timestamp */
  lastUpdatedAt: string;

  /** Whether this is marked as experimental */
  experimental: boolean;
}

/**
 * Budget usage tracking (stored per deployment per day)
 */
export interface BudgetUsage {
  /** Deployment ID */
  deploymentId: string;

  /** Date in YYYY-MM-DD format */
  date: string;

  /** Notifications sent today */
  notificationsSent: number;

  /** Posts created today */
  postsCreated: number;

  /** Automations triggered today */
  automationsTriggered: number;

  /** Per-user execution counts (userId -> count) */
  userExecutions: Record<string, number>;
}

// =============================================================================
// Capability Enforcement Helpers
// =============================================================================

/**
 * Check if a capability is allowed for a deployment
 * For objects_read/write/delete, returns true if the value is truthy (including string arrays)
 */
export function hasCapability(
  capabilities: Partial<ToolCapabilities> | undefined,
  capability: keyof ToolCapabilities,
): boolean {
  if (!capabilities) {
    // Default to SAFE preset
    const value = CAPABILITY_PRESETS.SAFE[capability];
    // Handle string[] (truthy = allowed) or boolean
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }
  const value = capabilities[capability];
  // Handle string[] (truthy = allowed) or boolean
  return Array.isArray(value) ? value.length > 0 : Boolean(value ?? false);
}

/**
 * Validate that requested action is allowed by capabilities
 */
export function validateActionCapabilities(
  capabilities: Partial<ToolCapabilities> | undefined,
  action: {
    includesFeedContent?: boolean;
    includesNotifications?: boolean;
    needsSpaceContext?: boolean;
    needsSpaceMembers?: boolean;
  },
): { allowed: boolean; reason?: string } {
  if (action.includesFeedContent && !hasCapability(capabilities, 'create_posts')) {
    return {
      allowed: false,
      reason: 'Tool does not have create_posts capability',
    };
  }

  if (action.includesNotifications && !hasCapability(capabilities, 'send_notifications')) {
    return {
      allowed: false,
      reason: 'Tool does not have send_notifications capability',
    };
  }

  if (action.needsSpaceContext && !hasCapability(capabilities, 'read_space_context')) {
    return {
      allowed: false,
      reason: 'Tool does not have read_space_context capability',
    };
  }

  if (action.needsSpaceMembers && !hasCapability(capabilities, 'read_space_members')) {
    return {
      allowed: false,
      reason: 'Tool does not have read_space_members capability',
    };
  }

  return { allowed: true };
}

/**
 * Check if an action is within budget
 */
export function checkBudget(
  budgets: ToolBudgets,
  usage: Partial<BudgetUsage>,
  action: {
    sendingNotification?: boolean;
    creatingPost?: boolean;
    triggeringAutomation?: boolean;
    userId?: string;
  },
): { allowed: boolean; reason?: string } {
  if (action.sendingNotification) {
    const sent = usage.notificationsSent ?? 0;
    if (sent >= budgets.notificationsPerDay) {
      return {
        allowed: false,
        reason: `Daily notification limit reached (${budgets.notificationsPerDay}/day)`,
      };
    }
  }

  if (action.creatingPost) {
    const created = usage.postsCreated ?? 0;
    if (created >= budgets.postsPerDay) {
      return {
        allowed: false,
        reason: `Daily post limit reached (${budgets.postsPerDay}/day)`,
      };
    }
  }

  if (action.triggeringAutomation) {
    const triggered = usage.automationsTriggered ?? 0;
    if (triggered >= budgets.automationsPerDay) {
      return {
        allowed: false,
        reason: `Daily automation limit reached (${budgets.automationsPerDay}/day)`,
      };
    }
  }

  if (action.userId) {
    const userExec = usage.userExecutions?.[action.userId] ?? 0;
    if (userExec >= budgets.executionsPerUserPerHour) {
      return {
        allowed: false,
        reason: `Hourly execution limit reached (${budgets.executionsPerUserPerHour}/hour)`,
      };
    }
  }

  return { allowed: true };
}

// =============================================================================
// Exports
// =============================================================================

export type CapabilityLane = 'safe' | 'scoped' | 'power';

/**
 * Trust tier for tools and deployments.
 * Determines what capabilities can be granted.
 */
export type TrustTier = 'unverified' | 'community' | 'verified' | 'system';

/**
 * Full governance config for a deployment
 */
export interface DeploymentGovernance {
  capabilities: ToolCapabilities;
  budgets: ToolBudgets;
  status: DeploymentGovernanceStatus;
  experimental: boolean;
  provenance: ToolProvenance;
}

// =============================================================================
// Object Capability Helpers
// =============================================================================

/**
 * Object type ID validation.
 * Format: {publisherId}.{typeSlug}
 * Slug rules: 3-40 chars, lowercase, underscores only
 */
export const OBJECT_TYPE_ID_PATTERN = /^[a-z0-9_-]+\.[a-z][a-z0-9_]{2,39}$/;

/**
 * Validate an object type ID format
 */
export function isValidObjectTypeId(typeId: string): boolean {
  return OBJECT_TYPE_ID_PATTERN.test(typeId);
}

/**
 * Parse an object type ID into its components
 */
export function parseObjectTypeId(typeId: string): { publisherId: string; slug: string } | null {
  if (!isValidObjectTypeId(typeId)) {
    return null;
  }
  const [publisherId, slug] = typeId.split('.');
  return { publisherId, slug };
}

/**
 * Check if a capability grants access to a specific object type.
 */
export function hasObjectCapability(
  capabilities: Partial<ToolCapabilities> | undefined,
  action: 'read' | 'write' | 'delete',
  objectTypeId: string,
): boolean {
  if (!capabilities) {
    return false;
  }

  const capKey = `objects_${action}` as keyof ToolCapabilities;
  const capValue = capabilities[capKey];

  // No capability granted
  if (capValue === undefined || capValue === false) {
    return false;
  }

  // Wildcard access
  if (capValue === true) {
    return true;
  }

  // Array of allowed types
  if (Array.isArray(capValue)) {
    return capValue.includes(objectTypeId);
  }

  return false;
}

/**
 * Validate capability request against trust tier.
 * Wildcards (true) only allowed for verified/system.
 */
export function validateCapabilityRequest(
  capabilities: Partial<ToolCapabilities>,
  trustTier: TrustTier,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const highTrustTiers: TrustTier[] = ['verified', 'system'];

  // Wildcard object access restricted to verified+
  if (capabilities.objects_read === true && !highTrustTiers.includes(trustTier)) {
    errors.push('Wildcard object read access requires verified trust tier');
  }
  if (capabilities.objects_write === true && !highTrustTiers.includes(trustTier)) {
    errors.push('Wildcard object write access requires verified trust tier');
  }
  if (capabilities.objects_delete === true && !highTrustTiers.includes(trustTier)) {
    errors.push('Wildcard object delete access requires verified trust tier');
  }

  // Validate object type IDs if arrays provided
  const validateTypeIds = (cap: boolean | string[] | undefined, capName: string) => {
    if (Array.isArray(cap)) {
      for (const typeId of cap) {
        if (!isValidObjectTypeId(typeId)) {
          errors.push(`Invalid object type ID in ${capName}: ${typeId}`);
        }
      }
    }
  };

  validateTypeIds(capabilities.objects_read, 'objects_read');
  validateTypeIds(capabilities.objects_write, 'objects_write');
  validateTypeIds(capabilities.objects_delete, 'objects_delete');

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// Surface Mode Types
// =============================================================================

/**
 * Surface modes for tool deployment.
 * Determines where the tool can be rendered.
 */
export interface SurfaceModes {
  /** Renders in sidebar (existing behavior) */
  widget: boolean;
  /** Renders full-screen in /spaces/[spaceId]/apps/[deploymentId] */
  app: boolean;
}

/**
 * Default surface modes for backward compatibility
 */
export const DEFAULT_SURFACE_MODES: SurfaceModes = {
  widget: true,
  app: false,
};

/**
 * App-specific configuration
 */
export interface AppConfig {
  /** Layout mode for app surface */
  layout: 'full' | 'centered' | 'sidebar';
  /** Whether to show the widget mini-view in sidebar when app is open */
  showWidgetWhenActive: boolean;
  /** Custom breadcrumb label (defaults to tool name) */
  breadcrumbLabel?: string;
}

/**
 * Default app configuration
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  layout: 'full',
  showWidgetWhenActive: false,
};

// =============================================================================
// Budget Tracking Functions
// =============================================================================

/**
 * Get the current date key for budget tracking (YYYY-MM-DD)
 */
export function getBudgetDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the current hour key for rate limiting (YYYY-MM-DD-HH)
 */
export function getBudgetHourKey(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hour = now.getUTCHours().toString().padStart(2, '0');
  return `${date}-${hour}`;
}

/**
 * Budget check result with reset time information
 */
export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
  resetAt?: Date;
}

/**
 * Check budget usage from Firestore.
 * This is the async version that reads from the database.
 */
export async function checkBudgetFromDb(
  db: FirestoreDB,
  budgets: ToolBudgets,
  deploymentId: string,
  userId: string,
  action: {
    sendingNotification?: boolean;
    creatingPost?: boolean;
    triggeringAutomation?: boolean;
  }
): Promise<BudgetCheckResult> {
  const dateKey = getBudgetDateKey();
  const hourKey = getBudgetHourKey();

  // Get daily budget usage
  const dailyRef = db.collection('budget_usage').doc(`${deploymentId}_${dateKey}`);
  const dailyDoc = await dailyRef.get();
  const dailyUsage = dailyDoc.exists ? (dailyDoc.data() as Partial<BudgetUsage>) : {};

  // Get hourly user execution count
  const hourlyRef = db.collection('budget_usage_hourly').doc(`${deploymentId}_${userId}_${hourKey}`);
  const hourlyDoc = await hourlyRef.get();
  const hourlyData = hourlyDoc.exists ? (hourlyDoc.data() as { count?: number } | undefined) : undefined;
  const hourlyCount: number = hourlyData?.count ?? 0;

  // Calculate reset times
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  const nextDay = new Date(now);
  nextDay.setHours(0, 0, 0, 0);
  nextDay.setDate(nextDay.getDate() + 1);

  // Check user hourly execution limit
  if (hourlyCount >= budgets.executionsPerUserPerHour) {
    return {
      allowed: false,
      reason: `Hourly execution limit reached (${budgets.executionsPerUserPerHour}/hour)`,
      limit: budgets.executionsPerUserPerHour,
      used: hourlyCount,
      resetAt: nextHour,
    };
  }

  // Check daily notification limit
  if (action.sendingNotification) {
    const sent = dailyUsage.notificationsSent ?? 0;
    if (sent >= budgets.notificationsPerDay) {
      return {
        allowed: false,
        reason: `Daily notification limit reached (${budgets.notificationsPerDay}/day)`,
        limit: budgets.notificationsPerDay,
        used: sent,
        resetAt: nextDay,
      };
    }
  }

  // Check daily post limit
  if (action.creatingPost) {
    const created = dailyUsage.postsCreated ?? 0;
    if (created >= budgets.postsPerDay) {
      return {
        allowed: false,
        reason: `Daily post limit reached (${budgets.postsPerDay}/day)`,
        limit: budgets.postsPerDay,
        used: created,
        resetAt: nextDay,
      };
    }
  }

  // Check daily automation limit
  if (action.triggeringAutomation) {
    const triggered = dailyUsage.automationsTriggered ?? 0;
    if (triggered >= budgets.automationsPerDay) {
      return {
        allowed: false,
        reason: `Daily automation limit reached (${budgets.automationsPerDay}/day)`,
        limit: budgets.automationsPerDay,
        used: triggered,
        resetAt: nextDay,
      };
    }
  }

  return { allowed: true };
}

/**
 * Record budget usage after successful execution.
 * NOTE: This function is server-only and requires FieldValue to be passed in.
 */
export async function recordBudgetUsage(
  db: FirestoreDB,
  deploymentId: string,
  userId: string,
  action: {
    sentNotification?: boolean;
    createdPost?: boolean;
    triggeredAutomation?: boolean;
  },
  // FieldValue must be passed by caller (server-side only)
  FieldValue?: {
    serverTimestamp: () => unknown;
    increment: (n: number) => unknown;
  }
): Promise<void> {
  // Server-only guard
  if (typeof window !== 'undefined' || !FieldValue) {
    return;
  }

  const dateKey = getBudgetDateKey();
  const hourKey = getBudgetHourKey();

  // Update daily budget usage
  const dailyRef = db.collection('budget_usage').doc(`${deploymentId}_${dateKey}`);
  const dailyUpdate: Record<string, unknown> = {
    deploymentId,
    date: dateKey,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (action.sentNotification) {
    dailyUpdate.notificationsSent = FieldValue.increment(1);
  }
  if (action.createdPost) {
    dailyUpdate.postsCreated = FieldValue.increment(1);
  }
  if (action.triggeredAutomation) {
    dailyUpdate.automationsTriggered = FieldValue.increment(1);
  }

  await dailyRef.set(dailyUpdate, { merge: true });

  // Update hourly user execution count
  const hourlyRef = db.collection('budget_usage_hourly').doc(`${deploymentId}_${userId}_${hourKey}`);
  await hourlyRef.set({
    deploymentId,
    userId,
    hourKey,
    count: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// =============================================================================
// Placement Validation
// =============================================================================

/**
 * Result of placement capability validation
 */
export interface PlacementValidationResult {
  canPlace: boolean;
  errors: string[];
  warnings: string[];
  requiredLane: CapabilityLane;
}

/**
 * Space governance configuration for capability lane restrictions
 */
export interface SpaceGovernance {
  allowedLanes?: CapabilityLane[];
  requireApprovalForPower?: boolean;
  [key: string]: unknown;
}

/**
 * Validate that a tool's capabilities are compatible with a space's governance settings.
 * Call this BEFORE creating a placement to catch incompatibility early.
 *
 * @param toolCapabilities - The tool's capability requirements
 * @param spaceGovernance - The space's governance configuration (optional)
 * @returns Validation result with errors, warnings, and required lane
 */
export function validatePlacementCapabilities(
  toolCapabilities: Partial<ToolCapabilities>,
  spaceGovernance: SpaceGovernance | undefined
): PlacementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredLane = getCapabilityLane(toolCapabilities);

  // Default: spaces allow all lanes unless explicitly restricted
  const allowedLanes = spaceGovernance?.allowedLanes || ['safe', 'scoped', 'power'];

  if (!allowedLanes.includes(requiredLane)) {
    errors.push(
      `Tool requires "${requiredLane}" lane but space only allows: ${allowedLanes.join(', ')}`
    );
  }

  // Warn about power capabilities that affect other users
  if (toolCapabilities.create_posts) {
    warnings.push('Tool can create posts on behalf of users');
  }
  if (toolCapabilities.send_notifications) {
    warnings.push('Tool can send notifications to space members');
  }
  if (toolCapabilities.trigger_automations) {
    warnings.push('Tool can trigger automations');
  }

  // Check if space requires approval for power tools
  if (
    requiredLane === 'power' &&
    spaceGovernance?.requireApprovalForPower &&
    errors.length === 0
  ) {
    warnings.push('This tool requires leader approval before it becomes active');
  }

  return {
    canPlace: errors.length === 0,
    errors,
    warnings,
    requiredLane,
  };
}
