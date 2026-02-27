import { z } from 'zod';

/**
 * HiveRuntimeContext v1
 *
 * The contract between HIVE and tools running inside iframes.
 * Injected synchronously into window.HIVE_RUNTIME at iframe generation time.
 * Tools use window.HIVE.getContext() to access this data.
 *
 * Rules:
 * - Always present for deployed tools. If it can't be constructed, the tool doesn't run.
 * - Never includes sensitive data (no tokens, emails, PII beyond userId).
 * - Versioned — tools can check version to handle future schema changes.
 */

export const RUNTIME_CONTEXT_VERSION = 'v1' as const;

export const SpaceContextSchema = z.object({
  spaceId: z.string(),
  spaceName: z.string(),
  campusId: z.string(),
  handle: z.string().nullable(),
});

export type SpaceContext = z.infer<typeof SpaceContextSchema>;

export const DeploymentContextSchema = z.object({
  deploymentId: z.string(),
  surface: z.enum(['sidebar', 'inline', 'modal', 'tab', 'standalone']),
  stateMode: z.enum(['shared', 'isolated']),
  toolId: z.string(),
  toolVersion: z.string().nullable(),
});

export type DeploymentContext = z.infer<typeof DeploymentContextSchema>;

export const ViewerContextSchema = z.object({
  userId: z.string(),
  displayName: z.string().nullable().optional(),
  role: z.enum(['owner', 'admin', 'leader', 'moderator', 'member', 'guest']),
  isMember: z.boolean(),
});

export type ViewerContext = z.infer<typeof ViewerContextSchema>;

export const HiveRuntimeContextSchema = z.object({
  version: z.literal(RUNTIME_CONTEXT_VERSION),
  space: SpaceContextSchema.nullable(),
  deployment: DeploymentContextSchema,
  viewer: ViewerContextSchema,
});

export type HiveRuntimeContext = z.infer<typeof HiveRuntimeContextSchema>;

/**
 * Build a RuntimeContext for a tool deployed in a Space.
 */
export function buildSpaceRuntimeContext(params: {
  space: SpaceContext;
  deployment: Omit<DeploymentContext, 'surface'> & { surface?: DeploymentContext['surface'] };
  viewer: ViewerContext;
}): HiveRuntimeContext {
  return {
    version: RUNTIME_CONTEXT_VERSION,
    space: params.space,
    deployment: {
      ...params.deployment,
      surface: params.deployment.surface ?? 'sidebar',
    },
    viewer: params.viewer,
  };
}

/**
 * Build a RuntimeContext for a standalone tool (/t/{toolId}).
 */
export function buildStandaloneRuntimeContext(params: {
  toolId: string;
  toolVersion: string | null;
  viewerId: string;
}): HiveRuntimeContext {
  return {
    version: RUNTIME_CONTEXT_VERSION,
    space: null,
    deployment: {
      deploymentId: `standalone:${params.toolId}`,
      surface: 'standalone',
      stateMode: 'shared',
      toolId: params.toolId,
      toolVersion: params.toolVersion,
    },
    viewer: {
      userId: params.viewerId,
      role: 'guest',
      isMember: false,
    },
  };
}

/**
 * Build a RuntimeContext for preview in HiveLab.
 * Uses mock data so creators can test their tool.
 */
export function buildPreviewRuntimeContext(params: {
  toolId: string;
  toolVersion: string | null;
  viewerId: string;
}): HiveRuntimeContext {
  return {
    version: RUNTIME_CONTEXT_VERSION,
    space: {
      spaceId: 'preview',
      spaceName: 'Preview Space',
      campusId: 'preview',
      handle: null,
    },
    deployment: {
      deploymentId: `preview:${params.toolId}`,
      surface: 'tab',
      stateMode: 'isolated',
      toolId: params.toolId,
      toolVersion: params.toolVersion,
    },
    viewer: {
      userId: params.viewerId,
      role: 'owner',
      isMember: true,
    },
  };
}

/**
 * Validate a runtime context object. Returns null if invalid.
 */
export function validateRuntimeContext(input: unknown): HiveRuntimeContext | null {
  const result = HiveRuntimeContextSchema.safeParse(input);
  return result.success ? result.data : null;
}
