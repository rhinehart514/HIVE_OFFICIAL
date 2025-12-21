"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { secureApiFetch } from "@/lib/secure-auth-utils";

/**
 * SpaceMetadataContext
 *
 * Focused context for space basic info and membership state.
 * Re-renders only when space data or membership changes.
 */

// ============================================================
// Types
// ============================================================

export type MemberRole = "owner" | "admin" | "moderator" | "member";

export interface SpaceDetailDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  slug?: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineCount?: number;
  isVerified: boolean;
  isActive: boolean;
  visibility: "public" | "private";
  settings?: {
    allowRSS: boolean;
    requireApproval: boolean;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
}

export interface SpaceMembership {
  isMember: boolean;
  isLeader: boolean;
  role?: MemberRole;
  status?: "active" | "pending" | "invited" | "banned";
  joinedAt?: string;
}

export interface SpaceMetadataContextValue {
  space: SpaceDetailDTO | null;
  spaceId: string;
  membership: SpaceMembership;
  isLoading: boolean;
  error: string | null;
  joinSpace: () => Promise<boolean>;
  leaveSpace: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const SpaceMetadataCtx = createContext<SpaceMetadataContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceMetadataProviderProps {
  spaceId: string;
  children: ReactNode;
}

export function SpaceMetadataProvider({
  spaceId,
  children,
}: SpaceMetadataProviderProps) {
  const [space, setSpace] = useState<SpaceDetailDTO | null>(null);
  const [membership, setMembership] = useState<SpaceMembership>({
    isMember: false,
    isLeader: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState(false);

  const fetchSpace = useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      const response = await res.json();
      const data = response.data || response;

      const spaceData: SpaceDetailDTO = {
        id: data.id || spaceId,
        name: data.name,
        description: data.description || "",
        category: data.category || "club",
        slug: data.slug,
        iconUrl: data.iconUrl || data.icon,
        bannerUrl: data.bannerUrl || data.banner,
        memberCount: data.memberCount || 0,
        onlineCount: data.onlineCount,
        isVerified: data.isVerified || false,
        isActive: data.isActive !== false,
        visibility: data.visibility || "public",
        settings: data.settings,
        creator: data.creator,
        createdAt: data.createdAt,
      };
      setSpace(spaceData);

      const membershipInfo = data.membership || {};
      const rawRole = (membershipInfo.role || data.membershipRole || "").toLowerCase();
      const rawStatus = (membershipInfo.status || data.membershipStatus || "").toLowerCase();

      const validRoles: MemberRole[] = ["owner", "admin", "moderator", "member"];
      const validStatuses: NonNullable<SpaceMembership["status"]>[] = [
        "active",
        "pending",
        "invited",
        "banned",
      ];

      const role: MemberRole | undefined = validRoles.includes(rawRole as MemberRole)
        ? (rawRole as MemberRole)
        : undefined;
      const status: SpaceMembership["status"] | undefined = validStatuses.includes(
        rawStatus as NonNullable<SpaceMembership["status"]>
      )
        ? (rawStatus as SpaceMembership["status"])
        : undefined;

      const isMember = Boolean(
        data.isMember ||
          membershipInfo.isActive ||
          ["active", "joined"].includes(rawStatus)
      );
      const isLeader = Boolean(
        ["owner", "leader", "admin", "moderator"].includes(rawRole) ||
          membershipInfo.isLeader
      );

      setMembership({
        isMember,
        isLeader,
        role,
        status,
        joinedAt: membershipInfo.joinedAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load space");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  const joinSpace = useCallback(async (): Promise<boolean> => {
    if (!space || isJoiningOrLeaving) return false;

    setIsJoiningOrLeaving(true);
    const previousMemberCount = space.memberCount;
    setMembership((prev) => ({ ...prev, isMember: true, role: "member" as MemberRole }));
    setSpace((prev) => (prev ? { ...prev, memberCount: previousMemberCount + 1 } : prev));

    try {
      const res = await secureApiFetch("/api/spaces/join-v2", {
        method: "POST",
        body: JSON.stringify({ spaceId }),
      });

      if (res.ok) {
        await fetchSpace();
        return true;
      }

      setMembership((prev) => ({ ...prev, isMember: false, role: undefined }));
      setSpace((prev) => (prev ? { ...prev, memberCount: previousMemberCount } : prev));
      return false;
    } catch {
      setMembership((prev) => ({ ...prev, isMember: false, role: undefined }));
      setSpace((prev) => (prev ? { ...prev, memberCount: previousMemberCount } : prev));
      return false;
    } finally {
      setIsJoiningOrLeaving(false);
    }
  }, [space, spaceId, fetchSpace, isJoiningOrLeaving]);

  const leaveSpace = useCallback(async (): Promise<boolean> => {
    if (!space || isJoiningOrLeaving) return false;

    if (membership.role === "owner") {
      setError("Owners must transfer ownership before leaving");
      return false;
    }

    setIsJoiningOrLeaving(true);
    const previousMemberCount = space.memberCount;
    const previousMembership = { ...membership };
    setMembership({ isMember: false, isLeader: false });
    setSpace((prev) =>
      prev ? { ...prev, memberCount: Math.max(0, previousMemberCount - 1) } : prev
    );

    try {
      const res = await secureApiFetch("/api/spaces/leave", {
        method: "POST",
        body: JSON.stringify({ spaceId }),
      });

      if (res.ok) {
        return true;
      }

      setMembership(previousMembership);
      setSpace((prev) => (prev ? { ...prev, memberCount: previousMemberCount } : prev));
      return false;
    } catch {
      setMembership(previousMembership);
      setSpace((prev) => (prev ? { ...prev, memberCount: previousMemberCount } : prev));
      return false;
    } finally {
      setIsJoiningOrLeaving(false);
    }
  }, [space, spaceId, membership, isJoiningOrLeaving]);

  const refresh = useCallback(async () => {
    await fetchSpace();
  }, [fetchSpace]);

  useEffect(() => {
    void fetchSpace();
  }, [fetchSpace]);

  const value = useMemo<SpaceMetadataContextValue>(
    () => ({
      space,
      spaceId,
      membership,
      isLoading,
      error,
      joinSpace,
      leaveSpace,
      refresh,
    }),
    [space, spaceId, membership, isLoading, error, joinSpace, leaveSpace, refresh]
  );

  return (
    <SpaceMetadataCtx.Provider value={value}>{children}</SpaceMetadataCtx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSpaceMetadata(): SpaceMetadataContextValue {
  const ctx = useContext(SpaceMetadataCtx);
  if (!ctx) {
    throw new Error("useSpaceMetadata must be used within SpaceContextProvider");
  }
  return ctx;
}

export function useOptionalSpaceMetadata(): SpaceMetadataContextValue | null {
  return useContext(SpaceMetadataCtx);
}
