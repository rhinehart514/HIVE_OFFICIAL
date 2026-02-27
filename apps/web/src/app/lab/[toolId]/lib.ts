import type {
  HiveLabComposition,
  IDECanvasElement,
  IDEConnection,
  ToolDeploymentConfig as DeploymentConfig,
} from '@hive/ui';

interface ToolApiTool {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'space';
  category?: string;
  config?: {
    composition?: {
      elements?: Array<{
        id?: string;
        elementId: string;
        instanceId?: string;
        config?: Record<string, unknown>;
        position?: { x: number; y: number };
        size?: { width: number; height: number };
      }>;
      connections?: Array<{
        from: { instanceId: string; port?: string; output?: string };
        to: { instanceId: string; port?: string; input?: string };
      }>;
    };
  };
  elements?: Array<{
    id?: string;
    elementId: string;
    instanceId?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  connections?: Array<{
    from: { instanceId: string; port?: string; output?: string };
    to: { instanceId: string; port?: string; input?: string };
  }>;
  createdAt: string;
  updatedAt: string;
  remixedFrom?: {
    toolId: string;
    toolName: string;
    creatorId: string;
    creatorName: string;
  } | null;
}

export type { ToolApiTool };

export interface Space {
  id: string;
  name: string;
  handle?: string;
  memberCount?: number;
  description?: string;
  membership?: {
    role: string;
  };
}

export async function fetchTool(toolId: string): Promise<ToolApiTool> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Tool not found');
    }
    throw new Error('Failed to load tool');
  }
  const result = await response.json();
  return result.data || result.tool || result;
}

export async function fetchUserSpaces(): Promise<Space[]> {
  const response = await fetch('/api/profile/my-spaces?limit=50', {
    credentials: 'include',
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.spaces || [];
}

export async function saveTool(
  toolId: string,
  composition: HiveLabComposition
): Promise<void> {
  const response = await fetch(`/api/tools/${toolId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: composition.name,
      description: composition.description,
      elements: composition.elements.map((el) => ({
        elementId: el.elementId,
        instanceId: el.instanceId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: composition.connections.map((conn) => ({
        from: conn.from,
        to: conn.to,
      })),
      layout: composition.layout,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save tool');
  }
}

export async function deployToolToTarget(
  toolId: string,
  config: DeploymentConfig
): Promise<void> {
  const response = await fetch(`/api/tools/${toolId}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      targetType: config.targetType,
      targetId: config.targetId,
      surface: config.surface,
      permissions: config.permissions,
      settings: config.settings,
      privacy: config.privacy,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.error || errorData.message || 'Failed to deploy tool');
    if (errorData.validationErrors) {
      (err as unknown as Record<string, unknown>).validationErrors = errorData.validationErrors;
    }
    throw err;
  }
}

export function transformToCanvasElements(
  tool: ToolApiTool
): { elements: IDECanvasElement[]; connections: IDEConnection[] } {
  const rawElements =
    tool.config?.composition?.elements || tool.elements || [];
  const rawConnections =
    tool.config?.composition?.connections || tool.connections || [];

  const elements: IDECanvasElement[] = rawElements.map((el, index) => ({
    id: el.id || `element_${index}`,
    elementId: el.elementId,
    instanceId: el.instanceId || `${el.elementId}_${index}`,
    position: el.position || { x: 100 + index * 50, y: 100 + index * 50 },
    size: el.size || { width: 240, height: 120 },
    config: el.config || {},
    zIndex: index + 1,
    locked: false,
    visible: true,
  }));

  const connections: IDEConnection[] = rawConnections.map((conn, index) => ({
    id: `conn_${index}`,
    from: {
      instanceId: conn.from.instanceId,
      port: conn.from.port || conn.from.output || 'output',
    },
    to: {
      instanceId: conn.to.instanceId,
      port: conn.to.port || conn.to.input || 'input',
    },
  }));

  return { elements, connections };
}
