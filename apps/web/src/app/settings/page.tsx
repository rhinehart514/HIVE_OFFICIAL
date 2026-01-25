'use client';

/**
 * Settings Page - Orientation Archetype (Isomorphic Clone #2)
 *
 * Context + Navigation + Action. No junk drawer.
 *
 * Structure (exactly 3 blocks):
 * - Block 1: Context (what this page is)
 * - Block 2: Navigation (section cards)
 * - Block 3: Action (sign out, delete account)
 *
 * @version 2.0.0 - Rebuilt as Orientation archetype
 */

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/structured-logger';
import { toast } from '@hive/ui';
import { Card, Button, Text } from '@hive/ui/design-system/primitives';
import { ProfileContextProvider, useProfileContext } from '@/components/profile/ProfileContextProvider';
import { ProfileSection } from './components/profile-section';
import { InterestsSection } from './components/interests-section';
import { NotificationSections } from './components/notification-sections';
import { PrivacySection } from './components/privacy-section';
import { AccountSection } from './components/account-section';
import { ConfirmModal } from './components/ui-primitives';
import { useSettingsState } from './hooks/use-settings-state';
import { useProfileForm } from './hooks/use-profile-form';
import { useDataExport } from './hooks/use-data-export';
import type { UserSpace } from './types';

// LOCKED: Premium easing from design system
const EASE = [0.22, 1, 0.36, 1] as const;

// Layer 3: Micro-motion - entrance only, subtle
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

type SettingsSection = 'profile' | 'notifications' | 'privacy' | 'account' | null;

function SettingsContent() {
  const searchParams = useSearchParams();
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const { user, logout } = useAuth();
  const { hiveProfile: profile, updateProfile, toggleGhostMode, isLoading: profileLoading, isUpdating } = useProfileContext();

  // Get initial section from URL params
  const initialSection = searchParams.get('section') as SettingsSection;
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGhostModeModal, setShowGhostModeModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);

  const {
    notificationSettings,
    setNotificationSettings,
    privacySettings,
    setPrivacySettings,
    accountSettings,
    calendarStatus,
    isCalendarLoading,
    exportProgress,
    loadCalendarStatus,
    handleNotificationChange,
    handlePrivacyChange,
    handleAccountChange,
  } = useSettingsState(profile);

  const {
    formData,
    setFormData,
    hasChanges,
    isSaving,
    handleSaveProfile,
  } = useProfileForm(profile);

  const {
    isDownloading,
    handleDownloadData,
  } = useDataExport(formData.handle);

  // Load feature flags
  useEffect(() => {
    async function loadFeatureFlags() {
      try {
        const response = await fetch('/api/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ flagIds: ['profile_ghost_mode'] }),
        });
        if (response.ok) {
          const data = await response.json();
          setGhostModeEnabled(data.flags?.profile_ghost_mode?.enabled ?? false);
        } else {
          // Non-critical: log and use default, don't toast
          logger.warn('Feature flags unavailable, using defaults', { component: 'SettingsPage' });
          setGhostModeEnabled(false);
        }
      } catch (error) {
        // Non-critical: log and use default
        logger.warn('Feature flags failed to load', {
          component: 'SettingsPage',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setGhostModeEnabled(false);
      }
    }
    loadFeatureFlags();
  }, []);

  // Load user's spaces
  useEffect(() => {
    async function loadUserSpaces() {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/profile/v2?id=${user.id}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.spaces) {
            setUserSpaces(data.data.spaces.map((s: { id: string; name: string }) => ({
              id: s.id,
              name: s.name,
            })));
          }
        } else {
          // Non-critical: log and leave empty
          logger.warn('Could not load user spaces for settings', { component: 'SettingsPage' });
        }
      } catch (error) {
        // Non-critical: space-specific notifications may not show, but main settings still work
        logger.error('Failed to load user spaces', { component: 'SettingsPage' }, error instanceof Error ? error : undefined);
      }
    }
    loadUserSpaces();
  }, [user?.id]);

  // Load calendar status and check URL params
  useEffect(() => {
    loadCalendarStatus();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connected') === 'true') {
      toast.success('Calendar connected successfully');
      window.history.replaceState({}, '', '/settings');
    }
    const calendarError = urlParams.get('calendar_error');
    if (calendarError) {
      const errorMessages: Record<string, string> = {
        denied: 'Calendar access was denied',
        invalid_request: 'Invalid calendar request',
        invalid_state: 'Session expired. Please try again.',
        token_exchange_failed: 'Failed to connect calendar',
        internal_error: 'An error occurred. Please try again.',
      };
      toast.error(errorMessages[calendarError] || 'Calendar connection failed');
      window.history.replaceState({}, '', '/settings');
    }
  }, [loadCalendarStatus]);

  // Handlers
  const handleSavePrivacy = async () => {
    try {
      await updateProfile({
        privacy: {
          isPublic: privacySettings.profileVisibility === 'public',
          showActivity: privacySettings.showActivity,
          showSpaces: privacySettings.showSpaces,
          showConnections: privacySettings.showConnections,
          showOnlineStatus: privacySettings.showOnlineStatus,
          allowDirectMessages: privacySettings.allowDirectMessages,
          ghostMode: privacySettings.ghostMode,
        },
      });
      toast.success('Privacy settings saved');
    } catch (error) {
      logger.error('Failed to save privacy settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to save privacy settings');
    }
  };

  const handleToggleGhostMode = async () => {
    try {
      await toggleGhostMode(!privacySettings.ghostMode.enabled);
      setShowGhostModeModal(false);
      handlePrivacyChange('ghostMode', {
        ...privacySettings.ghostMode,
        enabled: !privacySettings.ghostMode.enabled,
      });
      toast.success(privacySettings.ghostMode.enabled ? 'Ghost Mode disabled' : 'Ghost Mode enabled');
    } catch (error) {
      logger.error('Failed to toggle ghost mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Failed to toggle Ghost Mode');
    }
  };

  const handleCalendarConnect = () => {
    window.location.href = '/api/calendar/connect';
  };

  const handleCalendarDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/calendar/status', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Calendar disconnected');
        await loadCalendarStatus();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      logger.error('Failed to disconnect calendar', { component: 'SettingsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to disconnect calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountDeletionRequested: true,
          deletionRequestedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate account deletion');

      toast.success('Account deletion initiated. You will receive an email confirmation within 24 hours.');
      setShowDeleteModal(false);
    } catch (error) {
      logger.error('Delete account error', { component: 'SettingsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateInterests = async (interests: string[]) => {
    await updateProfile({ interests });
  };

  const currentInterests: string[] = profile?.personal?.interests || [];
  const userEmail = user?.email || (profile?.identity as { email?: string })?.email || '';

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Text className="text-white/40">Loading settings...</Text>
      </div>
    );
  }

  // If a section is active, show section content
  if (activeSection) {
    return (
      <div className="min-h-screen w-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 md:py-10">
          {/* Back button */}
          <motion.div className="mb-8" {...fadeIn(0)}>
            <button
              onClick={() => setActiveSection(null)}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              ← Back to Settings
            </button>
          </motion.div>

          {/* Section content */}
          <motion.div {...fadeIn(0.08)}>
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <ProfileSection
                  formData={formData}
                  setFormData={setFormData}
                  userEmail={userEmail}
                  isSaving={isSaving}
                  hasChanges={hasChanges}
                  onSave={handleSaveProfile}
                />
                <InterestsSection
                  interests={currentInterests}
                  onUpdate={handleUpdateInterests}
                  isUpdating={isUpdating}
                />
              </div>
            )}
            {activeSection === 'notifications' && (
              <NotificationSections
                notificationSettings={notificationSettings}
                onNotificationChange={handleNotificationChange}
                onQuietHoursChange={setNotificationSettings}
                userSpaces={userSpaces}
              />
            )}
            {activeSection === 'privacy' && (
              <PrivacySection
                privacySettings={privacySettings}
                onPrivacyChange={handlePrivacyChange}
                onSavePrivacy={handleSavePrivacy}
                isUpdating={isUpdating}
                ghostModeEnabled={ghostModeEnabled}
                showGhostModeModal={showGhostModeModal}
                setShowGhostModeModal={setShowGhostModeModal}
                onToggleGhostMode={handleToggleGhostMode}
              />
            )}
            {activeSection === 'account' && (
              <AccountSection
                accountSettings={accountSettings}
                onAccountChange={handleAccountChange}
                calendarStatus={calendarStatus}
                isCalendarLoading={isCalendarLoading}
                onCalendarConnect={handleCalendarConnect}
                onCalendarDisconnect={handleCalendarDisconnect}
                isDisconnecting={isDisconnecting}
                loadCalendarStatus={loadCalendarStatus}
                isDownloading={isDownloading}
                exportProgress={exportProgress}
                onDownloadData={handleDownloadData}
                onLogout={logout}
                onDeleteAccount={() => setShowDeleteModal(true)}
              />
            )}
          </motion.div>
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          <ConfirmModal
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            title="Delete Your Account?"
            description="This will permanently delete your HIVE account, all your data, tools, and connections. This cannot be undone."
            confirmText="Delete Forever"
            cancelText="Keep Account"
            onConfirm={handleDeleteAccount}
            variant="danger"
            isLoading={isDeleting}
            requireTyping={true}
            typingWord="DELETE"
          />
        </AnimatePresence>
      </div>
    );
  }

  // Settings Root - Orientation Archetype
  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-10">

        {/* ============================================
            CONTEXT BLOCK
            Layer 2: Tight tracking on heading
            ============================================ */}
        <motion.section className="mb-20" {...fadeIn(0)}>
          <h1
            className="text-heading-sm md:text-heading font-semibold text-white mb-1"
            style={{ letterSpacing: '-0.02em' }}
          >
            Settings
          </h1>
          <p className="text-base text-white/40">
            Account preferences and security
          </p>
        </motion.section>

        {/* ============================================
            NAVIGATION BLOCK
            Layer 4: Subtle surface separation
            ============================================ */}
        <motion.section className="mb-16" {...fadeIn(0.08)}>
          <div
            className="grid gap-3 md:grid-cols-2 p-4 -mx-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            {/* Profile */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => setActiveSection('profile')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Profile
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Name, bio, interests
              </Text>
            </Card>

            {/* Notifications */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => setActiveSection('notifications')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Notifications
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Email, push, quiet hours
              </Text>
            </Card>

            {/* Privacy */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => setActiveSection('privacy')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Privacy
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Visibility, permissions
              </Text>
            </Card>

            {/* Account */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => setActiveSection('account')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-label-sm font-medium uppercase tracking-wider text-white/40">
                  Account
                </span>
                <span className="text-white/30">→</span>
              </div>
              <Text size="sm" className="text-white/60">
                Calendar, data, security
              </Text>
            </Card>
          </div>
        </motion.section>

        {/* ============================================
            ACTION BLOCK
            ============================================ */}
        <motion.section {...fadeIn(0.12)}>
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={logout}
            >
              Sign Out
            </Button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-sm text-white/30 hover:text-red-400/80 transition-colors"
            >
              Delete account
            </button>
          </div>
        </motion.section>

      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        <ConfirmModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title="Delete Your Account?"
          description="This will permanently delete your HIVE account, all your data, tools, and connections. This cannot be undone."
          confirmText="Delete Forever"
          cancelText="Keep Account"
          onConfirm={handleDeleteAccount}
          variant="danger"
          isLoading={isDeleting}
          requireTyping={true}
          typingWord="DELETE"
        />
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProfileContextProvider>
      <SettingsContent />
    </ProfileContextProvider>
  );
}
