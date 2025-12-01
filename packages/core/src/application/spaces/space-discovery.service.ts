/**
 * SpaceDiscoveryService
 *
 * Application service for space discovery, search, filtering, and recommendations.
 * Complements SpaceManagementService which handles mutations.
 */

import { BaseApplicationService, ApplicationServiceContext, ServiceResult } from '../base.service';
import { Result } from '../../domain/shared/base/Result';
import { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
import { SpaceCategory, ApiCategoryEnum } from '../../domain/spaces/value-objects/space-category.value';
import { ISpaceRepository } from '../../infrastructure/repositories/interfaces';

/** Type alias for API category string */
type ApiCategory = 'student_org' | 'residential' | 'university_org' | 'greek_life';
import {
  SpaceBrowseDTO,
  SpaceDetailDTO,
  SpaceMembershipDTO,
  MembershipDTO,
} from './space.dto';
import {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTO,
} from './space.presenter';

/**
 * Input for browsing spaces
 */
export interface BrowseSpacesInput {
  /** Filter by category */
  category?: ApiCategory;
  /** Filter by space type */
  type?: string;
  /** Search term */
  searchTerm?: string;
  /** Sort order */
  sortBy?: 'trending' | 'recent' | 'popular' | 'alphabetical';
  /** Results per page */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Filter to only verified spaces */
  verifiedOnly?: boolean;
  /** Include private spaces (for admins) */
  includePrivate?: boolean;
}

/**
 * Paginated browse result
 */
export interface BrowseSpacesResult {
  spaces: SpaceBrowseDTO[];
  hasMore: boolean;
  nextCursor?: string;
  totalEstimate?: number;
}

/**
 * Input for searching spaces
 */
export interface SearchSpacesInput {
  query: string;
  category?: ApiCategory;
  limit?: number;
  cursor?: string;
}

/**
 * Input for getting recommended spaces
 */
export interface RecommendedSpacesInput {
  /** User's interests */
  interests?: string[];
  /** User's major */
  major?: string;
  /** Spaces to exclude (already joined) */
  excludeSpaceIds?: string[];
  /** Maximum results */
  limit?: number;
}

/**
 * Input for getting user's spaces
 */
export interface UserSpacesInput {
  /** Include inactive memberships */
  includeInactive?: boolean;
  /** Sort by last visited */
  sortByLastVisited?: boolean;
  /** Limit results */
  limit?: number;
}

/**
 * Callback for checking user membership
 */
export type CheckMembershipFn = (
  userId: string,
  spaceIds: string[]
) => Promise<Set<string>>;

/**
 * Callback for getting membership details
 */
export type GetMembershipsFn = (
  userId: string,
  spaceIds: string[]
) => Promise<Map<string, MembershipDTO>>;

/**
 * SpaceDiscoveryService
 *
 * Handles all read/query operations for spaces:
 * - Browse with filters
 * - Search
 * - Recommendations
 * - User's spaces
 * - Single space details
 */
export class SpaceDiscoveryService extends BaseApplicationService {
  private repository: ISpaceRepository;
  private checkMembership?: CheckMembershipFn;
  private getMemberships?: GetMembershipsFn;

  constructor(
    repository: ISpaceRepository,
    context?: Partial<ApplicationServiceContext>,
    callbacks?: {
      checkMembership?: CheckMembershipFn;
      getMemberships?: GetMembershipsFn;
    }
  ) {
    super(context);
    this.repository = repository;
    this.checkMembership = callbacks?.checkMembership;
    this.getMemberships = callbacks?.getMemberships;
  }

  /**
   * Browse spaces with filters and pagination
   */
  async browse(input: BrowseSpacesInput): Promise<Result<BrowseSpacesResult>> {
    return this.execute(async () => {
      const {
        category,
        type,
        searchTerm,
        sortBy = 'popular',
        limit = 20,
        cursor,
        verifiedOnly = false,
        includePrivate = false,
      } = input;

      // Map sort option to repository orderBy
      const orderByMap: Record<string, 'createdAt' | 'name_lowercase' | 'memberCount'> = {
        trending: 'memberCount', // TODO: Add trendingScore to orderBy options
        recent: 'createdAt',
        popular: 'memberCount',
        alphabetical: 'name_lowercase',
      };

      const orderDirectionMap: Record<string, 'asc' | 'desc'> = {
        trending: 'desc',
        recent: 'desc',
        popular: 'desc',
        alphabetical: 'asc',
      };

      // Convert API category to domain category if provided
      let domainType: string | undefined;
      if (category) {
        const categoryResult = SpaceCategory.createFromApi(category);
        if (categoryResult.isSuccess) {
          domainType = categoryResult.getValue().value;
        }
      }

      // Query repository
      const result = await this.repository.findWithPagination({
        campusId: this.context.campusId,
        type: type || domainType,
        searchTerm,
        limit,
        cursor,
        orderBy: orderByMap[sortBy],
        orderDirection: orderDirectionMap[sortBy],
      });

      if (result.isFailure) {
        return Result.fail<BrowseSpacesResult>(result.error ?? 'Operation failed');
      }

      let { spaces, hasMore, nextCursor } = result.getValue();

      // Apply post-query filters
      if (verifiedOnly) {
        spaces = spaces.filter(s => s.isVerified);
      }

      if (!includePrivate) {
        spaces = spaces.filter(s => s.isPublic);
      }

      // Check membership status if user is authenticated
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      // Transform to DTOs
      const spaceDTOs = toSpaceBrowseDTOList(spaces, joinedSpaceIds);

      return Result.ok<BrowseSpacesResult>({
        spaces: spaceDTOs,
        hasMore,
        nextCursor,
      });
    }, 'SpaceDiscoveryService.browse');
  }

  /**
   * Search spaces by query
   */
  async search(input: SearchSpacesInput): Promise<Result<BrowseSpacesResult>> {
    return this.execute(async () => {
      const { query, category, limit = 20 } = input;

      if (!query || query.trim().length < 2) {
        return Result.fail<BrowseSpacesResult>('Search query must be at least 2 characters');
      }

      // Search via repository
      const result = await this.repository.searchSpaces(query, this.context.campusId);

      if (result.isFailure) {
        return Result.fail<BrowseSpacesResult>(result.error ?? 'Operation failed');
      }

      let spaces = result.getValue();

      // Filter by category if provided
      if (category) {
        const categoryResult = SpaceCategory.createFromApi(category);
        if (categoryResult.isSuccess) {
          const domainCategory = categoryResult.getValue().value;
          spaces = spaces.filter(s => s.category.value === domainCategory);
        }
      }

      // Limit results
      spaces = spaces.slice(0, limit);

      // Check membership status
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      // Transform to DTOs
      const spaceDTOs = toSpaceBrowseDTOList(spaces, joinedSpaceIds);

      return Result.ok<BrowseSpacesResult>({
        spaces: spaceDTOs,
        hasMore: false, // Search doesn't support pagination yet
        nextCursor: undefined,
      });
    }, 'SpaceDiscoveryService.search');
  }

  /**
   * Get recommended spaces for user
   */
  async getRecommendations(input: RecommendedSpacesInput): Promise<Result<SpaceBrowseDTO[]>> {
    return this.execute(async () => {
      const { interests = [], major, excludeSpaceIds = [], limit = 10 } = input;

      // Get recommendations from repository
      const result = await this.repository.findRecommended(
        this.context.campusId,
        interests,
        major
      );

      if (result.isFailure) {
        return Result.fail<SpaceBrowseDTO[]>(result.error ?? 'Operation failed');
      }

      let spaces = result.getValue();

      // Filter out excluded spaces (already joined)
      const excludeSet = new Set(excludeSpaceIds);
      spaces = spaces.filter(s => !excludeSet.has(s.spaceId.value));

      // Limit results
      spaces = spaces.slice(0, limit);

      // Check membership (should all be false since we excluded joined)
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      // Transform to DTOs
      const spaceDTOs = toSpaceBrowseDTOList(spaces, joinedSpaceIds);

      return Result.ok<SpaceBrowseDTO[]>(spaceDTOs);
    }, 'SpaceDiscoveryService.getRecommendations');
  }

  /**
   * Get trending spaces
   */
  async getTrending(limit: number = 10): Promise<Result<SpaceBrowseDTO[]>> {
    return this.execute(async () => {
      const result = await this.repository.findTrending(this.context.campusId, limit);

      if (result.isFailure) {
        return Result.fail<SpaceBrowseDTO[]>(result.error ?? 'Operation failed');
      }

      const spaces = result.getValue();

      // Check membership
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      const spaceDTOs = toSpaceBrowseDTOList(spaces, joinedSpaceIds);
      return Result.ok<SpaceBrowseDTO[]>(spaceDTOs);
    }, 'SpaceDiscoveryService.getTrending');
  }

  /**
   * Get spaces by category
   */
  async getByCategory(category: ApiCategory, limit: number = 20): Promise<Result<SpaceBrowseDTO[]>> {
    return this.execute(async () => {
      // Convert API category to domain category
      const categoryResult = SpaceCategory.createFromApi(category);
      if (categoryResult.isFailure) {
        return Result.fail<SpaceBrowseDTO[]>(`Invalid category: ${category}`);
      }

      const domainCategory = categoryResult.getValue();
      const result = await this.repository.findByCategory(
        domainCategory.value,
        this.context.campusId
      );

      if (result.isFailure) {
        return Result.fail<SpaceBrowseDTO[]>(result.error ?? 'Operation failed');
      }

      const spaces = result.getValue().slice(0, limit);

      // Check membership
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      const spaceDTOs = toSpaceBrowseDTOList(spaces, joinedSpaceIds);
      return Result.ok<SpaceBrowseDTO[]>(spaceDTOs);
    }, 'SpaceDiscoveryService.getByCategory');
  }

  /**
   * Get single space by ID
   */
  async getById(spaceId: string): Promise<Result<SpaceDetailDTO>> {
    return this.execute(async () => {
      const result = await this.repository.findById(spaceId);

      if (result.isFailure) {
        return Result.fail<SpaceDetailDTO>(result.error ?? 'Operation failed');
      }

      const space = result.getValue();

      // Check campus isolation
      if (space.campusId.id !== this.context.campusId) {
        return Result.fail<SpaceDetailDTO>('Space not found in your campus');
      }

      // Check visibility (private spaces require membership)
      if (!space.isPublic && this.context.userId) {
        // TODO: Check if user is a member before allowing access
      }

      return Result.ok<SpaceDetailDTO>(toSpaceDetailDTO(space));
    }, 'SpaceDiscoveryService.getById');
  }

  /**
   * Get single space by slug
   */
  async getBySlug(slug: string): Promise<Result<SpaceDetailDTO>> {
    return this.execute(async () => {
      const result = await this.repository.findBySlug(slug, this.context.campusId);

      if (result.isFailure) {
        return Result.fail<SpaceDetailDTO>(result.error ?? 'Operation failed');
      }

      const space = result.getValue();
      return Result.ok<SpaceDetailDTO>(toSpaceDetailDTO(space));
    }, 'SpaceDiscoveryService.getBySlug');
  }

  /**
   * Get user's joined spaces
   */
  async getUserSpaces(input: UserSpacesInput = {}): Promise<Result<SpaceMembershipDTO[]>> {
    return this.execute(async () => {
      const userValidation = this.validateUserContext();
      if (userValidation.isFailure) {
        return Result.fail<SpaceMembershipDTO[]>(userValidation.error ?? 'User context required');
      }

      const { includeInactive = false, limit = 100 } = input;

      // Get user's spaces from repository
      const result = await this.repository.findUserSpaces(this.context.userId!);

      if (result.isFailure) {
        return Result.fail<SpaceMembershipDTO[]>(result.error ?? 'Operation failed');
      }

      let spaces = result.getValue();

      // Filter inactive if needed
      if (!includeInactive) {
        spaces = spaces.filter(s => s.isActive);
      }

      // Limit results
      spaces = spaces.slice(0, limit);

      // Get membership details
      if (!this.getMemberships) {
        // Return basic DTOs without membership details
        return Result.ok<SpaceMembershipDTO[]>(
          spaces.map(space => toSpaceMembershipDTO(space, {
            role: 'member',
            joinedAt: null,
            lastVisited: new Date(),
            notifications: 0,
            pinned: false,
          }))
        );
      }

      const spaceIds = spaces.map(s => s.spaceId.value);
      const membershipMap = await this.getMemberships(this.context.userId!, spaceIds);

      // Transform to DTOs
      const spaceDTOs = spaces
        .filter(space => membershipMap.has(space.spaceId.value))
        .map(space => {
          const membership = membershipMap.get(space.spaceId.value)!;
          return toSpaceMembershipDTO(space, membership);
        });

      return Result.ok<SpaceMembershipDTO[]>(spaceDTOs);
    }, 'SpaceDiscoveryService.getUserSpaces');
  }

  /**
   * Get space tabs
   */
  async getSpaceTabs(spaceId: string): Promise<Result<EnhancedSpace['tabs']>> {
    return this.execute(async () => {
      const result = await this.repository.findById(spaceId);

      if (result.isFailure) {
        return Result.fail<EnhancedSpace['tabs']>(result.error ?? 'Operation failed');
      }

      const space = result.getValue();

      // Check campus isolation
      if (space.campusId.id !== this.context.campusId) {
        return Result.fail<EnhancedSpace['tabs']>('Space not found in your campus');
      }

      return Result.ok<EnhancedSpace['tabs']>(space.tabs);
    }, 'SpaceDiscoveryService.getSpaceTabs');
  }

  /**
   * Get space widgets
   */
  async getSpaceWidgets(spaceId: string, tabId?: string): Promise<Result<EnhancedSpace['widgets']>> {
    return this.execute(async () => {
      const result = await this.repository.findById(spaceId);

      if (result.isFailure) {
        return Result.fail<EnhancedSpace['widgets']>(result.error ?? 'Operation failed');
      }

      const space = result.getValue();

      // Check campus isolation
      if (space.campusId.id !== this.context.campusId) {
        return Result.fail<EnhancedSpace['widgets']>('Space not found in your campus');
      }

      let widgets = space.widgets;

      // Filter by tab if provided
      // Tab-widget relationship is stored in Tab's widgets array (widget IDs)
      if (tabId) {
        const tab = space.tabs.find(t => t.id === tabId);
        if (tab) {
          const tabWidgetIds = new Set(tab.widgets);
          widgets = widgets.filter(w => tabWidgetIds.has(w.id));
        } else {
          widgets = []; // Tab not found, return empty
        }
      }

      return Result.ok<EnhancedSpace['widgets']>(widgets);
    }, 'SpaceDiscoveryService.getSpaceWidgets');
  }

  /**
   * Get full space structure (space + tabs + widgets)
   */
  async getSpaceStructure(spaceId: string): Promise<Result<{
    space: SpaceDetailDTO;
    tabs: EnhancedSpace['tabs'];
    widgets: EnhancedSpace['widgets'];
  }>> {
    return this.execute(async () => {
      const result = await this.repository.findById(spaceId);

      if (result.isFailure) {
        return Result.fail<{ space: SpaceDetailDTO; tabs: EnhancedSpace['tabs']; widgets: EnhancedSpace['widgets']; }>(result.error ?? 'Space not found');
      }

      const space = result.getValue();

      // Check campus isolation
      if (space.campusId.id !== this.context.campusId) {
        return Result.fail<{ space: SpaceDetailDTO; tabs: EnhancedSpace['tabs']; widgets: EnhancedSpace['widgets']; }>('Space not found in your campus');
      }

      return Result.ok({
        space: toSpaceDetailDTO(space),
        tabs: space.tabs,
        widgets: space.widgets,
      });
    }, 'SpaceDiscoveryService.getSpaceStructure');
  }

  /**
   * Check if a slug is available
   */
  async isSlugAvailable(slug: string): Promise<Result<boolean>> {
    return this.execute(async () => {
      const result = await this.repository.findBySlug(slug, this.context.campusId);

      // If error or not found (null), slug is available
      if (result.isFailure || result.getValue() === null) {
        return Result.ok<boolean>(true);
      }

      // Found existing space with this slug
      return Result.ok<boolean>(false);
    }, 'SpaceDiscoveryService.isSlugAvailable');
  }
}

/**
 * Factory function for creating SpaceDiscoveryService
 */
export function createSpaceDiscoveryService(
  repository: ISpaceRepository,
  context?: Partial<ApplicationServiceContext>,
  callbacks?: {
    checkMembership?: CheckMembershipFn;
    getMemberships?: GetMembershipsFn;
  }
): SpaceDiscoveryService {
  return new SpaceDiscoveryService(repository, context, callbacks);
}
