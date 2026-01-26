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
  // Branding / Visual identity
  iconURL?: string;
  coverImageURL?: string;
  creatorId?: string;  // Legacy field name
  createdBy?: string;  // Current field name in DB
  visibility: 'public' | 'private';
  // CampusLabs imported metadata
  email?: string;
  contactName?: string;
  orgTypeName?: string;
  foundedDate?: { toDate: () => Date } | Date | null;
  socialLinks?: {
    website?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  };
  sourceUrl?: string;
  /**
   * Space type - determines templates, suggestions, AI context
   */
  spaceType?: 'uni' | 'student' | 'greek' | 'residential';
  /**
   * Governance model - determines how roles work
   */
  governance?: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';
  /**
   * Lifecycle status (unclaimed, active, claimed, verified)
   */
  status?: 'unclaimed' | 'active' | 'claimed' | 'verified';
  /**
   * Source (ublinked, user-created)
   */
  source?: 'ublinked' | 'user-created';
  /**
   * External ID for pre-seeded spaces
   */
  externalId?: string;
  /**
   * When the space was claimed
   */
  claimedAt?: { toDate: () => Date } | null;
  /**
   * Publishing status for stealth mode
   * - stealth: Space is being set up, only visible to leaders
   * - live: Space is publicly visible (default for existing spaces)
   * - rejected: Leader request was rejected
   */
  publishStatus?: 'stealth' | 'live' | 'rejected';
  /** When the space went live (stealth → live) */
  wentLiveAt?: { toDate: () => Date } | null;
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
  // Branding / Visual identity
  iconURL?: string;
  coverImageURL?: string;
  creatorId?: string;  // Optional for unclaimed spaces
  visibility: 'public' | 'private';
  /** Space type */
  spaceType: 'uni' | 'student' | 'greek' | 'residential';
  /** Governance model */
  governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';
  /** Lifecycle status */
  status: 'unclaimed' | 'active' | 'claimed' | 'verified';
  /** Source */
  source: 'ublinked' | 'user-created';
  /** External ID for pre-seeded spaces */
  externalId?: string;
  /** When claimed */
  claimedAt: Date | null;
  /** Publishing status for stealth mode */
  publishStatus: 'stealth' | 'live' | 'rejected';
  /** When the space went live */
  wentLiveAt: Date | null;
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
    lastActivityAt: Date | null;
    expiresAt: Date | null;
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
  rushModeEndDate: Date | null;
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

      // Create ProfileId for creator (handle both field names) - optional for unclaimed spaces
      const creatorIdValue = data.createdBy || data.creatorId;
      let creatorProfileId: ProfileId | undefined;
      if (creatorIdValue) {
        const creatorIdResult = ProfileId.create(creatorIdValue);
        if (creatorIdResult.isSuccess) {
          creatorProfileId = creatorIdResult.getValue();
        }
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
        createdBy: creatorProfileId,  // Can be undefined for unclaimed spaces
        campusId: campusIdResult.getValue(),
        // Branding / Visual identity
        iconURL: data.iconURL,
        coverImageURL: data.coverImageURL,
        visibility: data.visibility === 'private' ? 'private' : 'public',
        spaceType: data.spaceType || 'student',
        governance: data.governance,
        source: data.source || 'user-created',
        externalId: data.externalId,
        publishStatus: data.publishStatus || 'live'
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

      // Set new fields
      if (data.status) space.setStatus(data.status);
      if (data.claimedAt) space.setClaimedAt(data.claimedAt.toDate());

      // Set publishing status (default to 'live' for existing spaces without this field)
      space.setPublishStatus(data.publishStatus || 'live');
      if (data.wentLiveAt) space.setWentLiveAt(data.wentLiveAt.toDate());

      // Hydrate CampusLabs imported metadata
      if (data.email) space.setEmail(data.email);
      if (data.contactName) space.setContactName(data.contactName);
      if (data.orgTypeName) space.setOrgTypeName(data.orgTypeName);
      if (data.foundedDate) {
        const date = typeof data.foundedDate === 'object' && 'toDate' in data.foundedDate
          ? data.foundedDate.toDate()
          : data.foundedDate instanceof Date ? data.foundedDate : null;
        if (date) space.setFoundedDate(date);
      }
      if (data.socialLinks) {
        // Filter out null values from socialLinks
        const cleanedLinks: Record<string, string> = {};
        for (const [key, value] of Object.entries(data.socialLinks)) {
          if (value) cleanedLinks[key] = value;
        }
        if (Object.keys(cleanedLinks).length > 0) {
          space.setSocialLinks(cleanedLinks as any);
        }
      }
      if (data.sourceUrl) space.setSourceUrl(data.sourceUrl);

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
      // Branding / Visual identity
      iconURL: space.iconURL,
      coverImageURL: space.coverImageURL,
      creatorId: space.owner?.value,  // Optional for unclaimed spaces
      visibility: space.isPublic ? 'public' : 'private',
      // New fields
      spaceType: space.spaceType,
      governance: space.governance,
      status: space.status,
      source: space.source,
      externalId: space.externalId,
      claimedAt: space.claimedAt || null,
      // Existing fields
      publishStatus: space.publishStatus,
      wentLiveAt: space.wentLiveAt || null,
      isVerified: space.isVerified,
      memberCount: space.memberCount,
      postCount: space.postCount,
      trendingScore: space.trendingScore,
      lastActivityAt: space.lastActivityAt || null,
      isActive: space.isActive,
      memberIds: space.members.map(m => m.profileId.value),
      // Only include moderationInfo if it exists (Firestore doesn't allow undefined)
      ...((space as any).props?.moderationInfo ? { moderationInfo: (space as any).props.moderationInfo } : {}),
      tabs: space.tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        name: tab.name,
        type: tab.type,
        originPostId: tab.originPostId || null,
        messageCount: tab.messageCount,
        createdAt: tab.createdAt,
        lastActivityAt: tab.lastActivityAt || null,
        expiresAt: tab.expiresAt || null,
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
      rushModeEndDate: space.rushMode?.endDate || null,
      // CampusLabs imported metadata (spread conditionally to avoid undefined fields)
      ...(space.email && { email: space.email }),
      ...(space.contactName && { contactName: space.contactName }),
      ...(space.orgTypeName && { orgTypeName: space.orgTypeName }),
      ...(space.foundedDate && { foundedDate: space.foundedDate }),
      ...(space.socialLinks && { socialLinks: space.socialLinks }),
      ...(space.sourceUrl && { sourceUrl: space.sourceUrl }),
    };
  }
}
