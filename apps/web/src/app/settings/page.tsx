'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import { useDebouncedCallback } from '@hive/hooks';
import { logger } from '@/lib/structured-logger';
import { sanitizeDisplayName, sanitizeBio, sanitizeHandle } from '@/lib/sanitize';
import {
  Card,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@hive/ui';
import { ProfileContextProvider, useProfileContext } from '@/components/profile/ProfileContextProvider';
import { GhostModeModal } from '@/components/privacy/GhostModeModal';
import { useGhostMode } from '@/hooks/use-ghost-mode';
import { getGhostModeLevelConfig } from '@/lib/ghost-mode-constants';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Mail,
  Users,
  Moon,
  Trash2,
  Check,
  Loader2,
  X,
  Save,
  AlertTriangle,
  Eye,
  Smartphone,
  CalendarClock,
  Link2,
  Unlink,
  Download,
  LogOut,
  ExternalLink,
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

interface CalendarStatus {
  available: boolean;
  connected: boolean;
  provider?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  sharing?: { enabled: boolean; spaceIds: string[] };
}

// =============================================================================
// UI Components
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-[var(--hive-brand-primary)]' : 'bg-white/20'}
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
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
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
  requireTyping = false,
  typingWord = 'DELETE',
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
  requireTyping?: boolean;
  typingWord?: string;
}) {
  const [typedText, setTypedText] = useState('');

  if (!open) return null;

  const canConfirm = !requireTyping || typedText === typingWord;

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
        className={`relative w-full max-w-md mx-4 rounded-xl bg-neutral-950 border p-6 shadow-2xl ${
          variant === 'danger' ? 'border-red-500/30' : 'border-white/[0.08]'
        }`}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {variant === 'danger' && (
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-400" />
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mb-2 text-center">{title}</h2>
        <p className="text-sm text-white/60 mb-6 text-center">{description}</p>

        {requireTyping && (
          <div className="mb-6">
            <p className="text-sm text-white mb-2 text-center">Type &quot;{typingWord}&quot; to confirm:</p>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`Type ${typingWord}`}
              className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder:text-white/30 focus:outline-none ${
                variant === 'danger' ? 'border-red-500/30 focus:border-red-500' : 'border-white/20 focus:border-white/40'
              }`}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setTypedText('');
              onOpenChange(false);
            }}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={() => {
              onConfirm();
              setTypedText('');
            }}
            disabled={isLoading || !canConfirm}
            className="flex-1"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title} section`}
        className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[var(--hive-brand-primary)]" aria-hidden="true" />
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <Badge variant="default" className="text-xs bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
              {badge}
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Settings Content
// =============================================================================

function UnifiedSettingsContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hiveProfile: profile, updateProfile, toggleGhostMode, isLoading: profileLoading, isUpdating } = useProfileContext();

  // Ghost Mode hook for proper state management
  const ghostMode = useGhostMode();

  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: '',
    handle: '',
    bio: '',
  });
  const [originalFormData, setOriginalFormData] = useState({
    fullName: '',
    handle: '',
    bio: '',
  });

  // Calendar state
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
    emailFrequency: 'daily',
    dataRetention: {
      autoDelete: false,
      retentionDays: 365,
    },
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGhostModeModal, setShowGhostModeModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    currentItem: string;
  } | null>(null);

  // Feature flags - Ghost Mode is feature-flagged
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);

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
        }
      } catch (error) {
        // Ghost mode disabled by default if flag check fails
        setGhostModeEnabled(false);
      }
    }
    loadFeatureFlags();
  }, []);

  // Populate form data from profile
  useEffect(() => {
    if (!profile?.identity) return;
    const identity = profile.identity as { fullName?: string; handle?: string; bio?: string };
    const data = {
      fullName: identity.fullName || '',
      handle: identity.handle || '',
      bio: identity.bio || '',
    };
    setFormData(data);
    setOriginalFormData(data);
  }, [profile]);

  // Populate privacy settings from profile
  useEffect(() => {
    if (!profile?.privacy) return;
    const privacy = profile.privacy as Record<string, unknown>;
    setPrivacySettings((prev) => ({
      ...prev,
      profileVisibility: privacy.isPublic ? 'public' : 'private',
      showActivity: Boolean(privacy.showActivity ?? true),
      showSpaces: Boolean(privacy.showSpaces ?? true),
      showConnections: Boolean(privacy.showConnections ?? true),
      showOnlineStatus: Boolean(privacy.showOnlineStatus ?? true),
      allowDirectMessages: Boolean(privacy.allowDirectMessages ?? true),
      ghostMode: (privacy.ghostMode as PrivacySettings['ghostMode']) ?? prev.ghostMode,
    }));
  }, [profile]);

  // Load calendar status
  const loadCalendarStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/status', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data);
      }
    } catch (error) {
      console.error('Failed to load calendar status:', error);
    } finally {
      setIsCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarStatus();

    // Check URL params for calendar connection result
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

  // Track form changes
  useEffect(() => {
    const formChanged =
      formData.fullName !== originalFormData.fullName ||
      formData.handle !== originalFormData.handle ||
      formData.bio !== originalFormData.bio;
    setHasChanges(formChanged);
  }, [formData, originalFormData]);

  // Track pending settings changes to batch and debounce
  const pendingNotificationRef = useRef<Partial<NotificationSettings>>({});
  const pendingPrivacyRef = useRef<Partial<PrivacySettings>>({});

  // Debounced API save for notification settings (prevents race conditions)
  const saveNotificationSettings = useDebouncedCallback(
    async (...args: unknown[]) => {
      const settings = args[0] as NotificationSettings;
      try {
        await fetch('/api/profile/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(settings),
        });
      } catch (error) {
        logger.error('Failed to save notification settings', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    500 // 500ms debounce to batch rapid toggles
  );

  // Handlers
  const handleNotificationChange = useCallback(
    (category: keyof NotificationSettings, setting: string, value: boolean) => {
      setNotificationSettings((prev) => {
        const updated = {
          ...prev,
          [category]: { ...(prev[category] as Record<string, boolean>), [setting]: value },
        };
        // Schedule debounced save
        saveNotificationSettings(updated);
        return updated;
      });
    },
    [saveNotificationSettings]
  );

  const handlePrivacyChange = useCallback((setting: keyof PrivacySettings, value: unknown) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }));
  }, []);

  const handleAccountChange = useCallback((setting: keyof AccountSettings, value: unknown) => {
    setAccountSettings((prev) => ({ ...prev, [setting]: value }));
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Sanitize all user input before saving
      const sanitizedFullName = sanitizeDisplayName(formData.fullName);
      const sanitizedBio = sanitizeBio(formData.bio);
      const sanitizedHandle = sanitizeHandle(formData.handle);

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: sanitizedFullName,
          bio: sanitizedBio,
          ...(formData.handle !== originalFormData.handle && { handle: sanitizedHandle }),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setOriginalFormData(formData);
      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

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
      console.error('Failed to disconnect calendar:', error);
      toast.error('Failed to disconnect calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    setExportProgress({ current: 0, total: 6, currentItem: 'Starting...' });

    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      exportVersion: '2.0',
      exportedBy: formData.handle || 'user',
    };

    const errors: string[] = [];

    // Helper to fetch with error handling
    const safeFetch = async (
      url: string,
      key: string,
      progressLabel: string,
      progressIndex: number
    ): Promise<unknown> => {
      setExportProgress({ current: progressIndex, total: 6, currentItem: progressLabel });
      try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
          errors.push(`Failed to fetch ${key}`);
          return null;
        }
        const data = await response.json();
        return data.data || data;
      } catch (error) {
        errors.push(`Error fetching ${key}: ${error instanceof Error ? error.message : 'Unknown'}`);
        return null;
      }
    };

    try {
      // 1. Profile data (includes interests, basic info)
      const profileData = await safeFetch('/api/profile', 'profile', 'Profile', 1);
      if (profileData) {
        exportData.profile = profileData;
      }

      // 2. Spaces with membership details
      const spacesData = await safeFetch('/api/profile/my-spaces', 'spaces', 'Spaces', 2);
      if (spacesData) {
        const spaces = spacesData as { spaces?: unknown[]; categorized?: Record<string, unknown>; counts?: Record<string, number> };
        exportData.spaces = {
          list: spaces.spaces || [],
          categorized: spaces.categorized || {},
          counts: spaces.counts || {},
        };
      }

      // 3. Connections with full details
      const connectionsData = await safeFetch('/api/connections', 'connections', 'Connections', 3);
      if (connectionsData) {
        const connections = connectionsData as { connections?: unknown[]; stats?: Record<string, number> };
        exportData.connections = {
          list: connections.connections || [],
          stats: connections.stats || {},
        };
      }

      // 4. Tools created in HiveLab
      const toolsData = await safeFetch('/api/tools?limit=100&creatorOnly=true', 'tools', 'Tools', 4);
      if (toolsData) {
        const tools = toolsData as { tools?: unknown[]; pagination?: { total?: number } };
        exportData.tools = {
          list: tools.tools || [],
          totalCount: tools.pagination?.total || 0,
        };
      }

      // 5. Calendar events
      const calendarData = await safeFetch('/api/profile/calendar/events', 'calendar', 'Calendar', 5);
      if (calendarData) {
        const calendar = calendarData as { events?: unknown[] };
        exportData.calendar = {
          events: calendar.events || [],
        };
      }

      // 6. Activity summary
      setExportProgress({ current: 6, total: 6, currentItem: 'Finalizing...' });
      const activityData = await safeFetch('/api/profile/activity', 'activity', 'Activity', 6);
      if (activityData) {
        exportData.activity = activityData;
      }

      // Add any errors encountered
      if (errors.length > 0) {
        exportData._exportWarnings = errors;
      }

      // Download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hive-complete-export-${formData.handle || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (errors.length > 0) {
        toast.success(`Data exported with ${errors.length} partial failures. Check the file for details.`);
      } else {
        toast.success('Your complete data has been downloaded');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data');
    } finally {
      setIsDownloading(false);
      setExportProgress(null);
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
      console.error('Delete account error:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[var(--hive-brand-primary)] animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/60 mt-1">Manage your account, privacy, and preferences</p>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/5 p-1 rounded-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-white/10">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white/10">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 data-[state=active]:bg-white/10">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-white/10">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* ============== PROFILE TAB ============== */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Handle</label>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, handle: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none"
                    />
                    <p className="text-xs text-white/40 mt-1">Handle changes are rate-limited</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || profile?.identity?.email || ''}
                    disabled
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-[var(--hive-brand-primary)] focus:outline-none resize-none"
                    placeholder="Tell others about yourself..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/profile/edit')}
                  aria-label="Open profile layout editor"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                  Customize Layout
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasChanges}
                  aria-label={isSaving ? 'Saving profile changes' : 'Save profile changes'}
                  className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-primary)]/90 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ============== NOTIFICATIONS TAB ============== */}
          <TabsContent value="notifications" className="space-y-6">
            <CollapsibleSection title="Email Notifications" icon={Mail} defaultOpen={true}>
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
                <SettingRow
                  label="Direct Messages"
                  description="Email notifications for direct messages"
                  checked={notificationSettings.email.directMessages}
                  onCheckedChange={(v) => handleNotificationChange('email', 'directMessages', v)}
                />
                <SettingRow
                  label="Mentions & Replies"
                  description="Get notified when someone mentions or replies to you"
                  checked={notificationSettings.email.mentionsAndReplies}
                  onCheckedChange={(v) => handleNotificationChange('email', 'mentionsAndReplies', v)}
                />
                <SettingRow
                  label="Builder Updates"
                  description="Updates about HiveLab and tool building features"
                  checked={notificationSettings.email.builderUpdates}
                  onCheckedChange={(v) => handleNotificationChange('email', 'builderUpdates', v)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Push Notifications" icon={Smartphone}>
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
                  label="Event Reminders"
                  description="Push reminders for upcoming events"
                  checked={notificationSettings.push.eventReminders}
                  onCheckedChange={(v) => handleNotificationChange('push', 'eventReminders', v)}
                />
                <SettingRow
                  label="Direct Messages"
                  description="Instant notifications for direct messages"
                  checked={notificationSettings.push.directMessages}
                  onCheckedChange={(v) => handleNotificationChange('push', 'directMessages', v)}
                />
                <SettingRow
                  label="Emergency Alerts"
                  description="Critical campus and safety notifications"
                  checked={notificationSettings.push.emergencyAlerts}
                  onCheckedChange={(v) => handleNotificationChange('push', 'emergencyAlerts', v)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="In-App Notifications" icon={Bell}>
              <div className="divide-y divide-white/[0.06]">
                <SettingRow
                  label="Real-time Notifications"
                  description="Show notifications as they arrive"
                  checked={notificationSettings.inApp.realTimeNotifications}
                  onCheckedChange={(v) => handleNotificationChange('inApp', 'realTimeNotifications', v)}
                />
                <SettingRow
                  label="Sound Effects"
                  description="Play sounds for notifications"
                  checked={notificationSettings.inApp.soundEffects}
                  onCheckedChange={(v) => handleNotificationChange('inApp', 'soundEffects', v)}
                />
                <SettingRow
                  label="Desktop Notifications"
                  description="Show browser notifications"
                  checked={notificationSettings.inApp.desktopNotifications}
                  onCheckedChange={(v) => handleNotificationChange('inApp', 'desktopNotifications', v)}
                />
              </div>
            </CollapsibleSection>

            {/* Quiet Hours */}
            <Card className="p-6 border-[var(--hive-brand-primary)]/20 bg-[var(--hive-brand-primary)]/5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Moon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                Quiet Hours
                <Badge variant="default" className="text-xs bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
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
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:border-[var(--hive-brand-primary)]/50 focus:outline-none"
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
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-white text-sm focus:border-[var(--hive-brand-primary)]/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Per-Space Notifications */}
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                Space Notifications
              </h3>
              <p className="text-sm text-white/50 mb-4">Customize notifications for individual spaces.</p>
              <div className="space-y-2">
                {userSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--hive-brand-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--hive-brand-primary)]">
                        {space.name.charAt(0)}
                      </div>
                      <span className="text-sm text-white">{space.name}</span>
                    </div>
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
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ============== PRIVACY TAB ============== */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-[var(--hive-brand-primary)]" />
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
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <Button
                  onClick={handleSavePrivacy}
                  disabled={isUpdating}
                  aria-label={isUpdating ? 'Saving privacy settings' : 'Save privacy settings'}
                  className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-primary)]/90"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : <Save className="h-4 w-4 mr-2" aria-hidden="true" />}
                  Save Privacy Settings
                </Button>
              </div>
            </Card>

            {/* Ghost Mode - Feature Flagged */}
            {ghostModeEnabled && (
              <Card className="p-6 border-white/[0.08] bg-white/[0.02]">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-white/60" />
                  Ghost Mode
                  <Badge variant="default" className="text-xs bg-white/10 text-white/60 border-0">
                    Privacy
                  </Badge>
                </h3>
                <p className="text-sm text-white/50 mb-4">
                  Control your visibility across HIVE. Stay focused during study sessions or go invisible when you need privacy.
                </p>

                {ghostMode.isEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04] border border-white/10">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const levelConfig = getGhostModeLevelConfig(ghostMode.state.level);
                          const LevelIcon = levelConfig.icon;
                          return (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <LevelIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{levelConfig.label}</p>
                                <p className="text-xs text-white/50">{levelConfig.description}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      {ghostMode.expiresAt && (
                        <div className="text-right">
                          <p className="text-xs text-white/40">Expires in</p>
                          <p className="text-sm font-mono text-white/70">
                            {ghostMode.timeRemaining
                              ? `${Math.floor(ghostMode.timeRemaining / (1000 * 60 * 60))}h ${Math.floor((ghostMode.timeRemaining % (1000 * 60 * 60)) / (1000 * 60))}m`
                              : 'Soon'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setShowGhostModeModal(true)}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Change Settings
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => ghostMode.disable()}
                        className="text-white/60 hover:text-white hover:bg-white/[0.06]"
                      >
                        Turn Off
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setShowGhostModeModal(true)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Enable Ghost Mode
                  </Button>
                )}
              </Card>
            )}

            {/* Ghost Mode Modal */}
            <GhostModeModal
              open={showGhostModeModal}
              onOpenChange={setShowGhostModeModal}
              currentState={{
                enabled: ghostMode.isEnabled,
                level: ghostMode.state.level,
                expiresAt: ghostMode.expiresAt,
              }}
              onActivate={async (level, duration) => {
                const success = await ghostMode.enable(level, duration);
                if (success) {
                  toast.success('Ghost Mode activated');
                }
                return success;
              }}
              onDeactivate={async () => {
                const success = await ghostMode.disable();
                if (success) {
                  toast.success('Ghost Mode deactivated');
                }
                return success;
              }}
            />
          </TabsContent>

          {/* ============== ACCOUNT TAB ============== */}
          <TabsContent value="account" className="space-y-6">
            {/* Connected Calendars */}
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                Connected Calendars
              </h3>
              {isCalendarLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              ) : !calendarStatus?.available ? (
                <div className="py-4 text-center">
                  <p className="text-white/50 text-sm">Calendar integration is not available at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-white/50 text-sm">
                    Connect your calendar to help space leaders find the best times for events. Only your free/busy times are shared.
                  </p>
                  {calendarStatus.connected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">Google Calendar Connected</p>
                            <p className="text-emerald-400/80 text-xs">
                              {calendarStatus.lastSyncedAt
                                ? `Last synced ${new Date(calendarStatus.lastSyncedAt).toLocaleDateString()}`
                                : 'Syncing...'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={handleCalendarDisconnect}
                          disabled={isDisconnecting}
                          aria-label={isDisconnecting ? 'Disconnecting calendar' : 'Disconnect Google Calendar'}
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                          {isDisconnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              <Unlink className="h-4 w-4 mr-2" aria-hidden="true" />
                              Disconnect
                            </>
                          )}
                        </Button>
                      </div>
                      <SettingRow
                        label="Share availability with spaces"
                        description="Space leaders can see when you're free to schedule better events"
                        checked={calendarStatus.sharing?.enabled ?? true}
                        onCheckedChange={async (v) => {
                          try {
                            await fetch('/api/calendar/status', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                sharing: { enabled: v, spaceIds: calendarStatus.sharing?.spaceIds || [] },
                              }),
                            });
                            await loadCalendarStatus();
                          } catch (err) {
                            console.error('Failed to update sharing:', err);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <Button
                      onClick={handleCalendarConnect}
                      aria-label="Connect your Google Calendar account"
                      className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    >
                      <Link2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Connect Google Calendar
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Preferences */}
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Theme</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
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
                            ? 'bg-[var(--hive-brand-primary)] text-black'
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

            {/* Data Management */}
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                Data Management
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
                            ? 'bg-[var(--hive-brand-primary)] text-black'
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
                <Button
                  variant="secondary"
                  onClick={handleDownloadData}
                  disabled={isDownloading}
                  aria-label={isDownloading ? 'Downloading your data' : 'Download a complete copy of all your data'}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                      {exportProgress
                        ? `${exportProgress.currentItem} (${exportProgress.current}/${exportProgress.total})`
                        : 'Preparing...'}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                      Download My Data
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/40 mt-2">
                  {isDownloading
                    ? 'Gathering your profile, spaces, connections, tools, and calendar...'
                    : 'Get a complete copy of all your data including spaces, connections, tools, and events'}
                </p>
              </div>
            </Card>

            {/* Sign Out */}
            <Card className="p-6 bg-white/5 border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Sign Out</h3>
                  <p className="text-white/50 text-sm">Sign out of your HIVE account on this device</p>
                </div>
                <Button
                  variant="secondary"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={logout}
                  aria-label="Sign out of your HIVE account"
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  Sign Out
                </Button>
              </div>
            </Card>

            {/* Danger Zone */}
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
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default function SettingsPage() {
  return (
    <ProfileContextProvider>
      <UnifiedSettingsContent />
    </ProfileContextProvider>
  );
}
