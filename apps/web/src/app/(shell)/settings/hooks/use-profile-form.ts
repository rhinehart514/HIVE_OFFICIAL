'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@hive/ui';
import { sanitizeDisplayName, sanitizeBio, sanitizeHandle } from '@/lib/sanitize';

interface ProfileFormData {
  fullName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
}

export function useProfileForm(profile: unknown) {
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    handle: '',
    bio: '',
    avatarUrl: '',
  });
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>({
    fullName: '',
    handle: '',
    bio: '',
    avatarUrl: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form data from profile
  useEffect(() => {
    if (!profile) return;
    const profileData = profile as {
      identity?: { fullName?: string; handle?: string; bio?: string; profileImageUrl?: string };
      avatarUrl?: string;
    };
    if (!profileData.identity) return;

    const identity = profileData.identity;
    const data = {
      fullName: identity.fullName || '',
      handle: identity.handle || '',
      bio: identity.bio || '',
      avatarUrl: identity.profileImageUrl || profileData.avatarUrl || '',
    };
    setFormData(data);
    setOriginalFormData(data);
  }, [profile]);

  // Track form changes
  useEffect(() => {
    const formChanged =
      formData.fullName !== originalFormData.fullName ||
      formData.handle !== originalFormData.handle ||
      formData.bio !== originalFormData.bio ||
      formData.avatarUrl !== originalFormData.avatarUrl;
    setHasChanges(formChanged);
  }, [formData, originalFormData]);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      // Sanitize all user input before saving
      const sanitizedFullName = sanitizeDisplayName(formData.fullName);
      const sanitizedBio = sanitizeBio(formData.bio);
      const sanitizedHandle = sanitizeHandle(formData.handle);

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: sanitizedFullName,
          bio: sanitizedBio,
          ...(formData.handle !== originalFormData.handle && { handle: sanitizedHandle }),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setOriginalFormData(formData);
      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [formData, originalFormData]);

  return {
    formData,
    setFormData,
    hasChanges,
    isSaving,
    handleSaveProfile,
  };
}
