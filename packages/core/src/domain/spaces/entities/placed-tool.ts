/**
 * PlacedTool Entity
 *
 * Represents a HiveLab tool that has been placed/deployed into a space.
 * This is the bridge between HiveLab (tool creation) and Spaces (tool usage).
 *
 * PlacedTools can appear in:
 * - Sidebar: Persistent tools visible in the space sidebar
 * - Inline: Tools embedded in chat messages
 * - Modal: Tools that open in a modal overlay
 * - Tab: Tools that appear as full-screen tabs
 */

import { Entity } from '../../shared/base/Entity.base';
import { Result } from '../../shared/base/Result';

/**
 * Where the tool is placed within the space
 */
export type PlacementLocation = 'sidebar' | 'inline' | 'modal' | 'tab';

/**
 * Source of the placement - system templates vs leader-created
 */
export type PlacementSource = 'system' | 'leader' | 'member';

/**
 * Who can see/interact with this placed tool
 */
export type PlacementVisibility = 'all' | 'members' | 'leaders';

interface PlacedToolProps {
  /** Reference to the HiveLab tool definition */
  toolId: string;

  /** Reference to the space this tool is placed in */
  spaceId: string;

  /** Where the tool appears in the space */
  placement: PlacementLocation;

  /** Display order within the placement location */
  order: number;

  /** Whether the tool is currently active/visible */
  isActive: boolean;

  /** Who placed this tool (system template or user) */
  source: PlacementSource;

  /** User ID of who placed this tool (null for system) */
  placedBy: string | null;

  /** When the tool was placed */
  placedAt: Date;

  /** Space-specific configuration overrides */
  configOverrides: Record<string, unknown>;

  /** Who can see/interact with this tool */
  visibility: PlacementVisibility;

  /** Custom title override (null uses tool's default) */
  titleOverride: string | null;

  /** Whether leaders can remove/modify this placement */
  isEditable: boolean;

  /** Runtime state for this placement (votes, submissions, etc.) */
  state: Record<string, unknown>;

  /** Last time the tool state was updated */
  stateUpdatedAt: Date | null;

  /**
   * Version of the tool definition when this placement was created.
   * Used to detect when the source tool has been updated.
   */
  toolVersion: string | null;

  /**
   * Whether the source tool has been updated since placement.
   * UI can show "update available" indicator.
   */
  isOutdated: boolean;
}

export class PlacedTool extends Entity<PlacedToolProps> {
  get toolId(): string {
    return this.props.toolId;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get placement(): PlacementLocation {
    return this.props.placement;
  }

  get order(): number {
    return this.props.order;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get source(): PlacementSource {
    return this.props.source;
  }

  get placedBy(): string | null {
    return this.props.placedBy;
  }

  get placedAt(): Date {
    return this.props.placedAt;
  }

  get configOverrides(): Record<string, unknown> {
    return this.props.configOverrides;
  }

  get visibility(): PlacementVisibility {
    return this.props.visibility;
  }

  get titleOverride(): string | null {
    return this.props.titleOverride;
  }

  get isEditable(): boolean {
    return this.props.isEditable;
  }

  get state(): Record<string, unknown> {
    return this.props.state;
  }

  get stateUpdatedAt(): Date | null {
    return this.props.stateUpdatedAt;
  }

  /**
   * Version of the tool when this placement was created
   */
  get toolVersion(): string | null {
    return this.props.toolVersion;
  }

  /**
   * Whether the source tool has been updated since placement
   */
  get isOutdated(): boolean {
    return this.props.isOutdated;
  }

  /**
   * Check if this is a system-placed tool (from templates)
   */
  get isSystemTool(): boolean {
    return this.props.source === 'system';
  }

  /**
   * Check if this tool can be modified by leaders
   */
  get canBeModified(): boolean {
    return this.props.isEditable;
  }

  private constructor(props: PlacedToolProps, id?: string) {
    // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
    super(props, id || `placement_${crypto.randomUUID()}`);
  }

  /**
   * Create a new PlacedTool entity
   */
  public static create(
    props: Partial<PlacedToolProps> & {
      toolId: string;
      spaceId: string;
      placement: PlacementLocation;
    },
    id?: string
  ): Result<PlacedTool> {
    if (!props.toolId || props.toolId.trim().length === 0) {
      return Result.fail<PlacedTool>('Tool ID is required');
    }

    if (!props.spaceId || props.spaceId.trim().length === 0) {
      return Result.fail<PlacedTool>('Space ID is required');
    }

    const validPlacements: PlacementLocation[] = ['sidebar', 'inline', 'modal', 'tab'];
    if (!validPlacements.includes(props.placement)) {
      return Result.fail<PlacedTool>(`Invalid placement: ${props.placement}. Must be one of: ${validPlacements.join(', ')}`);
    }

    const placedToolProps: PlacedToolProps = {
      toolId: props.toolId,
      spaceId: props.spaceId,
      placement: props.placement,
      order: props.order ?? 0,
      isActive: props.isActive ?? true,
      source: props.source ?? 'leader',
      placedBy: props.placedBy ?? null,
      placedAt: props.placedAt ?? new Date(),
      configOverrides: props.configOverrides ?? {},
      visibility: props.visibility ?? 'all',
      titleOverride: props.titleOverride ?? null,
      isEditable: props.isEditable ?? true,
      state: props.state ?? {},
      stateUpdatedAt: props.stateUpdatedAt ?? null,
      toolVersion: props.toolVersion ?? null,
      isOutdated: props.isOutdated ?? false,
    };

    return Result.ok<PlacedTool>(new PlacedTool(placedToolProps, id));
  }

  /**
   * Create a system-placed tool from a template
   */
  public static createFromTemplate(
    toolId: string,
    spaceId: string,
    placement: PlacementLocation,
    options?: {
      order?: number;
      configOverrides?: Record<string, unknown>;
      visibility?: PlacementVisibility;
      isEditable?: boolean;
    }
  ): Result<PlacedTool> {
    return PlacedTool.create({
      toolId,
      spaceId,
      placement,
      order: options?.order ?? 0,
      source: 'system',
      placedBy: null,
      configOverrides: options?.configOverrides ?? {},
      visibility: options?.visibility ?? 'all',
      isEditable: options?.isEditable ?? true, // Default: leaders can edit system tools
    });
  }

  /**
   * Activate the placed tool
   */
  public activate(): Result<void> {
    if (this.props.isActive) {
      return Result.ok<void>();
    }
    this.props.isActive = true;
    return Result.ok<void>();
  }

  /**
   * Deactivate the placed tool (hide without removing)
   */
  public deactivate(): Result<void> {
    if (!this.props.isActive) {
      return Result.ok<void>();
    }
    this.props.isActive = false;
    return Result.ok<void>();
  }

  /**
   * Change the display order
   */
  public reorder(newOrder: number): Result<void> {
    if (newOrder < 0) {
      return Result.fail<void>('Order must be a non-negative number');
    }
    this.props.order = newOrder;
    return Result.ok<void>();
  }

  /**
   * Change the placement location
   */
  public moveTo(newPlacement: PlacementLocation): Result<void> {
    const validPlacements: PlacementLocation[] = ['sidebar', 'inline', 'modal', 'tab'];
    if (!validPlacements.includes(newPlacement)) {
      return Result.fail<void>(`Invalid placement: ${newPlacement}`);
    }
    this.props.placement = newPlacement;
    return Result.ok<void>();
  }

  /**
   * Update the configuration overrides
   */
  public updateConfig(overrides: Record<string, unknown>): Result<void> {
    this.props.configOverrides = { ...this.props.configOverrides, ...overrides };
    return Result.ok<void>();
  }

  /**
   * Set a custom title
   */
  public setTitle(title: string | null): Result<void> {
    if (title !== null && title.trim().length === 0) {
      return Result.fail<void>('Title cannot be empty if provided');
    }
    if (title !== null && title.length > 100) {
      return Result.fail<void>('Title cannot exceed 100 characters');
    }
    this.props.titleOverride = title?.trim() ?? null;
    return Result.ok<void>();
  }

  /**
   * Update visibility settings
   */
  public setVisibility(visibility: PlacementVisibility): Result<void> {
    const validVisibilities: PlacementVisibility[] = ['all', 'members', 'leaders'];
    if (!validVisibilities.includes(visibility)) {
      return Result.fail<void>(`Invalid visibility: ${visibility}`);
    }
    this.props.visibility = visibility;
    return Result.ok<void>();
  }

  /**
   * Update the runtime state
   */
  public updateState(state: Record<string, unknown>): Result<void> {
    this.props.state = { ...this.props.state, ...state };
    this.props.stateUpdatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Replace the entire runtime state
   */
  public replaceState(state: Record<string, unknown>): Result<void> {
    this.props.state = state;
    this.props.stateUpdatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Clear the runtime state
   */
  public clearState(): Result<void> {
    this.props.state = {};
    this.props.stateUpdatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Lock this placement from being edited by leaders
   */
  public lock(): Result<void> {
    this.props.isEditable = false;
    return Result.ok<void>();
  }

  /**
   * Unlock this placement to allow leader edits
   */
  public unlock(): Result<void> {
    this.props.isEditable = true;
    return Result.ok<void>();
  }

  /**
   * Mark this placement as outdated (source tool was updated)
   */
  public markOutdated(): Result<void> {
    this.props.isOutdated = true;
    return Result.ok<void>();
  }

  /**
   * Update to a new tool version (clears outdated flag)
   */
  public updateToVersion(version: string): Result<void> {
    if (!version || version.trim().length === 0) {
      return Result.fail<void>('Version is required');
    }
    this.props.toolVersion = version.trim();
    this.props.isOutdated = false;
    return Result.ok<void>();
  }

  /**
   * Set version from external data (repository layer)
   */
  public setToolVersion(version: string | null): void {
    this.props.toolVersion = version;
  }

  /**
   * Set outdated flag from external data (repository layer)
   */
  public setIsOutdated(isOutdated: boolean): void {
    this.props.isOutdated = isOutdated;
  }

  /**
   * Update multiple properties at once
   */
  public update(updates: {
    order?: number;
    isActive?: boolean;
    placement?: PlacementLocation;
    configOverrides?: Record<string, unknown>;
    visibility?: PlacementVisibility;
    titleOverride?: string | null;
  }): Result<{ changedFields: string[] }> {
    const changedFields: string[] = [];

    if (updates.order !== undefined && updates.order !== this.props.order) {
      const result = this.reorder(updates.order);
      if (result.isFailure) {
        return Result.fail<{ changedFields: string[] }>(result.error ?? 'Order update failed');
      }
      changedFields.push('order');
    }

    if (updates.isActive !== undefined && updates.isActive !== this.props.isActive) {
      if (updates.isActive) {
        this.activate();
      } else {
        this.deactivate();
      }
      changedFields.push('isActive');
    }

    if (updates.placement !== undefined && updates.placement !== this.props.placement) {
      const result = this.moveTo(updates.placement);
      if (result.isFailure) {
        return Result.fail<{ changedFields: string[] }>(result.error ?? 'Placement update failed');
      }
      changedFields.push('placement');
    }

    if (updates.configOverrides !== undefined) {
      this.updateConfig(updates.configOverrides);
      changedFields.push('configOverrides');
    }

    if (updates.visibility !== undefined && updates.visibility !== this.props.visibility) {
      const result = this.setVisibility(updates.visibility);
      if (result.isFailure) {
        return Result.fail<{ changedFields: string[] }>(result.error ?? 'Visibility update failed');
      }
      changedFields.push('visibility');
    }

    if (updates.titleOverride !== undefined && updates.titleOverride !== this.props.titleOverride) {
      const result = this.setTitle(updates.titleOverride);
      if (result.isFailure) {
        return Result.fail<{ changedFields: string[] }>(result.error ?? 'Title update failed');
      }
      changedFields.push('titleOverride');
    }

    return Result.ok<{ changedFields: string[] }>({ changedFields });
  }
}
