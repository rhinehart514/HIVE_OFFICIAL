/**
 * Element Config Zod Schemas
 *
 * Zod validation schemas for all 27 HiveLab element configurations.
 * Used by the CompositionValidatorService to validate AI-generated configs.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// BASE SCHEMAS
// ═══════════════════════════════════════════════════════════════════

/**
 * Position schema
 */
export const PositionSchema = z.object({
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(5000),
});

/**
 * Size schema
 */
export const SizeSchema = z.object({
  width: z.number().min(50).max(1000),
  height: z.number().min(30).max(800),
});

/**
 * Canvas element base schema
 */
export const CanvasElementBaseSchema = z.object({
  elementId: z.string().min(1),
  instanceId: z.string().min(1),
  position: PositionSchema,
  size: SizeSchema,
  config: z.record(z.unknown()),
});

/**
 * Element connection schema
 */
export const ElementConnectionSchema = z.object({
  from: z.object({
    instanceId: z.string().min(1),
    output: z.string().min(1),
  }),
  to: z.object({
    instanceId: z.string().min(1),
    input: z.string().min(1),
  }),
});

/**
 * Tool composition schema (structure only, not config validation)
 */
export const ToolCompositionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  elements: z.array(CanvasElementBaseSchema).min(1).max(20),
  connections: z.array(ElementConnectionSchema),
  layout: z.enum(['grid', 'flow', 'tabs', 'sidebar']),
});

// ═══════════════════════════════════════════════════════════════════
// INPUT ELEMENT SCHEMAS (4 elements)
// ═══════════════════════════════════════════════════════════════════

/**
 * search-input config schema
 */
export const SearchInputConfigSchema = z.object({
  placeholder: z.string().max(100).optional().default('Search...'),
  showSuggestions: z.boolean().optional().default(false),
  debounceMs: z.number().min(0).max(2000).optional().default(300),
});

/**
 * date-picker config schema
 */
export const DatePickerConfigSchema = z.object({
  mode: z.enum(['single', 'range']).optional().default('single'),
  showTime: z.boolean().optional().default(false),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

/**
 * user-selector config schema
 */
export const UserSelectorConfigSchema = z.object({
  allowMultiple: z.boolean().optional().default(true),
  maxSelections: z.number().min(1).optional(),
  filterByRole: z.array(z.string()).optional(),
  placeholder: z.string().max(100).optional().default('Select users...'),
});

/**
 * form-builder config schema
 */
export const FormBuilderConfigSchema = z.object({
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['text', 'email', 'number', 'select', 'textarea', 'checkbox']),
    label: z.string().min(1),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })).optional().default([]),
  submitButtonText: z.string().max(50).optional().default('Submit'),
  showValidation: z.boolean().optional().default(true),
});

// ═══════════════════════════════════════════════════════════════════
// FILTER ELEMENT SCHEMAS (1 element)
// ═══════════════════════════════════════════════════════════════════

/**
 * filter-selector config schema
 */
export const FilterSelectorConfigSchema = z.object({
  options: z.array(z.object({
    value: z.string().min(1),
    label: z.string().min(1),
    count: z.number().optional(),
  })).optional().default([]),
  allowMultiple: z.boolean().optional().default(true),
  showCounts: z.boolean().optional().default(false),
});

// ═══════════════════════════════════════════════════════════════════
// DISPLAY ELEMENT SCHEMAS (5 elements)
// ═══════════════════════════════════════════════════════════════════

/**
 * result-list config schema
 */
export const ResultListConfigSchema = z.object({
  itemsPerPage: z.number().min(1).max(100).optional().default(10),
  showPagination: z.boolean().optional().default(true),
});

/**
 * tag-cloud config schema
 */
export const TagCloudConfigSchema = z.object({
  maxTags: z.number().min(1).max(100).optional().default(20),
  minWeight: z.number().min(0).optional().default(1),
  colorScheme: z.enum(['default', 'rainbow']).optional().default('default'),
});

/**
 * chart-display config schema
 */
export const ChartDisplayConfigSchema = z.object({
  chartType: z.enum(['bar', 'line', 'pie']).default('bar'),
  title: z.string().max(100).optional(),
  showLegend: z.boolean().optional().default(true),
});

/**
 * map-view config schema
 */
export const MapViewConfigSchema = z.object({
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  zoom: z.number().min(1).max(20).optional().default(15),
  markers: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
  })).optional().default([]),
});

/**
 * notification-center config schema
 */
export const NotificationCenterConfigSchema = z.object({
  maxItems: z.number().min(1).max(100).optional().default(20),
  showUnreadOnly: z.boolean().optional().default(false),
  enableRealtime: z.boolean().optional().default(true),
});

// ═══════════════════════════════════════════════════════════════════
// ACTION ELEMENT SCHEMAS (6 elements)
// ═══════════════════════════════════════════════════════════════════

/**
 * poll-element config schema
 */
export const PollElementConfigSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(100)).min(2).max(10),
  allowMultipleVotes: z.boolean().optional().default(false),
  showResults: z.boolean().optional().default(true),
  showVoterCount: z.boolean().optional().default(true),
  closesAt: z.string().optional(),
});

/**
 * rsvp-button config schema
 */
export const RsvpButtonConfigSchema = z.object({
  eventName: z.string().min(1).max(100),
  maxAttendees: z.number().min(1).optional(),
  showAttendeeCount: z.boolean().optional().default(true),
  enableWaitlist: z.boolean().optional().default(true),
  options: z.array(z.string()).optional().default(['Going', 'Maybe', 'Not Going']),
});

/**
 * countdown-timer config schema
 */
export const CountdownTimerConfigSchema = z.object({
  targetDate: z.string(), // ISO date string
  title: z.string().max(100).optional(),
  showDays: z.boolean().optional().default(true),
  showHours: z.boolean().optional().default(true),
  showMinutes: z.boolean().optional().default(true),
  showSeconds: z.boolean().optional().default(true),
  completedMessage: z.string().max(100).optional().default("Time's up!"),
});

/**
 * leaderboard config schema
 */
export const LeaderboardConfigSchema = z.object({
  title: z.string().max(100).optional().default('Leaderboard'),
  maxEntries: z.number().min(1).max(100).optional().default(10),
  showRankChange: z.boolean().optional().default(true),
  refreshInterval: z.number().min(1000).optional().default(30000),
});

/**
 * counter config schema
 */
export const CounterConfigSchema = z.object({
  initialValue: z.number().optional().default(0),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  step: z.number().min(1).optional().default(1),
  label: z.string().max(50).optional(),
});

/**
 * timer config schema
 */
export const TimerConfigSchema = z.object({
  autoStart: z.boolean().optional().default(false),
  showMilliseconds: z.boolean().optional().default(false),
  targetDuration: z.number().min(1).optional(),
});

// ═══════════════════════════════════════════════════════════════════
// LAYOUT ELEMENT SCHEMAS (2 elements)
// ═══════════════════════════════════════════════════════════════════

/**
 * tabs-container config schema
 */
export const TabsContainerConfigSchema = z.object({
  tabs: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(50),
    icon: z.string().optional(),
  })).optional().default([
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
  ]),
  defaultTab: z.string().optional(),
});

/**
 * card-container config schema
 */
export const CardContainerConfigSchema = z.object({
  title: z.string().max(100).optional(),
  subtitle: z.string().max(200).optional(),
  collapsible: z.boolean().optional().default(false),
  padding: z.enum(['none', 'sm', 'md', 'lg']).optional().default('md'),
});

// ═══════════════════════════════════════════════════════════════════
// ELEMENT CONFIG SCHEMA REGISTRY
// ═══════════════════════════════════════════════════════════════════

/**
 * Map of element ID to config schema
 */
export const ELEMENT_CONFIG_SCHEMAS: Record<string, z.ZodType<unknown>> = {
  // Input elements
  'search-input': SearchInputConfigSchema,
  'date-picker': DatePickerConfigSchema,
  'user-selector': UserSelectorConfigSchema,
  'form-builder': FormBuilderConfigSchema,

  // Filter elements
  'filter-selector': FilterSelectorConfigSchema,

  // Display elements
  'result-list': ResultListConfigSchema,
  'tag-cloud': TagCloudConfigSchema,
  'chart-display': ChartDisplayConfigSchema,
  'map-view': MapViewConfigSchema,
  'notification-center': NotificationCenterConfigSchema,

  // Action elements
  'poll-element': PollElementConfigSchema,
  'rsvp-button': RsvpButtonConfigSchema,
  'countdown-timer': CountdownTimerConfigSchema,
  'leaderboard': LeaderboardConfigSchema,
  'counter': CounterConfigSchema,
  'timer': TimerConfigSchema,

  // Layout elements
  'tabs-container': TabsContainerConfigSchema,
  'card-container': CardContainerConfigSchema,
};

/**
 * Get config schema for an element ID
 */
export function getElementConfigSchema(elementId: string): z.ZodType<unknown> | undefined {
  return ELEMENT_CONFIG_SCHEMAS[elementId];
}

/**
 * Validate element config against schema
 */
export function validateElementConfig(
  elementId: string,
  config: unknown
): { success: true; data: unknown } | { success: false; errors: z.ZodError } {
  const schema = getElementConfigSchema(elementId);

  if (!schema) {
    // No schema = permissive validation (accept any config)
    return { success: true, data: config };
  }

  const result = schema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Get required fields for an element
 */
export function getRequiredFields(elementId: string): string[] {
  const required: Record<string, string[]> = {
    'poll-element': ['question', 'options'],
    'rsvp-button': ['eventName'],
    'countdown-timer': ['targetDate'],
    'chart-display': ['chartType'],
    'form-builder': [], // fields array is optional but should have items if present
  };

  return required[elementId] || [];
}

/**
 * Check if a field is required for an element
 */
export function isFieldRequired(elementId: string, fieldName: string): boolean {
  return getRequiredFields(elementId).includes(fieldName);
}
