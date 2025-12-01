'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/structured-logger';
import {
  Card,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Breadcrumbs,
} from '@hive/ui';
import { ProfileContextProvider, useProfileContext } from '@/components/profile/ProfileContextProvider';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  User,
  Bell,
  Eye,
  Shield,
  Smartphone,
  Lock,
  Save,
  AlertTriangle,
  Settings as SettingsIcon,
  Mail,
  Users,
  Moon,
  Trash2,
  Check,
  ArrowLeft,
  Loader2,
  X,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface NotificationSettings {
  email: {
    spaceInvites: boolean;
    eventReminders: boolean;
    toolUpdates: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
    directMessages: boolean;
    mentionsAndReplies: boolean;
    builderUpdates: boolean;
  };
  push: {
    spaceActivity: boolean;
    toolLaunches: boolean;
    eventReminders: boolean;
    directMessages: boolean;
    weeklyDigest: boolean;
    emergencyAlerts: boolean;
  };
  inApp: {
    realTimeNotifications: boolean;
    soundEffects: boolean;
    desktopNotifications: boolean;
    emailPreview: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  spaceSettings: Record<string, { muted: boolean; pinned: boolean }>;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showActivity: boolean;
  showSpaces: boolean;
  showConnections: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  ghostMode: {
    enabled: boolean;
    level: 'minimal' | 'moderate' | 'maximum';
    duration: '30m' | '1h' | '4h' | 'indefinite';
    expiresAt: Date | null;
  };
}

interface AccountSettings {
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'es' | 'fr';
  timezone: string;
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  dataRetention: {
    autoDelete: boolean;
    retentionDays: 90 | 180 | 365;
  };
}

interface UserSpace {
  id: string;
  name: string;
  avatarUrl?: string;
}

// =============================================================================
// Components
// =============================================================================

function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-gold-500' : 'bg-white/20'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
          transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'default',
  isLoading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md rounded-xl bg-neutral-950 border border-white/[0.08] p-6 shadow-2xl"
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-white/60 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
    >
      <Check className="h-4 w-4" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

// =============================================================================
// Main Content
// =============================================================================

function ProfileSettingsContent() {
  const router = useRouter();
  const { hiveProfile: profile, updateProfile, toggleGhostMode, isLoading, isUpdating } = useProfileContext();
  const [activeTab, setActiveTab] = useState('notifications');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGhostModeModal, setShowGhostModeModal] = useState(false);

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      spaceInvites: true,
      eventReminders: true,
      toolUpdates: true,
      weeklyDigest: true,
      securityAlerts: true,
      directMessages: true,
      mentionsAndReplies: true,
      builderUpdates: false,
    },
    push: {
      spaceActivity: true,
      toolLaunches: true,
      eventReminders: true,
      directMessages: true,
      weeklyDigest: false,
      emergencyAlerts: true,
    },
    inApp: {
      realTimeNotifications: true,
      soundEffects: true,
      desktopNotifications: true,
      emailPreview: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    spaceSettings: {},
  });

  const [userSpaces] = useState<UserSpace[]>([
    { id: 'space-1', name: 'CS Study Group' },
    { id: 'space-2', name: 'Dorm Life @ Ellicott' },
    { id: 'space-3', name: 'UB Gaming Club' },
  ]);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showActivity: true,
    showSpaces: true,
    showConnections: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    ghostMode: {
      enabled: false,
      level: 'moderate',
      duration: '1h',
      expiresAt: null,
    },
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    theme: 'dark',
    language: 'en',
    timezone: 'America/New_York',
    emailFrequency: 'daily',
    dataRetention: {
      autoDelete: false,
      retentionDays: 365,
    },
  });

  // Populate settings from profile
  useEffect(() => {
    if (!profile?.privacy) return;
    const privacy = profile.privacy as Record<string, unknown>;

    setPrivacySettings((prev) => ({
      ...prev,
      profileVisibility: privacy.isPublic ? 'public' : 'private',
      showActivity: Boolean(privacy.showActivity),
      showSpaces: Boolean(privacy.showSpaces),
      showConnections: Boolean(privacy.showConnections),
      showOnlineStatus: Boolean(privacy.showOnlineStatus),
      allowDirectMessages: Boolean(privacy.allowDirectMessages),
      ghostMode: (privacy.ghostMode as PrivacySettings['ghostMode']) ?? prev.ghostMode,
    }));
  }, [profile]);

  // Handlers
  const handleNotificationChange = useCallback(
    (category: keyof NotificationSettings, setting: string, value: boolean) => {
      setNotificationSettings((prev) => ({
        ...prev,
        [category]: { ...prev[category], [setting]: value },
      }));
      setHasChanges(true);
    },
    []
  );

  const handlePrivacyChange = useCallback((setting: keyof PrivacySettings, value: unknown) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }));
    setHasChanges(true);
  }, []);

  const handleAccountChange = useCallback((setting: keyof AccountSettings, value: unknown) => {
    setAccountSettings((prev) => ({ ...prev, [setting]: value }));
    setHasChanges(true);
  }, []);

  const handleSaveSettings = async () => {
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
      setHasChanges(false);
      setSaveSuccess(true);
    } catch (error) {
      logger.error('Failed to save settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
    } catch (error) {
      logger.error('Failed to toggle ghost mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const currentUser = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.identity?.id ?? '',
      name: profile.identity?.fullName || '',
      handle: profile.identity?.handle || '',
      email: profile.identity?.email || '',
      isVerified: profile.verification?.emailVerified ?? false,
    };
  }, [profile]);

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <header className="mb-8">
        <Breadcrumbs
          items={[
            { label: 'Profile', href: '/profile' },
            { label: 'Settings' },
          ]}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
            <p className="text-sm text-white/50 mt-1">
              Manage your HIVE account preferences and privacy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/profile')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {hasChanges && (
              <Button variant="primary" onClick={handleSaveSettings} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Success Toast */}
      <AnimatePresence>
        {saveSuccess && (
          <SuccessToast message="Settings saved successfully!" onClose={() => setSaveSuccess(false)} />
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold-500" />
              Email Notifications
            </h3>
            <div className="divide-y divide-white/[0.06]">
              <SettingRow
                label="Space Invitations"
                description="Get notified when you're invited to join a space"
                checked={notificationSettings.email.spaceInvites}
                onCheckedChange={(v) => handleNotificationChange('email', 'spaceInvites', v)}
              />
              <SettingRow
                label="Event Reminders"
                description="Reminders for upcoming events and meetings"
                checked={notificationSettings.email.eventReminders}
                onCheckedChange={(v) => handleNotificationChange('email', 'eventReminders', v)}
              />
              <SettingRow
                label="Tool Updates"
                description="New tool launches and updates from builders"
                checked={notificationSettings.email.toolUpdates}
                onCheckedChange={(v) => handleNotificationChange('email', 'toolUpdates', v)}
              />
              <SettingRow
                label="Weekly Digest"
                description="Summary of your week's activity and highlights"
                checked={notificationSettings.email.weeklyDigest}
                onCheckedChange={(v) => handleNotificationChange('email', 'weeklyDigest', v)}
              />
              <SettingRow
                label="Security Alerts"
                description="Important security and account notifications"
                checked={notificationSettings.email.securityAlerts}
                onCheckedChange={(v) => handleNotificationChange('email', 'securityAlerts', v)}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gold-500" />
              Push Notifications
            </h3>
            <div className="divide-y divide-white/[0.06]">
              <SettingRow
                label="Space Activity"
                description="Real-time notifications for space updates"
                checked={notificationSettings.push.spaceActivity}
                onCheckedChange={(v) => handleNotificationChange('push', 'spaceActivity', v)}
              />
              <SettingRow
                label="Tool Launches"
                description="Notifications when new tools are available"
                checked={notificationSettings.push.toolLaunches}
                onCheckedChange={(v) => handleNotificationChange('push', 'toolLaunches', v)}
              />
              <SettingRow
                label="Direct Messages"
                description="Instant notifications for direct messages"
                checked={notificationSettings.push.directMessages}
                onCheckedChange={(v) => handleNotificationChange('push', 'directMessages', v)}
              />
            </div>
          </Card>

          {/* Quiet Hours */}
          <Card className="p-6 border-gold-500/20 bg-gold-500/5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Moon className="h-5 w-5 text-gold-500" />
              Quiet Hours
              <Badge variant="default" className="text-xs bg-gold-500/20 text-gold-500 border-0">
                Focus Mode
              </Badge>
            </h3>
            <p className="text-sm text-white/50 mb-4">
              Pause non-urgent notifications during study time or when you need to focus.
            </p>
            <SettingRow
              label="Enable Quiet Hours"
              description="Emergency alerts will still come through"
              checked={notificationSettings.quietHours.enabled}
              onCheckedChange={(v) => {
                setNotificationSettings((prev) => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: v },
                }));
                setHasChanges(true);
              }}
            />
            {notificationSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Start Time</label>
                  <input
                    type="time"
                    value={notificationSettings.quietHours.startTime}
                    onChange={(e) => {
                      setNotificationSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, startTime: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:border-gold-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">End Time</label>
                  <input
                    type="time"
                    value={notificationSettings.quietHours.endTime}
                    onChange={(e) => {
                      setNotificationSettings((prev) => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, endTime: e.target.value },
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:border-gold-500/50 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Per-Space Notifications */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gold-500" />
              Space Notifications
            </h3>
            <p className="text-sm text-white/50 mb-4">
              Customize notifications for individual spaces.
            </p>
            <div className="space-y-2">
              {userSpaces.map((space) => (
                <div
                  key={space.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-sm font-medium text-gold-500">
                      {space.name.charAt(0)}
                    </div>
                    <span className="text-sm text-white">{space.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNotificationSettings((prev) => ({
                          ...prev,
                          spaceSettings: {
                            ...prev.spaceSettings,
                            [space.id]: {
                              ...prev.spaceSettings[space.id],
                              muted: !prev.spaceSettings[space.id]?.muted,
                            },
                          },
                        }));
                        setHasChanges(true);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        notificationSettings.spaceSettings[space.id]?.muted
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {notificationSettings.spaceSettings[space.id]?.muted ? 'Muted' : 'Mute'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-gold-500" />
              Profile Visibility
            </h3>
            <div className="divide-y divide-white/[0.06]">
              <SettingRow
                label="Show Activity Feed"
                description="Let others see your recent activity and interactions"
                checked={privacySettings.showActivity}
                onCheckedChange={(v) => handlePrivacyChange('showActivity', v)}
              />
              <SettingRow
                label="Show Spaces"
                description="Display the spaces you're part of on your profile"
                checked={privacySettings.showSpaces}
                onCheckedChange={(v) => handlePrivacyChange('showSpaces', v)}
              />
              <SettingRow
                label="Show Connections"
                description="Display your connections and network on your profile"
                checked={privacySettings.showConnections}
                onCheckedChange={(v) => handlePrivacyChange('showConnections', v)}
              />
              <SettingRow
                label="Show Online Status"
                description="Let others see when you're active on HIVE"
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(v) => handlePrivacyChange('showOnlineStatus', v)}
              />
              <SettingRow
                label="Allow Direct Messages"
                description="Let other students send you direct messages"
                checked={privacySettings.allowDirectMessages}
                onCheckedChange={(v) => handlePrivacyChange('allowDirectMessages', v)}
              />
            </div>
          </Card>

          {/* Ghost Mode */}
          <Card className="p-6 border-purple-500/20 bg-purple-500/5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-400" />
              Ghost Mode
              <Badge variant="default" className="text-xs bg-purple-500/20 text-purple-400 border-0">
                Focus Feature
              </Badge>
            </h3>
            <p className="text-sm text-white/50 mb-4">
              Stay focused during finals or study sessions while still accessing your tools and spaces.
            </p>
            <SettingRow
              label="Enable Ghost Mode"
              description="Reduce your visibility across campus"
              checked={privacySettings.ghostMode.enabled}
              onCheckedChange={() => setShowGhostModeModal(true)}
            />
            {privacySettings.ghostMode.enabled && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {(['30m', '1h', '4h', 'indefinite'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          handlePrivacyChange('ghostMode', { ...privacySettings.ghostMode, duration: d })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          privacySettings.ghostMode.duration === d
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                      >
                        {d === '30m' ? '30 min' : d === '1h' ? '1 hour' : d === '4h' ? '4 hours' : 'Until off'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Level</label>
                  <div className="space-y-2">
                    {([
                      { value: 'minimal', label: 'Minimal', desc: 'Hide online status only' },
                      { value: 'moderate', label: 'Moderate', desc: 'Hide status + activity feed' },
                      { value: 'maximum', label: 'Maximum', desc: 'Full stealth - appear offline everywhere' },
                    ] as const).map((level) => (
                      <button
                        key={level.value}
                        onClick={() =>
                          handlePrivacyChange('ghostMode', { ...privacySettings.ghostMode, level: level.value })
                        }
                        className={`w-full p-3 rounded-lg text-left transition border ${
                          privacySettings.ghostMode.level === level.value
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{level.label}</span>
                          {privacySettings.ghostMode.level === level.value && (
                            <Check className="h-4 w-4 text-purple-400" />
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-gold-500" />
              Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Theme</label>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-gold-500/20 text-gold-500 border-0">
                    Dark
                  </Badge>
                  <span className="text-xs text-white/40">(Locked to dark for vBETA)</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Email Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {(['immediate', 'daily', 'weekly', 'never'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => handleAccountChange('emailFrequency', freq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                        accountSettings.emailFrequency === freq
                          ? 'bg-gold-500 text-black'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gold-500" />
              Account Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm text-white/60">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{currentUser?.email}</span>
                  {currentUser?.isVerified && (
                    <Badge variant="default" className="text-xs bg-emerald-500/20 text-emerald-400 border-0">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-sm text-white/60">Campus</span>
                <span className="text-sm text-white">University at Buffalo</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-white/60">Status</span>
                <Badge variant="default" className="text-xs bg-emerald-500/20 text-emerald-400 border-0">
                  Active
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold-500" />
              Data & Privacy
            </h3>
            <SettingRow
              label="Auto-Delete Old Activity"
              description="Automatically delete your old posts and activity after a set period"
              checked={accountSettings.dataRetention.autoDelete}
              onCheckedChange={(v) =>
                handleAccountChange('dataRetention', { ...accountSettings.dataRetention, autoDelete: v })
              }
            />
            {accountSettings.dataRetention.autoDelete && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <label className="text-sm font-medium text-white mb-2 block">Keep Data For</label>
                <div className="flex gap-2">
                  {([90, 180, 365] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() =>
                        handleAccountChange('dataRetention', { ...accountSettings.dataRetention, retentionDays: days })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        accountSettings.dataRetention.retentionDays === days
                          ? 'bg-gold-500 text-black'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                      }`}
                    >
                      {days === 365 ? '1 year' : `${days} days`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <Button variant="secondary" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
              <p className="text-xs text-white/40 mt-2">Get a copy of all your data</p>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold-500" />
              Account Security
            </h3>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Your account is secure</span>
              </div>
              <p className="text-xs text-white/50">Last login: Today • Campus Network • Buffalo, NY</p>
            </div>
          </Card>

          <Card className="p-6 border-red-500/20 bg-red-500/5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Danger Zone
            </h3>
            <div className="p-4 border border-red-500/20 rounded-lg">
              <h4 className="text-sm font-medium text-red-400 mb-2">Delete Account</h4>
              <p className="text-xs text-white/50 mb-3">
                Permanently delete your HIVE account and all associated data. This cannot be undone.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        <ConfirmModal
          open={showGhostModeModal}
          onOpenChange={setShowGhostModeModal}
          title={privacySettings.ghostMode.enabled ? 'Disable Ghost Mode?' : 'Enable Ghost Mode?'}
          description={
            privacySettings.ghostMode.enabled
              ? "You'll return to normal visibility. Your activity and presence will be visible again."
              : "This will reduce your visibility. You'll still have access to all features with limited social presence."
          }
          confirmText={privacySettings.ghostMode.enabled ? 'Disable' : 'Enable'}
          cancelText="Cancel"
          onConfirm={handleToggleGhostMode}
        />

        <ConfirmModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          title="Delete Your Account?"
          description="This will permanently delete your HIVE account, all your data, tools, and connections. This cannot be undone."
          confirmText="Delete Forever"
          cancelText="Keep Account"
          onConfirm={() => {
            logger.info('Account deletion requested');
            setShowDeleteModal(false);
          }}
          variant="danger"
        />
      </AnimatePresence>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <ErrorBoundary>
      <ProfileContextProvider>
        <ProfileSettingsContent />
      </ProfileContextProvider>
    </ErrorBoundary>
  );
}
