'use client';

/**
 * Streaming Canvas View
 *
 * Displays AI-generated canvas elements in real-time with animations.
 * Shows elements as they're added during streaming generation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, memo } from 'react';
import { durationSeconds, easingArrays } from '@hive/tokens';

import { Card, CardContent } from '../../design-system/primitives';
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

  /** Layout mode for element rendering */
  layout?: 'flow' | 'grid' | 'stack';

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
  layout = 'flow',
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
                <ArrowPathIcon className="h-4 w-4 text-muted-foreground animate-spin" />
                <span className="text-sm font-medium">{status}</span>
              </>
            ) : composition ? (
              <>
                <CheckIcon className="h-4 w-4 text-gold-achievement" />
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
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-8 overflow-y-auto">

            {/* Elements - layout-aware rendering */}
            <AnimatePresence mode="popLayout">
              {layout === 'grid' ? (
                /* Grid layout: 12-column CSS Grid */
                <div className="grid grid-cols-12 gap-4">
                  {displayedElements.map((element) => {
                    const colSpan = Math.round((element.size.width / 600) * 12) || 12;
                    return (
                      <motion.div
                        key={element.instanceId}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          duration: durationSeconds.smooth,
                          ease: easingArrays.default
                        }}
                        className={`min-h-[60px] ${
                          colSpan <= 3 ? 'col-span-6 md:col-span-3' :
                          colSpan <= 4 ? 'col-span-12 md:col-span-4' :
                          colSpan <= 6 ? 'col-span-12 md:col-span-6' :
                          colSpan <= 8 ? 'col-span-12 md:col-span-8' :
                          colSpan <= 9 ? 'col-span-12 md:col-span-9' :
                          'col-span-12'
                        }`}
                      >
                        <Card className="overflow-hidden border border-white/10 shadow-sm h-full relative">
                          {!!element.config?.aiGenerated && (
                            <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium pointer-events-none" style={{ backgroundColor: 'rgba(212, 175, 55, 0.12)', color: 'var(--muted-foreground, #888)' }}>
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" /></svg>
                              AI
                            </div>
                          )}
                          <CardContent className="p-4">
                            <IsolatedElementRenderer
                              elementId={element.elementId}
                              instanceId={element.instanceId}
                              config={(element.config ?? {}) as Record<string, any>}
                              interactive={interactive}
                              onInteraction={onInteraction}
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : layout === 'stack' ? (
                /* Stack layout: vertical flexbox */
                <div className="flex flex-col gap-4">
                  {displayedElements.map((element) => (
                    <motion.div
                      key={element.instanceId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: durationSeconds.smooth,
                        ease: easingArrays.default
                      }}
                    >
                      <Card className="overflow-hidden border border-white/10 shadow-sm relative">
                        {!!element.config?.aiGenerated && (
                          <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium pointer-events-none" style={{ backgroundColor: 'rgba(212, 175, 55, 0.12)', color: 'var(--muted-foreground, #888)' }}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" /></svg>
                            AI
                          </div>
                        )}
                        <CardContent className="p-4">
                          <IsolatedElementRenderer
                            elementId={element.elementId}
                            instanceId={element.instanceId}
                            config={(element.config ?? {}) as Record<string, any>}
                            interactive={interactive}
                            onInteraction={onInteraction}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Flow layout: flex wrap (default) */
                <div className="flex flex-wrap gap-4">
                  {displayedElements.map((element) => (
                    <motion.div
                      key={element.instanceId}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: durationSeconds.smooth,
                        ease: easingArrays.default
                      }}
                      className="flex-1 min-w-[280px] max-w-full"
                    >
                      <Card className="overflow-hidden border border-white/10 shadow-sm relative">
                        {!!element.config?.aiGenerated && (
                          <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium pointer-events-none" style={{ backgroundColor: 'rgba(212, 175, 55, 0.12)', color: 'var(--muted-foreground, #888)' }}>
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" /></svg>
                            AI
                          </div>
                        )}
                        <CardContent className="p-4">
                          <IsolatedElementRenderer
                            elementId={element.elementId}
                            instanceId={element.instanceId}
                            config={(element.config ?? {}) as Record<string, any>}
                            interactive={interactive}
                            onInteraction={onInteraction}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

          {/* Empty state */}
          {displayedElements.length === 0 && !isGenerating && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <p className="text-body-chat text-white/40 leading-relaxed">
                  Canvas preview will appear here
                </p>
              </div>
            </div>
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
