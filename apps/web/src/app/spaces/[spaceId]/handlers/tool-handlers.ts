/**
 * Tool Handlers - HiveLab tool operations
 *
 * Handles: open HiveLab, deploy existing tool, quick deploy, remove tool
 */

import { toast } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import type { ToolHandlerDeps, ToolData, QuickTemplate } from './types';

/**
 * Create tool-related handlers with the given dependencies
 */
export function createToolHandlers(deps: ToolHandlerDeps) {
  const { spaceId, router, tools, setTools, leaderOnboarding, refresh } = deps;

  // Handle open HiveLab with space context
  const handleOpenHiveLab = (): void => {
    if (!spaceId) return;
    router.push(`/tools/create?spaceId=${spaceId}`);
  };

  // Handle deploy existing tool to space
  const handleDeployExistingTool = async (toolId: string): Promise<void> => {
    if (!spaceId) throw new Error('Space not found');

    const response = await secureApiFetch('/api/tools/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId,
        deployTo: 'space',
        targetId: spaceId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to deploy tool');
    }

    refresh();
    toast.success('Tool deployed', 'Tool has been added to the sidebar.');
  };

  // Handle quick deploy of a template tool
  const handleQuickDeploy = async (template: QuickTemplate): Promise<void> => {
    if (!spaceId) throw new Error('Space not found');

    // First, create the tool from the template
    const createResponse = await secureApiFetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        composition: template.composition,
        status: 'published', // Publish immediately for quick deploy
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create tool');
    }

    const { tool } = await createResponse.json();

    // Then deploy it to this space
    const deployResponse = await secureApiFetch(`/api/spaces/${spaceId}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        titleOverride: template.name,
        position: 'sidebar',
      }),
    });

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to deploy tool');
    }

    // Refresh tools list to show the new tool
    await refreshToolsList(spaceId, setTools);

    // Mark the deploy-tool task as complete
    leaderOnboarding.markTaskComplete('deployTool');

    toast.success(`${template.name} deployed!`, 'Your tool is now live in the sidebar.');
  };

  // Handle removing a tool from the space sidebar
  const handleRemoveTool = async (toolId: string): Promise<void> => {
    if (!spaceId) return;

    // Find the tool to get placementId
    const tool = tools.find((t) => t.id === toolId || t.toolId === toolId);
    if (!tool?.placementId) {
      toast.error('Tool not found', 'Unable to remove this tool.');
      return;
    }

    try {
      const response = await secureApiFetch(`/api/spaces/${spaceId}/tools`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId: tool.placementId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove tool');
      }

      // Update local state immediately
      setTools((prev) => prev.filter((t) => t.placementId !== tool.placementId));
      toast.success('Tool removed', `${tool.name} has been removed from the sidebar.`);
    } catch (error) {
      logger.error('Failed to remove tool', { toolId, error });
      toast.error(
        'Failed to remove tool',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  return {
    handleOpenHiveLab,
    handleDeployExistingTool,
    handleQuickDeploy,
    handleRemoveTool,
  };
}

/**
 * Helper to refresh tools list from API
 */
async function refreshToolsList(
  spaceId: string,
  setTools: React.Dispatch<React.SetStateAction<ToolData[]>>
): Promise<void> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/tools`);
  if (res.ok) {
    const data = await res.json();
    const toolList = Array.isArray(data.tools) ? data.tools : [];
    setTools(
      toolList.map((t: Record<string, unknown>) => ({
        id: (t.placementId as string) || (t.toolId as string),
        toolId: t.toolId as string,
        placementId: t.placementId as string,
        name: (t.titleOverride as string) || (t.name as string),
        type: (t.category as string) || 'tool',
        isActive: t.isActive === true,
        responseCount: (t.usageCount as number) || 0,
      }))
    );
  }
}
