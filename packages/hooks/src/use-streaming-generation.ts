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
 */
export interface StreamingChunk {
  type: 'element_added' | 'generation_complete' | 'error' | 'status';
  element?: CanvasElement;
  composition?: ToolComposition;
  status?: string;
  error?: string;
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
}

/**
 * Hook return type
 */
export interface UseStreamingGenerationReturn {
  state: GenerationState;
  generate: (options: GenerationOptions) => Promise<void>;
  cancel: () => void;
  reset: () => void;
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
    // Reset state
    setState({
      isGenerating: true,
      currentStatus: 'Starting generation...',
      elements: [],
      composition: null,
      error: null,
      progress: 0
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
      const addedElements: CanvasElement[] = [];
      let estimatedTotalElements = 4; // Default estimate

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

            // Handle different chunk types
            switch (chunk.type) {
              case 'element_added':
                if (chunk.element) {
                  addedElements.push(chunk.element);

                  const progress = Math.min(
                    95,
                    (addedElements.length / estimatedTotalElements) * 100
                  );

                  setState(prev => ({
                    ...prev,
                    elements: addedElements,
                    currentStatus: chunk.status || 'Adding element...',
                    progress
                  }));

                  callbacks?.onElementAdded?.(chunk.element, chunk.status || '');
                  callbacks?.onStatusUpdate?.(chunk.status || '');
                }
                break;

              case 'generation_complete':
                if (chunk.composition) {
                  setState(prev => ({
                    ...prev,
                    composition: chunk.composition || null,
                    currentStatus: 'Generation complete!',
                    progress: 100,
                    isGenerating: false
                  }));

                  callbacks?.onComplete?.(chunk.composition);
                }
                break;

              case 'error':
                throw new Error(chunk.error || 'Unknown error');

              case 'status':
                setState(prev => ({
                  ...prev,
                  currentStatus: chunk.status || ''
                }));
                callbacks?.onStatusUpdate?.(chunk.status || '');
                break;
            }
          } catch (parseError) {
            console.error('[useStreamingGeneration] Failed to parse chunk:', parseError);
            // Continue - might be partial chunk
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

  return {
    state,
    generate,
    cancel,
    reset
  };
}
