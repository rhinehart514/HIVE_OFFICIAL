/**
 * SpaceMapper - Shared domain mapping for Space entities
 *
 * Used by both client-side and admin-side Space repositories
 * to ensure consistent domain ↔ persistence mapping.
 */

import { Result } from '../../../domain/shared/base/Result';
import { EnhancedSpace } from '../../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../../domain/spaces/value-objects/space-id.value';
import { SpaceName } from '../../../domain/spaces/value-objects/space-name.value';
import { SpaceSlug } from '../../../domain/spaces/value-objects/space-slug.value';
import { SpaceDescription } from '../../../domain/spaces/value-objects/space-description.value';
import { SpaceCategory } from '../../../domain/spaces/value-objects/space-category.value';
import { CampusId } from '../../../domain/profile/value-objects/campus-id.value';
import { ProfileId } from '../../../domain/profile/value-objects/profile-id.value';
import { Tab } from '../../../domain/spaces/entities/tab';
import { Widget } from '../../../domain/spaces/entities/widget';

/**
 * Space document structure in Firestore
 */
export interface SpaceDocument {
  name: string;
  name_lowercase?: string;
  slug?: string;
  description: string;
  category: string;
  campusId: string;
  creatorId?: string;  // Legacy field name
  createdBy?: string;  // Current field name in DB
  visibility: 'public' | 'private';
  isVerified?: boolean;
  memberCount?: number;
  postCount?: number;
  trendingScore?: number;
  lastActivityAt?: { toDate: () => Date } | null;
  createdAt?: { toDate: () => Date } | null;
  updatedAt?: { toDate: () => Date } | null;
  isActive?: boolean;
  memberIds?: string[];
  tabs?: TabDocument[];
  widgets?: WidgetDocument[];
  tags?: string[];
  rushModeEnabled?: boolean;
  rushModeEndDate?: Date;
}

interface TabDocument {
  id?: string;
  title?: string;
  name?: string;
  type?: string;
  isDefault?: boolean;
  order?: number;
  widgets?: string[];
  isVisible?: boolean;
  originPostId?: string;
  messageCount?: number;
  createdAt?: { toDate: () => Date };
  lastActivityAt?: { toDate: () => Date };
  expiresAt?: { toDate: () => Date };
  isArchived?: boolean;
}

interface WidgetDocument {
  id?: string;
  type: 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';
  title?: string;
  config?: Record<string, unknown>;
  isVisible?: boolean;
  order?: number;
  position?: { x: number; y: number; width: number; height: number };
  isEnabled?: boolean;
}

/**
 * Persistence document structure (what gets saved)
 */
export interface SpacePersistenceData {
  name: string;
  name_lowercase: string;
  slug?: string;
  description: string;
  category: string;
  campusId: string;
  creatorId: string;
  visibility: 'public' | 'private';
  isVerified: boolean;
  memberCount: number;
  postCount: number;
  trendingScore: number;
  lastActivityAt: Date | null;
  isActive: boolean;
  memberIds: string[];
  tabs: Array<{
    id: string;
    title: string;
    name: string;
    type: string;
    originPostId: string | null;
    messageCount: number;
    createdAt: Date;
    lastActivityAt: Date | undefined;
    expiresAt: Date | undefined;
    isArchived: boolean;
    isDefault: boolean;
    order: number;
    widgets: string[];
    isVisible: boolean;
  }>;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    config: Record<string, unknown>;
    position: { x: number; y: number; width: number; height: number };
    isEnabled: boolean;
  }>;
  tags: string[];
  rushModeEnabled: boolean;
  rushModeEndDate: Date | undefined;
  // Admin moderation fields
  moderationInfo?: {
    disabledAt?: Date;
    disabledBy?: string;
    disableReason?: string;
    enabledAt?: Date;
    enabledBy?: string;
    verifiedAt?: Date;
    verifiedBy?: string;
    unverifiedAt?: Date;
    unverifiedBy?: string;
    unverifyReason?: string;
  };
}

export class SpaceMapper {
  /**
   * Map Firestore document to EnhancedSpace domain aggregate
   */
  static async toDomain(id: string, data: SpaceDocument): Promise<Result<EnhancedSpace>> {
    try {
      // Create value objects
      const nameResult = SpaceName.create(data.name);
      if (nameResult.isFailure) {
        return Result.fail<EnhancedSpace>(nameResult.error!);
      }

      const descriptionResult = SpaceDescription.create(data.description);
      if (descriptionResult.isFailure) {
        return Result.fail<EnhancedSpace>(descriptionResult.error!);
      }

      const categoryResult = SpaceCategory.create(data.category);
      if (categoryResult.isFailure) {
        return Result.fail<EnhancedSpace>(categoryResult.error!);
      }

      const campusIdResult = CampusId.create(data.campusId);
      if (campusIdResult.isFailure) {
        return Result.fail<EnhancedSpace>(campusIdResult.error!);
      }

      // Create ProfileId for creator (handle both field names)
      const creatorIdValue = data.createdBy || data.creatorId || 'unknown';
      const creatorIdResult = ProfileId.create(creatorIdValue);
      if (creatorIdResult.isFailure) {
        return Result.fail<EnhancedSpace>(creatorIdResult.error!);
      }

      // Create SpaceId
      const spaceIdResult = SpaceId.create(id);
      if (spaceIdResult.isFailure) {
        return Result.fail<EnhancedSpace>(spaceIdResult.error!);
      }

      // Parse slug if present
      let slug: SpaceSlug | undefined;
      if (data.slug) {
        const slugResult = SpaceSlug.create(data.slug);
        if (slugResult.isSuccess) {
          slug = slugResult.getValue();
        }
      }

      // Create space aggregate
      const spaceResult = EnhancedSpace.create({
        spaceId: spaceIdResult.getValue(),
        name: nameResult.getValue(),
        slug,
        description: descriptionResult.getValue(),
        category: categoryResult.getValue(),
        createdBy: creatorIdResult.getValue(),
        campusId: campusIdResult.getValue(),
        visibility: data.visibility === 'private' ? 'private' : 'public'
      });

      if (spaceResult.isFailure) {
        return Result.fail<EnhancedSpace>(spaceResult.error!);
      }

      const space = spaceResult.getValue();

      // Set additional properties using setters
      space.setIsVerified(data.isVerified || false);
      space.setMemberCount(data.memberCount || 0);
      space.setPostCount(data.postCount || 0);
      space.setTrendingScore(data.trendingScore || 0);
      space.setLastActivityAt(data.lastActivityAt?.toDate() || new Date());
      if (data.createdAt) space.setCreatedAt(data.createdAt.toDate());
      if (data.updatedAt) space.setUpdatedAt(data.updatedAt.toDate());

      // Load tabs
      if (data.tabs && Array.isArray(data.tabs)) {
        const tabs = data.tabs.map((tabData: TabDocument) => {
          const tab = Tab.create({
            name: tabData.title || tabData.name || 'Untitled',
            type: (tabData.type as 'feed' | 'widget' | 'resource' | 'custom') || 'feed',
            isDefault: tabData.isDefault || false,
            order: tabData.order || 0,
            widgets: tabData.widgets || [],
            isVisible: tabData.isVisible !== false,
            title: tabData.title || tabData.name || 'Untitled',
            originPostId: tabData.originPostId,
            messageCount: tabData.messageCount || 0,
            createdAt: tabData.createdAt?.toDate() || new Date(),
            lastActivityAt: tabData.lastActivityAt?.toDate(),
            expiresAt: tabData.expiresAt?.toDate(),
            isArchived: tabData.isArchived || false
          }, tabData.id);
          return tab.isSuccess ? tab.getValue() : null;
        }).filter(Boolean);
        space.setTabs(tabs as Tab[]);
      }

      // Load widgets
      if (data.widgets && Array.isArray(data.widgets)) {
        const widgets = data.widgets.map((widgetData: WidgetDocument) => {
          const widget = Widget.create({
            type: widgetData.type,
            title: widgetData.title || widgetData.type,
            config: widgetData.config || {},
            isVisible: widgetData.isVisible,
            order: widgetData.order,
            position: widgetData.position,
            isEnabled: widgetData.isEnabled
          }, widgetData.id);
          return widget.isSuccess ? widget.getValue() : null;
        }).filter(Boolean);
        space.setWidgets(widgets as Widget[]);
      }

      return Result.ok<EnhancedSpace>(space);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to map to domain: ${error}`);
    }
  }

  /**
   * Map EnhancedSpace domain aggregate to persistence data
   * Note: Caller is responsible for converting Date to appropriate Timestamp
   */
  static toPersistence(space: EnhancedSpace): SpacePersistenceData {
    return {
      name: space.name.name,
      name_lowercase: space.name.name.toLowerCase(),
      slug: space.slug?.value,
      description: space.description.value,
      category: space.category.value,
      campusId: space.campusId.id,
      creatorId: space.owner.value,
      visibility: space.isPublic ? 'public' : 'private',
      isVerified: space.isVerified,
      memberCount: space.memberCount,
      postCount: space.postCount,
      trendingScore: space.trendingScore,
      lastActivityAt: space.lastActivityAt || null,
      isActive: space.isActive,
      memberIds: space.members.map(m => m.profileId.value),
      moderationInfo: (space as any).props?.moderationInfo,
      tabs: space.tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        name: tab.name,
        type: tab.type,
        originPostId: tab.originPostId || null,
        messageCount: tab.messageCount,
        createdAt: tab.createdAt,
        lastActivityAt: tab.lastActivityAt,
        expiresAt: tab.expiresAt,
        isArchived: tab.isArchived,
        isDefault: tab.isDefault,
        order: tab.order,
        widgets: tab.widgets,
        isVisible: tab.isVisible
      })),
      widgets: space.widgets.map(widget => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        config: widget.config,
        position: widget.position,
        isEnabled: widget.isEnabled
      })),
      tags: [],
      rushModeEnabled: space.rushMode?.isActive || false,
      rushModeEndDate: space.rushMode?.endDate
    };
  }
}
