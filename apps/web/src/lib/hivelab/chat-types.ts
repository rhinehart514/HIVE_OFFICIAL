/**
 * Chat Types — Message model for HiveLab conversational creation.
 *
 * Client-only state. No new backend types.
 * Reuses existing ToolElement from @hive/ui.
 */

import type { ToolElement } from '@hive/ui';

export type ChatMessageType =
  | 'text'
  | 'tool-preview'
  | 'template-suggestion'
  | 'status'
  | 'deploy-confirm';

export interface ToolPreview {
  toolId: string;
  toolName: string;
  elements: ToolElement[];
  phase: 'streaming' | 'complete' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: ChatMessageType;
  content: string;
  timestamp: number;
  toolPreview?: ToolPreview;
  templateSuggestion?: {
    templateId: string;
    templateName: string;
    matchScore: number;
  };
}

export interface ChatThread {
  id: string;
  messages: ChatMessage[];
  toolId: string | null;
  toolName: string;
  currentElements: ToolElement[];
  /** Generated code for code-mode tools */
  currentCode?: { html: string; css: string; js: string };
}

export function createMessage(
  role: ChatMessage['role'],
  type: ChatMessageType,
  content: string,
  extra?: Partial<Pick<ChatMessage, 'toolPreview' | 'templateSuggestion'>>
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    role,
    type,
    content,
    timestamp: Date.now(),
    ...extra,
  };
}

export function createThread(): ChatThread {
  return {
    id: `thread_${Date.now()}`,
    messages: [],
    toolId: null,
    toolName: '',
    currentElements: [],
  };
}
