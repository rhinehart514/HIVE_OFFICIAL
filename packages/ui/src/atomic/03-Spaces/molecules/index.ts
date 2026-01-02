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

// Mobile Action Bar & Drawer (Dec 2025)
export {
  MobileActionBar,
  type MobileActionBarProps,
  type MobileDrawerType,
} from './mobile-action-bar';

export {
  MobileDrawer,
  type MobileDrawerProps,
} from './mobile-drawer';

// Thread Drawer (Dec 2025 - Thread/reply view)
export {
  ThreadDrawer,
  type ThreadDrawerProps,
} from './thread-drawer';

// Sidebar Tool Slot (Dec 2025 - HiveLab powered)
export {
  SidebarToolSlot,
  type SidebarToolSlotProps,
  type SidebarSlotData,
} from './sidebar-tool-slot';

// Tool Picker Popover (Dec 2025 - Chat inline tool insertion)
export {
  ToolPickerPopover,
  type ToolPickerPopoverProps,
  type DeployedTool,
} from './tool-picker-popover';

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
export { SpaceComposer, type SpaceComposerProps, type SpaceComposerRef } from './space-composer';
export { SpaceAboutWidget } from './space-about-widget';
export { SpaceToolsWidget } from './space-tools-widget';
export { RailWidget } from './rail-widget';
export { NowCard } from './now-card';
export { PinnedPostsStack } from './pinned-posts-stack';
export { TodayDrawer } from './today-drawer';

// Pinned Messages Widget (Dec 2025)
export {
  PinnedMessagesWidget,
  type PinnedMessagesWidgetProps,
  type PinnedMessage,
} from './pinned-messages-widget';
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

// Board Tab Bar (Discord-style channel selector)
export {
  BoardTabBar,
  type BoardTabBarProps,
  type BoardData,
} from './board-tab-bar';

// Space Breadcrumb (Navigation context)
export {
  SpaceBreadcrumb,
  type SpaceBreadcrumbProps,
} from './space-breadcrumb';

// Featured Tool Slot (Dec 2025 - HiveLab tool in conversation)
export {
  FeaturedToolSlot,
  FeaturedToolEmpty,
  type FeaturedToolSlotProps,
  type FeaturedToolEmptyProps,
} from './featured-tool-slot';

// Space Chat Input (Dec 2025 - Dark-first chat input for Spaces)
// Note: Component is still named HeroInput for backwards compatibility
export {
  HeroInput,
  HeroInput as SpaceChatInput,
  type HeroInputProps,
  type HeroInputProps as SpaceChatInputProps,
  type HeroInputHandle,
  type HeroInputHandle as SpaceChatInputHandle,
} from './space-chat-input';

// Space Chat Message (Dec 2025 - Dark-first message component)
export {
  SpaceChatMessage,
  type SpaceChatMessageProps,
  type MessageRole,
} from './space-chat-message';

// Context Rail (Dec 2025 - Always-visible context strip)
export {
  ContextRail,
  type ContextRailProps,
} from './context-rail';

// Space Welcome Banner (Dec 2025 - Inline welcome for first-time visitors)
export {
  SpaceWelcomeBanner,
  hasSeenWelcome,
  markWelcomeSeen,
  type SpaceWelcomeBannerProps,
} from './space-welcome-banner';

// Leader Setup Progress (Dec 2025 - Sidebar setup checklist for leaders)
export {
  LeaderSetupProgress,
  type LeaderSetupProgressProps,
  type SetupTask,
} from './leader-setup-progress';
