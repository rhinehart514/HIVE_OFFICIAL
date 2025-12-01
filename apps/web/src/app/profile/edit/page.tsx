"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProfileBentoGrid, Button, Avatar, AvatarImage, AvatarFallback } from '@hive/ui';
import { profileApiResponseToProfileSystem, type ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import type { ProfileSystem } from '@hive/core';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Loader2, GripVertical } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user: currentUser, isLoading: sessionLoading } = useSession();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileV2ApiResponse | null>(null);
  const [profileSystem, setProfileSystem] = useState<ProfileSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

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

  useEffect(() => {
    const loadProfile = async () => {
      if (sessionLoading) return;

      if (!currentUser?.id) {
        router.push('/auth/login');
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
      } catch (err) {
        console.error('Failed to load profile for edit page', err);
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

  const handleSaveLayout = async () => {
    if (!profileSystem) return;
    try {
      setIsSaving(true);
      const response = await fetch('/api/profile/v2', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grid: profileSystem.grid }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to save layout');
      }

      setHasPendingChanges(false);
      toast({
        title: 'Changes saved',
        description: 'Your profile has been updated.',
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to save profile layout', err);
      toast({
        title: 'Save failed',
        description: 'Please try again in a moment.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    if (hasPendingChanges) {
      await handleSaveLayout();
    }
    router.push(`/profile/${currentUser?.id}`);
  };

  const handleCancel = () => {
    if (hasPendingChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push(`/profile/${currentUser?.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
          </div>
          <p className="text-neutral-400 text-sm tracking-wide">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  // Auth required state
  if (!currentUser && !sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Sign In Required</h1>
          <p className="text-neutral-400 mb-8">Please sign in to edit your profile</p>
          <Button onClick={() => router.push('/auth/login')} className="rounded-full px-6 bg-amber-500 text-black hover:bg-amber-400">
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  // Profile unavailable state
  if (!profileSystem || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-800 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Profile Unavailable</h1>
          <p className="text-neutral-400 mb-8">We couldn&apos;t load your profile settings.</p>
          <Button onClick={() => router.push('/feed')} variant="secondary" className="rounded-full px-6">
            Back to Feed
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Compact Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-neutral-800 bg-black/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + User info */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-amber-500/30">
                  <AvatarImage src={profileData.profile.avatarUrl ?? undefined} alt={profileData.profile.fullName} />
                  <AvatarFallback className="text-sm bg-neutral-800 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{profileData.profile.fullName}</p>
                  <p className="text-xs text-neutral-500">Editing profile</p>
                </div>
              </div>
            </div>

            {/* Center: Edit mode indicator (mobile only) */}
            <div className="sm:hidden flex items-center gap-2 text-amber-400">
              <GripVertical className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Mode</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="hidden sm:flex text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDone}
                disabled={isSaving}
                className="rounded-full px-5 bg-amber-500 text-black hover:bg-amber-400 font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : hasPendingChanges ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save & Done
                  </>
                ) : (
                  'Done'
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Edit Instructions Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <GripVertical className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Customize your profile</h2>
              <p className="text-xs text-neutral-400">
                Drag and resize tiles to personalize your layout. Changes are saved automatically.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-8"
      >
        <ProfileBentoGrid
          profile={profileSystem}
          editable
          onLayoutChange={(layout) => {
            setProfileSystem((prev: ProfileSystem | null) =>
              prev ? ({ ...prev, grid: layout } as ProfileSystem) : prev
            );
            setHasPendingChanges(true);
          }}
        />
      </motion.div>

      {/* Unsaved changes indicator */}
      {hasPendingChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-neutral-900 border border-neutral-700 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-neutral-300">Unsaved changes</span>
            <Button
              onClick={handleSaveLayout}
              disabled={isSaving}
              size="sm"
              className="rounded-full px-4 bg-amber-500 text-black hover:bg-amber-400 text-xs font-medium"
            >
              {isSaving ? 'Saving...' : 'Save now'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
