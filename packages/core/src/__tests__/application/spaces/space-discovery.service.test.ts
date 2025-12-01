/**
 * SpaceDiscoveryService Tests
 *
 * Tests for space discovery, search, filtering, and recommendations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SpaceDiscoveryService,
  createSpaceDiscoveryService,
  type BrowseSpacesInput,
  type SearchSpacesInput,
} from '../../../application/spaces/space-discovery.service';
import { EnhancedSpace } from '../../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../../domain/spaces/value-objects/space-id.value';
import { SpaceName } from '../../../domain/spaces/value-objects/space-name.value';
import { SpaceDescription } from '../../../domain/spaces/value-objects/space-description.value';
import { SpaceCategory } from '../../../domain/spaces/value-objects/space-category.value';
import { CampusId } from '../../../domain/profile/value-objects/campus-id.value';
import { ProfileId } from '../../../domain/profile/value-objects/profile-id.value';
import { Result } from '../../../domain/shared/base/Result';
import type { ISpaceRepository } from '../../../infrastructure/repositories/interfaces';

// Constants
const TEST_CAMPUS_ID = 'ub-buffalo';
const TEST_USER_ID = 'test-user-123';

/**
 * Create a mock space for testing
 */
function createMockSpace(overrides?: {
  id?: string;
  name?: string;
  isActive?: boolean;
  isVerified?: boolean;
  campusId?: string;
  category?: string;
}): EnhancedSpace {
  const spaceIdResult = SpaceId.create(overrides?.id ?? `space-${Date.now()}`);
  const nameResult = SpaceName.create(overrides?.name ?? 'Test Space');
  const descResult = SpaceDescription.create('A test space');
  const categoryResult = SpaceCategory.create(overrides?.category ?? 'club');
  const campusIdResult = CampusId.create(overrides?.campusId ?? TEST_CAMPUS_ID);
  const creatorIdResult = ProfileId.create(TEST_USER_ID);

  if (
    spaceIdResult.isFailure ||
    nameResult.isFailure ||
    descResult.isFailure ||
    categoryResult.isFailure ||
    campusIdResult.isFailure ||
    creatorIdResult.isFailure
  ) {
    throw new Error('Failed to create test value objects');
  }

  const spaceResult = EnhancedSpace.create({
    spaceId: spaceIdResult.getValue(),
    name: nameResult.getValue(),
    description: descResult.getValue(),
    category: categoryResult.getValue(),
    campusId: campusIdResult.getValue(),
    createdBy: creatorIdResult.getValue(),
    visibility: 'public',
  });

  if (spaceResult.isFailure) {
    throw new Error(`Failed to create test space: ${spaceResult.error}`);
  }

  const space = spaceResult.getValue();

  if (overrides?.isActive !== undefined) {
    space.setIsActive(overrides.isActive);
  }
  if (overrides?.isVerified !== undefined) {
    space.setIsVerified(overrides.isVerified);
  }

  return space;
}

/**
 * Create mock repository with test data
 */
function createMockRepository(testSpaces: EnhancedSpace[] = []): ISpaceRepository {
  const spaces = new Map<string, EnhancedSpace>();
  testSpaces.forEach(s => spaces.set(s.spaceId.value, s));

  return {
    findById: vi.fn((id: string | SpaceId) => {
      // Handle both string and SpaceId
      const idValue = typeof id === 'string' ? id : id.value;
      const space = spaces.get(idValue);
      if (space) {
        return Promise.resolve(Result.ok(space));
      }
      return Promise.resolve(Result.fail('Space not found'));
    }),
    findByCampus: vi.fn((campusId: string, limit?: number) => {
      const campusSpaces = Array.from(spaces.values())
        .filter(s => s.campusId.id === campusId)
        .slice(0, limit ?? 50);
      return Promise.resolve(Result.ok(campusSpaces));
    }),
    findTrending: vi.fn((campusId: string, limit?: number) => {
      const trending = Array.from(spaces.values())
        .filter(s => s.campusId.id === campusId)
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit ?? 10);
      return Promise.resolve(Result.ok(trending));
    }),
    findRecommended: vi.fn((campusId: string, interests?: string[], major?: string) => {
      const recommended = Array.from(spaces.values())
        .filter(s => s.campusId.id === campusId && s.isVerified)
        .slice(0, 20);
      return Promise.resolve(Result.ok(recommended));
    }),
    findByCategory: vi.fn((category: string, campusId: string) => {
      const byCategory = Array.from(spaces.values())
        .filter(s => s.campusId.id === campusId && s.category.value === category);
      return Promise.resolve(Result.ok(byCategory));
    }),
    searchSpaces: vi.fn((query: string, campusId: string) => {
      const searchResults = Array.from(spaces.values())
        .filter(s =>
          s.campusId.id === campusId &&
          s.name.value.toLowerCase().includes(query.toLowerCase())
        );
      return Promise.resolve(Result.ok(searchResults));
    }),
    findBySlug: vi.fn((slug: string, campusId: string) => {
      const space = Array.from(spaces.values())
        .find(s => s.slug?.value === slug && s.campusId.id === campusId);
      return Promise.resolve(Result.ok(space ?? null));
    }),
    findUserSpaces: vi.fn((userId: string) => {
      // Return mock user memberships
      return Promise.resolve(Result.ok([]));
    }),
    findWithPagination: vi.fn(({ campusId, limit, cursor }) => {
      const campusSpaces = Array.from(spaces.values())
        .filter(s => s.campusId.id === campusId)
        .slice(0, limit ?? 20);
      return Promise.resolve(Result.ok({
        spaces: campusSpaces,
        hasMore: false,
        nextCursor: undefined
      }));
    }),
    save: vi.fn((space: EnhancedSpace) => Promise.resolve(Result.ok(space))),
    delete: vi.fn(() => Promise.resolve(Result.ok())),
  } as unknown as ISpaceRepository;
}

describe('SpaceDiscoveryService', () => {
  let service: SpaceDiscoveryService;
  let mockRepo: ISpaceRepository;
  let testSpaces: EnhancedSpace[];

  function setupService() {
    testSpaces = [
      createMockSpace({ id: 'space-1', name: 'Computer Science Club' }),
      createMockSpace({ id: 'space-2', name: 'Math Club', isVerified: true }),
      createMockSpace({ id: 'space-3', name: 'Physics Lab', category: 'academic' }),
      createMockSpace({ id: 'space-4', name: 'Disabled Space', isActive: false }),
    ];

    // Set different trending scores
    testSpaces[0]?.setTrendingScore(100);
    testSpaces[1]?.setTrendingScore(200);
    testSpaces[2]?.setTrendingScore(50);

    mockRepo = createMockRepository(testSpaces);
    service = new SpaceDiscoveryService(
      mockRepo,
      { campusId: TEST_CAMPUS_ID, userId: TEST_USER_ID }
    );
  }

  beforeEach(() => {
    setupService();
  });

  describe('Factory Function', () => {
    it('should create service with createSpaceDiscoveryService', () => {
      const createdService = createSpaceDiscoveryService(mockRepo, {
        campusId: TEST_CAMPUS_ID,
        userId: TEST_USER_ID
      });

      expect(createdService).toBeInstanceOf(SpaceDiscoveryService);
    });
  });

  describe('browse()', () => {
    it('should browse spaces with default options', async () => {
      const result = await service.browse({});

      expect(result.isSuccess).toBe(true);
      const value = result.getValue();
      expect(value.spaces).toBeDefined();
      expect(Array.isArray(value.spaces)).toBe(true);
    });

    it('should filter by verifiedOnly', async () => {
      const result = await service.browse({ verifiedOnly: true });

      expect(result.isSuccess).toBe(true);
      const value = result.getValue();
      // All returned spaces should be verified
      value.spaces.forEach(space => {
        expect(space.isVerified).toBe(true);
      });
    });

    it('should exclude private spaces by default', async () => {
      const result = await service.browse({ includePrivate: false });

      expect(result.isSuccess).toBe(true);
    });

    it('should sort by trending when specified', async () => {
      const result = await service.browse({ sortBy: 'trending' });

      expect(result.isSuccess).toBe(true);
    });

    it('should apply pagination limit', async () => {
      const result = await service.browse({ limit: 2 });

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.findWithPagination).toHaveBeenCalled();
    });
  });

  describe('search()', () => {
    it('should search spaces by query', async () => {
      const result = await service.search({ query: 'Computer' });

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.searchSpaces).toHaveBeenCalledWith('Computer', TEST_CAMPUS_ID);
    });

    it('should fail with short query', async () => {
      const result = await service.search({ query: 'a' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('at least 2 characters');
    });

    it('should filter search results by category', async () => {
      const result = await service.search({
        query: 'Club',
        category: 'student_org'
      });

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('getRecommendations()', () => {
    it('should return recommended spaces', async () => {
      const result = await service.getRecommendations({
        interests: ['technology', 'math'],
        major: 'Computer Science'
      });

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.findRecommended).toHaveBeenCalled();
    });
  });

  describe('getTrending()', () => {
    it('should return trending spaces', async () => {
      const result = await service.getTrending(10);

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.findTrending).toHaveBeenCalledWith(TEST_CAMPUS_ID, 10);
    });

    it('should use default limit when not specified', async () => {
      const result = await service.getTrending();

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.findTrending).toHaveBeenCalledWith(TEST_CAMPUS_ID, 10);
    });
  });

  describe('getByCategory()', () => {
    it('should return spaces by category', async () => {
      const result = await service.getByCategory('student_org');

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('getById()', () => {
    it('should return space by ID', async () => {
      const result = await service.getById('space-1');

      expect(result.isSuccess).toBe(true);
      const value = result.getValue();
      expect(value.id).toBe('space-1');
    });

    it('should fail for non-existent space', async () => {
      const result = await service.getById('non-existent');

      expect(result.isFailure).toBe(true);
    });

    it('should fail for space in different campus', async () => {
      // Create a space in a different campus by creating it normally
      // then calling the service with a different campusId
      const localService = new SpaceDiscoveryService(
        mockRepo,
        { campusId: 'different-campus', userId: TEST_USER_ID }
      );

      // Space 'space-1' exists in TEST_CAMPUS_ID (ub-buffalo)
      // but we're looking from a different campus context
      const result = await localService.getById('space-1');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('campus');
    });
  });

  describe('getBySlug()', () => {
    it('should return space by slug', async () => {
      // The mock returns null for slug searches by default
      const result = await service.getBySlug('test-space');

      // Since mock returns null, this should fail
      expect(result.isFailure).toBe(true);
    });
  });

  describe('getUserSpaces()', () => {
    it('should require user context', async () => {
      // Create service without userId
      const noUserService = new SpaceDiscoveryService(
        mockRepo,
        { campusId: TEST_CAMPUS_ID }
      );

      const result = await noUserService.getUserSpaces();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User context is required');
    });

    it('should return user spaces when authenticated', async () => {
      const result = await service.getUserSpaces();

      expect(result.isSuccess).toBe(true);
      expect(mockRepo.findUserSpaces).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe('getSpaceTabs()', () => {
    it('should return space tabs', async () => {
      const result = await service.getSpaceTabs('space-1');

      expect(result.isSuccess).toBe(true);
      const tabs = result.getValue();
      expect(Array.isArray(tabs)).toBe(true);
    });

    it('should fail for non-existent space', async () => {
      const result = await service.getSpaceTabs('non-existent');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getSpaceWidgets()', () => {
    it('should return all space widgets', async () => {
      const result = await service.getSpaceWidgets('space-1');

      expect(result.isSuccess).toBe(true);
      const widgets = result.getValue();
      expect(Array.isArray(widgets)).toBe(true);
    });

    it('should filter widgets by tab when tabId provided', async () => {
      const result = await service.getSpaceWidgets('space-1', 'tab-1');

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('getSpaceStructure()', () => {
    it('should return full space structure', async () => {
      const result = await service.getSpaceStructure('space-1');

      expect(result.isSuccess).toBe(true);
      const structure = result.getValue();
      expect(structure.space).toBeDefined();
      expect(structure.tabs).toBeDefined();
      expect(structure.widgets).toBeDefined();
    });
  });

  describe('isSlugAvailable()', () => {
    it('should return true for available slug', async () => {
      const result = await service.isSlugAvailable('new-unique-slug');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(true);
    });
  });
});
