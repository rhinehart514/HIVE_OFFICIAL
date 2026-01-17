/**
 * Spaces Components
 *
 * Components for space management, events, collaboration,
 * Hub + Theater Mode architecture.
 */

// ============================================
// MODAL COMPONENTS (New - Phase 2)
// ============================================

export { AddTabModal, type AddTabInput, type AddTabModalProps } from './AddTabModal';
export {
  AddWidgetModal,
  type AddWidgetInputUI,
  type ExistingTool,
  type AddWidgetModalProps,
  type QuickTemplateUI,
} from './AddWidgetModal';
export {
  MemberInviteModal,
  type InviteableUser,
  type MemberInviteInput,
  type MemberInviteModalProps,
} from './MemberInviteModal';
export {
  EventCreateModal,
  type EventCreateInput,
  type EventCreateModalProps,
} from './EventCreateModal';
export {
  EventDetailsModal,
  type RSVPStatus,
  type SpaceEventDetails,
  type EventDetailsModalProps,
} from './EventDetailsModal';

// ============================================
// HUB + THEATER MODE COMPONENTS (Existing)
// ============================================

// Hub - Orientation Archetype (v2.0.0)
export { SpaceHub, type SpaceMode, type SpaceIdentity, type SpaceHubProps } from './SpaceHub';

// Mode Cards (legacy - used by ContextPill, not by SpaceHub)
export {
  ModeCard,
  ChatModeCard,
  EventsModeCard,
  ToolsModeCard,
  MembersModeCard,
} from './ModeCard';

export { ModeCard as BaseModeCard } from './ModeCard';

// Mode Transitions
export {
  ModeTransition,
  ModeHeader,
  FullScreenMode,
} from './ModeTransition';

export { ContextPill, ContextPillMobile } from './ContextPill';

// Chat Components
export {
  ChatRowMessage,
  SystemMessage,
  DateSeparator,
  type ChatRowMessageProps,
  type ChatRowMessageAuthor,
  type ChatRowMessageReaction,
  type SystemMessageProps,
  type DateSeparatorProps,
} from './ChatRowMessage';

export {
  ChatTypingDots,
  ChatTypingDotsCompact,
  ChatTypingDotsInline,
  type ChatTypingDotsProps,
  type ChatTypingDotsCompactProps,
  type ChatTypingDotsInlineProps,
  type TypingUser,
} from './TypingDots';

export {
  TheaterChatBoard,
  type TheaterChatBoardProps,
  type TheaterMessage,
} from './TheaterChatBoard';

export {
  SpaceChatBoard,
  type SpaceChatBoardProps,
  type SpaceBoardData,
  type ChatMessageData,
  type SlashCommandData,
} from './SpaceChatBoard';

// Full-Screen Modes
export {
  EventsMode,
  type EventsModeProps,
  type SpaceEvent,
} from './EventsMode';

export {
  ToolsMode,
  type ToolsModeProps,
  type SpaceTool,
} from './ToolsMode';

export {
  MembersMode,
  type MembersModeProps,
  type SpaceMember,
} from './MembersMode';

// ============================================
// SIDEBAR & MOBILE COMPONENTS (Phase 3)
// ============================================

export {
  PinnedMessagesWidget,
  type PinnedMessage,
  type PinnedMessagesWidgetProps,
} from './PinnedMessagesWidget';

export {
  LeaderSetupProgress,
  type SetupTask,
  type LeaderSetupProgressProps,
} from './LeaderSetupProgress';

export {
  MobileActionBar,
  type MobileDrawerType,
  type MobileActionBarProps,
} from './MobileActionBar';

export { MobileDrawer, type MobileDrawerProps } from './MobileDrawer';

// SpaceSidebar - REMOVED (Jan 2026)
// Use GlobalSidebar from design-system/primitives instead

// ============================================
// ONBOARDING & ANIMATION COMPONENTS (Phase 4)
// ============================================

export {
  SpaceLeaderOnboardingModal,
  type QuickDeployTemplate,
  type SpaceLeaderOnboardingModalProps,
} from './SpaceLeaderOnboardingModal';

export {
  SpaceWelcomeModal,
  type SpaceLeaderInfo,
  type SpaceFeature,
  type SpaceWelcomeModalProps,
} from './SpaceWelcomeModal';

export {
  SpaceEntryAnimation,
  type SpaceEntryAnimationProps,
} from './SpaceEntryAnimation';

export {
  IntentConfirmationInline,
  type IntentType,
  type IntentPreview,
  type IntentConfirmationInlineProps,
} from './IntentConfirmationInline';

// ============================================
// THRESHOLD (Entry Gateway for Non-Members)
// ============================================

export {
  SpaceThreshold,
  type SpaceThresholdProps,
} from './SpaceThreshold';

// ============================================
// JOIN REQUESTS (Leader Management)
// ============================================

export {
  JoinRequestsPanel,
  type JoinRequestsPanelProps,
  type JoinRequestItem,
  type JoinRequestUser,
} from './JoinRequestsPanel';

// ============================================
// CHAT SEARCH (Message Search)
// ============================================

export {
  ChatSearchModal,
  type ChatSearchModalProps,
  type SearchResultMessage,
  type ChatSearchFilters,
} from './ChatSearchModal';
