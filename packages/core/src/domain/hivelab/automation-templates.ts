/**
 * Automation Templates
 *
 * Pre-built automation configurations that users can apply with one click.
 * Each template defines a trigger, conditions, and actions.
 */

export interface AutomationTrigger {
  type: 'event' | 'schedule' | 'threshold';
  elementId?: string;
  eventName?: string;
  scheduleType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  path?: string;
  operator?: string;
  value?: number;
}

export interface AutomationCondition {
  path: string;
  operator: string;
  value: unknown;
}

export interface AutomationAction {
  type: 'notify' | 'mutate' | 'triggerTool';
  title?: string;
  body?: string;
  recipients?: string | string[];
  elementId?: string;
  mutation?: Record<string, unknown>;
  deploymentId?: string;
  eventName?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  limits: { maxRunsPerDay: number; cooldownSeconds: number };
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'notify-on-votes',
    name: 'Notify on 10 votes',
    description: 'Send a notification when a poll reaches 10 total votes',
    category: 'engagement',
    trigger: {
      type: 'threshold',
      path: 'counters.poll_001:total',
      operator: '>=',
      value: 10,
    },
    conditions: [],
    actions: [
      {
        type: 'notify',
        title: 'Your poll hit 10 votes!',
        body: 'People are engaging — check the results.',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 1, cooldownSeconds: 3600 },
  },
  {
    id: 'daily-digest',
    name: 'Daily digest',
    description: 'Send a daily summary notification to all space members',
    category: 'communication',
    trigger: {
      type: 'schedule',
      scheduleType: 'daily',
      hour: 9,
      minute: 0,
    },
    conditions: [],
    actions: [
      {
        type: 'notify',
        title: 'Daily update',
        body: 'Check what happened in your tools today.',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 1, cooldownSeconds: 43200 },
  },
  {
    id: 'welcome-signups',
    name: 'Welcome new signups',
    description: 'Notify when someone signs up or RSVPs',
    category: 'engagement',
    trigger: {
      type: 'event',
      eventName: 'rsvp',
    },
    conditions: [],
    actions: [
      {
        type: 'notify',
        title: 'New signup!',
        body: 'Someone just joined — the momentum is building.',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 50, cooldownSeconds: 60 },
  },
  {
    id: 'threshold-alert',
    name: 'Threshold alert',
    description: 'Alert when a counter passes a custom threshold',
    category: 'monitoring',
    trigger: {
      type: 'threshold',
      path: 'counters.counter_001:value',
      operator: '>=',
      value: 100,
    },
    conditions: [],
    actions: [
      {
        type: 'notify',
        title: 'Threshold reached!',
        body: 'Your counter hit the target value.',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 5, cooldownSeconds: 3600 },
  },
  {
    id: 'weekly-leaderboard-reset',
    name: 'Weekly leaderboard reset',
    description: 'Reset the leaderboard scores every Monday',
    category: 'maintenance',
    trigger: {
      type: 'schedule',
      scheduleType: 'weekly',
      dayOfWeek: 1,
      hour: 0,
      minute: 0,
    },
    conditions: [],
    actions: [
      {
        type: 'mutate',
        elementId: 'leaderboard_001',
        mutation: { scores: 0 },
      },
      {
        type: 'notify',
        title: 'Leaderboard reset',
        body: 'New week, new scores. Time to compete!',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 1, cooldownSeconds: 86400 },
  },
  {
    id: 'auto-close-after-date',
    name: 'Auto-close after date',
    description: 'Disable the tool after a countdown timer expires',
    category: 'lifecycle',
    trigger: {
      type: 'schedule',
      scheduleType: 'hourly',
    },
    conditions: [
      {
        path: 'counters.countdown_001:expired',
        operator: '==',
        value: 1,
      },
    ],
    actions: [
      {
        type: 'notify',
        title: 'Tool closed',
        body: 'This tool has reached its deadline and is now closed.',
        recipients: 'all',
      },
    ],
    limits: { maxRunsPerDay: 1, cooldownSeconds: 86400 },
  },
];

export function getAllTemplates(): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES;
}

export function getTemplatesByCategory(category: string): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find(t => t.id === id);
}

export function createFromTemplate(
  templateId: string,
  overrides?: Partial<Pick<AutomationTemplate, 'name' | 'description'>> & {
    trigger?: Partial<AutomationTrigger>;
    actions?: AutomationAction[];
  }
): Omit<AutomationTemplate, 'id' | 'category'> | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    name: overrides?.name || template.name,
    description: overrides?.description || template.description,
    trigger: { ...template.trigger, ...overrides?.trigger },
    conditions: template.conditions,
    actions: overrides?.actions || template.actions,
    limits: template.limits,
  };
}

export function getTemplateCategories(): string[] {
  return [...new Set(AUTOMATION_TEMPLATES.map(t => t.category))];
}
