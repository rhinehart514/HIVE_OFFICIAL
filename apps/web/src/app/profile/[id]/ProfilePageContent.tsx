"use client";

import { useState, useEffect, useMemo } from 'react';
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

  // Subscribe to presence updates
  useEffect(() => {
    if (!profileId || !profileData || isOwnProfile) return;

    const presenceRef = doc(db, 'presence', profileId);
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [profileId, isOwnProfile, profileData]);

  // Computed values
  const statItems = useMemo(() => {
    const stats = profileData?.stats ?? {};
    return [
    { label: 'Spaces', value: stats.spacesJoined ?? profileData?.spaces.length ?? 0, icon: Users },
    { label: 'Friends', value: stats.friends ?? profileData?.connections.filter((c) => c.isFriend).length ?? 0, icon: Sparkles },
    { label: 'Streak', value: stats.currentStreak ?? 0, icon: Flame },
    { label: 'Reputation', value: stats.reputation ?? 0, icon: Star },
  ];
  }, [profileData?.stats, profileData?.spaces, profileData?.connections]);

  const initials = useMemo(() => {
    if (!profileData?.profile.fullName) return '';
    return getInitials(profileData.profile.fullName);
  }, [profileData?.profile.fullName]);

  // Sample activities (in real app, from API) - reserved for future use
  // const activities = useMemo(() => {
  //   if (!profileData) return [];
  //   return profileData.spaces.slice(0, 2).map((s) => ({
  //     type: 'space' as const,
  //     text: `Joined ${s.name}`,
  //     timestamp: s.lastActivityAt ?? new Date().toISOString(),
  //   }));
  // }, [profileData]);

  const handleEditProfile = () => router.push('/profile/edit');

  // Handle bento grid layout changes
  const handleLayoutChange = async (layout: BentoGridLayout) => {
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
  };

  // ========== LOADING STATE (Premium Dark - Simple) ==========
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-neutral-800 border-t-white animate-spin" />
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
              {/* Avatar - Clean, no breathing animations */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-32 w-32 border-2 border-neutral-800">
                  <AvatarImage
                    src={profileData.profile.avatarUrl ?? undefined}
                    alt={profileData.profile.fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold bg-neutral-900 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Simple online indicator */}
                {isOnline && (
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                )}
              </div>

              {/* Identity - Typography-forward */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {profileData.profile.fullName}
                </h1>
                <p className="text-neutral-400 text-base">
                  @{profileData.profile.handle}
                </p>
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
              className="mt-8 flex items-center gap-8 py-4 border-t border-b border-neutral-800"
            >
              <Stat label="Spaces" value={statItems[0].value} delay={0} />
              <Stat label="Friends" value={statItems[1].value} delay={1} />
              <Stat label="Streak" value={statItems[2].value} delay={2} />
              <Stat label="Rep" value={statItems[3].value} delay={3} accent />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={premiumItemVariants}
              className="mt-6 flex items-center gap-3"
            >
              {isOwnProfile ? (
                <Button
                  onClick={handleEditProfile}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-white text-neutral-950 hover:bg-neutral-200 transition-colors"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button className="rounded-lg px-4 py-2 text-sm font-medium bg-gold-500 text-neutral-950 hover:bg-gold-400 transition-colors">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-neutral-900 text-white border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
            </motion.div>

            {/* Interests - Simple pills, no animation on each */}
            {profileData.profile.interests && profileData.profile.interests.length > 0 && (
              <motion.div
                variants={premiumItemVariants}
                className="mt-6 flex flex-wrap gap-2"
              >
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
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* ============ BENTO GRID ============ */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                profile={profileSystem}
                editable={isOwnProfile}
                onLayoutChange={isOwnProfile ? (layout) => { handleLayoutChange(layout as unknown as BentoGridLayout); } : undefined}
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
