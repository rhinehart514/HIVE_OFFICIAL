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

import type { SetupToolSlot, OrchestrationRule, SetupConfigField } from './setup-template';
import type { ToolCapabilities } from '../capabilities';

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

export const EVENT_SERIES_TEMPLATE = {
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
// Export All System Templates
// ============================================================================

/**
 * All system-defined Setup templates
 */
export const SYSTEM_SETUP_TEMPLATES = [EVENT_SERIES_TEMPLATE];

/**
 * Get a system template by ID
 */
export function getSystemSetupTemplate(id: string): typeof EVENT_SERIES_TEMPLATE | undefined {
  return SYSTEM_SETUP_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all system templates for a category
 */
export function getSystemSetupTemplatesByCategory(
  category: 'event' | 'campaign' | 'workflow' | 'engagement' | 'governance',
): typeof SYSTEM_SETUP_TEMPLATES {
  return SYSTEM_SETUP_TEMPLATES.filter(t => t.category === category);
}
