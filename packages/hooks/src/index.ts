// Auth hooks - REMOVED: use useUnifiedAuth from @hive/ui instead
// export { useAuth } from './use-auth';

// Analytics hooks
export { useAnalytics } from './use-analytics';
// TEMP DISABLED for HiveLab-only launch - pulls in server-side code
// export { useCreationAnalytics } from './use-creation-analytics';

// Onboarding analytics
export { useOnboardingAnalytics } from './use-onboarding-analytics';
export type { OnboardingStepName } from './use-onboarding-analytics';

// Data fetching hooks
export { useSpaces } from './use-spaces';
export { useProfile } from './use-profile';

// Loading State Hooks (Nov 2025 - Loading Architecture)
export { useHiveQuery, prefetchQuery, invalidateQueries, clearQueryCache } from './use-hive-query';
export { useHiveMutation, useMutationWithInvalidation, useListMutation } from './use-hive-mutation';
export {
  LoadingProvider,
  useLoadingContext,
  useIsLoading,
  useIsQueryLoading,
  useIsMutating,
  useIsCriticalLoading,
} from './loading-context';
export type {
  LoadingProviderProps,
} from './loading-context';
export {
  optimisticList,
  optimisticEngagement,
  optimisticSpace,
  useOptimisticToggle,
  useOptimisticAdd,
  useOptimisticRemove,
  useOptimisticUpdate,
  useBatchMutation,
} from './use-optimistic-mutation';

// Utility hooks
export { useDebounce } from './use-debounce';

// HiveLab hooks
export { useStreamingGeneration } from './use-streaming-generation';
export type {
  StreamingChunk,
  GenerationState,
  GenerationOptions,
  UseStreamingGenerationReturn
} from './use-streaming-generation';

// Tool Execution hooks
export { useToolExecution, createElementActionHandler } from './use-tool-execution';
export type {
  UseToolExecutionOptions,
  UseToolExecutionReturn,
  ExecutionResult,
  ElementState
} from './use-tool-execution';

// Feature flags hooks - TEMP DISABLED for HiveLab-only launch - pulls in server-side code from @hive/core
// export { useFeatureFlags, useToolBuilderVariant, useNavigationVariant } from './use-feature-flags';
// Design Token hooks
export * from './use-tokens';
export * from './use-cognitive-budget';

// Legacy topology budget hook (use use-cognitive-budget.ts instead)
export { useCognitiveBudget as useCognitiveBudgetLegacy } from './topology/use-cognitive-budget';
