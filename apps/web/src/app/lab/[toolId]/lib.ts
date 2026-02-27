export interface ToolApiTool {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'space';
  category?: string;
  ownerId: string;
  elements?: Array<{
    elementId: string;
    instanceId?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  connections?: Array<{
    from: { instanceId: string; port?: string };
    to: { instanceId: string; port?: string };
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

export async function fetchTool(toolId: string): Promise<ToolApiTool> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Tool not found');
    throw new Error('Failed to load tool');
  }
  const result = await response.json();
  return result.data || result.tool || result;
}
