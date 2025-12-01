/**
 * Firebase Admin Space Repository
 * Server-side implementation using Firebase Admin SDK
 *
 * Use this in API routes (server-side) instead of the client-side repository.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../../../firebase-admin';
import { ISpaceRepository } from '../interfaces';
import { Result } from '../../../domain/shared/base/Result';
import { EnhancedSpace, SpaceMemberRole } from '../../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../../domain/spaces/value-objects/space-id.value';
import { ProfileId } from '../../../domain/profile/value-objects/profile-id.value';
import { SpaceMapper, SpaceDocument, SpacePersistenceData } from '../firebase/space.mapper';

/**
 * Member document structure in spaceMembers collection
 */
interface SpaceMemberDocument {
  spaceId: string;
  userId: string;
  role: string;
  joinedAt?: { toDate: () => Date } | Date;
  isActive?: boolean;
  campusId?: string;
}

/**
 * Firebase Admin Space Repository Implementation
 */
export class FirebaseAdminSpaceRepository implements ISpaceRepository {
  private readonly collectionName = 'spaces';
  private readonly membersCollection = 'spaceMembers';

  /**
   * Find a space by ID
   * Loads the space document and populates members from spaceMembers collection
   */
  async findById(id: SpaceId | string, options?: { loadMembers?: boolean }): Promise<Result<EnhancedSpace>> {
    try {
      const spaceId = typeof id === 'string' ? id : id.value;
      const docRef = dbAdmin.collection(this.collectionName).doc(spaceId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const data = docSnap.data() as SpaceDocument;
      const spaceResult = await SpaceMapper.toDomain(spaceId, data);

      if (spaceResult.isFailure) {
        return spaceResult;
      }

      const space = spaceResult.getValue();

      // Load members from spaceMembers collection (default: true for full hydration)
      if (options?.loadMembers !== false) {
        await this.loadMembersIntoSpace(space, spaceId);
      }

      return Result.ok<EnhancedSpace>(space);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space: ${error}`);
    }
  }

  /**
   * Load members from spaceMembers collection into the space aggregate
   */
  private async loadMembersIntoSpace(space: EnhancedSpace, spaceId: string): Promise<void> {
    try {
      const membersSnapshot = await dbAdmin
        .collection(this.membersCollection)
        .where('spaceId', '==', spaceId)
        .where('isActive', '==', true)
        .limit(500) // Reasonable limit for member count
        .get();

      if (membersSnapshot.empty) {
        return; // Keep the default creator-as-owner from aggregate creation
      }

      const members: Array<{ profileId: ProfileId; role: SpaceMemberRole; joinedAt: Date }> = [];

      for (const doc of membersSnapshot.docs) {
        const memberData = doc.data() as SpaceMemberDocument;

        const profileIdResult = ProfileId.create(memberData.userId);
        if (profileIdResult.isFailure) continue;

        // Parse joinedAt - handle both Firestore Timestamp and Date
        let joinedAt: Date;
        if (memberData.joinedAt && typeof (memberData.joinedAt as any).toDate === 'function') {
          joinedAt = (memberData.joinedAt as { toDate: () => Date }).toDate();
        } else if (memberData.joinedAt instanceof Date) {
          joinedAt = memberData.joinedAt;
        } else {
          joinedAt = new Date();
        }

        // Validate and normalize role
        const validRoles: SpaceMemberRole[] = ['owner', 'admin', 'moderator', 'member', 'guest'];
        const role = validRoles.includes(memberData.role as SpaceMemberRole)
          ? (memberData.role as SpaceMemberRole)
          : 'member';

        members.push({
          profileId: profileIdResult.getValue(),
          role,
          joinedAt
        });
      }

      if (members.length > 0) {
        space.setMembers(members);
      }
    } catch (error) {
      // Log but don't fail - members loading is enhancement, not critical
      console.warn(`Failed to load members for space ${spaceId}:`, error);
    }
  }

  /**
   * Find a space by name within a campus
   */
  async findByName(name: string, campusId: string): Promise<Result<EnhancedSpace>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('name', '==', name)
        .where('campusId', '==', campusId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedSpace>('Space document not found');
      }

      return SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space: ${error}`);
    }
  }

  /**
   * Find a space by slug within a campus
   */
  async findBySlug(slug: string, campusId: string): Promise<Result<EnhancedSpace>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('slug', '==', slug)
        .where('campusId', '==', campusId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedSpace>('Space document not found');
      }

      return SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space by slug: ${error}`);
    }
  }

  /**
   * Find spaces by campus
   */
  async findByCampus(campusId: string, limitCount: number = 50): Promise<Result<EnhancedSpace[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(limitCount)
        .get();

      return this.mapSnapshotToSpaces(snapshot);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  /**
   * Find spaces by category
   */
  async findByCategory(category: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('category', '==', category)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(50)
        .get();

      return this.mapSnapshotToSpaces(snapshot);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  /**
   * Find spaces by type
   */
  async findByType(type: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('type', '==', type)
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(50)
        .get();

      return this.mapSnapshotToSpaces(snapshot);
    } catch (error) {
      // Fallback to category if type field doesn't exist
      return this.findByCategory(type, campusId);
    }
  }

  /**
   * Find spaces a user is a member of
   */
  async findUserSpaces(userId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // Query the flat spaceMembers collection
      const membershipsSnapshot = await dbAdmin
        .collection(this.membersCollection)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .limit(100)
        .get();

      if (membershipsSnapshot.empty) {
        return Result.ok<EnhancedSpace[]>([]);
      }

      // Extract space IDs
      const spaceIds = membershipsSnapshot.docs
        .map(doc => doc.data().spaceId as string)
        .filter(Boolean);

      if (spaceIds.length === 0) {
        return Result.ok<EnhancedSpace[]>([]);
      }

      // Fetch space documents in parallel
      const spacePromises = spaceIds.map(id =>
        dbAdmin.collection(this.collectionName).doc(id).get()
      );
      const spaceSnapshots = await Promise.all(spacePromises);

      const spaces: EnhancedSpace[] = [];
      for (const snap of spaceSnapshots) {
        if (snap.exists) {
          const result = await SpaceMapper.toDomain(snap.id, snap.data() as SpaceDocument);
          if (result.isSuccess) {
            spaces.push(result.getValue());
          }
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find user spaces: ${error}`);
    }
  }

  /**
   * Find spaces by member (alias for findUserSpaces)
   */
  async findByMember(userId: string): Promise<Result<EnhancedSpace[]>> {
    return this.findUserSpaces(userId);
  }

  /**
   * Find public spaces
   */
  async findPublicSpaces(campusId: string, limitCount: number = 100): Promise<Result<EnhancedSpace[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('visibility', '==', 'public')
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(limitCount)
        .get();

      return this.mapSnapshotToSpaces(snapshot);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find public spaces: ${error}`);
    }
  }

  /**
   * Find public enhanced spaces (alias)
   */
  async findPublicEnhancedSpaces(campusId: string, limit: number = 100): Promise<Result<EnhancedSpace[]>> {
    return this.findPublicSpaces(campusId, limit);
  }

  /**
   * Find trending spaces
   */
  async findTrending(campusId: string, limitCount: number = 20): Promise<Result<EnhancedSpace[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('trendingScore', 'desc')
        .orderBy('memberCount', 'desc')
        .limit(limitCount)
        .get();

      return this.mapSnapshotToSpaces(snapshot);
    } catch (error) {
      // Fallback: just order by member count if trendingScore index doesn't exist
      try {
        const fallbackSnapshot = await dbAdmin
          .collection(this.collectionName)
          .where('campusId', '==', campusId)
          .where('isActive', '==', true)
          .orderBy('memberCount', 'desc')
          .limit(limitCount)
          .get();

        return this.mapSnapshotToSpaces(fallbackSnapshot);
      } catch (fallbackError) {
        return Result.fail<EnhancedSpace[]>(`Failed to find trending spaces: ${error}`);
      }
    }
  }

  /**
   * Find recommended spaces based on user interests and major
   */
  async findRecommended(
    campusId: string,
    interests: string[],
    major?: string
  ): Promise<Result<EnhancedSpace[]>> {
    try {
      const spaces: EnhancedSpace[] = [];

      // Get popular spaces
      const popularSnapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(10)
        .get();

      for (const doc of popularSnapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      // Get spaces matching major if provided
      if (major) {
        const majorSnapshot = await dbAdmin
          .collection(this.collectionName)
          .where('campusId', '==', campusId)
          .where('tags', 'array-contains', major.toLowerCase())
          .where('isActive', '==', true)
          .limit(5)
          .get();

        for (const doc of majorSnapshot.docs) {
          const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
          if (result.isSuccess && !spaces.find(s => s.spaceId.value === doc.id)) {
            spaces.push(result.getValue());
          }
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find recommended spaces: ${error}`);
    }
  }

  /**
   * Search spaces by name/description
   */
  async searchSpaces(searchQuery: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // Firebase doesn't support full-text search
      // Do a basic name-based search
      const snapshot = await dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('name')
        .limit(50)
        .get();

      const spaces: EnhancedSpace[] = [];
      const searchLower = searchQuery.toLowerCase();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const nameLower = data.name?.toLowerCase() || '';
        const descriptionLower = data.description?.toLowerCase() || '';

        if (nameLower.includes(searchLower) || descriptionLower.includes(searchLower)) {
          const result = await SpaceMapper.toDomain(doc.id, data as SpaceDocument);
          if (result.isSuccess) {
            spaces.push(result.getValue());
          }
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Search failed: ${error}`);
    }
  }

  /**
   * Search enhanced spaces (alias)
   */
  async searchEnhancedSpaces(query: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    return this.searchSpaces(query, campusId);
  }

  /**
   * Find spaces with pagination support
   * Supports type filtering, search, and cursor-based pagination
   */
  async findWithPagination(options: {
    campusId: string;
    type?: string;
    searchTerm?: string;
    limit?: number;
    cursor?: string;
    orderBy?: 'createdAt' | 'name_lowercase' | 'memberCount';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Result<{ spaces: EnhancedSpace[]; hasMore: boolean; nextCursor?: string }>> {
    try {
      const {
        campusId,
        type,
        searchTerm,
        limit = 50,
        cursor,
        orderBy = 'createdAt',
        orderDirection = 'desc'
      } = options;

      let query: admin.firestore.Query = dbAdmin
        .collection(this.collectionName)
        .where('campusId', '==', campusId)
        .where('isActive', '==', true);

      // Apply type filter
      if (type) {
        query = query.where('type', '==', type);
      }

      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);

      // Apply cursor for pagination
      if (cursor) {
        const cursorDoc = await dbAdmin.collection(this.collectionName).doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      // Fetch one extra to check if there are more results
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

      // Map to domain models
      let spaces: EnhancedSpace[] = [];
      for (const doc of docs) {
        const data = doc.data();
        const result = await SpaceMapper.toDomain(doc.id, data as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      // Apply search filter (post-query since Firestore doesn't support full-text search)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        spaces = spaces.filter(space => {
          const nameLower = space.name.value.toLowerCase();
          const descriptionLower = space.description.value.toLowerCase();
          return nameLower.includes(searchLower) || descriptionLower.includes(searchLower);
        });
      }

      // Get next cursor
      const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1].id : undefined;

      return Result.ok({ spaces, hasMore, nextCursor });
    } catch (error) {
      return Result.fail(`Failed to query spaces: ${error}`);
    }
  }

  /**
   * Save a space (create or update)
   *
   * Enforces slug uniqueness within campus before saving.
   */
  async save(space: EnhancedSpace): Promise<Result<void>> {
    try {
      // Phase 6: Enforce slug uniqueness within campus
      if (space.slug) {
        const existingResult = await this.findBySlug(space.slug.value, space.campusId.id);
        if (existingResult.isSuccess) {
          const existingSpace = existingResult.getValue();
          // Check if it's a different space (not self-update)
          if (existingSpace.spaceId.value !== space.spaceId.value) {
            return Result.fail<void>(
              `Slug "${space.slug.value}" is already in use by another space`
            );
          }
        }
        // If findBySlug fails with "Space not found", that's expected - slug is available
      }

      const data = SpaceMapper.toPersistence(space);
      const docRef = dbAdmin.collection(this.collectionName).doc(space.spaceId.value);

      // Convert dates to Firestore timestamps
      const firestoreData = this.convertDatesToTimestamps(data);

      if (space.createdAt) {
        // Update existing
        await docRef.update({
          ...firestoreData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new
        await docRef.set({
          ...firestoreData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save space: ${error}`);
    }
  }

  /**
   * Delete a space
   */
  async delete(id: SpaceId | string): Promise<Result<void>> {
    try {
      const spaceId = typeof id === 'string' ? id : id.value;
      const docRef = dbAdmin.collection(this.collectionName).doc(spaceId);
      await docRef.delete();
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete space: ${error}`);
    }
  }

  /**
   * Helper: Map snapshot to EnhancedSpace array
   */
  private async mapSnapshotToSpaces(
    snapshot: FirebaseFirestore.QuerySnapshot
  ): Promise<Result<EnhancedSpace[]>> {
    const spaces: EnhancedSpace[] = [];

    for (const doc of snapshot.docs) {
      const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
      if (result.isSuccess) {
        spaces.push(result.getValue());
      }
    }

    return Result.ok<EnhancedSpace[]>(spaces);
  }

  /**
   * Helper: Convert Date objects to Firestore Timestamps
   */
  private convertDatesToTimestamps(
    data: SpacePersistenceData
  ): Record<string, unknown> {
    const converted: Record<string, unknown> = { ...data };

    if (data.lastActivityAt) {
      converted.lastActivityAt = admin.firestore.Timestamp.fromDate(data.lastActivityAt);
    }

    // Convert tab dates
    if (data.tabs && Array.isArray(data.tabs)) {
      converted.tabs = data.tabs.map(tab => ({
        ...tab,
        createdAt: tab.createdAt ? admin.firestore.Timestamp.fromDate(tab.createdAt) : null,
        lastActivityAt: tab.lastActivityAt ? admin.firestore.Timestamp.fromDate(tab.lastActivityAt) : null,
        expiresAt: tab.expiresAt ? admin.firestore.Timestamp.fromDate(tab.expiresAt) : null
      }));
    }

    // Convert rush mode end date
    if (data.rushModeEndDate) {
      converted.rushModeEndDate = admin.firestore.Timestamp.fromDate(data.rushModeEndDate);
    }

    return converted;
  }
}

// Singleton instance
let spaceRepositoryInstance: FirebaseAdminSpaceRepository | null = null;

/**
 * Get the server-side Space Repository instance
 */
export function getServerSpaceRepository(): ISpaceRepository {
  if (!spaceRepositoryInstance) {
    spaceRepositoryInstance = new FirebaseAdminSpaceRepository();
  }
  return spaceRepositoryInstance;
}

/**
 * Reset the repository instance (for testing)
 */
export function resetServerSpaceRepository(): void {
  spaceRepositoryInstance = null;
}
