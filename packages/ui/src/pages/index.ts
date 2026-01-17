// NOTE: Most page components are legacy prototypes with type mismatches
// They have been disabled pending migration to the new design system
// See tsconfig.json exclude list for the full list of excluded files

// export { FeedPage, type FeedPageProps } from "./feed/FeedPage";
// export { FeedLoadingSkeleton, FeedLoadingSkeleton as FeedPageSkeleton } from "./feed/FeedLoadingSkeleton";

// export { SpacesDiscoveryPage, type SpacesDiscoveryPageProps } from "./spaces/SpacesDiscoveryPage";
// export { SpaceCard, type SpaceCardProps, type SpaceCardData } from "./spaces/SpaceCard";

// export { ProfileOverviewPage, type ProfileOverviewPageProps } from "./profile/ProfileOverviewPage";
// export { ProfileViewLoadingSkeleton } from "./profile/ProfileViewLoadingSkeleton";

// export { HiveLabToolsPage, type HiveLabToolsPageProps } from "./hivelab/HiveLabToolsPage";
export {
  ToolAnalyticsPage,
  type ToolAnalyticsPageProps,
  type ToolAnalyticsData,
} from "./hivelab/ToolAnalyticsPage";
export { ToolPreviewPage, type ToolPreviewPageProps } from "./hivelab/ToolPreviewPage";
// export { ToolEditPage, type ToolEditPageProps } from "./hivelab/ToolEditPage";

// export { OnboardingFlowPage, type OnboardingFlowPageProps } from "./onboarding/OnboardingFlowPage";
