'use client';

/**
 * InlineElementRenderer - Unified renderer for all HiveLab elements in chat
 *
 * Single component data interface, auto-detects mode:
 * - componentId present → inline chat API (/api/spaces/[spaceId]/components)
 * - deploymentId present → deployment API (/api/tools/state)
 *
 * Used by TheaterChatBoard/SpaceChatBoard for messages with type: 'inline_component'
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowPathIcon, ExclamationCircleIcon, BoltIcon } from '@heroicons/react/24/outline';
import { renderElementSafe } from './element-renderers';
import { cn } from '../../lib/utils';
import { springPresets } from '@hive/tokens';
import type { ElementProps } from '../../lib/hivelab/element-system';

// ============================================================================
// INLINE COMPONENT TYPES (from domain entity)
// ============================================================================

/**
 * Participation input for polls, RSVP, etc.
 */
interface ParticipationInput {
  selectedOptions?: string[];
  response?: 'yes' | 'no' | 'maybe';
  data?: Record<string, unknown>;
}

/**
 * Participant record from the server
 */
interface ParticipantRecord {
  userId: string;
  selectedOptions?: string[];
  response?: 'yes' | 'no' | 'maybe';
  data?: Record<string, unknown>;
  participatedAt: string;
}

/**
 * Aggregated state for display
 */
interface SharedState {
  optionCounts?: Record<string, number>;
  rsvpCounts?: { yes: number; no: number; maybe: number };
  totalResponses: number;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isComplete: boolean;
  };
}

/**
 * Component config types
 */
interface PollConfig {
  question: string;
  options: string[];
  allowMultiple: boolean;
  showResults: 'always' | 'after_vote' | 'after_close';
  closesAt?: string;
}

interface CountdownConfig {
  title: string;
  targetDate: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

interface RsvpConfig {
  eventId?: string;
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  allowMaybe: boolean;
}

type ComponentConfig = PollConfig | CountdownConfig | RsvpConfig | Record<string, unknown>;

/**
 * Display state returned from the server
 */
interface ComponentDisplayState {
  componentId: string;
  elementType: string;
  config: ComponentConfig;
  aggregations: SharedState;
  userParticipation?: ParticipantRecord;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  version: number;
}

/**
 * Type guard to check if config is a poll
 */
function isPollConfig(config: ComponentConfig): config is PollConfig {
  return 'question' in config && 'options' in config;
}

/**
 * Type guard to check if config is a countdown
 */
function isCountdownConfig(config: ComponentConfig): config is CountdownConfig {
  return 'targetDate' in config && 'title' in config && !('eventDate' in config);
}

/**
 * Type guard to check if config is an RSVP
 */
function isRsvpConfig(config: ComponentConfig): config is RsvpConfig {
  return 'eventDate' in config && 'eventTitle' in config;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Unified component data for all inline components in chat messages.
 * The renderer auto-detects mode based on which IDs are present:
 * - componentId → inline chat mode (polls, RSVP, countdowns via /slash commands)
 * - deploymentId → deployment mode (deployed HiveLab tools)
 */
export interface ComponentData {
  /** Element type (e.g., 'poll-element', 'countdown-timer', 'rsvp-button') */
  elementType: string;
  /** Inline component ID (for quick tools created in chat) */
  componentId?: string;
  /** Deployment ID for state persistence (for deployed tools) */
  deploymentId?: string;
  /** Tool ID for reference */
  toolId?: string;
  /** Initial/cached state */
  state?: Record<string, unknown>;
  /** Whether the component is active */
  isActive: boolean;
}

/** @deprecated Use ComponentData instead */
export type InlineComponentData = ComponentData;
/** @deprecated Use ComponentData instead */
export type InlineChatComponentData = ComponentData;

/**
 * Props for InlineElementRenderer
 */
export interface InlineElementRendererProps {
  /** Component data from the chat message */
  componentData: ComponentData;
  /** Space ID for context */
  spaceId: string;
  /** Current user ID */
  userId?: string;
  /** Whether user is a space leader */
  isSpaceLeader?: boolean;
  /** Campus ID for filtering (defaults to ub-buffalo) */
  campusId?: string;
  /** Callback when state changes (for optimistic updates) */
  onStateChange?: (newState: Record<string, unknown>) => void;
  /** Callback when action is executed */
  onAction?: (action: string, payload: Record<string, unknown>) => Promise<void>;
  /** Whether component is in compact mode (embedded in message) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// INLINE CHAT MODE COMPONENT (uses useInlineComponentState)
// ============================================================================

/**
 * Internal component for inline chat mode
 * Uses the inline component state hook for real-time poll/RSVP/countdown state
 */
function InlineChatRenderer({
  componentData,
  spaceId,
  userId,
  isSpaceLeader = false,
  campusId,
  onStateChange,
  onAction,
  compact = true,
  className,
}: InlineElementRendererProps) {
  const { componentId, elementType, isActive } = componentData as ComponentData & { componentId: string };

  // State for fetching and submitting
  const [state, setState] = React.useState<ComponentDisplayState | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const previousStateRef = React.useRef<ComponentDisplayState | null>(null);

  // Fetch component state
  const fetchState = React.useCallback(async () => {
    if (!spaceId || !componentId) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/components/${componentId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch component: ${response.status}`);
      }

      const data = await response.json();
      if (data.component) {
        setState(data.component);
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch component';
      setError(message);
    }
  }, [spaceId, componentId]);

  // Initial fetch
  React.useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      await fetchState();
      if (mounted) {
        setIsLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [fetchState]);

  // Polling for real-time updates
  React.useEffect(() => {
    if (!state) return;

    const interval = setInterval(() => {
      fetchState();
    }, 30000); // 30s polling

    return () => clearInterval(interval);
  }, [fetchState, state]);

  // Submit participation (vote, RSVP)
  const submitParticipation = React.useCallback(async (input: ParticipationInput): Promise<boolean> => {
    if (!state || !state.isActive) {
      setError('Component is not active');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    previousStateRef.current = state;

    // Optimistic update for polls
    if (input.selectedOptions && isPollConfig(state.config)) {
      const newCounts = { ...state.aggregations.optionCounts };
      const prevOptions = state.userParticipation?.selectedOptions;

      // Decrement previous
      if (prevOptions) {
        for (const opt of prevOptions) {
          if (newCounts[opt] !== undefined) {
            newCounts[opt] = Math.max(0, newCounts[opt] - 1);
          }
        }
      }

      // Increment new
      for (const opt of input.selectedOptions) {
        if (newCounts[opt] !== undefined) {
          newCounts[opt] = newCounts[opt] + 1;
        }
      }

      setState(prev => prev ? {
        ...prev,
        aggregations: {
          ...prev.aggregations,
          optionCounts: newCounts,
          totalResponses: prevOptions ? prev.aggregations.totalResponses : prev.aggregations.totalResponses + 1,
        },
        userParticipation: {
          userId: userId || 'current-user',
          selectedOptions: input.selectedOptions,
          participatedAt: new Date().toISOString(),
        },
      } : null);
    }

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/components/${componentId}/participate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to submit: ${response.status}`);
      }

      const data = await response.json();
      if (data.component) {
        setState(data.component);
        onStateChange?.(data.component);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit';
      setError(message);
      setState(previousStateRef.current); // Rollback
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, spaceId, componentId, userId, onStateChange]);

  // Handle element onChange - triggers participation
  const handleChange = React.useCallback(
    (data: Record<string, unknown>) => {
      // Map element onChange data to participation input
      if (data.selectedOption && typeof data.selectedOption === 'string') {
        submitParticipation({ selectedOptions: [data.selectedOption] });
      } else if (data.selectedOptions && Array.isArray(data.selectedOptions)) {
        submitParticipation({ selectedOptions: data.selectedOptions });
      } else if (data.response && typeof data.response === 'string') {
        submitParticipation({ response: data.response as 'yes' | 'no' | 'maybe' });
      }
    },
    [submitParticipation]
  );

  // Handle element actions
  const handleAction = React.useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      if (action === 'vote' && payload.choice) {
        await submitParticipation({ selectedOptions: [String(payload.choice)] });
      } else if (action === 'rsvp' && payload.response) {
        await submitParticipation({ response: payload.response as 'yes' | 'no' | 'maybe' });
      }
      await onAction?.(action, payload);
    },
    [submitParticipation, onAction]
  );

  // Build element props from component state
  const elementProps: ElementProps = React.useMemo(() => {
    if (!state) {
      return {
        id: componentId,
        config: {},
        data: {},
        onChange: handleChange,
        onAction: handleAction,
        context: { spaceId, userId, isSpaceLeader, campusId: campusId || 'ub-buffalo' },
      };
    }

    // Map ComponentDisplayState to ElementProps
    // For polls: config has question/options, data has responses/votes/userVote
    const config = state.config as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (isPollConfig(state.config)) {
      // Map aggregations to what PollElement expects
      data.responses = {}; // Simplified - we don't have individual responses
      data.totalVotes = state.aggregations.totalResponses;
      data.userVote = state.userParticipation?.selectedOptions?.[0] || null;
      data.optionCounts = state.aggregations.optionCounts;
    } else if (isRsvpConfig(state.config)) {
      data.rsvpCounts = state.aggregations.rsvpCounts;
      data.totalResponses = state.aggregations.totalResponses;
      data.userResponse = state.userParticipation?.response || null;
    } else if (isCountdownConfig(state.config)) {
      data.timeRemaining = state.aggregations.timeRemaining;
    }

    return {
      id: componentId,
      config,
      data,
      onChange: handleChange,
      onAction: handleAction,
      context: { spaceId, userId, isSpaceLeader, campusId: campusId || 'ub-buffalo' },
    };
  }, [state, componentId, spaceId, userId, isSpaceLeader, campusId, handleChange, handleAction]);

  const prefersReducedMotion = useReducedMotion();

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-lg border border-border/50 bg-muted/30',
          compact ? 'p-4' : 'p-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.div>
          <span>Loading...</span>
        </div>
      </motion.div>
    );
  }

  // Inactive state
  if (!isActive || (state && !state.isActive)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className={cn(
          'rounded-lg border border-dashed border-border/50 bg-muted/20',
          compact ? 'p-4' : 'py-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <motion.div
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
            animate={prefersReducedMotion ? {} : { y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <BoltIcon className="h-5 w-5 text-muted-foreground/50" />
          </motion.div>
          <span className="text-sm text-muted-foreground">This component is no longer active</span>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className={cn(
          'rounded-lg border border-red-500/30 bg-red-500/10',
          compact ? 'p-4' : 'py-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <motion.div
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"
            animate={prefersReducedMotion ? {} : { y: [0, -2, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          </motion.div>
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </motion.div>
    );
  }

  // Render the element
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.snappy}
      className={cn(
        'inline-element-renderer relative',
        compact && 'inline-element-renderer--compact',
        isSubmitting && 'pointer-events-none opacity-75',
        className
      )}
    >
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      {renderElementSafe(elementType, elementProps)}
    </motion.div>
  );
}

// ============================================================================
// DEPLOYMENT MODE COMPONENT (original implementation)
// ============================================================================

/**
 * Internal component for deployment mode
 * Uses tool deployment state API for persisted tool state
 */
function DeploymentRenderer({
  componentData,
  spaceId,
  userId,
  isSpaceLeader = false,
  campusId,
  onStateChange,
  onAction,
  compact = true,
  className,
}: InlineElementRendererProps) {
  const { elementType, deploymentId, state: initialState, isActive } = componentData;

  // Local state management
  const [state, setState] = React.useState<Record<string, unknown>>(initialState || {});
  const [isLoading, setIsLoading] = React.useState(!initialState);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch state if not provided
  React.useEffect(() => {
    const fetchState = async () => {
      if (initialState || !deploymentId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/tools/state/${deploymentId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const fetchedState = data.data?.state || data.state || {};
          setState(fetchedState);
        }
      } catch (_err) {
        // Don't show error - use empty state
      } finally {
        setIsLoading(false);
      }
    };

    void fetchState();
  }, [deploymentId, initialState]);

  // Handle element onChange
  const handleChange = React.useCallback(
    (data: Record<string, unknown>) => {
      const newState = { ...state, ...data };
      setState(newState);
      onStateChange?.(newState);

      // Persist state (debounced in parent or fire-and-forget here)
      if (deploymentId) {
        fetch(`/api/tools/state/${deploymentId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: newState,
            merge: true,
          }),
        }).catch(() => {
          // Silently fail - state will sync on next load
        });
      }
    },
    [state, deploymentId, onStateChange]
  );

  // Handle element actions
  const handleAction = React.useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      if (!deploymentId) return;

      setIsExecuting(true);
      try {
        // Execute via tool execution API
        const response = await fetch('/api/tools/execute', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deploymentId,
            action,
            data: payload,
            context: { spaceId },
          }),
        });

        const result = await response.json();
        const resultData = result.data || result;

        if (resultData.state) {
          const newState = { ...state, ...resultData.state };
          setState(newState);
          onStateChange?.(newState);
        }

        // Notify parent
        await onAction?.(action, payload);
      } catch (_err) {
        setError('Action failed');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsExecuting(false);
      }
    },
    [deploymentId, spaceId, state, onAction, onStateChange]
  );

  // Build element props
  const elementProps: ElementProps = {
    id: deploymentId || '',
    config: state.config as Record<string, unknown> || {},
    data: state,
    onChange: handleChange,
    onAction: handleAction,
    context: {
      spaceId,
      userId,
      isSpaceLeader,
      campusId: campusId || 'ub-buffalo',
    },
  };

  const prefersReducedMotion = useReducedMotion();

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-lg border border-border/50 bg-muted/30',
          compact ? 'p-4' : 'p-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <motion.div
            animate={prefersReducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </motion.div>
          <span>Loading...</span>
        </div>
      </motion.div>
    );
  }

  // Inactive state
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className={cn(
          'rounded-lg border border-dashed border-border/50 bg-muted/20',
          compact ? 'p-4' : 'py-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <motion.div
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
            animate={prefersReducedMotion ? {} : { y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <BoltIcon className="h-5 w-5 text-muted-foreground/50" />
          </motion.div>
          <span className="text-sm text-muted-foreground">This app is no longer active</span>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className={cn(
          'rounded-lg border border-red-500/30 bg-red-500/10',
          compact ? 'p-4' : 'py-6',
          className
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <motion.div
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"
            animate={prefersReducedMotion ? {} : { y: [0, -2, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          </motion.div>
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </motion.div>
    );
  }

  // Render the element
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.snappy}
      className={cn(
        'inline-element-renderer relative',
        compact && 'inline-element-renderer--compact',
        isExecuting && 'pointer-events-none opacity-75',
        className
      )}
    >
      {/* Executing overlay */}
      {isExecuting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Actual element */}
      {renderElementSafe(elementType, elementProps)}
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT (routes to appropriate renderer)
// ============================================================================

/**
 * InlineElementRenderer - Renders HiveLab elements inside chat messages
 *
 * Auto-detects mode from componentData:
 * - componentId present → inline chat mode (polls, RSVP, countdowns)
 * - deploymentId present → deployment mode (deployed HiveLab tools)
 */
export function InlineElementRenderer(props: InlineElementRendererProps) {
  if (props.componentData.componentId) {
    return <InlineChatRenderer {...props} />;
  }

  return <DeploymentRenderer {...props} />;
}

export default InlineElementRenderer;
