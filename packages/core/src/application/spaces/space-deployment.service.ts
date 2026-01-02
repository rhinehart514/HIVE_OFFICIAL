/**
 * SpaceDeploymentService
 *
 * Application service for deploying HiveLab tools to spaces.
 * Handles:
 * - Placing tools in space sidebar/inline/modal/tab
 * - Auto-deploying system tools based on space category
 * - Managing tool placements (reorder, update, remove)
 * - Syncing tool state across spaces
 */

import { BaseApplicationService, ApplicationServiceContext, ServiceResult } from '../base.service';
import { Result } from '../../domain/shared/base/Result';
import { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
import {
  PlacedTool,
  PlacementLocation,
  PlacementVisibility,
} from '../../domain/spaces/entities/placed-tool';
import { ISpaceRepository } from '../../infrastructure/repositories/interfaces';
import {
  SYSTEM_TOOL_TEMPLATES,
  UNIVERSAL_DEFAULT_TEMPLATE,
  getTemplateForCategory,
  getTemplateById,
  getSystemTool,
  isSystemTool,
  type SystemToolTemplate,
  type UniversalTemplate,
} from '../../domain/hivelab/system-tool-templates';

// ============================================================
// Types
// ============================================================

/**
 * Input for placing a tool in a space
 */
export interface PlaceToolInput {
  spaceId: string;
  toolId: string;
  placement: PlacementLocation;
  order?: number;
  configOverrides?: Record<string, unknown>;
  visibility?: PlacementVisibility;
  titleOverride?: string;
}

/**
 * Result of placing a tool
 */
export interface PlaceToolResult {
  placementId: string;
  toolId: string;
  placement: PlacementLocation;
  order: number;
}

/**
 * Input for updating a placed tool
 */
export interface UpdatePlacedToolInput {
  spaceId: string;
  placementId: string;
  updates: {
    order?: number;
    isActive?: boolean;
    placement?: PlacementLocation;
    configOverrides?: Record<string, unknown>;
    visibility?: PlacementVisibility;
    titleOverride?: string | null;
  };
}

/**
 * Input for removing a placed tool
 */
export interface RemovePlacedToolInput {
  spaceId: string;
  placementId: string;
}

/**
 * Input for reordering placed tools
 */
export interface ReorderPlacedToolsInput {
  spaceId: string;
  placement: PlacementLocation;
  orderedIds: string[];
}

/**
 * Input for auto-deploying system tools
 */
export interface AutoDeployInput {
  spaceId: string;
  spaceCategory?: string;
  templateId?: string;
}

/**
 * Result of auto-deployment
 */
export interface AutoDeployResult {
  placedTools: PlaceToolResult[];
  templateUsed: string;
}

/**
 * Callbacks for persisting placed tools (injected by caller)
 */
export interface SpaceDeploymentCallbacks {
  savePlacedTool: (spaceId: string, placedTool: PlacedToolData) => Promise<Result<void>>;
  updatePlacedTool: (spaceId: string, placementId: string, updates: Partial<PlacedToolData>) => Promise<Result<void>>;
  deletePlacedTool: (spaceId: string, placementId: string) => Promise<Result<void>>;
  getPlacedTools: (spaceId: string) => Promise<Result<PlacedToolData[]>>;
}

/**
 * Data transfer object for placed tool persistence
 */
export interface PlacedToolData {
  id: string;
  toolId: string;
  spaceId: string;
  placement: PlacementLocation;
  order: number;
  isActive: boolean;
  source: 'system' | 'leader' | 'member';
  placedBy: string | null;
  placedAt: Date;
  configOverrides: Record<string, unknown>;
  visibility: PlacementVisibility;
  titleOverride: string | null;
  isEditable: boolean;
  state: Record<string, unknown>;
  stateUpdatedAt: Date | null;
}

// ============================================================
// Service Implementation
// ============================================================

export class SpaceDeploymentService extends BaseApplicationService {
  private spaceRepository: ISpaceRepository;
  private callbacks: SpaceDeploymentCallbacks;

  constructor(
    context: Partial<ApplicationServiceContext>,
    spaceRepository: ISpaceRepository,
    callbacks: SpaceDeploymentCallbacks
  ) {
    super(context);
    this.spaceRepository = spaceRepository;
    this.callbacks = callbacks;
  }

  /**
   * Place a tool in a space
   */
  async placeTool(
    input: PlaceToolInput
  ): Promise<Result<ServiceResult<PlaceToolResult>>> {
    return this.execute(async () => {
      // Validate user context
      const userCheck = this.validateUserContext();
      if (userCheck.isFailure) {
        return Result.fail<ServiceResult<PlaceToolResult>>(userCheck.error!);
      }

      // Get space
      const spaceResult = await this.spaceRepository.findById(input.spaceId);
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<PlaceToolResult>>('Space not found');
      }
      const space = spaceResult.getValue();

      // Check if tool is already placed
      const existingTool = space.getPlacedToolByToolId(input.toolId);
      if (existingTool) {
        return Result.fail<ServiceResult<PlaceToolResult>>(
          `Tool "${input.toolId}" is already placed in this space`
        );
      }

      // Determine if this is a system tool
      const isSystem = isSystemTool(input.toolId);
      const source = isSystem ? 'system' : 'leader';

      // Place the tool in the aggregate
      const placeResult = space.placeTool({
        toolId: input.toolId,
        placement: input.placement,
        order: input.order,
        placedBy: this.context.userId!,
        source,
        configOverrides: input.configOverrides,
        visibility: input.visibility,
        titleOverride: input.titleOverride,
        isEditable: true,
      });

      if (placeResult.isFailure) {
        return Result.fail<ServiceResult<PlaceToolResult>>(placeResult.error!);
      }

      const placedTool = placeResult.getValue();

      // Persist the placed tool
      const saveResult = await this.callbacks.savePlacedTool(
        input.spaceId,
        this.toPlacedToolData(placedTool)
      );
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<PlaceToolResult>>(saveResult.error!);
      }

      // Save space (to update lastActivityAt)
      await this.spaceRepository.save(space);

      return Result.ok<ServiceResult<PlaceToolResult>>({
        data: {
          placementId: placedTool.id,
          toolId: placedTool.toolId,
          placement: placedTool.placement,
          order: placedTool.order,
        },
      });
    }, 'SpaceDeploymentService.placeTool');
  }

  /**
   * Update a placed tool's configuration
   */
  async updatePlacedTool(
    input: UpdatePlacedToolInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate user context
      const userCheck = this.validateUserContext();
      if (userCheck.isFailure) {
        return Result.fail<ServiceResult<void>>(userCheck.error!);
      }

      // Get space
      const spaceResult = await this.spaceRepository.findById(input.spaceId);
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }
      const space = spaceResult.getValue();

      // Update the placed tool
      const updateResult = space.updatePlacedTool(input.placementId, input.updates);
      if (updateResult.isFailure) {
        return Result.fail<ServiceResult<void>>(updateResult.error!);
      }

      // Get the updated tool for persistence
      const placedTool = space.getPlacedToolById(input.placementId);
      if (!placedTool) {
        return Result.fail<ServiceResult<void>>('Placed tool not found after update');
      }

      // Persist the update
      const saveResult = await this.callbacks.updatePlacedTool(
        input.spaceId,
        input.placementId,
        input.updates
      );
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error!);
      }

      // Save space
      await this.spaceRepository.save(space);

      return Result.ok<ServiceResult<void>>({
        data: undefined,
      });
    }, 'SpaceDeploymentService.updatePlacedTool');
  }

  /**
   * Remove a placed tool from a space
   */
  async removePlacedTool(
    input: RemovePlacedToolInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate user context
      const userCheck = this.validateUserContext();
      if (userCheck.isFailure) {
        return Result.fail<ServiceResult<void>>(userCheck.error!);
      }

      // Get space
      const spaceResult = await this.spaceRepository.findById(input.spaceId);
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }
      const space = spaceResult.getValue();

      // Remove the placed tool
      const removeResult = space.removePlacedTool(input.placementId);
      if (removeResult.isFailure) {
        return Result.fail<ServiceResult<void>>(removeResult.error!);
      }

      // Delete from persistence
      const deleteResult = await this.callbacks.deletePlacedTool(
        input.spaceId,
        input.placementId
      );
      if (deleteResult.isFailure) {
        return Result.fail<ServiceResult<void>>(deleteResult.error!);
      }

      // Save space
      await this.spaceRepository.save(space);

      return Result.ok<ServiceResult<void>>({
        data: undefined,
      });
    }, 'SpaceDeploymentService.removePlacedTool');
  }

  /**
   * Reorder placed tools within a placement location
   */
  async reorderPlacedTools(
    input: ReorderPlacedToolsInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate user context
      const userCheck = this.validateUserContext();
      if (userCheck.isFailure) {
        return Result.fail<ServiceResult<void>>(userCheck.error!);
      }

      // Get space
      const spaceResult = await this.spaceRepository.findById(input.spaceId);
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }
      const space = spaceResult.getValue();

      // Reorder the tools
      const reorderResult = space.reorderPlacedTools(input.placement, input.orderedIds);
      if (reorderResult.isFailure) {
        return Result.fail<ServiceResult<void>>(reorderResult.error!);
      }

      // Update order in persistence for each tool
      for (let i = 0; i < input.orderedIds.length; i++) {
        const placementId = input.orderedIds[i]!;
        await this.callbacks.updatePlacedTool(input.spaceId, placementId, {
          order: i,
        } as Partial<PlacedToolData>);
      }

      // Save space
      await this.spaceRepository.save(space);

      return Result.ok<ServiceResult<void>>({
        data: undefined,
      });
    }, 'SpaceDeploymentService.reorderPlacedTools');
  }

  /**
   * Auto-deploy system tools based on space category
   */
  async autoDeploySystemTools(
    input: AutoDeployInput
  ): Promise<Result<ServiceResult<AutoDeployResult>>> {
    return this.execute(async () => {
      // Get space
      const spaceResult = await this.spaceRepository.findById(input.spaceId);
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<AutoDeployResult>>('Space not found');
      }
      const space = spaceResult.getValue();

      // Get the appropriate template
      const template = input.templateId
        ? getTemplateById(input.templateId) ?? UNIVERSAL_DEFAULT_TEMPLATE
        : getTemplateForCategory(input.spaceCategory);

      const placedTools: PlaceToolResult[] = [];

      // Deploy each slot from the template
      for (const slot of template.slots) {
        // Check if already placed
        if (space.getPlacedToolByToolId(slot.toolId)) {
          continue; // Skip already placed tools
        }

        // Place the system tool
        const placeResult = space.placeSystemTool(slot.toolId, 'sidebar', {
          order: slot.order,
          configOverrides: slot.config,
          visibility: 'all',
          isEditable: true, // Leaders can customize system tools
        });

        if (placeResult.isSuccess) {
          const placedTool = placeResult.getValue();

          // Persist
          await this.callbacks.savePlacedTool(
            input.spaceId,
            this.toPlacedToolData(placedTool)
          );

          placedTools.push({
            placementId: placedTool.id,
            toolId: placedTool.toolId,
            placement: placedTool.placement,
            order: placedTool.order,
          });
        }
      }

      // Save space
      await this.spaceRepository.save(space);

      return Result.ok<ServiceResult<AutoDeployResult>>({
        data: {
          placedTools,
          templateUsed: template.id,
        },
      });
    }, 'SpaceDeploymentService.autoDeploySystemTools');
  }

  /**
   * Get all placed tools for a space
   */
  async getPlacedTools(
    spaceId: string
  ): Promise<Result<ServiceResult<PlacedToolData[]>>> {
    return this.execute(async () => {
      const toolsResult = await this.callbacks.getPlacedTools(spaceId);
      if (toolsResult.isFailure) {
        return Result.fail<ServiceResult<PlacedToolData[]>>(toolsResult.error!);
      }

      return Result.ok<ServiceResult<PlacedToolData[]>>({
        data: toolsResult.getValue(),
      });
    }, 'SpaceDeploymentService.getPlacedTools');
  }

  /**
   * Get available system tools for the gallery
   */
  getAvailableSystemTools(): SystemToolTemplate[] {
    return SYSTEM_TOOL_TEMPLATES;
  }

  /**
   * Check if a tool is a system tool
   */
  isSystemTool(toolId: string): boolean {
    return isSystemTool(toolId);
  }

  /**
   * Get system tool template by ID
   */
  getSystemToolTemplate(toolId: string): SystemToolTemplate | undefined {
    return getSystemTool(toolId);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private toPlacedToolData(placedTool: PlacedTool): PlacedToolData {
    return {
      id: placedTool.id,
      toolId: placedTool.toolId,
      spaceId: placedTool.spaceId,
      placement: placedTool.placement,
      order: placedTool.order,
      isActive: placedTool.isActive,
      source: placedTool.source,
      placedBy: placedTool.placedBy,
      placedAt: placedTool.placedAt,
      configOverrides: placedTool.configOverrides,
      visibility: placedTool.visibility,
      titleOverride: placedTool.titleOverride,
      isEditable: placedTool.isEditable,
      state: placedTool.state,
      stateUpdatedAt: placedTool.stateUpdatedAt,
    };
  }
}

// ============================================================
// Factory Function
// ============================================================

/**
 * Create a SpaceDeploymentService instance
 */
export function createSpaceDeploymentService(
  context: Partial<ApplicationServiceContext>,
  spaceRepository: ISpaceRepository,
  callbacks: SpaceDeploymentCallbacks
): SpaceDeploymentService {
  return new SpaceDeploymentService(context, spaceRepository, callbacks);
}
