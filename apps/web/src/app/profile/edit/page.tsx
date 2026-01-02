"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProfileBentoGrid, Button, Avatar, AvatarImage, AvatarFallback, HiveConfirmModal, Input, HiveLogo } from '@hive/ui';
import { profileApiResponseToProfileSystem, type ProfileV2ApiResponse } from '@/components/profile/profile-adapter';
import type { ProfileSystem } from '@hive/core';
import { useAuth } from '@hive/auth-logic';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Loader2, GripVertical, Camera, Settings, X, Plus } from 'lucide-react';
import { logger } from '@/lib/logger';
import { sanitizeProfileData, sanitizeTag } from '@/lib/sanitize';

export default function EditProfilePage() {
  const router = useRouter();
  const { user: currentUser, isLoading: sessionLoading } = useAuth();
  const { toast } = useToast();

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

        // Initialize editable fields
        setDisplayName(payload.profile.fullName || '');
        setBio(payload.profile.bio || '');
        setMajor(payload.profile.major || '');
        setInterests(payload.profile.interests || []);
      } catch (err) {
        logger.error('Failed to load profile for edit page', { component: 'EditProfilePage' }, err instanceof Error ? err : undefined);
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

      // Sanitize all user input before saving
      const sanitizedData = sanitizeProfileData({
        fullName: displayName,
        bio,
        major,
        interests,
      });

      const response = await fetch('/api/profile/v2', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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
      toast({
        title: 'Changes saved',
        description: 'Your profile has been updated.',
        type: 'success',
      });
    } catch (err) {
      logger.error('Failed to save profile layout', { component: 'EditProfilePage' }, err instanceof Error ? err : undefined);
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
      setShowDiscardConfirm(true);
      return;
    }
    router.push(`/profile/${currentUser?.id}`);
  };

  // Profile details handlers
  const handleAddInterest = useCallback(() => {
    // Sanitize the interest tag (strips HTML, normalizes, lowercases)
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

      // Update local state with new avatar URL
      setProfileData((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, avatarUrl: json.avatarUrl } } : prev
      );

      toast({ title: 'Avatar updated', type: 'success' });
    } catch (err) {
      logger.error('Failed to upload avatar', { component: 'EditProfilePage' }, err instanceof Error ? err : undefined);
      toast({ title: 'Upload failed', description: 'Please try again.', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Loading state (Branded HiveLogo)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <HiveLogo size="xl" variant="default" showIcon showText={false} />
          </div>
          <p className="text-sm text-neutral-500">Loading your profile...</p>
        </div>
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
                aria-label="Go back to profile"
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
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
                aria-label="Cancel editing and go back"
                className="hidden sm:flex text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDone}
                disabled={isSaving}
                aria-label={isSaving ? 'Saving changes' : hasPendingChanges ? 'Save changes and return to profile' : 'Return to profile'}
                className="rounded-full px-5 bg-amber-500 text-black hover:bg-amber-400 font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : hasPendingChanges ? (
                  <>
                    <Check className="w-4 h-4 mr-2" aria-hidden="true" />
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

      {/* Profile Details Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-b border-neutral-800"
      >
        <h2 className="text-lg font-medium text-white mb-6">Profile Details</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Avatar Upload */}
          <div className="sm:col-span-2 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-neutral-800">
                <AvatarImage
                  src={profileData.profile.avatarUrl ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-2xl bg-neutral-900 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-amber-500 text-black cursor-pointer hover:bg-amber-400 transition-colors"
                aria-label={isUploadingAvatar ? 'Uploading avatar' : 'Upload new profile photo'}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="w-4 h-4" aria-hidden="true" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  aria-label="Choose profile photo to upload"
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile Photo</p>
              <p className="text-xs text-neutral-500">Click the camera to upload. Max 5MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setHasPendingChanges(true);
              }}
              placeholder="Your name"
              className="bg-neutral-900 border-neutral-800 text-white"
            />
          </div>

          {/* Handle (readonly) */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Handle
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md bg-neutral-900/50 border border-neutral-800 text-neutral-500">
                @{profileData.profile.handle}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                aria-label="Change handle in settings"
                className="text-neutral-400 hover:text-white"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-neutral-600 mt-1">Change handle in settings</p>
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setHasPendingChanges(true);
              }}
              placeholder="Tell people about yourself..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
            <p className="text-xs text-neutral-600 mt-1">{bio.length}/200 characters</p>
          </div>

          {/* Major */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Major / Program
            </label>
            <Input
              value={major}
              onChange={(e) => {
                setMajor(e.target.value);
                setHasPendingChanges(true);
              }}
              placeholder="e.g., Computer Science"
              className="bg-neutral-900 border-neutral-800 text-white"
            />
          </div>

          {/* Interests */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Interests ({interests.length}/10)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-neutral-800 text-neutral-300 border border-neutral-700"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Remove ${interest} from interests`}
                    className="p-0.5 rounded-full hover:bg-neutral-700 transition-colors"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
            {interests.length < 10 && (
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  className="flex-1 bg-neutral-900 border-neutral-800 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                />
                <Button
                  onClick={handleAddInterest}
                  variant="secondary"
                  disabled={!newInterest.trim()}
                  aria-label="Add interest"
                  className="px-3"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Layout Customization Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <GripVertical className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Customize your layout</h2>
              <p className="text-xs text-neutral-400">
                Drag and resize tiles to personalize your profile grid.
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
          profile={profileSystem as unknown as Parameters<typeof ProfileBentoGrid>[0]['profile']}
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
              aria-label={isSaving ? 'Saving changes' : 'Save pending changes now'}
              className="rounded-full px-4 bg-amber-500 text-black hover:bg-amber-400 text-xs font-medium"
            >
              {isSaving ? 'Saving...' : 'Save now'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Discard Changes Confirmation */}
      <HiveConfirmModal
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmText="Discard"
        variant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          router.push(`/profile/${currentUser?.id}`);
        }}
      />
    </div>
  );
}
