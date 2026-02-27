'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  let res: Response;
  try {
    res = await fetch(`/api/tools/${toolId}`, { credentials: 'include' });
  } catch {
    throw new Error('network');
  }
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error('server');
  const result = await res.json();
  return result.data || result;
}

interface ToolCanvasInlineProps {
  toolId: string;
  onAddToSpace?: (toolId: string) => void;
}

export function ToolCanvasInline({ toolId, onAddToSpace }: ToolCanvasInlineProps) {
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
    const errMsg = error instanceof Error ? error.message : '';
    const label =
      errMsg === 'not_found' ? 'This app no longer exists' :
      errMsg === 'network' ? 'Network error — check your connection' :
      'Something went wrong loading this app';
    return (
      <div className="py-6 text-center">
        <p className="text-[13px] text-white/30">{label}</p>
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

  const hasInteracted = interactionRef.current;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      <div className="p-4 max-h-[400px] overflow-y-auto">
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

      {/* Post-interaction install nudge */}
      <AnimatePresence>
        {hasInteracted && onAddToSpace && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <span className="text-[12px] text-white/35">Like this? Add it to your space</span>
              <button
                onClick={() => onAddToSpace(toolId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.06] border border-white/[0.08] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all active:scale-[0.97]"
              >
                <Plus className="w-3 h-3" />
                Add to space
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
