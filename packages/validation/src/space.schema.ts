import { z } from 'zod';

/**
 * Space Validation Schemas
 *
 * Validates all space-related data including creation, updates, and members.
 */

// Space status values
export const SpaceStatusSchema = z.enum(['draft', 'live', 'archived', 'suspended']);
export type SpaceStatus = z.infer<typeof SpaceStatusSchema>;

// Space visibility
export const SpaceVisibilitySchema = z.enum(['public', 'private', 'unlisted']);
export type SpaceVisibility = z.infer<typeof SpaceVisibilitySchema>;

// Space category
export const SpaceCategorySchema = z.enum([
  'academics',
  'social',
  'professional',
  'interests',
  'cultural',
  'service',
  'official',
  'other',
]);
export type SpaceCategory = z.infer<typeof SpaceCategorySchema>;

// Member role
export const MemberRoleSchema = z.enum(['owner', 'admin', 'moderator', 'member']);
export type MemberRole = z.infer<typeof MemberRoleSchema>;

// Space handle/slug validation
export const SpaceHandleSchema = z
  .string()
  .min(3, 'Handle must be at least 3 characters')
  .max(30, 'Handle must be 30 characters or less')
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    'Handle must be lowercase, start and end with a letter or number, and contain only letters, numbers, and hyphens'
  );

// Space name validation
export const SpaceNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be 100 characters or less')
  .trim();

// Space description validation
export const SpaceDescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or less')
  .optional();

// Create space input
export const CreateSpaceInputSchema = z.object({
  name: SpaceNameSchema,
  handle: SpaceHandleSchema.optional(),
  description: SpaceDescriptionSchema,
  category: SpaceCategorySchema,
  visibility: SpaceVisibilitySchema.default('public'),
  coverImageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  campusId: z.string().min(1),
});
export type CreateSpaceInput = z.infer<typeof CreateSpaceInputSchema>;

// Update space input
export const UpdateSpaceInputSchema = z.object({
  name: SpaceNameSchema.optional(),
  description: SpaceDescriptionSchema,
  category: SpaceCategorySchema.optional(),
  visibility: SpaceVisibilitySchema.optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  iconUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  settings: z.object({
    allowMemberInvites: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    showMemberCount: z.boolean().optional(),
    enableChat: z.boolean().optional(),
    enableEvents: z.boolean().optional(),
    enableResources: z.boolean().optional(),
  }).optional(),
});
export type UpdateSpaceInput = z.infer<typeof UpdateSpaceInputSchema>;

// Space member input
export const SpaceMemberInputSchema = z.object({
  userId: z.string().min(1),
  role: MemberRoleSchema.default('member'),
  joinedAt: z.date().optional(),
});
export type SpaceMemberInput = z.infer<typeof SpaceMemberInputSchema>;

// Full space entity schema (for reading from DB)
export const SpaceSchema = z.object({
  id: z.string(),
  name: SpaceNameSchema,
  handle: SpaceHandleSchema.optional(),
  slug: z.string().optional(), // Legacy field
  description: z.string().optional(),
  category: SpaceCategorySchema,
  status: SpaceStatusSchema,
  visibility: SpaceVisibilitySchema,
  coverImageUrl: z.string().url().optional(),
  iconUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  campusId: z.string(),
  ownerId: z.string(),
  memberCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  settings: z.object({
    allowMemberInvites: z.boolean(),
    requireApproval: z.boolean(),
    showMemberCount: z.boolean(),
    enableChat: z.boolean(),
    enableEvents: z.boolean(),
    enableResources: z.boolean(),
  }).optional(),
});
export type Space = z.infer<typeof SpaceSchema>;
