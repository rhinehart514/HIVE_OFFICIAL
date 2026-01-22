"use client";

/**
 * Profile Edit Page - Orientation Archetype
 *
 * Context + Navigation + Action. No junk drawer.
 *
 * Structure:
 * - Header: Compact, sticky with save actions
 * - Profile Details: Avatar, name, bio, interests
 * - Privacy: Ghost Mode control
 * - Layout: Bento grid customization
 *
 * @version 3.0.0 - Premium motion consistency
 */

import { motion } from 'framer-motion';
import { ProfileBentoGrid, Button, Avatar, AvatarImage, AvatarFallback, HiveConfirmModal, Input, HiveLogo } from '@hive/ui';
import type { ProfileSystem } from '@hive/core';
import { ArrowLeftIcon, CheckIcon, ArrowPathIcon, Bars3Icon, Cog6ToothIcon, XMarkIcon, PlusIcon, CameraIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { GhostModeModal } from '@/components/privacy';
import { useProfileEdit } from '@/hooks/use-profile-edit';

// LOCKED: Premium easing from design system
const EASE = [0.22, 1, 0.36, 1] as const;

// Layer 3: Micro-motion - entrance only, subtle
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

export default function EditProfilePage() {
  const {
    profileData,
    profileSystem,
    isLoading,
    isSaving,
    hasPendingChanges,
    showDiscardConfirm,
    currentUser,
    sessionLoading,
    displayName,
    bio,
    major,
    interests,
    newInterest,
    isUploadingAvatar,
    isGhostModeModalOpen,
    ghostModeState,
    initials,
    setDisplayName,
    setBio,
    setMajor,
    setNewInterest,
    setShowDiscardConfirm,
    setIsGhostModeModalOpen,
    setProfileSystem,
    setHasPendingChanges,
    handleSaveLayout,
    handleDone,
    handleCancel,
    handleAddInterest,
    handleRemoveInterest,
    handleAvatarUpload,
    handleActivateGhostMode,
    handleDeactivateGhostMode,
    router,
  } = useProfileEdit();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-ground)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <HiveLogo className="w-10 h-10 text-[var(--life-gold)]" />
          </div>
          <p className="text-sm text-white/40">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Auth required state
  if (!currentUser && !sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          {...fadeIn(0)}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--life-gold)]/10 flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Sign In Required</h1>
          <p className="text-white/50 mb-8">Please sign in to edit your profile</p>
          <Button onClick={() => router.push('/enter')} variant="cta">
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
          {...fadeIn(0)}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Profile Unavailable</h1>
          <p className="text-white/50 mb-8">We couldn&apos;t load your profile settings.</p>
          <Button onClick={() => router.push('/feed')} variant="secondary">
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
        {...fadeIn(0)}
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg-ground)]/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + User info */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                aria-label="Go back to profile"
                className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-[var(--life-gold)]/30">
                  <AvatarImage src={profileData.profile.avatarUrl ?? undefined} alt={profileData.profile.fullName} />
                  <AvatarFallback className="text-sm bg-white/[0.04] text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{profileData.profile.fullName}</p>
                  <p className="text-xs text-white/40">Editing profile</p>
                </div>
              </div>
            </div>

            {/* Center: Edit mode indicator (mobile only) */}
            <div className="sm:hidden flex items-center gap-2 text-[var(--life-gold)]">
              <Bars3Icon className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Mode</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleCancel} variant="ghost" className="hidden sm:flex">
                Cancel
              </Button>
              <Button
                onClick={handleDone}
                disabled={isSaving}
                variant={hasPendingChanges ? 'cta' : 'secondary'}
              >
                {isSaving ? (
                  <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : hasPendingChanges ? (
                  <><CheckIcon className="w-4 h-4 mr-2" />Save & Done</>
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
        {...fadeIn(0.08)}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-b border-white/[0.06]"
      >
        <h2 className="text-lg font-medium text-white mb-6">Profile Details</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Avatar Upload */}
          <div className="sm:col-span-2 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-white/[0.08]">
                <AvatarImage src={profileData.profile.avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="text-2xl bg-white/[0.04] text-white">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[var(--life-gold)] text-[var(--bg-ground)] cursor-pointer hover:opacity-90 transition-opacity">
                {isUploadingAvatar ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <CameraIcon className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile Photo</p>
              <p className="text-xs text-white/40">Click the camera to upload. Max 5MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Handle (readonly) */}
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Handle</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40">
                @{profileData.profile.handle}
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
                <Cog6ToothIcon className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-white/30 mt-1">Change handle in settings</p>
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-white/50 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none transition-all"
            />
            <p className="text-xs text-white/30 mt-1">{bio.length}/200 characters</p>
          </div>

          {/* Major */}
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Major / Program</label>
            <Input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>

          {/* Interests */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-white/50 mb-2">Interests ({interests.length}/10)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest) => (
                <span key={interest} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/[0.04] text-white/70 border border-white/[0.06]">
                  {interest}
                  <button onClick={() => handleRemoveInterest(interest)} className="p-0.5 rounded-full hover:bg-white/[0.08] transition-colors">
                    <XMarkIcon className="w-3 h-3" />
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
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); } }}
                />
                <Button onClick={handleAddInterest} variant="secondary" disabled={!newInterest.trim()} className="px-3">
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Privacy & Visibility Section */}
      <motion.div
        {...fadeIn(0.12)}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-8 border-b border-white/[0.06]"
      >
        <h2 className="text-lg font-medium text-white mb-6">Privacy & Visibility</h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center">
              <EyeSlashIcon className="w-6 h-6 text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-medium text-white">Ghost Mode</h3>
                {ghostModeState?.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--life-gold)]/10 text-[var(--life-gold)]">Active</span>
                )}
              </div>
              <p className="text-sm text-white/50 mb-4">
                Temporarily reduce your visibility across HIVE. Control who can see your activity, online status, and profile information.
              </p>
              <Button onClick={() => setIsGhostModeModalOpen(true)} variant="secondary">
                <EyeSlashIcon className="w-4 h-4 mr-2" />
                {ghostModeState?.enabled ? 'Manage Ghost Mode' : 'Enable Ghost Mode'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Layout Customization Banner */}
      <motion.div
        {...fadeIn(0.15)}
        className="bg-gradient-to-r from-[var(--life-gold)]/5 via-orange-500/5 to-[var(--life-gold)]/5 border-b border-[var(--life-gold)]/10"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--life-gold)]/10 flex items-center justify-center">
              <Bars3Icon className="w-5 h-5 text-[var(--life-gold)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Customize your layout</h2>
              <p className="text-xs text-white/40">Drag and resize tiles to personalize your profile grid.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Editor */}
      <motion.div
        {...fadeIn(0.2)}
        className="mx-auto max-w-6xl px-4 sm:px-6 py-8"
      >
        <ProfileBentoGrid
          profile={profileSystem as unknown as Parameters<typeof ProfileBentoGrid>[0]['profile']}
          editable
          onLayoutChange={(layout) => {
            setProfileSystem((prev: ProfileSystem | null) => prev ? ({ ...prev, grid: layout } as ProfileSystem) : prev);
            setHasPendingChanges(true);
          }}
        />
      </motion.div>

      {/* Unsaved changes indicator */}
      {hasPendingChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-full border shadow-xl backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(20, 19, 18, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[var(--life-gold)] animate-pulse" />
            <span className="text-sm text-white/70">Unsaved changes</span>
            <Button
              onClick={handleSaveLayout}
              disabled={isSaving}
              size="sm"
              variant="cta"
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
        onConfirm={() => { setShowDiscardConfirm(false); router.push(`/profile/${currentUser?.id}`); }}
      />

      {/* Ghost Mode Modal */}
      <GhostModeModal
        open={isGhostModeModalOpen}
        onOpenChange={setIsGhostModeModalOpen}
        currentState={ghostModeState}
        onActivate={handleActivateGhostMode}
        onDeactivate={handleDeactivateGhostMode}
      />
    </div>
  );
}
