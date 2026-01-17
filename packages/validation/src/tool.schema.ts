import { z } from 'zod';

/**
 * Tool Validation Schemas
 *
 * Validates HiveLab tool data including creation, updates, and deployments.
 */

// Tool status
export const ToolStatusSchema = z.enum(['draft', 'published', 'archived', 'suspended']);
export type ToolStatus = z.infer<typeof ToolStatusSchema>;

// Tool visibility
export const ToolVisibilitySchema = z.enum(['private', 'unlisted', 'public']);
export type ToolVisibility = z.infer<typeof ToolVisibilitySchema>;

// Tool category
export const ToolCategorySchema = z.enum([
  'productivity',
  'social',
  'academic',
  'creative',
  'utility',
  'fun',
  'other',
]);
export type ToolCategory = z.infer<typeof ToolCategorySchema>;

// Tool name validation
export const ToolNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name must be 60 characters or less')
  .trim();

// Tool description validation
export const ToolDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(500, 'Description must be 500 characters or less');

// Tool prompt validation
export const ToolPromptSchema = z
  .string()
  .min(20, 'Prompt must be at least 20 characters')
  .max(2000, 'Prompt must be 2000 characters or less');

// Input field schema
export const ToolInputFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  type: z.enum(['text', 'textarea', 'number', 'select', 'checkbox', 'date']),
  label: z.string().min(1).max(100),
  placeholder: z.string().max(200).optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select type
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});
export type ToolInputField = z.infer<typeof ToolInputFieldSchema>;

// Tool schema (the tool's input configuration)
export const ToolInputSchemaSchema = z.object({
  fields: z.array(ToolInputFieldSchema).max(20),
  submitLabel: z.string().max(50).default('Generate'),
});
export type ToolInputSchema = z.infer<typeof ToolInputSchemaSchema>;

// Variant schema (A/B testing)
export const ToolVariantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  prompt: ToolPromptSchema,
  isActive: z.boolean().default(true),
  weight: z.number().min(0).max(100).default(100),
});
export type ToolVariant = z.infer<typeof ToolVariantSchema>;

// Create tool input
export const CreateToolInputSchema = z.object({
  name: ToolNameSchema,
  description: ToolDescriptionSchema,
  prompt: ToolPromptSchema,
  category: ToolCategorySchema.default('other'),
  visibility: ToolVisibilitySchema.default('private'),
  iconEmoji: z.string().max(4).optional(),
  inputSchema: ToolInputSchemaSchema.optional(),
  campusId: z.string().min(1),
});
export type CreateToolInput = z.infer<typeof CreateToolInputSchema>;

// Update tool input
export const UpdateToolInputSchema = z.object({
  name: ToolNameSchema.optional(),
  description: ToolDescriptionSchema.optional(),
  prompt: ToolPromptSchema.optional(),
  category: ToolCategorySchema.optional(),
  visibility: ToolVisibilitySchema.optional(),
  status: ToolStatusSchema.optional(),
  iconEmoji: z.string().max(4).optional(),
  inputSchema: ToolInputSchemaSchema.optional(),
  variants: z.array(ToolVariantSchema).max(5).optional(),
});
export type UpdateToolInput = z.infer<typeof UpdateToolInputSchema>;

// Tool deployment input
export const DeployToolInputSchema = z.object({
  toolId: z.string().min(1),
  spaceId: z.string().min(1),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    order: z.number().int().optional(),
  }).optional(),
});
export type DeployToolInput = z.infer<typeof DeployToolInputSchema>;

// Full tool entity schema (for reading from DB)
export const ToolSchema = z.object({
  id: z.string(),
  name: ToolNameSchema,
  description: z.string(),
  prompt: z.string(),
  category: ToolCategorySchema,
  status: ToolStatusSchema,
  visibility: ToolVisibilitySchema,
  iconEmoji: z.string().optional(),
  inputSchema: ToolInputSchemaSchema.optional(),
  variants: z.array(ToolVariantSchema).optional(),
  ownerId: z.string(),
  campusId: z.string(),
  usageCount: z.number().int().nonnegative().default(0),
  deploymentCount: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  publishedAt: z.date().optional(),
});
export type Tool = z.infer<typeof ToolSchema>;
