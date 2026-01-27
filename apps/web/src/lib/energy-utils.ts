/**
 * Energy Utilities
 *
 * Calculate and display space energy levels based on recent activity.
 * Energy signals help users understand which spaces are active without
 * creating notification anxiety.
 *
 * @version 1.0.0 - Sprint 3 (Jan 2026)
 */

export type EnergyLevel = 'busy' | 'active' | 'quiet' | 'none';

/**
 * Calculate energy level from recent message count (last 24 hours)
 *
 * - busy: 20+ messages (◉◉◉)
 * - active: 5-19 messages (◉◉)
 * - quiet: 1-4 messages (◉)
 * - none: 0 messages
 */
export function getEnergyLevel(messageCount: number = 0): EnergyLevel {
  if (messageCount >= 20) return 'busy';
  if (messageCount >= 5) return 'active';
  if (messageCount >= 1) return 'quiet';
  return 'none';
}

/**
 * Get the number of dots for an energy level
 */
export function getEnergyDotCount(level: EnergyLevel): number {
  switch (level) {
    case 'busy':
      return 3;
    case 'active':
      return 2;
    case 'quiet':
      return 1;
    case 'none':
    default:
      return 0;
  }
}

/**
 * Get display label for energy level
 */
export function getEnergyLabel(level: EnergyLevel): string | null {
  switch (level) {
    case 'busy':
      return 'busy';
    case 'active':
      return 'active';
    case 'quiet':
      return 'quiet';
    case 'none':
    default:
      return null;
  }
}
