import { z } from 'zod';

/**
 * Space type enum - determines templates and AI context
 */
export const spaceTypeSchema = z.enum(['uni', 'student', 'greek', 'residential']);
export type SpaceType = z.infer<typeof spaceTypeSchema>;

/**
 * Governance model enum - determines how roles work
 */
export const governanceSchema = z.enum(['flat', 'emergent', 'hybrid', 'hierarchical']);
export type GovernanceModel = z.infer<typeof governanceSchema>;

/**
 * Space lifecycle status
 */
export const spaceStatusSchema = z.enum(['unclaimed', 'active', 'claimed', 'verified']);
export type SpaceStatus = z.infer<typeof spaceStatusSchema>;

/**
 * Space source
 */
export const spaceSourceSchema = z.enum(['ublinked', 'user-created']);
export type SpaceSource = z.infer<typeof spaceSourceSchema>;

/**
 * Publish status for visibility
 */
export const publishStatusSchema = z.enum(['stealth', 'live', 'rejected']);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const spaceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be 50 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be 500 characters or less'),
  imageUrl: z.string().url('Invalid URL format').optional(),
  category: z.enum(['Major', 'Residential', 'Student Life', 'Club', 'General', 'Greek Life', 'Academic', 'Cultural', 'Sports', 'Arts', 'Service', 'Professional', 'Special Interest']),
  memberCount: z.number().int().nonnegative().default(0),
  isPublic: z.boolean().default(true),
  visibility: z.enum(['public', 'private']).default('public'),

  // New fields
  spaceType: spaceTypeSchema.default('student'),
  governance: governanceSchema.default('hybrid'),
  status: spaceStatusSchema.default('claimed'),
  source: spaceSourceSchema.default('user-created'),
  externalId: z.string().optional(),

  // Optional creator for unclaimed spaces
  createdBy: z.string().optional(),
  ownerId: z.string().optional(),

  // Status fields
  publishStatus: publishStatusSchema.default('stealth'),
  claimedAt: z.date().optional(),
  wentLiveAt: z.date().optional(),

  lastActivityAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().optional(),
});

export const memberSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']).default('member'),
  joinedAt: z.date().default(() => new Date()),
});

/**
 * Schema for creating a new space
 */
export const createSpaceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  category: z.string(),
  spaceType: spaceTypeSchema.optional(),
  governance: governanceSchema.optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

/**
 * Schema for claiming a pre-seeded space
 */
export const claimSpaceSchema = z.object({
  spaceId: z.string(),
});

export type Space = z.infer<typeof spaceSchema>;
export type Member = z.infer<typeof memberSchema>;
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type ClaimSpaceInput = z.infer<typeof claimSpaceSchema>; 