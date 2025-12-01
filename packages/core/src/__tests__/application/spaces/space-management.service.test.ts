/**
 * SpaceManagementService Tests
 *
 * Tests for space management operations including admin moderation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpaceManagementService } from '../../../application/space-management.service';
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
const TEST_ADMIN_ID = 'admin-user-456';
const TEST_SPACE_ID = 'space-123';

/**
 * Create a mock space for testing
 */
function createMockSpace(overrides?: Partial<{
  id: string;
  name: string;
  isActive: boolean;
  isVerified: boolean;
  campusId: string;
}>): EnhancedSpace {
  const spaceIdResult = SpaceId.create(overrides?.id ?? TEST_SPACE_ID);
  const nameResult = SpaceName.create(overrides?.name ?? 'Test Space');
  const descResult = SpaceDescription.create('A test space');
  const categoryResult = SpaceCategory.create('club');
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

  // Apply overrides for isActive/isVerified
  if (overrides?.isActive !== undefined) {
    space.setIsActive(overrides.isActive);
  }
  if (overrides?.isVerified !== undefined) {
    space.setIsVerified(overrides.isVerified);
  }

  return space;
}

/**
 * Create mock repository
 */
function createMockRepository(spaces: Map<string, EnhancedSpace> = new Map()): ISpaceRepository {
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
    findByCampus: vi.fn((campusId: string) => {
      const campusSpaces = Array.from(spaces.values()).filter(
        s => s.campusId.id === campusId
      );
      return Promise.resolve(Result.ok(campusSpaces));
    }),
    save: vi.fn((space: EnhancedSpace) => {
      spaces.set(space.spaceId.value, space);
      return Promise.resolve(Result.ok(space));
    }),
    delete: vi.fn(() => Promise.resolve(Result.ok())),
    searchSpaces: vi.fn(() => Promise.resolve(Result.ok([]))),
    findBySlug: vi.fn(() => Promise.resolve(Result.ok(null))),
    findTrending: vi.fn(() => Promise.resolve(Result.ok([]))),
    findRecommended: vi.fn(() => Promise.resolve(Result.ok([]))),
    findByCategory: vi.fn(() => Promise.resolve(Result.ok([]))),
    findUserSpaces: vi.fn(() => Promise.resolve(Result.ok([]))),
    findWithPagination: vi.fn(() => Promise.resolve(Result.ok({ spaces: [], hasMore: false }))),
  } as unknown as ISpaceRepository;
}

describe('SpaceManagementService', () => {
  let service: SpaceManagementService;
  let mockRepo: ISpaceRepository;
  let testSpace: EnhancedSpace;

  beforeEach(() => {
    testSpace = createMockSpace();
    const spaces = new Map<string, EnhancedSpace>();
    spaces.set(TEST_SPACE_ID, testSpace);

    mockRepo = createMockRepository(spaces);
    service = new SpaceManagementService(
      { campusId: TEST_CAMPUS_ID, userId: TEST_USER_ID },
      mockRepo
    );
  });

  describe('Admin Moderation Methods', () => {
    describe('adminDisableSpace', () => {
      it('should disable an active space', async () => {
        const result = await service.adminDisableSpace(
          TEST_ADMIN_ID,
          TEST_SPACE_ID,
          'Violates community guidelines'
        );

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.data.spaceId).toBe(TEST_SPACE_ID);
        expect(value.data.action).toBe('disabled');

        // Verify save was called
        expect(mockRepo.save).toHaveBeenCalled();
      });

      it('should fail for non-existent space', async () => {
        const result = await service.adminDisableSpace(
          TEST_ADMIN_ID,
          'non-existent-space',
          'Test reason'
        );

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('not found');
      });
    });

    describe('adminEnableSpace', () => {
      beforeEach(() => {
        // Create disabled space
        testSpace.setIsActive(false);
      });

      it('should enable a disabled space', async () => {
        const result = await service.adminEnableSpace(
          TEST_ADMIN_ID,
          TEST_SPACE_ID
        );

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.data.spaceId).toBe(TEST_SPACE_ID);
        expect(value.data.action).toBe('enabled');
      });
    });

    describe('adminVerifySpace', () => {
      it('should verify an unverified space', async () => {
        const result = await service.adminVerifySpace(
          TEST_ADMIN_ID,
          TEST_SPACE_ID
        );

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.data.spaceId).toBe(TEST_SPACE_ID);
        expect(value.data.action).toBe('verified');
      });

      it('should fail for non-existent space', async () => {
        const result = await service.adminVerifySpace(
          TEST_ADMIN_ID,
          'non-existent-space'
        );

        expect(result.isFailure).toBe(true);
      });
    });

    describe('adminUnverifySpace', () => {
      beforeEach(() => {
        testSpace.setIsVerified(true);
      });

      it('should unverify a verified space', async () => {
        const result = await service.adminUnverifySpace(
          TEST_ADMIN_ID,
          TEST_SPACE_ID,
          'No longer meets verification criteria'
        );

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.data.spaceId).toBe(TEST_SPACE_ID);
        expect(value.data.action).toBe('unverified');
      });
    });

    describe('adminGetSpace', () => {
      it('should return space details for admin', async () => {
        const result = await service.adminGetSpace(TEST_SPACE_ID);

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.data.spaceId.value).toBe(TEST_SPACE_ID);
      });

      it('should fail for invalid space ID', async () => {
        const result = await service.adminGetSpace('');

        expect(result.isFailure).toBe(true);
      });
    });

    describe('adminListSpaces', () => {
      it('should list spaces with default options', async () => {
        const result = await service.adminListSpaces();

        expect(result.isSuccess).toBe(true);
        expect(mockRepo.findByCampus).toHaveBeenCalledWith(TEST_CAMPUS_ID);
      });

      it('should filter by category', async () => {
        const result = await service.adminListSpaces({
          category: 'club'
        });

        expect(result.isSuccess).toBe(true);
      });

      it('should include disabled spaces when requested', async () => {
        // Add a disabled space
        const disabledSpace = createMockSpace({
          id: 'disabled-space',
          name: 'Disabled Space',
          isActive: false
        });
        const spaces = new Map<string, EnhancedSpace>();
        spaces.set(TEST_SPACE_ID, testSpace);
        spaces.set('disabled-space', disabledSpace);

        mockRepo = createMockRepository(spaces);
        service = new SpaceManagementService(
          { campusId: TEST_CAMPUS_ID, userId: TEST_USER_ID },
          mockRepo
        );

        const result = await service.adminListSpaces({
          includeDisabled: true
        });

        expect(result.isSuccess).toBe(true);
      });

      it('should filter to only unverified spaces', async () => {
        const result = await service.adminListSpaces({
          onlyUnverified: true
        });

        expect(result.isSuccess).toBe(true);
      });

      it('should apply pagination', async () => {
        const result = await service.adminListSpaces({
          limit: 10,
          offset: 5
        });

        expect(result.isSuccess).toBe(true);
        const value = result.getValue();
        expect(value.metadata?.pageSize).toBe(10);
      });
    });
  });
});
