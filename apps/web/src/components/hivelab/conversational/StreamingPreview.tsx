'use client';

/**
 * StreamingPreview - Live preview as AI generates a tool.
 *
 * Parses NDJSON streaming chunks from the generate API
 * and renders elements incrementally as they arrive.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import { ToolCanvas, type ToolElement } from '@hive/ui';
import type { StreamingChunk } from '@/lib/ai-generator';

const EASE = MOTION.ease.premium;

type GenerationPhase = 'connecting' | 'thinking' | 'building' | 'complete' | 'error';

interface GenerationResult {
  name: string;
  description: string;
  elements: ToolElement[];
  isIteration?: boolean;
}

interface StreamingPreviewProps {
  prompt: string;
  toolId: string;
  spaceContext?: {
    spaceId: string;
    spaceName: string;
    spaceType?: string;
  };
  existingComposition?: {
    elements: ToolElement[];
    name?: string;
  };
  isIteration?: boolean;
  onComplete: (result: GenerationResult) => void;
  onError: (error: string) => void;
}

export function StreamingPreview({
  prompt,
  toolId: _toolId,
  spaceContext,
  existingComposition,
  isIteration,
  onComplete,
  onError,
}: StreamingPreviewProps) {
  const [phase, setPhase] = useState<GenerationPhase>('connecting');
  const [statusMessage, setStatusMessage] = useState('Connecting...');
  const [elements, setElements] = useState<ToolElement[]>(
    existingComposition?.elements || []
  );
  const [toolName, setToolName] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const hasStarted = useRef(false);

  const startGeneration = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setPhase('connecting');
      setStatusMessage('Connecting to AI...');

      const body: Record<string, unknown> = {
        prompt,
      };

      if (spaceContext) {
        body.spaceContext = spaceContext;
      }

      if (isIteration && existingComposition) {
        body.existingComposition = {
          elements: existingComposition.elements.map(el => ({
            elementId: el.elementId,
            instanceId: el.instanceId,
            config: el.config,
            position: el.position,
            size: el.size,
          })),
          name: existingComposition.name,
        };
        body.isIteration = true;
      }

      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Generation failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      setPhase('thinking');
      setStatusMessage('AI is thinking...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const collectedElements: ToolElement[] = isIteration
        ? [...(existingComposition?.elements || [])]
        : [];
      let completeName = '';
      let completeDescription = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const chunk: StreamingChunk = JSON.parse(trimmed);

            switch (chunk.type) {
              case 'thinking':
                setPhase('thinking');
                setStatusMessage((chunk.data.message as string) || 'Thinking...');
                break;

              case 'element': {
                setPhase('building');
                const elData = chunk.data;

                // Skip refinement action elements (they modify existing, not add new)
                if (elData.refinementAction) {
                  setStatusMessage(
                    `${elData.refinementAction === 'delete' ? 'Removing' : 'Modifying'} ${elData.targetKeyword || 'element'}...`
                  );
                  break;
                }

                const newElement: ToolElement = {
                  elementId: (elData.type as string) || (elData.elementId as string),
                  instanceId: (elData.id as string) || (elData.instanceId as string) || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  config: (elData.config as Record<string, unknown>) || {},
                  position: elData.position as { x: number; y: number } | undefined,
                  size: elData.size as { width: number; height: number } | undefined,
                };

                collectedElements.push(newElement);
                setElements([...collectedElements]);

                const displayName = (elData.name as string) || newElement.elementId;
                setStatusMessage(`Adding ${displayName}...`);
                break;
              }

              case 'connection':
                setStatusMessage('Connecting elements...');
                break;

              case 'complete': {
                completeName = (chunk.data.name as string) || '';
                completeDescription = (chunk.data.description as string) || '';
                setToolName(completeName);
                setPhase('complete');
                setStatusMessage('Your tool is ready!');
                break;
              }

              case 'error':
                throw new Error((chunk.data.error as string) || 'Generation failed');
            }
          } catch (parseError) {
            // Skip unparseable lines (partial JSON)
            if (parseError instanceof SyntaxError) continue;
            throw parseError;
          }
        }
      }

      // Signal completion to parent
      onComplete({
        name: completeName,
        description: completeDescription,
        elements: collectedElements,
        isIteration,
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      const message = error instanceof Error ? error.message : 'Generation failed';
      setPhase('error');
      setStatusMessage(message);
      onError(message);
    }
  }, [prompt, spaceContext, existingComposition, isIteration, onComplete, onError]);

  useEffect(() => {
    startGeneration();

    return () => {
      abortRef.current?.abort();
    };
  }, [startGeneration]);

  const phaseIcon = phase === 'complete' ? (
    <Check className="w-5 h-5 text-green-400" />
  ) : (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      <Sparkles className="w-5 h-5 text-[var(--life-gold)]" />
    </motion.div>
  );

  return (
    <div className="min-h-[70vh] flex flex-col px-6 py-8 max-w-2xl mx-auto">
      {/* User prompt */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.standard, ease: EASE }}
        className="mb-6"
      >
        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your prompt</p>
        <p className="text-white text-base">
          &ldquo;{prompt}&rdquo;
        </p>
      </motion.div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durationSeconds.quick, delay: 0.1 }}
        className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.06]"
      >
        {phaseIcon}
        <AnimatePresence mode="wait">
          <motion.span
            key={statusMessage}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className={`text-sm ${phase === 'complete' ? 'text-green-400' : phase === 'error' ? 'text-red-400' : 'text-white/50'}`}
          >
            {statusMessage}
          </motion.span>
        </AnimatePresence>

        {toolName && phase === 'complete' && (
          <span className="ml-auto text-xs text-white/50">{toolName}</span>
        )}
      </motion.div>

      {/* Live preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.smooth, delay: 0.2, ease: EASE }}
        className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.06] p-4 sm:p-6 overflow-y-auto"
      >
        {elements.length === 0 && phase !== 'error' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-8 h-8 text-white/50 mb-4" />
            </motion.div>
            <p className="text-white/50 text-sm">Building your tool...</p>
          </div>
        )}

        {elements.length > 0 && (
          <ToolCanvas
            elements={elements}
            state={{}}
            layout="flow"
          />
        )}
      </motion.div>
    </div>
  );
}
