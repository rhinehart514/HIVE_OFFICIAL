/**
 * Tool Runtime Builder
 *
 * Transforms tool runtime state from hook format to modal component format.
 */

import type { UseSpacePageStateReturn } from '../hooks';

export function buildToolRuntime(toolRuntime: UseSpacePageStateReturn['toolRuntime']) {
  return {
    tool: { ...toolRuntime.tool!, status: toolRuntime.tool!.status || 'draft' },
    state: toolRuntime.state,
    sharedState: toolRuntime.sharedState,
    userState: toolRuntime.userState,
    isLoading: toolRuntime.isLoading,
    isExecuting: toolRuntime.isExecuting,
    isSaving: toolRuntime.isSaving,
    isSynced: toolRuntime.isSynced,
    lastSaved: toolRuntime.lastSaved,
    error: toolRuntime.error instanceof Error ? toolRuntime.error.message : toolRuntime.error,
    executeAction: async (action: string, elementId?: string, data?: Record<string, unknown>) => {
      const result = await toolRuntime.executeAction(elementId || '', action, data);
      return { success: result.success, data: result.state, error: result.error };
    },
    updateState: (elementId: string, data: unknown) => toolRuntime.updateState({ [elementId]: data }),
  };
}
