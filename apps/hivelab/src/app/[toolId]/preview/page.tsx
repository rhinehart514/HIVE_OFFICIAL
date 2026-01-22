'use client';

/**
 * HiveLab Tool Preview Page
 *
 * Per DRAMA plan Phase 4.4:
 * 1. "Preview Mode" pill in top-right with pulse animation
 * 2. Element interaction: Gold ripple on click/input
 * 3. Cascade visualization: Draw lines between connected elements briefly when data flows
 */

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ToolPreviewPage,
  renderElement,
  Skeleton,
  useConnectionCascade,
  type ToolComposition,
  type IDECanvasElement as CanvasElement,
  type IDEConnection as Connection,
} from '@hive/ui';
import { MOTION } from '@hive/ui/tokens/motion';
import { apiClient } from '@/lib/api-client';

const EASE = MOTION.ease.premium;

// Colors matching HiveLab theme
const COLORS = {
  gold: '#D4AF37',
  goldAlpha: 'rgba(212, 175, 55, 0.3)',
};

// Preview Mode Indicator Pill
function PreviewModeIndicator() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        ease: EASE,
      }}
      className="fixed top-4 right-4 z-50"
    >
      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
        style={{
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          color: COLORS.gold,
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        {/* Pulsing dot */}
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: COLORS.gold }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        Preview Mode
      </motion.div>
    </motion.div>
  );
}

// Gold ripple effect component
function GoldRipple({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!isActive || shouldReduceMotion) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${COLORS.goldAlpha} 0%, transparent 70%)`,
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

// Connection flow visualization
function ConnectionFlowLine({
  from,
  to,
  isActive,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!isActive || shouldReduceMotion) return null;

  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={from.x}
        y2={from.y}
        animate={{ x2: to.x, y2: to.y }}
        transition={{ duration: 0.3, ease: EASE }}
        stroke={COLORS.gold}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      {/* Flow particle */}
      <motion.circle
        r={4}
        fill={COLORS.gold}
        initial={{ cx: from.x, cy: from.y, opacity: 1 }}
        animate={{
          cx: [from.x, to.x],
          cy: [from.y, to.y],
          opacity: [1, 0],
        }}
        transition={{
          duration: 0.4,
          ease: EASE,
          opacity: { delay: 0.2 },
        }}
      />
    </motion.svg>
  );
}

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolPreviewPageRoute({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);
  const [composition, setComposition] = useState<ToolComposition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Element states for cascade (keyed by instanceId)
  const [elementStates, setElementStates] = useState<Record<string, Record<string, unknown>>>({});

  // Track which elements were recently updated for visual feedback
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

  // Track ripple effects per element
  const [rippleElements, setRippleElements] = useState<Set<string>>(new Set());

  // Track active cascade connections for visualization
  const [activeCascades, setActiveCascades] = useState<Array<{
    id: string;
    fromId: string;
    toId: string;
  }>>([]);

  // Element position refs for connection lines
  const elementRefs = useRef<Map<string, DOMRect>>(new Map());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handler to update element state
  const handleStateUpdate = useCallback((instanceId: string, newState: Record<string, unknown>) => {
    setElementStates((prev) => ({
      ...prev,
      [instanceId]: { ...prev[instanceId], ...newState },
    }));
  }, []);

  // Handler when cascade completes
  const handleCascadeComplete = useCallback((updatedElements: string[]) => {
    // Flash visual feedback on updated elements
    setRecentlyUpdated(new Set(updatedElements));
    setTimeout(() => setRecentlyUpdated(new Set()), 600);
  }, []);

  // Prepare cascade context
  const cascadeElements: CanvasElement[] = composition?.elements?.map((el, idx) => ({
    id: el.instanceId || `element_${idx}`,
    elementId: el.elementId,
    instanceId: el.instanceId || `${el.elementId}_${idx}`,
    position: el.position || { x: 0, y: 0 },
    size: el.size || { width: 240, height: 120 },
    config: el.config || {},
    zIndex: idx + 1,
    locked: false,
    visible: true,
  })) || [];

  const cascadeConnections: Connection[] = (composition?.connections || []).map((conn, idx) => {
    // Normalize connection format
    const from = conn.from as { instanceId: string; port?: string; output?: string };
    const to = conn.to as { instanceId: string; port?: string; input?: string };
    return {
      id: `conn_${idx}`,
      from: { instanceId: from.instanceId, port: from.port || from.output || 'output' },
      to: { instanceId: to.instanceId, port: to.port || to.input || 'input' },
    };
  });

  // Custom cascade handler to visualize connections
  const handleCascadeVisualization = useCallback((fromId: string, toId: string) => {
    if (shouldReduceMotion) return;

    const cascadeId = `${fromId}-${toId}-${Date.now()}`;
    setActiveCascades((prev) => [...prev, { id: cascadeId, fromId, toId }]);

    // Remove after animation
    setTimeout(() => {
      setActiveCascades((prev) => prev.filter((c) => c.id !== cascadeId));
    }, 500);
  }, [shouldReduceMotion]);

  // Initialize cascade hook with visualization
  const { handleElementAction: baseHandleElementAction } = useConnectionCascade({
    elements: cascadeElements,
    connections: cascadeConnections,
    elementStates,
    onStateUpdate: handleStateUpdate,
    onCascadeComplete: handleCascadeComplete,
  });

  // Wrap with visualization
  const handleElementAction = useCallback(
    (instanceId: string, elementId: string, action: string, state: Record<string, unknown>) => {
      // Add ripple effect to source element
      setRippleElements((prev) => new Set([...prev, instanceId]));

      // Find connected elements and visualize cascade
      cascadeConnections.forEach((conn) => {
        if (conn.from.instanceId === instanceId) {
          handleCascadeVisualization(instanceId, conn.to.instanceId);
        }
      });

      // Call original handler
      baseHandleElementAction(instanceId, elementId, action, state);
    },
    [baseHandleElementAction, cascadeConnections, handleCascadeVisualization]
  );

  // Fetch tool data
  useEffect(() => {
    if (!isClient || !toolId) return;

    const fetchTool = async () => {
      try {
        setIsLoading(true);

        // First check localStorage for preview data
        const previewData = localStorage.getItem(`hivelab_preview_${toolId}`);
        if (previewData) {
          setComposition(JSON.parse(previewData));
          setIsLoading(false);
          return;
        }

        // Fetch from API
        const response = await apiClient.get(`/api/tools/${toolId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tool');
        }

        const data = await response.json();
        const tool = data.tool || data;

        setComposition({
          id: tool.id,
          name: tool.name || 'Untitled Tool',
          description: tool.description || '',
          elements: tool.elements || [],
          connections: tool.connections || [],
          layout: tool.layout || 'flow',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [isClient, toolId]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/${toolId}`);
  };

  // Handle edit navigation
  const handleEdit = () => {
    router.push(`/${toolId}`);
  };

  // Handle run tool
  const handleRun = async (_composition: ToolComposition) => {
    // Track tool usage
    try {
      await apiClient.post(`/api/tools/${toolId}/run`);
    } catch {
      // Silently fail analytics
    }
  };

  // Handle open settings
  const handleOpenSettings = () => {
    router.push(`/${toolId}/deploy`);
  };

  // Clear ripple effect
  const clearRipple = useCallback((instanceId: string) => {
    setRippleElements((prev) => {
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });
  }, []);

  // Render tool runtime (elements with interactivity)
  const renderRuntime = (comp: ToolComposition, _mode: 'preview' | 'live') => {
    return (
      <div className="space-y-4 relative">
        {/* Connection flow visualizations */}
        <AnimatePresence>
          {activeCascades.map((cascade) => {
            const fromRect = elementRefs.current.get(cascade.fromId);
            const toRect = elementRefs.current.get(cascade.toId);

            if (!fromRect || !toRect) return null;

            return (
              <ConnectionFlowLine
                key={cascade.id}
                from={{
                  x: fromRect.right - fromRect.left,
                  y: (fromRect.top + fromRect.bottom) / 2 - fromRect.top,
                }}
                to={{
                  x: toRect.left - fromRect.left,
                  y: (toRect.top + toRect.bottom) / 2 - fromRect.top,
                }}
                isActive={true}
              />
            );
          })}
        </AnimatePresence>

        {comp.elements.map((element, index) => {
          const instanceId = element.instanceId || `${element.elementId}_${index}`;
          const currentState = elementStates[instanceId] || {};
          const isUpdated = recentlyUpdated.has(instanceId);
          const hasRipple = rippleElements.has(instanceId);

          return (
            <motion.div
              key={instanceId}
              ref={(el) => {
                if (el) {
                  elementRefs.current.set(instanceId, el.getBoundingClientRect());
                }
              }}
              className={`relative transition-all duration-300 ${
                isUpdated ? 'ring-2 ring-[var(--hive-brand-primary)] ring-opacity-50' : ''
              }`}
              animate={isUpdated ? {
                scale: [1, 1.02, 1],
              } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Gold ripple effect on interaction */}
              <GoldRipple
                isActive={hasRipple}
                onComplete={() => clearRipple(instanceId)}
              />

              {renderElement(element.elementId, {
                id: instanceId,
                config: element.config,
                data: currentState,
                onChange: (data) => {
                  // Add ripple on change
                  if (!shouldReduceMotion) {
                    setRippleElements((prev) => new Set([...prev, instanceId]));
                  }
                  // Update local state
                  handleStateUpdate(instanceId, data);
                },
                onAction: (action, payload) => {
                  // Update state with action result
                  const newState = {
                    ...currentState,
                    ...payload,
                    _lastAction: action,
                    _lastActionAt: new Date().toISOString(),
                  };
                  handleStateUpdate(instanceId, newState);

                  // Trigger cascade to connected elements
                  handleElementAction(instanceId, element.elementId, action, newState);
                },
              })}
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <Skeleton className="h-[500px] w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !composition) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-[var(--hive-status-error)]">{error || 'Tool not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Preview Mode Indicator */}
      <PreviewModeIndicator />

      <ToolPreviewPage
        composition={composition}
        initialMode="preview"
        onBack={handleBack}
        onEdit={handleEdit}
        onRun={handleRun}
        onOpenSettings={handleOpenSettings}
        renderRuntime={renderRuntime}
      />
    </>
  );
}
