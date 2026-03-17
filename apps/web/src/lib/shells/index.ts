/**
 * Shell Registry
 *
 * Maps format types to their React components, config schemas, and metadata.
 * This is the single source of truth for all format shells.
 */

import { z } from 'zod';
import type { ShellFormat, ShellConfig } from './types';
import type { ComponentType } from 'react';
import type {
  ShellComponentProps,
  PollConfig,
  BracketConfig,
  RSVPConfig,
  TierListConfig,
  HotTakesConfig,
  ThisOrThatConfig,
  SignupListConfig,
  SuperlativesConfig,
  PersonalityQuizConfig,
} from './types';

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

export const TierListConfigSchema = z.object({
  topic: z.string().min(1).max(200),
  items: z.array(z.string().min(1).max(100)).min(2).max(20),
  tiers: z.array(z.string().min(1).max(20)).min(2).max(7),
});

export const HotTakesConfigSchema = z.object({
  topic: z.string().min(1).max(200),
  statements: z.array(z.string().min(1).max(200)).min(1).max(10),
});

export const ThisOrThatConfigSchema = z.object({
  topic: z.string().min(1).max(200),
  pairs: z.array(z.object({ a: z.string().min(1).max(100), b: z.string().min(1).max(100) })).min(1).max(10),
});

export const SignupListConfigSchema = z.object({
  title: z.string().min(1).max(200),
  slots: z.array(z.object({ label: z.string().min(1).max(100), capacity: z.number().min(1).max(1000) })).min(1).max(20),
  deadline: z.string().optional(),
});

export const SuperlativesConfigSchema = z.object({
  title: z.string().min(1).max(200),
  categories: z.array(z.string().min(1).max(100)).min(1).max(15),
  allowWriteIn: z.boolean(),
});

export const PersonalityQuizConfigSchema = z.object({
  title: z.string().min(1).max(200),
  questions: z.array(z.object({
    question: z.string().min(1).max(300),
    options: z.array(z.object({ text: z.string().min(1).max(100), resultKey: z.string().min(1) })).min(2).max(6),
  })).min(1).max(15),
  results: z.record(z.object({ label: z.string().min(1).max(100), description: z.string().min(1).max(300) })),
});

// ============================================================================
// REGISTRY ENTRY TYPE
// ============================================================================

export type FormatCategory = 'vote' | 'rank' | 'social' | 'collect';

export interface ShellRegistryEntry {
  displayName: string;
  icon: string;
  description: string;
  category: FormatCategory;
  configSchema: z.ZodTypeAny;
  defaultConfig: ShellConfig;
  component: () => Promise<{ default: ComponentType<ShellComponentProps<any, any>> }>;
  /** Format is implemented and ready to use */
  ready: boolean;
}

// ============================================================================
// REGISTRY
// ============================================================================

export const SHELL_REGISTRY: Record<Exclude<ShellFormat, 'custom'>, ShellRegistryEntry> = {
  poll: {
    displayName: 'Poll',
    icon: 'bar-chart-2',
    description: 'Ask a question, get votes',
    category: 'vote',
    configSchema: PollConfigSchema,
    defaultConfig: {
      question: '',
      options: ['', ''],
    } satisfies PollConfig,
    component: () => import('@/components/shells/PollCard'),
    ready: true,
  },
  bracket: {
    displayName: 'Bracket',
    icon: 'trophy',
    description: 'Head-to-head tournament',
    category: 'vote',
    configSchema: BracketConfigSchema,
    defaultConfig: {
      topic: '',
      entries: ['', '', '', ''],
    } satisfies BracketConfig,
    component: () => import('@/components/shells/BracketCard'),
    ready: true,
  },
  'this-or-that': {
    displayName: 'This or That',
    icon: 'arrow-left-right',
    description: 'Two choices, pick one',
    category: 'vote',
    configSchema: ThisOrThatConfigSchema,
    defaultConfig: {
      topic: '',
      pairs: [{ a: '', b: '' }],
    } satisfies ThisOrThatConfig,
    component: () => import('@/components/shells/ThisOrThatCard'),
    ready: true,
  },
  'tier-list': {
    displayName: 'Tier List',
    icon: 'trophy',
    description: 'Rank items into tiers',
    category: 'rank',
    configSchema: TierListConfigSchema,
    defaultConfig: {
      topic: '',
      items: ['', '', '', ''],
      tiers: ['S', 'A', 'B', 'C', 'D'],
    } satisfies TierListConfig,
    component: () => import('@/components/shells/TierListCard'),
    ready: true,
  },
  'hot-takes': {
    displayName: 'Hot Takes',
    icon: 'flame',
    description: 'Agree or disagree on statements',
    category: 'rank',
    configSchema: HotTakesConfigSchema,
    defaultConfig: {
      topic: '',
      statements: [''],
    } satisfies HotTakesConfig,
    component: () => import('@/components/shells/HotTakesCard'),
    ready: true,
  },
  superlatives: {
    displayName: 'Superlatives',
    icon: 'crown',
    description: 'Nominate people for awards',
    category: 'social',
    configSchema: SuperlativesConfigSchema,
    defaultConfig: {
      title: '',
      categories: ['Most likely to...'],
      allowWriteIn: true,
    } satisfies SuperlativesConfig,
    component: () => import('@/components/shells/SuperlativesCard'),
    ready: true,
  },
  'personality-quiz': {
    displayName: 'Personality Quiz',
    icon: 'brain',
    description: 'Which ___ are you?',
    category: 'social',
    configSchema: PersonalityQuizConfigSchema,
    defaultConfig: {
      title: '',
      questions: [{ question: '', options: [{ text: '', resultKey: 'a' }, { text: '', resultKey: 'b' }] }],
      results: { a: { label: 'Type A', description: '' }, b: { label: 'Type B', description: '' } },
    } satisfies PersonalityQuizConfig,
    component: () => import('@/components/shells/PersonalityQuizCard'),
    ready: true,
  },
  rsvp: {
    displayName: 'RSVP',
    icon: 'calendar-check',
    description: 'Track who\'s coming',
    category: 'collect',
    configSchema: RSVPConfigSchema,
    defaultConfig: {
      title: '',
    } satisfies RSVPConfig,
    component: () => import('@/components/shells/RSVPCard'),
    ready: true,
  },
  'signup-list': {
    displayName: 'Signup List',
    icon: 'clipboard-list',
    description: 'Sign up for slots',
    category: 'collect',
    configSchema: SignupListConfigSchema,
    defaultConfig: {
      title: '',
      slots: [{ label: '', capacity: 10 }],
    } satisfies SignupListConfig,
    component: () => import('@/components/shells/SignupListCard'),
    ready: true,
  },
};

export function isNativeFormat(format: string): format is Exclude<ShellFormat, 'custom'> {
  return format in SHELL_REGISTRY;
}

/** Returns only formats that are fully implemented */
export function isReadyFormat(format: string): boolean {
  return isNativeFormat(format) && SHELL_REGISTRY[format as Exclude<ShellFormat, 'custom'>].ready;
}

export {
  type ShellFormat,
  type ShellConfig,
  type ShellAction,
  type ShellComponentProps,
  type PollConfig,
  type BracketConfig,
  type RSVPConfig,
  type TierListConfig,
  type HotTakesConfig,
  type ThisOrThatConfig,
  type SignupListConfig,
  type SuperlativesConfig,
  type PersonalityQuizConfig,
  type ClassificationResult,
  type PollState,
  type BracketState,
  type RSVPState,
  type TierListState,
  type HotTakesState,
  type ThisOrThatState,
  type SignupListState,
  type SuperlativesState,
  type PersonalityQuizState,
} from './types';
