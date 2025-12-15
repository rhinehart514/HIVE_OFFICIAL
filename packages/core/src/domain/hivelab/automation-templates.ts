/**
 * Automation Templates
 *
 * Pre-built automation configurations that leaders can quickly enable.
 * Templates cover common use cases and provide sensible defaults.
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

import type { AutomationTrigger, AutomationAction } from './entities/automation';

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'events' | 'moderation' | 'notifications';
  icon: string; // Lucide icon name
  trigger: Omit<AutomationTrigger, 'type'> & { type: AutomationTrigger['type'] };
  action: Omit<AutomationAction, 'type'> & { type: AutomationAction['type'] };
  /** Variables users can customize */
  customizableFields: Array<{
    path: string; // e.g., "action.config.content"
    label: string;
    type: 'text' | 'number' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  /** Example of what it does */
  example: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // ENGAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'welcome-new-members',
    name: 'Welcome New Members',
    description: 'Automatically greet members when they join your space',
    category: 'engagement',
    icon: 'UserPlus',
    trigger: {
      type: 'member_join',
      config: {},
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '👋 Welcome to the community, {member}! Feel free to introduce yourself and explore our channels.',
      },
    },
    customizableFields: [
      {
        path: 'action.config.content',
        label: 'Welcome Message',
        type: 'text',
        placeholder: 'Hey {member}, welcome to the team!',
      },
    ],
    example: 'When @newuser joins → Posts "👋 Welcome to the community, @newuser!"',
  },
  {
    id: 'friendly-welcome',
    name: 'Friendly Welcome',
    description: 'A warmer, more casual welcome for social spaces',
    category: 'engagement',
    icon: 'Smile',
    trigger: {
      type: 'member_join',
      config: {},
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '🎉 {member} just joined! Say hi everyone! 👋',
      },
    },
    customizableFields: [
      {
        path: 'action.config.content',
        label: 'Welcome Message',
        type: 'text',
        placeholder: 'Customize your welcome message...',
      },
    ],
    example: 'When @newuser joins → Posts "🎉 @newuser just joined! Say hi everyone! 👋"',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'event-reminder-30min',
    name: '30-Minute Event Reminder',
    description: 'Remind members 30 minutes before events start',
    category: 'events',
    icon: 'Bell',
    trigger: {
      type: 'event_reminder',
      config: {
        beforeMinutes: 30,
      },
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '⏰ **{event}** starts in 30 minutes! Don\'t miss it!',
      },
    },
    customizableFields: [
      {
        path: 'trigger.config.beforeMinutes',
        label: 'Minutes Before',
        type: 'number',
        placeholder: '30',
      },
      {
        path: 'action.config.content',
        label: 'Reminder Message',
        type: 'text',
        placeholder: 'Event {event} is starting soon!',
      },
    ],
    example: '30 minutes before "Study Session" → Posts "⏰ Study Session starts in 30 minutes!"',
  },
  {
    id: 'event-reminder-1hour',
    name: '1-Hour Event Reminder',
    description: 'Remind members 1 hour before events',
    category: 'events',
    icon: 'Clock',
    trigger: {
      type: 'event_reminder',
      config: {
        beforeMinutes: 60,
      },
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '📅 Heads up! **{event}** starts in 1 hour. See you there!',
      },
    },
    customizableFields: [
      {
        path: 'action.config.content',
        label: 'Reminder Message',
        type: 'text',
        placeholder: 'Event {event} starts in 1 hour!',
      },
    ],
    example: '1 hour before "Club Meeting" → Posts "📅 Heads up! Club Meeting starts in 1 hour."',
  },
  {
    id: 'event-reminder-day',
    name: 'Day-Before Reminder',
    description: 'Remind members the day before important events',
    category: 'events',
    icon: 'CalendarDays',
    trigger: {
      type: 'event_reminder',
      config: {
        beforeMinutes: 1440, // 24 hours
      },
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '📆 **Tomorrow:** {event}\n\nDon\'t forget to mark your calendar!',
      },
    },
    customizableFields: [
      {
        path: 'action.config.content',
        label: 'Reminder Message',
        type: 'text',
        placeholder: 'Tomorrow: {event}',
      },
    ],
    example: '24 hours before "Annual Gala" → Posts "📆 Tomorrow: Annual Gala"',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'keyword-alert-meeting',
    name: 'Meeting Keyword Alert',
    description: 'Ping leaders when someone mentions "meeting" or "urgent"',
    category: 'notifications',
    icon: 'AlertCircle',
    trigger: {
      type: 'keyword',
      config: {
        keywords: ['meeting', 'urgent', 'important'],
        matchType: 'contains',
      },
    },
    action: {
      type: 'notify',
      config: {
        recipients: 'leaders',
        title: 'Keyword Alert',
        body: 'Someone mentioned "{message}" in your space',
      },
    },
    customizableFields: [
      {
        path: 'trigger.config.keywords',
        label: 'Keywords to Watch',
        type: 'text',
        placeholder: 'meeting, urgent, help',
      },
    ],
    example: 'When someone says "urgent question" → Notifies space leaders',
  },
  {
    id: 'reaction-milestone',
    name: 'Popular Post Alert',
    description: 'Celebrate when a message gets many reactions',
    category: 'notifications',
    icon: 'Star',
    trigger: {
      type: 'reaction_threshold',
      config: {
        threshold: 10,
      },
    },
    action: {
      type: 'send_message',
      config: {
        boardId: 'general',
        content: '🔥 A post is blowing up! It just hit {trigger.threshold} reactions!',
      },
    },
    customizableFields: [
      {
        path: 'trigger.config.threshold',
        label: 'Reaction Count',
        type: 'number',
        placeholder: '10',
      },
      {
        path: 'action.config.content',
        label: 'Celebration Message',
        type: 'text',
        placeholder: '🔥 This post is popular!',
      },
    ],
    example: 'When a post gets 10+ reactions → Posts "🔥 A post is blowing up!"',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get all templates
 */
export function getAllTemplates(): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: AutomationTemplate['category']
): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find(t => t.id === id);
}

/**
 * Create an automation config from a template
 * Applies custom values to the template's default configuration
 */
export function createFromTemplate(
  template: AutomationTemplate,
  customValues: Record<string, unknown> = {},
  name?: string
): { name: string; trigger: AutomationTrigger; action: AutomationAction } {
  // Deep clone the template config
  const trigger = JSON.parse(JSON.stringify(template.trigger)) as AutomationTrigger;
  const action = JSON.parse(JSON.stringify(template.action)) as AutomationAction;

  // Apply custom values
  for (const [path, value] of Object.entries(customValues)) {
    setNestedValue({ trigger, action }, path, value);
  }

  return {
    name: name || template.name,
    trigger,
    action,
  };
}

/**
 * Set a nested value in an object using dot notation path
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Get categories with counts
 */
export function getTemplateCategories(): Array<{
  category: AutomationTemplate['category'];
  count: number;
  label: string;
}> {
  const categoryLabels: Record<AutomationTemplate['category'], string> = {
    engagement: 'Engagement',
    events: 'Events',
    moderation: 'Moderation',
    notifications: 'Notifications',
  };

  const counts = AUTOMATION_TEMPLATES.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(categoryLabels).map(([category, label]) => ({
    category: category as AutomationTemplate['category'],
    count: counts[category] || 0,
    label,
  }));
}
