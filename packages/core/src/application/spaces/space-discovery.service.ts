/**
 * SpaceDiscoveryService
 *
 * Application service for space discovery, search, filtering, and recommendations.
 * Complements SpaceManagementService which handles mutations.
 */

import { BaseApplicationService, ApplicationServiceContext, ServiceResult } from '../base.service';
import { Result } from '../../domain/shared/base/Result';
import { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
import { SpaceCategory, SpaceCategoryEnum } from '../../domain/spaces/value-objects/space-category.value';
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
  /** IDs of user's friends/connections */
  friendIds?: string[];
}

/**
 * Recommendation score breakdown for a space
 */
export interface SpaceRecommendationScore {
  spaceId: string;
  totalScore: number;
  /** How well the space matches user's comfort zone (interests, major, category) */
  anxietyRelief: number;
  /** How many friends are in the space + popularity signals */
  socialProof: number;
  /** Exclusivity value (invite-only, verified, limited membership) */
  insiderAccess: number;
}

/**
 * Weights for the 3-factor recommendation algorithm
 * SpaceRecommendationScore = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
 */
const RECOMMENDATION_WEIGHTS = {
  anxietyRelief: 0.4,
  socialProof: 0.3,
  insiderAccess: 0.3,
} as const;

/**
 * Category affinity mapping - which categories are related to reduce anxiety
 */
const CATEGORY_AFFINITY: Record<string, string[]> = {
  'student_org': ['university_org', 'greek_life'],
  'residential': ['university_org'],
  'university_org': ['student_org', 'residential'],
  'greek_life': ['student_org'],
};

/**
 * Interest to category mapping
 */
const INTEREST_CATEGORY_MAP: Record<string, string[]> = {
  'leadership': ['student_org', 'greek_life'],
  'community': ['residential', 'student_org'],
  'academics': ['university_org', 'student_org'],
  'social': ['greek_life', 'student_org', 'residential'],
  'professional': ['student_org', 'university_org'],
  'arts': ['student_org'],
  'sports': ['student_org', 'greek_life'],
  'technology': ['student_org', 'university_org'],
  'volunteering': ['student_org', 'university_org'],
  'music': ['student_org'],
  'gaming': ['student_org'],
  'fitness': ['student_org'],
};

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
 * Callback for getting friends who are members of spaces
 */
export type GetFriendsInSpacesFn = (
  friendIds: string[],
  spaceIds: string[]
) => Promise<Map<string, string[]>>; // spaceId -> [friendId1, friendId2, ...]

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
  private getFriendsInSpaces?: GetFriendsInSpacesFn;

  constructor(
    repository: ISpaceRepository,
    context?: Partial<ApplicationServiceContext>,
    callbacks?: {
      checkMembership?: CheckMembershipFn;
      getMemberships?: GetMembershipsFn;
      getFriendsInSpaces?: GetFriendsInSpacesFn;
    }
  ) {
    super(context);
    this.repository = repository;
    this.checkMembership = callbacks?.checkMembership;
    this.getMemberships = callbacks?.getMemberships;
    this.getFriendsInSpaces = callbacks?.getFriendsInSpaces;
  }

  /**
   * Calculate anxiety relief score (0-1)
   * Higher score = user will feel more comfortable joining
   */
  private calculateAnxietyRelief(
    space: EnhancedSpace,
    interests: string[],
    major?: string
  ): number {
    let score = 0;
    let factors = 0;

    // Factor 1: Interest category match (40% of anxiety relief)
    if (interests.length > 0) {
      const spaceCategory = space.category.value;
      let interestMatchCount = 0;

      for (const interest of interests) {
        const normalizedInterest = interest.toLowerCase().replace(/[^a-z]/g, '');
        const matchingCategories = INTEREST_CATEGORY_MAP[normalizedInterest] || [];

        if (matchingCategories.includes(spaceCategory)) {
          interestMatchCount++;
        }
      }

      // Also check space name/description for interest keywords
      const spaceText = `${space.name.value} ${space.description?.value || ''}`.toLowerCase();
      for (const interest of interests) {
        if (spaceText.includes(interest.toLowerCase())) {
          interestMatchCount += 0.5;
        }
      }

      const interestScore = Math.min(1, interestMatchCount / Math.max(1, interests.length));
      score += interestScore * 0.4;
      factors++;
    }

    // Factor 2: Major alignment (30% of anxiety relief)
    if (major) {
      const normalizedMajor = major.toLowerCase();
      const spaceText = `${space.name.value} ${space.description?.value || ''}`.toLowerCase();

      if (spaceText.includes(normalizedMajor)) {
        score += 0.3;
      } else {
        // Partial match for related majors
        const majorKeywords = normalizedMajor.split(/\s+/);
        let keywordMatches = 0;
        for (const keyword of majorKeywords) {
          if (keyword.length > 3 && spaceText.includes(keyword)) {
            keywordMatches++;
          }
        }
        score += Math.min(0.3, (keywordMatches / majorKeywords.length) * 0.3);
      }
      factors++;
    }

    // Factor 3: Space attributes that reduce anxiety (30% of anxiety relief)
    let attributeScore = 0;

    // Verified spaces feel safer
    if (space.isVerified) {
      attributeScore += 0.3;
    }

    // Higher member count = more normalized to join
    const memberCount = space.memberCount;
    if (memberCount > 100) {
      attributeScore += 0.3;
    } else if (memberCount > 50) {
      attributeScore += 0.2;
    } else if (memberCount > 20) {
      attributeScore += 0.1;
    }

    // Public spaces are less intimidating
    if (space.isPublic) {
      attributeScore += 0.2;
    }

    // Open join policy reduces barrier (public + no approval required)
    if (space.isPublic && !space.settings?.requireApproval) {
      attributeScore += 0.2;
    }

    score += Math.min(0.3, attributeScore * 0.3);
    factors++;

    return factors > 0 ? score : 0.3; // Default moderate score
  }

  /**
   * Calculate social proof score (0-1)
   * Higher score = more social validation to join
   */
  private calculateSocialProof(
    space: EnhancedSpace,
    friendsInSpace: string[]
  ): number {
    let score = 0;

    // Factor 1: Friends in space (60% of social proof)
    const friendCount = friendsInSpace.length;
    if (friendCount >= 5) {
      score += 0.6;
    } else if (friendCount >= 3) {
      score += 0.5;
    } else if (friendCount >= 2) {
      score += 0.4;
    } else if (friendCount === 1) {
      score += 0.25;
    }

    // Factor 2: Popularity/trending (25% of social proof)
    const memberCount = space.memberCount;
    if (memberCount > 500) {
      score += 0.25;
    } else if (memberCount > 200) {
      score += 0.2;
    } else if (memberCount > 100) {
      score += 0.15;
    } else if (memberCount > 50) {
      score += 0.1;
    } else if (memberCount > 20) {
      score += 0.05;
    }

    // Factor 3: Recent activity/growth (15% of social proof)
    // Use trending score if available, or estimate from member growth
    const trendingScore = space.trendingScore || 0;
    if (trendingScore > 0.8) {
      score += 0.15;
    } else if (trendingScore > 0.5) {
      score += 0.1;
    } else if (trendingScore > 0.2) {
      score += 0.05;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate insider access score (0-1)
   * Higher score = more exclusive/valuable access
   */
  private calculateInsiderAccess(space: EnhancedSpace): number {
    let score = 0;

    // Factor 1: Join policy exclusivity (40% of insider access)
    // Determine exclusivity based on visibility and settings
    if (!space.isPublic && !space.settings?.allowInvites) {
      // Private + no invites = very exclusive (invite only through leaders)
      score += 0.4;
    } else if (!space.isPublic && space.settings?.allowInvites) {
      // Private + invites allowed = moderately exclusive
      score += 0.3;
    } else if (space.isPublic && space.settings?.requireApproval) {
      // Public but requires approval
      score += 0.2;
    }
    // Open public spaces have no insider access value from policy

    // Factor 2: Verification/official status (30% of insider access)
    if (space.isVerified) {
      score += 0.3;
    }

    // Factor 3: Scarcity/exclusivity (30% of insider access)
    const memberCount = space.memberCount;
    const maxMembers = space.settings?.maxMembers;

    if (maxMembers && memberCount > 0) {
      // Limited membership spaces are more exclusive
      const fillRate = memberCount / maxMembers;
      if (fillRate > 0.9) {
        score += 0.3; // Almost full = very exclusive
      } else if (fillRate > 0.7) {
        score += 0.2;
      } else if (fillRate > 0.5) {
        score += 0.1;
      }
    } else if (!space.isPublic) {
      // Private spaces have some inherent exclusivity
      score += 0.15;
    }

    return Math.min(1, score);
  }

  /**
   * Calculate full recommendation score using 3-factor algorithm
   */
  private calculateRecommendationScore(
    space: EnhancedSpace,
    interests: string[],
    major: string | undefined,
    friendsInSpace: string[]
  ): SpaceRecommendationScore {
    const anxietyRelief = this.calculateAnxietyRelief(space, interests, major);
    const socialProof = this.calculateSocialProof(space, friendsInSpace);
    const insiderAccess = this.calculateInsiderAccess(space);

    const totalScore =
      anxietyRelief * RECOMMENDATION_WEIGHTS.anxietyRelief +
      socialProof * RECOMMENDATION_WEIGHTS.socialProof +
      insiderAccess * RECOMMENDATION_WEIGHTS.insiderAccess;

    return {
      spaceId: space.spaceId.value,
      totalScore,
      anxietyRelief,
      socialProof,
      insiderAccess,
    };
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
        const categoryResult = SpaceCategory.create(category);
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
        const categoryResult = SpaceCategory.create(category);
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
   * Get recommended spaces for user using 3-factor algorithm
   *
   * SpaceRecommendationScore = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
   *
   * - AnxietyRelief: How comfortable will the user feel joining? Based on interests, major, space attributes
   * - SocialProof: Who's already there? Friends in space, popularity, activity
   * - InsiderAccess: Exclusivity value. Invite-only, verified, limited membership
   */
  async getRecommendations(input: RecommendedSpacesInput): Promise<Result<SpaceBrowseDTO[]>> {
    return this.execute(async () => {
      const { interests = [], major, excludeSpaceIds = [], friendIds = [], limit = 10 } = input;

      // Get base recommendations from repository (returns more than we need for scoring)
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

      // Get friends in each space for social proof calculation
      let friendsInSpacesMap = new Map<string, string[]>();
      if (friendIds.length > 0 && this.getFriendsInSpaces) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        friendsInSpacesMap = await this.getFriendsInSpaces(friendIds, spaceIds);
      }

      // Calculate recommendation scores for each space
      const scoredSpaces = spaces.map(space => {
        const friendsInSpace = friendsInSpacesMap.get(space.spaceId.value) || [];
        const score = this.calculateRecommendationScore(space, interests, major, friendsInSpace);
        return { space, score };
      });

      // Sort by total score (highest first)
      scoredSpaces.sort((a, b) => b.score.totalScore - a.score.totalScore);

      // Take top N results
      const topSpaces = scoredSpaces.slice(0, limit);

      // Check membership status
      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = topSpaces.map(s => s.space.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      // Transform to DTOs with recommendation metadata
      const spaceDTOs = topSpaces.map(({ space, score }) => {
        const dto = toSpaceBrowseDTO(space, joinedSpaceIds.has(space.spaceId.value));
        return {
          ...dto,
          recommendationScore: score.totalScore,
          recommendationFactors: {
            anxietyRelief: score.anxietyRelief,
            socialProof: score.socialProof,
            insiderAccess: score.insiderAccess,
          },
        };
      });

      return Result.ok<SpaceBrowseDTO[]>(spaceDTOs);
    }, 'SpaceDiscoveryService.getRecommendations');
  }

  /**
   * Get recommended spaces with full score breakdown
   * Useful for debugging and tuning the algorithm
   */
  async getRecommendationsWithScores(
    input: RecommendedSpacesInput
  ): Promise<Result<{ spaces: SpaceBrowseDTO[]; scores: SpaceRecommendationScore[] }>> {
    return this.execute(async () => {
      const { interests = [], major, excludeSpaceIds = [], friendIds = [], limit = 10 } = input;

      const result = await this.repository.findRecommended(
        this.context.campusId,
        interests,
        major
      );

      if (result.isFailure) {
        return Result.fail<{ spaces: SpaceBrowseDTO[]; scores: SpaceRecommendationScore[] }>(
          result.error ?? 'Operation failed'
        );
      }

      let spaces = result.getValue();
      const excludeSet = new Set(excludeSpaceIds);
      spaces = spaces.filter(s => !excludeSet.has(s.spaceId.value));

      let friendsInSpacesMap = new Map<string, string[]>();
      if (friendIds.length > 0 && this.getFriendsInSpaces) {
        const spaceIds = spaces.map(s => s.spaceId.value);
        friendsInSpacesMap = await this.getFriendsInSpaces(friendIds, spaceIds);
      }

      const scoredSpaces = spaces.map(space => {
        const friendsInSpace = friendsInSpacesMap.get(space.spaceId.value) || [];
        const score = this.calculateRecommendationScore(space, interests, major, friendsInSpace);
        return { space, score };
      });

      scoredSpaces.sort((a, b) => b.score.totalScore - a.score.totalScore);
      const topSpaces = scoredSpaces.slice(0, limit);

      let joinedSpaceIds = new Set<string>();
      if (this.context.userId && this.checkMembership) {
        const spaceIds = topSpaces.map(s => s.space.spaceId.value);
        joinedSpaceIds = await this.checkMembership(this.context.userId, spaceIds);
      }

      const spaceDTOs = topSpaces.map(({ space }) =>
        toSpaceBrowseDTO(space, joinedSpaceIds.has(space.spaceId.value))
      );

      const scores = topSpaces.map(({ score }) => score);

      return Result.ok({ spaces: spaceDTOs, scores });
    }, 'SpaceDiscoveryService.getRecommendationsWithScores');
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
      const categoryResult = SpaceCategory.create(category);
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
    getFriendsInSpaces?: GetFriendsInSpacesFn;
  }
): SpaceDiscoveryService {
  return new SpaceDiscoveryService(repository, context, callbacks);
}

// Export recommendation types
export { RECOMMENDATION_WEIGHTS, CATEGORY_AFFINITY, INTEREST_CATEGORY_MAP };
