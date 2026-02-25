'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { useToolRuntime } from '@/hooks/use-tool-runtime';

const LazyToolCanvas = dynamic(
  () => import('@hive/ui').then(mod => ({ default: mod.ToolCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 animate-pulse p-1">
        <div className="h-10 bg-white/[0.03] rounded-lg" />
        <div className="h-10 bg-white/[0.03] rounded-lg" />
        <div className="h-10 bg-white/[0.03] rounded-lg" />
      </div>
    ),
  }
);

interface ToolData {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  elements: Array<{
    elementId: string;
    instanceId: string;
    config: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  connections?: Array<{
    from: { instanceId: string; port: string };
    to: { instanceId: string; port: string };
  }>;
  pages?: Array<{
    id: string;
    name: string;
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      onAction?: { type: 'navigate'; targetPageId: string };
    }>;
    connections?: Array<{
      from: { instanceId: string; port: string };
      to: { instanceId: string; port: string };
    }>;
    isStartPage?: boolean;
  }>;
}

async function fetchToolForInline(toolId: string): Promise<ToolData> {
  const res = await fetch(`/api/tools/${toolId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load');
  const result = await res.json();
  return result.data || result;
}

export function ToolCanvasInline({ toolId }: { toolId: string }) {
  const { user } = useAuth();
  const interactionRef = useRef(false);
  const [, setInteracted] = useState(false);

  const { data: tool, isLoading, error } = useQuery({
    queryKey: ['tool-inline', toolId],
    queryFn: () => fetchToolForInline(toolId),
    staleTime: 5 * 60_000,
  });

  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  const handleElementChange = useCallback((instanceId: string, data: unknown) => {
    runtime.updateState({ [instanceId]: data });
    if (!interactionRef.current) {
      interactionRef.current = true;
      setInteracted(true);
    }
  }, [runtime]);

  const handleElementAction = useCallback((instanceId: string, action: string, payload: unknown) => {
    runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
    if (!interactionRef.current) {
      interactionRef.current = true;
      setInteracted(true);
    }
  }, [runtime]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse p-1">
        <div className="h-10 bg-white/[0.03] rounded-lg" />
        <div className="h-10 bg-white/[0.03] rounded-lg" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13px] text-white/30">Couldn&apos;t load this one</p>
      </div>
    );
  }

  if (tool.elements.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13px] text-white/30">Nothing to show yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-4 max-h-[400px] overflow-y-auto">
      <LazyToolCanvas
        elements={tool.elements}
        pages={tool.pages}
        state={runtime.state}
        sharedState={runtime.sharedState}
        userState={runtime.userState}
        connections={tool.connections || []}
        layout="stack"
        onElementChange={handleElementChange}
        onElementAction={handleElementAction}
        isLoading={runtime.isLoading || runtime.isExecuting}
        error={runtime.error?.message || null}
        context={{
          userId: user?.uid,
          userDisplayName: user?.displayName || user?.fullName || undefined,
          userRole: user ? 'member' : 'guest',
          isSpaceLeader: false,
        }}
      />
    </div>
  );
}
