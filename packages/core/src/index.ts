/**
 * @hive/core - Main export file
 * Domain-Driven Design architecture with proper bounded contexts
 */

// DDD Base Classes
export { Result } from "./domain/shared/base/Result";
export { Entity } from "./domain/shared/base/Entity.base";
export { DomainEvent } from "./domain/shared/base/DomainEvent.base";

// Shared Value Objects (Moderation & Privacy)
export { ContentVisibility, VisibilityStatus } from "./domain/shared/value-objects/content-visibility.value";
export { ViewerContext } from "./domain/shared/value-objects/viewer-context.value";
export type { ViewerType } from "./domain/shared/value-objects/viewer-context.value";

// Shared Domain Services
export {
  ContentModerationService,
} from "./domain/shared/services/content-moderation.service";
export type {
  ModerableContentType,
  ModerationAction,
  ModerationActionResult
} from "./domain/shared/services/content-moderation.service";

// Ghost Mode Service (Privacy)
export {
  GhostModeService,
  DEFAULT_GHOST_MODE,
} from "./domain/profile/services/ghost-mode.service";
export type {
  GhostModeSettings,
  GhostModeUser
} from "./domain/profile/services/ghost-mode.service";

// Domain Models - Specific exports to avoid conflicts
export { EnhancedProfile } from "./domain/profile/aggregates/enhanced-profile";
export type { SpecCompliantProfile } from "./domain/profile/spec-compliant-profile";
export { isProfileComplete, getProfileCompletionPercentage, createDefaultProfile } from "./domain/profile/spec-compliant-profile";
export { Connection, ConnectionType, ConnectionSource } from "./domain/profile/aggregates/connection";
// Profile Completion Config (Single Source of Truth)
export type { UserData as ProfileUserData } from "./domain/profile/completion-config";
export {
  COMPLETION_REQUIREMENTS,
  isEntryComplete,
  isProfileComplete as isProfileCompletionComplete,
  getCompletionPercentage,
  getMissingFields,
  getNextSteps,
} from "./domain/profile/completion-config";
export { SpaceId } from "./domain/spaces/value-objects/space-id.value";
export { SpaceName } from "./domain/spaces/value-objects/space-name.value";
export { SpaceSlug } from "./domain/spaces/value-objects/space-slug.value";
export { SpaceDescription } from "./domain/spaces/value-objects/space-description.value";
export { SpaceCategory, SpaceCategoryEnum, CAMPUSLABS_BRANCH_MAP, CATEGORY_LABELS, CATEGORY_ICONS } from "./domain/spaces/value-objects/space-category.value";
// Space category constants (single source of truth)
export {
  SPACE_CATEGORIES,
  CAMPUSLABS_BRANCH_TO_CATEGORY,
  SPACE_CATEGORY_META,
  LEGACY_CATEGORY_MAP,
  normalizeCategory,
  getAllCategories,
  isValidCategory,
} from "./domain/spaces/constants/space-categories";
export type { SpaceCategoryValue } from "./domain/spaces/constants/space-categories";
export { EnhancedSpace } from "./domain/spaces/aggregates/enhanced-space";
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
} from "./domain/spaces/aggregates/enhanced-space";
// Space publishing status (stealth mode)
export type { SpacePublishStatus } from "./domain/spaces/events";
export { SpaceStatusChangedEvent, SpaceWentLiveEvent } from "./domain/spaces/events";
export { Tab } from "./domain/spaces/entities/tab";
export { Widget } from "./domain/spaces/entities/widget";
export { Board } from "./domain/spaces/entities/board";
export type { BoardType, BoardPermission } from "./domain/spaces/entities/board";
export { PlacedTool } from "./domain/spaces/entities/placed-tool";
export type { PlacementLocation, PlacementSource, PlacementVisibility } from "./domain/spaces/entities/placed-tool";
export {
  getSystemToolsForType,
  getInlineTools,
  isSystemTool,
  getAllSystemToolIds,
  SYSTEM_TOOLS_BY_TYPE,
  INLINE_TOOLS
} from "./domain/spaces/system-tool-registry";
export type { SystemToolDefinition } from "./domain/spaces/system-tool-registry";
export {
  SpaceCreatedEvent,
  SpaceMemberJoinedEvent,
  SpaceMemberLeftEvent,
  SpaceUpdatedEvent,
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
  // Board Events
  BoardCreatedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
  BoardDeletedEvent,
  // ChatMessage Events
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessagePinnedEvent,
  ReactionAddedEvent,
} from "./domain/spaces/events";
export { ChatMessage } from "./domain/spaces/entities/chat-message";
export type {
  ChatMessageType,
  ChatMessageAuthor,
  ChatMessageReaction,
  InlineComponentData
} from "./domain/spaces/entities/chat-message";

// Inline Components (for chat-first component creation)
export { InlineComponent } from "./domain/spaces/entities/inline-component";
export type {
  InlineComponentType,
  PollConfig,
  CountdownConfig,
  RsvpConfig,
  SignupConfig,
  EventConfig,
  CustomConfig,
  ComponentConfig,
  SharedState,
  ParticipantRecord,
  AggregationDelta,
  ComponentDisplayState,
} from "./domain/spaces/entities/inline-component";
export { RitualId } from "./domain/rituals/value-objects/ritual-id.value";
export { EnhancedRitual } from "./domain/rituals/aggregates/enhanced-ritual";
export { FeedItem } from "./domain/feed/feed-item";
export { EnhancedFeed } from "./domain/feed/enhanced-feed";
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
} from "./domain/rituals/archetypes";

export * from "./domain/rituals/events";
export {
  RitualComposerSchema,
  createDefaultConfig,
  type RitualComposerInput,
} from "./domain/rituals/composer";

// Ritual Templates
export {
  RITUAL_TEMPLATES,
  getAvailableTemplates,
  getTemplate,
  getTemplatesByCategory,
  getTemplatesByArchetype,
  type RitualTemplate,
  type RitualTemplateMetadata,
  type RitualTemplateId,
} from "./domain/rituals/templates";

// Space Templates
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
} from "./domain/spaces/templates";

// System Tool Templates — REMOVED (deleted)

// HiveLab Domain Types
export type {
  ToolComposition,
  CanvasElement,
  ElementConnection,
  ElementDefinition,
  ElementCategory,
  ElementDataSource,
  // Tool State Types (Phase 1 State Architecture)
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
  // Sharded Counter Types (Phase 1 Scaling Architecture)
  ShardedCounterConfig,
  ElementCounterConfig,
  ToolCounterConfig,
  CounterMigrationStatus,
  // Tool Lifecycle Types (Phase 1: Living Mechanics)
  ToolLifecycleStage,
  ToolLifecycle,
} from "./domain/hivelab/tool-composition.types";

// Custom Block Types (Phase 5: iframe sandbox system)
export type {
  CustomBlockConfig,
  CustomBlockCode,
  CustomBlockManifest,
  CustomBlockMetadata,
  CustomBlockPort,
  CustomBlockAction,
  CustomBlockCSP,
  BlockState,
  BlockContext,
  ActionResult,
  HIVESDK,
  ParentMessage,
  IframeMessage,
  PostMessageEnvelope,
  CodeValidationResult,
  CodeValidationError,
  CodeValidationWarning,
  CustomBlockVersion,
  CustomBlockWithVersions,
} from "./domain/hivelab/custom-block.types";

// Sprint 3: Tool-to-Tool Connection Types
export type {
  DataTransform,
  TransformMetadata,
  ConnectionDataType,
  ToolOutput,
  ToolOutputManifest,
  ToolConnectionSource,
  ToolConnectionTarget,
  ToolConnection,
  CreateConnectionDTO,
  UpdateConnectionDTO,
  ConnectionStatus,
  ResolvedConnection,
  ResolvedConnections,
  ConnectionValidationResult,
  ConnectionValidationError,
  ConnectionValidationWarning,
  ConnectionErrorCode,
  ConnectionWarningCode,
} from "./domain/hivelab/tool-connection.types";
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
} from "./domain/hivelab/tool-connection.types";

// Sprint 4: Tool Automation Types — REMOVED (deleted)

// Sprint 2: Tool Runtime Context Types
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
  ContextFieldPath,
  SpaceExecutionContext,
  ProfileExecutionContext,
  DeploymentExecutionContext,
} from "./domain/hivelab/tool-context.types";
export {
  evaluateCondition,
  evaluateConditionGroup,
  createTemporalContext,
  createDefaultCapabilities,
} from "./domain/hivelab/tool-context.types";

// Sprint 2: Context Interpolation Engine
export type {
  InterpolationOptions,
  InterpolationResult,
} from "./domain/hivelab/context-interpolation";
export {
  interpolateConfig,
  interpolateConfigWithMeta,
  interpolateString,
  hasInterpolation,
  extractPaths,
  extractAllPaths,
} from "./domain/hivelab/context-interpolation";

// HiveLab Capabilities & Governance (Hackability Layer)
export {
  CAPABILITY_PRESETS,
  DEFAULT_BUDGETS,
  getCapabilityLane,
  getDefaultBudgets,
  hasCapability,
  validateActionCapabilities,
  checkBudget,
  // Budget tracking (async database operations)
  checkBudgetFromDb,
  recordBudgetUsage,
  getBudgetDateKey,
  getBudgetHourKey,
  // P0: Object Capabilities
  OBJECT_TYPE_ID_PATTERN,
  isValidObjectTypeId,
  parseObjectTypeId,
  hasObjectCapability,
  validateCapabilityRequest,
  // P0: Surface Modes
  DEFAULT_SURFACE_MODES,
  DEFAULT_APP_CONFIG,
  // Placement validation
  validatePlacementCapabilities,
} from "./domain/hivelab/capabilities";
export type {
  ToolCapabilities,
  ToolBudgets,
  DeploymentGovernanceStatus,
  ToolProvenance,
  BudgetUsage,
  CapabilityLane,
  DeploymentGovernance,
  BudgetCheckResult,
  // P0: New Types
  TrustTier,
  SurfaceModes,
  AppConfig,
  // Placement validation types
  PlacementValidationResult,
  SpaceGovernance,
} from "./domain/hivelab/capabilities";

// HiveLab Element-to-Capability Mapping (Deploy & Execute Time Enforcement)
export {
  ELEMENT_CAPABILITY_REQUIREMENTS,
  ACTION_CAPABILITY_REQUIREMENTS,
  TRUST_TIER_CAPABILITY_LIMITS,
  getElementRequiredCapabilities,
  getActionRequiredCapabilities,
  deploymentHasElementCapabilities,
  deploymentHasActionCapabilities,
  getToolRequiredCapabilities,
  trustTierAllowsCapability,
  validateToolTrustTier,
} from "./domain/hivelab/element-capabilities";

// HiveLab Automation Entity (Phase 3)
export {
  Automation,
  type AutomationProps,
  type AutomationDTO,
  type AutomationTrigger,
  type AutomationAction,
  type AutomationStats,
  type AutomationContext,
  type AutomationResult,
  // Trigger types
  type MemberJoinTrigger,
  type EventReminderTrigger,
  type ScheduleTrigger,
  type KeywordTrigger,
  type ReactionThresholdTrigger,
  // Action types
  type SendMessageAction,
  type CreateComponentAction,
  type AssignRoleAction,
  type NotifyAction,
} from "./domain/hivelab/entities";

// HiveLab Automation Templates — REMOVED (deleted)

// HiveLab Element Registry
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
} from "./domain/hivelab/element-registry";
export type { ElementSpec } from "./domain/hivelab/element-registry";

// HiveLab Element Ports — REMOVED (deleted)

// HiveLab AI Quality Validation
// Note: Explicit exports to avoid conflicts with element-schemas validateElementConfig
export {
  // Types
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
  // Schemas (validateElementConfig exported as validateHiveLabElementConfig to avoid conflict)
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
  // Tool Composition Validation (creation-time checks)
  validateToolComposition,
  validateElement as validateHiveLabElement,
  validateConnection as validateHiveLabConnection,
  validateCustomBlockCode,
  type CanvasElementForValidation,
  type ConnectionForValidation,
  type CompositionValidationResult,
  type CompositionError,
  type CompositionWarning,
  type CompositionErrorCode,
  type CompositionWarningCode,
} from "./domain/hivelab/validation";

// HiveLab Services — REMOVED (application/hivelab/ deleted)

// HiveLab AI Learning System (removed)

// HiveLab AI Benchmarking System (removed)

// HiveLab Setup System (removed)

// Sprint 5: Tool Theme Inheritance
export type {
  ToolThemeSource,
  HSLColor,
  ToolThemePalette,
  ToolThemeConfig,
  ResolvedToolTheme,
  SpaceBrand,
} from "./domain/hivelab/tool-theme.types";
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
} from "./domain/hivelab/tool-theme.types";

// Sprint 5: Structured Error Types
export type {
  ToolErrorCode,
  ToolError,
  ErrorRecoveryAction,
} from "./domain/hivelab/tool-error.types";
export {
  ERROR_MESSAGES,
  createToolError,
  isRecoverableError,
  getRecoveryActions,
  parseError,
  isToolError,
} from "./domain/hivelab/tool-error.types";

// Sprint 5: Audit Trail — REMOVED (deleted)

// Application Services - Use Case Orchestration
export * from "./application";

// Repository Pattern - Data Access Layer
export * from "./infrastructure/repositories/interfaces";
export * from "./infrastructure/repositories/factory";
export { FirebaseUnitOfWork } from "./infrastructure/repositories/firebase/unit-of-work";

// DTOs and Mappers
export * from "./application/identity/dtos/profile.dto";
export * from "./infrastructure/mappers/profile.firebase-mapper";

// Services
export { presenceService } from "./services/presence-service";
export type { PresenceData, PresenceStatus } from "./services/presence-service";

// Constants
export * from "./constants/majors";
export * from "./constants/onboarding-interests";
export * from "./constants/http-status";
export * from "./constants/timing";

// Campus Domain (Dining, Buildings, Study Spaces)
export * from "./domain/campus";

// Stores
export * from "./stores/useAppStore";

// Feature Flags
export * from "./feature-flags";

// Firebase Configuration - re-exported from @hive/firebase
export { app, db, auth, storage, validateCampusAccess, checkRateLimit } from "@hive/firebase";
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics } from "@hive/firebase";

// NOTE: Firebase Admin SDK exports are NOT included here to prevent client-side bundling issues
// Server-side code should import from '@hive/core/server' or directly from the firebase-admin module

// Server-side utilities - MOVED TO @hive/core/server
// Import from '@hive/core/server' for server-side usage
// export * from "./server";

// Types and Interfaces - Specific exports to avoid conflicts
export type { ProfileSystem, HiveProfile, UnifiedHiveProfile, GridSize, BentoGridLayout, Friend, WidgetType, WidgetSize, WidgetConfig, BentoCard } from "./types/profile-system";
// Re-export with aliases to avoid conflicts with domain aggregates
export type { Connection as ProfileSystemConnection, Badge as ProfileBadge } from "./types/profile-system";
export { ConnectionType as ProfileSystemConnectionType } from "./types/profile-system";

// Loading state types
export {
  type HiveQueryState,
  type HiveMutationState,
  type HiveQueryConfig,
  type HiveMutationConfig,
  type QueryKey,
  type CacheEntry,
  type LoadingContextValue,
  type PaginationCursor,
  type PaginatedResponse,
  type RealtimeUpdateType,
  type RealtimeUpdate,
  type OfflineQueueEntry,
  type LoadingAnalyticsEvent,
} from "./types/loading-state.types";

// Error types
export { ErrorCategory, ErrorSeverity } from "./types/error.types";
export { type HiveError } from "./types/error.types";

// Utilities

// Analytics convenience functions (for backwards compatibility)
export * from "./analytics-temp-exports";

// Realtime and Query exports
export { feedListener } from "./infrastructure/realtime/feed-listener";
export type { FeedUpdate, FeedListenerOptions } from "./infrastructure/realtime/feed-listener";
export { GetFeedQueryHandler } from "./application/feed/queries/get-feed.query";
export type { GetFeedQuery, GetFeedQueryResult } from "./application/feed/queries/get-feed.query";
export { SearchType, SearchQueryHandler } from "./application/search/queries/search.query";
export type { SearchResultItem, SearchQuery, SearchQueryResult } from "./application/search/queries/search.query";

// Temporary backward compatibility (will be removed)
export * from "./application/shared/temporary-types";

// Schemas
export * from "./schemas/admin/dashboard";

// Leadership Domain (Badges & Verification)
export {
  BADGES,
  evaluateBadges,
  getEarnedBadges,
  getNextBadge,
} from "./domain/leadership/badges";
export type {
  LeadershipBadge,
  BadgeEvaluation,
  LeaderMetrics,
} from "./domain/leadership/badges";

// HiveLab Intelligence Module (Rules-Based, Free)
export * from "./hivelab/intelligence";

// HiveLab Runtime Context (iframe injection contract)
export type { HiveRuntimeContext } from "./domain/creation/runtime-context";
export {
  HiveRuntimeContextSchema,
  RUNTIME_CONTEXT_VERSION,
  buildSpaceRuntimeContext,
  buildStandaloneRuntimeContext,
  buildPreviewRuntimeContext,
  validateRuntimeContext,
} from "./domain/creation/runtime-context";
