/**
 * Spaces Components (Simplified Feb 2026)
 * Hub/Theater/Modes/Boards/Widgets removed.
 */

// ============================================
// MODAL COMPONENTS
// ============================================

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
export {
  EventEditModal,
  type EventEditInput,
  type EventEditModalProps,
} from './EventEditModal';

// ============================================
// CHAT COMPONENTS
// ============================================

export { ContextPill, ContextPillMobile } from './ContextPill';

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

// ============================================
// SIDEBAR & MOBILE COMPONENTS
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

// ============================================
// ONBOARDING & ANIMATION COMPONENTS
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

// ============================================
// THRESHOLD
// ============================================

export {
  SpaceThreshold,
  type SpaceThresholdProps,
} from './SpaceThreshold';

// ============================================
// JOIN REQUESTS
// ============================================

export {
  JoinRequestsPanel,
  type JoinRequestsPanelProps,
  type JoinRequestItem,
  type JoinRequestUser,
} from './JoinRequestsPanel';

// ============================================
// CHAT SEARCH
// ============================================

export {
  ChatSearchModal,
  type ChatSearchModalProps,
  type SearchResultMessage,
  type ChatSearchFilters,
} from './ChatSearchModal';
