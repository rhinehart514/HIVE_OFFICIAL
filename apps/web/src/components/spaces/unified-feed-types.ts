export type FeedItemType = 'message' | 'post' | 'event' | 'tool';

export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  timestamp: string; // ISO 8601
}

export interface MessageItem extends BaseFeedItem {
  type: 'message';
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
  threadCount?: number;
}

export interface PostItem extends BaseFeedItem {
  type: 'post';
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title?: string;
  content: string;
  isPinned?: boolean;
  replyCount?: number;
}

export interface EventItem extends BaseFeedItem {
  type: 'event';
  eventId: string;
  title: string;
  description?: string;
  startDate: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  hostName?: string;
  hostAvatarUrl?: string;
}

export interface ToolItem extends BaseFeedItem {
  type: 'tool';
  toolId: string;
  placementId: string;
  name: string;
  description?: string;
  responseCount?: number;
  deployedBy: string;
}

export type FeedItem = MessageItem | PostItem | EventItem | ToolItem;
