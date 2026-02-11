/**
 * Goose Client
 *
 * Client-side library for calling the Goose tool generation API.
 * Handles streaming NDJSON responses and provides typed interfaces.
 *
 * Usage:
 *   const client = new GooseClient();
 *   for await (const message of client.generate("create a poll")) {
 *   }
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface CanvasElement {
  type: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Connection {
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
}

export interface ToolComposition {
  elements: CanvasElement[];
  connections: Connection[];
  name: string;
  description: string;
  layout: "grid" | "flow" | "tabs" | "sidebar";
}

export type StreamMessage =
  | { type: "thinking"; data: { message: string } }
  | { type: "element"; data: CanvasElement }
  | { type: "connection"; data: Connection }
  | { type: "complete"; data: { name: string; description: string; elementCount: number } }
  | { type: "error"; data: { message: string; code?: string } };

export interface GenerateOptions {
  existingComposition?: ToolComposition;
  isIteration?: boolean;
  backend?: "ollama" | "groq" | "mock";
  signal?: AbortSignal;
}

// ═══════════════════════════════════════════════════════════════════
// GOOSE CLIENT
// ═══════════════════════════════════════════════════════════════════

export class GooseClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/tools/generate") {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a tool composition from a prompt (streaming)
   */
  async *generate(prompt: string, options: GenerateOptions = {}): AsyncGenerator<StreamMessage> {
    const { existingComposition, isIteration, backend, signal } = options;

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        existingComposition,
        isIteration,
        backend,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      yield {
        type: "error",
        data: { message: error.error || "Request failed", code: error.code },
      };
      return;
    }

    if (!response.body) {
      yield {
        type: "error",
        data: { message: "No response body", code: "NO_BODY" },
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line) as StreamMessage;
              yield message;

              // Exit early on complete or error
              if (message.type === "complete" || message.type === "error") {
                return;
              }
            } catch {
              // Skip malformed message lines
            }
          }
        }
      }

      // Parse any remaining buffer
      if (buffer.trim()) {
        try {
          const message = JSON.parse(buffer) as StreamMessage;
          yield message;
        } catch {
          // Ignore incomplete final message
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate a tool composition (non-streaming, waits for complete result)
   */
  async generateSync(prompt: string, options: GenerateOptions = {}): Promise<ToolComposition | null> {
    const elements: CanvasElement[] = [];
    const connections: Connection[] = [];
    let name = "Untitled Tool";
    let description = "";

    for await (const message of this.generate(prompt, options)) {
      switch (message.type) {
        case "element":
          elements.push(message.data);
          break;
        case "connection":
          connections.push(message.data);
          break;
        case "complete":
          name = message.data.name;
          description = message.data.description;
          break;
        case "error":
          return null;
      }
    }

    if (elements.length === 0) {
      return null;
    }

    return {
      elements,
      connections,
      name,
      description,
      layout: "grid",
    };
  }

  /**
   * Test endpoint availability
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";

export interface UseGooseResult {
  generate: (prompt: string) => Promise<ToolComposition | null>;
  isGenerating: boolean;
  progress: StreamMessage[];
  currentElement: CanvasElement | null;
  error: string | null;
  cancel: () => void;
}

export function useGoose(options: {
  onElement?: (element: CanvasElement) => void;
  onConnection?: (connection: Connection) => void;
  onComplete?: (composition: ToolComposition) => void;
  onError?: (error: string) => void;
} = {}): UseGooseResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<StreamMessage[]>([]);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const clientRef = useRef(new GooseClient());

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generate = useCallback(
    async (prompt: string): Promise<ToolComposition | null> => {
      // Cancel any existing generation
      cancel();

      // Reset state
      setIsGenerating(true);
      setProgress([]);
      setCurrentElement(null);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const elements: CanvasElement[] = [];
      const connections: Connection[] = [];
      let name = "Untitled Tool";
      let description = "";

      try {
        for await (const message of clientRef.current.generate(prompt, {
          signal: abortController.signal,
        })) {
          // Check if cancelled
          if (abortController.signal.aborted) {
            return null;
          }

          setProgress((prev) => [...prev, message]);

          switch (message.type) {
            case "element":
              elements.push(message.data);
              setCurrentElement(message.data);
              options.onElement?.(message.data);
              break;

            case "connection":
              connections.push(message.data);
              options.onConnection?.(message.data);
              break;

            case "complete":
              name = message.data.name;
              description = message.data.description;
              break;

            case "error":
              setError(message.data.message);
              options.onError?.(message.data.message);
              setIsGenerating(false);
              return null;
          }
        }

        if (elements.length === 0) {
          setError("No elements generated");
          setIsGenerating(false);
          return null;
        }

        const composition: ToolComposition = {
          elements,
          connections,
          name,
          description,
          layout: "grid",
        };

        options.onComplete?.(composition);
        setIsGenerating(false);
        return composition;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Cancelled by user
          setIsGenerating(false);
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : "Generation failed";
        setError(errorMessage);
        options.onError?.(errorMessage);
        setIsGenerating(false);
        return null;
      }
    },
    [options, cancel]
  );

  return {
    generate,
    isGenerating,
    progress,
    currentElement,
    error,
    cancel,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════

export const gooseClient = new GooseClient();

export default GooseClient;
