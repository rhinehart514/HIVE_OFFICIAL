/**
 * Profile API Client
 *
 * Provides API functions for managing user profiles and privacy settings.
 */

import { secureApiFetch } from './secure-auth-utils';

export interface PrivacySettings {
  profileVisibility: 'public' | 'campus' | 'private';
  showActivity: boolean;
  showConnections: boolean;
  showSpaces: boolean;
  hideActivity?: boolean;
}

/**
 * Update privacy settings for a user
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<void> {
  const response = await secureApiFetch(`/api/profile/${userId}/privacy`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update privacy settings');
  }
}

/**
 * Get privacy settings for a user
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const response = await secureApiFetch(`/api/profile/${userId}/privacy`);

  if (!response.ok) {
    throw new Error('Failed to get privacy settings');
  }

  const data = await response.json();
  return data.settings || data;
}
