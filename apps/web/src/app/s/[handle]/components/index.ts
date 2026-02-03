/**
 * Space Residence Page Components
 * ENHANCED: Jan 31, 2026 — Split Panel Rebuild
 */

// Legacy components (still used)
export { ChatMessages } from './chat-messages';
export { ChatInput } from './chat-input';
export { SpaceHeader } from './space-header';
export { SpaceThreshold } from './space-threshold';
export { BoardCreationModal } from './board-creation-modal';
export { MembersList } from './members-list';
export type { Member } from './members-list';
export { SpaceSettings } from './space-settings';
export { SpaceInfoDrawer } from './space-info-drawer';
export { ModerationPanel } from './moderation-panel';
export { MemberManagement } from './member-management';
export { BoardEmptyState, getBoardType } from './BoardEmptyState';
export type { BoardType } from './BoardEmptyState';

// New Split Panel Components (Jan 2026)
export { SpaceLayout } from './space-layout';
export { SpaceSidebar } from './space-sidebar';
export { MainContent } from './main-content';

// Sidebar components
export { BoardItem, type Board } from './sidebar/board-item';
export { BoardsList, type BoardsListProps } from './sidebar/boards-list';
export { ToolsList, type ToolsListProps } from './sidebar/tools-list';
export { MembersPreview, type MembersPreviewProps, type OnlineMember } from './sidebar/members-preview';

// Feed components
export { BoardHeader } from './feed/board-header';
export { MessageFeed } from './feed/message-feed';
export { MessageItem, type Message, type MessageReaction, type MessageAttachment } from './feed/message-item';
export { UnreadDivider } from './feed/unread-divider';
export { EventCard, type EventCardEvent } from './feed/event-card';
export { ToolCard, type ToolCardTool } from './feed/tool-card';
export { TypingIndicator } from './feed/typing-indicator';
export { ThreadPanel } from './feed/thread-panel';
export { AnalyticsPanel } from './analytics-panel';
export { SearchOverlay } from './search-overlay';
