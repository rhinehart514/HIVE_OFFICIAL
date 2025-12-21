/**
 * Tool API Fetchers for React Query
 *
 * Pure fetch functions for HiveLab tools.
 */

// ============================================================
// Types
// ============================================================

export interface ToolElementDTO {
  elementId: string;
  instanceId: string;
  type?: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ToolDTO {
  id: string;
  name: string;
  description?: string;
  elements: ToolElementDTO[];
  category?: string;
  version?: number;
  currentVersion?: number;
  status?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  creatorId?: string;
  campusId?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  versions?: Array<{
    version: string;
    createdAt: string;
    changelog?: string;
  }>;
}

export interface ToolStateDTO {
  state: Record<string, unknown>;
  metadata: {
    version: string;
    lastSaved: string | null;
    autoSave: boolean;
    size: number;
  };
  exists: boolean;
}

export interface ToolWithStateDTO {
  tool: ToolDTO;
  state?: Record<string, unknown>;
  stateMetadata?: ToolStateDTO["metadata"];
  stateExists?: boolean;
}

// ============================================================
// Helper: Normalize elements
// ============================================================

function normalizeElements(elements: Array<Record<string, unknown>>): ToolElementDTO[] {
  return elements.map((el) => {
    const rawInstanceId = (el.instanceId ?? el.id ?? el.elementId) as
      | string
      | number
      | undefined;
    const rawElementId = (el.elementId ?? el.id) as string | number | undefined;
    return {
      elementId:
        rawElementId != null
          ? String(rawElementId)
          : String(rawInstanceId ?? ""),
      instanceId:
        rawInstanceId != null
          ? String(rawInstanceId)
          : String(rawElementId ?? ""),
      type: el.type as string | undefined,
      config: (el.config as Record<string, unknown>) || {},
      position: el.position as { x: number; y: number } | undefined,
      size: el.size as { width: number; height: number } | undefined,
    };
  });
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Fetch a tool by ID
 */
export async function fetchTool(toolId: string): Promise<ToolDTO> {
  const res = await fetch(`/api/tools/${toolId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Tool not found");
    }
    throw new Error(`Failed to fetch tool: ${res.status}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    elements: normalizeElements(data.elements || []),
    category: data.category,
    version: data.version,
    currentVersion: data.currentVersion,
    status: data.status || "draft",
    config: data.config,
    metadata: data.metadata,
    creatorId: data.creatorId,
    campusId: data.campusId,
    isPublished: data.isPublished,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    versions: data.versions,
  };
}

/**
 * Fetch tool with state (combined endpoint - reduces N+1)
 */
export async function fetchToolWithState(
  toolId: string,
  deploymentId?: string
): Promise<ToolWithStateDTO> {
  const url = deploymentId
    ? `/api/tools/${toolId}/with-state?deploymentId=${encodeURIComponent(deploymentId)}`
    : `/api/tools/${toolId}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Tool not found");
    }
    throw new Error(`Failed to fetch tool: ${res.status}`);
  }

  const data = await res.json();

  // Handle combined response format
  const toolData = data.tool || data;

  return {
    tool: {
      id: toolData.id,
      name: toolData.name,
      description: toolData.description,
      elements: normalizeElements(toolData.elements || []),
      category: toolData.category,
      version: toolData.version,
      currentVersion: toolData.currentVersion,
      status: toolData.status || "draft",
      config: toolData.config,
      metadata: toolData.metadata,
      creatorId: toolData.creatorId,
      campusId: toolData.campusId,
      isPublished: toolData.isPublished,
      createdAt: toolData.createdAt,
      updatedAt: toolData.updatedAt,
      versions: toolData.versions,
    },
    state: data.state,
    stateMetadata: data.stateMetadata,
    stateExists: data.stateExists,
  };
}

/**
 * Fetch tool state by deployment ID
 */
export async function fetchToolState(deploymentId: string): Promise<ToolStateDTO> {
  const res = await fetch(`/api/tools/state/${encodeURIComponent(deploymentId)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return {
        state: {},
        metadata: {
          version: "1.0.0",
          lastSaved: null,
          autoSave: true,
          size: 0,
        },
        exists: false,
      };
    }
    throw new Error(`Failed to fetch tool state: ${res.status}`);
  }

  const data = await res.json();

  return {
    state: data.state || {},
    metadata: data.metadata || {
      version: "1.0.0",
      lastSaved: null,
      autoSave: true,
      size: 0,
    },
    exists: data.exists !== false,
  };
}

/**
 * Save tool state
 */
export async function saveToolState(
  deploymentId: string,
  state: Record<string, unknown>,
  options?: {
    toolId?: string;
    spaceId?: string;
    merge?: boolean;
  }
): Promise<{ success: boolean; updatedAt: string }> {
  const res = await fetch(`/api/tools/state/${encodeURIComponent(deploymentId)}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state,
      toolId: options?.toolId,
      spaceId: options?.spaceId,
      merge: options?.merge,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save state: ${res.status}`);
  }

  const data = await res.json();
  return { success: true, updatedAt: data.updatedAt };
}

/**
 * Fetch user's tools
 */
export async function fetchUserTools(filters?: {
  status?: string;
}): Promise<ToolDTO[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);

  const res = await fetch(`/api/tools?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tools: ${res.status}`);
  }

  const data = await res.json();
  const tools = data.tools || data.data || [];

  return tools.map((tool: Record<string, unknown>) => ({
    id: tool.id as string,
    name: tool.name as string,
    description: tool.description as string | undefined,
    elements: normalizeElements((tool.elements as Array<Record<string, unknown>>) || []),
    category: tool.category as string | undefined,
    version: tool.version as number | undefined,
    currentVersion: tool.currentVersion as number | undefined,
    status: (tool.status as string) || "draft",
    config: tool.config as Record<string, unknown> | undefined,
    metadata: tool.metadata as Record<string, unknown> | undefined,
    creatorId: tool.creatorId as string | undefined,
    campusId: tool.campusId as string | undefined,
    isPublished: tool.isPublished as boolean | undefined,
    createdAt: tool.createdAt as string | undefined,
    updatedAt: tool.updatedAt as string | undefined,
  }));
}
