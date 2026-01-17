import { z } from 'zod';

/**
 * Event Validation Schemas
 *
 * Validates event data including creation, updates, and RSVPs.
 */

// Event status
export const EventStatusSchema = z.enum(['draft', 'published', 'cancelled', 'completed']);
export type EventStatus = z.infer<typeof EventStatusSchema>;

// Event visibility
export const EventVisibilitySchema = z.enum(['public', 'members', 'private']);
export type EventVisibility = z.infer<typeof EventVisibilitySchema>;

// Event type
export const EventTypeSchema = z.enum([
  'meeting',
  'workshop',
  'social',
  'academic',
  'sports',
  'cultural',
  'professional',
  'other',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

// RSVP status
export const RsvpStatusSchema = z.enum(['going', 'maybe', 'not_going', 'waitlist']);
export type RsvpStatus = z.infer<typeof RsvpStatusSchema>;

// Event title validation
export const EventTitleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(100, 'Title must be 100 characters or less')
  .trim();

// Event description validation
export const EventDescriptionSchema = z
  .string()
  .max(2000, 'Description must be 2000 characters or less')
  .optional();

// Location schema
export const EventLocationSchema = z.object({
  type: z.enum(['in_person', 'virtual', 'hybrid']),
  name: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  virtualLink: z.string().url().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
}).refine(
  (loc) => {
    if (loc.type === 'in_person' || loc.type === 'hybrid') {
      return loc.name || loc.address;
    }
    if (loc.type === 'virtual' || loc.type === 'hybrid') {
      return loc.virtualLink;
    }
    return true;
  },
  { message: 'Location details required for event type' }
);
export type EventLocation = z.infer<typeof EventLocationSchema>;

// Create event input
export const CreateEventInputSchema = z.object({
  spaceId: z.string().min(1),
  title: EventTitleSchema,
  description: EventDescriptionSchema,
  type: EventTypeSchema.default('other'),
  visibility: EventVisibilitySchema.default('public'),
  startAt: z.date(),
  endAt: z.date(),
  location: EventLocationSchema.optional(),
  coverImageUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  requireApproval: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(5).optional(),
}).refine(
  (data) => data.endAt > data.startAt,
  { message: 'End time must be after start time', path: ['endAt'] }
);
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

// Update event input
export const UpdateEventInputSchema = z.object({
  title: EventTitleSchema.optional(),
  description: EventDescriptionSchema,
  type: EventTypeSchema.optional(),
  visibility: EventVisibilitySchema.optional(),
  status: EventStatusSchema.optional(),
  startAt: z.date().optional(),
  endAt: z.date().optional(),
  location: EventLocationSchema.optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
  requireApproval: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
});
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;

// RSVP input
export const RsvpInputSchema = z.object({
  eventId: z.string().min(1),
  status: RsvpStatusSchema,
  note: z.string().max(200).optional(),
});
export type RsvpInput = z.infer<typeof RsvpInputSchema>;

// Attendee schema
export const AttendeeSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().optional(),
  status: RsvpStatusSchema,
  respondedAt: z.date(),
  note: z.string().optional(),
});
export type Attendee = z.infer<typeof AttendeeSchema>;

// Full event entity schema (for reading from DB)
export const EventSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  title: EventTitleSchema,
  description: z.string().optional(),
  type: EventTypeSchema,
  status: EventStatusSchema,
  visibility: EventVisibilitySchema,
  startAt: z.date(),
  endAt: z.date(),
  location: EventLocationSchema.optional(),
  coverImageUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  requireApproval: z.boolean(),
  tags: z.array(z.string()).optional(),
  organizerId: z.string(),
  campusId: z.string(),
  attendeeCount: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
export type Event = z.infer<typeof EventSchema>;
