"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  ProfileBentoGrid,
  premiumContainerVariants,
  premiumItemVariants,
  InView,
  AnimatedNumber,
  numberSpringPresets,
  ProfileHiveLabWidget,
  ProfileComingSoonSection,
  HiveLogo,
  type FeatureKey,
  type ProfileToolItem,
} from '@hive/ui';
import { profileApiResponseToProfileSystem, type ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import type { ProfileSystem, BentoGridLayout, PresenceData } from '@hive/core';
import { db } from '@hive/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  Users,
  Sparkles,
  Flame,
  Star,
  Pencil,
  MessageCircle,
  UserPlus,
  MapPin,
  GraduationCap,
  Crown,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Utilities
// ============================================================================
const formatRelativeTime = (iso?: string | null): string => {
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
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// Premium Dark Stat Component (Billion-dollar UI)
// Spring-animated counters on scroll-into-view, one gold accent for reputation
// ============================================================================
function Stat({
  label,
  value,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: number;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div className="text-center px-4 sm:px-6">
      <AnimatedNumber
        value={value}
        animateOnView
        springOptions={{
          ...numberSpringPresets.standard,
          duration: 1500 + delay * 200,
        }}
        className={`text-2xl font-semibold ${accent ? 'text-gold-500' : 'text-white'}`}
      />
      <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function ProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const profileId = params.id as string;

  const [profileData, setProfileData] = useState<ProfileV2ApiResponse | null>(null);
  const [profileSystem, setProfileSystem] = useState<ProfileSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTools, setUserTools] = useState<ProfileToolItem[]>([]);
  const [notifiedFeatures, setNotifiedFeatures] = useState<FeatureKey[]>([]);
  const [isNotifySaving, setIsNotifySaving] = useState(false);

  const isOwnProfile = currentUser?.id === profileId;

  // Fetch profile data
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      if (!profileId) return;

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
        // Transform to ProfileSystem for bento grid
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
  }, [profileId]);

  // Track if profile data has loaded (for presence subscription)
  const hasProfileData = profileData !== null;

  // Subscribe to presence updates
  // Note: Uses hasProfileData flag instead of profileData to prevent
  // re-subscription loops when presence updates modify profileData
  useEffect(() => {
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
      (error) => {
        logger.error('Presence subscription error', { component: 'ProfilePageContent', profileId }, error);
      }
    );

    return () => unsubscribe();
  }, [profileId, isOwnProfile, hasProfileData]);

  // Fetch user's tools (for HiveLab showcase)
  useEffect(() => {
    if (!profileId) return;

    const fetchTools = async () => {
      try {
        const response = await fetch(`/api/tools?userId=${profileId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.tools) {
            setUserTools(data.tools.map((tool: { id: string; name: string; deployments?: { spaceId: string }[]; usageCount?: number; status?: string; updatedAt?: string }) => ({
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

  // Fetch notified features (for Coming Soon section)
  useEffect(() => {
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

  // Handle notify click for Coming Soon features
  const handleNotifyFeature = useCallback(async (feature: FeatureKey) => {
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

  // Computed values
  const statItems = useMemo(() => {
    const stats = profileData?.stats ?? {};
    // Helper to safely get numeric value (handles NaN, undefined, null)
    const safeNumber = (val: unknown, fallback = 0): number => {
      if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
      return val;
    };
    return [
      { label: 'Spaces', value: safeNumber(stats.spacesJoined, profileData?.spaces.length ?? 0), icon: Users },
      { label: 'Friends', value: safeNumber(stats.friends, profileData?.connections.filter((c) => c.isFriend).length ?? 0), icon: Sparkles },
      { label: 'Streak', value: safeNumber(stats.currentStreak), icon: Flame },
      { label: 'Rep', value: safeNumber(stats.reputation), icon: Star },
    ];
  }, [profileData?.stats, profileData?.spaces, profileData?.connections]);

  const initials = useMemo(() => {
    if (!profileData?.profile.fullName) return '';
    return getInitials(profileData.profile.fullName);
  }, [profileData?.profile.fullName]);

  // Get primary space for dynamic subtitle
  const primarySpace = useMemo(() => {
    if (!profileData?.spaces || profileData.spaces.length === 0) return null;
    // Return the first space (could be enhanced to show most active)
    return profileData.spaces[0];
  }, [profileData?.spaces]);

  // Check if user is a leader of any space (owner or admin role)
  const isSpaceLeader = useMemo(() => {
    if (!profileData?.spaces || profileData.spaces.length === 0) return false;
    return profileData.spaces.some(
      (space) => space.role === 'owner' || space.role === 'admin'
    );
  }, [profileData?.spaces]);

  // Get spaces led by this user
  const spacesLed = useMemo(() => {
    if (!profileData?.spaces) return [];
    return profileData.spaces.filter(
      (space) => space.role === 'owner' || space.role === 'admin'
    );
  }, [profileData?.spaces]);

  const handleEditProfile = useCallback(() => router.push('/profile/edit'), [router]);
  const handleViewConnections = useCallback(() => router.push('/profile/connections'), [router]);

  // Handle bento grid layout changes
  const handleLayoutChange = useCallback(async (layout: BentoGridLayout) => {
    if (!isOwnProfile || !currentUser?.id) return;

    // Update local state immediately for optimistic UI
    setProfileSystem((prev) => prev ? { ...prev, grid: layout } : prev);

    // Persist to API
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

  // ========== LOADING STATE (Branded HiveLogo) ==========
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <HiveLogo size="xl" variant="default" showIcon showText={false} />
          </div>
          <p className="text-sm text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ========== ERROR STATE (Premium Dark - Simple) ==========
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-950">
        <div className="text-center max-w-md">
          <p className="text-neutral-500 text-sm mb-2">Profile Not Available</p>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/spaces')}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Browse Spaces →
          </button>
        </div>
      </div>
    );
  }

  // ========== NOT FOUND STATE (Premium Dark - Simple) ==========
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-950">
        <div className="text-center max-w-md">
          <p className="text-neutral-500 text-sm mb-2">Profile Not Found</p>
          <p className="text-neutral-400 mb-6">
            This profile doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Back to Feed →
          </button>
        </div>
      </div>
    );
  }

  const presenceStatus = profileData.profile.presence?.status;
  const isOnline = presenceStatus === 'online';
  const presenceText = isOnline
    ? 'Online now'
    : presenceStatus === 'away'
    ? 'Away'
    : profileData.profile.presence?.lastSeen
    ? `Last seen ${formatRelativeTime(profileData.profile.presence.lastSeen)}`
    : 'Offline';

  // ========== MAIN CONTENT (Premium Dark - Vercel/Linear style) ==========
  return (
    <div className="min-h-screen pb-20 bg-neutral-950">
        {/* ============ HERO HEADER ============ */}
        <motion.header
          variants={premiumContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full border-b border-neutral-800"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
            {/* Avatar + Identity Row */}
            <motion.div
              variants={premiumItemVariants}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-6"
            >
              {/* Avatar with ambient glow based on presence */}
              <div className="relative flex-shrink-0">
                {/* Ambient glow effect */}
                {isOnline && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 -m-2 rounded-full bg-emerald-500/20 blur-xl"
                  />
                )}
                <Avatar className="relative h-32 w-32 border-2 border-neutral-800">
                  <AvatarImage
                    src={profileData.profile.avatarUrl ?? undefined}
                    alt={profileData.profile.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold bg-neutral-900 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                {isOnline && (
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                )}
              </div>

              {/* Identity - Typography-forward */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    {profileData.profile.fullName}
                  </h1>
                  {/* Founding Leader Badge */}
                  {isSpaceLeader && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                      title={`Leading ${spacesLed.length} space${spacesLed.length > 1 ? 's' : ''}`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-400">Founding Leader</span>
                    </motion.div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-neutral-400 text-base">
                  <span>@{profileData.profile.handle}</span>
                  {primarySpace && (
                    <>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-500">Active in {primarySpace.name}</span>
                    </>
                  )}
                </div>
                {profileData.profile.bio && (
                  <p className="text-neutral-300 text-base leading-relaxed max-w-md">
                    {profileData.profile.bio}
                  </p>
                )}

                {/* Location/Major - Simple text */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {profileData.profile.campusId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  {profileData.profile.major && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {profileData.profile.major}
                    </span>
                  )}
                  <span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-500' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                    {presenceText}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Stats Bar - Spring-animated counters (billion-dollar pattern) */}
            <motion.div
              variants={premiumItemVariants}
              className="mt-8 flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-8 py-4 border-t border-b border-neutral-800"
            >
              <Stat label={statItems[0].label} value={statItems[0].value} delay={0} />
              <Stat label={statItems[1].label} value={statItems[1].value} delay={1} />
              <Stat label={statItems[2].label} value={statItems[2].value} delay={2} />
              <Stat label={statItems[3].label} value={statItems[3].value} delay={3} accent />
            </motion.div>

            {/* Action Buttons - Full width on mobile */}
            <motion.div
              variants={premiumItemVariants}
              className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              {isOwnProfile ? (
                <Button
                  onClick={handleEditProfile}
                  aria-label="Edit your profile"
                  className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium bg-white text-neutral-950 hover:bg-neutral-200 transition-colors"
                >
                  <Pencil className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    aria-label={`Send connection request to ${profileData.profile.fullName}`}
                    className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium bg-gold-500 text-neutral-950 hover:bg-gold-400 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Connect
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label={`Send message to ${profileData.profile.fullName}`}
                    className="w-full sm:w-auto justify-center rounded-lg px-4 py-3 sm:py-2 text-sm font-medium bg-neutral-900 text-white border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                    Message
                  </Button>
                </>
              )}
            </motion.div>

            {/* Interests - Scrollable on mobile, wrapped on desktop */}
            {profileData.profile.interests && profileData.profile.interests.length > 0 && (
              <motion.div
                variants={premiumItemVariants}
                className="mt-6"
              >
                {/* Mobile: horizontal scroll */}
                <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-2 pb-2">
                    {profileData.profile.interests.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-sm text-neutral-400 bg-neutral-900 border border-neutral-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {profileData.profile.interests.length > 6 && (
                      <span className="flex-shrink-0 px-3 py-1 text-sm text-neutral-500">
                        +{profileData.profile.interests.length - 6}
                      </span>
                    )}
                  </div>
                </div>
                {/* Desktop: wrapped */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {profileData.profile.interests.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm text-neutral-400 bg-neutral-900 border border-neutral-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {profileData.profile.interests.length > 8 && (
                    <span className="px-3 py-1 text-sm text-neutral-500">
                      +{profileData.profile.interests.length - 8} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* ============ BENTO GRID ============ */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {profileSystem && (
            <InView
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              viewOptions={{ once: true, margin: '0px 0px -100px 0px' }}
            >
              <ProfileBentoGrid
                profile={profileSystem as unknown as Parameters<typeof ProfileBentoGrid>[0]['profile']}
                editable={isOwnProfile}
                onLayoutChange={isOwnProfile ? (layout) => { handleLayoutChange(layout as unknown as BentoGridLayout); } : undefined}
                onViewConnections={isOwnProfile ? handleViewConnections : undefined}
              />
            </InView>
          )}

          {/* ============ HIVELAB SHOWCASE ============ */}
          <InView
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            viewOptions={{ once: true, margin: '0px 0px -100px 0px' }}
          >
            <ProfileHiveLabWidget
              tools={userTools}
              isOwnProfile={isOwnProfile}
            />
          </InView>

          {/* ============ SPACES I LEAD ============ */}
          {spacesLed.length > 0 && (
            <InView
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              viewOptions={{ once: true, margin: '0px 0px -100px 0px' }}
            >
              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800/50 overflow-hidden">
                <div className="p-6 border-b border-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <Crown className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Spaces I Lead
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {spacesLed.length} space{spacesLed.length > 1 ? 's' : ''} under your leadership
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {spacesLed.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-neutral-800/30 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {space.imageUrl ? (
                          <img
                            src={space.imageUrl}
                            alt={space.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-neutral-500">
                            {space.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                          {space.name}
                        </h4>
                        <p className="text-sm text-neutral-500">
                          {space.role === 'owner' ? 'Owner' : 'Admin'} • {space.memberCount || 0} member{(space.memberCount || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    </button>
                  ))}
                </div>
                {isOwnProfile && (
                  <div className="p-4 bg-neutral-900/30 border-t border-neutral-800/50">
                    <button
                      onClick={() => router.push('/spaces/claim')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Claim Another Space
                    </button>
                  </div>
                )}
              </div>
            </InView>
          )}

          {/* ============ COMING SOON SHOWCASE ============ */}
          {isOwnProfile && (
            <InView
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              viewOptions={{ once: true, margin: '0px 0px -100px 0px' }}
            >
              <ProfileComingSoonSection
                notifiedFeatures={notifiedFeatures}
                onNotify={handleNotifyFeature}
                isSaving={isNotifySaving}
              />
            </InView>
          )}
        </main>

        {/* ============ EMPTY STATE (Premium Dark - Text only) ============ */}
        {isOwnProfile && profileData.spaces.length === 0 && profileData.connections.length === 0 && (
          <div className="max-w-md mx-auto px-4 py-8 text-center">
            <p className="text-neutral-500 text-sm">No spaces or connections yet</p>
            <button
              onClick={() => router.push('/spaces')}
              className="mt-3 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Find classmates →
            </button>
          </div>
        )}
    </div>
  );
}
