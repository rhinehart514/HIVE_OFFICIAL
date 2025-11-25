"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { PresenceStatus } from "@hive/ui";

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
  updateProfile: (update: Record<string, unknown>) => Promise<void>;
  toggleGhostMode: (enabled: boolean) => Promise<void>;
};

const ProfileCtx = createContext<Ctx | null>(null);

export function ProfileContextProvider({ children }: { children: React.ReactNode }) {
  const [presenceStatus] = useState<PresenceStatus>("offline");
  const [isGhostMode] = useState(false);
  const [hiveProfile] = useState<HiveProfileStub | null>(null);
  const [isLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (_update: Record<string, unknown>) => {
    // Minimal no-op implementation to satisfy consumers
    setIsUpdating(true);
    try {
      await Promise.resolve();
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleGhostMode = async (_enabled: boolean) => {
    await Promise.resolve();
  };

  const value = useMemo(
    () => ({ presenceStatus, isGhostMode, hiveProfile, isLoading, isUpdating, updateProfile, toggleGhostMode }),
    [presenceStatus, isGhostMode, hiveProfile, isLoading, isUpdating],
  );

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfileContext() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfileContext must be used within ProfileContextProvider");
  return ctx;
}
