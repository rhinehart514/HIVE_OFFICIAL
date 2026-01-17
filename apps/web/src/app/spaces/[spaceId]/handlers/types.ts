/**
 * Types for Space Page Handlers
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Re-export UI types for convenience
export type {
  AddTabInput,
  AddWidgetInputUI,
  MemberInviteInput,
  EventCreateInput,
  SlashCommandData,
  DetectedIntent,
  QuickTemplate,
  RSVPStatus,
  InviteableUser,
} from '@hive/ui';

// Tool data from sidebar
export interface ToolData {
  id: string;
  toolId: string;
  placementId: string;
  name: string;
  type: string;
  isActive: boolean;
  responseCount: number;
}

// Leader data for sidebar
export interface LeaderData {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

// Selected tool for modal
export interface SelectedTool {
  id: string;
  toolId: string;
  placementId: string;
  name: string;
  type: string;
}

// Pending intent for confirmation UI
export interface PendingIntent {
  intent: import('@hive/ui').DetectedIntent;
  message: string;
  boardId: string;
}

// Base dependencies shared across all handlers
export interface BaseHandlerDeps {
  spaceId: string | null;
  router: AppRouterInstance;
  refresh: () => void;
}

// Space handlers dependencies
export interface SpaceHandlerDeps extends BaseHandlerDeps {
  leaderActions: {
    addTab: (input: { name: string; type: string }) => Promise<unknown>;
    addWidget: (input: { type: string; title: string; config?: unknown }) => Promise<unknown>;
  } | null;
}

// Chat handlers dependencies
export interface ChatHandlerDeps extends BaseHandlerDeps {
  activeBoardId: string | null;
  isLeader: boolean;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  checkIntent: (content: string, boardId: string) => Promise<import('@hive/ui').DetectedIntent>;
  createIntentComponent: (message: string, boardId: string) => Promise<{ success: boolean; created: boolean; error?: string }>;
  setPendingIntent: (intent: PendingIntent | null) => void;
}

// Tool handlers dependencies
export interface ToolHandlerDeps extends BaseHandlerDeps {
  tools: ToolData[];
  setTools: React.Dispatch<React.SetStateAction<ToolData[]>>;
  leaderOnboarding: {
    markTaskComplete: (taskId: string) => void;
  };
}

// Automation handlers dependencies
export interface AutomationHandlerDeps extends BaseHandlerDeps {
  activeBoardId: string | null;
}
