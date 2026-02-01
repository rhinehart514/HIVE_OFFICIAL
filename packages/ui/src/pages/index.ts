// NOTE: Most page components are legacy prototypes with type mismatches
// They have been disabled pending migration to the new design system
// See tsconfig.json exclude list for the full list of excluded files

// ============================================
// PAGE SKELETONS
// Premium loading states with staggered wave animations
// Base color: white/[0.08], stagger delay: 0.15s
// ============================================

// Feed
export { FeedLoadingSkeleton } from "./feed/FeedLoadingSkeleton";

// Profile
export { ProfileViewLoadingSkeleton } from "./profile/ProfileViewLoadingSkeleton";

// Spaces
export {
  SpacesDiscoverySkeleton,
  SpaceDetailSkeleton,
  SpaceCreationSkeleton,
} from "./spaces/SpacesSkeletons";

// HiveLab
export { ToolsLoadingSkeleton } from "./hivelab/HiveLabSkeletons";

// export { FeedPage, type FeedPageProps } from "./feed/FeedPage";
// export { SpacesDiscoveryPage, type SpacesDiscoveryPageProps } from "./spaces/SpacesDiscoveryPage";
// export { SpaceCard, type SpaceCardProps, type SpaceCardData } from "./spaces/SpaceCard";
// export { ProfileOverviewPage, type ProfileOverviewPageProps } from "./profile/ProfileOverviewPage";

// export { HiveLabToolsPage, type HiveLabToolsPageProps } from "./hivelab/HiveLabToolsPage";
export {
  ToolAnalyticsPage,
  type ToolAnalyticsPageProps,
  type ToolAnalyticsData,
} from "./hivelab/ToolAnalyticsPage";
export { ToolPreviewPage, type ToolPreviewPageProps } from "./hivelab/ToolPreviewPage";
// export { ToolEditPage, type ToolEditPageProps } from "./hivelab/ToolEditPage";

// export { OnboardingFlowPage, type OnboardingFlowPageProps } from "./onboarding/OnboardingFlowPage";
