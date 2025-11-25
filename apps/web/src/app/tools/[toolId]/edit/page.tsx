"use client";

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ToolEditPage } from '../../../../../../../packages/ui/src/pages/hivelab/ToolEditPage';
import type { ToolComposition } from '@hive/core';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@hive/auth-logic';
import { ToolNavigation } from '@/lib/tool-navigation';

// Starter composition (replace with fetch for existing tools)
const STARTER_COMPOSITION: ToolComposition = {
  id: 'new-tool',
  name: 'Untitled Tool',
  description: '',
  elements: [],
  connections: [],
  layout: 'grid',
};

export default function ToolEditRoutePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // Hydrate composition from localStorage (AI-generated) or use starter
  const initialComposition = useMemo(() => {
    if (typeof window === 'undefined') return STARTER_COMPOSITION;

    const toolId = params.toolId as string;
    const savedKey = `hivelab_edit_composition_${toolId}`;
    const saved = localStorage.getItem(savedKey);

    if (saved) {
      try {
        const composition = JSON.parse(saved);
        // Clean up after loading to avoid stale data
        localStorage.removeItem(savedKey);
        return composition as ToolComposition;
      } catch (e) {
        console.error('Failed to parse saved composition', e);
      }
    }

    return STARTER_COMPOSITION;
  }, [params.toolId]);

  const handleSave = async (composition: ToolComposition) => {
    try {
      const res = await apiClient.put('/api/tools', {
        toolId: params.toolId,
        type: 'visual',
        status: 'draft',
        elements: composition.elements,
        config: { composition },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed to save tool (${res.status})`);
      }
    } catch {
      // Swallow error for now; in-app toasts handled elsewhere
    }
  };

  const handlePreview = (composition: ToolComposition) => {
    router.push(`/tools/${composition.id}/preview`);
  };

  const handleCancel = () => {
    ToolNavigation.goBack('marketplace');
  };

  if (!user) return null;

  return (
    <ToolEditPage
      userId={user.uid}
      initialComposition={initialComposition}
      onSave={handleSave}
      onPreview={handlePreview}
      onCancel={handleCancel}
    />
  );
}
