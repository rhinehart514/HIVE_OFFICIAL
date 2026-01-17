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
 * Space type - determines templates, suggestions, AI context
 */
export type SpaceTypeDTO = 'uni' | 'student' | 'greek' | 'residential';

/**
 * Governance model - determines how roles work
 */
export type GovernanceModelDTO = 'flat' | 'emergent' | 'hybrid' | 'hierarchical';

/**
 * Space lifecycle status
 */
export type SpaceStatusDTO = 'unclaimed' | 'active' | 'claimed' | 'verified';

/**
 * Space source
 */
export type SpaceSourceDTO = 'ublinked' | 'user-created';

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
  /**
   * Space type - determines templates, suggestions, AI context
   */
  spaceType: SpaceTypeDTO;
  /**
   * Governance model - determines how roles work
   */
  governance: GovernanceModelDTO;
  /**
   * Lifecycle status (unclaimed, active, claimed, verified)
   */
  status: SpaceStatusDTO;
  /**
   * Source (ublinked, user-created)
   */
  source: SpaceSourceDTO;
  /**
   * External ID for pre-seeded spaces
   */
  externalId?: string;
  /**
   * Whether this space has an owner
   */
  hasOwner: boolean;
  /**
   * When the space was claimed (if applicable)
   */
  claimedAt?: Date;
  /**
   * Publishing status for stealth mode
   * - stealth: Space is being set up, only visible to leaders
   * - live: Space is publicly visible
   * - rejected: Leader request was rejected
   */
  publishStatus: 'stealth' | 'live' | 'rejected';
  /** Convenience flag: publishStatus === 'stealth' */
  isStealth: boolean;
  /** Convenience flag: publishStatus === 'live' */
  isLive: boolean;
  /** Convenience flag: status === 'unclaimed' || status === 'active' */
  isUnclaimed: boolean;
  /** Convenience flag: status === 'claimed' || status === 'verified' */
  isClaimed: boolean;
  /** When the space went live (if applicable) */
  wentLiveAt?: Date;
  createdAt: Date;
}

/**
 * Space DTO for browse/discovery endpoints
 * Includes: isJoined flag, trending data, simplified tabs/widgets
 *
 * COLD START SIGNALS (Jan 2026):
 * - upcomingEventCount: Shows value without chat activity
 * - nextEventAt/nextEventTitle: Creates urgency ("Tournament · Friday")
 * - mutualCount/mutualAvatars: Social proof ("2 friends are members")
 * - toolCount: Shows utility ("Has 5 tools")
 */
export interface SpaceBrowseDTO extends SpaceBaseDTO {
  postCount: number;
  trendingScore: number;
  lastActivityAt: Date | null;
  isJoined: boolean;
  tabs: TabSummaryDTO[];
  widgets: WidgetSummaryDTO[];

  // Cold start signals - show value without activity
  /** Number of upcoming events in this space */
  upcomingEventCount: number;
  /** When the next event starts (null if none) */
  nextEventAt: Date | null;
  /** Title of the next event (null if none) */
  nextEventTitle: string | null;
  /** Number of user's friends who are members */
  mutualCount: number;
  /** Avatar URLs of mutual friends (max 3) */
  mutualAvatars: string[];
  /** Number of tools deployed in this space */
  toolCount: number;
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
  /** Whether the space is currently active (separate from lifecycle status) */
  activationStatus: 'activated' | 'inactive';
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
 * Cold start enrichment data for browse endpoint
 * Passed to presenter to populate cold start signals
 */
export interface SpaceBrowseEnrichment {
  /** Map of spaceId -> upcoming event count */
  eventCounts: Map<string, number>;
  /** Map of spaceId -> next event info */
  nextEvents: Map<string, { title: string; startAt: Date }>;
  /** Map of spaceId -> mutual friend data */
  mutuals: Map<string, { count: number; avatars: string[] }>;
  /** Map of spaceId -> tool count */
  toolCounts: Map<string, number>;
}

/**
 * Space DTO with members loaded
 */
export interface SpaceWithMembersDTO extends SpaceDetailDTO {
  members: SpaceMemberDTO[];
}

/**
 * PlacedTool DTO for API responses
 * Represents a HiveLab tool deployed into a space
 */
export interface PlacedToolDTO {
  id: string;
  toolId: string;
  placement: 'sidebar' | 'inline' | 'modal' | 'tab';
  order: number;
  isActive: boolean;
  source: 'system' | 'leader' | 'member';
  placedBy: string | null;
  placedAt: string;
  configOverrides: Record<string, unknown>;
  visibility: 'all' | 'members' | 'leaders';
  titleOverride: string | null;
  isEditable: boolean;
  state: Record<string, unknown>;
  stateUpdatedAt: string | null;
  /** Version of the tool when placed */
  toolVersion: string | null;
  /** Whether the source tool has been updated since placement */
  isOutdated: boolean;
}

/**
 * Space DTO with PlacedTools loaded
 * Used by /api/spaces/[spaceId] and /api/spaces/[spaceId]/structure
 */
export interface SpaceWithToolsDTO extends SpaceDetailDTO {
  placedTools: PlacedToolDTO[];
}
