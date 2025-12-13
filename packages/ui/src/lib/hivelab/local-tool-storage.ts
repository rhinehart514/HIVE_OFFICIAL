/**
 * Local Tool Storage
 *
 * Manages localStorage persistence for HiveLab tools before user signup.
 * Allows unauthenticated users to build tools and save them locally.
 */

// Minimal local version of the HiveLab tool composition type
type ToolComposition = {
  id: string;
  name?: string;
  description?: string;
  // Stored as raw JSON-serializable data; shape is aligned with
  // the core ToolComposition type but kept flexible here.
  elements: unknown[];
  connections: unknown[];
};

const STORAGE_KEY = 'hive_local_tools';
const MAX_TOOLS = 10; // Limit to prevent localStorage bloat

/**
 * Stored tool with metadata
 */
export interface LocalTool {
  id: string;
  composition: ToolComposition;
  createdAt: string;
  updatedAt: string;
}

/**
 * Storage data structure
 */
interface LocalToolsData {
  tools: LocalTool[];
  version: number;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get all tools from localStorage
 */
export function getLocalTools(): LocalTool[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const parsed: LocalToolsData = JSON.parse(data);
    return parsed.tools || [];
  } catch (_error) {
    // Storage read failed - return empty
    return [];
  }
}

/**
 * Get a single tool by ID
 */
export function getLocalTool(id: string): LocalTool | null {
  const tools = getLocalTools();
  return tools.find(tool => tool.id === id) || null;
}

/**
 * Save a new tool to localStorage
 */
export function saveLocalTool(composition: ToolComposition): LocalTool | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const tools = getLocalTools();

    // Check limit - remove oldest if at max
    if (tools.length >= MAX_TOOLS) {
      tools.shift();
    }

    const now = new Date().toISOString();
    const localTool: LocalTool = {
      id: composition.id ?? `local_${Date.now()}`,
      composition,
      createdAt: now,
      updatedAt: now
    };

    tools.push(localTool);

    const data: LocalToolsData = {
      tools,
      version: 1
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return localTool;
  } catch (_error) {
    // Storage save failed
    return null;
  }
}

/**
 * Update an existing tool
 */
export function updateLocalTool(id: string, composition: ToolComposition): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const tools = getLocalTools();
    const index = tools.findIndex(tool => tool.id === id);

    if (index === -1) {
      return false;
    }

    const existingTool = tools[index];
    if (!existingTool) return false;

    tools[index] = {
      ...existingTool,
      composition,
      updatedAt: new Date().toISOString()
    };

    const data: LocalToolsData = {
      tools,
      version: 1
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (_error) {
    // Storage update failed
    return false;
  }
}

/**
 * Delete a tool from localStorage
 */
export function deleteLocalTool(id: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const tools = getLocalTools();
    const filtered = tools.filter(tool => tool.id !== id);

    if (filtered.length === tools.length) {
      return false;
    }

    const data: LocalToolsData = {
      tools: filtered,
      version: 1
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (_error) {
    // Storage delete failed
    return false;
  }
}

/**
 * Clear all local tools
 */
export function clearLocalTools(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (_error) {
    // Storage clear failed
    return false;
  }
}

/**
 * Get tool count
 */
export function getLocalToolCount(): number {
  return getLocalTools().length;
}

/**
 * Check if a tool exists
 */
export function hasLocalTool(id: string): boolean {
  return getLocalTool(id) !== null;
}

/**
 * Export all tools as JSON (for migration after signup)
 */
export function exportLocalTools(): string {
  const tools = getLocalTools();
  return JSON.stringify(tools, null, 2);
}

/**
 * Import tools from JSON
 */
export function importLocalTools(json: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const tools: LocalTool[] = JSON.parse(json);

    if (!Array.isArray(tools)) {
      throw new Error('Invalid tools data');
    }

    const data: LocalToolsData = {
      tools,
      version: 1
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (_error) {
    // Import failed
    return false;
  }
}

/**
 * React hook for local tool storage
 */
export function useLocalToolStorage() {
  return {
    getTools: getLocalTools,
    getTool: getLocalTool,
    saveTool: saveLocalTool,
    updateTool: updateLocalTool,
    deleteTool: deleteLocalTool,
    clearTools: clearLocalTools,
    getCount: getLocalToolCount,
    hasTool: hasLocalTool,
    exportTools: exportLocalTools,
    importTools: importLocalTools
  };
}

// ============================================================================
// WIP (Work In Progress) Tool Storage
// Separate from main local tools - for caching current editing session
// ============================================================================

const WIP_STORAGE_KEY = 'hive_wip_tool';

/**
 * WIP Tool Data - current editing session
 */
export interface WIPToolData {
  clientId: string;
  serverId: string | null;
  composition: ToolComposition;
  lastModified: number;
  prompt?: string;
}

/**
 * Save current WIP tool to localStorage
 */
export function saveWIPTool(data: WIPToolData): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(WIP_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (_error) {
    // WIP save failed
    return false;
  }
}

/**
 * Get current WIP tool from localStorage
 */
export function getWIPTool(): WIPToolData | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(WIP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WIPToolData;
  } catch (_error) {
    // WIP get failed
    return null;
  }
}

/**
 * Clear WIP tool from localStorage (after successful save)
 */
export function clearWIPTool(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(WIP_STORAGE_KEY);
    return true;
  } catch (_error) {
    // WIP clear failed
    return false;
  }
}

/**
 * Check if WIP tool exists and is recent (within 24 hours)
 */
export function hasRecentWIPTool(): boolean {
  const wip = getWIPTool();
  if (!wip) return false;

  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return Date.now() - wip.lastModified < twentyFourHoursMs;
}
