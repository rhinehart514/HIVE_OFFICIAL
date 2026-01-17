/**
 * Setup Repository - Firestore persistence for Setups
 *
 * Provides CRUD operations for:
 * - SetupTemplates (blueprints)
 * - SetupDeployments (instances in spaces)
 *
 * Also provides access to system-defined setup templates.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../../../firebase-admin';
import { Result } from '../../shared/base/Result';
import {
  SetupTemplate,
  SetupTemplateProps,
  SetupCategory,
  SetupSource,
  SetupToolSlot,
  OrchestrationRule,
  SetupConfigField,
} from './setup-template';
import {
  SetupDeployment,
  SetupDeploymentProps,
  SetupDeploymentStatus,
  DeployedSetupTool,
  OrchestrationState,
  OrchestrationLogEntry,
} from './setup-deployment';
import type { ToolCapabilities } from '../capabilities';

// ============================================================================
// Firestore Document Types
// ============================================================================

/**
 * Firestore document structure for SetupTemplate
 */
interface SetupTemplateDocument {
  name: string;
  description: string;
  icon: string;
  category: SetupCategory;
  source: SetupSource;
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  sharedDataSchema: Record<string, unknown>;
  configFields: SetupConfigField[];
  requiredCapabilities: Partial<ToolCapabilities>;
  tags: string[];
  isSystem: boolean;
  isFeatured: boolean;
  deploymentCount: number;
  creatorId: string;
  creatorName?: string;
  campusId?: string;
  thumbnailUrl?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Firestore document structure for SetupDeployment
 */
interface SetupDeploymentDocument {
  templateId: string;
  templateName: string;
  templateCategory: SetupCategory;
  templateIcon: string;
  spaceId: string;
  campusId: string;
  deployedBy: string;
  tools: DeployedSetupTool[];
  orchestrationState: OrchestrationState;
  orchestrationRules: OrchestrationRule[];
  sharedData: Record<string, unknown>;
  config: Record<string, unknown>;
  status: SetupDeploymentStatus;
  executionLog: OrchestrationLogEntry[];
  maxLogEntries: number;
  deployedAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  archivedAt?: admin.firestore.Timestamp;
}

// ============================================================================
// Query Options
// ============================================================================

/**
 * Query options for SetupTemplate listing
 */
export interface SetupTemplateQueryOptions {
  /** Filter by category */
  category?: SetupCategory;
  /** Filter by source */
  source?: SetupSource;
  /** Filter by campus */
  campusId?: string;
  /** Filter by creator */
  creatorId?: string;
  /** Search by tags */
  tags?: string[];
  /** Only featured templates */
  featuredOnly?: boolean;
  /** Include system templates */
  includeSystemTemplates?: boolean;
  /** Order by field */
  orderBy?: 'createdAt' | 'deploymentCount' | 'name';
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Query options for SetupDeployment listing
 */
export interface SetupDeploymentQueryOptions {
  /** Filter by space */
  spaceId?: string;
  /** Filter by campus */
  campusId?: string;
  /** Filter by template */
  templateId?: string;
  /** Filter by status */
  status?: SetupDeploymentStatus;
  /** Filter by deployer */
  deployedBy?: string;
  /** Order by field */
  orderBy?: 'deployedAt' | 'updatedAt';
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Limit results */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ISetupTemplateRepository {
  findById(id: string): Promise<Result<SetupTemplate>>;
  findMany(options: SetupTemplateQueryOptions): Promise<Result<PaginatedResult<SetupTemplate>>>;
  save(template: SetupTemplate): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
  incrementDeploymentCount(id: string): Promise<Result<void>>;
}

export interface ISetupDeploymentRepository {
  findById(id: string): Promise<Result<SetupDeployment>>;
  findBySpaceId(spaceId: string): Promise<Result<SetupDeployment[]>>;
  findMany(options: SetupDeploymentQueryOptions): Promise<Result<PaginatedResult<SetupDeployment>>>;
  save(deployment: SetupDeployment): Promise<Result<void>>;
  updateOrchestrationState(
    id: string,
    state: Partial<OrchestrationState>,
  ): Promise<Result<void>>;
  updateSharedData(id: string, updates: Record<string, unknown>): Promise<Result<void>>;
  addLogEntry(id: string, entry: OrchestrationLogEntry): Promise<Result<void>>;
  updateStatus(id: string, status: SetupDeploymentStatus): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}

// ============================================================================
// Collection Names
// ============================================================================

const TEMPLATES_COLLECTION = 'setupTemplates';
const DEPLOYMENTS_COLLECTION = 'setupDeployments';

// ============================================================================
// SetupTemplate Repository Implementation
// ============================================================================

export class FirebaseAdminSetupTemplateRepository implements ISetupTemplateRepository {
  /**
   * Find a template by ID
   */
  async findById(id: string): Promise<Result<SetupTemplate>> {
    try {
      // Check if it's a system-defined template first
      const systemTemplate = this.getSystemTemplateById(id);
      if (systemTemplate) {
        return Result.ok(systemTemplate);
      }

      // Otherwise, fetch from Firestore
      const docRef = dbAdmin.collection(TEMPLATES_COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.fail<SetupTemplate>('Setup template not found');
      }

      const data = docSnap.data() as SetupTemplateDocument;
      const template = this.toDomain(id, data);

      return Result.ok(template);
    } catch (error) {
      return Result.fail<SetupTemplate>(`Failed to find setup template: ${error}`);
    }
  }

  /**
   * Find templates with filtering and pagination
   */
  async findMany(
    options: SetupTemplateQueryOptions = {},
  ): Promise<Result<PaginatedResult<SetupTemplate>>> {
    try {
      const {
        category,
        source,
        campusId,
        creatorId,
        tags,
        featuredOnly,
        includeSystemTemplates = true,
        orderBy = 'createdAt',
        orderDirection = 'desc',
        limit = 50,
        cursor,
      } = options;

      let templates: SetupTemplate[] = [];

      // Get system-defined templates if requested
      if (includeSystemTemplates && !creatorId) {
        const systemTemplates = this.getSystemTemplates();
        templates = systemTemplates.filter(t => {
          if (category && t.category !== category) return false;
          if (source && source !== 'system') return false;
          if (featuredOnly && !t.isFeatured) return false;
          if (tags && tags.length > 0 && !tags.some(tag => t.tags.includes(tag))) return false;
          return true;
        });
      }

      // Build Firestore query
      let query: admin.firestore.Query = dbAdmin.collection(TEMPLATES_COLLECTION);

      // Apply filters
      if (category) {
        query = query.where('category', '==', category);
      }

      if (source) {
        query = query.where('source', '==', source);
      }

      if (creatorId) {
        query = query.where('creatorId', '==', creatorId);
      }

      if (featuredOnly) {
        query = query.where('isFeatured', '==', true);
      }

      if (tags && tags.length > 0) {
        query = query.where('tags', 'array-contains', tags[0]);
      }

      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);

      // Apply cursor for pagination
      if (cursor) {
        const cursorDoc = await dbAdmin.collection(TEMPLATES_COLLECTION).doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      // Fetch extra for hasMore check
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

      // Convert to domain models
      for (const doc of docs) {
        const data = doc.data() as SetupTemplateDocument;

        // Filter by campus visibility
        if (campusId && data.campusId && data.campusId !== campusId) {
          continue;
        }

        const template = this.toDomain(doc.id, data);
        templates.push(template);
      }

      // Get next cursor
      const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1]?.id : undefined;

      return Result.ok({
        items: templates,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return Result.fail(`Failed to query setup templates: ${error}`);
    }
  }

  /**
   * Save a template (create or update)
   */
  async save(template: SetupTemplate): Promise<Result<void>> {
    try {
      if (template.isSystem) {
        return Result.fail('Cannot save system templates');
      }

      const data = this.toPersistence(template);
      const docRef = dbAdmin.collection(TEMPLATES_COLLECTION).doc(template.id);

      const existing = await docRef.get();

      if (existing.exists) {
        await docRef.update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await docRef.set({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save setup template: ${error}`);
    }
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      if (id.startsWith('system-')) {
        return Result.fail('Cannot delete system templates');
      }

      await dbAdmin.collection(TEMPLATES_COLLECTION).doc(id).delete();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete setup template: ${error}`);
    }
  }

  /**
   * Increment deployment count (atomic)
   */
  async incrementDeploymentCount(id: string): Promise<Result<void>> {
    try {
      if (id.startsWith('system-')) {
        return Result.ok(); // System templates don't have persistent counts
      }

      const docRef = dbAdmin.collection(TEMPLATES_COLLECTION).doc(id);
      await docRef.update({
        deploymentCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to increment deployment count: ${error}`);
    }
  }

  // ============================================================================
  // System-defined Templates
  // ============================================================================

  /**
   * Get all system-defined templates
   */
  private getSystemTemplates(): SetupTemplate[] {
    return SYSTEM_SETUP_TEMPLATES.map(tpl =>
      SetupTemplate.reconstitute({
        id: `system-${tpl.id}`,
        name: tpl.name,
        description: tpl.description,
        icon: tpl.icon,
        category: tpl.category,
        source: 'system',
        tools: tpl.tools,
        orchestration: tpl.orchestration,
        sharedDataSchema: tpl.sharedDataSchema || {},
        configFields: tpl.configFields || [],
        requiredCapabilities: tpl.requiredCapabilities || {},
        tags: tpl.tags,
        isSystem: true,
        isFeatured: true,
        deploymentCount: 0,
        creatorId: 'system',
        creatorName: 'HIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }),
    );
  }

  /**
   * Get a system-defined template by ID
   */
  private getSystemTemplateById(id: string): SetupTemplate | null {
    if (!id.startsWith('system-')) {
      return null;
    }

    const templateId = id.replace('system-', '');
    const tpl = SYSTEM_SETUP_TEMPLATES.find(t => t.id === templateId);

    if (!tpl) {
      return null;
    }

    return SetupTemplate.reconstitute({
      id: `system-${tpl.id}`,
      name: tpl.name,
      description: tpl.description,
      icon: tpl.icon,
      category: tpl.category,
      source: 'system',
      tools: tpl.tools,
      orchestration: tpl.orchestration,
      sharedDataSchema: tpl.sharedDataSchema || {},
      configFields: tpl.configFields || [],
      requiredCapabilities: tpl.requiredCapabilities || {},
      tags: tpl.tags,
      isSystem: true,
      isFeatured: true,
      deploymentCount: 0,
      creatorId: 'system',
      creatorName: 'HIVE',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  // ============================================================================
  // Mappers
  // ============================================================================

  private toDomain(id: string, data: SetupTemplateDocument): SetupTemplate {
    return SetupTemplate.reconstitute({
      id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category,
      source: data.source,
      tools: data.tools || [],
      orchestration: data.orchestration || [],
      sharedDataSchema: data.sharedDataSchema || {},
      configFields: data.configFields || [],
      requiredCapabilities: data.requiredCapabilities || {},
      tags: data.tags || [],
      isSystem: data.isSystem || false,
      isFeatured: data.isFeatured || false,
      deploymentCount: data.deploymentCount || 0,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      campusId: data.campusId,
      thumbnailUrl: data.thumbnailUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  }

  private toPersistence(
    template: SetupTemplate,
  ): Omit<SetupTemplateDocument, 'createdAt' | 'updatedAt'> {
    const props = template.toProps();

    return {
      name: props.name,
      description: props.description,
      icon: props.icon,
      category: props.category,
      source: props.source,
      tools: props.tools,
      orchestration: props.orchestration,
      sharedDataSchema: props.sharedDataSchema,
      configFields: props.configFields,
      requiredCapabilities: props.requiredCapabilities,
      tags: props.tags,
      isSystem: props.isSystem,
      isFeatured: props.isFeatured,
      deploymentCount: props.deploymentCount,
      creatorId: props.creatorId,
      creatorName: props.creatorName,
      campusId: props.campusId,
      thumbnailUrl: props.thumbnailUrl,
    };
  }
}

// ============================================================================
// SetupDeployment Repository Implementation
// ============================================================================

export class FirebaseAdminSetupDeploymentRepository implements ISetupDeploymentRepository {
  /**
   * Find a deployment by ID
   */
  async findById(id: string): Promise<Result<SetupDeployment>> {
    try {
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return Result.fail<SetupDeployment>('Setup deployment not found');
      }

      const data = docSnap.data() as SetupDeploymentDocument;
      const deployment = this.toDomain(id, data);

      return Result.ok(deployment);
    } catch (error) {
      return Result.fail<SetupDeployment>(`Failed to find setup deployment: ${error}`);
    }
  }

  /**
   * Find all deployments for a space
   */
  async findBySpaceId(spaceId: string): Promise<Result<SetupDeployment[]>> {
    try {
      const snapshot = await dbAdmin
        .collection(DEPLOYMENTS_COLLECTION)
        .where('spaceId', '==', spaceId)
        .where('status', 'in', ['active', 'paused'])
        .orderBy('deployedAt', 'desc')
        .get();

      const deployments = snapshot.docs.map(doc => {
        const data = doc.data() as SetupDeploymentDocument;
        return this.toDomain(doc.id, data);
      });

      return Result.ok(deployments);
    } catch (error) {
      return Result.fail<SetupDeployment[]>(`Failed to find deployments for space: ${error}`);
    }
  }

  /**
   * Find deployments with filtering and pagination
   */
  async findMany(
    options: SetupDeploymentQueryOptions = {},
  ): Promise<Result<PaginatedResult<SetupDeployment>>> {
    try {
      const {
        spaceId,
        campusId,
        templateId,
        status,
        deployedBy,
        orderBy = 'deployedAt',
        orderDirection = 'desc',
        limit = 50,
        cursor,
      } = options;

      let query: admin.firestore.Query = dbAdmin.collection(DEPLOYMENTS_COLLECTION);

      // Apply filters
      if (spaceId) {
        query = query.where('spaceId', '==', spaceId);
      }

      if (campusId) {
        query = query.where('campusId', '==', campusId);
      }

      if (templateId) {
        query = query.where('templateId', '==', templateId);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      if (deployedBy) {
        query = query.where('deployedBy', '==', deployedBy);
      }

      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);

      // Apply cursor for pagination
      if (cursor) {
        const cursorDoc = await dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      // Fetch extra for hasMore check
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

      const deployments = docs.map(doc => {
        const data = doc.data() as SetupDeploymentDocument;
        return this.toDomain(doc.id, data);
      });

      const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1]?.id : undefined;

      return Result.ok({
        items: deployments,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return Result.fail(`Failed to query setup deployments: ${error}`);
    }
  }

  /**
   * Save a deployment (create or update)
   */
  async save(deployment: SetupDeployment): Promise<Result<void>> {
    try {
      const data = this.toPersistence(deployment);
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(deployment.id);

      const existing = await docRef.get();

      if (existing.exists) {
        await docRef.update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await docRef.set({
          ...data,
          deployedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save setup deployment: ${error}`);
    }
  }

  /**
   * Update orchestration state
   */
  async updateOrchestrationState(
    id: string,
    state: Partial<OrchestrationState>,
  ): Promise<Result<void>> {
    try {
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id);

      const updates: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (state.currentPhase !== undefined) {
        updates['orchestrationState.currentPhase'] = state.currentPhase;
      }
      if (state.activeRules !== undefined) {
        updates['orchestrationState.activeRules'] = state.activeRules;
      }
      if (state.executedRules !== undefined) {
        updates['orchestrationState.executedRules'] = state.executedRules;
      }
      if (state.scheduledTriggers !== undefined) {
        updates['orchestrationState.scheduledTriggers'] = state.scheduledTriggers;
      }
      if (state.lastExecutionAt !== undefined) {
        updates['orchestrationState.lastExecutionAt'] = state.lastExecutionAt;
      }

      await docRef.update(updates);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update orchestration state: ${error}`);
    }
  }

  /**
   * Update shared data
   */
  async updateSharedData(id: string, updates: Record<string, unknown>): Promise<Result<void>> {
    try {
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id);

      const updateObj: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      for (const [key, value] of Object.entries(updates)) {
        updateObj[`sharedData.${key}`] = value;
      }

      await docRef.update(updateObj);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update shared data: ${error}`);
    }
  }

  /**
   * Add a log entry
   */
  async addLogEntry(id: string, entry: OrchestrationLogEntry): Promise<Result<void>> {
    try {
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id);

      await docRef.update({
        executionLog: admin.firestore.FieldValue.arrayUnion(entry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to add log entry: ${error}`);
    }
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: SetupDeploymentStatus): Promise<Result<void>> {
    try {
      const docRef = dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id);

      const updates: Record<string, unknown> = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (status === 'completed') {
        updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
      }
      if (status === 'archived') {
        updates.archivedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await docRef.update(updates);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update status: ${error}`);
    }
  }

  /**
   * Delete a deployment
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await dbAdmin.collection(DEPLOYMENTS_COLLECTION).doc(id).delete();
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete setup deployment: ${error}`);
    }
  }

  // ============================================================================
  // Mappers
  // ============================================================================

  private toDomain(id: string, data: SetupDeploymentDocument): SetupDeployment {
    // Convert Firestore timestamps to Dates in orchestration state
    const orchestrationState: OrchestrationState = {
      ...data.orchestrationState,
      scheduledTriggers: (data.orchestrationState?.scheduledTriggers || []).map(t => ({
        ...t,
        scheduledFor:
          t.scheduledFor instanceof admin.firestore.Timestamp
            ? t.scheduledFor.toDate()
            : new Date(t.scheduledFor as unknown as string),
      })),
      lastExecutionAt: data.orchestrationState?.lastExecutionAt
        ? (data.orchestrationState.lastExecutionAt as unknown as admin.firestore.Timestamp).toDate?.() ||
          null
        : null,
    };

    // Convert timestamps in execution log
    const executionLog: OrchestrationLogEntry[] = (data.executionLog || []).map(entry => ({
      ...entry,
      triggeredAt:
        entry.triggeredAt instanceof admin.firestore.Timestamp
          ? entry.triggeredAt.toDate()
          : new Date(entry.triggeredAt as unknown as string),
    }));

    return SetupDeployment.reconstitute({
      id,
      templateId: data.templateId,
      templateName: data.templateName,
      templateCategory: data.templateCategory,
      templateIcon: data.templateIcon,
      spaceId: data.spaceId,
      campusId: data.campusId,
      deployedBy: data.deployedBy,
      tools: data.tools || [],
      orchestrationState,
      orchestrationRules: data.orchestrationRules || [],
      sharedData: data.sharedData || {},
      config: data.config || {},
      status: data.status,
      executionLog,
      maxLogEntries: data.maxLogEntries || 100,
      deployedAt: data.deployedAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      archivedAt: data.archivedAt?.toDate(),
    });
  }

  private toPersistence(
    deployment: SetupDeployment,
  ): Omit<SetupDeploymentDocument, 'deployedAt' | 'updatedAt'> {
    const props = deployment.toProps();

    return {
      templateId: props.templateId,
      templateName: props.templateName,
      templateCategory: props.templateCategory,
      templateIcon: props.templateIcon,
      spaceId: props.spaceId,
      campusId: props.campusId,
      deployedBy: props.deployedBy,
      tools: props.tools,
      orchestrationState: props.orchestrationState as unknown as OrchestrationState,
      orchestrationRules: props.orchestrationRules,
      sharedData: props.sharedData,
      config: props.config,
      status: props.status,
      executionLog: props.executionLog as unknown as OrchestrationLogEntry[],
      maxLogEntries: props.maxLogEntries,
      completedAt: props.completedAt
        ? (admin.firestore.Timestamp.fromDate(props.completedAt) as unknown as admin.firestore.Timestamp)
        : undefined,
      archivedAt: props.archivedAt
        ? (admin.firestore.Timestamp.fromDate(props.archivedAt) as unknown as admin.firestore.Timestamp)
        : undefined,
    };
  }
}

// ============================================================================
// System-Defined Setup Templates
// ============================================================================

interface SystemSetupTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SetupCategory;
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  sharedDataSchema?: Record<string, unknown>;
  configFields?: SetupConfigField[];
  requiredCapabilities?: Partial<ToolCapabilities>;
  tags: string[];
}

// Import system-defined templates
import { SYSTEM_SETUP_TEMPLATES as EVENT_SERIES_TEMPLATES } from './event-series-template';

/**
 * All system-defined setup templates
 */
const SYSTEM_SETUP_TEMPLATES: SystemSetupTemplate[] = EVENT_SERIES_TEMPLATES;

// ============================================================================
// Singleton Instances
// ============================================================================

let templateRepositoryInstance: FirebaseAdminSetupTemplateRepository | null = null;
let deploymentRepositoryInstance: FirebaseAdminSetupDeploymentRepository | null = null;

/**
 * Get the server-side SetupTemplate Repository instance
 */
export function getServerSetupTemplateRepository(): ISetupTemplateRepository {
  if (!templateRepositoryInstance) {
    templateRepositoryInstance = new FirebaseAdminSetupTemplateRepository();
  }
  return templateRepositoryInstance;
}

/**
 * Get the server-side SetupDeployment Repository instance
 */
export function getServerSetupDeploymentRepository(): ISetupDeploymentRepository {
  if (!deploymentRepositoryInstance) {
    deploymentRepositoryInstance = new FirebaseAdminSetupDeploymentRepository();
  }
  return deploymentRepositoryInstance;
}

/**
 * Reset repository instances (for testing)
 */
export function resetSetupRepositories(): void {
  templateRepositoryInstance = null;
  deploymentRepositoryInstance = null;
}
