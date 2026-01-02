/**
 * Input sanitization utilities for XSS prevention
 *
 * These functions should be used for all user-generated content
 * before storing in the database or rendering in the UI.
 */

/**
 * Escape HTML entities to prevent XSS attacks
 * Replaces dangerous characters with their HTML entity equivalents
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Strip HTML tags from a string
 * Use this for plain text fields that should never contain HTML
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for display and storage
 * - Strips HTML tags
 * - Trims whitespace
 * - Normalizes whitespace (no multiple spaces)
 * - Limits length
 */
export function sanitizeText(
  str: string,
  options: {
    maxLength?: number;
    preserveNewlines?: boolean;
  } = {}
): string {
  const { maxLength, preserveNewlines = false } = options;

  let result = str;

  // Strip HTML tags
  result = stripHtml(result);

  // Trim leading/trailing whitespace
  result = result.trim();

  // Normalize internal whitespace
  if (preserveNewlines) {
    // Preserve newlines but normalize other whitespace
    result = result.replace(/[^\S\n]+/g, ' ');
    // Limit consecutive newlines to 2
    result = result.replace(/\n{3,}/g, '\n\n');
  } else {
    // Replace all whitespace with single spaces
    result = result.replace(/\s+/g, ' ');
  }

  // Limit length if specified
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

/**
 * Sanitize a display name
 * - Max 100 characters
 * - No HTML
 * - Single line only
 */
export function sanitizeDisplayName(str: string): string {
  return sanitizeText(str, { maxLength: 100 });
}

/**
 * Sanitize a bio/description
 * - Max 500 characters
 * - No HTML
 * - Preserves line breaks (max 2 consecutive)
 */
export function sanitizeBio(str: string): string {
  return sanitizeText(str, { maxLength: 500, preserveNewlines: true });
}

/**
 * Sanitize a tag/interest
 * - Max 50 characters
 * - No HTML
 * - Single line
 * - Lowercase for consistency
 */
export function sanitizeTag(str: string): string {
  return sanitizeText(str, { maxLength: 50 }).toLowerCase();
}

/**
 * Sanitize a handle/username
 * - Only alphanumeric and underscores
 * - Lowercase
 * - Max 30 characters
 */
export function sanitizeHandle(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

/**
 * Batch sanitize an array of strings (e.g., interests)
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => sanitizeTag(tag))
    .filter((tag) => tag.length > 0)
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // dedupe
}

/**
 * Profile data sanitization - sanitize all user-editable profile fields
 */
export function sanitizeProfileData(data: {
  fullName?: string;
  bio?: string;
  major?: string;
  interests?: string[];
}): {
  fullName?: string;
  bio?: string;
  major?: string;
  interests?: string[];
} {
  return {
    ...(data.fullName !== undefined && { fullName: sanitizeDisplayName(data.fullName) }),
    ...(data.bio !== undefined && { bio: sanitizeBio(data.bio) }),
    ...(data.major !== undefined && { major: sanitizeText(data.major, { maxLength: 100 }) }),
    ...(data.interests !== undefined && { interests: sanitizeTags(data.interests) }),
  };
}
