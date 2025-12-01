/**
 * Profile API utilities
 */

export interface ProfileData {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  handle?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'campus' | 'connections';
  showEmail: boolean;
  showMajor: boolean;
  showGradYear: boolean;
  ghostMode: boolean;
}

/**
 * Fetch user profile
 */
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const response = await fetch(`/api/profile/${userId}`);
  if (!response.ok) return null;
  return response.json();
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  data: Partial<ProfileData>
): Promise<ProfileData | null> {
  const response = await fetch(`/api/profile/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * Fetch privacy settings
 */
export async function fetchPrivacySettings(userId: string): Promise<PrivacySettings | null> {
  const response = await fetch(`/api/profile/${userId}/privacy`);
  if (!response.ok) return null;
  return response.json();
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<PrivacySettings | null> {
  const response = await fetch(`/api/profile/${userId}/privacy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) return null;
  return response.json();
}
