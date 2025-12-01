'use client';

/**
 * Streaming Canvas View
 *
 * Displays AI-generated canvas elements in real-time with animations.
 * Shows elements as they're added during streaming generation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { durationSeconds, easingArrays } from '@hive/tokens';

import { Card, CardContent } from '../../atomic/00-Global/atoms/card';
import { renderElement } from './element-renderers';
import { SkeletonCanvas } from './SkeletonCanvas';

// Lightweight local types to avoid tight coupling to @hive/core
type CanvasElement = {
  instanceId: string;
  elementId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
};

type ToolComposition = {
  id: string;
  name?: string;
  description?: string;
  elements: CanvasElement[];
  connections: Array<{
    from: { instanceId: string };
    to: { instanceId: string };
  }>;
};

export interface StreamingCanvasViewProps {
  /** Elements being added in real-time */
  elements: CanvasElement[];

  /** Current generation status */
  status: string;

  /** Is generation in progress */
  isGenerating: boolean;

  /** Final composition (when complete) */
  composition: ToolComposition | null;

  /** Progress 0-100 */
  progress: number;

  /** Enable interactive testing mode */
  interactive?: boolean;

  /** Callback when user interacts with an element in test mode */
  onInteraction?: (elementId: string, action: string, data: any) => void;
}

/**
 * Isolated Element Renderer
 *
 * Wraps element rendering in a memoized component to prevent hook count violations.
 * Each element's hooks (like useMemo in ResultListElement) are isolated to this
 * component boundary and don't affect StreamingCanvasView's hook count.
 */
const IsolatedElementRenderer = memo(({
  elementId,
  instanceId,
  config,
  interactive,
  onInteraction
}: {
  elementId: string;
  instanceId: string;
  config: Record<string, any>;
  interactive?: boolean;
  onInteraction?: (elementId: string, action: string, data: any) => void;
}) => {
  // In interactive mode, pass real handlers
  const handleChange = interactive
    ? (data: any) => onInteraction?.(instanceId, 'change', data)
    : () => {};

  const handleAction = interactive
    ? (action: string, payload: any) => onInteraction?.(instanceId, action, payload)
    : () => {};

  return (
    <>
      {renderElement(elementId, {
        id: instanceId,
        config: config as Record<string, any>,
        onChange: handleChange,
        onAction: handleAction
      })}
    </>
  );
});

IsolatedElementRenderer.displayName = 'IsolatedElementRenderer';

/**
 * Streaming Canvas View - Real-time element visualization
 */
export function StreamingCanvasView({
  elements,
  status,
  isGenerating,
  composition,
  progress,
  interactive = false,
  onInteraction
}: StreamingCanvasViewProps) {
  const [displayedElements, setDisplayedElements] = useState<CanvasElement[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Sync displayed elements with streaming elements (one at a time to preserve React keys)
  useEffect(() => {
    // Add new elements one at a time as they arrive
    if (elements.length > displayedElements.length) {
      const newElement = elements[elements.length - 1];
      setDisplayedElements(prev => [...prev, newElement!]);
    }
  }, [elements.length]); // Only depend on length, not the array itself

  // Mark as complete when composition is ready
  useEffect(() => {
    if (composition && !isComplete) {
      setIsComplete(true);
    }
  }, [composition, isComplete]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Test Mode Banner */}
      {interactive && (
        <div className="shrink-0 px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Test Mode</span>
            <span className="text-emerald-400/70">- Interact with your tool to try it out</span>
          </div>
        </div>
      )}

      {/* Status Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          {/* Status */}
          <div className="flex items-center gap-3">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                <span className="text-sm font-medium">{status}</span>
              </>
            ) : composition ? (
              <>
                <Check className="h-4 w-4 text-gold-achievement" />
                <span className="text-sm font-medium">{interactive ? 'Testing...' : 'Generation complete!'}</span>
              </>
            ) : (
              <span className="text-sm text-white/40">Ready to generate</span>
            )}
          </div>

          {/* Conversational Progress */}
          {isGenerating && displayedElements.length > 0 && (
            <div className="text-xs text-white/50">
              {displayedElements.length} of ~{Math.ceil(progress / 33)} elements
            </div>
          )}
        </div>

        {/* Tool name (if available) */}
        {composition && (
          <div className="mt-2 space-y-1">
            <h3 className="text-lg font-medium tracking-tight">{composition.name}</h3>
            {composition.description && (
              <p className="text-body-chat text-muted-foreground leading-relaxed">{composition.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-6">
        {/* Show skeleton immediately when generation starts with no elements yet */}
        {isGenerating && displayedElements.length === 0 ? (
          <SkeletonCanvas elementCount={3} />
        ) : (
          <div className="relative h-[600px] lg:h-[700px] rounded-lg border border-white/[0.08] bg-white/[0.01] p-8 overflow-y-auto">

            {/* Elements */}
            <AnimatePresence mode="popLayout">
              {displayedElements.map((element, index) => (
              <motion.div
                key={element.instanceId}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: durationSeconds.smooth,
                  delay: 0,
                  ease: easingArrays.default
                }}
                style={{
                  position: 'absolute',
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  minHeight: element.size.height
                }}
              >
                <Card className="overflow-hidden border border-white/10 shadow-sm">
                  <CardContent className="p-4">
                    {/* Element content */}
                    <div className="space-y-2">
                      <IsolatedElementRenderer
                        elementId={element.elementId}
                        instanceId={element.instanceId}
                        config={(element.config ?? {}) as Record<string, any>}
                        interactive={interactive}
                        onInteraction={onInteraction}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {displayedElements.length === 0 && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-body-chat text-white/40 leading-relaxed">
                  Canvas preview will appear here
                </p>
              </div>
            </div>
          )}

          {/* Connections (if composition is complete) */}
          {composition && composition.connections.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              {composition.connections.map((conn, index: number) => {
                // Find element positions
                const fromElement = displayedElements.find(
                  e => e.instanceId === conn.from.instanceId
                );
                const toElement = displayedElements.find(
                  e => e.instanceId === conn.to.instanceId
                );

                if (!fromElement || !toElement) return null;

                const x1 = fromElement.position.x + fromElement.size.width;
                const y1 = fromElement.position.y + fromElement.size.height / 2;
                const x2 = toElement.position.x;
                const y2 = toElement.position.y + toElement.size.height / 2;

                return (
                  <motion.line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#goldGradient)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: durationSeconds.dramatic, delay: durationSeconds.standard }}
                  />
                );
              })}
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--hive-gold-cta)" />
                  <stop offset="100%" stopColor="var(--hive-gold-achievement)" />
                </linearGradient>
              </defs>
            </svg>
          )}
          </div>
        )}

        {/* Element count */}
        {!isGenerating || displayedElements.length > 0 ? (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            {displayedElements.length > 0 && (
              <span>
                {displayedElements.length} element{displayedElements.length !== 1 ? 's' : ''} added
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
