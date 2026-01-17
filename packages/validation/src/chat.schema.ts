import { z } from 'zod';

/**
 * Chat Validation Schemas
 *
 * Validates chat messages, reactions, and related data.
 */

// Message type
export const MessageTypeSchema = z.enum(['text', 'image', 'file', 'system', 'announcement']);
export type MessageType = z.infer<typeof MessageTypeSchema>;

// Reaction emoji validation (standard emoji or custom)
export const ReactionEmojiSchema = z
  .string()
  .min(1)
  .max(8)
  .regex(/^[\p{Emoji}\p{Emoji_Component}]+$|^:[a-z0-9_-]+:$/u, 'Invalid emoji format');

// Message content validation - prevents XSS and limits size
export const MessageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(4000, 'Message must be 4000 characters or less')
  .transform((val) => {
    // Basic XSS prevention - strip HTML tags
    return val.replace(/<[^>]*>/g, '');
  });

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'file', 'link']),
  url: z.string().url(),
  name: z.string().max(255).optional(),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(), // Max 50MB
  thumbnailUrl: z.string().url().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

// Send message input
export const SendMessageInputSchema = z.object({
  spaceId: z.string().min(1),
  content: MessageContentSchema,
  type: MessageTypeSchema.default('text'),
  replyTo: z.string().optional(), // Message ID being replied to
  attachments: z.array(AttachmentSchema).max(10).optional(),
  mentions: z.array(z.string()).optional(), // User IDs being mentioned
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

// Edit message input
export const EditMessageInputSchema = z.object({
  messageId: z.string().min(1),
  content: MessageContentSchema,
});
export type EditMessageInput = z.infer<typeof EditMessageInputSchema>;

// Add reaction input
export const AddReactionInputSchema = z.object({
  messageId: z.string().min(1),
  emoji: ReactionEmojiSchema,
});
export type AddReactionInput = z.infer<typeof AddReactionInputSchema>;

// Pin message input
export const PinMessageInputSchema = z.object({
  messageId: z.string().min(1),
  reason: z.string().max(200).optional(),
});
export type PinMessageInput = z.infer<typeof PinMessageInputSchema>;

// Message author schema (denormalized)
export const MessageAuthorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().optional(),
  handle: z.string().optional(),
});
export type MessageAuthor = z.infer<typeof MessageAuthorSchema>;

// Reaction schema
export const ReactionSchema = z.object({
  emoji: ReactionEmojiSchema,
  userIds: z.array(z.string()),
  count: z.number().int().nonnegative(),
});
export type Reaction = z.infer<typeof ReactionSchema>;

// Full message entity schema (for reading from DB)
export const MessageSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  content: z.string(),
  type: MessageTypeSchema,
  author: MessageAuthorSchema,
  replyTo: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  mentions: z.array(z.string()).optional(),
  reactions: z.array(ReactionSchema).optional(),
  isPinned: z.boolean().default(false),
  pinnedBy: z.string().optional(),
  pinnedAt: z.date().optional(),
  isEdited: z.boolean().default(false),
  editedAt: z.date().optional(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

// Search messages input
export const SearchMessagesInputSchema = z.object({
  spaceId: z.string().min(1),
  query: z.string().min(2).max(100),
  limit: z.number().int().min(1).max(100).default(20),
  before: z.date().optional(),
  after: z.date().optional(),
});
export type SearchMessagesInput = z.infer<typeof SearchMessagesInputSchema>;
