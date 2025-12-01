"use client";

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import type { PresenceStatus } from "@hive/ui";
import { useAuth } from "@hive/auth-logic";
import { logger } from "@/lib/logger";

type HiveProfileStub = {
  id?: string;
  userId?: string;
  campusId?: string;
  handle?: string;

  // Top-level backward compatibility
  fullName?: string;
  avatarUrl?: string;

  identity?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    handle?: string;
    email?: string;
  };
  academic?: {
    major?: string;
    academicYear?: string;
    graduationYear?: number;
    schoolId?: string;
    housing?: string;
    pronouns?: string;
    minors?: string[];
  };
  personal?: {
    bio?: string;
    statusMessage?: string;
    location?: string;
    interests?: string[];
  };
  builder?: {
    isBuilder?: boolean;
    builderOptIn?: boolean;
    builderLevel?: string;
    specializations?: string[];
    toolsCreated?: number;
  };
  verification?: {
    emailVerified?: boolean;
    profileVerified?: boolean;
    onboardingCompleted?: boolean;
    campusVerified?: boolean;
    verifiedAt?: Date;
  };
  privacy?: Record<string, unknown>;
};

type Ctx = {
  presenceStatus: PresenceStatus;
  isGhostMode: boolean;
  hiveProfile: HiveProfileStub | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updateProfile: (update: Record<string, unknown>) => Promise<void>;
  toggleGhostMode: (enabled: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileCtx = createContext<Ctx | null>(null);

export function ProfileContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("offline");
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [hiveProfile, setHiveProfile] = useState<HiveProfileStub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data from API
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.uid) {
      setHiveProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/v2');

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load profile');
      }

      const profile = data.data?.profile || data.data;
      const privacy = data.data?.privacy || {};

      // Map API response to HiveProfileStub format
      const mappedProfile: HiveProfileStub = {
        id: profile.id,
        userId: profile.id,
        campusId: profile.campusId,
        handle: profile.handle,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        identity: {
          id: profile.id,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          handle: profile.handle,
          email: profile.email,
        },
        academic: {
          major: profile.major,
          graduationYear: profile.graduationYear,
          pronouns: profile.pronouns,
        },
        personal: {
          bio: profile.bio,
          interests: profile.interests || [],
        },
        builder: {
          builderOptIn: profile.builderOptIn,
          toolsCreated: data.data?.stats?.toolsCreated || 0,
        },
        verification: {
          onboardingCompleted: profile.onboardingComplete !== false,
        },
        privacy: privacy,
      };

      setHiveProfile(mappedProfile);

      // Update presence and ghost mode from response
      const presence = profile.presence || data.data?.presence;
      if (presence) {
        setPresenceStatus(presence.status || 'offline');
        setIsGhostMode(presence.isGhostMode || false);
      }

      // Also check privacy settings for ghost mode
      if (privacy?.profileLevel === 'private' || privacy?.ghostMode) {
        setIsGhostMode(true);
      }

      logger.debug('Profile loaded in context', { userId: profile.id, handle: profile.handle });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      logger.error('ProfileContext fetch error', { error: { error: message } });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.uid]);

  // Fetch profile when auth state changes
  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  // Update profile via API
  const updateProfile = useCallback(async (update: Record<string, unknown>) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/v2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      logger.info('Profile updated via context', { fields: Object.keys(update) });

      // Refresh profile data after update
      await fetchProfile();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      logger.error('ProfileContext update error', { error: { error: message } });
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, fetchProfile]);

  // Toggle ghost mode (privacy setting)
  const toggleGhostMode = useCallback(async (enabled: boolean) => {
    try {
      await updateProfile({
        privacy: {
          ghostMode: enabled,
          level: enabled ? 'private' : 'campus',
        },
      });
      setIsGhostMode(enabled);
      logger.info('Ghost mode toggled', { enabled });
    } catch (err) {
      logger.error('Failed to toggle ghost mode', { error: { error: err instanceof Error ? err.message : String(err) } });
      throw err;
    }
  }, [updateProfile]);

  // Refresh profile manually
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const value = useMemo(
    () => ({
      presenceStatus,
      isGhostMode,
      hiveProfile,
      isLoading: isLoading || authLoading,
      isUpdating,
      error,
      updateProfile,
      toggleGhostMode,
      refreshProfile,
    }),
    [presenceStatus, isGhostMode, hiveProfile, isLoading, authLoading, isUpdating, error, updateProfile, toggleGhostMode, refreshProfile],
  );

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfileContext() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfileContext must be used within ProfileContextProvider");
  return ctx;
}
