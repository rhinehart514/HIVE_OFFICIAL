'use client';

/**
 * useLabChat — Orchestration hook for HiveLab conversational creation.
 *
 * Extracts streaming logic from InlineGenerationPreview and StreamingPreview
 * into a single reusable hook that manages the chat thread + tool generation.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type { ToolElement, QuickTemplate } from '@hive/ui';

import {
  type ChatThread,
  type ChatMessage,
  createThread,
  createMessage,
} from '@/lib/hivelab/chat-types';
import {
  createBlankTool,
  createToolFromTemplateApi,
  generateToolName,
} from '@/lib/hivelab/create-tool';
import { matchTemplate } from '@/components/hivelab/conversational/template-matcher';
import { useAnalytics } from '@/hooks/use-analytics';
import type { StreamingChunk } from '@/lib/ai-generator';

/** Code output from code generation mode */
export interface CodeOutput {
  html: string;
  css: string;
  js: string;
}

interface UseLabChatOptions {
  originSpaceId?: string | null;
  spaceContext?: { spaceId: string; spaceName: string; spaceType?: string };
  onToolCreated?: (toolId: string) => void;
}

interface UseLabChatReturn {
  thread: ChatThread;
  isGenerating: boolean;
  isCreatingTool: boolean;
  sendMessage: (text: string) => Promise<void>;
  useTemplate: (template: QuickTemplate, overrides?: Record<string, string>) => Promise<void>;
  dismissTemplateSuggestion: () => void;
  reset: () => void;
  publishAndCopyLink: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undoLastMessage: () => void;
  redoMessage: () => void;
}

export function useLabChat({ originSpaceId, spaceContext, onToolCreated }: UseLabChatOptions = {}): UseLabChatReturn {
  const [thread, setThread] = useState<ChatThread>(createThread);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTool, setIsCreatingTool] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Undo/redo stacks (capped at 20 entries)
  const undoStackRef = useRef<ChatThread[]>([]);
  const redoStackRef = useRef<ChatThread[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const pushUndo = useCallback((snapshot: ChatThread) => {
    undoStackRef.current = [...undoStackRef.current.slice(-19), snapshot];
    redoStackRef.current = [];
    setUndoCount(undoStackRef.current.length);
    setRedoCount(0);
  }, []);
  const { track, startTimer, elapsed } = useAnalytics();

  // Helper: append message to thread
  const appendMessage = useCallback((msg: ChatMessage) => {
    setThread(prev => ({
      ...prev,
      messages: [...prev.messages, msg],
    }));
  }, []);

  // Helper: update the last assistant message (for streaming updates)
  const updateLastAssistantMessage = useCallback(
    (updater: (msg: ChatMessage) => ChatMessage) => {
      setThread(prev => {
        const msgs = [...prev.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = updater(msgs[i]);
            break;
          }
        }
        return { ...prev, messages: msgs };
      });
    },
    []
  );

  // Core: stream generation from /api/tools/generate
  const streamGeneration = useCallback(
    async (
      prompt: string,
      toolId: string,
      existingElements?: ToolElement[],
      existingName?: string,
      existingCode?: CodeOutput
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);

      const isIteration = !!(existingElements?.length || existingCode);

      // Add streaming assistant message
      const streamMsg = createMessage('assistant', 'tool-preview', 'Building...', {
        toolPreview: {
          toolId,
          toolName: existingName || '',
          elements: existingElements || [],
          phase: 'streaming',
        },
      });
      appendMessage(streamMsg);

      try {
        const body: Record<string, unknown> = {
          prompt,
          mode: 'code',
        };

        if (spaceContext) {
          body.spaceContext = spaceContext;
        }

        // Code mode iteration: pass existing code
        if (isIteration && existingCode) {
          body.existingCode = existingCode;
          body.existingName = existingName;
          body.isIteration = true;
        } else if (isIteration && existingElements) {
          // Legacy composition mode fallback
          body.mode = 'composition';
          body.existingComposition = {
            elements: existingElements.map(el => ({
              type: el.elementId,
              instanceId: el.instanceId,
              config: el.config,
              position: el.position,
              size: el.size,
            })),
            name: existingName,
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
        if (!response.body) throw new Error('No response stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const collected: ToolElement[] = isIteration && existingElements ? [...existingElements] : [];
        let completeName = '';
        let generatedCode: CodeOutput | undefined;

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
                  updateLastAssistantMessage(msg => ({
                    ...msg,
                    content: (chunk.data.message as string) || 'Thinking...',
                  }));
                  break;

                // Code generation mode: receive full code output
                case 'code': {
                  const codeData = chunk.data as { name?: string; description?: string; code?: CodeOutput };
                  generatedCode = codeData.code;
                  completeName = (codeData.name as string) || '';

                  // Wrap code as a single custom-block element for the preview
                  const codeElement: ToolElement = {
                    elementId: 'custom-block',
                    instanceId: 'code_app_1',
                    config: {
                      code: generatedCode,
                      metadata: {
                        name: completeName,
                        description: codeData.description || '',
                        createdBy: 'ai',
                      },
                    },
                  };
                  collected.length = 0;
                  collected.push(codeElement);

                  updateLastAssistantMessage(msg => ({
                    ...msg,
                    content: `Building ${completeName || 'your app'}...`,
                    toolPreview: {
                      ...msg.toolPreview!,
                      elements: [...collected],
                    },
                  }));
                  break;
                }

                // Legacy composition mode: receive elements one by one
                case 'element': {
                  const elData = chunk.data;
                  if (elData.refinementAction) {
                    updateLastAssistantMessage(msg => ({
                      ...msg,
                      content: `${elData.refinementAction === 'delete' ? 'Removing' : 'Modifying'} ${elData.targetKeyword || 'element'}...`,
                    }));
                    break;
                  }

                  const newEl: ToolElement = {
                    elementId: (elData.type as string) || (elData.elementId as string),
                    instanceId:
                      (elData.id as string) ||
                      (elData.instanceId as string) ||
                      `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    config: (elData.config as Record<string, unknown>) || {},
                    position: elData.position as { x: number; y: number } | undefined,
                    size: elData.size as { width: number; height: number } | undefined,
                  };
                  collected.push(newEl);

                  const displayName = (elData.name as string) || newEl.elementId;
                  updateLastAssistantMessage(msg => ({
                    ...msg,
                    content: `Adding ${displayName}...`,
                    toolPreview: {
                      ...msg.toolPreview!,
                      elements: [...collected],
                    },
                  }));
                  break;
                }

                case 'connection':
                  updateLastAssistantMessage(msg => ({
                    ...msg,
                    content: 'Connecting elements...',
                  }));
                  break;

                case 'complete':
                  completeName = (chunk.data.name as string) || completeName;
                  updateLastAssistantMessage(msg => ({
                    ...msg,
                    content: completeName ? `Here's your ${completeName}` : 'Your app is ready',
                    toolPreview: {
                      ...msg.toolPreview!,
                      toolName: completeName,
                      elements: [...collected],
                      phase: 'complete',
                    },
                  }));
                  // Persist generation outcome ID for downstream tracking
                  if (chunk.data.generationOutcomeId) {
                    const patchOutcome = (retries = 1) => {
                      fetch(`/api/tools/${toolId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ generationOutcomeId: chunk.data.generationOutcomeId }),
                      }).catch((err) => {
                        if (retries > 0) {
                          setTimeout(() => patchOutcome(retries - 1), 2000);
                        } else {
                          console.warn('[useLabChat] Failed to persist generationOutcomeId:', err);
                        }
                      });
                    };
                    patchOutcome();
                  }
                  break;

                case 'error':
                  throw new Error((chunk.data.error as string) || 'Generation failed');
              }
            } catch (parseError) {
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }

        // Update thread state
        setThread(prev => ({
          ...prev,
          toolName: completeName || prev.toolName,
          currentElements: [...collected],
          currentCode: generatedCode || prev.currentCode,
        }));

        // Auto-save generated elements to the tool doc so deploy/share/discover work
        if (collected.length > 0) {
          fetch(`/api/tools/${toolId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: completeName || undefined,
              elements: collected.map(el => ({
                elementId: el.elementId,
                instanceId: el.instanceId,
                config: el.config,
                position: el.position,
                size: el.size,
              })),
              type: generatedCode ? 'code' : 'visual',
            }),
          }).catch(err => {
            console.warn('[useLabChat] Failed to auto-save generated elements:', err);
          });
        }

        track('creation_completed', {
          toolId,
          source: 'ai',
          mode: generatedCode ? 'code' : 'composition',
          durationMs: elapsed(),
          isIteration,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        const message = error instanceof Error ? error.message : 'Generation failed';
        updateLastAssistantMessage(msg => ({
          ...msg,
          content: message,
          toolPreview: msg.toolPreview
            ? { ...msg.toolPreview, phase: 'error' }
            : undefined,
        }));
        toast.error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [appendMessage, updateLastAssistantMessage, track, elapsed, spaceContext]
  );

  // Send a message (prompt or refinement)
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating || isCreatingTool) return;

      const userPrompt = text.trim();
      // Snapshot for undo before mutation
      pushUndo(thread);

      appendMessage(createMessage('user', 'text', userPrompt));
      startTimer();

      // First message: check for template match
      if (!thread.toolId) {
        const match = matchTemplate(userPrompt);
        if (match) {
          appendMessage(
            createMessage('assistant', 'template-suggestion', `I found a template that matches: ${match.template.name}`, {
              templateSuggestion: {
                templateId: match.template.id,
                templateName: match.template.name,
                matchScore: match.score,
              },
            })
          );
          return;
        }

        // No template — create tool and generate
        setIsCreatingTool(true);
        track('creation_started', { source: 'ai' });

        try {
          const name = generateToolName(userPrompt);
          const id = await createBlankTool(name, userPrompt);
          setThread(prev => ({ ...prev, toolId: id, toolName: name }));
          setIsCreatingTool(false);
          onToolCreated?.(id);
          await streamGeneration(userPrompt, id);
        } catch {
          toast.error('Failed to create. Please try again.');
          setIsCreatingTool(false);
        }
        return;
      }

      // Refinement: tool already exists
      track('refinement_started', { toolId: thread.toolId });
      await streamGeneration(
        userPrompt,
        thread.toolId,
        thread.currentElements,
        thread.toolName,
        thread.currentCode
      );
    },
    [
      isGenerating,
      isCreatingTool,
      thread,
      appendMessage,
      startTimer,
      track,
      streamGeneration,
      onToolCreated,
      pushUndo,
    ]
  );

  // Use a matched template
  const useTemplate = useCallback(
    async (template: QuickTemplate, overrides?: Record<string, string>) => {
      setIsCreatingTool(true);
      appendMessage(
        createMessage('system', 'status', `Creating ${template.name}...`)
      );

      try {
        const toolId = await createToolFromTemplateApi(template, overrides);
        setThread(prev => ({
          ...prev,
          toolId,
          toolName: template.name,
        }));
        onToolCreated?.(toolId);
      } catch {
        toast.error('Failed to create from template');
      } finally {
        setIsCreatingTool(false);
      }
    },
    [appendMessage, onToolCreated]
  );

  // Dismiss template suggestion and generate with AI instead
  const dismissTemplateSuggestion = useCallback(() => {
    // Find the original user prompt (message before the template suggestion)
    const msgs = thread.messages;
    let userPrompt = '';
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && msgs[i].type === 'text') {
        userPrompt = msgs[i].content;
        break;
      }
    }

    if (!userPrompt) return;

    appendMessage(createMessage('system', 'status', 'Building with AI instead...'));

    (async () => {
      setIsCreatingTool(true);
      track('creation_started', { source: 'ai' });

      try {
        const name = generateToolName(userPrompt);
        const id = await createBlankTool(name, userPrompt);
        setThread(prev => ({ ...prev, toolId: id, toolName: name }));
        setIsCreatingTool(false);
        onToolCreated?.(id);
        await streamGeneration(userPrompt, id);
      } catch {
        toast.error('Failed to create. Please try again.');
        setIsCreatingTool(false);
      }
    })();
  }, [thread.messages, appendMessage, track, streamGeneration, onToolCreated]);

  // Undo last message(s)
  const undoLastMessage = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const snapshot = undoStackRef.current.pop()!;
    redoStackRef.current = [...redoStackRef.current.slice(-19), thread];
    setThread(snapshot);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [thread]);

  // Redo
  const redoMessage = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const snapshot = redoStackRef.current.pop()!;
    undoStackRef.current = [...undoStackRef.current.slice(-19), thread];
    setThread(snapshot);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [thread]);

  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;

  // Reset everything
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setThread(createThread());
    setIsGenerating(false);
    setIsCreatingTool(false);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoCount(0);
    setRedoCount(0);
  }, []);

  // Publish tool and copy share link
  const publishAndCopyLink = useCallback(async () => {
    if (!thread.toolId) return;
    const url = `${window.location.origin}/t/${thread.toolId}`;

    try {
      await fetch(`/api/tools/${thread.toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' }),
      });
      track('creation_published', { toolId: thread.toolId });
    } catch {
      /* non-critical */
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied! Share it anywhere.');
      track('creation_shared', { toolId: thread.toolId });
    } catch {
      toast.success(`Share link: ${url}`);
    }
  }, [thread.toolId, track]);

  return {
    thread,
    isGenerating,
    isCreatingTool,
    sendMessage,
    useTemplate,
    dismissTemplateSuggestion,
    reset,
    publishAndCopyLink,
    canUndo,
    canRedo,
    undoLastMessage,
    redoMessage,
  };
}
