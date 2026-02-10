/**
 * Leadership Badges System
 *
 * Threshold-based auto-badges earned by space leaders.
 * Evaluated against real metrics — no self-reporting.
 */

export interface LeadershipBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  category: 'engagement' | 'growth' | 'events' | 'tools' | 'consistency';
}

export interface BadgeEvaluation {
  badge: LeadershipBadge;
  earned: boolean;
  progress: number; // 0-1
  current: number;
  threshold: number;
}

export interface LeaderMetrics {
  eventsCreated: number;
  toolsDeployed: number;
  messagesPosted: number;
  membersLed: number;
  tenureDays: number;
  weeklyActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const BADGES: LeadershipBadge[] = [
  // Engagement
  {
    id: 'active-leader',
    name: 'Active Leader',
    description: 'Posted 10+ messages in your space',
    icon: 'message-square',
    tier: 'bronze',
    category: 'engagement',
  },
  {
    id: 'voice-of-the-space',
    name: 'Voice of the Space',
    description: 'Posted 50+ messages in your space',
    icon: 'message-square',
    tier: 'silver',
    category: 'engagement',
  },
  {
    id: 'community-pillar',
    name: 'Community Pillar',
    description: 'Posted 200+ messages in your space',
    icon: 'message-square',
    tier: 'gold',
    category: 'engagement',
  },

  // Growth
  {
    id: 'growing-community',
    name: 'Growing Community',
    description: 'Led a space with 10+ members',
    icon: 'users',
    tier: 'bronze',
    category: 'growth',
  },
  {
    id: 'growth-driver',
    name: 'Growth Driver',
    description: 'Led a space with 25+ members',
    icon: 'trending-up',
    tier: 'silver',
    category: 'growth',
  },
  {
    id: 'campus-force',
    name: 'Campus Force',
    description: 'Led a space with 100+ members',
    icon: 'trending-up',
    tier: 'gold',
    category: 'growth',
  },

  // Events
  {
    id: 'first-event',
    name: 'First Event',
    description: 'Created your first event',
    icon: 'calendar',
    tier: 'bronze',
    category: 'events',
  },
  {
    id: 'event-machine',
    name: 'Event Machine',
    description: 'Created 5+ events',
    icon: 'calendar',
    tier: 'silver',
    category: 'events',
  },
  {
    id: 'campus-curator',
    name: 'Campus Curator',
    description: 'Created 20+ events',
    icon: 'calendar',
    tier: 'gold',
    category: 'events',
  },

  // Tools
  {
    id: 'tool-builder',
    name: 'Tool Builder',
    description: 'Deployed your first tool to a space',
    icon: 'wrench',
    tier: 'bronze',
    category: 'tools',
  },
  {
    id: 'power-builder',
    name: 'Power Builder',
    description: 'Deployed 3+ tools to spaces',
    icon: 'wrench',
    tier: 'silver',
    category: 'tools',
  },
  {
    id: 'lab-master',
    name: 'Lab Master',
    description: 'Deployed 10+ tools to spaces',
    icon: 'sparkles',
    tier: 'gold',
    category: 'tools',
  },

  // Consistency
  {
    id: 'dedicated-leader',
    name: 'Dedicated Leader',
    description: 'Led a space for 30+ days',
    icon: 'clock',
    tier: 'bronze',
    category: 'consistency',
  },
  {
    id: 'semester-strong',
    name: 'Semester Strong',
    description: 'Led a space for 90+ days',
    icon: 'shield',
    tier: 'silver',
    category: 'consistency',
  },
  {
    id: 'year-round',
    name: 'Year-Round Leader',
    description: 'Led a space for 365+ days',
    icon: 'shield',
    tier: 'gold',
    category: 'consistency',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Badge Evaluation
// ─────────────────────────────────────────────────────────────────────────────

const THRESHOLDS: Record<string, { metric: keyof LeaderMetrics; threshold: number }> = {
  'active-leader': { metric: 'messagesPosted', threshold: 10 },
  'voice-of-the-space': { metric: 'messagesPosted', threshold: 50 },
  'community-pillar': { metric: 'messagesPosted', threshold: 200 },
  'growing-community': { metric: 'membersLed', threshold: 10 },
  'growth-driver': { metric: 'membersLed', threshold: 25 },
  'campus-force': { metric: 'membersLed', threshold: 100 },
  'first-event': { metric: 'eventsCreated', threshold: 1 },
  'event-machine': { metric: 'eventsCreated', threshold: 5 },
  'campus-curator': { metric: 'eventsCreated', threshold: 20 },
  'tool-builder': { metric: 'toolsDeployed', threshold: 1 },
  'power-builder': { metric: 'toolsDeployed', threshold: 3 },
  'lab-master': { metric: 'toolsDeployed', threshold: 10 },
  'dedicated-leader': { metric: 'tenureDays', threshold: 30 },
  'semester-strong': { metric: 'tenureDays', threshold: 90 },
  'year-round': { metric: 'tenureDays', threshold: 365 },
};

/**
 * Evaluate all badges against current metrics
 */
export function evaluateBadges(metrics: LeaderMetrics): BadgeEvaluation[] {
  return BADGES.map((badge) => {
    const config = THRESHOLDS[badge.id];
    if (!config) {
      return { badge, earned: false, progress: 0, current: 0, threshold: 0 };
    }

    const current = (metrics[config.metric] as number) || 0;
    const progress = Math.min(1, current / config.threshold);
    const earned = current >= config.threshold;

    return { badge, earned, progress, current, threshold: config.threshold };
  });
}

/**
 * Get only earned badges
 */
export function getEarnedBadges(metrics: LeaderMetrics): LeadershipBadge[] {
  return evaluateBadges(metrics)
    .filter(e => e.earned)
    .map(e => e.badge);
}

/**
 * Get next badge to earn (closest to threshold)
 */
export function getNextBadge(metrics: LeaderMetrics): BadgeEvaluation | null {
  const evaluations = evaluateBadges(metrics)
    .filter(e => !e.earned)
    .sort((a, b) => b.progress - a.progress);

  return evaluations[0] || null;
}
