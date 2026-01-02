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
import { PlacedTool, PlacementLocation, PlacementSource, PlacementVisibility } from '../../../domain/spaces/entities/placed-tool';
import { COLLECTIONS } from '../../firestore-collections';

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
 * PlacedTool document structure in placed_tools subcollection
 */
interface PlacedToolDocument {
  toolId: string;
  spaceId: string;
  placement: PlacementLocation;
  order: number;
  isActive?: boolean;
  source?: PlacementSource;
  placedBy?: string | null;
  placedAt?: { toDate: () => Date } | Date;
  configOverrides?: Record<string, unknown>;
  visibility?: PlacementVisibility;
  titleOverride?: string | null;
  isEditable?: boolean;
  state?: Record<string, unknown>;
  stateUpdatedAt?: { toDate: () => Date } | Date | null;
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
   * Optionally loads placed tools from the placed_tools subcollection
   */
  async findById(id: SpaceId | string, options?: { loadMembers?: boolean; loadPlacedTools?: boolean }): Promise<Result<EnhancedSpace>> {
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

      // Load placed tools from placed_tools subcollection
      if (options?.loadPlacedTools === true) {
        await this.loadPlacedToolsIntoSpace(space, spaceId);
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
    } catch (_error) {
      // Members loading failed - non-critical enhancement
    }
  }

  /**
   * Load placed tools from placed_tools subcollection into the space aggregate
   * Called when loadPlacedTools option is true in findById
   */
  private async loadPlacedToolsIntoSpace(space: EnhancedSpace, spaceId: string): Promise<void> {
    try {
      const toolsSnapshot = await dbAdmin
        .collection(this.collectionName)
        .doc(spaceId)
        .collection(COLLECTIONS.PLACED_TOOLS)
        .orderBy('order', 'asc')
        .limit(100) // Reasonable limit for tool placements
        .get();

      if (toolsSnapshot.empty) {
        return; // No tools placed in this space
      }

      const placedTools: PlacedTool[] = [];

      for (const doc of toolsSnapshot.docs) {
        const toolData = doc.data() as PlacedToolDocument;

        // Parse placedAt - handle both Firestore Timestamp and Date
        let placedAt: Date;
        if (toolData.placedAt && typeof (toolData.placedAt as { toDate?: () => Date }).toDate === 'function') {
          placedAt = (toolData.placedAt as { toDate: () => Date }).toDate();
        } else if (toolData.placedAt instanceof Date) {
          placedAt = toolData.placedAt;
        } else {
          placedAt = new Date();
        }

        // Parse stateUpdatedAt
        let stateUpdatedAt: Date | null = null;
        if (toolData.stateUpdatedAt) {
          if (typeof (toolData.stateUpdatedAt as { toDate?: () => Date }).toDate === 'function') {
            stateUpdatedAt = (toolData.stateUpdatedAt as { toDate: () => Date }).toDate();
          } else if (toolData.stateUpdatedAt instanceof Date) {
            stateUpdatedAt = toolData.stateUpdatedAt;
          }
        }

        // Reconstruct PlacedTool entity from persistence
        const toolResult = PlacedTool.create(
          {
            toolId: toolData.toolId,
            spaceId: toolData.spaceId,
            placement: toolData.placement,
            order: toolData.order ?? 0,
            isActive: toolData.isActive ?? true,
            source: toolData.source ?? 'leader',
            placedBy: toolData.placedBy ?? null,
            placedAt,
            configOverrides: toolData.configOverrides ?? {},
            visibility: toolData.visibility ?? 'all',
            titleOverride: toolData.titleOverride ?? null,
            isEditable: toolData.isEditable ?? true,
            state: toolData.state ?? {},
            stateUpdatedAt,
          },
          doc.id // Use Firestore document ID as entity ID
        );

        if (toolResult.isSuccess) {
          placedTools.push(toolResult.getValue());
        }
      }

      if (placedTools.length > 0) {
        space.setPlacedTools(placedTools);
      }
    } catch (_error) {
      // PlacedTools loading failed - non-critical enhancement
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
   * Filters out hidden/moderated spaces
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

      // Filter out hidden/moderated spaces post-query
      return this.mapSnapshotToSpaces(snapshot, { filterHidden: true });
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  /**
   * Find spaces by category
   * Filters out hidden/moderated spaces
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

      return this.mapSnapshotToSpaces(snapshot, { filterHidden: true });
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  /**
   * Find spaces by type (legacy - prefer findByCategory)
   * Filters out hidden/moderated spaces
   */
  async findByType(type: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    // Prefer category field over legacy type field
    return this.findByCategory(type, campusId);
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
   * Lightweight method to get user's space memberships without loading full spaces
   * SCALING: This prevents N+1 queries - only queries spaceMembers, not spaces
   * Use this for browse/discovery endpoints where you only need spaceId + role
   */
  async findUserMemberships(userId: string): Promise<Result<{ spaceId: string; role: string }[]>> {
    try {
      const membershipsSnapshot = await dbAdmin
        .collection(this.membersCollection)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .limit(100)
        .get();

      if (membershipsSnapshot.empty) {
        return Result.ok<{ spaceId: string; role: string }[]>([]);
      }

      const memberships = membershipsSnapshot.docs.map(doc => {
        const data = doc.data() as SpaceMemberDocument;
        return {
          spaceId: data.spaceId,
          role: data.role
        };
      });

      return Result.ok(memberships);
    } catch (error) {
      return Result.fail<{ spaceId: string; role: string }[]>(`Failed to find user memberships: ${error}`);
    }
  }

  /**
   * Find public spaces
   * Filters out hidden/moderated spaces
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

      return this.mapSnapshotToSpaces(snapshot, { filterHidden: true });
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
   * Filters out hidden/moderated spaces and private spaces (discovery context)
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

      return this.mapSnapshotToSpaces(snapshot, { filterHidden: true, filterPrivate: true });
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

        return this.mapSnapshotToSpaces(fallbackSnapshot, { filterHidden: true, filterPrivate: true });
      } catch (fallbackError) {
        return Result.fail<EnhancedSpace[]>(`Failed to find trending spaces: ${error}`);
      }
    }
  }

  /**
   * Find recommended spaces based on user interests and major
   * Filters out hidden/moderated spaces and private spaces
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
        const data = doc.data() as SpaceDocument & { isHidden?: boolean; moderationStatus?: string };
        // Skip hidden/moderated/private spaces
        if (data.isHidden === true) continue;
        if (data.moderationStatus === 'hidden' || data.moderationStatus === 'suspended') continue;
        if (data.visibility === 'private') continue;

        const result = await SpaceMapper.toDomain(doc.id, data);
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
          const data = doc.data() as SpaceDocument & { isHidden?: boolean; moderationStatus?: string };
          // Skip hidden/moderated/private spaces
          if (data.isHidden === true) continue;
          if (data.moderationStatus === 'hidden' || data.moderationStatus === 'suspended') continue;
          if (data.visibility === 'private') continue;

          const result = await SpaceMapper.toDomain(doc.id, data);
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
   * Filters out hidden/moderated spaces and private spaces
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
        const data = doc.data() as SpaceDocument & { isHidden?: boolean; moderationStatus?: string };
        const nameLower = data.name?.toLowerCase() || '';
        const descriptionLower = data.description?.toLowerCase() || '';

        // Skip hidden/moderated/private spaces
        if (data.isHidden === true) continue;
        if (data.moderationStatus === 'hidden' || data.moderationStatus === 'suspended') continue;
        if (data.visibility === 'private') continue;

        if (nameLower.includes(searchLower) || descriptionLower.includes(searchLower)) {
          const result = await SpaceMapper.toDomain(doc.id, data);
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
    orderBy?: 'createdAt' | 'name_lowercase' | 'memberCount' | 'trendingScore';
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

      // Apply category filter (use 'category' field, not legacy 'type')
      if (type) {
        query = query.where('category', '==', type);
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
   * Optionally filters out hidden/moderated spaces and enforces privacy
   */
  private async mapSnapshotToSpaces(
    snapshot: FirebaseFirestore.QuerySnapshot,
    options: { filterHidden?: boolean; filterPrivate?: boolean } = {}
  ): Promise<Result<EnhancedSpace[]>> {
    const { filterHidden = false, filterPrivate = false } = options;
    const spaces: EnhancedSpace[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as SpaceDocument & { isHidden?: boolean; moderationStatus?: string };

      // Skip hidden/moderated spaces if filtering enabled
      if (filterHidden) {
        if (data.isHidden === true) continue;
        if (data.moderationStatus === 'hidden' || data.moderationStatus === 'suspended') continue;
      }

      // Skip private spaces if filtering enabled (for browse/discovery)
      if (filterPrivate && data.visibility === 'private') {
        continue;
      }

      const result = await SpaceMapper.toDomain(doc.id, data);
      if (result.isSuccess) {
        spaces.push(result.getValue());
      }
    }

    return Result.ok<EnhancedSpace[]>(spaces);
  }

  /**
   * Helper: Convert Date objects to Firestore Timestamps
   * Also removes undefined values which Firestore doesn't support
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

    // Remove undefined values recursively - Firestore doesn't accept undefined
    return this.removeUndefinedValues(converted);
  }

  /**
   * Helper: Recursively remove undefined values from an object
   * Firestore throws an error when undefined values are present
   */
  private removeUndefinedValues(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue; // Skip undefined values
      }

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Check if it's a Firestore Timestamp (has toDate method)
        if ('toDate' in value || '_seconds' in value) {
          result[key] = value; // Keep Firestore Timestamps as-is
        } else {
          // Recursively clean nested objects
          const cleaned = this.removeUndefinedValues(value as Record<string, unknown>);
          // Only include if the cleaned object has properties
          if (Object.keys(cleaned).length > 0) {
            result[key] = cleaned;
          }
        }
      } else if (Array.isArray(value)) {
        // Clean array items
        result[key] = value.map(item => {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            return this.removeUndefinedValues(item as Record<string, unknown>);
          }
          return item;
        }).filter(item => item !== undefined);
      } else {
        result[key] = value;
      }
    }

    return result;
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
