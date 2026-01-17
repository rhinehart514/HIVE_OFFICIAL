'use client';

/**
 * Deprecated Component Stubs
 *
 * These components were removed with the atomic/ folder deletion.
 * They are stubbed out to prevent import errors.
 * TODO: Either implement properly or remove usages from @hive/web
 */

import * as React from 'react';
import type { QuickTemplate } from '../lib/hivelab/quick-templates';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ProfileToolModalData {
  id?: string;
  name?: string;
  description?: string;
  toolId?: string;
  deploymentId?: string;
  icon?: string;
  usageCount?: number;
  deployedSpaces?: string[];
  deployedToSpaces?: string[];
}

export interface AddTabInput {
  name: string;
  icon?: string;
  type: 'custom' | 'resource' | 'feed' | 'widget';
  order?: number;
  isVisible?: boolean;
}

export interface AddWidgetInputUI {
  name: string;
  title?: string;
  type?: string;
  config?: Record<string, unknown>;
}

export interface MemberInviteInput {
  email?: string;
  userId?: string;
  role?: string;
}

export interface EventCreateInput {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  type?: string;
  virtualLink?: string;
  maxAttendees?: number;
  requiredRSVP?: boolean;
  announceToSpace?: boolean;
  linkedBoardId?: string;
}

export interface ExistingTool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface InviteableUser {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export type MobileDrawerType = 'chat' | 'members' | 'tools' | 'events' | 'settings' | 'info' | 'automations' | null;

export interface DetectedIntent {
  type?: IntentType;
  confidence?: number;
  entities?: Record<string, unknown>;
  hasIntent?: boolean;
  intentType?: IntentType;
}

export type IntentType =
  | 'create_event'
  | 'invite_member'
  | 'add_tool'
  | 'ask_question'
  | 'general'
  | 'unknown'
  | 'none'
  | 'help'
  | 'countdown'
  | 'poll'
  | 'rsvp'
  | 'announcement';

export interface SpaceEventDetails {
  id: string;
  title: string;
  description?: string;
  /** Date as string or Date object */
  startDate: string | Date;
  endDate?: string | Date;
  location?: string;
  virtualLink?: string;
  attendees?: string[];
  currentAttendees?: number;
  maxAttendees?: number;
  rsvpStatus?: RSVPStatus;
  userRSVP?: RSVPStatus | null;
  type?: 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual' | string;
  linkedBoardId?: string;
  organizer?: {
    id: string;
    fullName: string;
    photoURL?: string;
  };
}

export type RSVPStatus = 'going' | 'maybe' | 'not_going' | null;

export type FeatureKey =
  | 'chat'
  | 'events'
  | 'tools'
  | 'boards'
  | 'members'
  | 'settings'
  | 'analytics';

export interface SetupTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  action?: () => void;
}

export interface SpaceFeatureHighlight {
  feature?: FeatureKey;
  title: string;
  description: string;
  type?: string;
  count?: number;
}

export interface RitualData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  participants?: number;
  participantCount?: number;
  icon?: string;
  progress?: number;
  duration?: string | number;
  startDate?: Date | string;
  endDate?: Date | string;
  frequency?: string;
  category?: string;
  isParticipating?: boolean;
  archetype?: string;
  isCompleted?: boolean;
}

export interface SetupCardData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  category?: string;
}

export type InputStatus = 'default' | 'success' | 'error' | 'warning' | 'loading' | 'idle';

export interface ChatMessageData {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: Date | number;
  reactions?: { emoji: string; count: number; hasReacted: boolean; }[];
  isPinned?: boolean;
  threadCount?: number;
}

export interface OnboardingTask {
  id: string;
  label: string;
  title?: string;
  description?: string;
  completed: boolean;
  action?: 'deploy-tool' | 'create-event' | 'invite-members' | 'customize-sidebar' | (() => void);
}

export interface FoundingClassRitualData extends RitualData {
  foundingMembers?: string[];
  deadline?: Date;
}

export interface SpaceBoardData {
  id: string;
  name: string;
  type?: string;
}

export interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

// =============================================================================
// IMPLEMENTED COMPONENTS - RE-EXPORTED FROM DESIGN SYSTEM
// =============================================================================

// These components have been implemented in the design-system
// Re-export them for backwards compatibility
export {
  AddTabModal,
  AddWidgetModal,
  MemberInviteModal,
  EventCreateModal,
  EventDetailsModal,
  SpaceLeaderOnboardingModal,
  SpaceWelcomeModal,
  SpaceEntryAnimation,
  IntentConfirmationInline,
  MobileActionBar,
  MobileDrawer,
  PinnedMessagesWidget,
  LeaderSetupProgress,
} from '../design-system/components/spaces';

export { ProfileToolModal } from '../design-system/components/profile';

// HiveConfirmModal - MOVED to design-system/components/ConfirmDialog
// ThreadDrawer - MOVED to design-system/components/ThreadDrawer
// Both exported from @hive/ui via design-system

// =============================================================================
// STUB COMPONENTS (NOT YET IMPLEMENTED)
// =============================================================================

/** @deprecated Modal stub - implement or remove usage */
export const HiveModal: React.FC<{
  children?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  size?: string;
}> = ({ children }) => (children ? <>{children}</> : null);

/** @deprecated Skeleton stub - implement or remove usage */
export const FeedLoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-32 bg-hive-background-tertiary rounded-lg" />
    ))}
  </div>
);

/** @deprecated Shell stub - implement or remove usage */
export const Shell: React.FC<{
  children?: React.ReactNode;
  size?: string;
  noVerticalPadding?: boolean;
}> = ({ children }) => (
  <div className="min-h-screen bg-hive-background-primary">{children}</div>
);

/** @deprecated ProfileBentoGrid stub - implement or remove usage */
export const ProfileBentoGrid: React.FC<{
  userId?: string;
  isEditable?: boolean;
  editable?: boolean;
  profile?: unknown;
  onLayoutChange?: (layout: unknown) => void;
}> = () => (
  <div className="grid grid-cols-2 gap-4 p-4">
    <div className="h-32 bg-hive-background-tertiary rounded-lg" />
    <div className="h-32 bg-hive-background-tertiary rounded-lg" />
  </div>
);

/** @deprecated Ritual stub - implement or remove usage */
export const RitualFoundingClass: React.FC<{
  ritual?: RitualData | FoundingClassRitualData;
  isParticipating?: boolean;
  onJoin?: () => void | Promise<void>;
}> = () => (
  <div className="p-4 bg-hive-background-secondary rounded-lg">
    <p className="text-hive-text-tertiary">Ritual: Founding Class</p>
  </div>
);

/** @deprecated Ritual stub - implement or remove usage */
export const RitualSurvival: React.FC<{
  ritual?: RitualData;
  isParticipating?: boolean;
  onJoin?: () => void | Promise<void>;
  onVote?: (matchId: string, choice: string) => void;
}> = () => (
  <div className="p-4 bg-hive-background-secondary rounded-lg">
    <p className="text-hive-text-tertiary">Ritual: Survival</p>
  </div>
);

/** @deprecated Ritual stub - implement or remove usage */
export const RitualTournamentBracket: React.FC<{
  ritual?: RitualData;
  isParticipating?: boolean;
  onVote?: (matchId: string, choice: string) => void;
}> = () => (
  <div className="p-4 bg-hive-background-secondary rounded-lg">
    <p className="text-hive-text-tertiary">Ritual: Tournament Bracket</p>
  </div>
);

/** @deprecated Layout stub - implement or remove usage */
export const RitualsPageLayout: React.FC<{
  children?: React.ReactNode;
  rituals?: RitualData[];
  featuredRitual?: RitualData;
  onRitualJoin?: (ritualId: string) => void | Promise<void>;
  onRitualView?: (ritualId: string) => void;
  isLoading?: boolean;
}> = ({ children }) => (
  <div className="min-h-screen bg-hive-background-primary p-6">{children}</div>
);

/** @deprecated Grid stub - implement or remove usage */
export const SetupGrid: React.FC<{
  items?: SetupCardData[];
  setups?: SetupCardData[];
  onItemClick?: (id: string) => void;
  onDeploy?: (setupId: string) => void | Promise<void>;
  onPreview?: (setupId: string) => void;
  isLoading?: boolean;
  deployingId?: string | null;
}> = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="h-48 bg-hive-background-tertiary rounded-lg" />
    <div className="h-48 bg-hive-background-tertiary rounded-lg" />
    <div className="h-48 bg-hive-background-tertiary rounded-lg" />
  </div>
);

// IntentConfirmationInline, SpaceEntryAnimation, MobileActionBar, MobileDrawer,
// SpaceSidebar, PinnedMessagesWidget, LeaderSetupProgress
// Are now exported from design-system (see re-exports above)

/** @deprecated Ritual strip stub - implement or remove usage */
export const RitualStrip: React.FC<{
  rituals?: RitualData[];
  ritual?: RitualData | FoundingClassRitualData;
  onRitualClick?: (id: string) => void;
  variant?: string;
  showProgress?: boolean;
  onViewDetails?: () => void;
  className?: string;
}> = () => null;

/** @deprecated Chat board stub - implement or remove usage */
export const SpaceChatBoard: React.FC<{
  spaceId?: string;
  boardId?: string;
  onMessageSend?: (message: string) => void;
  spaceName?: string;
  boards?: SpaceBoardData[];
  activeBoardId?: string;
  messages?: ChatMessageData[];
  typingUsers?: TypingUser[];
  currentUserId?: string;
  isLoading?: boolean;
  isSending?: boolean;
  error?: string | null;
  onSendMessage?: (content: string) => void | Promise<void>;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onReply?: (messageId: string) => void;
  onBoardChange?: (boardId: string) => void;
  useEdgeToEdge?: boolean;
  [key: string]: unknown;
}> = () => (
  <div className="flex-1 flex items-center justify-center bg-hive-background-primary">
    <p className="text-hive-text-tertiary">Chat loading...</p>
  </div>
);

/** @deprecated Threshold stub - implement or remove usage */
export const SpaceThreshold: React.FC<{
  spaceId?: string;
  onCross?: () => void;
  onEnter?: () => void;
  children?: React.ReactNode;
  space?: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    bannerUrl?: string;
    category?: string;
    memberCount?: number;
    onlineCount?: number;
  };
  events?: unknown[];
  toolCount?: number;
}> = ({ children }) => <>{children}</>;

/** @deprecated Skeleton stub - implement or remove usage */
export const SpaceBoardSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 p-4 flex-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-16 bg-hive-background-tertiary rounded-lg" />
    ))}
  </div>
);

/** @deprecated AI chat stub - implement or remove usage */
export const AILandingPageChat: React.FC<{
  onSubmit?: (message: string) => void;
  userId?: string;
  isAuthenticated?: boolean;
  isSpaceLeader?: boolean;
  onSave?: (composition: unknown) => void | Promise<unknown>;
  onDeploy?: (composition: unknown) => void | Promise<void>;
  templates?: unknown[];
  initialMode?: string;
  redirectToSignup?: () => void;
  [key: string]: unknown;
}> = () => (
  <div className="p-4 bg-hive-background-secondary rounded-lg">
    <p className="text-hive-text-tertiary">AI Chat Interface</p>
  </div>
);

/** @deprecated Notification bell stub - implement or remove usage */
export const NotificationBell: React.FC<{
  notifications?: unknown[];
  unreadCount?: number;
  isLoading?: boolean;
  onNotificationClick?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  disabled?: boolean;
}> = () => null;

/** @deprecated Welcome mat stub - implement or remove usage */
export const WelcomeMat: React.FC<{
  onDismiss?: () => void;
  userName?: string;
}> = () => null;

// =============================================================================
// HOOKS
// =============================================================================

/** @deprecated Hook stub - implement or remove usage */
export function useSpaceWelcome(_spaceId?: string) {
  return {
    showWelcome: false,
    shouldShow: false,
    isLoading: false,
    setShowWelcome: () => {},
    dismissWelcome: () => {},
    features: [] as SpaceFeatureHighlight[],
  };
}

// =============================================================================
// RE-EXPORT FOR BACKWARDS COMPATIBILITY
// =============================================================================

// Grid is now in design-system, but ensure we have a fallback
export { Grid } from '../design-system/templates/Grid';
