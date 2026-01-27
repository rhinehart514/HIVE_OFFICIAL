/**
 * Command Center Store
 *
 * Zustand store for real-time Command Center state management.
 * Handles SSE connection, metrics caching, and cross-component state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface PulseMetrics {
  activeUsers: number;
  totalUsers: number;
  totalSpaces: number;
  totalEvents: number;
  postsToday: number;
  reportsPending: number;
  toolsPending: number;
  claimsPending: number;
  appealsPending: number;
  weeklyGrowth: {
    users: number;
    spaces: number;
    engagement: number;
  };
  spacesAtRisk: number;
  updatedAt: string;
}

export interface RecentActivity {
  id: string;
  type: 'user_signup' | 'space_created' | 'event_created' | 'post_created' | 'tool_deployed';
  entityId: string;
  entityName: string;
  timestamp: string;
}

export interface TerritoryNode {
  id: string;
  name: string;
  handle: string;
  category: string;
  memberCount: number;
  postCount: number;
  eventCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  status: 'active' | 'inactive' | 'at_risk';
  createdAt: string;
  size: number;
  color: string;
}

export interface TerritoryConnection {
  source: string;
  target: string;
  strength: number;
}

export interface CategoryCluster {
  category: string;
  label: string;
  color: string;
  spaceCount: number;
  totalMembers: number;
}

export interface HealthIndicator {
  dimension: string;
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface AtRiskItem {
  id: string;
  type: 'space' | 'user';
  name: string;
  risk: string;
  lastActivity: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TrendAlert {
  id: string;
  metric: string;
  direction: 'up' | 'down';
  change: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  detectedAt: string;
}

export interface AdminEvent {
  type: 'user_signup' | 'space_created' | 'report_filed' | 'tool_deployed' | 'error_spike' | 'metric_update';
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// Store State
// ============================================================================

interface CommandState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  lastConnectedAt: string | null;

  // Active view
  activeView: 'pulse' | 'territory' | 'momentum' | 'health' | 'impact';

  // Pulse data
  pulse: PulseMetrics | null;
  recentActivity: RecentActivity[];
  pulseLoading: boolean;
  pulseError: string | null;

  // Territory data
  territoryNodes: TerritoryNode[];
  territoryConnections: TerritoryConnection[];
  territoryClusters: CategoryCluster[];
  territoryLoading: boolean;
  territoryError: string | null;

  // Health data
  overallHealthScore: number;
  overallHealthStatus: 'healthy' | 'warning' | 'critical';
  healthIndicators: HealthIndicator[];
  atRiskSpaces: AtRiskItem[];
  trendAlerts: TrendAlert[];
  healthLoading: boolean;
  healthError: string | null;

  // Real-time event buffer
  eventBuffer: AdminEvent[];
  maxBufferSize: number;

  // Actions
  setActiveView: (view: CommandState['activeView']) => void;
  setConnected: (connected: boolean, error?: string) => void;

  // Pulse actions
  setPulse: (pulse: PulseMetrics, activity?: RecentActivity[]) => void;
  setPulseLoading: (loading: boolean) => void;
  setPulseError: (error: string | null) => void;

  // Territory actions
  setTerritory: (nodes: TerritoryNode[], connections: TerritoryConnection[], clusters: CategoryCluster[]) => void;
  setTerritoryLoading: (loading: boolean) => void;
  setTerritoryError: (error: string | null) => void;

  // Health actions
  setHealth: (score: number, status: 'healthy' | 'warning' | 'critical', indicators: HealthIndicator[], atRisk: AtRiskItem[], alerts: TrendAlert[]) => void;
  setHealthLoading: (loading: boolean) => void;
  setHealthError: (error: string | null) => void;

  // Event handling
  addEvent: (event: AdminEvent) => void;
  clearEvents: () => void;

  // Fetch actions
  fetchPulse: () => Promise<void>;
  fetchTerritory: () => Promise<void>;
  fetchHealth: () => Promise<void>;

  // SSE connection
  connectSSE: () => void;
  disconnectSSE: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

let eventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useCommandStore = create<CommandState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    connectionError: null,
    lastConnectedAt: null,
    activeView: 'pulse',

    pulse: null,
    recentActivity: [],
    pulseLoading: false,
    pulseError: null,

    territoryNodes: [],
    territoryConnections: [],
    territoryClusters: [],
    territoryLoading: false,
    territoryError: null,

    overallHealthScore: 0,
    overallHealthStatus: 'healthy',
    healthIndicators: [],
    atRiskSpaces: [],
    trendAlerts: [],
    healthLoading: false,
    healthError: null,

    eventBuffer: [],
    maxBufferSize: 100,

    // View management
    setActiveView: (view) => set({ activeView: view }),

    // Connection management
    setConnected: (connected, error) => set({
      isConnected: connected,
      connectionError: error || null,
      lastConnectedAt: connected ? new Date().toISOString() : get().lastConnectedAt,
    }),

    // Pulse management
    setPulse: (pulse, activity) => set({
      pulse,
      recentActivity: activity || get().recentActivity,
      pulseError: null,
    }),
    setPulseLoading: (loading) => set({ pulseLoading: loading }),
    setPulseError: (error) => set({ pulseError: error }),

    // Territory management
    setTerritory: (nodes, connections, clusters) => set({
      territoryNodes: nodes,
      territoryConnections: connections,
      territoryClusters: clusters,
      territoryError: null,
    }),
    setTerritoryLoading: (loading) => set({ territoryLoading: loading }),
    setTerritoryError: (error) => set({ territoryError: error }),

    // Health management
    setHealth: (score, status, indicators, atRisk, alerts) => set({
      overallHealthScore: score,
      overallHealthStatus: status,
      healthIndicators: indicators,
      atRiskSpaces: atRisk,
      trendAlerts: alerts,
      healthError: null,
    }),
    setHealthLoading: (loading) => set({ healthLoading: loading }),
    setHealthError: (error) => set({ healthError: error }),

    // Event buffer management
    addEvent: (event) => {
      const { eventBuffer, maxBufferSize, setPulse, pulse } = get();

      // Add to buffer
      const newBuffer = [event, ...eventBuffer].slice(0, maxBufferSize);
      set({ eventBuffer: newBuffer });

      // Update pulse metrics if it's a metric_update event
      if (event.type === 'metric_update' && event.data.usersToday !== undefined) {
        const data = event.data as Record<string, number | string>;
        if (pulse) {
          setPulse({
            ...pulse,
            postsToday: data.postsToday as number || pulse.postsToday,
            reportsPending: data.pendingReports as number || pulse.reportsPending,
            toolsPending: data.pendingTools as number || pulse.toolsPending,
            updatedAt: event.timestamp,
          });
        }
      }

      // Add activity for non-metric events
      if (event.type !== 'metric_update') {
        const activity: RecentActivity = {
          id: `${event.type}-${Date.now()}`,
          type: event.type as RecentActivity['type'],
          entityId: event.data.userId as string || event.data.spaceId as string || '',
          entityName: event.data.displayName as string || event.data.name as string || 'Unknown',
          timestamp: event.timestamp,
        };

        set((state) => ({
          recentActivity: [activity, ...state.recentActivity].slice(0, 20),
        }));
      }
    },
    clearEvents: () => set({ eventBuffer: [] }),

    // Fetch pulse data
    fetchPulse: async () => {
      const { setPulseLoading, setPulse, setPulseError } = get();
      setPulseLoading(true);

      try {
        const response = await fetch('/api/admin/command/pulse', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setPulse(result.data.pulse, result.data.recentActivity);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch pulse');
        }
      } catch (error) {
        setPulseError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setPulseLoading(false);
      }
    },

    // Fetch territory data
    fetchTerritory: async () => {
      const { setTerritoryLoading, setTerritory, setTerritoryError } = get();
      setTerritoryLoading(true);

      try {
        const response = await fetch('/api/admin/command/territory?connections=true', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setTerritory(
            result.data.nodes,
            result.data.connections,
            result.data.clusters
          );
        } else {
          throw new Error(result.error?.message || 'Failed to fetch territory');
        }
      } catch (error) {
        setTerritoryError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setTerritoryLoading(false);
      }
    },

    // Fetch health data
    fetchHealth: async () => {
      const { setHealthLoading, setHealth, setHealthError } = get();
      setHealthLoading(true);

      try {
        const response = await fetch('/api/admin/command/health', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setHealth(
            result.data.overallScore,
            result.data.overallStatus,
            result.data.indicators,
            result.data.atRiskSpaces,
            result.data.trendAlerts
          );
        } else {
          throw new Error(result.error?.message || 'Failed to fetch health');
        }
      } catch (error) {
        setHealthError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setHealthLoading(false);
      }
    },

    // SSE connection
    connectSSE: () => {
      const { setConnected, addEvent } = get();

      // Clean up existing connection
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      try {
        eventSource = new EventSource('/api/admin/realtime/stream');

        eventSource.onopen = () => {
          setConnected(true);
          reconnectAttempts = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data: AdminEvent = JSON.parse(event.data);
            addEvent(data);
          } catch (error) {
            console.error('Failed to parse SSE event:', error);
          }
        };

        eventSource.onerror = () => {
          setConnected(false, 'Connection lost');
          eventSource?.close();
          eventSource = null;

          // Exponential backoff reconnection
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              get().connectSSE();
            }, delay);
          } else {
            setConnected(false, 'Max reconnection attempts reached');
          }
        };
      } catch (error) {
        setConnected(false, 'Failed to establish connection');
      }
    },

    disconnectSSE: () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      reconnectAttempts = 0;
      set({ isConnected: false, connectionError: null });
    },
  }))
);

// ============================================================================
// Selectors
// ============================================================================

export const selectPulse = (state: CommandState) => state.pulse;
export const selectRecentActivity = (state: CommandState) => state.recentActivity;
export const selectTerritoryNodes = (state: CommandState) => state.territoryNodes;
export const selectHealthIndicators = (state: CommandState) => state.healthIndicators;
export const selectIsConnected = (state: CommandState) => state.isConnected;
export const selectActiveView = (state: CommandState) => state.activeView;

// Computed selectors
export const selectTotalPendingActions = (state: CommandState) => {
  const pulse = state.pulse;
  if (!pulse) return 0;
  return pulse.reportsPending + pulse.toolsPending + pulse.claimsPending + pulse.appealsPending;
};

export const selectHasAlerts = (state: CommandState) => {
  return state.trendAlerts.length > 0 || state.overallHealthStatus === 'critical';
};
