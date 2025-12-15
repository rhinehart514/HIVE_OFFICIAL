/**
 * Profile API utilities
 *
 * Client-side API helpers for profile-related operations.
 */

import { secureApiFetch } from './secure-auth-utils';

export interface PrivacySettings {
  profileVisibility: 'public' | 'campus' | 'private';
  showEmail?: boolean;
  showSpaces?: boolean;
  showActivity?: boolean;
  allowDirectMessages?: boolean;
}

/**
 * Update user privacy settings
 *
 * @param userId - User ID
 * @param settings - Partial privacy settings to update
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<void> {
  const response = await secureApiFetch(`/api/users/${userId}/privacy`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update privacy settings');
  }
}

/**
 * Get user privacy settings
 *
 * @param userId - User ID
 * @returns Privacy settings
 */
export async function getPrivacySettings(
  userId: string
): Promise<PrivacySettings> {
  const response = await secureApiFetch(`/api/users/${userId}/privacy`);

  if (!response.ok) {
    throw new Error('Failed to fetch privacy settings');
  }

  const data = await response.json();
  return data.data || data;
}
