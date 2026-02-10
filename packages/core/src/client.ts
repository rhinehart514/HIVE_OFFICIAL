/**
 * @hive/core/client - Lightweight client entrypoint
 *
 * Use this instead of '@hive/core' in client-side code (hooks, components)
 * to avoid pulling in Firebase SDK, admin SDK, stores, element registry,
 * and other server-heavy modules.
 *
 * Contains only pure types and utility functions needed for tool rendering
 * and state management on the client.
 */

// ============================================================================
// Tool Composition Types (Phase 1: SharedState Architecture)
// ============================================================================

export type {
  ToolComposition,
  CanvasElement,
  ElementConnection,
  ElementDefinition,
  ElementCategory,
  ElementDataSource,
  ToolSharedState,
  ToolSharedStateUpdate,
  ToolUserState,
  ToolUserStateUpdate,
  ToolSharedEntity,
  ToolTimelineEvent,
  ToolActionCategory,
  ToolActionResult,
  ToolEffect,
  CombinedToolState,
  ToolContext,
  ShardedCounterConfig,
  ElementCounterConfig,
  ToolCounterConfig,
  CounterMigrationStatus,
  ToolLifecycleStage,
  ToolLifecycle,
} from "./domain/hivelab/tool-composition.types";

// ============================================================================
// Tool Connection Types & Utilities
// ============================================================================

export type {
  DataTransform,
  ConnectionDataType,
  ToolOutput,
  ToolConnection,
  ConnectionStatus,
} from "./domain/hivelab/tool-connection.types";

export {
  applyTransform,
  getValueAtPath,
  setValueAtPath,
  isTransformCompatible,
} from "./domain/hivelab/tool-connection.types";

// ============================================================================
// Tool Theme Types
// ============================================================================

export type {
  ToolThemeSource,
  ToolThemePalette,
  ToolThemeConfig,
  ResolvedToolTheme,
  SpaceBrand,
} from "./domain/hivelab/tool-theme.types";

// ============================================================================
// Tool Error Types & Utilities
// ============================================================================

export type {
  ToolErrorCode,
  ToolError,
  ErrorRecoveryAction,
} from "./domain/hivelab/tool-error.types";

export {
  isToolError,
  isRecoverableError,
  getRecoveryActions,
  parseError,
  createToolError,
} from "./domain/hivelab/tool-error.types";

// ============================================================================
// Tool Context Types & Condition Evaluation
// ============================================================================

export type {
  SpaceContext,
  MemberContext,
  MemberRole,
  TemporalContext,
  CapabilityContext,
  ToolRuntimeContext,
  VisibilityCondition,
  ConditionGroup,
  ConditionOperator,
  ContextRequirements,
} from "./domain/hivelab/tool-context.types";

export {
  evaluateCondition,
  evaluateConditionGroup,
  createTemporalContext,
  createDefaultCapabilities,
} from "./domain/hivelab/tool-context.types";
