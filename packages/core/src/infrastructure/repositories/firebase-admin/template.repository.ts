/**
 * Template Repository (Firebase Admin)
 *
 * Server-side repository for managing templates.
 */

import { Result } from '../../../domain/shared/base/Result';
import {
  Template,
  type TemplateProps,
  type TemplateCategory,
  type TemplateVisibility,
} from '../../../domain/hivelab/template.entity';
import { getFirestoreAdmin } from '../../../firebase-admin';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateFindManyOptions {
  category?: TemplateCategory;
  visibility?: TemplateVisibility;
  campusId?: string;
  creatorId?: string;
  spaceId?: string;
  tags?: string[];
  featuredOnly?: boolean;
  includeCodeTemplates?: boolean;
  orderBy?: 'createdAt' | 'usageCount' | 'name';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface TemplateFindManyResult {
  items: Template[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ITemplateRepository {
  findById(id: string): Promise<Result<Template | null>>;
  findMany(options: TemplateFindManyOptions): Promise<Result<TemplateFindManyResult>>;
  save(template: Template): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}

// ============================================================================
// REPOSITORY
// ============================================================================

const COLLECTION = 'templates';

export class FirebaseAdminTemplateRepository implements ITemplateRepository {
  async findById(id: string): Promise<Result<Template | null>> {
    try {
      const db = getFirestoreAdmin();
      const doc = await db.collection(COLLECTION).doc(id).get();

      if (!doc.exists) {
        return Result.ok(null);
      }

      const data = doc.data() as TemplateProps;
      const template = Template.fromPersistence({
        ...data,
        id: doc.id,
        createdAt: (data.createdAt as unknown as { toDate: () => Date })?.toDate?.() || new Date(data.createdAt),
        updatedAt: (data.updatedAt as unknown as { toDate: () => Date })?.toDate?.() || new Date(data.updatedAt),
      });

      return Result.ok(template);
    } catch (error) {
      return Result.fail(`Failed to find template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findMany(options: TemplateFindManyOptions): Promise<Result<TemplateFindManyResult>> {
    try {
      const db = getFirestoreAdmin();
      let query = db.collection(COLLECTION) as FirebaseFirestore.Query;

      // Apply filters
      if (options.category) {
        query = query.where('category', '==', options.category);
      }
      if (options.visibility) {
        query = query.where('visibility', '==', options.visibility);
      }
      if (options.campusId) {
        query = query.where('campusId', '==', options.campusId);
      }
      if (options.creatorId) {
        query = query.where('creatorId', '==', options.creatorId);
      }
      if (options.spaceId) {
        query = query.where('spaceId', '==', options.spaceId);
      }
      if (options.featuredOnly) {
        query = query.where('isFeatured', '==', true);
      }

      // Ordering
      const orderBy = options.orderBy || 'createdAt';
      const orderDirection = options.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Pagination
      const limit = Math.min(options.limit || 50, 100);
      query = query.limit(limit + 1); // Fetch one extra to check hasMore

      if (options.cursor) {
        const cursorDoc = await db.collection(COLLECTION).doc(options.cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();
      const docs = snapshot.docs;
      const hasMore = docs.length > limit;
      const items = docs.slice(0, limit).map(doc => {
        const data = doc.data() as TemplateProps;
        return Template.fromPersistence({
          ...data,
          id: doc.id,
          createdAt: (data.createdAt as unknown as { toDate: () => Date })?.toDate?.() || new Date(data.createdAt),
          updatedAt: (data.updatedAt as unknown as { toDate: () => Date })?.toDate?.() || new Date(data.updatedAt),
        });
      });

      return Result.ok({
        items,
        hasMore,
        nextCursor: hasMore ? docs[limit - 1].id : undefined,
      });
    } catch (error) {
      return Result.fail(`Failed to query templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(template: Template): Promise<Result<void>> {
    try {
      const db = getFirestoreAdmin();
      const data = template.toPersistence();

      await db.collection(COLLECTION).doc(template.id).set(data, { merge: true });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const db = getFirestoreAdmin();
      await db.collection(COLLECTION).doc(id).delete();

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async incrementUsageCount(id: string): Promise<Result<void>> {
    try {
      const db = getFirestoreAdmin();
      const { FieldValue } = await import('firebase-admin/firestore');

      await db.collection(COLLECTION).doc(id).update({
        usageCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(`Failed to increment usage count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let templateRepositoryInstance: FirebaseAdminTemplateRepository | null = null;

export function getServerTemplateRepository(): FirebaseAdminTemplateRepository {
  if (!templateRepositoryInstance) {
    templateRepositoryInstance = new FirebaseAdminTemplateRepository();
  }
  return templateRepositoryInstance;
}

export function resetServerTemplateRepository(): void {
  templateRepositoryInstance = null;
}
