'use client';

/**
 * /me/settings — Account Settings
 *
 * Canonical settings URL under the "You" pillar.
 * Re-exports the settings content from the original location.
 *
 * @version 2.0.0 - IA Unification (Jan 2026)
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
import { ProfileSection } from '@/app/(shell)/settings/components/profile-section';
import { InterestsSection } from '@/app/(shell)/settings/components/interests-section';
import { NotificationSections } from '@/app/(shell)/settings/components/notification-sections';
import { PrivacySection } from '@/app/(shell)/settings/components/privacy-section';
import { AccountSection } from '@/app/(shell)/settings/components/account-section';
import { ConfirmModal } from '@/app/(shell)/settings/components/ui-primitives';
import { CompletionCard } from '@/app/(shell)/settings/components/completion-card';
import { useSettingsState } from '@/app/(shell)/settings/hooks/use-settings-state';
import { useProfileForm } from '@/app/(shell)/settings/hooks/use-profile-form';
import { useDataExport } from '@/app/(shell)/settings/hooks/use-data-export';
import type { UserSpace } from '@/app/(shell)/settings/types';

const fadeInUpVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

const _listVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1, transition: { staggerChildren: 0.04 } },
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const staggerItemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
};

type SettingsSection = 'profile' | 'notifications' | 'privacy' | 'account' | null;

function SettingsContent() {
  const searchParams = useSearchParams();
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const { user, logout, logoutAll } = useAuth();
  const { hiveProfile: profile, updateProfile, toggleGhostMode, isLoading: profileLoading, isUpdating } = useProfileContext();

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
          logger.warn('Feature flags unavailable, using defaults', { component: 'SettingsPage' });
          setGhostModeEnabled(false);
        }
      } catch (error) {
        logger.warn('Feature flags failed to load', {
          component: 'SettingsPage',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setGhostModeEnabled(false);
      }
    }
    loadFeatureFlags();
  }, []);

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
          logger.warn('Could not load user spaces for settings', { component: 'SettingsPage' });
        }
      } catch (error) {
        logger.error('Failed to load user spaces', { component: 'SettingsPage' }, error instanceof Error ? error : undefined);
      }
    }
    loadUserSpaces();
  }, [user?.id]);

  useEffect(() => {
    loadCalendarStatus();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_connected') === 'true') {
      toast.success('Calendar connected successfully');
      window.history.replaceState({}, '', '/me/settings');
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
      window.history.replaceState({}, '', '/me/settings');
    }
  }, [loadCalendarStatus]);

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

  if (profileLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Text className="text-white/50">Loading settings...</Text>
      </div>
    );
  }

  if (activeSection) {
    return (
      <div className="min-h-screen w-full overflow-y-auto">
        <div className="max-w-3xl px-6 py-8 md:py-10">
          <motion.div className="mb-8" variants={fadeInUpVariants} initial="initial" animate="animate">
            <button
              onClick={() => setActiveSection(null)}
              className="text-sm text-white/50 hover:text-white/50 transition-colors"
            >
              ← Back to Settings
            </button>
          </motion.div>

          <motion.div variants={fadeInUpVariants} initial="initial" animate="animate">
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
                onLogoutAll={logoutAll}
                onDeleteAccount={() => setShowDeleteModal(true)}
              />
            )}
          </motion.div>
        </div>

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

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="max-w-3xl px-6 py-8 md:py-10">
        <motion.section className="mb-8" variants={fadeInUpVariants} initial="initial" animate="animate">
          <h1
            className="text-heading-sm md:text-heading font-semibold text-white mb-1"
            style={{ letterSpacing: '-0.02em' }}
          >
            Settings
          </h1>
          <p className="text-base text-white/50">
            Account preferences and security
          </p>
        </motion.section>

        <CompletionCard />

        <motion.section className="mb-16" initial="hidden" animate="visible">
          <motion.div
            className="grid gap-3 md:grid-cols-2 p-4 -mx-4 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            <motion.div variants={staggerItemVariants}>
              <Card
                as="button"
                elevation="resting"
               
                onClick={() => setActiveSection('profile')}
                className="text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-label-sm font-medium uppercase tracking-wider text-white/50">
                    Profile
                  </span>
                  <span className="text-white/50">→</span>
                </div>
                <Text size="sm" className="text-white/50">
                  Name, bio, interests
                </Text>
              </Card>
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <Card
                as="button"
                elevation="resting"
               
                onClick={() => setActiveSection('notifications')}
                className="text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-label-sm font-medium uppercase tracking-wider text-white/50">
                    Notifications
                  </span>
                  <span className="text-white/50">→</span>
                </div>
                <Text size="sm" className="text-white/50">
                  Email, push, quiet hours
                </Text>
              </Card>
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <Card
                as="button"
                elevation="resting"
               
                onClick={() => setActiveSection('privacy')}
                className="text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-label-sm font-medium uppercase tracking-wider text-white/50">
                    Privacy
                  </span>
                  <span className="text-white/50">→</span>
                </div>
                <Text size="sm" className="text-white/50">
                  Visibility, permissions
                </Text>
              </Card>
            </motion.div>

            <motion.div variants={staggerItemVariants}>
              <Card
                as="button"
                elevation="resting"
               
                onClick={() => setActiveSection('account')}
                className="text-left"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-label-sm font-medium uppercase tracking-wider text-white/50">
                    Account
                  </span>
                  <span className="text-white/50">→</span>
                </div>
                <Text size="sm" className="text-white/50">
                  Calendar, data, security
                </Text>
              </Card>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section variants={fadeInUpVariants} initial="initial" animate="animate">
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
              className="text-sm text-white/50 hover:text-red-400/80 transition-colors"
            >
              Delete account
            </button>
          </div>
        </motion.section>
      </div>

      {/* About & Legal Links */}
      <motion.section
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
        className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-6 text-xs text-white/30"
      >
        <a href="/about" className="hover:text-white/50 transition-colors">About HIVE</a>
        <a href="/legal/terms" className="hover:text-white/50 transition-colors">Terms</a>
        <a href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy</a>
        <a href="/legal/community-guidelines" className="hover:text-white/50 transition-colors">Guidelines</a>
      </motion.section>

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
