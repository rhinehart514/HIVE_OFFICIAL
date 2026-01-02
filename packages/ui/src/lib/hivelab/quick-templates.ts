/**
 * Quick Templates - Pre-built tool compositions for one-click deployment
 *
 * These templates allow space leaders to quickly deploy common tools
 * without going through the full HiveLab creation flow.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import type { ToolComposition } from './element-system';

export interface QuickTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Icon name from Lucide */
  icon: 'bar-chart-2' | 'timer' | 'link-2' | 'users' | 'calendar' | 'message-square' | 'file-text' | 'sparkles' | 'clipboard-list' | 'target' | 'trending-up' | 'wallet';
  /** Category for grouping */
  category: 'engagement' | 'organization' | 'communication';
  /** The pre-built composition */
  composition: ToolComposition;
  /** Default sidebar placement config */
  defaultConfig: {
    placement: 'sidebar' | 'inline';
    collapsed: boolean;
  };
}

// Generate unique IDs for elements
const generateId = () => `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Quick Poll Template
 * Interactive poll for gathering member opinions
 */
export const QUICK_POLL_TEMPLATE: QuickTemplate = {
  id: 'quick-poll',
  name: 'Quick Poll',
  description: 'Gather member opinions with a simple poll',
  icon: 'bar-chart-2',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Quick Poll',
    description: 'A simple poll to gather opinions',
    elements: [
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'What do you think?',
          options: ['Option A', 'Option B', 'Option C'],
          allowMultiple: false,
          showResults: true,
          anonymous: false,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Event Countdown Template
 * Timer counting down to an upcoming event
 */
export const EVENT_COUNTDOWN_TEMPLATE: QuickTemplate = {
  id: 'event-countdown',
  name: 'Event Countdown',
  description: 'Count down to your next big event',
  icon: 'timer',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Event Countdown',
    description: 'Countdown timer to upcoming event',
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: generateId(),
        config: {
          title: 'Next Event',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          style: 'compact',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 150 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Quick Links Template
 * Curated list of important links and resources
 */
export const QUICK_LINKS_TEMPLATE: QuickTemplate = {
  id: 'quick-links',
  name: 'Quick Links',
  description: 'Important links and resources for members',
  icon: 'link-2',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Quick Links',
    description: 'Collection of important links',
    elements: [
      {
        elementId: 'result-list',
        instanceId: generateId(),
        config: {
          title: 'Resources',
          items: [
            { label: 'Our Website', url: '#', icon: 'globe' },
            { label: 'Discord', url: '#', icon: 'message-circle' },
            { label: 'Meeting Notes', url: '#', icon: 'file-text' },
          ],
          layout: 'list',
          showIcons: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Study Group Signup Template
 * Form for collecting study group signups
 */
export const STUDY_GROUP_TEMPLATE: QuickTemplate = {
  id: 'study-group-signup',
  name: 'Study Group Signup',
  description: 'Collect signups for study sessions',
  icon: 'users',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Study Group Signup',
    description: 'Sign up for study sessions',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'course', label: 'Course', type: 'text', required: true },
            { name: 'availability', label: 'Best Times', type: 'text', required: false },
          ],
          validateOnChange: true,
          showProgress: false,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 280 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Announcements Template
 * Pinned announcements for the space
 */
export const ANNOUNCEMENTS_TEMPLATE: QuickTemplate = {
  id: 'announcements',
  name: 'Announcements',
  description: 'Important announcements for members',
  icon: 'message-square',
  category: 'communication',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Announcements',
    description: 'Space announcements',
    elements: [
      {
        elementId: 'announcement',
        instanceId: generateId(),
        config: {
          title: 'Announcements',
          items: [
            {
              title: 'Welcome!',
              content: 'Welcome to our space. Check out the upcoming events!',
              date: new Date().toISOString(),
              priority: 'normal',
            },
          ],
          maxItems: 5,
          showDates: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Meeting Notes Template
 * Shared document for meeting notes
 */
export const MEETING_NOTES_TEMPLATE: QuickTemplate = {
  id: 'meeting-notes',
  name: 'Meeting Notes',
  description: 'Collaborative meeting notes',
  icon: 'file-text',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: true,
  },
  composition: {
    id: generateId(),
    name: 'Meeting Notes',
    description: 'Shared meeting notes',
    elements: [
      {
        elementId: 'markdown-element',
        instanceId: generateId(),
        config: {
          title: 'Meeting Notes',
          content: '# Meeting Notes\n\n## Agenda\n- Item 1\n- Item 2\n\n## Action Items\n- [ ] Task 1\n- [ ] Task 2',
          editable: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 300 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Office Hours Signup Template
 * Time slot booking for office hours, mentoring, or 1:1s
 */
export const OFFICE_HOURS_TEMPLATE: QuickTemplate = {
  id: 'office-hours',
  name: 'Office Hours',
  description: 'Let members book time slots for 1:1s or office hours',
  icon: 'calendar',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Office Hours',
    description: 'Book time slots for office hours',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'text', required: true },
            {
              name: 'time_slot',
              label: 'Preferred Time',
              type: 'select',
              required: true,
              options: ['Monday 2-3 PM', 'Tuesday 10-11 AM', 'Wednesday 3-4 PM', 'Thursday 1-2 PM', 'Friday 11 AM-12 PM'],
            },
            { name: 'topic', label: 'What would you like to discuss?', type: 'text', required: true },
          ],
          validateOnChange: true,
          showProgress: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 320 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Member Leaderboard Template
 * Track and display top contributors or participants
 */
export const LEADERBOARD_TEMPLATE: QuickTemplate = {
  id: 'member-leaderboard',
  name: 'Leaderboard',
  description: 'Show top contributors and active members',
  icon: 'sparkles',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Member Leaderboard',
    description: 'Track top contributors',
    elements: [
      {
        elementId: 'leaderboard',
        instanceId: generateId(),
        config: {
          title: 'Top Contributors',
          metric: 'points',
          period: 'week',
          maxEntries: 5,
          showAvatars: true,
          showChange: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 250 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Event RSVP Widget Template
 * Quick RSVP buttons for space events
 */
export const EVENT_RSVP_TEMPLATE: QuickTemplate = {
  id: 'event-rsvp',
  name: 'Event RSVP',
  description: 'Quick RSVP for upcoming events',
  icon: 'calendar',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Event RSVP',
    description: 'RSVP to upcoming events',
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: generateId(),
        config: {
          eventTitle: 'Upcoming Event',
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          eventLocation: 'TBD',
          maxAttendees: 50,
          showAttendeeCount: true,
          allowMaybe: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 180 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Member Spotlight Template
 * Highlight active or featured members
 */
export const MEMBER_SPOTLIGHT_TEMPLATE: QuickTemplate = {
  id: 'member-spotlight',
  name: 'Member Spotlight',
  description: 'Highlight featured members of the week',
  icon: 'users',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Member Spotlight',
    description: 'Featured member highlight',
    elements: [
      {
        elementId: 'member-list',
        instanceId: generateId(),
        config: {
          title: 'Member of the Week',
          displayMode: 'spotlight',
          maxMembers: 1,
          showBio: true,
          showRole: true,
          highlightStyle: 'featured',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Anonymous Q&A Template
 * Let members ask questions anonymously
 */
export const ANONYMOUS_QA_TEMPLATE: QuickTemplate = {
  id: 'anonymous-qa',
  name: 'Anonymous Q&A',
  description: 'Let members ask questions anonymously',
  icon: 'message-square',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Anonymous Q&A',
    description: 'Anonymous question submission',
    elements: [
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Ask a question (anonymous)',
          options: [],
          allowMultiple: false,
          showResults: false,
          anonymous: true,
          freeformEnabled: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 180 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Event Check-In Template
 * Quick attendance tracking for events
 */
export const EVENT_CHECKIN_TEMPLATE: QuickTemplate = {
  id: 'event-checkin',
  name: 'Event Check-In',
  description: 'Track attendance at your events',
  icon: 'users',
  category: 'organization',
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Event Check-In',
    description: 'Attendance tracking',
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: generateId(),
        config: {
          eventTitle: 'Check In',
          eventDate: new Date().toISOString(),
          eventLocation: 'Current Event',
          maxAttendees: 500,
          showAttendeeCount: true,
          allowMaybe: false,
          checkInMode: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 150 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Space Stats Dashboard Template
 * Show engagement and activity stats
 */
export const SPACE_STATS_TEMPLATE: QuickTemplate = {
  id: 'space-stats-dashboard',
  name: 'Stats Dashboard',
  description: 'Display engagement and activity metrics',
  icon: 'bar-chart-2',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Space Stats',
    description: 'Engagement metrics dashboard',
    elements: [
      {
        elementId: 'space-stats',
        instanceId: generateId(),
        config: {
          showMembers: true,
          showMessages: true,
          showEvents: true,
          period: 'week',
          style: 'compact',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Upcoming Events Widget Template
 * Display space events in sidebar
 */
export const UPCOMING_EVENTS_TEMPLATE: QuickTemplate = {
  id: 'upcoming-events',
  name: 'Upcoming Events',
  description: 'Show upcoming events in sidebar',
  icon: 'calendar',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Upcoming Events',
    description: 'Events widget',
    elements: [
      {
        elementId: 'space-events',
        instanceId: generateId(),
        config: {
          maxEvents: 3,
          showDescription: true,
          showRSVP: true,
          filterPast: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 280 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Feedback Form Template
 * Simple feedback collection for events or initiatives
 */
export const FEEDBACK_FORM_TEMPLATE: QuickTemplate = {
  id: 'feedback-form',
  name: 'Feedback Form',
  description: 'Collect feedback from members',
  icon: 'clipboard-list',
  category: 'communication',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Feedback Form',
    description: 'Collect member feedback',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'rating', label: 'Overall Rating (1-5)', type: 'number', required: true },
            { name: 'liked', label: 'What did you enjoy most?', type: 'text', required: false },
            { name: 'improve', label: 'What could be improved?', type: 'text', required: false },
            { name: 'suggestions', label: 'Any suggestions?', type: 'text', required: false },
          ],
          validateOnChange: true,
          showProgress: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 350 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Decision Maker Template
 * Quick binary decision voting
 */
export const DECISION_MAKER_TEMPLATE: QuickTemplate = {
  id: 'decision-maker',
  name: 'Decision Maker',
  description: 'Quick yes/no decisions for the group',
  icon: 'target',
  category: 'engagement',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Decision Maker',
    description: 'Group decision voting',
    elements: [
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Should we do this?',
          options: ['Yes, let\'s do it!', 'No, not right now', 'Need more info'],
          allowMultiple: false,
          showResults: true,
          anonymous: false,
          closingDate: null,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Progress Tracker Template
 * Track project or goal progress
 */
export const PROGRESS_TRACKER_TEMPLATE: QuickTemplate = {
  id: 'progress-tracker',
  name: 'Progress Tracker',
  description: 'Track project or goal completion',
  icon: 'trending-up',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Progress Tracker',
    description: 'Track goal progress',
    elements: [
      {
        elementId: 'progress-indicator',
        instanceId: generateId(),
        config: {
          title: 'Project Progress',
          target: 100,
          current: 0,
          unit: '%',
          showMilestones: true,
          milestones: [
            { value: 25, label: 'Planning Complete' },
            { value: 50, label: 'Halfway There' },
            { value: 75, label: 'Almost Done' },
            { value: 100, label: 'Complete!' },
          ],
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 180 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Meeting Agenda Template
 * Structured meeting agenda with time slots
 */
export const MEETING_AGENDA_TEMPLATE: QuickTemplate = {
  id: 'meeting-agenda',
  name: 'Meeting Agenda',
  description: 'Structured agenda for meetings',
  icon: 'clipboard-list',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Meeting Agenda',
    description: 'Meeting agenda with time slots',
    elements: [
      {
        elementId: 'markdown-element',
        instanceId: generateId(),
        config: {
          title: 'Meeting Agenda',
          content: '## Today\'s Agenda\n\n**5 min** - Welcome & Updates\n\n**15 min** - Main Topic Discussion\n\n**10 min** - Action Items Review\n\n**5 min** - Q&A & Wrap-up\n\n---\n\n### Notes\n_Add notes here during the meeting_',
          editable: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 320 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Budget Overview Template
 * Simple budget tracking widget
 */
export const BUDGET_OVERVIEW_TEMPLATE: QuickTemplate = {
  id: 'budget-overview',
  name: 'Budget Overview',
  description: 'Track your organization\'s budget',
  icon: 'wallet',
  category: 'organization',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Budget Overview',
    description: 'Budget tracking',
    elements: [
      {
        elementId: 'progress-indicator',
        instanceId: generateId(),
        config: {
          title: 'Budget Used',
          target: 1000,
          current: 0,
          unit: '$',
          showMilestones: true,
          milestones: [
            { value: 250, label: '25%' },
            { value: 500, label: '50%' },
            { value: 750, label: '75%' },
          ],
          warningThreshold: 80,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 160 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Weekly Update Template
 * Regular update bulletin for members
 */
export const WEEKLY_UPDATE_TEMPLATE: QuickTemplate = {
  id: 'weekly-update',
  name: 'Weekly Update',
  description: 'Regular update bulletin for members',
  icon: 'file-text',
  category: 'communication',
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  composition: {
    id: generateId(),
    name: 'Weekly Update',
    description: 'Weekly bulletin',
    elements: [
      {
        elementId: 'markdown-element',
        instanceId: generateId(),
        config: {
          title: 'This Week\'s Update',
          content: '## Weekly Update\n\n### Highlights\n- Achievement or news item\n- Another highlight\n\n### Upcoming\n- Event or deadline\n- Another item\n\n### Reminders\n- Important reminder\n\n---\n_Last updated: This week_',
          editable: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 300 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * All quick templates
 */
export const QUICK_TEMPLATES: QuickTemplate[] = [
  QUICK_POLL_TEMPLATE,
  EVENT_COUNTDOWN_TEMPLATE,
  QUICK_LINKS_TEMPLATE,
  STUDY_GROUP_TEMPLATE,
  ANNOUNCEMENTS_TEMPLATE,
  MEETING_NOTES_TEMPLATE,
  OFFICE_HOURS_TEMPLATE,
  LEADERBOARD_TEMPLATE,
  EVENT_RSVP_TEMPLATE,
  MEMBER_SPOTLIGHT_TEMPLATE,
  ANONYMOUS_QA_TEMPLATE,
  EVENT_CHECKIN_TEMPLATE,
  SPACE_STATS_TEMPLATE,
  UPCOMING_EVENTS_TEMPLATE,
  FEEDBACK_FORM_TEMPLATE,
  DECISION_MAKER_TEMPLATE,
  PROGRESS_TRACKER_TEMPLATE,
  MEETING_AGENDA_TEMPLATE,
  BUDGET_OVERVIEW_TEMPLATE,
  WEEKLY_UPDATE_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getQuickTemplate(id: string): QuickTemplate | undefined {
  return QUICK_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: QuickTemplate['category']): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.category === category);
}

/**
 * Create a deployable tool from a template
 * Generates fresh IDs to avoid conflicts
 */
export function createToolFromTemplate(template: QuickTemplate): ToolComposition {
  const toolId = generateId();
  return {
    ...template.composition,
    id: toolId,
    elements: template.composition.elements.map(el => ({
      ...el,
      instanceId: generateId(),
    })),
  };
}
