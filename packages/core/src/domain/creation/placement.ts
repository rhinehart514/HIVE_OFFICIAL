import { z } from 'zod';

export const PlacementTargetType = z.enum(['space', 'profile', 'feed']);
export type PlacementTargetType = z.infer<typeof PlacementTargetType>;

export const PlacementPermissionsSchema = z.object({
  canEdit: z.boolean().default(true),
  canRemove: z.boolean().default(true),
});

export const PlacementSettingsSchema = z.object({
  position: z.number().int().default(0),
  pinned: z.boolean().default(false),
});

/**
 * State isolation mode for tool postings
 *
 * - shared: Tool state is shared across all spaces (default for viral tools)
 * - isolated: Each space has its own state (for space-specific polls/data)
 */
export const StateIsolationMode = z.enum(['shared', 'isolated']);
export type StateIsolationMode = z.infer<typeof StateIsolationMode>;

/**
 * PlacedTool represents a tool "posted" to a surface (space, profile, feed)
 *
 * Key concepts:
 * - "Posting" (not "deploying") - lightweight, shareable across contexts
 * - Shared state by default - enables cross-space engagement
 * - Per-space presentation config - title, order, visibility
 */
export const PlacedToolSchema = z.object({
  toolId: z.string(),
  targetType: PlacementTargetType,
  targetId: z.string(),
  permissions: PlacementPermissionsSchema.default({ canEdit: true, canRemove: true }),
  settings: PlacementSettingsSchema.default({ position: 0, pinned: false }),
  // State isolation mode - shared by default for viral discovery
  stateMode: StateIsolationMode.default('shared'),
  // Presentation overrides (per-space)
  titleOverride: z.string().optional(),
  configOverrides: z.record(z.unknown()).optional(),
});

export const PLACED_TOOL_COLLECTION_NAME = 'placed_tools';

export function getPlacementCollectionPath(targetType: PlacementTargetType, targetId: string): string {
  return `${targetType}/${targetId}/${PLACED_TOOL_COLLECTION_NAME}`;
}

export function getPlacementDocPath(targetType: PlacementTargetType, targetId: string, placementId: string): string {
  return `${getPlacementCollectionPath(targetType, targetId)}/${placementId}`;
}

export function encodePlacementCompositeId(targetType: PlacementTargetType, targetId: string, placementId: string): string {
  return `${targetType}:${targetId}:${placementId}`;
}

export function decodePlacementCompositeId(compositeId: string): { targetType: PlacementTargetType; targetId: string; placementId: string } {
  const [tt, tid, pid] = compositeId.split(':');
  if (!tt || !tid || !pid) {
    throw new Error('Invalid composite ID format');
  }
  return { targetType: (tt as PlacementTargetType), targetId: tid, placementId: pid };
}

export function tryDecodePlacementCompositeId(compositeId: string): [boolean, { targetType: PlacementTargetType; targetId: string; placementId: string }?] {
  try {
    return [true, decodePlacementCompositeId(compositeId)];
  } catch {
    return [false];
  }
}

/**
 * Generate deployment ID for a posted tool based on state isolation mode
 *
 * - shared: tool:{toolId} - state shared across all postings
 * - isolated: space:{spaceId}_{toolId} - state isolated per space
 */
export function generatePostedToolDeploymentId(
  toolId: string,
  targetType: PlacementTargetType,
  targetId: string,
  stateMode: StateIsolationMode = 'shared'
): string {
  if (stateMode === 'shared') {
    // Shared state mode: use tool-level deployment ID
    return `tool:${toolId}`;
  } else {
    // Isolated state mode: use space-specific deployment ID
    return `${targetType}:${targetId}_${toolId}`;
  }
}

/**
 * Check if a tool posting uses shared state
 */
export function isSharedStatePosting(deploymentId: string): boolean {
  return deploymentId.startsWith('tool:');
}

/**
 * Extract toolId from a posting deployment ID
 */
export function extractToolIdFromPosting(deploymentId: string): string {
  if (deploymentId.startsWith('tool:')) {
    return deploymentId.replace('tool:', '');
  }
  // Isolated format: space:{spaceId}_{toolId} or profile:{profileId}_{toolId}
  const parts = deploymentId.split('_');
  return parts[parts.length - 1] || deploymentId;
}

