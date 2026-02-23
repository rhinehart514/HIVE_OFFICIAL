/**
 * useStreamingGeneration Hook
 *
 * Consumes the AI tool generation streaming API and provides real-time updates
 * for canvas element additions.
 */

import { useState, useCallback, useRef } from 'react';
import type { ToolComposition, CanvasElement } from '@hive/core';

/**
 * Streaming chunk from API
 * Types match the API response: thinking, element, connection, complete, error
 */
export interface StreamingChunk {
  type: 'thinking' | 'element' | 'connection' | 'complete' | 'error';
  data: {
    // For thinking
    message?: string;
    // For element
    id?: string;
    type?: string;
    name?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    onAction?: { type: 'navigate'; targetPageId: string };
    // For connection
    from?: string;
    to?: string;
    // For complete
    toolId?: string;
    elementCount?: number;
    connectionCount?: number;
    layout?: string;
    description?: string;
    pages?: Array<{
      id: string;
      name: string;
      elements: CanvasElement[];
      connections: Array<{ from: { instanceId: string; port: string }; to: { instanceId: string; port: string } }>;
      isStartPage?: boolean;
    }>;
    // For error
    error?: string;
  };
}

/**
 * Generation state
 */
export interface GenerationState {
  isGenerating: boolean;
  currentStatus: string;
  elements: CanvasElement[];
  composition: ToolComposition | null;
  error: string | null;
  progress: number; // 0-100
  /** Pages from multi-page generation (present when AI generates multi-page tools) */
  pages?: StreamingChunk['data']['pages'];
}

/**
 * Generation options
 */
export interface GenerationOptions {
  prompt: string;
  templateId?: string;
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };
  /** Existing composition for iteration mode */
  existingComposition?: ToolComposition;
  /** Whether this is an iteration on existing tool */
  isIteration?: boolean;
}

/**
 * Hook return type
 */
export interface UseStreamingGenerationReturn {
  state: GenerationState;
  generate: (options: GenerationOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  /** Hydrate state from external composition (e.g., WIP restore) */
  hydrate: (composition: ToolComposition) => void;
}

/**
 * Hook for streaming AI tool generation
 *
 * @example
 * ```tsx
 * const { state, generate, cancel, reset } = useStreamingGeneration({
 *   onElementAdded: (element) => {
 *     console.log('Element added:', element);
 *   },
 *   onComplete: (composition) => {
 *     console.log('Generation complete:', composition);
 *   }
 * });
 *
 * // Start generation
 * await generate({
 *   prompt: 'Create an event RSVP form'
 * });
 * ```
 */
export function useStreamingGeneration(callbacks?: {
  onElementAdded?: (element: CanvasElement, status: string) => void;
  onComplete?: (composition: ToolComposition) => void;
  onError?: (error: string) => void;
  onStatusUpdate?: (status: string) => void;
}): UseStreamingGenerationReturn {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    currentStatus: '',
    elements: [],
    composition: null,
    error: null,
    progress: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate tool from prompt
   */
  const generate = useCallback(async (options: GenerationOptions) => {
    // For iteration mode, preserve existing elements
    const existingElements = options.isIteration && options.existingComposition
      ? options.existingComposition.elements
      : [];

    // Reset state (preserving existing elements for iteration)
    setState({
      isGenerating: true,
      currentStatus: options.isIteration ? 'Updating your tool...' : 'Starting generation...',
      elements: existingElements,
      composition: options.isIteration ? options.existingComposition || null : null,
      error: null,
      progress: options.isIteration ? 50 : 0 // Start at 50% for iterations
    });

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Call streaming API
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate tool');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      // Start with existing elements for iteration mode
      const addedElements: CanvasElement[] = [...existingElements];
      let estimatedTotalElements = options.isIteration ? 2 : 4; // Fewer new elements for iterations

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk
        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk: StreamingChunk = JSON.parse(line);

            // Handle different chunk types (matching API response format)
            switch (chunk.type) {
              case 'thinking':
                setState(prev => ({
                  ...prev,
                  currentStatus: chunk.data.message || 'Thinking...'
                }));
                callbacks?.onStatusUpdate?.(chunk.data.message || '');
                break;

              case 'element':
                if (chunk.data.id && chunk.data.type) {
                  const elementName = chunk.data.name || chunk.data.type;
                  // Use size from stream if provided, otherwise sensible defaults
                  const defaultSize = { width: 280, height: 120 };
                  const streamedSize = chunk.data.size as { width: number; height: number } | undefined;
                  const element: CanvasElement = {
                    elementId: chunk.data.type as string,
                    instanceId: chunk.data.id as string,
                    config: { ...chunk.data.config as Record<string, unknown>, _name: elementName },
                    position: (chunk.data.position as { x: number; y: number }) || { x: 100, y: 100 },
                    size: streamedSize || defaultSize,
                  };

                  addedElements.push(element);

                  const progress = Math.min(
                    95,
                    (addedElements.length / estimatedTotalElements) * 100
                  );

                  setState(prev => ({
                    ...prev,
                    elements: [...addedElements],
                    currentStatus: `Adding ${elementName}...`,
                    progress
                  }));

                  callbacks?.onElementAdded?.(element, `Adding ${elementName}`);
                  callbacks?.onStatusUpdate?.(`Adding ${elementName}`);
                }
                break;

              case 'connection':
                // Handle connections (update composition connections)
                setState(prev => ({
                  ...prev,
                  currentStatus: 'Connecting elements...'
                }));
                break;

              case 'complete':
                // Build composition from collected elements
                const validLayouts = ['grid', 'flow', 'tabs', 'sidebar'] as const;
                const layout = validLayouts.includes(chunk.data.layout as typeof validLayouts[number])
                  ? (chunk.data.layout as 'grid' | 'flow' | 'tabs' | 'sidebar')
                  : 'flow';
                const composition: ToolComposition = {
                  id: chunk.data.toolId || `tool-${Date.now()}`,
                  name: chunk.data.name || 'Generated Tool',
                  description: chunk.data.description || '',
                  elements: addedElements,
                  connections: [],
                  layout,
                };

                setState(prev => ({
                  ...prev,
                  composition,
                  pages: chunk.data.pages,
                  currentStatus: 'Generation complete!',
                  progress: 100,
                  isGenerating: false
                }));

                callbacks?.onComplete?.(composition);
                break;

              case 'error':
                throw new Error(chunk.data.error || 'Unknown error');
            }
          } catch (_parseError) {
            // Continue - might be partial chunk, this is expected during streaming
          }
        }
      }

      // Final state update
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled
        setState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: 'Generation cancelled',
          error: null
        }));
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: '',
          error: errorMessage,
          progress: 0
        }));

        callbacks?.onError?.(errorMessage);
      }
    }
  }, [callbacks]);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      currentStatus: '',
      elements: [],
      composition: null,
      error: null,
      progress: 0
    });
  }, []);

  /**
   * Hydrate state from external composition (WIP restore)
   */
  const hydrate = useCallback((composition: ToolComposition) => {
    setState({
      isGenerating: false,
      currentStatus: 'Restored from previous session',
      elements: composition.elements || [],
      composition,
      error: null,
      progress: 100
    });
  }, []);

  return {
    state,
    generate,
    cancel,
    reset,
    hydrate
  };
}
