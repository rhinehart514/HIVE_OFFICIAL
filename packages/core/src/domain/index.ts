/**
 * HIVE Domain Layer
 * Domain-Driven Design implementation for student autonomy platform
 *
 * This module exports all domain entities, value objects, aggregates,
 * domain services, and domain events.
 */

// =============================================================================
// DDD Base Classes
// =============================================================================
export { Result } from './shared/base/Result';
export { Entity } from './shared/base/Entity.base';
export { DomainEvent } from './shared/base/DomainEvent.base';

// =============================================================================
// Shared Domain (Cross-cutting concerns)
// =============================================================================

// Value Objects
export { ContentVisibility, VisibilityStatus } from './shared/value-objects/content-visibility.value';
export { ViewerContext } from './shared/value-objects/viewer-context.value';
export type { ViewerType } from './shared/value-objects/viewer-context.value';

// Domain Services
export {
  ContentModerationService,
} from './shared/services/content-moderation.service';
export type {
  ModerableContentType,
  ModerationAction,
  ModerationActionResult
} from './shared/services/content-moderation.service';

// =============================================================================
// Identity Domain
// =============================================================================
export * from './identity';

// =============================================================================
// Analytics Domain
// =============================================================================
export * from './analytics';

// =============================================================================
// Campus Domain (Dining, Buildings, Study Spaces)
// =============================================================================
export * from './campus';

// =============================================================================
// Profile Domain
// =============================================================================

// Aggregates
export { EnhancedProfile } from './profile/aggregates/enhanced-profile';
export { Connection, ConnectionType, ConnectionSource } from './profile/aggregates/connection';

// Spec-Compliant Profile
export type { SpecCompliantProfile } from './profile/spec-compliant-profile';
export { isProfileComplete, getProfileCompletionPercentage, createDefaultProfile } from './profile/spec-compliant-profile';

// Services
export {
  GhostModeService,
  DEFAULT_GHOST_MODE,
} from './profile/services/ghost-mode.service';
export type {
  GhostModeSettings,
  GhostModeUser
} from './profile/services/ghost-mode.service';

// =============================================================================
// Spaces Domain
// =============================================================================

// Value Objects
export { SpaceId } from './spaces/value-objects/space-id.value';
export { SpaceName } from './spaces/value-objects/space-name.value';
export { SpaceSlug } from './spaces/value-objects/space-slug.value';
export { SpaceDescription } from './spaces/value-objects/space-description.value';
export { SpaceCategory, SpaceCategoryEnum, CAMPUSLABS_BRANCH_MAP, CATEGORY_LABELS, CATEGORY_ICONS } from './spaces/value-objects/space-category.value';

// Constants
export {
  SPACE_CATEGORIES,
  CAMPUSLABS_BRANCH_TO_CATEGORY,
  SPACE_CATEGORY_META,
  LEGACY_CATEGORY_MAP,
  normalizeCategory,
  getAllCategories,
  isValidCategory,
} from './spaces/constants/space-categories';
export type { SpaceCategoryValue } from './spaces/constants/space-categories';

// Aggregates
export { EnhancedSpace } from './spaces/aggregates/enhanced-space';
export type {
  SpaceMemberRole,
  LeaderRequestStatus,
  LeaderProofType,
  LeaderRequest,
  SetupProgress,
  SpaceType,
  GovernanceModel,
  SpaceStatus,
  SpaceSource
} from './spaces/aggregates/enhanced-space';

// Entities
export { Tab } from './spaces/entities/tab';
export { Widget } from './spaces/entities/widget';
export { Board } from './spaces/entities/board';
export type { BoardType, BoardPermission } from './spaces/entities/board';
export { PlacedTool } from './spaces/entities/placed-tool';
export type { PlacementLocation, PlacementSource, PlacementVisibility } from './spaces/entities/placed-tool';
export { ChatMessage } from './spaces/entities/chat-message';
export type {
  ChatMessageType,
  ChatMessageAuthor,
  ChatMessageReaction,
  InlineComponentData
} from './spaces/entities/chat-message';
export { InlineComponent } from './spaces/entities/inline-component';
export type {
  InlineComponentType,
  PollConfig,
  CountdownConfig,
  RsvpConfig,
  CustomConfig,
  ComponentConfig,
  SharedState,
  ParticipantRecord,
  AggregationDelta,
  ComponentDisplayState,
} from './spaces/entities/inline-component';

// System Tools
export {
  getSystemToolsForType,
  getInlineTools,
  isSystemTool,
  getAllSystemToolIds,
  SYSTEM_TOOLS_BY_TYPE,
  INLINE_TOOLS
} from './spaces/system-tool-registry';
export type { SystemToolDefinition } from './spaces/system-tool-registry';

// Templates
export {
  SPACE_TEMPLATES,
  getAllTemplates as getAllSpaceTemplates,
  getTemplateById as getSpaceTemplateById,
  getTemplatesByCategory as getSpaceTemplatesByCategory,
  getTemplatesSuggestedFor,
  getTemplatesByDifficulty,
  searchTemplates as searchSpaceTemplates,
  type SpaceTemplate,
  type SpaceTemplateMetadata,
  type SpaceTemplateId,
  type SpaceTemplateCategory,
  type TemplateTab,
  type TemplateWidget,
  type TemplateSettings,
} from './spaces/templates';

// Domain Events
export type { SpacePublishStatus } from './spaces/events';
export {
  SpaceCreatedEvent,
  SpaceMemberJoinedEvent,
  SpaceMemberLeftEvent,
  SpaceUpdatedEvent,
  SpaceStatusChangedEvent,
  SpaceWentLiveEvent,
  TabCreatedEvent,
  TabUpdatedEvent,
  TabRemovedEvent,
  TabsReorderedEvent,
  WidgetCreatedEvent,
  WidgetUpdatedEvent,
  WidgetRemovedEvent,
  WidgetAttachedToTabEvent,
  WidgetDetachedFromTabEvent,
  ToolPlacedEvent,
  PlacedToolUpdatedEvent,
  ToolRemovedEvent,
  PlacedToolActivatedEvent,
  PlacedToolDeactivatedEvent,
  PlacedToolsReorderedEvent,
  BoardCreatedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
  BoardDeletedEvent,
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessagePinnedEvent,
  ReactionAddedEvent,
} from './spaces/events';

// =============================================================================
// Feed Domain
// =============================================================================

// Entities & Aggregates
export { FeedItem } from './feed/feed-item';
export { EnhancedFeed } from './feed/enhanced-feed';

// Services
export { FeedRankingService, DEFAULT_RANKING_CONFIG } from './feed/services/feed-ranking.service';
export type {
  RelevanceFactors,
  RankingWeights,
  FeedRankingConfig,
  UserRankingContext,
  RankingCandidate,
  RankedItem
} from './feed/services/feed-ranking.service';

// =============================================================================
// Rituals Domain
// =============================================================================

// Value Objects
export { RitualId } from './rituals/value-objects/ritual-id.value';

// Aggregates
export { EnhancedRitual } from './rituals/aggregates/enhanced-ritual';

// Archetypes & Types
export {
  RitualArchetype,
  type RitualPhase,
  type RitualPresentation,
  type RitualMetricsSnapshot,
  type BaseRitual,
  type FoundingClassRitual,
  type LaunchCountdownRitual,
  type BetaLotteryRitual,
  type UnlockChallengeRitual,
  type SurvivalRitual,
  type LeakRitual,
  type TournamentRitual,
  type FeatureDropRitual,
  type RuleInversionRitual,
  type RitualUnion,
  type FoundingClassConfig,
  type LaunchCountdownConfig,
  type BetaLotteryConfig,
  type UnlockChallengeConfig,
  type SurvivalConfig,
  type LeakConfig,
  type TournamentConfig,
  type TournamentMatchup,
  type FeatureDropConfig,
  type FeatureDropAnalyticsMetric,
  type FeatureDropSurveyQuestion,
  type RuleInversionConfig,
  type RuleInversionGuardrail,
  RitualSchema,
  RitualUnionSchema,
  parseRitualUnion,
} from './rituals/archetypes';

// Events
export * from './rituals/events';

// Composer
export {
  RitualComposerSchema,
  createDefaultConfig,
  type RitualComposerInput,
} from './rituals/composer';

// Templates
export {
  RITUAL_TEMPLATES,
  getAvailableTemplates,
  getTemplate,
  getTemplatesByCategory,
  getTemplatesByArchetype,
  type RitualTemplate,
  type RitualTemplateMetadata,
  type RitualTemplateId,
} from './rituals/templates';

// =============================================================================
// HiveLab Domain
// =============================================================================

// Tool Composition Types
export type {
  ToolComposition,
  CanvasElement,
  ElementConnection,
  ElementDefinition,
  ElementCategory,
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
} from './hivelab/tool-composition.types';

// Sprint 2: Tool Runtime Context Types
export type {
  SpaceContext,
  MemberContext,
  MemberRole as ToolMemberRole,
  TemporalContext,
  CapabilityContext,
  ToolRuntimeContext,
  VisibilityCondition,
  ConditionGroup,
  ConditionOperator,
  ContextRequirements,
  ContextFieldPath,
} from './hivelab/tool-context.types';
export {
  evaluateCondition,
  evaluateConditionGroup,
  createTemporalContext,
  createDefaultCapabilities,
} from './hivelab/tool-context.types';

// Capabilities & Governance
export {
  CAPABILITY_PRESETS,
  DEFAULT_BUDGETS,
  getCapabilityLane,
  getDefaultBudgets,
  hasCapability,
  validateActionCapabilities,
  checkBudget,
  OBJECT_TYPE_ID_PATTERN,
  isValidObjectTypeId,
  parseObjectTypeId,
  hasObjectCapability,
  validateCapabilityRequest,
  DEFAULT_SURFACE_MODES,
  DEFAULT_APP_CONFIG,
} from './hivelab/capabilities';
export type {
  ToolCapabilities,
  ToolBudgets,
  DeploymentGovernanceStatus,
  ToolProvenance,
  BudgetUsage,
  CapabilityLane,
  DeploymentGovernance,
  TrustTier,
  SurfaceModes,
  AppConfig,
} from './hivelab/capabilities';

// Automation Entity
export {
  Automation,
  type AutomationProps,
  type AutomationDTO,
  type AutomationTrigger,
  type AutomationAction,
  type AutomationStats,
  type AutomationContext,
  type AutomationResult,
  type MemberJoinTrigger,
  type EventReminderTrigger,
  type ScheduleTrigger,
  type KeywordTrigger,
  type ReactionThresholdTrigger,
  type SendMessageAction,
  type CreateComponentAction,
  type AssignRoleAction,
  type NotifyAction,
} from './hivelab/entities';

// Automation Templates
export {
  AUTOMATION_TEMPLATES,
  getAllTemplates as getAllAutomationTemplates,
  getTemplatesByCategory as getAutomationTemplatesByCategory,
  getTemplateById as getAutomationTemplateById,
  createFromTemplate,
  getTemplateCategories as getAutomationTemplateCategories,
  type AutomationTemplate,
} from './hivelab/automation-templates';

// Element Registry
export {
  registerElement,
  getElementById,
  getAllElements,
  getElementsByCategory,
  getElementsByAction,
  elementSupportsAction,
  getElementDefaultConfig,
  getStatefulElements,
  getRealtimeElements,
  searchElements,
  generateElementCatalog,
  INPUT_ELEMENTS,
  FILTER_ELEMENTS,
  DISPLAY_ELEMENTS,
  ACTION_ELEMENTS,
  LAYOUT_ELEMENTS,
  ELEMENT_COUNT,
  ELEMENT_IDS,
  CATEGORY_COUNTS,
  TIER_COUNTS,
  CONNECTED_ELEMENTS,
  SPACE_ELEMENTS,
  ADDITIONAL_UNIVERSAL_ELEMENTS,
} from './hivelab/element-registry';
export type { ElementSpec } from './hivelab/element-registry';

// Validation
export {
  type ValidationResult,
  type QualityScore,
  type ValidationError,
  type ValidationWarning,
  type ValidationErrorCode,
  type ValidationWarningCode,
  type AIGenerationRecord,
  type GenerationOutcome,
  type GenerationEditRecord,
  type ElementEdit,
  type GenerationFailureRecord,
  type FailureType,
  type AggregatedMetrics,
  type AutomatedInsight,
  type InsightType,
  type ValidationMetadata,
  ELEMENT_CONFIG_SCHEMAS,
  getElementConfigSchema,
  getRequiredFields,
  isFieldRequired,
  validateElementConfig as validateHiveLabElementConfig,
  ToolCompositionSchema,
  CanvasElementBaseSchema,
  ElementConnectionSchema,
  PositionSchema,
  SizeSchema,
  CompositionValidatorService,
  validateComposition,
  getCompositionValidator,
  QualityGateService,
  gateComposition,
  getQualityGateService,
  DEFAULT_GATE_THRESHOLDS,
  type GateResult,
  type GateDecision,
  type GateThresholds,
  type AutoFix,
  type AutoFixType,
  GenerationTrackerService,
  getGenerationTrackerService,
  initializeGenerationTracker,
  type GenerationInput,
  type GenerationOutput,
  type GenerationTrackingData,
  type GenerationMetrics,
  FailureClassifierService,
  getFailureClassifierService,
  initializeFailureClassifier,
  classifyFailureType,
  type FailureInput,
  type FailureStats,
  EditTrackerService,
  getEditTrackerService,
  initializeEditTracker,
  type EditTrackingInput,
  type EditPatterns,
  AIQualityPipeline,
  getAIQualityPipeline,
  processComposition,
  validateOnly,
  initializeAIQualityPipeline,
  CURRENT_PROMPT_VERSION,
  type PipelineContext,
  type PipelineResult,
} from './hivelab/validation';

// System Tool Templates
export {
  SYSTEM_TOOL_TEMPLATES,
  UNIVERSAL_DEFAULT_TEMPLATE,
  ACADEMIC_TEMPLATE,
  SOCIAL_TEMPLATE,
  PROFESSIONAL_TEMPLATE,
  INTEREST_TEMPLATE,
  ALL_TEMPLATES as ALL_SYSTEM_TEMPLATES,
  getSystemTool,
  getSystemToolsByCategory,
  getTemplateForCategory as getSystemTemplateForCategory,
  isSystemTool as isSystemToolTemplate,
  getEssentialTools,
  getEngagementTools,
  type SystemToolTemplate,
  type UniversalTemplate,
} from './hivelab/system-tool-templates';

// Setup System
export {
  SetupTemplate,
  type SetupTemplateProps,
  type SetupCategory,
  type SetupSource,
  type SetupToolSlot,
  type SetupConfigField,
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
  type SetupTemplateListDTO,
  type SetupTemplateDetailDTO,
  toSetupTemplateListDTO,
  toSetupTemplateDetailDTO,
  SetupDeployment,
  type SetupDeploymentProps,
  type SetupDeploymentStatus,
  type DeployedSetupTool,
  type OrchestrationState,
  type OrchestrationLogEntry,
  type SetupDeploymentListDTO,
  type SetupDeploymentDetailDTO,
  toSetupDeploymentListDTO,
  toSetupDeploymentDetailDTO,
  type ISetupTemplateRepository,
  type ISetupDeploymentRepository,
  type SetupTemplateQueryOptions,
  type SetupDeploymentQueryOptions,
  type PaginatedResult,
  EVENT_SERIES_TEMPLATE,
  SYSTEM_SETUP_TEMPLATES,
  getSystemSetupTemplate,
  getSystemSetupTemplatesByCategory,
  OrchestrationExecutorService,
  getOrchestrationExecutor,
  resetOrchestrationExecutor,
  type ExecutionContext,
  type OrchestrationActionResult,
  type RuleExecutionResult,
  type OrchestrationExecutionResult,
  type ExecutorCallbacks,
} from './hivelab/setup';

// Sprint 3: Tool-to-Tool Connections
export type {
  ToolConnection,
  ToolConnectionSource,
  ToolConnectionTarget,
  DataTransform,
  ToolOutput,
  ToolOutputManifest,
  ResolvedConnection,
  ResolvedConnections,
  ConnectionValidationResult,
  ConnectionValidationError,
  ConnectionValidationWarning,
  ConnectionStatus,
  CreateConnectionDTO,
  UpdateConnectionDTO,
} from './hivelab/tool-connection.types';
export {
  DATA_TRANSFORMS,
  MAX_CONNECTIONS_PER_TOOL,
  CONNECTION_CACHE_TTL_MS,
  CONNECTIONS_COLLECTION,
  getConnectionCacheKey,
  parseConnectionCacheKey,
  isTransformCompatible,
  applyTransform,
  getValueAtPath,
  setValueAtPath,
} from './hivelab/tool-connection.types';

// Sprint 4: Tool Automations
export type {
  ToolAutomation,
  ToolAutomationTrigger,
  ToolAutomationAction,
  ToolAutomationCondition,
  ToolAutomationLimits,
  ToolAutomationRun,
  ToolAutomationRunStatus,
  NotifyEmailAction,
  NotifyPushAction,
  MutateAction,
  TriggerToolAction,
  ToolEventTrigger,
  ToolScheduleTrigger,
  ToolThresholdTrigger,
  ConditionOperator as AutomationConditionOperator,
  CreateToolAutomationDTO,
  UpdateToolAutomationDTO,
} from './hivelab/tool-automation.types';
export {
  evaluateCondition as evaluateAutomationCondition,
  evaluateAllConditions,
  canRunAutomation,
  isValidCron,
  getNextRunTime,
  DEFAULT_AUTOMATION_LIMITS,
  MAX_AUTOMATIONS_PER_TOOL,
  MAX_ACTIONS_PER_AUTOMATION,
  MAX_CONDITIONS_PER_AUTOMATION,
  MAX_AUTOMATION_RUNS_HISTORY,
  AUTOMATIONS_COLLECTION,
  AUTOMATION_RUNS_COLLECTION,
} from './hivelab/tool-automation.types';

// Sprint 5: Theme Inheritance
export type {
  ToolThemeSource,
  HSLColor,
  ToolThemePalette,
  ToolThemeConfig,
  ResolvedToolTheme,
  SpaceBrand,
} from './hivelab/tool-theme.types';
export {
  HIVE_DEFAULT_PALETTE,
  MINIMAL_PALETTE,
  hexToHSL,
  hslToHex,
  getLuminance,
  getContrastColor,
  generatePalette,
  resolveToolTheme,
  DEFAULT_TOOL_THEME,
} from './hivelab/tool-theme.types';

// Sprint 5: Structured Error Types
export type {
  ToolErrorCode,
  ToolError,
  ErrorRecoveryAction,
} from './hivelab/tool-error.types';
export {
  ERROR_MESSAGES,
  createToolError,
  isRecoverableError,
  getRecoveryActions,
  parseError,
  isToolError,
} from './hivelab/tool-error.types';

// Sprint 5: Audit Trail
export type {
  AuditEventType,
  AuditActor,
  AuditChanges,
  AuditEntry,
  AuditLogQuery,
  AuditLogResponse,
  AuditSummary,
} from './hivelab/tool-audit.types';
export {
  AUDIT_COLLECTION,
  MAX_AUDIT_ENTRIES,
  AUDIT_RETENTION_DAYS,
  generateAuditId,
  createAuditEntry,
  createSystemActor,
  createUserActor,
  getEventDescription,
} from './hivelab/tool-audit.types';

// =============================================================================
// Webhooks Domain
// =============================================================================
export * from './webhooks';

// =============================================================================
// Creation Domain (Tool Validation)
// =============================================================================
export * from './creation/validate-tool-elements';
