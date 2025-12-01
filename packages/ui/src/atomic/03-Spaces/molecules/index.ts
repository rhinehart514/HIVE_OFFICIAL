// Space Molecules - Barrel Export
// Composite components for the Spaces experience

// Tab navigation (new - Nov 2025)
export { SpaceTabBar, type SpaceTabBarProps, type SpaceTabItem } from './space-tab-bar';

// Discovery components (new)
export { SpaceDiscoveryCard, type SpaceDiscoveryCardProps, type SpaceDiscoveryCardData } from './space-discovery-card';
export { SpaceHeroCard, type SpaceHeroCardProps, type SpaceHeroCardData } from './space-hero-card';
export { CategoryFilterBar, type CategoryFilterBarProps, type CategoryFilterItem } from './category-filter-bar';
export { DiscoverySectionHeader, type DiscoverySectionHeaderProps } from './discovery-section-header';

// Collapsible patterns
export {
  CollapsibleWidget,
  CompactCollapsibleWidget,
  type CollapsibleWidgetProps,
  type CompactCollapsibleWidgetProps,
} from './collapsible-widget';

// Mobile patterns
export {
  MobileInlineSection,
  MobileAboutSection,
  MobileToolsSection,
  type MobileInlineSectionProps,
} from './mobile-inline-section';

// Empty states
export {
  SpaceEmptyState,
  PostsEmptyState,
  MembersEmptyState,
  EventsEmptyState,
  ToolsEmptyState,
  SpacesEmptyState,
  SearchEmptyState,
  type SpaceEmptyStateProps,
} from './space-empty-state';

// Existing space components
export { SpaceHeader, type SpaceHeaderProps, type SpaceHeaderSpace, type SpaceMembershipState } from './space-header';
export { SpaceComposer } from './space-composer';
export { SpaceAboutWidget } from './space-about-widget';
export { SpaceToolsWidget } from './space-tools-widget';
export { RailWidget } from './rail-widget';
export { NowCard } from './now-card';
export { PinnedPostsStack } from './pinned-posts-stack';
export { TodayDrawer } from './today-drawer';
export {
  NavigationItem,
  SidebarNav,
  NavigationRail,
  BottomNav,
  TopBar,
  type NavigationLayout,
  type NavigationItemProps,
  type NavigationNode,
  type SidebarNavSection,
  type SidebarNavProps,
  type NavigationRailProps,
  type BottomNavProps,
  type TopBarProps,
} from './navigation-primitives';
