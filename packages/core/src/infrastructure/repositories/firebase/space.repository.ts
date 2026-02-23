/**
 * Firebase Space Repository Implementation
 * Handles space persistence with Firebase (Client SDK)
 *
 * Uses SpaceMapper for domain ↔ persistence mapping (shared with admin repository)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@hive/firebase';
import { ISpaceRepository } from '../interfaces';
import { Result } from '../../../domain/shared/base/Result';
import { EnhancedSpace } from '../../../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../../../domain/spaces/value-objects/space-id.value';
import { SpaceMapper, SpaceDocument, SpacePersistenceData } from './space.mapper';

export class FirebaseSpaceRepository implements ISpaceRepository {
  private readonly collectionName = 'spaces';
  private readonly membersCollection = 'spaceMembers';

  async findById(id: SpaceId | any): Promise<Result<EnhancedSpace>> {
    try {
      const spaceId = typeof id === 'string' ? id : id.id;
      const docRef = doc(db, this.collectionName, spaceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const data = docSnap.data() as SpaceDocument;
      return SpaceMapper.toDomain(spaceId, data);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space: ${error}`);
    }
  }

  async findByName(name: string, campusId: string): Promise<Result<EnhancedSpace>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('name', '==', name),
        firestoreLimit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedSpace>('Space document not found');
      }
      const data = doc.data();
      if (!data) {
        return Result.fail<EnhancedSpace>('Space data not found');
      }
      return SpaceMapper.toDomain(doc.id, data as SpaceDocument);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space: ${error}`);
    }
  }

  async findBySlug(slug: string, campusId: string): Promise<Result<EnhancedSpace>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('slug', '==', slug),
        firestoreLimit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return Result.fail<EnhancedSpace>('Space not found');
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return Result.fail<EnhancedSpace>('Space document not found');
      }
      const data = doc.data();
      if (!data) {
        return Result.fail<EnhancedSpace>('Space data not found');
      }
      return SpaceMapper.toDomain(doc.id, data as SpaceDocument);
    } catch (error) {
      return Result.fail<EnhancedSpace>(`Failed to find space by slug: ${error}`);
    }
  }

  async findByCampus(campusId: string, limitCount: number = 50): Promise<Result<EnhancedSpace[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  async findByCategory(category: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find spaces: ${error}`);
    }
  }

  async findUserSpaces(userId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // Query spaces where user is a member
      const q = query(
        collection(db, this.collectionName),
        where('memberIds', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastActivityAt', 'desc'),
        firestoreLimit(100)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find user spaces: ${error}`);
    }
  }

  async findTrending(campusId: string, limitCount: number = 20): Promise<Result<EnhancedSpace[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        where('trendingScore', '>', 0),
        orderBy('trendingScore', 'desc'),
        orderBy('memberCount', 'desc'),
        firestoreLimit(limitCount)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find trending spaces: ${error}`);
    }
  }

  async findRecommended(campusId: string, interests: string[], major?: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // For MVP, recommend based on member count and category
      // In production, this would use a recommendation engine
      const spaces: EnhancedSpace[] = [];

      // Get popular spaces
      const popularQuery = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        firestoreLimit(10)
      );
      const popularSnapshot = await getDocs(popularQuery);

      for (const doc of popularSnapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      // Get spaces matching major if provided
      if (major) {
        const majorQuery = query(
          collection(db, this.collectionName),
          where('tags', 'array-contains', major.toLowerCase()),
          where('isActive', '==', true),
          firestoreLimit(5)
        );
        const majorSnapshot = await getDocs(majorQuery);

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

  async searchSpaces(searchQuery: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // Use server-side prefix search with name_lowercase field
      // This is more efficient than fetching all docs and filtering client-side
      const searchLower = searchQuery.toLowerCase().trim();

      if (!searchLower) {
        // Empty search - return popular spaces
        return this.findByCampus(campusId, 20);
      }

      // Firestore range query for prefix search
      // name_lowercase >= "searchterm" AND name_lowercase < "searchterm\uf8ff"
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        where('name_lowercase', '>=', searchLower),
        where('name_lowercase', '<=', searchLower + '\uf8ff'),
        orderBy('name_lowercase'),
        firestoreLimit(20)
      );

      const snapshot = await getDocs(q);
      const spaces: EnhancedSpace[] = [];

      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      // If name_lowercase field doesn't exist, fall back to basic query
      // This handles legacy data that may not have the lowercase field
      try {
        const fallbackQuery = query(
          collection(db, this.collectionName),
          where('isActive', '==', true),
          orderBy('memberCount', 'desc'),
          firestoreLimit(20)
        );
        const snapshot = await getDocs(fallbackQuery);
        const spaces: EnhancedSpace[] = [];
        const searchLower = searchQuery.toLowerCase();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const nameLower = data.name?.toLowerCase() || '';
          if (nameLower.includes(searchLower)) {
            const result = await SpaceMapper.toDomain(doc.id, data as SpaceDocument);
            if (result.isSuccess) {
              spaces.push(result.getValue());
            }
          }
        }
        return Result.ok<EnhancedSpace[]>(spaces);
      } catch (fallbackError) {
        return Result.fail<EnhancedSpace[]>(`Search failed: ${error}`);
      }
    }
  }

  async save(space: EnhancedSpace): Promise<Result<void>> {
    try {
      const data = SpaceMapper.toPersistence(space);
      const docRef = doc(db, this.collectionName, space.spaceId.value);

      // Convert dates to Firestore Timestamps (client SDK)
      const firestoreData = this.convertDatesToTimestamps(data);

      if (space.createdAt) {
        // Update existing
        await updateDoc(docRef, {
          ...firestoreData,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new
        await setDoc(docRef, {
          ...firestoreData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save space: ${error}`);
    }
  }

  /**
   * Convert Date objects to Firestore Timestamps (Client SDK)
   */
  private convertDatesToTimestamps(data: SpacePersistenceData): Record<string, unknown> {
    const converted: Record<string, unknown> = { ...data };

    if (data.lastActivityAt) {
      converted.lastActivityAt = Timestamp.fromDate(data.lastActivityAt);
    }

    // Convert tab dates
    if (data.tabs && Array.isArray(data.tabs)) {
      converted.tabs = data.tabs.map(tab => ({
        ...tab,
        createdAt: tab.createdAt ? Timestamp.fromDate(tab.createdAt) : null,
        lastActivityAt: tab.lastActivityAt ? Timestamp.fromDate(tab.lastActivityAt) : null,
        expiresAt: tab.expiresAt ? Timestamp.fromDate(tab.expiresAt) : null
      }));
    }

    // Convert rush mode end date
    if (data.rushModeEndDate) {
      converted.rushModeEndDate = Timestamp.fromDate(data.rushModeEndDate);
    }

    return converted;
  }

  async delete(id: SpaceId | any): Promise<Result<void>> {
    try {
      const spaceId = typeof id === 'string' ? id : id.id;
      const docRef = doc(db, this.collectionName, spaceId);
      await deleteDoc(docRef);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to delete space: ${error}`);
    }
  }

  // Additional methods required by interface
  async findByType(type: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    try {
      // Type could be a sub-category or feature type
      const q = query(
        collection(db, this.collectionName),
        where('type', '==', type),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      // If 'type' field doesn't exist, fallback to category
      return this.findByCategory(type, campusId);
    }
  }

  async findByMember(userId: string): Promise<Result<EnhancedSpace[]>> {
    // This is the same as findUserSpaces, just delegate
    return this.findUserSpaces(userId);
  }

  /**
   * Lightweight method to get user's space memberships without loading full spaces
   * SCALING: This prevents N+1 queries - only queries spaceMembers, not spaces
   * Use this for browse/discovery endpoints where you only need spaceId + role
   */
  async findUserMemberships(userId: string): Promise<Result<{ spaceId: string; role: string }[]>> {
    try {
      const q = query(
        collection(db, this.membersCollection),
        where('userId', '==', userId),
        where('isActive', '==', true),
        firestoreLimit(100)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return Result.ok<{ spaceId: string; role: string }[]>([]);
      }

      const memberships = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          spaceId: data.spaceId as string,
          role: data.role as string
        };
      });

      return Result.ok(memberships);
    } catch (error) {
      return Result.fail<{ spaceId: string; role: string }[]>(`Failed to find user memberships: ${error}`);
    }
  }

  async findPublicSpaces(campusId: string, limit: number = 100): Promise<Result<EnhancedSpace[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('visibility', '==', 'public'),
        where('isActive', '==', true),
        orderBy('memberCount', 'desc'),
        firestoreLimit(limit)
      );
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      for (const doc of snapshot.docs) {
        const result = await SpaceMapper.toDomain(doc.id, doc.data() as SpaceDocument);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      return Result.ok<EnhancedSpace[]>(spaces);
    } catch (error) {
      return Result.fail<EnhancedSpace[]>(`Failed to find public spaces: ${error}`);
    }
  }

  // Missing method implementations from interface
  async findPublicEnhancedSpaces(campusId: string, limit: number = 100): Promise<Result<EnhancedSpace[]>> {
    // This is the same as findPublicSpaces since we already return EnhancedSpace
    return this.findPublicSpaces(campusId, limit);
  }

  async searchEnhancedSpaces(query: string, campusId: string): Promise<Result<EnhancedSpace[]>> {
    // This is the same as searchSpaces since we already return EnhancedSpace
    return this.searchSpaces(query, campusId);
  }

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
        limit: limitCount = 20,
        cursor,
        orderBy: orderByField = 'createdAt',
        orderDirection = 'desc'
      } = options;

      // Build query constraints
      const constraints: Parameters<typeof query>[1][] = [
        where('isActive', '==', true)
      ];

      if (type) {
        constraints.push(where('type', '==', type));
      }

      // Add ordering
      constraints.push(orderBy(orderByField, orderDirection));

      // Fetch one extra to check if there are more
      constraints.push(firestoreLimit(limitCount + 1));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const spaces: EnhancedSpace[] = [];
      const docs = snapshot.docs;

      // Process up to limitCount items
      const docsToProcess = docs.slice(0, limitCount);
      for (const docSnapshot of docsToProcess) {
        const data = docSnapshot.data() as SpaceDocument;

        // If searchTerm provided, filter client-side
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const nameLower = data.name?.toLowerCase() || '';
          const descLower = data.description?.toLowerCase() || '';
          if (!nameLower.includes(searchLower) && !descLower.includes(searchLower)) {
            continue;
          }
        }

        const result = await SpaceMapper.toDomain(docSnapshot.id, data);
        if (result.isSuccess) {
          spaces.push(result.getValue());
        }
      }

      // Check if there are more
      const hasMore = docs.length > limitCount;
      const nextCursor = hasMore && docs[limitCount - 1] ? docs[limitCount - 1].id : undefined;

      return Result.ok({ spaces, hasMore, nextCursor });
    } catch (error) {
      return Result.fail(`Failed to find spaces with pagination: ${error}`);
    }
  }
}