import { z } from 'zod';

/**
 * Waitlist entry schema for major space unlocks
 *
 * Users join the waitlist when they try to join a locked major space.
 * When the space unlocks (10 members), all waitlist entries are notified.
 *
 * Firestore collection: spaceWaitlists
 * Document ID: `${spaceId}_${userId}`
 *
 * Required indexes:
 * - spaceWaitlists: spaceId + notified + joinedAt (ASC)
 * - spaceWaitlists: userId + campusId
 */
export const waitlistEntrySchema = z.object({
  /**
   * Composite ID: `${spaceId}_${userId}`
   * Ensures one waitlist entry per user per space
   */
  id: z.string(),

  /**
   * The locked major space being waited for
   */
  spaceId: z.string(),

  /**
   * User waiting to join
   */
  userId: z.string(),

  /**
   * Major name (for filtering/display)
   */
  majorName: z.string().optional(),

  /**
   * When user joined the waitlist
   */
  joinedAt: z.string(), // ISO timestamp or Firestore Timestamp

  /**
   * Whether user has been notified of unlock
   */
  notified: z.boolean().default(false),

  /**
   * When user was notified (if applicable)
   */
  notifiedAt: z.string().optional(),

  /**
   * Campus isolation
   */
  campusId: z.string(),
});

export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

/**
 * Schema for creating a new waitlist entry
 */
export const createWaitlistEntrySchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  majorName: z.string().optional(),
  campusId: z.string().min(1, 'Campus ID is required'),
});

export type CreateWaitlistEntry = z.infer<typeof createWaitlistEntrySchema>;

/**
 * Schema for checking waitlist status
 */
export const checkWaitlistStatusSchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type CheckWaitlistStatus = z.infer<typeof checkWaitlistStatusSchema>;
