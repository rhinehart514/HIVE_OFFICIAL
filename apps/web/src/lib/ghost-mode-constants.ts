/**
 * Ghost Mode Constants
 *
 * Defines the levels and durations for ghost mode.
 * These must match the API values in /api/privacy/ghost-mode/route.ts
 * and the domain service in packages/core/src/domain/profile/services/ghost-mode.service.ts
 */

import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff, Moon, Ghost } from 'lucide-react';

export type GhostModeLevel = 'normal' | 'selective' | 'minimal' | 'invisible';

export interface GhostModeLevelConfig {
  value: GhostModeLevel;
  label: string;
  description: string;
  detailedDescription: string;
  hides: readonly string[];
  icon: LucideIcon;
}

export const GHOST_MODE_LEVELS: readonly GhostModeLevelConfig[] = [
  {
    value: 'normal',
    label: 'Normal',
    description: 'Full visibility',
    detailedDescription: 'Your profile, activity, and online status are visible to everyone on campus.',
    hides: [],
    icon: Eye,
  },
  {
    value: 'selective',
    label: 'Low Profile',
    description: 'Hide last seen',
    detailedDescription: 'Others can see you\'re online, but not exactly when you were last active.',
    hides: ['lastSeen'],
    icon: EyeOff,
  },
  {
    value: 'minimal',
    label: 'Quiet Mode',
    description: 'Hide activity + status',
    detailedDescription: 'Your activity feed is hidden and you appear offline, but you\'re still in directories.',
    hides: ['activity', 'lastSeen', 'onlineStatus'],
    icon: Moon,
  },
  {
    value: 'invisible',
    label: 'Invisible',
    description: 'Disappear completely',
    detailedDescription: 'You\'re hidden from search, directories, and all feeds. Only direct links to your profile work.',
    hides: ['directory', 'activity', 'spaceMemberships', 'lastSeen', 'onlineStatus', 'search'],
    icon: Ghost,
  },
] as const;

export interface GhostModeDurationConfig {
  value: number; // minutes, -1 for indefinite
  label: string;
  shortLabel: string;
}

export const GHOST_MODE_DURATIONS: readonly GhostModeDurationConfig[] = [
  { value: 60, label: '1 hour', shortLabel: '1h' },
  { value: 240, label: '4 hours', shortLabel: '4h' },
  { value: 480, label: '8 hours', shortLabel: '8h' },
  { value: 1440, label: '24 hours', shortLabel: '24h' },
  { value: -1, label: 'Until I turn it off', shortLabel: '∞' },
] as const;

export type GhostModeDurationValue = (typeof GHOST_MODE_DURATIONS)[number]['value'];

/**
 * Get level config by value
 */
export function getGhostModeLevelConfig(level: GhostModeLevel): GhostModeLevelConfig {
  const config = GHOST_MODE_LEVELS.find((l) => l.value === level);
  if (!config) {
    return GHOST_MODE_LEVELS[0]; // Default to normal
  }
  return config;
}

/**
 * Get duration config by value
 */
export function getGhostModeDurationConfig(minutes: number): GhostModeDurationConfig {
  const config = GHOST_MODE_DURATIONS.find((d) => d.value === minutes);
  if (!config) {
    return GHOST_MODE_DURATIONS[4]; // Default to indefinite
  }
  return config;
}

/**
 * Format remaining time for display
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format remaining time in compact format
 */
export function formatTimeRemainingCompact(milliseconds: number): string {
  if (milliseconds <= 0) return '0:00';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}m`;
}
