'use client';

/**
 * useUnpinTool - Mutation hook for unpinning tools from space sidebar
 *
 * Wires DELETE /api/spaces/[spaceId]/tools to remove a placed tool.
 * Invalidates space tools cache on success.
 *
 * @version 1.0.0 - Phase 1 Wiring (Feb 2026)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { spaceToolsKeys } from '../use-space-tools';

interface UnpinToolParams {
  spaceId: string;
  placementId: string;
}

interface UnpinToolResponse {
  success: boolean;
  message?: string;
}

async function unpinTool({ spaceId, placementId }: UnpinToolParams): Promise<UnpinToolResponse> {
  const response = await fetch(`/api/spaces/${spaceId}/tools`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placementId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to unpin tool');
  }

  return response.json();
}

export function useUnpinTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: unpinTool,
    onSuccess: (_, variables) => {
      // Invalidate space tools cache
      queryClient.invalidateQueries({
        queryKey: spaceToolsKeys.space(variables.spaceId),
      });

      toast.success('Tool unpinned from sidebar');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unpin tool');
    },
  });
}
