import { useState, useCallback } from 'react';
import { updatePrivacySettings as updateSettings, type PrivacySettings } from '../lib/profile-api';
import { useAuth } from '@hive/auth-logic';

interface UsePrivacySettingsReturn {
  isLoading: boolean;
  error: string | null;
  updatePrivacySettings: (_settings: Partial<PrivacySettings>) => Promise<boolean>;
  togglePublicProfile: (_isPublic: boolean) => Promise<boolean>;
  clearError: () => void;
}

export function usePrivacySettings(): UsePrivacySettingsReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updatePrivacySettings = useCallback(async (settings: Partial<PrivacySettings>): Promise<boolean> => {
    if (!user?.uid) {
      setError('Not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      await updateSettings(user.uid, settings);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update privacy settings';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const togglePublicProfile = useCallback(async (isPublic: boolean): Promise<boolean> => {
    return updatePrivacySettings({ profileVisibility: isPublic ? 'public' : 'campus' });
  }, [updatePrivacySettings]);

  return {
    isLoading,
    error,
    updatePrivacySettings,
    togglePublicProfile,
    clearError,
  };
}