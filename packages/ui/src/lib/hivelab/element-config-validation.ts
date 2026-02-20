/**
 * Element Config Validation
 *
 * Zod-based validation layer for HiveLab element configs.
 * Validates and coerces AI-generated or user-provided configs into
 * safe, well-typed shapes before they reach element components.
 *
 * Design: never throws. Always returns a valid config (defaults on failure).
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// SHARED SCHEMA HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Coerce a comma-separated string into an array of strings.
 * Handles "A, B, C" → ["A", "B", "C"] and passes through arrays.
 */
const coercedStringArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val
      .split(/[,;]\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}, z.array(z.unknown()));

/**
 * Coerce a value to a number, parsing strings when possible.
 */
function coercedNumber(defaultVal: number) {
  return z.preprocess((val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : defaultVal;
    }
    return defaultVal;
  }, z.number());
}

/**
 * Coerce a value to a boolean.
 */
function coercedBoolean(defaultVal: boolean) {
  return z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (val === 'true' || val === '1' || val === 1) return true;
    if (val === 'false' || val === '0' || val === 0) return false;
    return defaultVal;
  }, z.boolean());
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════

const pollElementSchema = z.object({
  question: z.string().default('What do you think?'),
  options: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val
        .split(/[,;]\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return ['Option 1', 'Option 2'];
  }, z.array(z.unknown()).min(2)),
  allowMultipleVotes: coercedBoolean(false),
  showResults: coercedBoolean(true),
  showResultsBeforeVoting: coercedBoolean(false).optional(),
  anonymousVoting: coercedBoolean(false),
  allowChangeVote: coercedBoolean(false).optional(),
  deadline: z.string().optional(),
}).passthrough();

const counterSchema = z.object({
  label: z.string().default('Count'),
  initialValue: coercedNumber(0),
  step: coercedNumber(1),
  min: coercedNumber(0),
  max: coercedNumber(999),
  showControls: coercedBoolean(true),
}).passthrough();

const rsvpButtonSchema = z.object({
  eventName: z.string().default('Event'),
  maxAttendees: coercedNumber(100),
  showCount: coercedBoolean(true),
  showAttendeeCount: coercedBoolean(true).optional(),
  requireConfirmation: coercedBoolean(false),
  allowWaitlist: coercedBoolean(true),
  enableWaitlist: coercedBoolean(false).optional(),
}).passthrough();

const formBuilderSchema = z.object({
  title: z.string().optional(),
  fields: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    return [];
  }, z.array(z.object({
    name: z.string(),
    type: z.string().default('text'),
    label: z.string().optional(),
    required: coercedBoolean(false).optional(),
    placeholder: z.string().optional(),
    options: z.array(z.unknown()).optional(),
  }).passthrough())),
  submitLabel: z.string().optional(),
  submitButtonText: z.string().optional(),
  validateOnChange: coercedBoolean(true).optional(),
  showProgress: coercedBoolean(false).optional(),
  allowMultipleSubmissions: coercedBoolean(false).optional(),
}).passthrough();

const signupSheetSchema = z.object({
  title: z.string().default('Sign Up Sheet'),
  slots: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    return [
      { id: 'slot-1', name: 'Slot 1', time: '9:00 AM', capacity: 5 },
      { id: 'slot-2', name: 'Slot 2', time: '10:00 AM', capacity: 5 },
    ];
  }, z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    label: z.string().optional(),
    time: z.string().optional(),
    capacity: coercedNumber(5).optional(),
    maxSignups: coercedNumber(5).optional(),
  }).passthrough())),
  allowMultipleSignups: coercedBoolean(false),
}).passthrough();

const checklistTrackerSchema = z.object({
  title: z.string().default('Checklist'),
  items: z.preprocess((val) => {
    if (Array.isArray(val)) {
      return val.map((item) => {
        if (typeof item === 'string') return { text: item, completed: false };
        return item;
      });
    }
    if (typeof val === 'string') {
      return val
        .split(/[,;]\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((text) => ({ text, completed: false }));
    }
    return [];
  }, z.array(z.object({
    text: z.string().optional(),
    completed: coercedBoolean(false).optional(),
  }).passthrough())),
  allowMemberAdd: coercedBoolean(false),
}).passthrough();

const leaderboardSchema = z.object({
  title: z.string().optional(),
  maxEntries: coercedNumber(10),
  maxItems: coercedNumber(10).optional(),
  showRank: coercedBoolean(true),
  showScore: coercedBoolean(true),
  scoreLabel: z.string().default('Points'),
  highlightTop: coercedNumber(3),
}).passthrough();

const timerSchema = z.object({
  label: z.string().default('Timer'),
  showControls: coercedBoolean(true),
  countUp: coercedBoolean(true),
  initialSeconds: coercedNumber(0),
}).passthrough();

const announcementSchema = z.object({
  pinned: coercedBoolean(false),
  sendNotification: coercedBoolean(true),
  expiresAt: z.string().default(''),
}).passthrough();

const progressIndicatorSchema = z.object({
  value: coercedNumber(0),
  current: coercedNumber(0).optional(),
  max: coercedNumber(100),
  target: coercedNumber(100).optional(),
  showLabel: coercedBoolean(true),
  variant: z.string().default('bar'),
  label: z.string().default(''),
  title: z.string().optional(),
  color: z.string().default('primary'),
  unit: z.string().optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════
// SCHEMA REGISTRY
// ═══════════════════════════════════════════════════════════════════

const ELEMENT_SCHEMAS: Record<string, z.ZodType> = {
  'poll-element': pollElementSchema,
  'counter': counterSchema,
  'counter-element': counterSchema,
  'rsvp-button': rsvpButtonSchema,
  'form-builder': formBuilderSchema,
  'signup-sheet': signupSheetSchema,
  'checklist-tracker': checklistTrackerSchema,
  'leaderboard': leaderboardSchema,
  'timer': timerSchema,
  'announcement': announcementSchema,
  'progress-indicator': progressIndicatorSchema,
};

// ═══════════════════════════════════════════════════════════════════
// DEFAULT CONFIGS (fallback when validation fails entirely)
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  'poll-element': {
    question: 'What do you think?',
    options: ['Option 1', 'Option 2'],
    allowMultipleVotes: false,
    showResults: true,
    anonymousVoting: false,
  },
  'counter': {
    label: 'Count',
    initialValue: 0,
    step: 1,
    min: 0,
    max: 999,
    showControls: true,
  },
  'counter-element': {
    label: 'Count',
    initialValue: 0,
    step: 1,
    min: 0,
    max: 999,
    showControls: true,
  },
  'rsvp-button': {
    eventName: 'Event',
    maxAttendees: 100,
    showCount: true,
    requireConfirmation: false,
    allowWaitlist: true,
  },
  'form-builder': {
    fields: [],
    validateOnChange: true,
    showProgress: false,
  },
  'signup-sheet': {
    slots: [
      { id: 'slot-1', name: 'Slot 1', time: '9:00 AM', capacity: 5 },
      { id: 'slot-2', name: 'Slot 2', time: '10:00 AM', capacity: 5 },
    ],
    allowMultipleSignups: false,
    title: 'Sign Up Sheet',
  },
  'checklist-tracker': {
    items: [],
    allowMemberAdd: false,
    title: 'Checklist',
  },
  'leaderboard': {
    maxEntries: 10,
    showRank: true,
    showScore: true,
    scoreLabel: 'Points',
    highlightTop: 3,
  },
  'timer': {
    label: 'Timer',
    showControls: true,
    countUp: true,
    initialSeconds: 0,
  },
  'announcement': {
    pinned: false,
    sendNotification: true,
    expiresAt: '',
  },
  'progress-indicator': {
    value: 0,
    max: 100,
    showLabel: true,
    variant: 'bar',
    label: '',
    color: 'primary',
  },
};

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate and coerce an element config.
 *
 * - Looks up the Zod schema for the element type
 * - Validates and coerces where possible (e.g., string → array for options)
 * - Returns safe defaults on failure
 * - Never throws
 *
 * Elements without a registered schema pass through unchanged.
 */
export function validateAndCoerceConfig(
  elementId: string,
  config: unknown,
): Record<string, unknown> {
  // Normalize element ID (strip numeric suffixes like "-1", "-2")
  const normalizedId = elementId.replace(/-\d+$/, '');

  const schema = ELEMENT_SCHEMAS[normalizedId];
  if (!schema) {
    // No schema for this element type — pass through as-is
    return (config && typeof config === 'object' && !Array.isArray(config))
      ? (config as Record<string, unknown>)
      : {};
  }

  try {
    const result = schema.safeParse(config ?? {});
    if (result.success) {
      return result.data as Record<string, unknown>;
    }

    // Partial failure: merge provided config over defaults to preserve
    // any valid fields while filling in missing ones
    const defaults = DEFAULT_CONFIGS[normalizedId] ?? {};
    const provided = (config && typeof config === 'object' && !Array.isArray(config))
      ? (config as Record<string, unknown>)
      : {};

    return { ...defaults, ...provided };
  } catch {
    // Total failure: return safe defaults
    return DEFAULT_CONFIGS[normalizedId] ?? {};
  }
}
