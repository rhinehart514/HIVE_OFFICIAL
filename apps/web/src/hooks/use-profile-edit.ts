"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { profileApiResponseToProfileSystem, type ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import type { ProfileSystem } from '@hive/core';
import { useAuth } from '@hive/auth-logic';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { GhostModeLevel, GhostModeDurationValue } from '@/lib/ghost-mode-constants';
import { sanitizeProfileData, sanitizeTag } from '@/lib/sanitize';

// ============================================
// TYPES
// ============================================

export interface GhostModeState {
  enabled: boolean;
  level: GhostModeLevel;
  expiresAt: Date | null;
}

export interface UseProfileEditReturn {
  // State
  profileData: ProfileV2ApiResponse | null;
  profileSystem: ProfileSystem | null;
  isLoading: boolean;
  isSaving: boolean;
  hasPendingChanges: boolean;
  showDiscardConfirm: boolean;
  currentUser: ReturnType<typeof useAuth>['user'];
  sessionLoading: boolean;

  // Editable fields
  displayName: string;
  bio: string;
  major: string;
  interests: string[];
  newInterest: string;
  isUploadingAvatar: boolean;

  // Ghost Mode
  isGhostModeModalOpen: boolean;
  ghostModeState: GhostModeState | undefined;

  // Computed
  initials: string;

  // Actions
  setDisplayName: (value: string) => void;
  setBio: (value: string) => void;
  setMajor: (value: string) => void;
  setNewInterest: (value: string) => void;
  setShowDiscardConfirm: (value: boolean) => void;
  setIsGhostModeModalOpen: (value: boolean) => void;
  setProfileSystem: React.Dispatch<React.SetStateAction<ProfileSystem | null>>;
  setHasPendingChanges: (value: boolean) => void;

  // Handlers
  handleSaveLayout: () => Promise<void>;
  handleDone: () => Promise<void>;
  handleCancel: () => void;
  handleAddInterest: () => void;
  handleRemoveInterest: (interest: string) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleActivateGhostMode: (level: GhostModeLevel, durationMinutes: GhostModeDurationValue) => Promise<boolean>;
  handleDeactivateGhostMode: () => Promise<boolean>;

  // Navigation
  router: ReturnType<typeof useRouter>;
}

// ============================================
// HOOK
// ============================================

export function useProfileEdit(): UseProfileEditReturn {
  const router = useRouter();
  const { user: currentUser, isLoading: sessionLoading } = useAuth();
  const { toast } = useToast();

  // Core state
  const [profileData, setProfileData] = useState<ProfileV2ApiResponse | null>(null);
  const [profileSystem, setProfileSystem] = useState<ProfileSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Editable profile fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Ghost Mode state
  const [isGhostModeModalOpen, setIsGhostModeModalOpen] = useState(false);
  const [ghostModeState, setGhostModeState] = useState<GhostModeState | undefined>(undefined);

  // Compute initials for avatar fallback
  const initials = useMemo(() => {
    if (!profileData?.profile.fullName) return '';
    return profileData.profile.fullName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profileData?.profile.fullName]);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (sessionLoading) return;

      if (!currentUser?.id) {
        router.push('/enter');
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/profile/v2?id=${currentUser.id}`, {
          credentials: 'include',
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to load profile');
        }

        const payload = json.data as ProfileV2ApiResponse;
        setProfileData(payload);
        setProfileSystem(profileApiResponseToProfileSystem(payload));
        setHasPendingChanges(false);

        // Initialize editable fields
        setDisplayName(payload.profile.fullName || '');
        setBio(payload.profile.bio || '');
        setMajor(payload.profile.major || '');
        setInterests(payload.profile.interests || []);
      } catch (err) {
        logger.error('Failed to load profile for edit page', { component: 'useProfileEdit' }, err instanceof Error ? err : undefined);
        toast({
          title: 'Unable to load profile',
          description: 'Please refresh and try again.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.id, sessionLoading, router, toast]);

  // Save layout handler
  const handleSaveLayout = useCallback(async () => {
    if (!profileSystem) return;
    try {
      setIsSaving(true);

      const sanitizedData = sanitizeProfileData({
        fullName: displayName,
        bio,
        major,
        interests,
      });

      const response = await fetch('/api/profile/v2', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid: profileSystem.grid,
          ...sanitizedData,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to save layout');
      }

      setHasPendingChanges(false);
      toast({ title: 'Changes saved', description: 'Your profile has been updated.', type: 'success' });
    } catch (err) {
      logger.error('Failed to save profile layout', { component: 'useProfileEdit' }, err instanceof Error ? err : undefined);
      toast({ title: 'Save failed', description: 'Please try again in a moment.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [profileSystem, displayName, bio, major, interests, toast]);

  const handleDone = useCallback(async () => {
    if (hasPendingChanges) {
      await handleSaveLayout();
    }
    router.push(`/profile/${currentUser?.id}`);
  }, [hasPendingChanges, handleSaveLayout, router, currentUser?.id]);

  const handleCancel = useCallback(() => {
    if (hasPendingChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    router.push(`/profile/${currentUser?.id}`);
  }, [hasPendingChanges, router, currentUser?.id]);

  // Interest handlers
  const handleAddInterest = useCallback(() => {
    const sanitized = sanitizeTag(newInterest);
    if (sanitized && !interests.includes(sanitized) && interests.length < 10) {
      setInterests([...interests, sanitized]);
      setNewInterest('');
      setHasPendingChanges(true);
    }
  }, [newInterest, interests]);

  const handleRemoveInterest = useCallback((interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
    setHasPendingChanges(true);
  }, [interests]);

  // Avatar upload handler
  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 5MB.', type: 'error' });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload avatar');
      }

      setProfileData((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, avatarUrl: json.avatarUrl } } : prev
      );
      toast({ title: 'Avatar updated', type: 'success' });
    } catch (err) {
      logger.error('Failed to upload avatar', { component: 'useProfileEdit' }, err instanceof Error ? err : undefined);
      toast({ title: 'Upload failed', description: 'Please try again.', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [toast]);

  // Ghost Mode handlers
  const handleActivateGhostMode = useCallback(async (level: GhostModeLevel, durationMinutes: GhostModeDurationValue): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile/ghost-mode', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, durationMinutes }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to activate Ghost Mode');
      }

      setGhostModeState({
        enabled: true,
        level,
        expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      });

      toast({ title: 'Ghost Mode activated', description: `You're now in ${level} mode.`, type: 'success' });
      return true;
    } catch (err) {
      logger.error('Failed to activate Ghost Mode', { component: 'useProfileEdit' }, err instanceof Error ? err : undefined);
      toast({ title: 'Failed to activate Ghost Mode', description: 'Please try again.', type: 'error' });
      return false;
    }
  }, [toast]);

  const handleDeactivateGhostMode = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile/ghost-mode', {
        method: 'DELETE',
        credentials: 'include',
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to deactivate Ghost Mode');
      }

      setGhostModeState({ enabled: false, level: 'normal', expiresAt: null });
      toast({ title: 'Ghost Mode deactivated', description: "You're visible again.", type: 'success' });
      return true;
    } catch (err) {
      logger.error('Failed to deactivate Ghost Mode', { component: 'useProfileEdit' }, err instanceof Error ? err : undefined);
      toast({ title: 'Failed to deactivate Ghost Mode', description: 'Please try again.', type: 'error' });
      return false;
    }
  }, [toast]);

  // Field setters with change tracking
  const setDisplayNameWithTracking = useCallback((value: string) => {
    setDisplayName(value);
    setHasPendingChanges(true);
  }, []);

  const setBioWithTracking = useCallback((value: string) => {
    setBio(value);
    setHasPendingChanges(true);
  }, []);

  const setMajorWithTracking = useCallback((value: string) => {
    setMajor(value);
    setHasPendingChanges(true);
  }, []);

  return {
    // State
    profileData,
    profileSystem,
    isLoading,
    isSaving,
    hasPendingChanges,
    showDiscardConfirm,
    currentUser,
    sessionLoading,

    // Editable fields
    displayName,
    bio,
    major,
    interests,
    newInterest,
    isUploadingAvatar,

    // Ghost Mode
    isGhostModeModalOpen,
    ghostModeState,

    // Computed
    initials,

    // Actions
    setDisplayName: setDisplayNameWithTracking,
    setBio: setBioWithTracking,
    setMajor: setMajorWithTracking,
    setNewInterest,
    setShowDiscardConfirm,
    setIsGhostModeModalOpen,
    setProfileSystem,
    setHasPendingChanges,

    // Handlers
    handleSaveLayout,
    handleDone,
    handleCancel,
    handleAddInterest,
    handleRemoveInterest,
    handleAvatarUpload,
    handleActivateGhostMode,
    handleDeactivateGhostMode,

    // Navigation
    router,
  };
}
