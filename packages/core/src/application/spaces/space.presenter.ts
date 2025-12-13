/**
 * Space Presenter
 *
 * Transforms EnhancedSpace domain aggregate into response DTOs.
 * Centralizes all space-to-DTO transformations for consistent API responses.
 */

import type { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
import type {
  SpaceBaseDTO,
  SpaceBrowseDTO,
  SpaceDetailDTO,
  SpaceMembershipDTO,
  SpaceWithMembersDTO,
  SpaceWithToolsDTO,
  MembershipDTO,
  TabSummaryDTO,
  TabDetailDTO,
  WidgetSummaryDTO,
  WidgetDetailDTO,
  SpaceMemberDTO,
  PlacedToolDTO,
} from './space.dto';
import type { PlacedTool } from '../../domain/spaces/entities/placed-tool';

/**
 * Extract base properties common to all space DTOs
 */
function toBaseDTO(space: EnhancedSpace): SpaceBaseDTO {
  return {
    id: space.spaceId.value,
    name: space.name.value,
    slug: space.slug?.value,
    description: space.description.value,
    category: space.category.value,
    memberCount: space.memberCount,
    isVerified: space.isVerified,
    visibility: space.isPublic ? 'public' : 'private',
    publishStatus: space.publishStatus,
    isStealth: space.isStealth,
    isLive: space.isLive,
    wentLiveAt: space.wentLiveAt,
    createdAt: space.createdAt,
  };
}

/**
 * Transform tab to summary format (for browse views)
 */
function toTabSummary(tab: EnhancedSpace['tabs'][0]): TabSummaryDTO {
  return {
    id: tab.id,
    name: tab.name,
    type: tab.type,
    messageCount: tab.messageCount,
    isActive: !tab.isArchived,
  };
}

/**
 * Transform tab to detail format (for single space view)
 */
function toTabDetail(tab: EnhancedSpace['tabs'][0]): TabDetailDTO {
  return {
    id: tab.id,
    title: tab.title,
    name: tab.name,
    type: tab.type,
    isDefault: tab.isDefault,
    order: tab.order,
    messageCount: tab.messageCount,
    isArchived: tab.isArchived,
  };
}

/**
 * Transform widget to summary format (for browse views)
 */
function toWidgetSummary(widget: EnhancedSpace['widgets'][0]): WidgetSummaryDTO {
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
  };
}

/**
 * Transform widget to detail format (for single space view)
 */
function toWidgetDetail(widget: EnhancedSpace['widgets'][0]): WidgetDetailDTO {
  return {
    id: widget.id,
    type: widget.type,
    title: widget.title,
    config: widget.config,
  };
}

/**
 * Transform EnhancedSpace to browse/discovery DTO
 *
 * Used by: /api/spaces/browse-v2, /api/spaces/recommended, /api/spaces/search
 *
 * @param space - EnhancedSpace aggregate
 * @param isJoined - Whether the current user is a member
 */
export function toSpaceBrowseDTO(space: EnhancedSpace, isJoined: boolean): SpaceBrowseDTO {
  return {
    ...toBaseDTO(space),
    postCount: space.postCount,
    trendingScore: space.trendingScore,
    lastActivityAt: space.lastActivityAt,
    isJoined,
    tabs: space.tabs.map(toTabSummary),
    widgets: space.widgets
      .filter(w => w.isEnabled)
      .map(toWidgetSummary),
  };
}

/**
 * Transform EnhancedSpace to single space detail DTO
 *
 * Used by: /api/spaces/[spaceId]
 *
 * @param space - EnhancedSpace aggregate
 */
export function toSpaceDetailDTO(space: EnhancedSpace): SpaceDetailDTO {
  return {
    ...toBaseDTO(space),
    campusId: space.campusId.id,
    postCount: space.postCount,
    trendingScore: space.trendingScore,
    updatedAt: space.updatedAt,
    lastActivityAt: space.lastActivityAt,
    tabs: space.tabs.map(toTabDetail),
    widgets: space.widgets
      .filter(w => w.isEnabled)
      .map(toWidgetDetail),
  };
}

/**
 * Transform EnhancedSpace to user's membership view DTO
 *
 * Used by: /api/spaces/my, /api/profile/my-spaces
 *
 * @param space - EnhancedSpace aggregate
 * @param membership - User's membership data from spaceMembers collection
 */
export function toSpaceMembershipDTO(
  space: EnhancedSpace,
  membership: MembershipDTO
): SpaceMembershipDTO {
  return {
    ...toBaseDTO(space),
    status: space.isActive ? 'activated' : 'inactive',
    updatedAt: space.updatedAt,
    tabCount: space.tabs.length,
    widgetCount: space.widgets.length,
    membership,
    activity: {
      newPosts: 0, // TODO: Calculate from activity metrics
      newEvents: 0,
      newMembers: 0,
    },
    widgetStats: {
      posts: { recentCount: 0, lastActivity: null },
      events: { upcomingCount: 0, nextEvent: null },
      members: { activeCount: space.memberCount, recentJoins: 0 },
      tools: { availableCount: space.widgets.filter(w => w.isEnabled).length },
    },
  };
}

/**
 * Transform EnhancedSpace to detail DTO with members
 *
 * Used by: /api/spaces/[spaceId] with ?include=members
 *
 * @param space - EnhancedSpace aggregate with members loaded
 */
export function toSpaceWithMembersDTO(space: EnhancedSpace): SpaceWithMembersDTO {
  return {
    ...toSpaceDetailDTO(space),
    members: space.members.map((member): SpaceMemberDTO => ({
      userId: member.profileId.id,
      role: member.role,
      joinedAt: member.joinedAt,
    })),
  };
}

/**
 * Transform PlacedTool entity to DTO
 */
function toPlacedToolDTO(tool: PlacedTool): PlacedToolDTO {
  return {
    id: tool.id,
    toolId: tool.toolId,
    placement: tool.placement,
    order: tool.order,
    isActive: tool.isActive,
    source: tool.source,
    placedBy: tool.placedBy,
    placedAt: tool.placedAt.toISOString(),
    configOverrides: tool.configOverrides,
    visibility: tool.visibility,
    titleOverride: tool.titleOverride,
    isEditable: tool.isEditable,
    state: tool.state,
    stateUpdatedAt: tool.stateUpdatedAt?.toISOString() ?? null,
  };
}

/**
 * Transform EnhancedSpace to detail DTO with PlacedTools
 *
 * Used by: /api/spaces/[spaceId] when PlacedTools are loaded
 *
 * @param space - EnhancedSpace aggregate with placedTools loaded
 */
export function toSpaceWithToolsDTO(space: EnhancedSpace): SpaceWithToolsDTO {
  return {
    ...toSpaceDetailDTO(space),
    placedTools: space.placedTools.map(toPlacedToolDTO),
  };
}

/**
 * Batch transform spaces to browse DTOs
 *
 * Efficiently transforms multiple spaces with a set of joined space IDs.
 *
 * @param spaces - Array of EnhancedSpace aggregates
 * @param joinedSpaceIds - Set of space IDs the user has joined
 */
export function toSpaceBrowseDTOList(
  spaces: EnhancedSpace[],
  joinedSpaceIds: Set<string>
): SpaceBrowseDTO[] {
  return spaces.map(space =>
    toSpaceBrowseDTO(space, joinedSpaceIds.has(space.spaceId.value))
  );
}

/**
 * Batch transform spaces to membership DTOs
 *
 * @param spaces - Array of EnhancedSpace aggregates
 * @param membershipMap - Map of spaceId -> MembershipDTO
 */
export function toSpaceMembershipDTOList(
  spaces: EnhancedSpace[],
  membershipMap: Map<string, MembershipDTO>
): SpaceMembershipDTO[] {
  return spaces
    .filter(space => membershipMap.has(space.spaceId.value))
    .map(space => {
      const membership = membershipMap.get(space.spaceId.value)!;
      return toSpaceMembershipDTO(space, membership);
    });
}
