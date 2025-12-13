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
export type { SpaceMemberRole, LeaderRequestStatus } from "./domain/spaces/aggregates/enhanced-space";
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
export { RitualId } from "./domain/rituals/value-objects/ritual-id.value";
export { EnhancedRitual } from "./domain/rituals/aggregates/enhanced-ritual";
export { FeedItem } from "./domain/feed/feed-item";
export { EnhancedFeed } from "./domain/feed/enhanced-feed";
export { FeedRankingService, DEFAULT_RANKING_CONFIG } from "./domain/feed/services/feed-ranking.service";
export type {
  RelevanceFactors,
  RankingWeights,
  FeedRankingConfig,
  UserRankingContext,
  RankingCandidate,
  RankedItem
} from "./domain/feed/services/feed-ranking.service";
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

// System Tool Templates (HiveLab → Spaces Integration)
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
  isSystemTool,
  getEssentialTools,
  getEngagementTools,
  type SystemToolTemplate,
  type UniversalTemplate,
} from "./domain/hivelab/system-tool-templates";

// HiveLab Domain Types
export type {
  ToolComposition,
  CanvasElement,
  ElementConnection,
  ElementDefinition,
  ElementCategory
} from "./domain/hivelab/tool-composition.types";

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
} from "./domain/hivelab/element-registry";
export type { ElementSpec } from "./domain/hivelab/element-registry";

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
  // Schemas (not validateElementConfig - already exported elsewhere)
  ELEMENT_CONFIG_SCHEMAS,
  getElementConfigSchema,
  getRequiredFields,
  isFieldRequired,
  ToolCompositionSchema,
  CanvasElementBaseSchema,
  ElementConnectionSchema,
  PositionSchema,
  SizeSchema,
  // Services
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
} from "./domain/hivelab/validation";

// HiveLab Services - MOVED TO @hive/core/server for client/server separation
// Import from '@hive/core/server' for server-side usage
// export { AIToolGeneratorService, createAIToolGenerator } from "./application/hivelab/ai-tool-generator.service";
// export type {
//   AIGeneratorConfig,
//   GenerateToolOptions,
//   GenerateToolResult,
//   StreamingChunk
// } from "./application/hivelab/ai-tool-generator.service";
export {
  ELEMENT_CATALOG,
  SYSTEM_PROMPT,
  DEMO_PROMPTS,
  generateInstanceId,
  type StreamingMessage
} from "./application/hivelab/prompts/tool-generation.prompt";

// HiveLab AI Learning System
export {
  // Types
  type ElementAffinity,
  type MissingPattern,
  type OverGenerationPattern,
  type ConfigDrift,
  type OptimalConfig,
  type LayoutPattern,
  type LearnedPatterns,
  type EmbeddingDocument,
  type RetrievedContext,
  type GraduationCandidate,
  type CapabilityGap,
  type EnhancedPrompt,
  type PromptEnhancementOptions,
  // Services
  PatternExtractorService,
  getPatternExtractorService,
  initializePatternExtractor,
  ConfigLearnerService,
  getConfigLearnerService,
  initializeConfigLearner,
  ContextRetrieverService,
  getContextRetrieverService,
  initializeContextRetriever,
  PromptEnhancerService,
  getPromptEnhancerService,
  initializePromptEnhancer,
  initializeLearningServices,
} from "./application/hivelab/learning";

// HiveLab AI Benchmarking System
export {
  // Types
  type BenchmarkCategory,
  type BenchmarkPrompt,
  type BenchmarkResult,
  type BenchmarkSuiteResult,
  type BenchmarkComparison,
  type BenchmarkRunnerOptions,
  type CategoryResult,
  type ExpectationResult,
  type RegressionThresholds,
  type MockGenerationResult,
  DEFAULT_REGRESSION_THRESHOLDS,
  // Prompts
  BENCHMARK_PROMPTS,
  getPromptsByCategory,
  getPromptsByTag,
  getPromptById,
  getPromptIdsByCategory,
  PROMPT_COUNTS,
  TOTAL_PROMPT_COUNT,
  // Services
  BenchmarkRunnerService,
  getBenchmarkRunner,
  MockGeneratorService,
  getMockGenerator,
  BenchmarkReporter,
  getBenchmarkReporter,
  type OutputFormat,
} from "./application/hivelab/benchmarks";

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
export type { ProfileSystem, HiveProfile, UnifiedHiveProfile, GridSize, BentoGridLayout, Friend } from "./types/profile-system";
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
export * from "./utils/activity-tracker";
export * from "./utils/privacy-utils";
export * from "./utils/profile-aggregator";

// Analytics convenience functions (for backwards compatibility)
export * from "./analytics-temp-exports";

// Realtime and Query exports
export { feedListener } from "./infrastructure/realtime/feed-listener";
export type { FeedUpdate, FeedListenerOptions } from "./infrastructure/realtime/feed-listener";
export { GetFeedQueryHandler } from "./application/feed/queries/get-feed.query";
export type { GetFeedQuery, GetFeedQueryResult } from "./application/feed/queries/get-feed.query";
export { GetPersonalizedFeedQueryHandler, createPersonalizedFeedHandler } from "./application/feed/queries/get-personalized-feed.query";
export type { GetPersonalizedFeedQuery, PersonalizedFeedResult } from "./application/feed/queries/get-personalized-feed.query";
export { SearchType, SearchQueryHandler } from "./application/search/queries/search.query";
export type { SearchResultItem, SearchQuery, SearchQueryResult } from "./application/search/queries/search.query";

// Temporary backward compatibility (will be removed)
export * from "./application/shared/temporary-types";

// Schemas
export * from "./schemas/admin/dashboard";
