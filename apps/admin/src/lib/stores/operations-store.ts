/**
 * Operations Center Store
 *
 * Zustand store for Operations Center state management.
 * Handles queue counts, feature flags, and admin workflows.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface QueueItem {
  id: string;
  type: 'report' | 'claim' | 'tool' | 'appeal';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown>;
}

export interface QueueCounts {
  reports: number;
  claims: number;
  tools: number;
  appeals: number;
  total: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'experimental' | 'infrastructure' | 'ui_ux' | 'tools' | 'spaces' | 'admin' | 'profile';
  rolloutPercentage: number;
  rollout?: {
    type: 'all' | 'percentage' | 'users' | 'schools' | 'ab_test';
    percentage?: number;
    targetUsers?: string[];
    targetSchools?: string[];
  };
  targetRoles: string[];
  allowlist: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  timestamp: string;
  campusId: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'builders' | 'admins' | 'space_members';
  targetSpaceId?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  recipientCount?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  active: boolean;
  lastActive: string;
}

// ============================================================================
// Store State
// ============================================================================

interface OperationsState {
  // Queue state
  queueCounts: QueueCounts;
  queueItems: {
    reports: QueueItem[];
    claims: QueueItem[];
    tools: QueueItem[];
    appeals: QueueItem[];
  };
  queueLoading: boolean;
  queueError: string | null;
  activeQueue: 'reports' | 'claims' | 'tools' | 'appeals' | null;

  // Feature flags
  featureFlags: FeatureFlag[];
  flagsLoading: boolean;
  flagsError: string | null;

  // Audit log
  auditLog: AuditLogEntry[];
  auditLoading: boolean;
  auditError: string | null;

  // Announcements
  announcements: Announcement[];
  announcementsLoading: boolean;
  announcementsError: string | null;

  // Admin users
  adminUsers: AdminUser[];
  adminsLoading: boolean;
  adminsError: string | null;

  // UI state
  activeSection: 'queues' | 'controls' | 'users' | 'spaces' | 'content' | 'tools' | 'comms' | 'system';

  // Actions
  setActiveSection: (section: OperationsState['activeSection']) => void;
  setActiveQueue: (queue: OperationsState['activeQueue']) => void;

  // Queue actions
  setQueueCounts: (counts: QueueCounts) => void;
  setQueueItems: (type: keyof OperationsState['queueItems'], items: QueueItem[]) => void;
  setQueueLoading: (loading: boolean) => void;
  setQueueError: (error: string | null) => void;
  removeQueueItem: (type: keyof OperationsState['queueItems'], id: string) => void;

  // Feature flag actions
  setFeatureFlags: (flags: FeatureFlag[]) => void;
  setFlagsLoading: (loading: boolean) => void;
  setFlagsError: (error: string | null) => void;
  updateFlag: (id: string, updates: Partial<FeatureFlag>) => void;
  toggleFlag: (id: string) => Promise<void>;

  // Audit actions
  setAuditLog: (entries: AuditLogEntry[]) => void;
  setAuditLoading: (loading: boolean) => void;
  addAuditEntry: (entry: AuditLogEntry) => void;

  // Announcement actions
  setAnnouncements: (announcements: Announcement[]) => void;
  setAnnouncementsLoading: (loading: boolean) => void;
  setAnnouncementsError: (error: string | null) => void;
  addAnnouncement: (announcement: Announcement) => void;
  fetchAnnouncements: () => Promise<void>;

  // Fetch actions
  fetchQueueCounts: () => Promise<void>;
  fetchQueueItems: (type: keyof OperationsState['queueItems']) => Promise<void>;
  fetchFeatureFlags: () => Promise<void>;
  fetchAuditLog: (limit?: number) => Promise<void>;

  // Queue resolution actions
  resolveReport: (reportId: string, action: 'dismiss' | 'warn' | 'remove' | 'ban', notes?: string) => Promise<void>;
  resolveClaim: (claimId: string, action: 'approve' | 'reject', notes?: string) => Promise<void>;
  resolveToolReview: (toolId: string, action: 'approve' | 'reject' | 'request_changes', feedback?: string) => Promise<void>;
  resolveAppeal: (appealId: string, action: 'uphold' | 'overturn', notes?: string) => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useOperationsStore = create<OperationsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    queueCounts: { reports: 0, claims: 0, tools: 0, appeals: 0, total: 0 },
    queueItems: {
      reports: [],
      claims: [],
      tools: [],
      appeals: [],
    },
    queueLoading: false,
    queueError: null,
    activeQueue: null,

    featureFlags: [],
    flagsLoading: false,
    flagsError: null,

    auditLog: [],
    auditLoading: false,
    auditError: null,

    announcements: [],
    announcementsLoading: false,
    announcementsError: null,

    adminUsers: [],
    adminsLoading: false,
    adminsError: null,

    activeSection: 'queues',

    // Section management
    setActiveSection: (section) => set({ activeSection: section }),
    setActiveQueue: (queue) => set({ activeQueue: queue }),

    // Queue management
    setQueueCounts: (counts) => set({ queueCounts: counts }),
    setQueueItems: (type, items) => set((state) => ({
      queueItems: { ...state.queueItems, [type]: items },
    })),
    setQueueLoading: (loading) => set({ queueLoading: loading }),
    setQueueError: (error) => set({ queueError: error }),
    removeQueueItem: (type, id) => set((state) => ({
      queueItems: {
        ...state.queueItems,
        [type]: state.queueItems[type].filter(item => item.id !== id),
      },
      queueCounts: {
        ...state.queueCounts,
        [type]: Math.max(0, state.queueCounts[type as keyof QueueCounts] as number - 1),
        total: Math.max(0, state.queueCounts.total - 1),
      },
    })),

    // Feature flag management
    setFeatureFlags: (flags) => set({ featureFlags: flags }),
    setFlagsLoading: (loading) => set({ flagsLoading: loading }),
    setFlagsError: (error) => set({ flagsError: error }),
    updateFlag: (id, updates) => set((state) => ({
      featureFlags: state.featureFlags.map(flag =>
        flag.id === id ? { ...flag, ...updates, updatedAt: new Date().toISOString() } : flag
      ),
    })),

    // Audit management
    setAuditLog: (entries) => set({ auditLog: entries }),
    setAuditLoading: (loading) => set({ auditLoading: loading }),
    addAuditEntry: (entry) => set((state) => ({
      auditLog: [entry, ...state.auditLog].slice(0, 100),
    })),

    // Announcement management
    setAnnouncements: (announcements) => set({ announcements }),
    setAnnouncementsLoading: (loading) => set({ announcementsLoading: loading }),
    setAnnouncementsError: (error) => set({ announcementsError: error }),
    addAnnouncement: (announcement) => set((state) => ({
      announcements: [announcement, ...state.announcements],
    })),

    // Fetch queue counts
    fetchQueueCounts: async () => {
      const { setQueueLoading, setQueueCounts, setQueueError } = get();
      setQueueLoading(true);

      try {
        // Fetch from pulse endpoint which has counts
        const response = await fetch('/api/admin/command/pulse', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          const pulse = result.data.pulse;
          setQueueCounts({
            reports: pulse.reportsPending || 0,
            claims: pulse.claimsPending || 0,
            tools: pulse.toolsPending || 0,
            appeals: pulse.appealsPending || 0,
            total: (pulse.reportsPending || 0) + (pulse.claimsPending || 0) +
                   (pulse.toolsPending || 0) + (pulse.appealsPending || 0),
          });
        }
      } catch (error) {
        setQueueError(error instanceof Error ? error.message : 'Failed to fetch queue counts');
      } finally {
        setQueueLoading(false);
      }
    },

    // Fetch queue items
    fetchQueueItems: async (type) => {
      const { setQueueLoading, setQueueItems, setQueueError } = get();
      setQueueLoading(true);

      try {
        const endpoints: Record<string, string> = {
          reports: '/api/admin/moderation/reports',
          claims: '/api/admin/claims',
          tools: '/api/admin/tools/pending',
          appeals: '/api/admin/moderation/appeals',
        };

        const response = await fetch(endpoints[type], {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // Transform to queue items
          const items: QueueItem[] = (result.data.items || result.data || []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            type,
            title: item.title as string || item.name as string || `${type} #${item.id}`,
            description: item.description as string || item.reason as string || '',
            priority: item.priority as QueueItem['priority'] || 'medium',
            createdAt: item.createdAt as string || new Date().toISOString(),
            entityId: item.entityId as string || item.targetId as string || item.id as string,
            entityType: item.entityType as string || item.contentType as string || type,
            metadata: item,
          }));
          setQueueItems(type, items);
        }
      } catch (error) {
        setQueueError(error instanceof Error ? error.message : 'Failed to fetch queue items');
      } finally {
        setQueueLoading(false);
      }
    },

    // Fetch feature flags
    fetchFeatureFlags: async () => {
      const { setFlagsLoading, setFeatureFlags, setFlagsError } = get();
      setFlagsLoading(true);

      try {
        const response = await fetch('/api/admin/feature-flags', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setFeatureFlags(result.data.flags || result.data || []);
        }
      } catch (error) {
        setFlagsError(error instanceof Error ? error.message : 'Failed to fetch feature flags');
      } finally {
        setFlagsLoading(false);
      }
    },

    // Fetch audit log
    fetchAuditLog: async (limit = 50) => {
      const { setAuditLoading, setAuditLog } = get();
      setAuditLoading(true);

      try {
        const response = await fetch(`/api/admin/logs?limit=${limit}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setAuditLog(result.data.logs || result.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch audit log:', error);
      } finally {
        setAuditLoading(false);
      }
    },

    // Fetch announcements
    fetchAnnouncements: async () => {
      const { setAnnouncementsLoading, setAnnouncements, setAnnouncementsError } = get();
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);

      try {
        const response = await fetch('/api/admin/announcements', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setAnnouncements(result.data?.announcements || result.announcements || []);
        }
      } catch (error) {
        setAnnouncementsError(error instanceof Error ? error.message : 'Failed to fetch announcements');
      } finally {
        setAnnouncementsLoading(false);
      }
    },

    // Toggle feature flag
    toggleFlag: async (id) => {
      const { featureFlags, updateFlag, addAuditEntry } = get();
      const flag = featureFlags.find(f => f.id === id);
      if (!flag) return;

      const newValue = !flag.enabled;

      try {
        const response = await fetch(`/api/admin/feature-flags/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: newValue }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        updateFlag(id, { enabled: newValue });

        // Add audit entry
        addAuditEntry({
          id: `audit-${Date.now()}`,
          adminId: 'current',
          adminName: 'Admin',
          action: newValue ? 'enable_flag' : 'disable_flag',
          targetType: 'feature_flag',
          targetId: id,
          details: { flagName: flag.name, enabled: newValue },
          timestamp: new Date().toISOString(),
          campusId: 'current',
        });
      } catch (error) {
        console.error('Failed to toggle flag:', error);
        throw error;
      }
    },

    // Resolve report
    resolveReport: async (reportId, action, notes) => {
      const { removeQueueItem, addAuditEntry } = get();

      try {
        const response = await fetch(`/api/admin/moderation/reports/${reportId}/resolve`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, notes }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        removeQueueItem('reports', reportId);
        addAuditEntry({
          id: `audit-${Date.now()}`,
          adminId: 'current',
          adminName: 'Admin',
          action: `report_${action}`,
          targetType: 'report',
          targetId: reportId,
          details: { action, notes },
          timestamp: new Date().toISOString(),
          campusId: 'current',
        });
      } catch (error) {
        console.error('Failed to resolve report:', error);
        throw error;
      }
    },

    // Resolve claim
    resolveClaim: async (claimId, action, notes) => {
      const { removeQueueItem, addAuditEntry } = get();

      try {
        const response = await fetch('/api/admin/claims', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimId, action, notes }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        removeQueueItem('claims', claimId);
        addAuditEntry({
          id: `audit-${Date.now()}`,
          adminId: 'current',
          adminName: 'Admin',
          action: `claim_${action}`,
          targetType: 'claim',
          targetId: claimId,
          details: { action, notes },
          timestamp: new Date().toISOString(),
          campusId: 'current',
        });
      } catch (error) {
        console.error('Failed to resolve claim:', error);
        throw error;
      }
    },

    // Resolve tool review
    resolveToolReview: async (toolId, action, feedback) => {
      const { removeQueueItem, addAuditEntry } = get();

      try {
        const endpoint = action === 'approve'
          ? `/api/admin/tools/${toolId}/approve`
          : `/api/admin/tools/${toolId}/reject`;

        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        removeQueueItem('tools', toolId);
        addAuditEntry({
          id: `audit-${Date.now()}`,
          adminId: 'current',
          adminName: 'Admin',
          action: `tool_${action}`,
          targetType: 'tool',
          targetId: toolId,
          details: { action, feedback },
          timestamp: new Date().toISOString(),
          campusId: 'current',
        });
      } catch (error) {
        console.error('Failed to resolve tool review:', error);
        throw error;
      }
    },

    // Resolve appeal
    resolveAppeal: async (appealId, action, notes) => {
      const { removeQueueItem, addAuditEntry } = get();

      try {
        const response = await fetch('/api/admin/moderation/appeals', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appealId, action, notes }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        removeQueueItem('appeals', appealId);
        addAuditEntry({
          id: `audit-${Date.now()}`,
          adminId: 'current',
          adminName: 'Admin',
          action: `appeal_${action}`,
          targetType: 'appeal',
          targetId: appealId,
          details: { action, notes },
          timestamp: new Date().toISOString(),
          campusId: 'current',
        });
      } catch (error) {
        console.error('Failed to resolve appeal:', error);
        throw error;
      }
    },
  }))
);

// ============================================================================
// Selectors
// ============================================================================

export const selectQueueCounts = (state: OperationsState) => state.queueCounts;
export const selectActiveQueue = (state: OperationsState) => state.activeQueue;
export const selectQueueItems = (type: keyof OperationsState['queueItems']) =>
  (state: OperationsState) => state.queueItems[type];
export const selectFeatureFlags = (state: OperationsState) => state.featureFlags;
export const selectAuditLog = (state: OperationsState) => state.auditLog;
export const selectActiveSection = (state: OperationsState) => state.activeSection;

// Computed selectors
export const selectEnabledFlags = (state: OperationsState) =>
  state.featureFlags.filter(f => f.enabled);

export const selectHighPriorityItems = (state: OperationsState) => {
  const { reports, claims, tools, appeals } = state.queueItems;
  return [...reports, ...claims, ...tools, ...appeals]
    .filter(item => item.priority === 'high' || item.priority === 'critical')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const selectAnnouncements = (state: OperationsState) => state.announcements;
export const selectRecentAnnouncements = (state: OperationsState) =>
  state.announcements.slice(0, 5);
