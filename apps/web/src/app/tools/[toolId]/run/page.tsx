"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Settings, Share, Activity, Zap, CheckCircle2, AlertCircle, Loader2, CloudOff, LogIn } from "lucide-react";
import { ToolCanvas } from "@hive/ui";
import { useToolRuntime } from "@/hooks/use-tool-runtime";
import { cn } from "@/lib/utils";

// ============================================================================
// DESIGN TOKENS (from HIVE design system)
// ============================================================================

const glass = {
  card: "bg-white/[0.03] backdrop-blur-[8px] border border-white/[0.06]",
  header: "bg-gray-950/80 backdrop-blur-[16px] border-b border-white/[0.08]",
};

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

// Motion variants (T2: Standard interactions)
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const scaleOnHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

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
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className={cn("h-3 w-3", !prefersReducedMotion && "animate-spin")} />
        <span>Saving...</span>
      </div>
    );
  }

  if (isSynced) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400">
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
    <div className="flex items-center gap-2 text-xs text-amber-400">
      <motion.div
        className="h-2 w-2 rounded-full bg-amber-400"
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
        "rounded-lg text-gray-400 hover:text-white",
        "bg-transparent hover:bg-white/[0.06]",
        "transition-colors duration-150",
        focusRing,
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// Glass card component
function GlassCard({
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
        "rounded-2xl p-4",
        glass.card,
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
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    error: "bg-red-400",
    info: "bg-sky-400",
    active: "bg-gold-500", // Using gold for "active" instead of purple
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
    deployment,
    state,
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
  });

  // Action logging for debug panel
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

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
    updateState(instanceId, data);
    logAction(instanceId, 'change', data);
  }, [updateState, logAction]);

  // Handle element actions (like button clicks)
  const handleElementAction = useCallback(async (
    instanceId: string,
    action: string,
    payload: unknown
  ) => {
    logAction(instanceId, action, payload);
    const result = await executeAction(action, instanceId, payload as Record<string, unknown>);

    if (result.success) {
      logAction(instanceId, `${action}:success`, result.data);
    } else {
      logAction(instanceId, `${action}:error`, { error: result.error });
    }
  }, [executeAction, logAction]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className={cn(
            "h-8 w-8 text-gold-500 mx-auto mb-4",
            !prefersReducedMotion && "animate-spin"
          )} />
          <p className="text-gray-300 font-medium">Loading tool...</p>
        </motion.div>
      </div>
    );
  }

  // Check if it's an auth error (401)
  const isAuthError = error?.includes('401') || error?.toLowerCase().includes('unauthorized');

  // Error state
  if (error || !tool) {
    // Auth error - show login prompt
    if (isAuthError) {
      const returnUrl = typeof window !== 'undefined'
        ? encodeURIComponent(window.location.pathname + window.location.search)
        : '';

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-gold-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
            <p className="text-gray-400 mb-8">
              You need to be signed in to use this tool. Sign in to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "h-11 px-6 rounded-lg",
                  "bg-white/[0.06] text-white border border-white/[0.08]",
                  "hover:bg-white/[0.1] transition-colors",
                  focusRing
                )}
              >
                Go Back
              </motion.button>
              <motion.button
                onClick={() => router.push(`/auth/login?returnUrl=${returnUrl}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "h-11 px-6 rounded-lg",
                  "bg-gold-500 text-gray-950 font-medium",
                  "hover:bg-gold-400 transition-colors",
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load tool</h2>
          <p className="text-gray-400 mb-8">{error || 'Tool not found'}</p>
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "h-11 px-6 rounded-lg",
              "bg-white/[0.06] text-white border border-white/[0.08]",
              "hover:bg-white/[0.1] transition-colors",
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
    <div className="min-h-screen bg-gray-950">
      {/* Header with glass morphism */}
      <header className={cn("sticky top-0 z-40", glass.header)}>
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
                  "rounded-lg text-gray-400 hover:text-white",
                  "hover:bg-white/[0.04] transition-colors",
                  focusRing
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </motion.button>

              <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

              {/* Tool info */}
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 truncate">
                  {tool.name}
                  {isExecuting && (
                    <Loader2 className={cn(
                      "h-4 w-4 text-gold-500 shrink-0",
                      !prefersReducedMotion && "animate-spin"
                    )} />
                  )}
                </h1>
                <p className="text-sm text-gray-500 truncate hidden sm:block">
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
      <div className="sm:hidden px-4 py-2 border-b border-white/[0.06]">
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
                glass.card
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
                  layout={(toolConfig.layout as 'grid' | 'flow' | 'stack') || 'stack'}
                  onElementChange={handleElementChange}
                  onElementAction={handleElementAction}
                  isLoading={isLoading}
                  error={error}
                />
              ) : (
                <div className="h-full flex items-center justify-center py-16">
                  <motion.div
                    className="text-center max-w-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Zap className="h-8 w-8 text-gold-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      No Elements Configured
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      This tool hasn't been configured with any elements yet.
                    </p>
                    {deployment && (
                      <p className="text-xs text-gray-600 font-mono">
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
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
                Tool Info
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  <span className="text-white capitalize">{tool.status}</span>
                </div>
                {tool.currentVersion && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Version</span>
                    <span className="text-white font-mono text-xs">{tool.currentVersion}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Elements</span>
                  <span className="text-white">{elements.length}</span>
                </div>
                {tool.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Category</span>
                    <span className="text-white capitalize">{tool.category}</span>
                  </div>
                )}
                {typeof toolMetadata.useCount === 'number' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Uses</span>
                    <span className="text-white">{toolMetadata.useCount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Deployment Info */}
            {deployment && (
              <GlassCard>
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
                  Deployment
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span className={cn(
                      "capitalize",
                      deployment.status === 'active' ? 'text-emerald-400' : 'text-gray-400'
                    )}>
                      {deployment.status}
                    </span>
                  </div>
                  {spaceId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Space</span>
                      <button
                        onClick={() => router.push(`/spaces/${spaceId}`)}
                        className={cn(
                          "text-gray-300 hover:text-white underline underline-offset-2",
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
                      <span className="text-gray-500">Usage</span>
                      <span className="text-white">{deployment.usageCount} times</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Runtime Status - NO PURPLE, using semantic colors */}
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
                Runtime
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StatusDot status={!error ? 'success' : 'error'} />
                  <span className="text-sm text-white">
                    {!error ? 'Runtime Active' : 'Runtime Error'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status={isSynced ? 'info' : 'warning'} />
                  <span className="text-sm text-white">
                    {isSynced ? 'State Synced' : 'Pending Sync'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status="active" />
                  <span className="text-sm text-white">Auto-save Enabled</span>
                </div>
              </div>
            </GlassCard>

            {/* Action Log */}
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                Action Log
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {actionLog.length === 0 ? (
                  <div className="text-center py-6">
                    <CloudOff className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      No actions yet
                    </p>
                  </div>
                ) : (
                  actionLog.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs border-l-2 border-gold-500/30 pl-3 py-1"
                    >
                      <div className="text-gray-600">{log.time}</div>
                      <div className="text-white font-mono truncate">
                        {log.instanceId}: {log.action}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* State Debug (dev only) */}
            {process.env.NODE_ENV === 'development' && Object.keys(state).length > 0 && (
              <GlassCard className="border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">
                  State (Dev)
                </h3>
                <pre className="text-xs text-gray-400 overflow-auto max-h-32 font-mono">
                  {JSON.stringify(state, null, 2)}
                </pre>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
