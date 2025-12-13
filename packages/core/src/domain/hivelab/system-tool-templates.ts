/**
 * System Tool Templates - Pre-built sidebar tools for spaces
 *
 * Defines system-level tool templates that can be deployed to any space sidebar.
 * These are "sys-*" prefixed tools that don't require custom HiveLab creation.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

// ============================================================
// Types
// ============================================================

export interface SystemToolTemplate {
  /** System tool ID (e.g., 'sys-about') */
  id: string;
  /** Display name */
  name: string;
  /** Description for gallery */
  description: string;
  /** Icon identifier */
  icon: string;
  /** HiveLab element type this tool uses */
  elementType: string;
  /** Default configuration */
  defaultConfig: Record<string, unknown>;
  /** Category for grouping in gallery */
  category: 'essential' | 'engagement' | 'info';
  /** Order priority (lower = higher priority) */
  priority: number;
}

export interface UniversalTemplate {
  /** Template ID */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Whether this is the default template */
  isDefault: boolean;
  /** Target space categories (empty = all) */
  targetCategories: string[];
  /** Slots in this template */
  slots: Array<{
    slotId: string;
    toolId: string;
    name: string;
    type: string;
    order: number;
    collapsed: boolean;
    config: Record<string, unknown>;
  }>;
}

// ============================================================
// System Tool Templates
// ============================================================

/**
 * All available system tool templates
 */
export const SYSTEM_TOOL_TEMPLATES: SystemToolTemplate[] = [
  // Essential Tools
  {
    id: 'sys-about',
    name: 'About',
    description: 'Space description, member count, and online status',
    icon: 'info',
    elementType: 'space-stats',
    defaultConfig: {
      showMembers: true,
      showOnline: true,
      showDescription: true,
    },
    category: 'essential',
    priority: 0,
  },
  {
    id: 'sys-events',
    name: 'Upcoming Events',
    description: 'Next events with RSVP buttons',
    icon: 'calendar',
    elementType: 'space-events',
    defaultConfig: {
      maxEvents: 5,
      showRsvp: true,
      showDate: true,
      showAttendees: true,
    },
    category: 'essential',
    priority: 1,
  },
  {
    id: 'sys-members',
    name: 'Members',
    description: 'Member list with online status and roles',
    icon: 'users',
    elementType: 'member-list',
    defaultConfig: {
      maxVisible: 8,
      showRoles: true,
      showOnlineStatus: true,
      sortBy: 'online',
    },
    category: 'essential',
    priority: 2,
  },
  {
    id: 'sys-tools',
    name: 'Space Tools',
    description: 'Deployed HiveLab tools list',
    icon: 'wrench',
    elementType: 'tool-list',
    defaultConfig: {
      maxVisible: 5,
      showDescription: false,
    },
    category: 'essential',
    priority: 3,
  },

  // Engagement Tools
  {
    id: 'sys-poll',
    name: 'Quick Poll',
    description: 'Interactive poll for member voting',
    icon: 'bar-chart',
    elementType: 'poll-element',
    defaultConfig: {
      question: '',
      options: [],
      allowMultipleVotes: false,
      showResults: true,
      inline: true,
    },
    category: 'engagement',
    priority: 10,
  },
  {
    id: 'sys-countdown',
    name: 'Countdown',
    description: 'Timer to upcoming event or deadline',
    icon: 'timer',
    elementType: 'countdown-timer',
    defaultConfig: {
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    category: 'engagement',
    priority: 11,
  },
  {
    id: 'sys-links',
    name: 'Quick Links',
    description: 'Important links and resources',
    icon: 'link',
    elementType: 'result-list',
    defaultConfig: {
      style: 'compact',
      maxItems: 10,
    },
    category: 'engagement',
    priority: 12,
  },
  {
    id: 'sys-announcements',
    name: 'Announcements',
    description: 'Pinned announcements feed',
    icon: 'megaphone',
    elementType: 'announcement',
    defaultConfig: {
      maxItems: 5,
      showTimestamp: true,
    },
    category: 'engagement',
    priority: 13,
  },
  {
    id: 'sys-leaderboard',
    name: 'Leaderboard',
    description: 'Member rankings and scores',
    icon: 'trophy',
    elementType: 'leaderboard',
    defaultConfig: {
      maxEntries: 10,
      showRankChange: true,
    },
    category: 'engagement',
    priority: 14,
  },
];

// ============================================================
// Universal Templates
// ============================================================

/**
 * Universal default template - works for all space categories
 */
export const UNIVERSAL_DEFAULT_TEMPLATE: UniversalTemplate = {
  id: 'universal-default',
  name: 'Universal Default',
  description: 'Standard sidebar layout for all spaces',
  isDefault: true,
  targetCategories: [], // Empty = all categories
  slots: [
    {
      slotId: 'slot-about',
      toolId: 'sys-about',
      name: 'About',
      type: 'space-stats',
      order: 0,
      collapsed: false,
      config: {
        showMembers: true,
        showOnline: true,
        showDescription: true,
      },
    },
    {
      slotId: 'slot-events',
      toolId: 'sys-events',
      name: 'Upcoming Events',
      type: 'space-events',
      order: 1,
      collapsed: false,
      config: {
        maxEvents: 5,
        showRsvp: true,
      },
    },
    {
      slotId: 'slot-members',
      toolId: 'sys-members',
      name: 'Members',
      type: 'member-list',
      order: 2,
      collapsed: true,
      config: {
        maxVisible: 8,
        showRoles: true,
      },
    },
  ],
};

/**
 * Academic Template - For course-related spaces
 */
export const ACADEMIC_TEMPLATE: UniversalTemplate = {
  id: 'academic-default',
  name: 'Academic Default',
  description: 'Optimized for course and study group spaces',
  isDefault: false,
  targetCategories: ['academic', 'course', 'study-group'],
  slots: [
    {
      slotId: 'slot-about',
      toolId: 'sys-about',
      name: 'About',
      type: 'space-stats',
      order: 0,
      collapsed: false,
      config: {
        showMembers: true,
        showOnline: true,
        showDescription: true,
      },
    },
    {
      slotId: 'slot-announcements',
      toolId: 'sys-announcements',
      name: 'Announcements',
      type: 'announcement',
      order: 1,
      collapsed: false,
      config: {
        maxItems: 5,
        showTimestamp: true,
      },
    },
    {
      slotId: 'slot-events',
      toolId: 'sys-events',
      name: 'Office Hours & Sessions',
      type: 'space-events',
      order: 2,
      collapsed: false,
      config: {
        maxEvents: 5,
        showRsvp: true,
        showDate: true,
      },
    },
    {
      slotId: 'slot-links',
      toolId: 'sys-links',
      name: 'Course Resources',
      type: 'result-list',
      order: 3,
      collapsed: false,
      config: {
        style: 'list',
        maxItems: 10,
      },
    },
    {
      slotId: 'slot-members',
      toolId: 'sys-members',
      name: 'Classmates',
      type: 'member-list',
      order: 4,
      collapsed: true,
      config: {
        maxVisible: 8,
        showRoles: true,
      },
    },
  ],
};

/**
 * Social Template - For clubs and social organizations
 */
export const SOCIAL_TEMPLATE: UniversalTemplate = {
  id: 'social-default',
  name: 'Social Default',
  description: 'Optimized for clubs and social groups',
  isDefault: false,
  targetCategories: ['social', 'club', 'organization'],
  slots: [
    {
      slotId: 'slot-about',
      toolId: 'sys-about',
      name: 'About Us',
      type: 'space-stats',
      order: 0,
      collapsed: false,
      config: {
        showMembers: true,
        showOnline: true,
        showDescription: true,
      },
    },
    {
      slotId: 'slot-events',
      toolId: 'sys-events',
      name: 'Upcoming Events',
      type: 'space-events',
      order: 1,
      collapsed: false,
      config: {
        maxEvents: 5,
        showRsvp: true,
        showDate: true,
        showAttendees: true,
      },
    },
    {
      slotId: 'slot-leaderboard',
      toolId: 'sys-leaderboard',
      name: 'Top Contributors',
      type: 'leaderboard',
      order: 2,
      collapsed: false,
      config: {
        maxEntries: 5,
        showRankChange: true,
      },
    },
    {
      slotId: 'slot-poll',
      toolId: 'sys-poll',
      name: 'Community Poll',
      type: 'poll-element',
      order: 3,
      collapsed: false,
      config: {
        question: '',
        options: [],
        allowMultipleVotes: false,
        showResults: true,
      },
    },
    {
      slotId: 'slot-members',
      toolId: 'sys-members',
      name: 'Members',
      type: 'member-list',
      order: 4,
      collapsed: true,
      config: {
        maxVisible: 12,
        showRoles: true,
        showOnlineStatus: true,
      },
    },
  ],
};

/**
 * Professional Template - For networking and career groups
 */
export const PROFESSIONAL_TEMPLATE: UniversalTemplate = {
  id: 'professional-default',
  name: 'Professional Default',
  description: 'Optimized for professional and networking spaces',
  isDefault: false,
  targetCategories: ['professional', 'networking', 'career'],
  slots: [
    {
      slotId: 'slot-about',
      toolId: 'sys-about',
      name: 'About',
      type: 'space-stats',
      order: 0,
      collapsed: false,
      config: {
        showMembers: true,
        showOnline: true,
        showDescription: true,
      },
    },
    {
      slotId: 'slot-announcements',
      toolId: 'sys-announcements',
      name: 'Opportunities',
      type: 'announcement',
      order: 1,
      collapsed: false,
      config: {
        maxItems: 5,
        showTimestamp: true,
      },
    },
    {
      slotId: 'slot-events',
      toolId: 'sys-events',
      name: 'Networking Events',
      type: 'space-events',
      order: 2,
      collapsed: false,
      config: {
        maxEvents: 5,
        showRsvp: true,
      },
    },
    {
      slotId: 'slot-links',
      toolId: 'sys-links',
      name: 'Resources',
      type: 'result-list',
      order: 3,
      collapsed: false,
      config: {
        style: 'compact',
        maxItems: 10,
      },
    },
    {
      slotId: 'slot-members',
      toolId: 'sys-members',
      name: 'Network',
      type: 'member-list',
      order: 4,
      collapsed: true,
      config: {
        maxVisible: 10,
        showRoles: true,
      },
    },
  ],
};

/**
 * Interest Template - For hobby and interest-based groups
 */
export const INTEREST_TEMPLATE: UniversalTemplate = {
  id: 'interest-default',
  name: 'Interest Default',
  description: 'Optimized for hobby and interest groups',
  isDefault: false,
  targetCategories: ['interest', 'hobby', 'recreation'],
  slots: [
    {
      slotId: 'slot-about',
      toolId: 'sys-about',
      name: 'About',
      type: 'space-stats',
      order: 0,
      collapsed: false,
      config: {
        showMembers: true,
        showOnline: true,
        showDescription: true,
      },
    },
    {
      slotId: 'slot-poll',
      toolId: 'sys-poll',
      name: 'Quick Poll',
      type: 'poll-element',
      order: 1,
      collapsed: false,
      config: {
        question: '',
        options: [],
        allowMultipleVotes: false,
        showResults: true,
      },
    },
    {
      slotId: 'slot-events',
      toolId: 'sys-events',
      name: 'Meetups',
      type: 'space-events',
      order: 2,
      collapsed: false,
      config: {
        maxEvents: 5,
        showRsvp: true,
      },
    },
    {
      slotId: 'slot-leaderboard',
      toolId: 'sys-leaderboard',
      name: 'Active Members',
      type: 'leaderboard',
      order: 3,
      collapsed: true,
      config: {
        maxEntries: 5,
      },
    },
    {
      slotId: 'slot-members',
      toolId: 'sys-members',
      name: 'Community',
      type: 'member-list',
      order: 4,
      collapsed: true,
      config: {
        maxVisible: 10,
        showOnlineStatus: true,
      },
    },
  ],
};

/**
 * All available templates (for migration/auto-deploy)
 */
export const ALL_TEMPLATES: UniversalTemplate[] = [
  UNIVERSAL_DEFAULT_TEMPLATE,
  ACADEMIC_TEMPLATE,
  SOCIAL_TEMPLATE,
  PROFESSIONAL_TEMPLATE,
  INTEREST_TEMPLATE,
];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get system tool by ID
 */
export function getSystemTool(toolId: string): SystemToolTemplate | undefined {
  return SYSTEM_TOOL_TEMPLATES.find((t) => t.id === toolId);
}

/**
 * Get system tools by category
 */
export function getSystemToolsByCategory(
  category: SystemToolTemplate['category']
): SystemToolTemplate[] {
  return SYSTEM_TOOL_TEMPLATES
    .filter((t) => t.category === category)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Map HIVE's 4 categories to template categories
 * This bridges the gap between CampusLabs imports and template system
 */
const HIVE_TO_TEMPLATE_CATEGORY: Record<string, string[]> = {
  'student_org': ['social', 'club', 'organization'],
  'university_org': ['professional', 'academic'],
  'greek_life': ['social', 'club'],
  'residential': ['interest', 'community'],
};

/**
 * Get template for space category
 * Supports both template categories (academic, social) and HIVE categories (student_org)
 */
export function getTemplateForCategory(
  category?: string
): UniversalTemplate {
  if (!category) {
    return UNIVERSAL_DEFAULT_TEMPLATE;
  }

  // First try direct template category match
  let template = ALL_TEMPLATES.find(
    (t) =>
      t.targetCategories.length > 0 &&
      t.targetCategories.includes(category)
  );

  // If not found, try HIVE category mapping
  if (!template) {
    const mappedCategories = HIVE_TO_TEMPLATE_CATEGORY[category];
    if (mappedCategories) {
      template = ALL_TEMPLATES.find((t) =>
        t.targetCategories.some((tc) => mappedCategories.includes(tc))
      );
    }
  }

  return template || UNIVERSAL_DEFAULT_TEMPLATE;
}

/**
 * Check if a tool ID is a system tool
 */
export function isSystemTool(toolId: string): boolean {
  return toolId.startsWith('sys-');
}

/**
 * Get all essential system tools
 */
export function getEssentialTools(): SystemToolTemplate[] {
  return getSystemToolsByCategory('essential');
}

/**
 * Get all engagement system tools
 */
export function getEngagementTools(): SystemToolTemplate[] {
  return getSystemToolsByCategory('engagement');
}
