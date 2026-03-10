'use client';

/**
 * useBuildMachine — 3-tier escalation state machine for Build Entry.
 *
 * States: idle → classifying → shell-matched | generating → complete
 *
 * Classification-first: every prompt hits /api/tools/classify (~500ms).
 * If a native format (poll/bracket/rsvp) matches with confidence > 0.5,
 * we show the shell preview immediately. Otherwise we fall through to
 * full code generation via /api/tools/generate.
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { ShellFormat, ShellConfig, ClassificationResult, PollConfig, BracketConfig, RSVPConfig, PollState, BracketState, RSVPState } from '@/lib/shells/types';
import type { CodeOutput } from '@/hooks/use-lab-chat';
import type { StreamingChunk } from '@/lib/ai-generator';
import { isNativeFormat } from '@/lib/shells';
import { createBlankTool, generateToolName } from '@/lib/hivelab/create-tool';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '@hive/core';

// ============================================================================
// RTDB INITIAL STATE BUILDERS
// ============================================================================

function buildInitialPollState(config: PollConfig): PollState {
  return {
    votes: {},
    voteCounts: config.options.map(() => 0),
    closed: false,
  };
}

function buildInitialBracketState(config: BracketConfig): BracketState {
  // Pad to even count — odd entries would silently drop the last one
  const entries = [...config.entries];
  if (entries.length % 2 !== 0) {
    entries.push('Bye');
  }
  const matchups = [];
  for (let i = 0; i < entries.length; i += 2) {
    matchups.push({
      id: `r1-m${Math.floor(i / 2)}`,
      round: 1,
      entryA: entries[i],
      entryB: entries[i + 1],
      votes: {},
    });
  }
  const totalRounds = Math.ceil(Math.log2(entries.length));
  return {
    matchups,
    currentRound: 1,
    totalRounds,
    completed: false,
  };
}

function buildInitialRSVPState(): RSVPState {
  return {
    attendees: {},
    count: 0,
  };
}

function buildInitialShellState(format: ShellFormat, config: PollConfig | BracketConfig | RSVPConfig): PollState | BracketState | RSVPState {
  switch (format) {
    case 'poll':
      return buildInitialPollState(config as PollConfig);
    case 'bracket':
      return buildInitialBracketState(config as BracketConfig);
    case 'rsvp':
      return buildInitialRSVPState();
    default:
      throw new Error(`Unknown shell format: ${format}`);
  }
}

// ============================================================================
// STATE
// ============================================================================

export type BuildPhase =
  | 'idle'
  | 'classifying'
  | 'shell-matched'
  | 'generating'
  | 'complete'
  | 'error';

export interface BuildState {
  phase: BuildPhase;
  prompt: string;
  classification: ClassificationResult | null;
  /** Editable config for shell-matched phase */
  shellConfig: ShellConfig;
  /** Streaming code output for custom generation */
  codeOutput: CodeOutput | null;
  /** Streaming status text */
  streamingStatus: string;
  /** Created tool ID (from /api/tools POST) */
  toolId: string | null;
  toolName: string;
  error: string | null;
}

const initialState: BuildState = {
  phase: 'idle',
  prompt: '',
  classification: null,
  shellConfig: null,
  codeOutput: null,
  streamingStatus: '',
  toolId: null,
  toolName: '',
  error: null,
};

// ============================================================================
// ACTIONS
// ============================================================================

type BuildAction =
  | { type: 'SUBMIT_PROMPT'; prompt: string }
  | { type: 'CLASSIFICATION_SUCCESS'; result: ClassificationResult }
  | { type: 'CLASSIFICATION_FAIL'; error: string }
  | { type: 'UPDATE_SHELL_CONFIG'; config: ShellConfig }
  | { type: 'ACCEPT_SHELL' }
  | { type: 'ESCALATE_TO_CUSTOM' }
  | { type: 'GENERATION_STARTED'; toolId: string; toolName: string }
  | { type: 'GENERATION_STREAMING'; status: string; code?: CodeOutput }
  | { type: 'GENERATION_COMPLETE'; toolId: string; toolName: string; code?: CodeOutput }
  | { type: 'DEPLOY_COMPLETE'; toolId: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

function buildReducer(state: BuildState, action: BuildAction): BuildState {
  switch (action.type) {
    case 'SUBMIT_PROMPT':
      return {
        ...initialState,
        phase: 'classifying',
        prompt: action.prompt,
      };

    case 'CLASSIFICATION_SUCCESS': {
      const { result } = action;
      const isNative = isNativeFormat(result.format) && result.confidence > 0.5;
      return {
        ...state,
        classification: result,
        phase: isNative ? 'shell-matched' : 'generating',
        shellConfig: isNative ? result.config : null,
      };
    }

    case 'CLASSIFICATION_FAIL':
      // Fall through to generation on classification error
      return {
        ...state,
        phase: 'generating',
        error: null,
      };

    case 'UPDATE_SHELL_CONFIG':
      return {
        ...state,
        shellConfig: action.config,
      };

    case 'ACCEPT_SHELL':
      return {
        ...state,
        phase: 'complete',
      };

    case 'ESCALATE_TO_CUSTOM':
      return {
        ...state,
        phase: 'generating',
        classification: null,
        shellConfig: null,
      };

    case 'GENERATION_STARTED':
      return {
        ...state,
        toolId: action.toolId,
        toolName: action.toolName,
        streamingStatus: 'Starting...',
      };

    case 'GENERATION_STREAMING':
      return {
        ...state,
        streamingStatus: action.status,
        codeOutput: action.code ?? state.codeOutput,
      };

    case 'GENERATION_COMPLETE':
      return {
        ...state,
        phase: 'complete',
        toolId: action.toolId,
        toolName: action.toolName,
        codeOutput: action.code ?? state.codeOutput,
        streamingStatus: '',
      };

    case 'DEPLOY_COMPLETE':
      return {
        ...state,
        toolId: action.toolId,
      };

    case 'ERROR':
      return {
        ...state,
        phase: 'error',
        error: action.error,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// CLIENT-SIDE FALLBACK CLASSIFIER (when API is down)
// ============================================================================

const POLL_PATTERNS = /\b(best|favorite|worst|which|rank|vote|prefer|rate|top|pick)\b/i;
const BRACKET_PATTERNS = /\b(bracket|tournament|march madness|head.to.head|versus|vs|showdown)\b/i;
const RSVP_PATTERNS = /\b(coming|attend|rsvp|who.?s in|party|meeting|signup|sign.?up|gathering|event|pregame|session)\b/i;

function clientSideClassify(prompt: string): ClassificationResult | null {
  const lower = prompt.toLowerCase();

  if (BRACKET_PATTERNS.test(lower)) {
    const words = prompt.split(/\s+/).filter(w => w.length > 2);
    const topic = prompt.slice(0, 60);
    return {
      format: 'bracket',
      confidence: 0.7,
      config: {
        topic,
        entries: words.length >= 4 ? words.slice(0, 8) : ['Entry 1', 'Entry 2', 'Entry 3', 'Entry 4'],
      },
    };
  }

  if (RSVP_PATTERNS.test(lower)) {
    return {
      format: 'rsvp',
      confidence: 0.7,
      config: {
        title: prompt.slice(0, 80),
      },
    };
  }

  if (POLL_PATTERNS.test(lower)) {
    return {
      format: 'poll',
      confidence: 0.7,
      config: {
        question: prompt.endsWith('?') ? prompt : `${prompt}?`,
        options: ['Option 1', 'Option 2', 'Option 3'],
      },
    };
  }

  return null;
}

// ============================================================================
// HOOK
// ============================================================================

interface SpaceContextForGenerate {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
  category?: string;
  memberCount?: number;
  description?: string;
}

interface UseBuildMachineOptions {
  spaceId?: string | null;
  spaceContext?: SpaceContextForGenerate | null;
  onToolCreated?: (toolId: string) => void;
}

export function useBuildMachine({ spaceId, spaceContext, onToolCreated }: UseBuildMachineOptions = {}) {
  const [state, dispatch] = useReducer(buildReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ---- Classify prompt ----
  const classify = useCallback(
    async (prompt: string) => {
      try {
        const res = await fetch('/api/tools/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt, spaceId: spaceId ?? undefined }),
        });

        if (!res.ok) {
          // API failed — try client-side fallback
          const fallback = clientSideClassify(prompt);
          if (fallback) {
            dispatch({ type: 'CLASSIFICATION_SUCCESS', result: fallback });
            return fallback;
          }
          dispatch({ type: 'CLASSIFICATION_FAIL', error: 'Classification failed' });
          return;
        }

        const json = await res.json();
        const result = (json.data ?? json) as ClassificationResult;
        dispatch({ type: 'CLASSIFICATION_SUCCESS', result });
        return result;
      } catch {
        // Network error — try client-side fallback
        const fallback = clientSideClassify(prompt);
        if (fallback) {
          dispatch({ type: 'CLASSIFICATION_SUCCESS', result: fallback });
          return fallback;
        }
        dispatch({ type: 'CLASSIFICATION_FAIL', error: 'Classification failed' });
        return null;
      }
    },
    [spaceId]
  );

  // ---- Stream code generation ----
  const streamGeneration = useCallback(
    async (prompt: string) => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const name = generateToolName(prompt);
        const toolId = await createBlankTool(name, prompt);
        dispatch({ type: 'GENERATION_STARTED', toolId, toolName: name });
        onToolCreated?.(toolId);

        const res = await fetch('/api/tools/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt,
            mode: 'code',
            ...(spaceContext ? { spaceContext } : {}),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Generation failed (${res.status})`);
        }
        if (!res.body) throw new Error('No response stream');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalCode: CodeOutput | undefined;
        let finalName = name;

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
                  dispatch({
                    type: 'GENERATION_STREAMING',
                    status: (chunk.data.message as string) || 'Thinking...',
                  });
                  break;

                case 'code': {
                  const codeData = chunk.data as { name?: string; code?: CodeOutput };
                  finalCode = codeData.code;
                  finalName = codeData.name || finalName;
                  dispatch({
                    type: 'GENERATION_STREAMING',
                    status: `Making ${finalName}...`,
                    code: finalCode,
                  });
                  break;
                }

                case 'complete':
                  finalName = (chunk.data.name as string) || finalName;
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

        dispatch({
          type: 'GENERATION_COMPLETE',
          toolId,
          toolName: finalName,
          code: finalCode,
        });

        // Auto-save + publish (include generated code as elements)
        const saveBody: Record<string, unknown> = {
          name: finalName,
          type: 'code',
          status: 'published',
          visibility: 'public',
        };
        if (finalCode) {
          saveBody.elements = [{
            elementId: 'custom-block',
            instanceId: 'code_app_1',
            config: {
              code: finalCode,
              metadata: { name: finalName, description: '' },
            },
          }];
        }
        await fetch(`/api/tools/${toolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(saveBody),
        }).catch(() => {});
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Generation failed';
        dispatch({ type: 'ERROR', error: message });
        toast.error(message);
      }
    },
    [onToolCreated, spaceContext]
  );

  // ---- Public API ----

  const submitPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;
      dispatch({ type: 'SUBMIT_PROMPT', prompt: prompt.trim() });

      const result = await classify(prompt.trim());

      // If classification returned a native format, we stop here — user sees shell preview.
      // If it fell through to 'generating' phase, kick off code gen.
      if (!result || !isNativeFormat(result.format) || result.confidence <= 0.5) {
        await streamGeneration(prompt.trim());
      }
    },
    [classify, streamGeneration]
  );

  const updateShellConfig = useCallback((config: ShellConfig) => {
    dispatch({ type: 'UPDATE_SHELL_CONFIG', config });
  }, []);

  const acceptShell = useCallback(async () => {
    if (!state.shellConfig || !state.classification) return;

    // Validate shell config before proceeding with deploy
    const format = state.classification.format as ShellFormat;
    const config = state.shellConfig;

    // Validate and clean config — strip empty options/entries before saving
    let cleanedConfig = config;

    if (format === 'poll') {
      const pollConfig = config as PollConfig;
      if (!pollConfig.question?.trim()) {
        toast.error('Your poll needs a question');
        return;
      }
      const validOptions = pollConfig.options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast.error('Add at least 2 options to your poll');
        return;
      }
      cleanedConfig = { ...pollConfig, question: pollConfig.question.trim(), options: validOptions };
    } else if (format === 'bracket') {
      const bracketConfig = config as BracketConfig;
      if (!bracketConfig.topic?.trim()) {
        toast.error('Your bracket needs a topic');
        return;
      }
      const validEntries = bracketConfig.entries.filter((e) => e.trim());
      if (validEntries.length < 4) {
        toast.error('Add at least 4 entries to your bracket');
        return;
      }
      cleanedConfig = { ...bracketConfig, topic: bracketConfig.topic.trim(), entries: validEntries };
    } else if (format === 'rsvp') {
      const rsvpConfig = config as RSVPConfig;
      if (!rsvpConfig.title?.trim()) {
        toast.error('Your RSVP needs a title');
        return;
      }
      cleanedConfig = { ...rsvpConfig, title: rsvpConfig.title.trim() };
    }

    try {
      const name = generateToolName(state.prompt);
      const toolId = await createBlankTool(name, state.prompt);

      // Save as a shell-format tool (use cleaned config)
      const putRes = await fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          type: 'shell',
          shellFormat: state.classification.format,
          shellConfig: cleanedConfig,
          status: 'published',
          visibility: 'public',
        }),
      });
      if (!putRes.ok) {
        throw new Error('Failed to save app configuration');
      }

      // Write initial state to RTDB so shell components can render
      // Non-blocking: don't await — Firebase client auth may not be initialized
      // (user authenticates via session cookies, not Firebase client SDK)
      const shellFormat = state.classification.format as ShellFormat;
      if (shellFormat !== 'custom' && cleanedConfig) {
        try {
          const database = getDatabase(app);
          const stateRef = ref(database, `shell_states/${toolId}`);
          const shellInitialState = buildInitialShellState(shellFormat, cleanedConfig);
          set(stateRef, shellInitialState).catch(() => {
            // RTDB write failed — shell will init state on first interaction
          });
        } catch {
          // getDatabase failed — non-critical
        }
      }

      // Place in space if spaceId is set
      if (spaceId) {
        await fetch(`/api/spaces/${spaceId}/tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ toolId }),
        }).catch(() => {
          // Space placement is non-blocking — tool still works standalone
        });
      }

      dispatch({ type: 'DEPLOY_COMPLETE', toolId });
      dispatch({ type: 'GENERATION_COMPLETE', toolId, toolName: name });
      onToolCreated?.(toolId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy';
      dispatch({ type: 'ERROR', error: message });
      toast.error(message);
    }
  }, [state.shellConfig, state.classification, state.prompt, spaceId, onToolCreated]);

  const escalateToCustom = useCallback(async () => {
    dispatch({ type: 'ESCALATE_TO_CUSTOM' });
    await streamGeneration(state.prompt);
  }, [state.prompt, streamGeneration]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    submitPrompt,
    updateShellConfig,
    acceptShell,
    escalateToCustom,
    reset,
    dispatch,
  };
}
