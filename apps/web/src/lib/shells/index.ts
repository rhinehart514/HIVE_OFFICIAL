/**
 * Shell Registry
 *
 * Maps format types to their React components, config schemas, and metadata.
 * This is the single source of truth for all format shells.
 */

import { z } from 'zod';
import type { ShellFormat } from './types';
import type { ComponentType } from 'react';
import type { ShellComponentProps, PollConfig, BracketConfig, RSVPConfig, PollState, BracketState, RSVPState } from './types';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const PollConfigSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(100)).min(2).max(6),
  multiSelect: z.boolean().optional(),
  timerSeconds: z.number().min(10).max(86400).optional(),
  anonymous: z.boolean().optional(),
});

export const BracketConfigSchema = z.object({
  topic: z.string().min(1).max(200),
  entries: z.array(z.string().min(1).max(100)).min(4).max(16),
  roundDurationSeconds: z.number().min(30).max(86400).optional(),
});

export const RSVPConfigSchema = z.object({
  title: z.string().min(1).max(200),
  dateTime: z.string().optional(),
  location: z.string().max(200).optional(),
  capacity: z.number().min(1).max(10000).optional(),
  deadline: z.string().optional(),
  description: z.string().max(500).optional(),
});

// ============================================================================
// REGISTRY ENTRY TYPE
// ============================================================================

export interface ShellRegistryEntry {
  displayName: string;
  icon: string;
  configSchema: z.ZodTypeAny;
  defaultConfig: PollConfig | BracketConfig | RSVPConfig;
  component: () => Promise<{ default: ComponentType<ShellComponentProps<any, any>> }>;
}

// ============================================================================
// REGISTRY
// ============================================================================

export const SHELL_REGISTRY: Record<Exclude<ShellFormat, 'custom'>, ShellRegistryEntry> = {
  poll: {
    displayName: 'Poll',
    icon: 'bar-chart-2',
    configSchema: PollConfigSchema,
    defaultConfig: {
      question: '',
      options: ['', ''],
    } satisfies PollConfig,
    component: () => import('@/components/shells/PollCard'),
  },
  bracket: {
    displayName: 'Bracket',
    icon: 'trophy',
    configSchema: BracketConfigSchema,
    defaultConfig: {
      topic: '',
      entries: ['', '', '', ''],
    } satisfies BracketConfig,
    component: () => import('@/components/shells/BracketCard'),
  },
  rsvp: {
    displayName: 'RSVP',
    icon: 'calendar-check',
    configSchema: RSVPConfigSchema,
    defaultConfig: {
      title: '',
    } satisfies RSVPConfig,
    component: () => import('@/components/shells/RSVPCard'),
  },
};

export function isNativeFormat(format: string): format is Exclude<ShellFormat, 'custom'> {
  return format in SHELL_REGISTRY;
}

export { type ShellFormat, type ShellConfig, type ShellAction, type ShellComponentProps, type PollConfig, type BracketConfig, type RSVPConfig, type PollState, type BracketState, type RSVPState, type ClassificationResult } from './types';
