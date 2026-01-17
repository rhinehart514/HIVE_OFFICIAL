"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  ShareIcon,
  ChartBarIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const ArrowLeft = ArrowLeftIcon;
const Settings = Cog6ToothIcon;
const Share = ShareIcon;
const Activity = ChartBarIcon;
const Zap = BoltIcon;
const CheckCircle2 = CheckCircleIcon;
const AlertCircle = ExclamationCircleIcon;
const Loader2 = ArrowPathIcon;
const CloudOff = CloudIcon;
const LogIn = ArrowLeftOnRectangleIcon;
import { ToolCanvas } from "@hive/ui";
import { useToolRuntime } from "@/hooks/use-tool-runtime";
import { cn } from "@/lib/utils";

// ============================================================================
// DESIGN TOKENS (from HIVE design system)
// Using workshop tokens for HiveLab pages - zero glass, flat surfaces
// ============================================================================

const workshop = {
  card: "workshop-card",
  header: "workshop-header",
};

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-bg)]";

// Motion variants (T2: Standard interactions)
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// Animation variant available for hover effects if needed
// const scaleOnHover = {
//   rest: { scale: 1 },
//   hover: { scale: 1.02, transition: { duration: 0.2 } },
// };

// ============================================================================
// COMPONENTS
// ============================================================================

// Status indicator with semantic colors
function SyncStatus({
  isSynced,
  isSaving,
  lastSaved
}: {
  isSynced: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-xs workshop-text-secondary">
        <Loader2 className={cn("h-3 w-3", !prefersReducedMotion && "animate-spin")} />
        <span>Saving...</span>
      </div>
    );
  }

  if (isSynced) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--status-success)]">
        <CheckCircle2 className="h-3 w-3" />
        <span>
          {lastSaved
            ? `Saved ${lastSaved.toLocaleTimeString()}`
            : 'All changes saved'
          }
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--life-gold)]">
      <motion.div
        className="h-2 w-2 rounded-full bg-[var(--life-gold)]"
        animate={prefersReducedMotion ? {} : { opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span>Unsaved changes</span>
    </div>
  );
}

// Icon button with proper 44px touch target
function IconButton({
  onClick,
  title,
  children,
  className,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        // 44px touch target (h-11 = 44px)
        "h-11 w-11 flex items-center justify-center",
        "rounded-lg workshop-text-secondary hover:workshop-text-primary",
        "bg-transparent hover:bg-[var(--hivelab-surface)]",
        "transition-colors duration-[var(--workshop-duration)]",
        focusRing,
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// Workshop card component (flat, no glass)
function WorkshopCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        workshop.card,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Status dot with semantic colors (NO PURPLE)
function StatusDot({
  status
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'active'
}) {
  const prefersReducedMotion = useReducedMotion();

  const colors = {
    success: "bg-[var(--status-success)]",
    warning: "bg-[var(--status-warning)]",
    error: "bg-[var(--status-error)]",
    info: "bg-sky-400",
    active: "bg-[var(--life-gold)]", // Using gold for "active" instead of purple
  };

  return (
    <motion.div
      className={cn("w-2 h-2 rounded-full", colors[status])}
      animate={prefersReducedMotion ? {} : { opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

// Action log entry type
interface ActionLogEntry {
  time: string;
  instanceId: string;
  action: string;
  data?: unknown;
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ToolRunPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const toolId = params.toolId as string;
  const spaceId = searchParams.get('spaceId') || undefined;
  const deploymentId = searchParams.get('deploymentId') || undefined;

  // Use the runtime hook
  const {
    tool,
    state,
    userState,
    sharedState,
    isLoading,
    isExecuting,
    isSaving,
    isSynced,
    lastSaved,
    error,
    executeAction,
    updateState,
  } = useToolRuntime({
    toolId,
    spaceId,
    deploymentId,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true, // Enable real-time updates for polls, counters, etc.
  });

  // Action logging for debug panel
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

  // Deployment state (must be before any early returns)
  interface ToolDeployment {
    deploymentId?: string;
    status?: string;
    usageCount?: number;
  }
  const [deployment, setDeployment] = useState<ToolDeployment | null>(null);
  const [deploymentLoading, setDeploymentLoading] = useState(false);

  // Fetch deployment info
  useEffect(() => {
    if (!spaceId || !toolId) {
      setDeployment(null);
      return;
    }
    let canceled = false;
    setDeploymentLoading(true);
    fetch(`/api/tools/${toolId}/deploy?spaceId=${encodeURIComponent(spaceId)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.deployment ?? null) as ToolDeployment | null;
      })
      .then((dep) => {
        if (!canceled) setDeployment(dep);
      })
      .catch(() => {
        if (!canceled) setDeployment(null);
      })
      .finally(() => {
        if (!canceled) setDeploymentLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [spaceId, toolId]);

  const logAction = useCallback((instanceId: string, action: string, data?: unknown) => {
    setActionLog(prev => [{
      time: new Date().toLocaleTimeString(),
      instanceId,
      action,
      data,
    }, ...prev.slice(0, 19)]);
  }, []);

  // Handle element state changes
  const handleElementChange = useCallback((instanceId: string, data: unknown) => {
    updateState({ [instanceId]: data });
    logAction(instanceId, 'change', data);
  }, [updateState, logAction]);

  // Handle element actions (like button clicks)
  const handleElementAction = useCallback(async (
    instanceId: string,
    action: string,
    payload: unknown
  ) => {
    logAction(instanceId, action, payload);
    const result = await executeAction(instanceId, action, payload as Record<string, unknown>);

    if (result.success) {
      logAction(instanceId, `${action}:success`, result.result ?? result.state);
    } else {
      logAction(instanceId, `${action}:error`, { error: result.error });
    }
  }, [executeAction, logAction]);

  // Loading state
  if (isLoading) {
    return (
      <div className="workshop min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className={cn(
            "h-8 w-8 text-[var(--life-gold)] mx-auto mb-4",
            !prefersReducedMotion && "animate-spin"
          )} />
          <p className="workshop-text-secondary font-medium">Loading tool...</p>
        </motion.div>
      </div>
    );
  }

  const errorMessage = error instanceof Error ? error.message : (error ? String(error) : "");
  // Check if it's an auth error (401)
  const isAuthError = errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized');

  const isConnected = !deploymentLoading;

  // Error state
  if (error || !tool) {
    // Auth error - show login prompt
    if (isAuthError) {
      const returnUrl = typeof window !== 'undefined'
        ? encodeURIComponent(window.location.pathname + window.location.search)
        : '';

      return (
        <div className="workshop min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--life-gold)]/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-[var(--life-gold)]" />
            </div>
            <h2 className="text-xl font-semibold workshop-text-primary mb-2">Sign in required</h2>
            <p className="workshop-text-secondary mb-8">
              You need to be signed in to use this tool. Sign in to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "workshop-btn",
                  focusRing
                )}
              >
                Go Back
              </motion.button>
              <motion.button
                onClick={() => router.push(`/enter?redirect=${returnUrl}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "workshop-btn workshop-btn-primary",
                  focusRing
                )}
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    // Other errors
    return (
      <div className="workshop min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--status-error)]/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-[var(--status-error)]" />
          </div>
          <h2 className="text-xl font-semibold workshop-text-primary mb-2">Failed to load tool</h2>
          <p className="workshop-text-secondary mb-8">{errorMessage || 'Tool not found'}</p>
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "workshop-btn",
              focusRing
            )}
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Get elements from tool definition
  const elements = tool.elements || [];
  const toolConfig = tool.config || {};
  const toolMetadata = tool.metadata || {};

  return (
    <div className="workshop min-h-screen">
      {/* Header */}
      <header className={cn("sticky top-0 z-40", workshop.header)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center gap-3">
              {/* Back button - 44px touch target */}
              <motion.button
                onClick={() => router.back()}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "h-11 px-3 flex items-center gap-2",
                  "rounded-lg workshop-text-secondary hover:workshop-text-primary",
                  "hover:bg-[var(--hivelab-surface)] transition-colors",
                  focusRing
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </motion.button>

              <div className="h-6 w-px bg-[var(--hivelab-border)] hidden sm:block" />

              {/* Tool info */}
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold workshop-text-primary flex items-center gap-2 truncate">
                  {tool.name}
                  {isExecuting && (
                    <Loader2 className={cn(
                      "h-4 w-4 text-[var(--life-gold)] shrink-0",
                      !prefersReducedMotion && "animate-spin"
                    )} />
                  )}
                </h1>
                <p className="text-sm workshop-text-tertiary truncate hidden sm:block">
                  {tool.description || 'Interactive tool'}
                  {tool.currentVersion && ` · v${tool.currentVersion}`}
                </p>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <SyncStatus
                  isSynced={isSynced}
                  isSaving={isSaving}
                  lastSaved={lastSaved}
                />
              </div>

              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => router.push(`/tools/${toolId}`)}
                  title="Tool settings"
                >
                  <Settings className="h-5 w-5" />
                </IconButton>

                <IconButton title="Share tool">
                  <Share className="h-5 w-5" />
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sync status */}
      <div className="sm:hidden px-4 py-2 border-b border-[var(--hivelab-border)]">
        <SyncStatus isSynced={isSynced} isSaving={isSaving} lastSaved={lastSaved} />
      </div>

      {/* Main content */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Tool Canvas */}
          <motion.div
            className="lg:col-span-3"
            variants={fadeInUp}
          >
            <div
              className={cn(
                "rounded-2xl p-4 sm:p-6 min-h-[400px] sm:min-h-[600px]",
                workshop.card
              )}
              style={{
                backgroundColor: typeof toolConfig.backgroundColor === 'string'
                  ? toolConfig.backgroundColor
                  : undefined,
              }}
            >
              {elements.length > 0 ? (
                <ToolCanvas
                  elements={elements}
                  state={state}
                  sharedState={sharedState}
                  userState={userState}
                  layout={(toolConfig.layout as 'grid' | 'flow' | 'stack') || 'stack'}
                  onElementChange={handleElementChange}
                  onElementAction={handleElementAction}
                  isLoading={isLoading}
                  error={errorMessage || null}
                  context={{
                    spaceId,
                    deploymentId,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center py-16">
                  <motion.div
                    className="text-center max-w-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 bg-[var(--life-gold)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Zap className="h-8 w-8 text-[var(--life-gold)]" />
                    </div>
                    <h3 className="text-lg font-semibold workshop-text-primary mb-2">
                      No Elements Configured
                    </h3>
                    <p className="workshop-text-secondary text-sm mb-4">
                      This tool hasn't been configured with any elements yet.
                    </p>
                    {deployment && (
                      <p className="text-xs workshop-text-tertiary font-mono">
                        {deployment.deploymentId}
                      </p>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Side Panel */}
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
          >
            {/* Tool Info */}
            <WorkshopCard>
              <h3 className="workshop-label mb-3">
                Tool Info
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="workshop-text-tertiary">Status</span>
                  <span className="workshop-text-primary capitalize">{tool.status}</span>
                </div>
                {tool.currentVersion && (
                  <div className="flex justify-between items-center">
                    <span className="workshop-text-tertiary">Version</span>
                    <span className="workshop-text-primary font-mono text-xs">{tool.currentVersion}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="workshop-text-tertiary">Elements</span>
                  <span className="workshop-text-primary">{elements.length}</span>
                </div>
                {tool.category && (
                  <div className="flex justify-between items-center">
                    <span className="workshop-text-tertiary">Category</span>
                    <span className="workshop-text-primary capitalize">{tool.category}</span>
                  </div>
                )}
                {typeof toolMetadata.useCount === 'number' && (
                  <div className="flex justify-between items-center">
                    <span className="workshop-text-tertiary">Uses</span>
                    <span className="workshop-text-primary">{toolMetadata.useCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </WorkshopCard>

            {/* Deployment Info */}
            {deployment && (
              <WorkshopCard>
                <h3 className="workshop-label mb-3">
                  Deployment
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="workshop-text-tertiary">Status</span>
                    <span className={cn(
                      "capitalize",
                      deployment.status === 'active' ? 'text-[var(--status-success)]' : 'workshop-text-secondary'
                    )}>
                      {deployment.status}
                    </span>
                  </div>
                  {spaceId && (
                    <div className="flex justify-between items-center">
                      <span className="workshop-text-tertiary">Space</span>
                      <button
                        onClick={() => router.push(`/spaces/${spaceId}`)}
                        className={cn(
                          "workshop-text-secondary hover:workshop-text-primary underline underline-offset-2",
                          "transition-colors",
                          focusRing
                        )}
                      >
                        View Space
                      </button>
                    </div>
                  )}
                  {typeof deployment.usageCount === 'number' && (
                    <div className="flex justify-between items-center">
                      <span className="workshop-text-tertiary">Usage</span>
                      <span className="workshop-text-primary">{deployment.usageCount} times</span>
                    </div>
                  )}
                </div>
              </WorkshopCard>
            )}

            {/* Runtime Status - NO PURPLE, using semantic colors */}
            <WorkshopCard>
              <h3 className="workshop-label mb-3">
                Runtime
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StatusDot status={!error ? 'success' : 'error'} />
                  <span className="text-sm workshop-text-primary">
                    {!error ? 'Runtime Active' : 'Runtime Error'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status={isConnected ? 'success' : 'warning'} />
                  <span className="text-sm workshop-text-primary">
                    {isConnected ? 'Real-time Connected' : 'Connecting...'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status={isSynced ? 'info' : 'warning'} />
                  <span className="text-sm workshop-text-primary">
                    {isSynced ? 'State Synced' : 'Pending Sync'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status="active" />
                  <span className="text-sm workshop-text-primary">Auto-save Enabled</span>
                </div>
              </div>
            </WorkshopCard>

            {/* Action Log */}
            <WorkshopCard>
              <h3 className="workshop-label mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 workshop-text-tertiary" />
                Action Log
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {actionLog.length === 0 ? (
                  <div className="text-center py-6">
                    <CloudOff className="h-6 w-6 workshop-text-tertiary mx-auto mb-2" />
                    <p className="text-xs workshop-text-tertiary">
                      No actions yet
                    </p>
                  </div>
                ) : (
                  actionLog.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs border-l-2 border-[var(--life-gold)]/30 pl-3 py-1"
                    >
                      <div className="workshop-text-tertiary">{log.time}</div>
                      <div className="workshop-text-primary font-mono truncate">
                        {log.instanceId}: {log.action}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </WorkshopCard>

            {/* State Debug (dev only) */}
            {process.env.NODE_ENV === 'development' && Object.keys(state).length > 0 && (
              <WorkshopCard className="border-[var(--life-gold)]/20">
                <h3 className="workshop-label text-[var(--life-gold)] mb-3">
                  State (Dev)
                </h3>
                <pre className="text-xs workshop-text-secondary overflow-auto max-h-32 font-mono">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </WorkshopCard>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
