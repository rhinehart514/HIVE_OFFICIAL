/**
 * Profile API utilities
 *
 * Client-side utilities for profile management.
 */

import { secureApiFetch } from './secure-auth-utils';

export interface PrivacySettings {
  profileVisibility: 'public' | 'campus' | 'private';
  showEmail: boolean;
  showGraduationYear: boolean;
  showMajor: boolean;
  showSpaces: boolean;
  showActivity: boolean;
  allowDirectMessages: boolean;
  allowConnectionRequests: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  major?: string;
  graduationYear?: number;
  interests?: string[];
  privacySettings?: Partial<PrivacySettings>;
}

/**
 * Update user privacy settings
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
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to update privacy settings');
  }
}

/**
 * Get user profile
 */
export async function getProfile(userId: string): Promise<Record<string, unknown> | null> {
  const response = await secureApiFetch(`/api/profile/${userId}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<void> {
  const response = await secureApiFetch(`/api/profile/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to update profile');
  }
}

export default {
  updatePrivacySettings,
  getProfile,
  updateProfile,
};
