/**
 * HiveLab Element Spec — Progressive Connection Depth
 *
 * Replaces the old tier-based manifest. Instead of T1/T2/T3, each element
 * declares a minimum connection depth and progressive levels that unlock
 * features as more context becomes available.
 *
 * An RSVP button works standalone, works better in a space, works best
 * linked to an event. That's one element at three depths, not three tiers.
 */

// ── Context Keys ────────────────────────────────────────────────

/** Keys available from the deployment environment */
export type ContextKey =
  | 'spaceId'
  | 'eventId'
  | 'campusId'
  | 'userId'
  | 'eventName'
  | 'closeAt';

// ── Connection Levels ───────────────────────────────────────────

/** Progressive depth — each level includes all prior levels */
export type ConnectionLevel = 'standalone' | 'space' | 'campus' | 'event+space';

/** Numeric rank for comparison — higher = deeper context required */
export const CONNECTION_LEVEL_RANK: Record<ConnectionLevel, number> = {
  standalone: 0,
  space: 1,
  campus: 2,
  'event+space': 3,
};

// ── Connection Spec ─────────────────────────────────────────────

export interface ConnectionSpec {
  /** Minimum depth this element needs to function */
  minDepth: ConnectionLevel;
  /** Progressive levels — what unlocks at each depth */
  levels: ConnectionLevelSpec[];
}

export interface ConnectionLevelSpec {
  depth: ConnectionLevel;
  /** What this depth provides */
  provides: string;
  /** Context keys required at this depth */
  requiredContext: ContextKey[];
}

// ── Permission Spec ─────────────────────────────────────────────

export interface PermissionSpec {
  /** Who can create this element */
  create: 'anyone' | 'space-member' | 'space-leader';
  /** Who can interact (execute actions) */
  interact: 'anyone' | 'authenticated' | 'space-member';
}

// ── State Spec ──────────────────────────────────────────────────

export interface StateSpec {
  shared: string[];
  personal: string[];
}

// ── Config Field ────────────────────────────────────────────────

export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'string[]' | 'object[]' | 'string[]|string';

export interface ConfigField {
  type: ConfigFieldType;
  description: string;
  default?: unknown;
  /** Whether this field must be provided (replaces requiredConfig/optionalConfig split) */
  required: boolean;
  /** If set, this field can be auto-resolved from deployment context */
  resolvedFrom?: ContextKey;
}

// ── Element Category ────────────────────────────────────────────

export type ElementCategory = 'action' | 'display' | 'input' | 'filter' | 'layout';

// ── Data Source ─────────────────────────────────────────────────

export type DataSource =
  | 'none'
  | 'campus-events'
  | 'campus-spaces'
  | 'campus-users'
  | 'user-connections'
  | 'space-members'
  | 'space-events'
  | 'space-feed'
  | 'space-stats';

// ── Element Spec ────────────────────────────────────────────────

export interface ElementSpec {
  elementId: string;
  name: string;
  category: ElementCategory;
  dataSource: DataSource;
  config: Record<string, ConfigField>;
  connection: ConnectionSpec;
  permissions: PermissionSpec;
  executeActions: string[];
  state: StateSpec;
  aliases?: string[];
}
