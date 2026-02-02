"use client";

/**
 * AppSurface - Full-screen app surface for HiveLab tools
 *
 * Renders a deployed tool in full-screen app mode within a Space.
 * Uses the same ToolCanvas as widget mode but with different layout.
 *
 * @version P0 - App Surface Implementation
 */

import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Loader2 = ArrowPathIcon;
import { cn } from "../../lib/utils";
import { ToolCanvas, type ToolElement } from "./tool-canvas";
import type { ToolCapabilities, AppConfig } from "@hive/core";

// ============================================================================
// CAPABILITY CONTEXT
// ============================================================================

/**
 * Context for capability-aware tool rendering.
 * Elements can check capabilities to conditionally render or enable features.
 */
export const CapabilityContext = createContext<ToolCapabilities | null>(null);

export function useCapabilities(): ToolCapabilities | null {
  return useContext(CapabilityContext);
}

// ============================================================================
// TYPES
// ============================================================================

interface DeploymentData {
  id: string;
  toolId: string;
  status: string;
  config: Record<string, unknown>;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles: string[];
  };
  surfaceModes: { widget: boolean; app: boolean };
  primarySurface: "widget" | "app";
  appConfig?: AppConfig;
  capabilities: ToolCapabilities;
  budgets: Record<string, number>;
  capabilityLane: "safe" | "scoped" | "power";
}

interface ToolData {
  id: string;
  name: string;
  description?: string;
  composition?: Record<string, unknown>;
  elements?: ToolElement[];
  version?: string;
}

export interface AppSurfaceProps {
  /** Deployment data from API */
  deployment: DeploymentData;
  /** Tool data from API */
  tool: ToolData;
  /** Granted capabilities for this deployment */
  capabilities: ToolCapabilities;
  /** Layout mode */
  layout: "full" | "centered" | "sidebar";
  /** Additional CSS classes */
  className?: string;
  /** Runtime state from useToolRuntime (or empty if uncontrolled) */
  state?: Record<string, unknown>;
  /** Callback when element state changes */
  onElementChange?: (instanceId: string, data: unknown) => void;
  /** Callback when element triggers an action */
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  /** Space ID for context */
  spaceId?: string;
  /** Whether current user is a space leader */
  isSpaceLeader?: boolean;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  surface: "bg-[var(--hivelab-bg)]",
  loading: "bg-[var(--hivelab-surface)]",
};

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

function FullLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-full overflow-auto">{children}</div>;
}

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full overflow-auto flex justify-center">
      <div className="w-full max-w-4xl py-8 px-4">{children}</div>
    </div>
  );
}

function SidebarLayout({ children }: { children: React.ReactNode }) {
  // For sidebar layout, main content fills most space
  // Sidebar area can be used for related tools/widgets later
  return (
    <div className="w-full h-full overflow-auto grid grid-cols-[1fr_300px] gap-4">
      <div className="overflow-auto">{children}</div>
      <aside className="overflow-auto border-l border-[var(--hivelab-border)] p-4">
        {/* Reserved for sidebar widgets */}
        <div className="text-[var(--hivelab-text-tertiary)] text-sm text-center pt-8">
          Sidebar tools coming soon
        </div>
      </aside>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function AppSurfaceLoading() {
  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center",
        glass.loading,
        "rounded-lg m-4"
      )}
    >
      <div className="flex flex-col items-center gap-3 text-[var(--hivelab-text-tertiary)]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Loading app...</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AppSurface renders a HiveLab tool in full-screen app mode.
 *
 * It wraps the ToolCanvas with:
 * - Capability context for conditional rendering
 * - Layout-specific containers
 * - Error boundaries (via parent)
 */
export function AppSurface({
  deployment,
  tool,
  capabilities,
  layout,
  className,
  state: externalState,
  onElementChange,
  onElementAction,
  spaceId,
  isSpaceLeader = false,
}: AppSurfaceProps) {
  // Get elements from tool data
  const elements = useMemo(() => {
    // Try composition.elements first, then direct elements array
    const compositionElements =
      (tool.composition as { elements?: ToolElement[] })?.elements || [];
    return tool.elements || compositionElements;
  }, [tool.composition, tool.elements]);

  // Use external state if provided, otherwise empty object
  const state = externalState ?? {};

  // Handle element state changes - forward to parent if provided
  const handleElementChange = React.useCallback(
    (instanceId: string, data: unknown) => {
      if (onElementChange) {
        onElementChange(instanceId, data);
      }
    },
    [onElementChange]
  );

  // Handle element actions - forward to parent if provided
  const handleElementAction = React.useCallback(
    (instanceId: string, action: string, payload: unknown) => {
      if (onElementAction) {
        onElementAction(instanceId, action, payload);
      }
    },
    [onElementAction]
  );

  // Layout wrapper based on config
  const LayoutWrapper = useMemo(() => {
    switch (layout) {
      case "centered":
        return CenteredLayout;
      case "sidebar":
        return SidebarLayout;
      case "full":
      default:
        return FullLayout;
    }
  }, [layout]);

  if (elements.length === 0) {
    return <AppSurfaceLoading />;
  }

  return (
    <CapabilityContext.Provider value={capabilities}>
      <div className={cn("flex-1 overflow-hidden", glass.surface, className)}>
        <LayoutWrapper>
          <ToolCanvas
            elements={elements}
            state={state}
            layout="flow"
            onElementChange={handleElementChange}
            onElementAction={handleElementAction}
            context={{
              deploymentId: deployment.id,
              spaceId,
              isSpaceLeader,
            }}
            className="h-full p-4"
          />
        </LayoutWrapper>
      </div>
    </CapabilityContext.Provider>
  );
}
