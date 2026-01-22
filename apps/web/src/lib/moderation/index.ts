/**
 * Content Moderation Module
 *
 * Re-exports types and service for modular imports.
 */

// Export all types
export * from './types';

// Re-export the main service
// This maintains backwards compatibility with existing imports
export { ContentModerationService, contentModerationService } from '../content-moderation-service';
