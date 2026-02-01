/**
 * Event Series Setup Template
 *
 * The first fully orchestrated Setup template demonstrating:
 * - Multi-tool bundling (RSVP + Countdown + Check-in + Photo Wall)
 * - Cross-tool triggers (countdown_complete -> show check-in)
 * - Data flow (RSVP list -> check-in expected list)
 * - Conditional visibility (photos only for checked-in users)
 * - Time-based notifications (30-min reminder)
 */

import type { SetupToolSlot, OrchestrationRule, SetupConfigField, SetupCategory } from './setup-template';
import type { ToolCapabilities } from '../capabilities';

/**
 * Type for system setup templates - allows any SetupCategory
 */
interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SetupCategory;
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  sharedDataSchema: Record<string, unknown>;
  configFields: SetupConfigField[];
  requiredCapabilities: Partial<ToolCapabilities>;
  tags: string[];
}

// ============================================================================
// Tool Slots
// ============================================================================

/**
 * RSVP Tool Slot
 * Collects RSVPs with capacity management
 */
const RSVP_SLOT: SetupToolSlot = {
  slotId: 'rsvp',
  name: 'RSVP',
  templateId: undefined, // Inline composition
  composition: {
    elements: [
      {
        elementId: 'rsvp-button',
        instanceId: 'rsvp_main',
        config: {
          options: ['Going', 'Maybe', "Can't Go"],
          showCounts: true,
          capacityEnabled: true,
          capacityField: 'maxAttendees',
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 2 },
      },
      {
        elementId: 'result-list',
        instanceId: 'rsvp_list',
        config: {
          title: 'Who\'s Going',
          groupBy: 'response',
          showAvatar: true,
          maxVisible: 10,
        },
        position: { x: 0, y: 2 },
        size: { width: 12, height: 4 },
      },
    ],
    connections: [
      {
        from: { instanceId: 'rsvp_main', output: 'attendees' },
        to: { instanceId: 'rsvp_list', input: 'data' },
      },
    ],
    layout: 'grid',
  },
  defaultConfig: {
    maxAttendees: 100,
    locked: false,
  },
  placement: 'sidebar',
  initiallyVisible: true,
  description: 'Let members RSVP to the event',
  icon: 'UserPlus',
};

/**
 * Countdown Tool Slot
 * Live countdown to event start
 */
const COUNTDOWN_SLOT: SetupToolSlot = {
  slotId: 'countdown',
  name: 'Countdown',
  templateId: undefined,
  composition: {
    elements: [
      {
        elementId: 'countdown-timer',
        instanceId: 'countdown_main',
        config: {
          title: 'Event Starts In',
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          targetField: 'eventStartTime',
          emitEvent: true,
          eventType: 'countdown_complete',
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 3 },
      },
    ],
    connections: [],
    layout: 'grid',
  },
  defaultConfig: {},
  placement: 'sidebar',
  initiallyVisible: true,
  description: 'Countdown timer to event start',
  icon: 'Timer',
};

/**
 * Check-in Tool Slot
 * Track attendance at the event
 */
const CHECKIN_SLOT: SetupToolSlot = {
  slotId: 'checkin',
  name: 'Check-in',
  templateId: undefined,
  composition: {
    elements: [
      {
        elementId: 'form-builder',
        instanceId: 'checkin_form',
        config: {
          title: 'Check In',
          submitLabel: 'I\'m Here!',
          oneTimeSubmit: true,
          fields: [],
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 2 },
      },
      {
        elementId: 'counter',
        instanceId: 'checkin_counter',
        config: {
          title: 'Checked In',
          suffix: ' attendees',
          showProgress: true,
          progressDenominatorField: 'expectedCount',
        },
        position: { x: 0, y: 2 },
        size: { width: 6, height: 2 },
      },
      {
        elementId: 'result-list',
        instanceId: 'checkin_list',
        config: {
          title: 'Present',
          showAvatar: true,
          showTimestamp: true,
          maxVisible: 10,
        },
        position: { x: 6, y: 2 },
        size: { width: 6, height: 4 },
      },
    ],
    connections: [
      {
        from: { instanceId: 'checkin_form', output: 'submission' },
        to: { instanceId: 'checkin_list', input: 'data' },
      },
    ],
    layout: 'grid',
  },
  defaultConfig: {
    expectedAttendees: [],
    expectedCount: 0,
  },
  placement: 'sidebar',
  initiallyVisible: false, // Hidden until countdown completes
  description: 'Track who shows up at the event',
  icon: 'CheckCircle',
};

/**
 * Photo Wall Tool Slot
 * Shared photo gallery for attendees using the dedicated photo-gallery element
 */
const PHOTO_WALL_SLOT: SetupToolSlot = {
  slotId: 'photos',
  name: 'Photo Wall',
  templateId: undefined,
  composition: {
    elements: [
      {
        elementId: 'photo-gallery',
        instanceId: 'photo_gallery_main',
        config: {
          maxPhotos: 100,
          allowUpload: true,
          columns: 3,
          showCaptions: true,
          moderationEnabled: true,
          allowedUploaders: [], // Populated by orchestration from check-in
          uploadLabel: 'Share a Moment',
          emptyMessage: 'No photos yet. Check in and be the first to share!',
        },
        position: { x: 0, y: 0 },
        size: { width: 12, height: 8 },
      },
    ],
    connections: [],
    layout: 'grid',
  },
  defaultConfig: {
    allowedUploaders: [],
    moderationEnabled: true,
  },
  placement: 'sidebar',
  initiallyVisible: false, // Hidden until first check-in
  description: 'Photo gallery for event memories',
  icon: 'Image',
};

// ============================================================================
// Orchestration Rules
// ============================================================================

/**
 * Lock RSVP when countdown completes
 */
const LOCK_RSVP_RULE: OrchestrationRule = {
  id: 'lock-rsvp-on-start',
  name: 'Lock RSVP at Event Start',
  description: 'Prevent new RSVPs once the event begins',
  trigger: {
    type: 'tool_event',
    sourceSlotId: 'countdown',
    eventType: 'countdown_complete',
  },
  actions: [
    {
      type: 'config',
      targetSlotId: 'rsvp',
      updates: { locked: true },
    },
  ],
  enabled: true,
  runOnce: true,
};

/**
 * Show check-in when countdown completes
 */
const SHOW_CHECKIN_RULE: OrchestrationRule = {
  id: 'show-checkin-on-start',
  name: 'Show Check-in at Event Start',
  description: 'Make the check-in tool visible when the event begins',
  trigger: {
    type: 'tool_event',
    sourceSlotId: 'countdown',
    eventType: 'countdown_complete',
  },
  actions: [
    {
      type: 'visibility',
      targetSlotId: 'checkin',
      visible: true,
    },
  ],
  enabled: true,
  runOnce: true,
};

/**
 * Populate check-in expected list from RSVP
 */
const POPULATE_CHECKIN_RULE: OrchestrationRule = {
  id: 'populate-checkin-from-rsvp',
  name: 'Copy RSVP List to Check-in',
  description: 'Transfer the RSVP attendee list to the check-in expected list',
  trigger: {
    type: 'tool_event',
    sourceSlotId: 'countdown',
    eventType: 'countdown_complete',
  },
  actions: [
    {
      type: 'data_flow',
      sourceSlotId: 'rsvp',
      sourceOutput: 'attendees',
      targetSlotId: 'checkin',
      targetInput: 'expectedAttendees',
    },
    {
      type: 'data_flow',
      sourceSlotId: 'rsvp',
      sourceOutput: 'goingCount',
      targetSlotId: 'checkin',
      targetInput: 'expectedCount',
    },
  ],
  enabled: true,
  runOnce: true,
};

/**
 * Enable photos for checked-in users
 */
const ENABLE_PHOTOS_RULE: OrchestrationRule = {
  id: 'enable-photos-for-checked-in',
  name: 'Enable Photo Uploads for Checked-in Users',
  description: 'Allow photo uploads only for users who have checked in',
  trigger: {
    type: 'tool_event',
    sourceSlotId: 'checkin',
    eventType: 'attendee_checked_in',
  },
  actions: [
    {
      type: 'data_flow',
      sourceSlotId: 'checkin',
      sourceOutput: 'checkedInUserIds',
      targetSlotId: 'photos',
      targetInput: 'allowedUploaders',
    },
    {
      type: 'visibility',
      targetSlotId: 'photos',
      visible: true,
    },
  ],
  enabled: true,
  runOnce: false, // Run every time someone checks in
};

/**
 * 30-minute reminder notification
 */
const REMINDER_30MIN_RULE: OrchestrationRule = {
  id: 'reminder-30min',
  name: '30-Minute Reminder',
  description: 'Send a reminder notification 30 minutes before the event',
  trigger: {
    type: 'time_relative',
    referenceField: 'eventStartTime',
    offsetMinutes: -30,
  },
  actions: [
    {
      type: 'notification',
      recipients: 'rsvped',
      title: 'Event Starting Soon!',
      body: '{eventName} starts in 30 minutes. See you there!',
      actionUrl: '/spaces/{spaceId}',
    },
  ],
  enabled: true,
  runOnce: true,
};

/**
 * Event start notification
 */
const EVENT_START_RULE: OrchestrationRule = {
  id: 'notify-event-start',
  name: 'Event Start Notification',
  description: 'Notify attendees when the event begins',
  trigger: {
    type: 'tool_event',
    sourceSlotId: 'countdown',
    eventType: 'countdown_complete',
  },
  actions: [
    {
      type: 'notification',
      recipients: 'rsvped',
      title: "It's Time!",
      body: '{eventName} is starting now. Check in to participate!',
      actionUrl: '/spaces/{spaceId}',
    },
  ],
  enabled: true,
  runOnce: true,
};

// ============================================================================
// Configuration Fields
// ============================================================================

const EVENT_SERIES_CONFIG_FIELDS: SetupConfigField[] = [
  {
    key: 'eventName',
    label: 'Event Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Welcome Week Kickoff',
    helpText: 'The name of your event',
  },
  {
    key: 'eventStartTime',
    label: 'Event Start Time',
    type: 'datetime',
    required: true,
    helpText: 'When the event begins (countdown will target this time)',
  },
  {
    key: 'maxAttendees',
    label: 'Maximum Attendees',
    type: 'number',
    required: false,
    defaultValue: 100,
    helpText: 'Leave blank for unlimited',
    validation: {
      min: 1,
      max: 10000,
    },
  },
  {
    key: 'enablePhotos',
    label: 'Enable Photo Wall',
    type: 'boolean',
    required: false,
    defaultValue: true,
    helpText: 'Allow checked-in attendees to share photos',
  },
  {
    key: 'enableReminders',
    label: 'Enable Reminder Notifications',
    type: 'boolean',
    required: false,
    defaultValue: true,
    helpText: 'Send a 30-minute reminder to RSVPed attendees',
  },
];

// ============================================================================
// Required Capabilities
// ============================================================================

const EVENT_SERIES_CAPABILITIES: Partial<ToolCapabilities> = {
  read_own_state: true,
  write_own_state: true,
  read_space_context: true,
  read_space_members: true,
  write_shared_state: true,
  send_notifications: true, // For reminders
};

// ============================================================================
// Shared Data Schema
// ============================================================================

const EVENT_SERIES_SHARED_DATA_SCHEMA = {
  type: 'object',
  properties: {
    eventName: { type: 'string' },
    eventStartTime: { type: 'string', format: 'date-time' },
    maxAttendees: { type: 'number' },
    rsvpCount: { type: 'number' },
    goingCount: { type: 'number' },
    checkedInCount: { type: 'number' },
    photosCount: { type: 'number' },
    phase: {
      type: 'string',
      enum: ['pre-event', 'during', 'post-event'],
    },
  },
  required: ['eventName', 'eventStartTime'],
};

// ============================================================================
// Event Series Template Definition
// ============================================================================

export const EVENT_SERIES_TEMPLATE: SystemTemplate = {
  id: 'event-series',
  name: 'Event Series',
  description:
    'Complete event management with RSVP, countdown, check-in, and photo sharing. Perfect for meetings, socials, and organized events.',
  icon: 'Calendar',
  category: 'event' as const,
  tools: [RSVP_SLOT, COUNTDOWN_SLOT, CHECKIN_SLOT, PHOTO_WALL_SLOT],
  orchestration: [
    LOCK_RSVP_RULE,
    SHOW_CHECKIN_RULE,
    POPULATE_CHECKIN_RULE,
    ENABLE_PHOTOS_RULE,
    REMINDER_30MIN_RULE,
    EVENT_START_RULE,
  ],
  sharedDataSchema: EVENT_SERIES_SHARED_DATA_SCHEMA,
  configFields: EVENT_SERIES_CONFIG_FIELDS,
  requiredCapabilities: EVENT_SERIES_CAPABILITIES,
  tags: ['event', 'rsvp', 'countdown', 'checkin', 'photos', 'attendance'],
};

// ============================================================================
// Campaign Kit Template
// ============================================================================

const CAMPAIGN_KIT_TEMPLATE: SystemTemplate = {
  id: 'campaign-kit',
  name: 'Campaign Kit',
  description:
    'Launch countdown, signup collection, and progress updates for product launches, recruitment drives, or fundraising campaigns.',
  icon: 'Rocket',
  category: 'campaign' as const,
  tools: [
    {
      slotId: 'countdown',
      name: 'Launch Countdown',
      composition: {
        elements: [
          {
            elementId: 'countdown-timer',
            instanceId: 'campaign_countdown',
            config: {
              title: 'Launching In',
              showDays: true,
              showHours: true,
              showMinutes: true,
              showSeconds: false,
              targetField: 'launchDate',
              emitEvent: true,
              eventType: 'campaign_launch',
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 3 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Countdown to campaign launch',
      icon: 'Timer',
    },
    {
      slotId: 'signup',
      name: 'Interest Signup',
      composition: {
        elements: [
          {
            elementId: 'form-builder',
            instanceId: 'campaign_signup',
            config: {
              title: 'Get Notified',
              submitLabel: 'Sign Me Up',
              fields: [
                { name: 'email', type: 'email', required: true },
                { name: 'notes', type: 'textarea', required: false },
              ],
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 3 },
          },
          {
            elementId: 'counter',
            instanceId: 'signup_counter',
            config: {
              title: 'People Interested',
              suffix: ' signed up',
            },
            position: { x: 0, y: 3 },
            size: { width: 12, height: 2 },
          },
        ],
        connections: [
          {
            from: { instanceId: 'campaign_signup', output: 'submissions' },
            to: { instanceId: 'signup_counter', input: 'count' },
          },
        ],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Collect interest signups',
      icon: 'UserPlus',
    },
    {
      slotId: 'updates',
      name: 'Progress Updates',
      composition: {
        elements: [
          {
            elementId: 'feed',
            instanceId: 'campaign_updates',
            config: {
              title: 'Campaign Updates',
              allowPosts: false,
              showTimestamps: true,
              maxItems: 10,
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 6 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Post campaign progress updates',
      icon: 'Megaphone',
    },
  ],
  orchestration: [
    {
      id: 'notify-on-launch',
      name: 'Launch Notification',
      description: 'Notify all signups when campaign launches',
      trigger: {
        type: 'tool_event' as const,
        sourceSlotId: 'countdown',
        eventType: 'campaign_launch',
      },
      actions: [
        {
          type: 'notification' as const,
          recipients: 'all' as const,
          title: 'Campaign Has Launched!',
          body: '{campaignName} is now live. Check it out!',
          actionUrl: '/spaces/{spaceId}',
        },
      ],
      enabled: true,
      runOnce: true,
    },
  ],
  sharedDataSchema: {
    type: 'object',
    properties: {
      campaignName: { type: 'string' },
      launchDate: { type: 'string', format: 'date-time' },
      signupCount: { type: 'number' },
    },
    required: ['campaignName', 'launchDate'],
  },
  configFields: [
    {
      key: 'campaignName',
      label: 'Campaign Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Spring Recruitment 2025',
    },
    {
      key: 'launchDate',
      label: 'Launch Date',
      type: 'datetime' as const,
      required: true,
      helpText: 'When the campaign goes live',
    },
  ],
  requiredCapabilities: {
    read_own_state: true,
    write_own_state: true,
    send_notifications: true,
  },
  tags: ['campaign', 'launch', 'signup', 'countdown', 'marketing'],
};

// ============================================================================
// Onboarding Flow Template
// ============================================================================

const ONBOARDING_FLOW_TEMPLATE: SystemTemplate = {
  id: 'onboarding-flow',
  name: 'Onboarding Flow',
  description:
    'Welcome new members with a greeting, checklist of steps to complete, and introductions to the community.',
  icon: 'Compass',
  category: 'workflow' as const,
  tools: [
    {
      slotId: 'welcome',
      name: 'Welcome Message',
      composition: {
        elements: [
          {
            elementId: 'rich-text',
            instanceId: 'welcome_message',
            config: {
              title: 'Welcome!',
              content: 'Welcome to our space. We are excited to have you!',
              format: 'markdown',
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 4 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'modal' as const,
      initiallyVisible: true,
      description: 'Welcome message for new members',
      icon: 'Hand',
    },
    {
      slotId: 'checklist',
      name: 'Getting Started Checklist',
      composition: {
        elements: [
          {
            elementId: 'checklist',
            instanceId: 'onboarding_checklist',
            config: {
              title: 'Getting Started',
              items: [
                { id: '1', label: 'Complete your profile', done: false },
                { id: '2', label: 'Introduce yourself', done: false },
                { id: '3', label: 'Read the guidelines', done: false },
              ],
              showProgress: true,
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 5 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Checklist of onboarding steps',
      icon: 'CheckSquare',
    },
    {
      slotId: 'introductions',
      name: 'Introductions',
      composition: {
        elements: [
          {
            elementId: 'form-builder',
            instanceId: 'intro_form',
            config: {
              title: 'Introduce Yourself',
              submitLabel: 'Post Introduction',
              oneTimeSubmit: true,
              fields: [
                { name: 'intro', type: 'textarea', label: 'Tell us about yourself', required: true },
                { name: 'interests', type: 'text', label: 'Your interests', required: false },
              ],
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 4 },
          },
          {
            elementId: 'result-list',
            instanceId: 'intro_list',
            config: {
              title: 'Recent Introductions',
              showAvatar: true,
              showTimestamp: true,
              maxVisible: 10,
            },
            position: { x: 0, y: 4 },
            size: { width: 12, height: 5 },
          },
        ],
        connections: [
          {
            from: { instanceId: 'intro_form', output: 'submission' },
            to: { instanceId: 'intro_list', input: 'data' },
          },
        ],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Member introduction board',
      icon: 'Users',
    },
  ],
  orchestration: [
    {
      id: 'show-welcome-on-join',
      name: 'Show Welcome on Join',
      description: 'Display welcome message when new member joins',
      trigger: {
        type: 'data_condition' as const,
        dataPath: 'member.isNew',
        operator: 'eq' as const,
        value: true,
      },
      actions: [
        {
          type: 'visibility' as const,
          targetSlotId: 'welcome',
          visible: true,
        },
      ],
      enabled: true,
      runOnce: false,
    },
  ],
  sharedDataSchema: {
    type: 'object',
    properties: {
      completedOnboarding: { type: 'number' },
      introductionsCount: { type: 'number' },
    },
  },
  configFields: [
    {
      key: 'welcomeMessage',
      label: 'Welcome Message',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Write your welcome message...',
      helpText: 'This appears when new members join',
    },
  ],
  requiredCapabilities: {
    read_own_state: true,
    write_own_state: true,
    read_space_members: true,
  },
  tags: ['onboarding', 'welcome', 'checklist', 'introductions', 'new members'],
};

// ============================================================================
// Weekly Rituals Template
// ============================================================================

const WEEKLY_RITUALS_TEMPLATE: SystemTemplate = {
  id: 'weekly-rituals',
  name: 'Weekly Rituals',
  description:
    'Recurring engagement tools: weekly polls, member highlights, and shoutouts to keep your community active.',
  icon: 'Calendar',
  category: 'engagement' as const,
  tools: [
    {
      slotId: 'poll',
      name: 'Weekly Poll',
      composition: {
        elements: [
          {
            elementId: 'poll',
            instanceId: 'weekly_poll',
            config: {
              title: 'This Week\'s Question',
              question: 'What should we focus on this week?',
              options: ['Option A', 'Option B', 'Option C'],
              allowMultiple: false,
              showResults: true,
              endDate: null,
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 5 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Weekly community poll',
      icon: 'BarChart',
    },
    {
      slotId: 'highlights',
      name: 'Member Highlights',
      composition: {
        elements: [
          {
            elementId: 'spotlight',
            instanceId: 'member_highlight',
            config: {
              title: 'Member of the Week',
              showBio: true,
              showJoinDate: true,
              showContributions: true,
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 4 },
          },
        ],
        connections: [],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Highlight standout members',
      icon: 'Star',
    },
    {
      slotId: 'shoutouts',
      name: 'Shoutouts',
      composition: {
        elements: [
          {
            elementId: 'form-builder',
            instanceId: 'shoutout_form',
            config: {
              title: 'Give a Shoutout',
              submitLabel: 'Send Shoutout',
              fields: [
                { name: 'to', type: 'text', label: 'Who deserves recognition?', required: true },
                { name: 'reason', type: 'textarea', label: 'Why?', required: true },
              ],
            },
            position: { x: 0, y: 0 },
            size: { width: 12, height: 3 },
          },
          {
            elementId: 'result-list',
            instanceId: 'shoutout_list',
            config: {
              title: 'Recent Shoutouts',
              showAvatar: true,
              showTimestamp: true,
              maxVisible: 5,
            },
            position: { x: 0, y: 3 },
            size: { width: 12, height: 4 },
          },
        ],
        connections: [
          {
            from: { instanceId: 'shoutout_form', output: 'submission' },
            to: { instanceId: 'shoutout_list', input: 'data' },
          },
        ],
        layout: 'grid' as const,
      },
      defaultConfig: {},
      placement: 'sidebar' as const,
      initiallyVisible: true,
      description: 'Peer recognition board',
      icon: 'Heart',
    },
  ],
  orchestration: [
    {
      id: 'weekly-poll-reminder',
      name: 'Weekly Poll Reminder',
      description: 'Remind members to vote every Monday',
      trigger: {
        type: 'manual' as const,
        buttonLabel: 'Send Poll Reminder',
        confirmMessage: 'Send reminder to all members?',
      },
      actions: [
        {
          type: 'notification' as const,
          recipients: 'all' as const,
          title: 'New Weekly Poll',
          body: 'A new weekly poll is up! Share your thoughts.',
          actionUrl: '/spaces/{spaceId}',
        },
      ],
      enabled: true,
      runOnce: false,
    },
  ],
  sharedDataSchema: {
    type: 'object',
    properties: {
      totalVotes: { type: 'number' },
      shoutoutsCount: { type: 'number' },
      highlightedMemberId: { type: 'string' },
    },
  },
  configFields: [
    {
      key: 'pollFrequency',
      label: 'Poll Frequency',
      type: 'select' as const,
      required: true,
      defaultValue: 'weekly',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'biweekly', label: 'Bi-weekly' },
      ],
    },
  ],
  requiredCapabilities: {
    read_own_state: true,
    write_own_state: true,
    send_notifications: true,
  },
  tags: ['engagement', 'polls', 'highlights', 'shoutouts', 'weekly', 'recurring'],
};

// ============================================================================
// Export All System Templates
// ============================================================================

/**
 * All system-defined Setup templates
 */
export const SYSTEM_SETUP_TEMPLATES: SystemTemplate[] = [
  EVENT_SERIES_TEMPLATE,
  CAMPAIGN_KIT_TEMPLATE,
  ONBOARDING_FLOW_TEMPLATE,
  WEEKLY_RITUALS_TEMPLATE,
];

/**
 * Get a system template by ID
 */
export function getSystemSetupTemplate(id: string): SystemTemplate | undefined {
  return SYSTEM_SETUP_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all system templates for a category
 */
export function getSystemSetupTemplatesByCategory(
  category: SetupCategory,
): SystemTemplate[] {
  return SYSTEM_SETUP_TEMPLATES.filter(t => t.category === category);
}
