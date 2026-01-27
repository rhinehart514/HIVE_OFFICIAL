/**
 * useProfilePageState - Unified state management for Profile Page
 *
 * Extracts all state, data fetching, subscriptions, and handlers.
 * Updated to support new design-system profile components.
 *
 * @author HIVE Frontend Team
 */

'use client';

import * as React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { db } from '@hive/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { profileApiResponseToProfileSystem, type ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import type { ProfileSystem, BentoGridLayout, PresenceData } from '@hive/core';
import type {
  FeatureKey,
  ProfileToolItem,
  ProfileToolModalData,
  ProfileHeroUser,
  ProfileHeroPresence,
  ProfileHeroBadges,
  ProfileSpace,
  ProfileTool,
  ProfileConnection,
  ActivityContribution,
} from '@hive/ui';

// ============================================================================
// Types
// ============================================================================

/** Event organized by the profile user */
export interface ProfileOrganizingEvent {
  id: string;
  title: string;
  date: string;
  dateDisplay: string;
  location: string;
  emoji?: string;
  attendeeCount: number;
  type: string;
  spaceId: string | null;
  spaceName: string | null;
}

export interface UseProfilePageStateReturn {
  // Navigation
  profileId: string;
  isOwnProfile: boolean;

  // Loading/Error
  isLoading: boolean;
  error: string | null;

  // Profile Data
  profileData: ProfileV2ApiResponse | null;
  profileSystem: ProfileSystem | null;
  initials: string;

  // Computed
  presenceStatus: string | undefined;
  isOnline: boolean;
  presenceText: string;
  primarySpace: ProfileV2ApiResponse['spaces'][0] | null;
  isSpaceLeader: boolean;
  spacesLed: ProfileV2ApiResponse['spaces'];
  statItems: Array<{ label: string; value: number; icon: React.ElementType }>;

  // Tools
  userTools: ProfileToolItem[];
  deployedTools: ProfileToolModalData[];
  selectedTool: ProfileToolModalData | null;

  // Notifications
  notifiedFeatures: FeatureKey[];
  isNotifySaving: boolean;

  // ============================================================================
  // NEW: Design System Component Data
  // ============================================================================

  /** Data for ProfileHero component */
  heroUser: ProfileHeroUser | null;
  heroPresence: ProfileHeroPresence;
  heroBadges: ProfileHeroBadges;

  /** Data for ProfileSpacesCard */
  profileSpaces: ProfileSpace[];

  /** Data for ProfileToolsCard */
  profileTools: ProfileTool[];

  /** Data for ProfileConnectionsCard */
  profileConnections: ProfileConnection[];
  totalConnections: number;

  /** Data for ProfileInterestsCard */
  interests: string[];
  sharedInterests: string[];

  /** Data for ContextBanner */
  sharedSpaceNames: string[];
  sharedSpacesCount: number;
  mutualFriendsCount: number;
  viewerIsBuilder: boolean;

  /** Data for ProfileActivityHeatmap */
  activityContributions: ActivityContribution[];
  totalActivityCount: number;
  currentStreak: number;

  /** Events the user is organizing */
  organizingEvents: ProfileOrganizingEvent[];

  // ============================================================================
  // Handlers
  // ============================================================================

  handleEditProfile: () => void;
  handleViewConnections: () => void;
  handleToolExpand: (tool: ProfileToolModalData) => void;
  handleToolModalClose: () => void;
  handleToolUpdateVisibility: (tool: ProfileToolModalData, visibility: string) => Promise<void>;
  handleToolRemove: (tool: ProfileToolModalData) => Promise<void>;
  handleLayoutChange: (layout: BentoGridLayout) => Promise<void>;
  handleNotifyFeature: (feature: FeatureKey) => Promise<void>;
  handleSpaceClick: (spaceId: string) => void;
  handleToolClick: (toolId: string) => void;
  handleConnect: () => void;
  handleMessage: () => void;
}

// ============================================================================
// Utilities
// ============================================================================

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return 'Just now';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useProfilePageState(): UseProfilePageStateReturn {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const rawProfileId = params.id as string;
  // Handle "me" route by substituting current user's ID
  const profileId = rawProfileId === 'me' && currentUser?.id ? currentUser.id : rawProfileId;

  // Core state
  const [profileData, setProfileData] = React.useState<ProfileV2ApiResponse | null>(null);
  const [profileSystem, setProfileSystem] = React.useState<ProfileSystem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Tools state
  const [userTools, setUserTools] = React.useState<ProfileToolItem[]>([]);
  const [deployedTools, setDeployedTools] = React.useState<ProfileToolModalData[]>([]);
  const [selectedTool, setSelectedTool] = React.useState<ProfileToolModalData | null>(null);

  // Notifications state
  const [notifiedFeatures, setNotifiedFeatures] = React.useState<FeatureKey[]>([]);
  const [isNotifySaving, setIsNotifySaving] = React.useState(false);

  // Events state
  const [organizingEvents, setOrganizingEvents] = React.useState<ProfileOrganizingEvent[]>([]);

  // Mutual connections state (from API)
  const [mutualConnectionsData, setMutualConnectionsData] = React.useState<{
    connections: Array<{ id: string; name: string; avatarUrl?: string }>;
    count: number;
  }>({ connections: [], count: 0 });

  const isOwnProfile = currentUser?.id === profileId;
  const hasProfileData = profileData !== null;

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch profile data
  React.useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      // Wait for profileId to resolve - if "me" we need currentUser
      if (!profileId || (rawProfileId === 'me' && !currentUser?.id)) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/profile/v2?id=${profileId}`, {
          credentials: 'include',
        });

        if (response.status === 404) {
          notFound();
          return;
        }

        if (response.status === 403) {
          setError('This profile is private');
          setIsLoading(false);
          return;
        }

        const json = await response.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to load profile');
        }

        if (cancelled) return;

        const payload = json.data as ProfileV2ApiResponse;
        setProfileData(payload);
        const system = profileApiResponseToProfileSystem(payload);
        setProfileSystem(system);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to load profile v2', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setIsLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [profileId, rawProfileId, currentUser?.id]);

  // Subscribe to presence updates
  React.useEffect(() => {
    if (!profileId || !hasProfileData || isOwnProfile) return;

    const presenceRef = doc(db, 'presence', profileId);
    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        const presence = snapshot.exists() ? (snapshot.data() as PresenceData) : null;
        setProfileData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            profile: {
              ...prev.profile,
              presence: {
                status: presence?.isGhostMode ? 'offline' : presence?.status ?? 'offline',
                lastSeen: presence?.lastSeen ? presence.lastSeen.toDate().toISOString() : prev.profile.presence?.lastSeen ?? null,
                isGhostMode: presence?.isGhostMode ?? prev.profile.presence?.isGhostMode ?? false,
              },
            },
          };
        });
      },
      (err) => {
        logger.error('Presence subscription error', { component: 'ProfilePageContent', profileId }, err);
      }
    );

    return () => unsubscribe();
  }, [profileId, isOwnProfile, hasProfileData]);

  // Fetch user's tools
  React.useEffect(() => {
    if (!profileId) return;

    const fetchTools = async () => {
      try {
        const response = await fetch(`/api/tools?userId=${profileId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          // API returns { success: true, data: { tools: [...] } }
          const tools = result.data?.tools || result.tools || [];
          if (tools.length > 0) {
            setUserTools(tools.map((tool: { id: string; name: string; deployments?: { spaceId: string }[]; usageCount?: number; status?: string; updatedAt?: string }) => ({
              id: tool.id,
              name: tool.name,
              deployedToSpaces: tool.deployments?.length ?? 0,
              usageCount: tool.usageCount ?? 0,
              status: tool.status ?? 'draft',
              lastUpdatedAt: tool.updatedAt,
            })));
          }
        }
      } catch (err) {
        logger.error('Failed to fetch tools', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
      }
    };

    fetchTools();
  }, [profileId]);

  // Fetch deployed tools
  React.useEffect(() => {
    if (!profileId) return;

    const fetchDeployedTools = async () => {
      try {
        const endpoint = isOwnProfile
          ? '/api/profile/tools'
          : `/api/profile?id=${profileId}&include=tools`;

        const response = await fetch(endpoint, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const tools = isOwnProfile
            ? data.tools
            : data.data?.deployedTools;

          if (tools && Array.isArray(tools)) {
            const mappedTools = tools.map((tool: Record<string, unknown>) => ({
              id: tool.id as string,
              toolId: tool.toolId as string,
              name: tool.name as string || 'Untitled Tool',
              description: tool.description as string | undefined,
              icon: tool.icon as string | undefined,
              deploymentId: tool.deploymentId as string || tool.id as string,
              isActive: tool.isActive !== false,
              config: tool.config as Record<string, unknown> | undefined,
              visibility: tool.visibility as 'public' | 'campus' | 'connections' | 'private' | undefined,
            }));
            setDeployedTools(mappedTools);

            setProfileSystem(prev => prev ? {
              ...prev,
              deployedTools: mappedTools,
            } : prev);
          }
        }
      } catch (err) {
        logger.error('Failed to fetch deployed tools', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
      }
    };

    fetchDeployedTools();
  }, [profileId, isOwnProfile]);

  // Fetch notified features
  React.useEffect(() => {
    if (!isOwnProfile || !currentUser?.id) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/profile/notify', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setNotifiedFeatures(data.subscribedFeatures || []);
        }
      } catch (err) {
        logger.error('Failed to fetch notifications', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
      }
    };

    fetchNotifications();
  }, [isOwnProfile, currentUser?.id]);

  // Fetch organizing events
  React.useEffect(() => {
    if (!profileId) return;

    const fetchOrganizingEvents = async () => {
      try {
        const response = await fetch(`/api/profile/${profileId}/events`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const events = result.data?.events || [];
          setOrganizingEvents(events);
        }
      } catch (err) {
        logger.error('Failed to fetch organizing events', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
      }
    };

    fetchOrganizingEvents();
  }, [profileId]);

  // Fetch mutual connections (when viewing another user's profile)
  React.useEffect(() => {
    if (!profileId || isOwnProfile) return;

    const fetchMutualConnections = async () => {
      try {
        const response = await fetch(`/api/profile/${profileId}/connections?type=mutual`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          // API returns { mutualConnections, mutualCount, totalConnections }
          const data = result.data || result;
          const mutualConnections = data.mutualConnections || [];
          setMutualConnectionsData({
            connections: mutualConnections.map((c: { id: string; firstName?: string; lastName?: string; handle?: string; profilePhoto?: string }) => ({
              id: c.id,
              name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.handle || 'Student',
              avatarUrl: c.profilePhoto,
            })),
            count: data.mutualCount ?? mutualConnections.length,
          });
        }
      } catch (err) {
        // Silently fail - mutual connections are optional enhancement
        logger.warn('Failed to fetch mutual connections', { component: 'ProfilePageContent', error: err instanceof Error ? err.message : String(err) });
      }
    };

    fetchMutualConnections();
  }, [profileId, isOwnProfile]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const initials = React.useMemo(() => {
    if (!profileData?.profile.fullName) return '';
    return getInitials(profileData.profile.fullName);
  }, [profileData?.profile.fullName]);

  const presenceStatus = profileData?.profile.presence?.status;
  const isOnline = presenceStatus === 'online';
  const presenceText = isOnline
    ? 'Online now'
    : presenceStatus === 'away'
    ? 'Away'
    : profileData?.profile.presence?.lastSeen
    ? `Last seen ${formatRelativeTime(profileData.profile.presence.lastSeen)}`
    : 'Offline';

  const primarySpace = React.useMemo(() => {
    if (!profileData?.spaces || profileData.spaces.length === 0) return null;
    return profileData.spaces[0];
  }, [profileData?.spaces]);

  const isSpaceLeader = React.useMemo(() => {
    if (!profileData?.spaces || profileData.spaces.length === 0) return false;
    return profileData.spaces.some(
      (space) => space.role === 'owner' || space.role === 'admin'
    );
  }, [profileData?.spaces]);

  const spacesLed = React.useMemo(() => {
    if (!profileData?.spaces) return [];
    return profileData.spaces
      .filter((space) => space.role === 'owner' || space.role === 'admin' || space.role === 'Lead')
      .map((space) => ({
        ...space,
        // Include tenure from API if available
        tenure: (space as unknown as { tenure?: number }).tenure,
        tenureLabel: (space as unknown as { tenureLabel?: string }).tenureLabel,
      }));
  }, [profileData?.spaces]);

  const statItems = React.useMemo(() => {
    const stats = profileData?.stats ?? {};
    const safeNumber = (val: unknown, fallback = 0): number => {
      if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
      return val;
    };
    // Return without icons - caller can add them
    return [
      { label: 'Spaces', value: safeNumber(stats.spacesJoined, profileData?.spaces.length ?? 0), icon: () => null },
      { label: 'Friends', value: safeNumber(stats.friends, profileData?.connections.filter((c) => c.isFriend).length ?? 0), icon: () => null },
      { label: 'Streak', value: safeNumber(stats.currentStreak), icon: () => null },
      { label: 'Rep', value: safeNumber(stats.reputation), icon: () => null },
    ];
  }, [profileData?.stats, profileData?.spaces, profileData?.connections]);

  // ============================================================================
  // NEW: Design System Component Data Mappings
  // ============================================================================

  // ProfileHero data
  const heroUser: ProfileHeroUser | null = React.useMemo(() => {
    if (!profileData?.profile) return null;
    const p = profileData.profile;
    return {
      id: p.id,
      fullName: p.fullName,
      handle: p.handle,
      avatarUrl: p.avatarUrl ?? undefined,
      bio: p.bio,
      classYear: p.graduationYear ? `'${String(p.graduationYear).slice(-2)}` : undefined,
      major: p.major,
      campusName: p.campusId?.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    };
  }, [profileData?.profile]);

  const heroPresence: ProfileHeroPresence = React.useMemo(() => ({
    isOnline,
    lastSeen: profileData?.profile.presence?.lastSeen
      ? new Date(profileData.profile.presence.lastSeen)
      : undefined,
  }), [isOnline, profileData?.profile.presence?.lastSeen]);

  const heroBadges: ProfileHeroBadges = React.useMemo(() => ({
    streak: profileData?.stats?.currentStreak ?? 0,
    isBuilder: (userTools.length > 0) || (deployedTools.length > 0),
    isLeader: isSpaceLeader,
  }), [profileData?.stats?.currentStreak, userTools.length, deployedTools.length, isSpaceLeader]);

  // ProfileSpacesCard data
  const profileSpaces: ProfileSpace[] = React.useMemo(() => {
    if (!profileData?.spaces) return [];
    // API now returns isShared from server-side computation
    return profileData.spaces.map((space) => ({
      id: space.id,
      name: space.name,
      emoji: undefined, // API doesn't return emoji currently
      isLeader: space.role === 'owner' || space.role === 'admin' || space.role === 'Lead',
      isShared: (space as unknown as { isShared?: boolean }).isShared ?? false,
    }));
  }, [profileData?.spaces]);

  // ProfileToolsCard data
  const profileTools: ProfileTool[] = React.useMemo(() => {
    return userTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      emoji: undefined,
      description: undefined,
      runs: tool.usageCount ?? 0,
      deployedSpaces: tool.deployedToSpaces ?? 0,
      // Space context from enhanced tools API
      spaceName: (tool as unknown as { primarySpaceName?: string }).primarySpaceName,
    }));
  }, [userTools]);

  // ProfileConnectionsCard data
  const profileConnections: ProfileConnection[] = React.useMemo(() => {
    if (!profileData?.connections) return [];
    // Get mutual connections (those who are also connected to viewer)
    return profileData.connections
      .filter((c) => c.mutualConnections && c.mutualConnections > 0)
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        fullName: c.name,
        avatarUrl: c.avatarUrl ?? undefined,
      }));
  }, [profileData?.connections]);

  const totalConnections = profileData?.connections?.length ?? 0;

  // ProfileInterestsCard data
  const interests = profileData?.profile.interests ?? [];
  // NOTE: Interest comparison requires viewer context. Empty for now - could be enhanced
  // to highlight shared interests when viewer data is available in auth context.
  const sharedInterests: string[] = [];

  // ContextBanner data
  // Shared space names computed from profileSpaces with isShared flag
  const sharedSpaceNames: string[] = React.useMemo(() => {
    return profileSpaces.filter((s) => s.isShared).map((s) => s.name);
  }, [profileSpaces]);

  // Shared spaces count from API viewer data
  const sharedSpacesCount = React.useMemo(() => {
    return (profileData?.viewer as unknown as { sharedSpaceCount?: number })?.sharedSpaceCount ?? sharedSpaceNames.length;
  }, [profileData?.viewer, sharedSpaceNames.length]);

  // Mutual friends count: prefer API data, fall back to computed
  const mutualFriendsCount = React.useMemo(() => {
    if (mutualConnectionsData.count > 0) {
      return mutualConnectionsData.count;
    }
    return profileData?.connections?.filter((c) => c.isFriend && (c.mutualConnections ?? 0) > 0).length ?? 0;
  }, [mutualConnectionsData.count, profileData?.connections]);

  // NOTE: Builder status determined by whether viewer has created tools.
  // Not fetched here to avoid extra API calls - shows tools to all viewers.
  const viewerIsBuilder = false;

  // ProfileActivityHeatmap data - empty until real activity tracking is implemented
  const activityContributions: ActivityContribution[] = React.useMemo(() => {
    // Return empty array - real activity tracking not yet implemented
    // When implemented, this will fetch from /api/profile/activity endpoint
    return [];
  }, []);

  const totalActivityCount = React.useMemo(() => {
    return activityContributions.reduce((sum, c) => sum + c.count, 0);
  }, [activityContributions]);

  const currentStreak = profileData?.stats?.currentStreak ?? 0;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleEditProfile = React.useCallback(() => router.push('/profile/edit'), [router]);
  const handleViewConnections = React.useCallback(() => router.push('/profile/connections'), [router]);

  const handleToolExpand = React.useCallback((tool: ProfileToolModalData) => {
    setSelectedTool(tool);
  }, []);

  const handleToolModalClose = React.useCallback(() => {
    setSelectedTool(null);
  }, []);

  const handleToolUpdateVisibility = React.useCallback(async (tool: ProfileToolModalData, visibility: string) => {
    try {
      const response = await fetch('/api/profile/tools', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.deploymentId, visibility }),
      });

      if (response.ok) {
        setDeployedTools(prev => prev.map(t =>
          t.deploymentId === tool.deploymentId
            ? { ...t, visibility: visibility as 'public' | 'campus' | 'connections' | 'private' }
            : t
        ));
        setSelectedTool(prev =>
          prev?.deploymentId === tool.deploymentId
            ? { ...prev, visibility: visibility as 'public' | 'campus' | 'connections' | 'private' }
            : prev
        );
      }
    } catch (err) {
      logger.error('Failed to update tool visibility', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
    }
  }, []);

  const handleToolRemove = React.useCallback(async (tool: ProfileToolModalData) => {
    try {
      const response = await fetch(`/api/profile/tools?toolId=${tool.deploymentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setDeployedTools(prev => prev.filter(t => t.deploymentId !== tool.deploymentId));
      }
    } catch (err) {
      logger.error('Failed to remove tool', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
    }
  }, []);

  const handleLayoutChange = React.useCallback(async (layout: BentoGridLayout) => {
    if (!isOwnProfile || !currentUser?.id) return;

    setProfileSystem((prev) => prev ? { ...prev, grid: layout } : prev);

    try {
      await fetch('/api/profile/v2', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid: layout }),
      });
    } catch (err) {
      logger.error('Failed to save layout', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
    }
  }, [isOwnProfile, currentUser?.id]);

  const handleNotifyFeature = React.useCallback(async (feature: FeatureKey) => {
    if (!currentUser?.id) return;

    setIsNotifySaving(true);
    try {
      const response = await fetch('/api/profile/notify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, subscribe: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotifiedFeatures(data.subscribedFeatures || []);
      }
    } catch (err) {
      logger.error('Failed to update notification', { component: 'ProfilePageContent' }, err instanceof Error ? err : undefined);
    } finally {
      setIsNotifySaving(false);
    }
  }, [currentUser?.id]);

  // New handlers for design-system components
  const handleSpaceClick = React.useCallback((spaceId: string) => {
    router.push(`/spaces/${spaceId}`);
  }, [router]);

  const handleToolClick = React.useCallback((toolId: string) => {
    router.push(`/tools/${toolId}`);
  }, [router]);

  // NOTE: Connection system requires backend API (/api/profile/[id]/connect).
  // For now, logs intent - will be wired when social graph is implemented.
  const handleConnect = React.useCallback(() => {
    logger.info('Connect clicked - social graph not yet implemented', { component: 'ProfilePageContent', profileId });
  }, [profileId]);

  // NOTE: Direct messaging requires chat infrastructure. Users can message via space chat.
  // For now, logs intent - will be wired when DM feature is implemented.
  const handleMessage = React.useCallback(() => {
    logger.info('Message clicked - DM not yet implemented', { component: 'ProfilePageContent', profileId });
  }, [profileId]);

  return {
    // Navigation
    profileId,
    isOwnProfile,

    // Loading/Error
    isLoading,
    error,

    // Profile Data
    profileData,
    profileSystem,
    initials,

    // Computed (legacy)
    presenceStatus,
    isOnline,
    presenceText,
    primarySpace,
    isSpaceLeader,
    spacesLed,
    statItems,

    // Tools
    userTools,
    deployedTools,
    selectedTool,

    // Notifications
    notifiedFeatures,
    isNotifySaving,

    // NEW: Design System Component Data
    heroUser,
    heroPresence,
    heroBadges,
    profileSpaces,
    profileTools,
    profileConnections,
    totalConnections,
    interests,
    sharedInterests,
    sharedSpaceNames,
    sharedSpacesCount,
    mutualFriendsCount,
    viewerIsBuilder,
    activityContributions,
    totalActivityCount,
    currentStreak,
    organizingEvents,

    // Handlers
    handleEditProfile,
    handleViewConnections,
    handleToolExpand,
    handleToolModalClose,
    handleToolUpdateVisibility,
    handleToolRemove,
    handleLayoutChange,
    handleNotifyFeature,
    handleSpaceClick,
    handleToolClick,
    handleConnect,
    handleMessage,
  };
}
