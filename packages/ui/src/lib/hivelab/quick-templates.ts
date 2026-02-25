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

/** Configuration field for template setup */
export interface TemplateConfigField {
  /** Field key matching element config property */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: 'text' | 'textarea' | 'date' | 'number' | 'options';
  /** Whether field is required */
  required: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** For 'options' type: available choices */
  options?: string[];
  /** Default value */
  defaultValue?: string | number;
}

/** Template complexity level */
export type TemplateComplexity = 'simple' | 'app';

/** Template categories - use-case based for GTM */
export type TemplateCategory =
  | 'apps'          // Featured multi-element apps (4+ elements)
  | 'events'        // RSVP, check-in, countdowns, photo capture
  | 'engagement'    // Polls, leaderboards, challenges, voting
  | 'resources'     // Lending, scheduling, directories, booking
  | 'feedback'      // Surveys, suggestions, Q&A, forms
  | 'teams';        // Matching, attendance, coordination, announcements

/** Template readiness status */
export type TemplateStatus = 'ready' | 'coming-soon' | 'hidden';

/** Space types for template curation */
export type SpaceType = 'student_org' | 'uni_org' | 'residential' | 'greek';

export interface QuickTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Icon name from Lucide */
  icon: 'bar-chart-2' | 'timer' | 'link-2' | 'users' | 'calendar' | 'message-square' | 'file-text' | 'sparkles' | 'clipboard-list' | 'target' | 'trending-up' | 'wallet' | 'camera' | 'trophy' | 'inbox' | 'grid' | 'shopping-bag' | 'git-merge' | 'table';
  /** Category for grouping */
  category: TemplateCategory;
  /** Complexity level - 'simple' (1-2 elements) or 'app' (4+ elements) */
  complexity: TemplateComplexity;
  /** The pre-built composition */
  composition: ToolComposition;
  /** Default sidebar placement config */
  defaultConfig: {
    placement: 'sidebar' | 'inline';
    collapsed: boolean;
  };
  /** P0: Config fields for setup step (optional - if absent, deploys instantly) */
  setupFields?: TemplateConfigField[];
  /** Template status - 'ready' (all elements work), 'coming-soon' (has stub elements), 'hidden' (missing APIs) */
  status?: TemplateStatus;
  /** List of element IDs that are incomplete/stub - shown as warning to user */
  incompleteElements?: string[];
  /** Quick deploy: skip the builder, deploy via lightweight modal with setupFields */
  quickDeploy?: boolean;
  /** Quick deploy config fields (overrides setupFields for the quick deploy modal) */
  quickDeployFields?: TemplateConfigField[];
  /** Space types this template is relevant for — used for curation */
  spaceTypes?: SpaceType[];
  /** Interest category IDs this template is relevant for */
  interestCategories?: string[];
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
  complexity: 'simple',
  interestCategories: ['social_energy', 'campus_events'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    { key: 'question', label: 'Poll Question', type: 'text', required: true, placeholder: 'What do you think about...?' },
    { key: 'options', label: 'Options (comma-separated)', type: 'text', required: true, placeholder: 'Option A, Option B, Option C', defaultValue: 'Yes, No, Maybe' },
  ],
  quickDeployFields: [
    { key: 'question', label: 'Poll Question', type: 'text', required: true, placeholder: 'What do you think about...?' },
    { key: 'options', label: 'Options (comma-separated)', type: 'text', required: true, placeholder: 'Option A, Option B, Option C', defaultValue: 'Yes, No, Maybe' },
  ],
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
          showResultsBeforeVoting: true,
          allowChangeVote: false,
          anonymousVoting: false,
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
  category: 'events',
  complexity: 'simple',
  interestCategories: ['campus_events'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Event Name', type: 'text', required: true, placeholder: 'Spring Social' },
    { key: 'targetDate', label: 'Event Date', type: 'date', required: true },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Event Name', type: 'text', required: true, placeholder: 'Spring Social' },
    { key: 'targetDate', label: 'Event Date', type: 'date', required: true },
  ],
  composition: {
    id: generateId(),
    name: 'Event Countdown',
    description: 'Countdown timer to upcoming event',
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: generateId(),
        config: {
          label: 'Next Event',
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          showDays: true,
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
  category: 'resources',
  complexity: 'simple',
  interestCategories: ['academic_identity', 'builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
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
          itemsPerPage: 10,
          showPagination: false,
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['academic_identity', 'study_style'],
  spaceTypes: ['student_org', 'uni_org'],
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
          submitLabel: 'Sign Up',
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['campus_events'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
  quickDeployFields: [
    { key: 'title', label: 'Announcement Title', type: 'text', required: true, placeholder: 'Important Update' },
    { key: 'content', label: 'Message', type: 'textarea', required: true, placeholder: 'Write your announcement...' },
  ],
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
          pinned: false,
          sendNotification: true,
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle', 'academic_identity'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
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
        elementId: 'checklist-tracker',
        instanceId: generateId(),
        config: {
          title: 'Meeting Notes',
          items: [
            { id: 'agenda-1', title: 'Agenda Item 1' },
            { id: 'agenda-2', title: 'Agenda Item 2' },
            { id: 'action-1', title: 'Action: Follow up on decisions' },
            { id: 'action-2', title: 'Action: Share notes with team' },
          ],
          allowMemberAdd: true,
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
  category: 'resources',
  complexity: 'simple',
  interestCategories: ['academic_identity', 'study_style'],
  spaceTypes: ['student_org', 'uni_org'],
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
            { name: 'email', label: 'Email', type: 'email', required: true },
            {
              name: 'time_slot',
              label: 'Preferred Time',
              type: 'select',
              required: true,
              options: [
                { value: 'mon-2-3', label: 'Monday 2-3 PM' },
                { value: 'tue-10-11', label: 'Tuesday 10-11 AM' },
                { value: 'wed-3-4', label: 'Wednesday 3-4 PM' },
                { value: 'thu-1-2', label: 'Thursday 1-2 PM' },
                { value: 'fri-11-12', label: 'Friday 11 AM-12 PM' },
              ],
            },
            { name: 'topic', label: 'What would you like to discuss?', type: 'text', required: true },
          ],
          submitLabel: 'Book Time Slot',
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
  complexity: 'simple',
  interestCategories: ['gaming_and_game_night', 'social_energy'],
  spaceTypes: ['student_org', 'greek'],
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
          maxEntries: 5,
          scoreLabel: 'pts',
          highlightTop: 3,
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
  category: 'events',
  complexity: 'simple',
  interestCategories: ['campus_events', 'social_energy'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
  quickDeployFields: [
    { key: 'eventName', label: 'Event Name', type: 'text', required: true, placeholder: 'Weekly Meeting' },
    { key: 'eventDate', label: 'When', type: 'date', required: true },
  ],
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
          eventName: 'Upcoming Event',
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          maxAttendees: 50,
          showCount: true,
          allowWaitlist: true,
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
  complexity: 'simple',
  interestCategories: ['social_energy', 'identity_background'],
  spaceTypes: ['student_org', 'greek', 'residential'],
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
          maxMembers: 1,
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
  category: 'feedback',
  complexity: 'simple',
  interestCategories: ['social_energy', 'campus_events'],
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
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
          showResultsBeforeVoting: false,
          allowChangeVote: false,
          anonymousVoting: true,
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
  category: 'events',
  complexity: 'simple',
  interestCategories: ['campus_events'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
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
          eventName: 'Check In',
          eventDate: new Date().toISOString(),
          maxAttendees: 500,
          showCount: true,
          allowWaitlist: false,
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
  complexity: 'simple',
  interestCategories: ['builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
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
          metrics: ['members', 'posts', 'events'],
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
  category: 'events',
  complexity: 'simple',
  interestCategories: ['campus_events'],
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
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
const feedbackFormId = generateId();
const feedbackResultId = generateId();

export const FEEDBACK_FORM_TEMPLATE: QuickTemplate = {
  id: 'feedback-form',
  name: 'Feedback Form',
  description: 'Collect feedback from members',
  icon: 'clipboard-list',
  category: 'feedback',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
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
        instanceId: feedbackFormId,
        config: {
          fields: [
            { name: 'rating', label: 'Overall Rating (1-5)', type: 'number', required: true },
            { name: 'liked', label: 'What did you enjoy most?', type: 'text', required: false },
            { name: 'improve', label: 'What could be improved?', type: 'text', required: false },
            { name: 'suggestions', label: 'Any suggestions?', type: 'text', required: false },
          ],
          submitLabel: 'Submit Feedback',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 350 },
      },
      {
        elementId: 'result-list',
        instanceId: feedbackResultId,
        config: {
          itemsPerPage: 10,
          showPagination: false,
        },
        position: { x: 0, y: 380 },
        size: { width: 300, height: 300 },
      },
    ],
    connections: [
      {
        from: { instanceId: feedbackFormId, output: 'submittedData' },
        to: { instanceId: feedbackResultId, input: 'items' },
      },
    ],
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
  complexity: 'simple',
  interestCategories: ['social_energy', 'food_behaviors'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    { key: 'question', label: 'Decision Question', type: 'text', required: true, placeholder: 'Should we host a social event next week?' },
  ],
  quickDeployFields: [
    { key: 'question', label: 'Decision Question', type: 'text', required: true, placeholder: 'Should we host a social event next week?' },
  ],
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
          showResultsBeforeVoting: true,
          allowChangeVote: false,
          anonymousVoting: false,
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle', 'health_wellness'],
  spaceTypes: ['student_org', 'uni_org'],
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
          label: 'Project Progress',
          value: 0,
          max: 100,
          variant: 'bar',
          showLabel: true,
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle'],
  quickDeploy: true,
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  quickDeployFields: [
    { key: 'title', label: 'Meeting Name', type: 'text', required: true, placeholder: 'Weekly Board Meeting' },
  ],
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
        elementId: 'checklist-tracker',
        instanceId: generateId(),
        config: {
          title: 'Meeting Agenda',
          items: [
            { id: 'item-1', title: '5 min - Welcome & Updates' },
            { id: 'item-2', title: '15 min - Main Topic Discussion' },
            { id: 'item-3', title: '10 min - Action Items Review' },
            { id: 'item-4', title: '5 min - Q&A & Wrap-up' },
          ],
          allowMemberAdd: true,
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
  category: 'resources',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle'],
  spaceTypes: ['student_org', 'greek'],
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
          label: 'Budget Used',
          value: 0,
          max: 1000,
          variant: 'bar',
          showLabel: true,
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
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle', 'campus_events'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
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
        elementId: 'announcement',
        instanceId: generateId(),
        config: {
          pinned: false,
          sendNotification: true,
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
 * What Should I Eat Template (Hero Demo 2)
 * Campus dining discovery with smart recommendations
 */
export const WHAT_SHOULD_I_EAT_TEMPLATE: QuickTemplate = {
  id: 'what-should-i-eat',
  name: "What Should I Eat?",
  description: 'Find the perfect dining option based on mood, dietary needs, and location',
  icon: 'sparkles',
  category: 'resources',
  complexity: 'simple',
  interestCategories: ['food_behaviors', 'social_energy'],
  spaceTypes: ['residential'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    {
      key: 'sortBy',
      label: 'Sort By',
      type: 'options',
      required: false,
      options: ['closing-soon', 'distance', 'name'],
      defaultValue: 'closing-soon'
    },
  ],
  composition: {
    id: generateId(),
    name: "What Should I Eat?",
    description: 'Campus dining finder with smart recommendations',
    elements: [
      {
        elementId: 'dining-picker',
        instanceId: generateId(),
        config: {
          title: "What Should I Eat?",
          showRecommendation: true,
          showFilters: true,
          maxItems: 8,
          sortBy: 'closing-soon',
        },
        position: { x: 0, y: 0 },
        size: { width: 350, height: 550 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Tonight's Events Template (Hero Demo 1)
 * Personalized event discovery based on interests, friends, and spaces
 */
export const TONIGHTS_EVENTS_TEMPLATE: QuickTemplate = {
  id: 'tonights-events',
  name: "Tonight's Events",
  description: 'Discover events personalized for you based on interests and friends',
  icon: 'sparkles',
  category: 'events',
  complexity: 'simple',
  interestCategories: ['campus_events', 'social_energy'],
  spaceTypes: ['student_org', 'residential', 'greek'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    {
      key: 'timeRange',
      label: 'Time Range',
      type: 'options',
      required: false,
      options: ['tonight', 'today', 'this-week', 'this-month'],
      defaultValue: 'tonight'
    },
  ],
  composition: {
    id: generateId(),
    name: "Tonight's Events",
    description: 'Personalized event feed based on your interests and social graph',
    elements: [
      {
        elementId: 'personalized-event-feed',
        instanceId: generateId(),
        config: {
          timeRange: 'tonight',
          maxItems: 8,
          showFriendCount: true,
          showMatchReasons: true,
          title: "Events For You Tonight",
        },
        position: { x: 0, y: 0 },
        size: { width: 350, height: 500 },
      },
      {
        elementId: 'filter-selector',
        instanceId: generateId(),
        config: {
          label: 'Filter by Type',
          options: [
            { label: 'Social', value: 'social' },
            { label: 'Academic', value: 'academic' },
            { label: 'Sports', value: 'sports' },
            { label: 'Music', value: 'music' },
            { label: 'Arts', value: 'arts' },
          ],
          allowMultiple: true,
          showCounts: false,
        },
        position: { x: 0, y: 520 },
        size: { width: 350, height: 80 },
      },
    ],
    connections: [
      {
        from: { instanceId: 'filter', output: 'selection' },
        to: { instanceId: 'feed', input: 'eventTypes' },
      },
    ],
    layout: 'flow',
  },
};

/**
 * Study Spot Finder Template (Hero Demo 3)
 * Find the perfect study spot based on noise, power, and distance
 */
export const STUDY_SPOT_FINDER_TEMPLATE: QuickTemplate = {
  id: 'study-spot-finder',
  name: "Study Spot Finder",
  description: 'Find the perfect study spot based on noise level, power outlets, and location',
  icon: 'sparkles',
  category: 'resources',
  complexity: 'simple',
  interestCategories: ['study_style', 'academic_identity'],
  spaceTypes: ['student_org', 'residential'],
  defaultConfig: {
    placement: 'sidebar',
    collapsed: false,
  },
  setupFields: [
    {
      key: 'defaultNoiseLevel',
      label: 'Preferred Noise Level',
      type: 'options',
      required: false,
      options: ['silent', 'quiet', 'moderate', 'social'],
      defaultValue: undefined
    },
    {
      key: 'defaultNeedsPower',
      label: 'Need Power Outlets?',
      type: 'options',
      required: false,
      options: ['yes', 'no'],
      defaultValue: 'no'
    },
  ],
  composition: {
    id: generateId(),
    name: "Study Spot Finder",
    description: 'Find the perfect place to study on campus',
    elements: [
      {
        elementId: 'study-spot-finder',
        instanceId: generateId(),
        config: {
          title: "Find a Study Spot",
          showRecommendation: true,
          showFilters: true,
          maxItems: 8,
        },
        position: { x: 0, y: 0 },
        size: { width: 380, height: 600 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

// =============================================================================
// APP-TIER TEMPLATES (4+ elements with connections)
// These are sophisticated multi-element compositions that feel like apps
// =============================================================================

/**
 * Photo Challenge App Template
 * Run photo contests with voting and winners
 * Elements: photo-gallery + poll-element + leaderboard + countdown-timer
 */
export const PHOTO_CHALLENGE_TEMPLATE: QuickTemplate = {
  id: 'photo-challenge',
  name: 'Photo Challenge',
  description: 'Run photo contests with voting, leaderboards, and deadlines',
  icon: 'camera',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['creative_scene', 'social_energy'],
  spaceTypes: ['student_org', 'residential', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'challengeTitle', label: 'Challenge Name', type: 'text', required: true, placeholder: 'Best Campus Shot' },
    { key: 'deadline', label: 'Submission Deadline', type: 'date', required: true },
  ],
  composition: {
    id: generateId(),
    name: 'Photo Challenge',
    description: 'Photo submission, voting, and leaderboard',
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: generateId(),
        config: {
          label: 'Submissions Close In',
          showDays: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'photo-gallery',
        instanceId: generateId(),
        config: {
          allowUpload: true,
          maxPhotos: 50,
          columns: 3,
        },
        position: { x: 0, y: 120 },
        size: { width: 300, height: 300 },
      },
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Vote for your favorite!',
          options: [],
          showResultsBeforeVoting: true,
          allowChangeVote: false,
        },
        position: { x: 0, y: 440 },
        size: { width: 300, height: 150 },
      },
      {
        elementId: 'leaderboard',
        instanceId: generateId(),
        config: {
          title: 'Top Photos',
          maxEntries: 5,
          scoreLabel: 'votes',
          highlightTop: 3,
        },
        position: { x: 0, y: 610 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Attendance Tracker App Template
 * Track attendance with points and trends
 * Elements: rsvp-button + leaderboard + counter + chart-display
 */
export const ATTENDANCE_TRACKER_TEMPLATE: QuickTemplate = {
  id: 'attendance-tracker',
  name: 'Attendance Tracker',
  description: 'Track meeting attendance with points and engagement trends',
  icon: 'users',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['campus_events', 'builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'eventName', label: 'Event/Meeting Name', type: 'text', required: true, placeholder: 'Weekly Meeting' },
    { key: 'pointsPerAttendance', label: 'Points per Check-in', type: 'number', required: false, defaultValue: 10 },
  ],
  composition: {
    id: generateId(),
    name: 'Attendance Tracker',
    description: 'Check-in, points, and attendance trends',
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: generateId(),
        config: {
          eventName: 'Check In Now',
          showCount: true,
          maxAttendees: 500,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 120 },
      },
      {
        elementId: 'counter',
        instanceId: generateId(),
        config: {
          label: 'Total Check-ins Today',
          initialValue: 0,
          showControls: false,
        },
        position: { x: 0, y: 140 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'leaderboard',
        instanceId: generateId(),
        config: {
          title: 'Top Attendees',
          maxEntries: 10,
          scoreLabel: 'pts',
          highlightTop: 3,
        },
        position: { x: 0, y: 260 },
        size: { width: 300, height: 250 },
      },
      {
        elementId: 'chart-display',
        instanceId: generateId(),
        config: {
          title: 'Attendance Trends',
          chartType: 'line',
          showLegend: false,
        },
        position: { x: 0, y: 530 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [
    ],
    layout: 'flow',
  },
};

/**
 * Resource Signup System App Template
 * Equipment lending, room booking, resource management
 * Elements: form-builder + result-list + counter + announcement
 */
export const RESOURCE_SIGNUP_TEMPLATE: QuickTemplate = {
  id: 'resource-signup',
  name: 'Resource Signup',
  description: 'Manage equipment lending, room booking, or resource checkout',
  icon: 'clipboard-list',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['campus_events'],
  spaceTypes: ['student_org', 'uni_org', 'residential'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'resourceType', label: 'Resource Type', type: 'text', required: true, placeholder: 'Equipment, Room, etc.' },
    { key: 'maxResources', label: 'Total Available', type: 'number', required: true, defaultValue: 10 },
  ],
  composition: {
    id: generateId(),
    name: 'Resource Signup',
    description: 'Request form, availability, and policies',
    elements: [
      {
        elementId: 'announcement',
        instanceId: generateId(),
        config: {
          pinned: true,
          sendNotification: false,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'counter',
        instanceId: generateId(),
        config: {
          label: 'Available Now',
          initialValue: 10,
          showControls: false,
        },
        position: { x: 0, y: 120 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'resource', label: 'Resource Needed', type: 'text', required: true },
            { name: 'date', label: 'Date Needed', type: 'date', required: true },
            { name: 'duration', label: 'Duration', type: 'text', required: true },
            { name: 'reason', label: 'Purpose', type: 'textarea', required: false },
          ],
          submitLabel: 'Request Resource',
        },
        position: { x: 0, y: 240 },
        size: { width: 300, height: 320 },
      },
      {
        elementId: 'result-list',
        instanceId: generateId(),
        config: {
          itemsPerPage: 5,
          showPagination: true,
        },
        position: { x: 0, y: 580 },
        size: { width: 300, height: 200 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Multi-Poll Dashboard App Template
 * Board meetings, group decisions with multiple votes
 * Elements: 3x poll-element + countdown-timer + announcement
 */
export const MULTI_POLL_DASHBOARD_TEMPLATE: QuickTemplate = {
  id: 'multi-poll-dashboard',
  name: 'Multi-Poll Dashboard',
  description: 'Run multiple votes simultaneously for board meetings or group decisions',
  icon: 'grid',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['social_energy', 'gaming_and_game_night'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'meetingTitle', label: 'Meeting/Session Title', type: 'text', required: true, placeholder: 'Board Meeting Vote' },
    { key: 'deadline', label: 'Voting Deadline', type: 'date', required: true },
  ],
  composition: {
    id: generateId(),
    name: 'Multi-Poll Dashboard',
    description: 'Multiple simultaneous votes with deadline',
    elements: [
      {
        elementId: 'announcement',
        instanceId: generateId(),
        config: {
          pinned: true,
          sendNotification: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 80 },
      },
      {
        elementId: 'countdown-timer',
        instanceId: generateId(),
        config: {
          label: 'Voting Closes In',
          showDays: true,
        },
        position: { x: 0, y: 100 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Vote 1: Budget Allocation',
          options: ['Approve', 'Reject', 'Abstain'],
          showResultsBeforeVoting: true,
          anonymousVoting: false,
        },
        position: { x: 0, y: 220 },
        size: { width: 300, height: 150 },
      },
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Vote 2: Event Planning',
          options: ['Approve', 'Reject', 'Abstain'],
          showResultsBeforeVoting: true,
          anonymousVoting: false,
        },
        position: { x: 0, y: 390 },
        size: { width: 300, height: 150 },
      },
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'Vote 3: New Initiative',
          options: ['Approve', 'Reject', 'Abstain'],
          showResultsBeforeVoting: true,
          anonymousVoting: false,
        },
        position: { x: 0, y: 560 },
        size: { width: 300, height: 150 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Event Series Hub App Template
 * Weekly meetups, semester-long programs
 * Elements: space-events + photo-gallery + poll-element + countdown-timer
 */
export const EVENT_SERIES_HUB_TEMPLATE: QuickTemplate = {
  id: 'event-series-hub',
  name: 'Event Series Hub',
  description: 'Manage recurring events with photos, feedback, and countdowns',
  icon: 'calendar',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['campus_events', 'creative_scene'],
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'seriesName', label: 'Series Name', type: 'text', required: true, placeholder: 'Weekly Game Night' },
  ],
  composition: {
    id: generateId(),
    name: 'Event Series Hub',
    description: 'Events, photos, voting for next event',
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: generateId(),
        config: {
          label: 'Next Event In',
          showDays: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'space-events',
        instanceId: generateId(),
        config: {
          maxEvents: 3,
        },
        position: { x: 0, y: 120 },
        size: { width: 300, height: 250 },
      },
      {
        elementId: 'photo-gallery',
        instanceId: generateId(),
        config: {
          allowUpload: true,
          maxPhotos: 20,
          columns: 2,
        },
        position: { x: 0, y: 390 },
        size: { width: 300, height: 200 },
      },
      {
        elementId: 'poll-element',
        instanceId: generateId(),
        config: {
          question: 'What should we do next time?',
          options: ['Same as usual', 'Try something new', 'Special theme'],
          showResultsBeforeVoting: true,
          allowChangeVote: false,
        },
        position: { x: 0, y: 610 },
        size: { width: 300, height: 150 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Suggestion Box App Template
 * Feedback collection with triage and trends
 * Elements: form-builder + result-list + filter-selector + chart-display
 */
export const SUGGESTION_BOX_TEMPLATE: QuickTemplate = {
  id: 'suggestion-box',
  name: 'Suggestion Box',
  description: 'Collect feedback with filtering, triage, and trend visualization',
  icon: 'inbox',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['social_energy'],
  spaceTypes: ['student_org', 'uni_org', 'residential', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'boxTitle', label: 'Suggestion Box Title', type: 'text', required: true, placeholder: 'Share Your Ideas' },
    { key: 'allowAnonymous', label: 'Allow Anonymous?', type: 'options', options: ['Yes', 'No'], required: false, defaultValue: 'Yes' },
  ],
  composition: {
    id: generateId(),
    name: 'Suggestion Box',
    description: 'Submit suggestions with triage and trends',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'category', label: 'Category', type: 'select', required: true, options: [{ value: 'idea', label: 'Idea' }, { value: 'feedback', label: 'Feedback' }, { value: 'issue', label: 'Issue' }, { value: 'question', label: 'Question' }] },
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Details', type: 'textarea', required: true },
            { name: 'priority', label: 'Priority', type: 'select', required: false, options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
          ],
          submitLabel: 'Submit Suggestion',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 280 },
      },
      {
        elementId: 'filter-selector',
        instanceId: generateId(),
        config: {
          label: 'Filter by Status',
          options: [
            { label: 'All', value: 'all' },
            { label: 'New', value: 'new' },
            { label: 'In Review', value: 'review' },
            { label: 'Planned', value: 'planned' },
            { label: 'Completed', value: 'done' },
          ],
          allowMultiple: false,
        },
        position: { x: 0, y: 300 },
        size: { width: 300, height: 60 },
      },
      {
        elementId: 'result-list',
        instanceId: generateId(),
        config: {
          itemsPerPage: 5,
          showPagination: true,
        },
        position: { x: 0, y: 380 },
        size: { width: 300, height: 250 },
      },
      {
        elementId: 'chart-display',
        instanceId: generateId(),
        config: {
          title: 'Submission Trends',
          chartType: 'bar',
          showLegend: true,
        },
        position: { x: 0, y: 650 },
        size: { width: 300, height: 180 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Study Group Matcher App Template
 * Form availability, heatmap, group suggestions
 * Elements: form-builder + availability-heatmap + result-list + member-selector
 */
export const STUDY_GROUP_MATCHER_TEMPLATE: QuickTemplate = {
  id: 'study-group-matcher',
  name: 'Study Group Matcher',
  description: 'Match study partners based on availability and courses',
  icon: 'users',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['academic_identity', 'study_style'],
  spaceTypes: ['student_org', 'uni_org'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'course', label: 'Course/Subject', type: 'text', required: true, placeholder: 'CS 101' },
  ],
  composition: {
    id: generateId(),
    name: 'Study Group Matcher',
    description: 'Submit availability, see matches',
    elements: [
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'course', label: 'Course', type: 'text', required: true },
            { name: 'topics', label: 'Topics to Study', type: 'textarea', required: false },
            { name: 'availability', label: 'Available Times', type: 'textarea', required: true, placeholder: 'Mon 2-4pm, Wed 6-8pm' },
            { name: 'groupSize', label: 'Preferred Group Size', type: 'select', options: [{ value: '2-3', label: '2-3' }, { value: '4-5', label: '4-5' }, { value: '6+', label: '6+' }], required: false },
          ],
          submitLabel: 'Find Study Partners',
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 350 },
      },
      {
        elementId: 'chart-display',
        instanceId: generateId(),
        config: {
          title: 'Popular Study Times',
          chartType: 'bar',
          showLegend: false,
        },
        position: { x: 0, y: 370 },
        size: { width: 300, height: 180 },
      },
      {
        elementId: 'result-list',
        instanceId: generateId(),
        config: {
          itemsPerPage: 5,
          showPagination: true,
        },
        position: { x: 0, y: 570 },
        size: { width: 300, height: 200 },
      },
      {
        elementId: 'member-list',
        instanceId: generateId(),
        config: {
          maxMembers: 6,
        },
        position: { x: 0, y: 790 },
        size: { width: 300, height: 150 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Competition Tracker App Template
 * Fundraising, challenges, competitions with goals
 * Elements: leaderboard + counter + form-builder + chart-display
 */
export const COMPETITION_TRACKER_TEMPLATE: QuickTemplate = {
  id: 'competition-tracker',
  name: 'Competition Tracker',
  description: 'Track fundraising, challenges, or competitions with goals and leaderboards',
  icon: 'trophy',
  category: 'apps',
  complexity: 'app',
  interestCategories: ['gaming_and_game_night', 'builders_and_hustle'],
  spaceTypes: ['student_org', 'greek'],
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'competitionName', label: 'Competition Name', type: 'text', required: true, placeholder: 'Spring Fundraiser' },
    { key: 'goal', label: 'Goal Amount/Target', type: 'number', required: true, defaultValue: 1000 },
    { key: 'unit', label: 'Unit (e.g., $, points)', type: 'text', required: false, defaultValue: '$' },
  ],
  composition: {
    id: generateId(),
    name: 'Competition Tracker',
    description: 'Goals, standings, and score submission',
    elements: [
      {
        elementId: 'progress-indicator',
        instanceId: generateId(),
        config: {
          label: 'Progress to Goal',
          value: 0,
          max: 1000,
          variant: 'bar',
          showLabel: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 300, height: 120 },
      },
      {
        elementId: 'counter',
        instanceId: generateId(),
        config: {
          label: 'Total Raised',
          initialValue: 0,
          showControls: false,
        },
        position: { x: 0, y: 140 },
        size: { width: 300, height: 100 },
      },
      {
        elementId: 'leaderboard',
        instanceId: generateId(),
        config: {
          title: 'Top Contributors',
          maxEntries: 10,
          scoreLabel: 'pts',
          highlightTop: 3,
        },
        position: { x: 0, y: 260 },
        size: { width: 300, height: 280 },
      },
      {
        elementId: 'form-builder',
        instanceId: generateId(),
        config: {
          fields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'note', label: 'Note (optional)', type: 'text', required: false },
          ],
          submitLabel: 'Log Contribution',
        },
        position: { x: 0, y: 560 },
        size: { width: 300, height: 200 },
      },
      {
        elementId: 'chart-display',
        instanceId: generateId(),
        config: {
          title: 'Daily Progress',
          chartType: 'line',
          showLegend: false,
        },
        position: { x: 0, y: 780 },
        size: { width: 300, height: 180 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

// =============================================================================
// INFRASTRUCTURE TEMPLATES (campus-scale tools using new elements)
// These use listing-board, match-maker, workflow-pipeline, data-table
// =============================================================================

/**
 * Textbook Exchange Template
 * Campus marketplace for buying/selling textbooks
 */
export const TEXTBOOK_EXCHANGE_TEMPLATE: QuickTemplate = {
  id: 'textbook-exchange',
  name: 'Textbook Exchange',
  description: 'Buy, sell, and trade textbooks with other students',
  icon: 'shopping-bag',
  category: 'resources',
  complexity: 'app',
  interestCategories: ['academic_style', 'builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'residential'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Board Name', type: 'text', required: false, placeholder: 'Textbook Exchange', defaultValue: 'Textbook Exchange' },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Board Name', type: 'text', required: false, placeholder: 'Textbook Exchange', defaultValue: 'Textbook Exchange' },
  ],
  composition: {
    id: generateId(),
    name: 'Textbook Exchange',
    description: 'Buy, sell, and trade textbooks',
    elements: [
      {
        elementId: 'listing-board',
        instanceId: generateId(),
        config: {
          title: 'Textbook Exchange',
          categories: ['Textbooks', 'Course Materials', 'Lab Supplies', 'Other'],
          listingFields: [
            { key: 'title', label: 'Book Title', type: 'text', required: true },
            { key: 'description', label: 'Course / Condition', type: 'textarea' },
            { key: 'price', label: 'Price', type: 'text' },
          ],
          claimBehavior: 'request',
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 500 },
      },
      {
        elementId: 'search-input',
        instanceId: generateId(),
        config: {
          placeholder: 'Search by book title or course...',
          debounceMs: 200,
        },
        position: { x: 0, y: 520 },
        size: { width: 400, height: 60 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Study Group Matcher Template
 * Match students into study groups by course and availability
 */
export const STUDY_GROUP_MATCHER_TEMPLATE_V2: QuickTemplate = {
  id: 'study-group-matcher',
  name: 'Study Group Matcher',
  description: 'Match students into study groups by course and schedule',
  icon: 'users',
  category: 'teams',
  complexity: 'app',
  interestCategories: ['academic_style', 'social_energy'],
  spaceTypes: ['student_org', 'uni_org', 'residential'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Matcher Name', type: 'text', required: false, placeholder: 'Study Group Matcher', defaultValue: 'Study Group Matcher' },
    { key: 'matchSize', label: 'Group Size', type: 'number', required: false, defaultValue: 4 },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Matcher Name', type: 'text', required: false, placeholder: 'Study Group Matcher', defaultValue: 'Study Group Matcher' },
    { key: 'matchSize', label: 'Group Size', type: 'number', required: false, defaultValue: 4 },
  ],
  composition: {
    id: generateId(),
    name: 'Study Group Matcher',
    description: 'Match students into study groups',
    elements: [
      {
        elementId: 'match-maker',
        instanceId: generateId(),
        config: {
          title: 'Study Group Matcher',
          preferenceFields: [
            { key: 'course', label: 'Course', type: 'multi-select', options: ['CSE 115', 'CSE 116', 'MTH 141', 'PHY 107', 'CHE 101', 'BIO 200'] },
            { key: 'availability', label: 'Availability', type: 'multi-select', options: ['Morning', 'Afternoon', 'Evening', 'Weekend'] },
            { key: 'style', label: 'Study Style', type: 'multi-select', options: ['Silent', 'Discussion', 'Practice Problems', 'Flashcards'] },
          ],
          matchSize: 4,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 450 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Budget Request System Template
 * Multi-stage approval pipeline for budget/funding requests
 */
export const BUDGET_REQUEST_TEMPLATE: QuickTemplate = {
  id: 'budget-request',
  name: 'Budget Request System',
  description: 'Submit and track budget requests through approval stages',
  icon: 'git-merge',
  category: 'resources',
  complexity: 'app',
  interestCategories: ['builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Pipeline Name', type: 'text', required: false, placeholder: 'Budget Requests', defaultValue: 'Budget Requests' },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Pipeline Name', type: 'text', required: false, placeholder: 'Budget Requests', defaultValue: 'Budget Requests' },
  ],
  composition: {
    id: generateId(),
    name: 'Budget Request System',
    description: 'Submit and track budget requests through approval',
    elements: [
      {
        elementId: 'workflow-pipeline',
        instanceId: generateId(),
        config: {
          title: 'Budget Requests',
          stages: [
            { id: 'submitted', name: 'Submitted', color: 'bg-blue-500' },
            { id: 'treasurer-review', name: 'Treasurer Review', color: 'bg-amber-500' },
            { id: 'advisor-approval', name: 'Advisor Approval', color: 'bg-purple-500' },
            { id: 'approved', name: 'Approved', color: 'bg-green-500' },
          ],
          intakeFields: [
            { key: 'title', label: 'Request Title', type: 'text', required: true },
            { key: 'amount', label: 'Amount ($)', type: 'text', required: true },
            { key: 'description', label: 'What is this for?', type: 'textarea', required: true },
            { key: 'date', label: 'Needed By', type: 'text' },
          ],
        },
        position: { x: 0, y: 0 },
        size: { width: 500, height: 500 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Campus Marketplace Template
 * General-purpose buy/sell/trade board
 */
export const CAMPUS_MARKETPLACE_TEMPLATE: QuickTemplate = {
  id: 'campus-marketplace',
  name: 'Campus Marketplace',
  description: 'Buy, sell, and trade anything on campus',
  icon: 'shopping-bag',
  category: 'resources',
  complexity: 'app',
  interestCategories: ['builders_and_hustle', 'social_energy'],
  spaceTypes: ['student_org', 'uni_org', 'residential'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Marketplace Name', type: 'text', required: false, placeholder: 'Campus Marketplace', defaultValue: 'Campus Marketplace' },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Marketplace Name', type: 'text', required: false, placeholder: 'Campus Marketplace', defaultValue: 'Campus Marketplace' },
  ],
  composition: {
    id: generateId(),
    name: 'Campus Marketplace',
    description: 'Buy, sell, and trade on campus',
    elements: [
      {
        elementId: 'listing-board',
        instanceId: generateId(),
        config: {
          title: 'Campus Marketplace',
          categories: ['Furniture', 'Electronics', 'Clothing', 'Tickets', 'Free Stuff', 'Other'],
          listingFields: [
            { key: 'title', label: 'Item', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'price', label: 'Price', type: 'text' },
          ],
          claimBehavior: 'request',
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 500 },
      },
      {
        elementId: 'search-input',
        instanceId: generateId(),
        config: {
          placeholder: 'Search listings...',
          debounceMs: 200,
        },
        position: { x: 0, y: 520 },
        size: { width: 400, height: 60 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Club Roster Template
 * Sortable member directory with roles and contact info
 */
export const CLUB_ROSTER_TEMPLATE: QuickTemplate = {
  id: 'club-roster',
  name: 'Club Roster',
  description: 'Organized member directory with roles and contact info',
  icon: 'table',
  category: 'teams',
  complexity: 'simple',
  interestCategories: ['builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org', 'greek'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Roster Name', type: 'text', required: false, placeholder: 'Club Roster', defaultValue: 'Club Roster' },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Roster Name', type: 'text', required: false, placeholder: 'Club Roster', defaultValue: 'Club Roster' },
  ],
  composition: {
    id: generateId(),
    name: 'Club Roster',
    description: 'Member directory with roles and contact',
    elements: [
      {
        elementId: 'data-table',
        instanceId: generateId(),
        config: {
          title: 'Club Roster',
          columns: [
            { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true },
            { key: 'role', label: 'Role', type: 'text', sortable: true, filterable: true },
            { key: 'email', label: 'Email', type: 'email', sortable: true },
            { key: 'year', label: 'Year', type: 'text', sortable: true, filterable: true },
          ],
          pageSize: 15,
          allowRowActions: true,
        },
        position: { x: 0, y: 0 },
        size: { width: 500, height: 400 },
      },
    ],
    connections: [],
    layout: 'flow',
  },
};

/**
 * Mentorship Pairing Template
 * Match mentors with mentees by interest and experience
 */
export const MENTORSHIP_PAIRING_TEMPLATE: QuickTemplate = {
  id: 'mentorship-pairing',
  name: 'Mentorship Pairing',
  description: 'Match mentors and mentees based on interests and experience',
  icon: 'sparkles',
  category: 'teams',
  complexity: 'app',
  interestCategories: ['academic_style', 'builders_and_hustle'],
  spaceTypes: ['student_org', 'uni_org'],
  quickDeploy: true,
  defaultConfig: {
    placement: 'inline',
    collapsed: false,
  },
  setupFields: [
    { key: 'title', label: 'Program Name', type: 'text', required: false, placeholder: 'Mentorship Program', defaultValue: 'Mentorship Program' },
  ],
  quickDeployFields: [
    { key: 'title', label: 'Program Name', type: 'text', required: false, placeholder: 'Mentorship Program', defaultValue: 'Mentorship Program' },
  ],
  composition: {
    id: generateId(),
    name: 'Mentorship Pairing',
    description: 'Match mentors with mentees',
    elements: [
      {
        elementId: 'match-maker',
        instanceId: generateId(),
        config: {
          title: 'Mentorship Pairing',
          preferenceFields: [
            { key: 'role', label: 'I am a...', type: 'multi-select', options: ['Mentor', 'Mentee'] },
            { key: 'topics', label: 'Topics', type: 'multi-select', options: ['Career', 'Academics', 'Research', 'Leadership', 'Technical Skills'] },
            { key: 'availability', label: 'Availability', type: 'multi-select', options: ['Weekly', 'Biweekly', 'Monthly'] },
          ],
          matchSize: 2,
        },
        position: { x: 0, y: 0 },
        size: { width: 400, height: 450 },
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
  // Infrastructure templates (campus-scale, new elements)
  TEXTBOOK_EXCHANGE_TEMPLATE,
  CAMPUS_MARKETPLACE_TEMPLATE,
  STUDY_GROUP_MATCHER_TEMPLATE_V2,
  BUDGET_REQUEST_TEMPLATE,
  MENTORSHIP_PAIRING_TEMPLATE,
  CLUB_ROSTER_TEMPLATE,
  // App-tier templates
  PHOTO_CHALLENGE_TEMPLATE,
  ATTENDANCE_TRACKER_TEMPLATE,
  RESOURCE_SIGNUP_TEMPLATE,
  MULTI_POLL_DASHBOARD_TEMPLATE,
  EVENT_SERIES_HUB_TEMPLATE,
  SUGGESTION_BOX_TEMPLATE,
  STUDY_GROUP_MATCHER_TEMPLATE,
  COMPETITION_TRACKER_TEMPLATE,
  // Simple templates
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
  TONIGHTS_EVENTS_TEMPLATE,
  WHAT_SHOULD_I_EAT_TEMPLATE,
  STUDY_SPOT_FINDER_TEMPLATE,
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
export function getTemplatesByCategory(category: TemplateCategory): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by complexity
 */
export function getTemplatesByComplexity(complexity: TemplateComplexity): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.complexity === complexity);
}

/**
 * Get App-tier templates (featured multi-element apps)
 */
export function getAppTemplates(): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.complexity === 'app' && t.status !== 'hidden');
}

/**
 * Get all available templates (excluding hidden ones)
 */
export function getAvailableTemplates(): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.status !== 'hidden');
}

/**
 * Get all unique categories with counts (excluding hidden templates)
 */
export function getCategoriesWithCounts(): { category: TemplateCategory; count: number }[] {
  const counts = new Map<TemplateCategory, number>();
  for (const template of QUICK_TEMPLATES) {
    if (template.status === 'hidden') continue;
    counts.set(template.category, (counts.get(template.category) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

/**
 * Create a deployable tool from a template
 * Generates fresh IDs to avoid conflicts
 */
export function createToolFromTemplate(
  template: QuickTemplate,
  configOverrides?: Record<string, string>
): ToolComposition {
  const toolId = generateId();
  return {
    ...template.composition,
    id: toolId,
    elements: template.composition.elements.map((el, index) => {
      const newEl = { ...el, instanceId: generateId() };
      // Apply config overrides to the first element (simple templates have 1 primary element)
      if (index === 0 && configOverrides && Object.keys(configOverrides).length > 0) {
        const mergedConfig = { ...el.config };
        for (const [key, value] of Object.entries(configOverrides)) {
          if (value === undefined || value === '') continue;
          // If existing config value is an array, split comma-separated input
          if (Array.isArray(el.config[key])) {
            mergedConfig[key] = value.split(',').map(v => v.trim()).filter(Boolean);
          } else {
            mergedConfig[key] = value;
          }
        }
        newEl.config = mergedConfig;
      }
      return newEl;
    }),
  };
}

/**
 * Get quick-deployable templates (skip the builder)
 */
export function getQuickDeployTemplates(): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(t => t.quickDeploy && t.status !== 'hidden');
}

/**
 * Get templates that match a user's interests
 */
export function getTemplatesForInterests(interests: string[]): QuickTemplate[] {
  if (!interests.length) return [];
  const interestSet = new Set(interests);
  return QUICK_TEMPLATES
    .filter(t => t.status !== 'hidden' && t.interestCategories?.some(c => interestSet.has(c)))
    .sort((a, b) => {
      const aScore = a.interestCategories?.filter(c => interestSet.has(c)).length ?? 0;
      const bScore = b.interestCategories?.filter(c => interestSet.has(c)).length ?? 0;
      return bScore - aScore;
    });
}

/**
 * Get templates recommended for a specific space type
 */
export function getTemplatesForSpaceType(spaceType: SpaceType): QuickTemplate[] {
  return QUICK_TEMPLATES.filter(
    t => t.status !== 'hidden' && t.spaceTypes?.includes(spaceType)
  );
}

/**
 * Get templates sorted with recommended-for-space-type first
 */
export function getTemplatesSortedByRelevance(
  spaceType?: SpaceType
): { recommended: QuickTemplate[]; others: QuickTemplate[] } {
  const available = getAvailableTemplates();
  if (!spaceType) {
    return { recommended: [], others: available };
  }
  const recommended: QuickTemplate[] = [];
  const others: QuickTemplate[] = [];
  for (const template of available) {
    if (template.spaceTypes?.includes(spaceType)) {
      recommended.push(template);
    } else {
      others.push(template);
    }
  }
  return { recommended, others };
}

/** Space type display names */
export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  student_org: 'Student Org',
  uni_org: 'University Org',
  residential: 'Residential',
  greek: 'Greek Life',
};
