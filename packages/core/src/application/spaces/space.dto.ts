/**
 * Space Response DTOs
 *
 * Standardized response types for Space API endpoints.
 * These DTOs decouple the API response format from the domain aggregate.
 */

/**
 * Tab summary for browse/list views (minimal data)
 */
export interface TabSummaryDTO {
  id: string;
  name: string;
  type: string;
  messageCount: number;
  isActive: boolean;
}

/**
 * Tab detail for single space view (full data)
 */
export interface TabDetailDTO {
  id: string;
  title: string;
  name: string;
  type: string;
  isDefault: boolean;
  order: number;
  messageCount: number;
  isArchived: boolean;
}

/**
 * Widget summary for browse/list views (minimal data)
 */
export interface WidgetSummaryDTO {
  id: string;
  type: string;
  title: string;
}

/**
 * Widget detail for single space view (full data)
 */
export interface WidgetDetailDTO {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
}

/**
 * Base space properties included in all responses
 */
export interface SpaceBaseDTO {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  isVerified: boolean;
  visibility: 'public' | 'private';
  createdAt: Date;
}

/**
 * Space DTO for browse/discovery endpoints
 * Includes: isJoined flag, trending data, simplified tabs/widgets
 */
export interface SpaceBrowseDTO extends SpaceBaseDTO {
  postCount: number;
  trendingScore: number;
  lastActivityAt: Date | null;
  isJoined: boolean;
  tabs: TabSummaryDTO[];
  widgets: WidgetSummaryDTO[];
}

/**
 * Space DTO for single space detail endpoint
 * Includes: full tabs/widgets, campus info, all timestamps
 */
export interface SpaceDetailDTO extends SpaceBaseDTO {
  campusId: string;
  postCount: number;
  trendingScore: number;
  updatedAt: Date;
  lastActivityAt: Date | null;
  tabs: TabDetailDTO[];
  widgets: WidgetDetailDTO[];
}

/**
 * Membership data for user's spaces
 */
export interface MembershipDTO {
  role: string;
  joinedAt: Date | null;
  lastVisited: Date;
  notifications: number;
  pinned: boolean;
}

/**
 * Activity summary for user's space view
 */
export interface SpaceActivityDTO {
  newPosts: number;
  newEvents: number;
  newMembers: number;
}

/**
 * Widget aggregated stats for user's space view
 */
export interface SpaceWidgetStatsDTO {
  posts: { recentCount: number; lastActivity: Date | null };
  events: { upcomingCount: number; nextEvent: Date | null };
  members: { activeCount: number; recentJoins: number };
  tools: { availableCount: number };
}

/**
 * Space DTO for user's joined spaces (/my endpoint)
 * Includes: membership data, activity metrics, widget stats
 */
export interface SpaceMembershipDTO extends SpaceBaseDTO {
  status: 'activated' | 'inactive';
  updatedAt: Date;
  tabCount: number;
  widgetCount: number;
  membership: MembershipDTO;
  activity: SpaceActivityDTO;
  widgetStats: SpaceWidgetStatsDTO;
}

/**
 * Space member DTO
 */
export interface SpaceMemberDTO {
  userId: string;
  role: string;
  joinedAt: Date;
}

/**
 * Space DTO with members loaded
 */
export interface SpaceWithMembersDTO extends SpaceDetailDTO {
  members: SpaceMemberDTO[];
}
