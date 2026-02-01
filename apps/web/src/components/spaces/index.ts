/**
 * Spaces Components Index
 *
 * Re-exports all space-related components for clean imports.
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

// Core list row
export { SpaceListRow, SpaceListRowSkeleton } from './space-list-row';
export type { SpaceListRowSpace, SpaceListRowProps } from './space-list-row';

// Identity cards
export { IdentityCards } from './identity-cards';
export type { IdentityClaim, IdentityType, IdentityCardsProps } from './identity-cards';

// Identity claim modal
export { IdentityClaimModal } from './identity-claim-modal';

// Your spaces list
export { YourSpacesList } from './your-spaces-list';
export type { YourSpace, YourSpacesListProps } from './your-spaces-list';

// Discover section
export { DiscoverSection } from './discover-section';
export type { DiscoverTab, DiscoverSpace, DiscoverSectionProps } from './discover-section';

// Invite link modal
export { InviteLinkModal } from './invite-link-modal';

// User state layouts
export { NewUserLayout } from './new-user-layout';
export type { NewUserLayoutProps } from './new-user-layout';
export { ReturningUserLayout } from './returning-user-layout';
export type { ReturningUserLayoutProps } from './returning-user-layout';

// Space preview modal
export { SpacePreviewModal } from './space-preview-modal';
export type { SpacePreviewData, SpacePreviewModalProps } from './space-preview-modal';

// Territory header (premium discovery)
export { TerritoryHeader } from './territory-header';
export type { TerritoryHeaderProps } from './territory-header';

// Onboarding overlay (first-time users)
export { OnboardingOverlay } from './onboarding-overlay';
export type { OnboardingOverlayProps } from './onboarding-overlay';

// Homebase activity feed (cross-space updates)
export { HomebaseActivityFeed } from './homebase-activity-feed';
export type { ActivityItem, ActivityType, HomebaseActivityFeedProps } from './homebase-activity-feed';

// Space quick actions (homebase cards)
export { SpaceQuickActions } from './space-quick-actions';
export type { SpaceQuickActionsProps } from './space-quick-actions';

// Boards sidebar (unified space view)
export { BoardsSidebar } from './boards-sidebar';
export type { Board, BoardsSidebarProps, SidebarEvent } from './boards-sidebar';

// Unified activity feed (space residence)
export { UnifiedActivityFeed } from './unified-activity-feed';
export type {
  FeedItem,
  FeedItemType,
  MessageItem,
  PostItem,
  EventItem,
  ToolItem,
  UnifiedActivityFeedProps,
} from './unified-activity-feed';

// Sidebar tool components (HiveLab Sprint 1)
export { SidebarToolCard } from './sidebar-tool-card';
export type { SidebarToolCardProps } from './sidebar-tool-card';
export { SidebarToolSection } from './sidebar-tool-section';
export type { SidebarToolSectionProps } from './sidebar-tool-section';

// Space creation modal
export { SpaceCreationModal } from './SpaceCreationModal';

// Space claim modal (institutional spaces)
export { SpaceClaimModal } from './SpaceClaimModal';

// Space join modal (invite codes)
export { SpaceJoinModal } from './SpaceJoinModal';
