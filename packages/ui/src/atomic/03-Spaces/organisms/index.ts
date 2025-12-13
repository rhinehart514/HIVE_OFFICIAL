// Space Organisms - Barrel Export
// Complex layouts and sections for the Spaces experience

// Space Detail Components (Premium T1 - Nov 2025)
export { SpaceDetailHeader } from './space-detail-header';
export type {
  SpaceDetailHeaderProps,
  SpaceDetailData,
  SpaceMembershipState,
} from './space-detail-header';

export { SpaceDynamicContent } from './space-dynamic-content';
export type {
  SpaceDynamicContentProps,
  SpaceWidget as DynamicSpaceWidget,
  TabContentType,
} from './space-dynamic-content';

// Discovery Section (new - Dec 2025)
export { SpacesHeroSection } from './spaces-hero-section';
export type { SpacesHeroSectionProps } from './spaces-hero-section';

export { SpacesDiscoveryGrid } from './spaces-discovery-grid';
export type { SpacesDiscoveryGridProps } from './spaces-discovery-grid';

// Unified Sidebar (Nov 2025 - Motion-Rich Premium)
export {
  SpaceSidebar,
  SpaceSidebarMinimal,
} from './space-sidebar';
export type {
  SpaceSidebarProps,
  SpaceSidebarData,
  SpaceSidebarCallbacks,
  SpaceSidebarAbout,
  SpaceSidebarTools,
  SpaceSidebarEvent,
  SpaceSidebarMinimalProps,
} from './space-sidebar';

// Existing Space organisms
export { SpaceBoardLayout } from './space-board-layout';
export type { SpaceBoardLayoutProps, PinnedPost as SpacePinnedPost } from './space-board-layout';

export { SpacePostComposer } from './space-post-composer';
export type { SpacePostComposerProps } from './space-post-composer';

export { SpaceBoardSkeleton, SpaceCardSkeleton } from './space-board-skeleton';
export type { SpaceBoardSkeletonProps } from './space-board-skeleton';

// Real-time Chat Board (Dec 2025 - Discord-style)
export { SpaceChatBoard } from './space-chat-board';
export type {
  SpaceChatBoardProps,
  SpaceBoardData,
  ChatMessageData,
  TypingUser,
} from './space-chat-board';

// HiveLab-powered Configurable Sidebar (Dec 2025)
export { SpaceSidebarConfigurable } from './space-sidebar-configurable';
export type {
  SpaceSidebarConfigurableProps,
  SidebarEventData,
  SidebarMemberData,
  SidebarToolData,
} from './space-sidebar-configurable';

// Widget Gallery for adding sidebar widgets (Dec 2025)
export { WidgetGallery } from './widget-gallery';
export type {
  WidgetGalleryProps,
  WidgetTemplate,
} from './widget-gallery';

// Tab and Widget Modals (Dec 2025)
export { AddTabModal } from './add-tab-modal';
export type {
  AddTabModalProps,
  AddTabInput,
  TabType,
} from './add-tab-modal';

export { AddWidgetModal } from './add-widget-modal';
export type {
  AddWidgetModalProps,
} from './add-widget-modal';

// Member Invite Modal (Dec 2025)
export { MemberInviteModal } from './member-invite-modal';
export type {
  MemberInviteModalProps,
  MemberInviteInput,
  InviteableUser,
  MemberRole,
} from './member-invite-modal';

// Event Creation Modal (Dec 2025)
export { EventCreateModal } from './event-create-modal';
export type {
  EventCreateModalProps,
  EventCreateInput,
  EventType,
  BoardOption,
} from './event-create-modal';
