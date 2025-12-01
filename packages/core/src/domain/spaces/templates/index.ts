/**
 * Space Templates Library
 *
 * Pre-configured space templates for rapid setup.
 * Each template provides smart defaults for tabs, widgets, and settings
 * based on common space archetypes (study groups, clubs, events, etc.).
 */

/**
 * Space template categories
 */
export type SpaceTemplateCategory =
  | 'academic'
  | 'social'
  | 'professional'
  | 'community'
  | 'events';

/**
 * Tab configuration for a template
 */
export interface TemplateTab {
  name: string;
  type: 'feed' | 'widget' | 'resource' | 'custom';
  isDefault: boolean;
  order: number;
  icon?: string;
  description?: string;
}

/**
 * Widget configuration for a template
 */
export interface TemplateWidget {
  type: 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';
  title: string;
  config: Record<string, unknown>;
  order: number;
  tabName?: string; // Which tab to place widget on
}

/**
 * Space settings configuration
 */
export interface TemplateSettings {
  joinPolicy: 'open' | 'approval' | 'invite_only';
  visibility: 'public' | 'private';
  allowInvites: boolean;
  requireApproval: boolean;
  allowRSS: boolean;
  maxMembers?: number;
  postApprovalRequired?: boolean;
  eventApprovalRequired?: boolean;
}

/**
 * Template metadata
 */
export interface SpaceTemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: SpaceTemplateCategory;
  icon: string;
  suggestedFor: string[]; // Categories this template is good for
  difficulty: 'starter' | 'standard' | 'advanced';
  estimatedSetupTime: string;
  tags: string[];
}

/**
 * Complete space template definition
 */
export interface SpaceTemplate {
  metadata: SpaceTemplateMetadata;
  tabs: TemplateTab[];
  widgets: TemplateWidget[];
  settings: TemplateSettings;
  suggestedDescription?: string;
  suggestedTags?: string[];
}

// ═════════════════════════════════════════════════════════════════
// ACADEMIC TEMPLATES
// ═════════════════════════════════════════════════════════════════

export const STUDY_GROUP_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'study-group',
    name: 'Study Group',
    description: 'Perfect for course-specific study groups, exam prep, and collaborative learning',
    category: 'academic',
    icon: '📚',
    suggestedFor: ['student_org', 'academic'],
    difficulty: 'starter',
    estimatedSetupTime: '2 minutes',
    tags: ['study', 'academic', 'collaboration', 'learning'],
  },
  tabs: [
    {
      name: 'Discussion',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '💬',
      description: 'Main discussion feed for questions and study help',
    },
    {
      name: 'Resources',
      type: 'resource',
      isDefault: false,
      order: 1,
      icon: '📁',
      description: 'Shared notes, study guides, and materials',
    },
    {
      name: 'Schedule',
      type: 'widget',
      isDefault: false,
      order: 2,
      icon: '📅',
      description: 'Study sessions and exam dates',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Study Sessions',
      config: {
        showUpcoming: true,
        maxItems: 5,
        allowMemberEvents: true,
      },
      order: 0,
      tabName: 'Schedule',
    },
    {
      type: 'links',
      title: 'Quick Links',
      config: {
        placeholder: 'Add course syllabus, lecture slides, etc.',
      },
      order: 1,
    },
    {
      type: 'poll',
      title: 'Quick Poll',
      config: {
        allowAnonymous: true,
        showResults: true,
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: 'A collaborative space for students to study together, share resources, and help each other succeed.',
  suggestedTags: ['study-group', 'academic', 'collaboration'],
};

export const RESEARCH_LAB_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'For research groups, thesis collaborations, and academic projects',
    category: 'academic',
    icon: '🔬',
    suggestedFor: ['university_org', 'academic'],
    difficulty: 'standard',
    estimatedSetupTime: '5 minutes',
    tags: ['research', 'lab', 'academic', 'graduate'],
  },
  tabs: [
    {
      name: 'Updates',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '📢',
      description: 'Research updates and announcements',
    },
    {
      name: 'Papers',
      type: 'resource',
      isDefault: false,
      order: 1,
      icon: '📄',
      description: 'Shared papers, drafts, and publications',
    },
    {
      name: 'Meetings',
      type: 'widget',
      isDefault: false,
      order: 2,
      icon: '🗓️',
      description: 'Lab meetings and presentations',
    },
    {
      name: 'Data',
      type: 'resource',
      isDefault: false,
      order: 3,
      icon: '📊',
      description: 'Datasets, results, and analysis',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Lab Meetings',
      config: {
        showUpcoming: true,
        maxItems: 10,
        recurringEvents: true,
      },
      order: 0,
      tabName: 'Meetings',
    },
    {
      type: 'links',
      title: 'Important Links',
      config: {
        categories: ['Publications', 'Funding', 'Resources'],
      },
      order: 1,
    },
    {
      type: 'files',
      title: 'Recent Papers',
      config: {
        allowedTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 50, // MB
      },
      order: 2,
      tabName: 'Papers',
    },
  ],
  settings: {
    joinPolicy: 'approval',
    visibility: 'public',
    allowInvites: true,
    requireApproval: true,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: 'Research group space for sharing papers, coordinating meetings, and collaborative research.',
  suggestedTags: ['research', 'lab', 'academic', 'graduate'],
};

// ═════════════════════════════════════════════════════════════════
// SOCIAL TEMPLATES
// ═════════════════════════════════════════════════════════════════

export const STUDENT_CLUB_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'student-club',
    name: 'Student Club',
    description: 'Full-featured template for student organizations and clubs',
    category: 'social',
    icon: '🎯',
    suggestedFor: ['student_org', 'club'],
    difficulty: 'standard',
    estimatedSetupTime: '5 minutes',
    tags: ['club', 'organization', 'community', 'events'],
  },
  tabs: [
    {
      name: 'Feed',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '📰',
      description: 'Announcements and discussions',
    },
    {
      name: 'Events',
      type: 'widget',
      isDefault: false,
      order: 1,
      icon: '🎉',
      description: 'Club events and meetings',
    },
    {
      name: 'Resources',
      type: 'resource',
      isDefault: false,
      order: 2,
      icon: '📁',
      description: 'Club documents and materials',
    },
    {
      name: 'About',
      type: 'custom',
      isDefault: false,
      order: 3,
      icon: 'ℹ️',
      description: 'Club info and leadership',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Upcoming Events',
      config: {
        showUpcoming: true,
        maxItems: 8,
        allowMemberEvents: false,
        showRSVP: true,
      },
      order: 0,
      tabName: 'Events',
    },
    {
      type: 'poll',
      title: 'Member Polls',
      config: {
        allowAnonymous: false,
        showResults: true,
        multipleChoice: true,
      },
      order: 1,
    },
    {
      type: 'links',
      title: 'Quick Links',
      config: {
        categories: ['Social Media', 'Sign-ups', 'Resources'],
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: true,
    postApprovalRequired: false,
    eventApprovalRequired: false,
  },
  suggestedDescription: 'Welcome to our club! Join us for events, discussions, and community.',
  suggestedTags: ['club', 'community', 'events'],
};

export const DORM_COMMUNITY_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'dorm-community',
    name: 'Dorm Community',
    description: 'For residence halls and housing communities',
    category: 'community',
    icon: '🏠',
    suggestedFor: ['residential', 'dorm'],
    difficulty: 'starter',
    estimatedSetupTime: '3 minutes',
    tags: ['housing', 'dorm', 'residential', 'community'],
  },
  tabs: [
    {
      name: 'Board',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '📋',
      description: 'Community board and discussions',
    },
    {
      name: 'Events',
      type: 'widget',
      isDefault: false,
      order: 1,
      icon: '🎊',
      description: 'Floor events and activities',
    },
    {
      name: 'Marketplace',
      type: 'custom',
      isDefault: false,
      order: 2,
      icon: '🛒',
      description: 'Buy, sell, trade with neighbors',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Dorm Events',
      config: {
        showUpcoming: true,
        maxItems: 6,
        allowMemberEvents: true,
      },
      order: 0,
      tabName: 'Events',
    },
    {
      type: 'poll',
      title: 'Quick Vote',
      config: {
        allowAnonymous: true,
        showResults: true,
      },
      order: 1,
    },
    {
      type: 'links',
      title: 'Important Info',
      config: {
        placeholder: 'Add laundry schedules, quiet hours, etc.',
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: 'Connect with your neighbors! Share updates, plan events, and build community.',
  suggestedTags: ['dorm', 'residential', 'community', 'neighbors'],
};

export const GREEK_LIFE_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'greek-life',
    name: 'Greek Life Chapter',
    description: 'For fraternities and sororities',
    category: 'social',
    icon: '🏛️',
    suggestedFor: ['greek_life', 'social'],
    difficulty: 'advanced',
    estimatedSetupTime: '10 minutes',
    tags: ['greek', 'fraternity', 'sorority', 'chapter'],
  },
  tabs: [
    {
      name: 'Chapter',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '🏠',
      description: 'Chapter announcements',
    },
    {
      name: 'Events',
      type: 'widget',
      isDefault: false,
      order: 1,
      icon: '📅',
      description: 'Chapter events and socials',
    },
    {
      name: 'Philanthropy',
      type: 'custom',
      isDefault: false,
      order: 2,
      icon: '❤️',
      description: 'Service and philanthropy',
    },
    {
      name: 'Brotherhood/Sisterhood',
      type: 'feed',
      isDefault: false,
      order: 3,
      icon: '🤝',
      description: 'Member bonding and discussions',
    },
    {
      name: 'Resources',
      type: 'resource',
      isDefault: false,
      order: 4,
      icon: '📁',
      description: 'Chapter documents',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Chapter Calendar',
      config: {
        showUpcoming: true,
        maxItems: 10,
        categories: ['Meetings', 'Socials', 'Philanthropy', 'Rush'],
      },
      order: 0,
      tabName: 'Events',
    },
    {
      type: 'links',
      title: 'Chapter Links',
      config: {
        categories: ['National', 'Dues', 'Forms'],
      },
      order: 1,
    },
    {
      type: 'poll',
      title: 'Chapter Vote',
      config: {
        allowAnonymous: false,
        showResults: false, // Secret ballot
        requireAuth: true,
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'invite_only',
    visibility: 'private',
    allowInvites: false,
    requireApproval: true,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: 'Official chapter space for members.',
  suggestedTags: ['greek-life', 'chapter', 'members-only'],
};

// ═════════════════════════════════════════════════════════════════
// PROFESSIONAL TEMPLATES
// ═════════════════════════════════════════════════════════════════

export const CAREER_NETWORK_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'career-network',
    name: 'Career Network',
    description: 'For career development, job hunting, and professional networking',
    category: 'professional',
    icon: '💼',
    suggestedFor: ['student_org', 'professional'],
    difficulty: 'standard',
    estimatedSetupTime: '5 minutes',
    tags: ['career', 'jobs', 'networking', 'professional'],
  },
  tabs: [
    {
      name: 'Opportunities',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '💼',
      description: 'Job postings and opportunities',
    },
    {
      name: 'Events',
      type: 'widget',
      isDefault: false,
      order: 1,
      icon: '📅',
      description: 'Career fairs and networking events',
    },
    {
      name: 'Resources',
      type: 'resource',
      isDefault: false,
      order: 2,
      icon: '📄',
      description: 'Resume templates, interview tips',
    },
    {
      name: 'Discussions',
      type: 'feed',
      isDefault: false,
      order: 3,
      icon: '💬',
      description: 'Career advice and discussions',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Career Events',
      config: {
        showUpcoming: true,
        maxItems: 8,
        categories: ['Career Fairs', 'Info Sessions', 'Workshops'],
      },
      order: 0,
      tabName: 'Events',
    },
    {
      type: 'links',
      title: 'Quick Links',
      config: {
        categories: ['Job Boards', 'Career Services', 'Resources'],
      },
      order: 1,
    },
    {
      type: 'rss',
      title: 'Industry News',
      config: {
        maxItems: 5,
        showImages: true,
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: true,
    postApprovalRequired: false,
  },
  suggestedDescription: 'Your career development hub. Find opportunities, network, and advance your career.',
  suggestedTags: ['career', 'jobs', 'networking', 'professional-development'],
};

// ═════════════════════════════════════════════════════════════════
// EVENT TEMPLATES
// ═════════════════════════════════════════════════════════════════

export const EVENT_SERIES_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'event-series',
    name: 'Event Series',
    description: 'For recurring events, speaker series, or workshop programs',
    category: 'events',
    icon: '🎪',
    suggestedFor: ['student_org', 'university_org', 'events'],
    difficulty: 'standard',
    estimatedSetupTime: '5 minutes',
    tags: ['events', 'series', 'speakers', 'workshops'],
  },
  tabs: [
    {
      name: 'Schedule',
      type: 'widget',
      isDefault: true,
      order: 0,
      icon: '📅',
      description: 'Full event schedule',
    },
    {
      name: 'Past Events',
      type: 'feed',
      isDefault: false,
      order: 1,
      icon: '📸',
      description: 'Recaps and recordings',
    },
    {
      name: 'Speakers',
      type: 'custom',
      isDefault: false,
      order: 2,
      icon: '🎤',
      description: 'Speaker profiles and bios',
    },
    {
      name: 'Discussion',
      type: 'feed',
      isDefault: false,
      order: 3,
      icon: '💬',
      description: 'Event discussions',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Upcoming Events',
      config: {
        showUpcoming: true,
        maxItems: 12,
        showRSVP: true,
        showCapacity: true,
      },
      order: 0,
      tabName: 'Schedule',
    },
    {
      type: 'links',
      title: 'Event Links',
      config: {
        categories: ['Registration', 'Recordings', 'Materials'],
      },
      order: 1,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: true,
    postApprovalRequired: false,
    eventApprovalRequired: true,
  },
  suggestedDescription: 'Join us for our event series! Check the schedule and RSVP.',
  suggestedTags: ['events', 'series', 'speakers'],
};

export const HACKATHON_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'For hackathons, coding competitions, and build events',
    category: 'events',
    icon: '💻',
    suggestedFor: ['student_org', 'events', 'academic'],
    difficulty: 'advanced',
    estimatedSetupTime: '10 minutes',
    tags: ['hackathon', 'coding', 'competition', 'build'],
  },
  tabs: [
    {
      name: 'Announcements',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '📢',
      description: 'Updates and announcements',
    },
    {
      name: 'Schedule',
      type: 'widget',
      isDefault: false,
      order: 1,
      icon: '⏰',
      description: 'Event timeline',
    },
    {
      name: 'Teams',
      type: 'feed',
      isDefault: false,
      order: 2,
      icon: '👥',
      description: 'Find or form teams',
    },
    {
      name: 'Submissions',
      type: 'resource',
      isDefault: false,
      order: 3,
      icon: '🚀',
      description: 'Project submissions',
    },
    {
      name: 'Resources',
      type: 'resource',
      isDefault: false,
      order: 4,
      icon: '🔧',
      description: 'APIs, tools, and resources',
    },
    {
      name: 'Help',
      type: 'feed',
      isDefault: false,
      order: 5,
      icon: '❓',
      description: 'Get help from mentors',
    },
  ],
  widgets: [
    {
      type: 'calendar',
      title: 'Hackathon Schedule',
      config: {
        showUpcoming: true,
        maxItems: 20,
        showTime: true,
        categories: ['Workshops', 'Meals', 'Judging', 'Ceremony'],
      },
      order: 0,
      tabName: 'Schedule',
    },
    {
      type: 'links',
      title: 'Important Links',
      config: {
        categories: ['Registration', 'Devpost', 'Sponsors', 'Discord'],
      },
      order: 1,
    },
    {
      type: 'poll',
      title: 'Quick Poll',
      config: {
        allowAnonymous: true,
        showResults: true,
      },
      order: 2,
    },
  ],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: 'Welcome hackers! Build something amazing with us.',
  suggestedTags: ['hackathon', 'coding', 'competition', 'build'],
};

// ═════════════════════════════════════════════════════════════════
// MINIMAL TEMPLATES
// ═════════════════════════════════════════════════════════════════

export const MINIMAL_TEMPLATE: SpaceTemplate = {
  metadata: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean slate with just the essentials - build your space your way',
    category: 'community',
    icon: '✨',
    suggestedFor: ['student_org', 'social'],
    difficulty: 'starter',
    estimatedSetupTime: '1 minute',
    tags: ['minimal', 'simple', 'blank'],
  },
  tabs: [
    {
      name: 'Home',
      type: 'feed',
      isDefault: true,
      order: 0,
      icon: '🏠',
      description: 'Main feed',
    },
  ],
  widgets: [],
  settings: {
    joinPolicy: 'open',
    visibility: 'public',
    allowInvites: true,
    requireApproval: false,
    allowRSS: false,
    postApprovalRequired: false,
  },
  suggestedDescription: '',
  suggestedTags: [],
};

// ═════════════════════════════════════════════════════════════════
// TEMPLATE REGISTRY
// ═════════════════════════════════════════════════════════════════

export const SPACE_TEMPLATES = {
  // Academic
  STUDY_GROUP: STUDY_GROUP_TEMPLATE,
  RESEARCH_LAB: RESEARCH_LAB_TEMPLATE,

  // Social
  STUDENT_CLUB: STUDENT_CLUB_TEMPLATE,
  DORM_COMMUNITY: DORM_COMMUNITY_TEMPLATE,
  GREEK_LIFE: GREEK_LIFE_TEMPLATE,

  // Professional
  CAREER_NETWORK: CAREER_NETWORK_TEMPLATE,

  // Events
  EVENT_SERIES: EVENT_SERIES_TEMPLATE,
  HACKATHON: HACKATHON_TEMPLATE,

  // Minimal
  MINIMAL: MINIMAL_TEMPLATE,
} as const;

export type SpaceTemplateId = keyof typeof SPACE_TEMPLATES;

/**
 * Get all available templates
 */
export function getAllTemplates(): SpaceTemplate[] {
  return Object.values(SPACE_TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SpaceTemplate | undefined {
  const upperId = id.toUpperCase().replace(/-/g, '_');
  return SPACE_TEMPLATES[upperId as SpaceTemplateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: SpaceTemplateCategory): SpaceTemplate[] {
  return Object.values(SPACE_TEMPLATES).filter(
    (template) => template.metadata.category === category
  );
}

/**
 * Get templates suggested for a specific space type
 */
export function getTemplatesSuggestedFor(spaceType: string): SpaceTemplate[] {
  return Object.values(SPACE_TEMPLATES).filter(
    (template) => template.metadata.suggestedFor.includes(spaceType)
  );
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(
  difficulty: 'starter' | 'standard' | 'advanced'
): SpaceTemplate[] {
  return Object.values(SPACE_TEMPLATES).filter(
    (template) => template.metadata.difficulty === difficulty
  );
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): SpaceTemplate[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(SPACE_TEMPLATES).filter((template) => {
    const { name, description, tags } = template.metadata;
    return (
      name.toLowerCase().includes(lowerQuery) ||
      description.toLowerCase().includes(lowerQuery) ||
      tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  });
}
