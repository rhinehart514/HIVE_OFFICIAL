/**
 * Setup Repository Types - Client-safe type definitions
 *
 * These types are safe to import from client components.
 * For server-side implementations, import from '@hive/core/server'.
 */

import { Result } from '../../shared/base/Result';
import { SetupTemplate, SetupCategory, SetupSource } from './setup-template';
import {
  SetupDeployment,
  SetupDeploymentStatus,
  OrchestrationState,
  OrchestrationLogEntry,
} from './setup-deployment';

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
