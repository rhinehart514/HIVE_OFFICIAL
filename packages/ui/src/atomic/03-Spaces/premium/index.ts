/**
 * Premium Spaces Components
 *
 * ChatGPT/Apple-inspired design system for HIVE Spaces.
 * These components prioritize:
 * - Generous spacing (messages breathe)
 * - Glass morphism (Apple-style translucency)
 * - Physics-based motion (spring animations)
 * - Gold accents for key moments
 * - Minimal chrome - content is king
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

// Design System
export { premium, premiumTypography, premiumColors, premiumSpacing, premiumGlass, premiumMotion, premiumPresets } from '../../../lib/premium-design';
export { glassClasses, hoverClasses, focusClasses } from '../../../lib/premium-design';

// Header
export { PremiumHeader } from './premium-header';
export type { PremiumHeaderProps, MembershipState } from './premium-header';

// Board Tabs
export { PremiumBoardTabs } from './premium-board-tabs';
export type { PremiumBoardTabsProps, BoardTab, BoardType } from './premium-board-tabs';

// Message Components
export { PremiumMessage } from './premium-message';
export type { PremiumMessageProps, MessageRole } from './premium-message';

// Message List (Virtualized)
export { PremiumMessageList } from './premium-message-list';
export type { PremiumMessageListProps, MessageData } from './premium-message-list';

// Chat Board (Full Experience)
export { PremiumChatBoard } from './premium-chat-board';
export type { PremiumChatBoardProps, TypingUser } from './premium-chat-board';

// Composer
export { PremiumComposer } from './premium-composer';
export type { PremiumComposerProps } from './premium-composer';

// Sidebar
export { PremiumSidebar, GlassCard, AboutSection, EventsSection, MembersSection, ToolsSection } from './premium-sidebar';
export type {
  PremiumSidebarProps,
  GlassCardProps,
  SidebarSection,
  AboutSectionData as SpaceInfo,
  EventItem as SpaceEvent,
  MemberItem as SpaceMember,
  ToolItem as SpaceTool,
} from './premium-sidebar';
