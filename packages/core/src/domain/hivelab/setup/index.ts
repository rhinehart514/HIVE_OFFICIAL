/**
 * HiveLab Setup Domain Exports
 *
 * Setups are orchestrated bundles of ToolCompositions that define
 * "how things run" in a space.
 */

// ============================================================================
// SetupTemplate (Blueprints)
// ============================================================================

export {
  // Entity
  SetupTemplate,

  // Types
  type SetupTemplateProps,
  type SetupCategory,
  type SetupSource,
  type SetupToolSlot,
  type SetupConfigField,

  // Orchestration Types
  type OrchestrationRule,
  type OrchestrationTriggerType,
  type OrchestrationTriggerConfig,
  type ToolEventTriggerConfig,
  type TimeRelativeTriggerConfig,
  type DataConditionTriggerConfig,
  type ManualTriggerConfig,
  type OrchestrationActionType,
  type OrchestrationActionConfig,
  type DataFlowActionConfig,
  type VisibilityActionConfig,
  type ConfigActionConfig,
  type NotificationActionConfig,
  type StateActionConfig,

  // DTOs
  type SetupTemplateListDTO,
  type SetupTemplateDetailDTO,
  toSetupTemplateListDTO,
  toSetupTemplateDetailDTO,
} from './setup-template';

// ============================================================================
// SetupDeployment (Instances)
// ============================================================================

export {
  // Entity
  SetupDeployment,

  // Types
  type SetupDeploymentProps,
  type SetupDeploymentStatus,
  type DeployedSetupTool,
  type OrchestrationState,
  type OrchestrationLogEntry,

  // DTOs
  type SetupDeploymentListDTO,
  type SetupDeploymentDetailDTO,
  toSetupDeploymentListDTO,
  toSetupDeploymentDetailDTO,
} from './setup-deployment';

// ============================================================================
// Repository Interfaces (client-safe types only)
// ============================================================================

export type {
  // Interfaces
  ISetupTemplateRepository,
  ISetupDeploymentRepository,

  // Query Options
  SetupTemplateQueryOptions,
  SetupDeploymentQueryOptions,
  PaginatedResult,
} from './setup.repository.types';

// NOTE: Firebase Admin repository implementations are NOT exported here
// to prevent client-side bundling issues. Import from '@hive/core/server'
// for server-side usage of:
//   - FirebaseAdminSetupTemplateRepository
//   - FirebaseAdminSetupDeploymentRepository
//   - getServerSetupTemplateRepository
//   - getServerSetupDeploymentRepository
//   - resetSetupRepositories

// ============================================================================
// Orchestration Executor
// ============================================================================

export {
  // Service
  OrchestrationExecutorService,
  getOrchestrationExecutor,
  resetOrchestrationExecutor,

  // Types
  type ExecutionContext,
  type OrchestrationActionResult,
  type RuleExecutionResult,
  type OrchestrationExecutionResult,
  type ExecutorCallbacks,
} from './orchestration-executor';

// ============================================================================
// System-defined Setup Templates
// ============================================================================

export {
  // Event Series Template
  EVENT_SERIES_TEMPLATE,

  // All system templates
  SYSTEM_SETUP_TEMPLATES,

  // Helper functions
  getSystemSetupTemplate,
  getSystemSetupTemplatesByCategory,
} from './event-series-template';
